"""All /api/tasks/* endpoints — matches existing Next.js API contract."""

from __future__ import annotations

import asyncio
import io
import zipfile

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.database import OUTPUT_DIR
from app.schemas import (
    CreateBatchResponse,
    CreateSingleResponse,
    CreateTaskRequest,
    TaskGroupOut,
    TaskOut,
)
from app.services.task_runner import run_batch, run_task
from app.services.task_store import (
    create_batch,
    create_task,
    get_task,
    get_tasks_by_group,
    list_task_groups,
)

router = APIRouter(prefix="/api/tasks")


# POST /api/tasks — create single or batch
@router.post("")
async def create_tasks(body: CreateTaskRequest):
    if not body.prompt or not body.prompt.strip():
        raise HTTPException(400, "缺少模板或提示词。")
    if body.template not in ("amazon", "detail", "poster"):
        raise HTTPException(400, "无效的模板类型。")
    if body.count < 1 or body.count > 4:
        raise HTTPException(400, "数量必须在 1 到 4 之间。")

    prompt = body.prompt.strip()

    if body.count == 1:
        task = await create_task(body.template, prompt)
        asyncio.create_task(run_task(task.id))
        return CreateSingleResponse(task_id=task.id, status=task.status).model_dump(by_alias=True)

    tasks = await create_batch(body.template, prompt, body.count, body.note)
    asyncio.create_task(run_batch([t.id for t in tasks]))
    return CreateBatchResponse(
        group_id=tasks[0].group_id, task_id=tasks[0].id, count=len(tasks),
    ).model_dump(by_alias=True)


# GET /api/tasks — list task groups
@router.get("")
async def list_groups():
    groups = await list_task_groups(50)
    return [g.model_dump(by_alias=True) for g in groups]


# GET /api/tasks/group/{groupId}  — must be before /{task_id}
@router.get("/group/{group_id}")
async def get_group_tasks(group_id: str):
    tasks = await get_tasks_by_group(group_id)
    if not tasks:
        raise HTTPException(404, "任务批次不存在。")
    return [t.model_dump(by_alias=True) for t in tasks]


# GET /api/tasks/groups/{groupId}/download  — must be before /{task_id}
@router.get("/groups/{group_id}/download")
async def download_group_zip(group_id: str):
    tasks = await get_tasks_by_group(group_id)
    succeeded = [t for t in tasks if t.status == "succeeded" and t.result_url]

    if not succeeded:
        raise HTTPException(404, "没有可下载的图片。")

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=5) as zf:
        for t in succeeded:
            file_path = OUTPUT_DIR / f"{t.id}.png"
            if file_path.exists():
                zf.write(file_path, f"{t.id}.png")

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="tujing-{group_id}.zip"'},
    )


# GET /api/tasks/{taskId}  — dynamic, must come after all static prefixes
@router.get("/{task_id}")
async def get_single_task(task_id: str):
    task = await get_task(task_id)
    if not task:
        raise HTTPException(404, "任务不存在。")
    return task.model_dump(by_alias=True)


# POST /api/tasks/{taskId}/regenerate
@router.post("/{task_id}/regenerate")
async def regenerate_task(task_id: str):
    source = await get_task(task_id)
    if not source:
        raise HTTPException(404, "原任务不存在。")

    group_id = source.group_id or source.id
    group_tasks = await get_tasks_by_group(group_id)
    count = len(group_tasks)

    if count <= 1:
        task = await create_task(source.template, source.prompt)
        asyncio.create_task(run_task(task.id))
        return CreateSingleResponse(task_id=task.id, status=task.status).model_dump(by_alias=True)

    note = next((t.note for t in group_tasks if t.note), None)
    tasks = await create_batch(source.template, source.prompt, count, note)
    asyncio.create_task(run_batch([t.id for t in tasks]))
    return CreateBatchResponse(
        group_id=tasks[0].group_id, task_id=tasks[0].id, count=len(tasks),
    ).model_dump(by_alias=True)

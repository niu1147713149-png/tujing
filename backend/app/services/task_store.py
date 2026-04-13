"""Task CRUD operations — ported from lib/task-store.ts."""

from __future__ import annotations

import random
import re
import time
from datetime import datetime, timezone

from sqlalchemy import select, update

from app.database import async_session
from app.models import Task
from app.schemas import TaskGroupOut, TaskOut


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_task_id() -> str:
    ts = int(time.time() * 1000)
    rand = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=8))
    return f"task_{ts}_{rand}"


def _create_group_id() -> str:
    ts = int(time.time() * 1000)
    rand = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=6))
    return f"grp_{ts}_{rand}"


# --- text normalization (ported from TS) ---

def _looks_corrupted(value: str) -> bool:
    if not value:
        return False
    if "\ufffd" in value:
        return True
    mojibake = len(re.findall(r"[ÃÂÐÑØæçèéêëîïðñòóôöùúäå]", value))
    cjk = len(re.findall(r"[\u4e00-\u9fff]", value))
    return mojibake >= 4 and cjk == 0


def _normalize_text(value: str | None, fallback: str) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    return fallback if _looks_corrupted(trimmed) else trimmed


def _to_task_out(t: Task) -> TaskOut:
    return TaskOut(
        id=t.id,
        group_id=t.group_id or t.id,
        template=t.template,
        prompt=_normalize_text(t.prompt, "历史提示词存在编码问题，请重新填写。") or "历史提示词存在编码问题，请重新填写。",
        note=_normalize_text(t.note, "历史备注存在编码问题。"),
        status=t.status,
        result_url=t.result_url,
        error_message=_normalize_text(t.error_message, "历史错误信息存在编码问题。"),
        request_id=t.request_id,
        provider_model=t.provider_model,
        created_at=t.created_at,
        updated_at=t.updated_at,
    )


async def create_task(template: str, prompt: str) -> TaskOut:
    now = _now_iso()
    task = Task(
        id=_create_task_id(), group_id=_create_group_id(), template=template,
        prompt=prompt, status="queued", created_at=now, updated_at=now,
    )
    async with async_session() as session:
        session.add(task)
        await session.commit()
    return _to_task_out(task)


async def create_batch(template: str, prompt: str, count: int, note: str | None = None) -> list[TaskOut]:
    if count < 2 or count > 4:
        raise ValueError("批量生成数量必须在 2 到 4 张之间。")
    now = _now_iso()
    group_id = _create_group_id()
    clean_note = note.strip() if note and note.strip() else None
    tasks: list[Task] = []
    for _ in range(count):
        tasks.append(Task(
            id=_create_task_id(), group_id=group_id, template=template,
            prompt=prompt, note=clean_note,
            status="queued", created_at=now, updated_at=now,
        ))
    async with async_session() as session:
        session.add_all(tasks)
        await session.commit()
    return [_to_task_out(t) for t in tasks]


async def get_task(task_id: str) -> TaskOut | None:
    async with async_session() as session:
        result = await session.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
    return _to_task_out(task) if task else None


async def get_tasks_by_group(group_id: str) -> list[TaskOut]:
    async with async_session() as session:
        result = await session.execute(
            select(Task).where(Task.group_id == group_id).order_by(Task.created_at.asc(), Task.id.asc())
        )
        tasks = result.scalars().all()
    return [_to_task_out(t) for t in tasks]


async def list_task_groups(limit: int = 50) -> list[TaskGroupOut]:
    async with async_session() as session:
        result = await session.execute(select(Task).order_by(Task.created_at.desc()))
        all_tasks = result.scalars().all()

    groups: dict[str, dict] = {}
    for t in all_tasks:
        tout = _to_task_out(t)
        gid = tout.group_id
        if gid not in groups:
            groups[gid] = {"group_id": gid, "tasks": [], "note": None, "created_at": tout.created_at}
        g = groups[gid]
        g["tasks"].append(tout)
        if tout.note:
            g["note"] = tout.note
        if tout.created_at > g["created_at"]:
            g["created_at"] = tout.created_at

    sorted_groups = sorted(groups.values(), key=lambda g: g["created_at"], reverse=True)[:limit]
    return [TaskGroupOut(**g) for g in sorted_groups]


async def update_task(task_id: str, **patch: object) -> TaskOut | None:
    patch["updated_at"] = _now_iso()
    async with async_session() as session:
        result = await session.execute(select(Task).where(Task.id == task_id))
        task = result.scalar_one_or_none()
        if not task:
            return None
        for key, value in patch.items():
            if hasattr(task, key):
                setattr(task, key, value)
        await session.commit()
        await session.refresh(task)
    return _to_task_out(task)


async def reset_stuck_tasks() -> int:
    """Reset tasks stuck in 'processing' back to 'queued' on startup."""
    async with async_session() as session:
        result = await session.execute(
            update(Task).where(Task.status == "processing").values(status="queued", updated_at=_now_iso())
        )
        await session.commit()
        return result.rowcount  # type: ignore[return-value]

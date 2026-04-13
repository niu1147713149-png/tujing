"""Background task execution — ported from lib/task-runner.ts."""

from __future__ import annotations

import asyncio
import logging
import random
import time

from app.services.gemini import generate_image_for_task
from app.services.image_store import save_result_image
from app.services.task_store import get_task, update_task

logger = logging.getLogger(__name__)

_active_runs: set[str] = set()
_semaphore = asyncio.Semaphore(2)


def _make_request_id() -> str:
    return f"{int(time.time() * 1000)}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))}"


async def run_task(task_id: str) -> None:
    if task_id in _active_runs:
        return
    _active_runs.add(task_id)

    try:
        async with _semaphore:
            task = await get_task(task_id)
            if not task or task.status in ("processing", "succeeded"):
                return

            request_id = _make_request_id()
            await update_task(task_id, status="processing", error_message=None, request_id=request_id)

            try:
                generated = await generate_image_for_task(task.template, task.prompt, request_id)
                result_url = await save_result_image(task_id, generated["resultUrl"])
                await update_task(
                    task_id, status="succeeded", result_url=result_url,
                    request_id=request_id, provider_model=generated["meta"]["modelId"],
                    error_message=None,
                )
            except Exception as exc:
                await update_task(
                    task_id, status="failed", request_id=request_id,
                    error_message=str(exc) if str(exc) else "生成失败，请稍后重试。",
                )
    finally:
        _active_runs.discard(task_id)


async def run_batch(task_ids: list[str]) -> None:
    """Run tasks sequentially to avoid overwhelming Gemini."""
    for task_id in task_ids:
        await run_task(task_id)

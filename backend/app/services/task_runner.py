"""Background execution for queued generation tasks."""

from __future__ import annotations

import asyncio
import logging
import random
import time

from app.config import load_ai_config
from app.services.gemini import generate_image_for_task
from app.services.image_store import save_result_image
from app.services.task_store import get_task, list_pending_task_ids, update_task

logger = logging.getLogger(__name__)

_active_runs: set[str] = set()
_semaphore = asyncio.Semaphore(2)
_DEFAULT_BATCH_TASK_DELAY_SECONDS = 5.0


def _make_request_id() -> str:
    return f"{int(time.time() * 1000)}-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz0123456789', k=6))}"


def _get_batch_task_delay_seconds() -> float:
    try:
        return load_ai_config().batch_task_delay_seconds
    except RuntimeError as exc:
        logger.warning(
            "read batchTaskDelaySeconds failed: %s, fallback to %.1fs",
            exc,
            _DEFAULT_BATCH_TASK_DELAY_SECONDS,
        )
        return _DEFAULT_BATCH_TASK_DELAY_SECONDS


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
                generated = await generate_image_for_task(
                    task.template,
                    task.prompt,
                    request_id,
                    model_id=task.provider_model,
                )
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
    delay_seconds = _get_batch_task_delay_seconds()
    total = len(task_ids)
    for index, task_id in enumerate(task_ids):
        await run_task(task_id)
        has_next = index < total - 1
        if has_next and delay_seconds > 0:
            logger.info(
                "batch cooldown: wait %.1fs before next task (%d/%d complete)",
                delay_seconds,
                index + 1,
                total,
            )
            await asyncio.sleep(delay_seconds)


async def resume_pending_tasks() -> None:
    task_ids = await list_pending_task_ids()
    if not task_ids:
        return

    logger.info("startup resume: found %d unfinished tasks", len(task_ids))
    await run_batch(task_ids)

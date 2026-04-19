from __future__ import annotations

import random
import time
from datetime import datetime, timezone

from sqlalchemy import select

from app.database import async_session
from app.models import Order, Task
from app.schemas import OrderOut, TaskOut
from app.services.image_store import delete_result_image


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_order_id() -> str:
    ts = int(time.time() * 1000)
    rand = "".join(random.choices("abcdefghijklmnopqrstuvwxyz0123456789", k=6))
    return f"ord_{ts}_{rand}"


def _to_order_out(order: Order, tasks: list[Task]) -> OrderOut:
    latest_task = max(tasks, key=lambda item: item.created_at, default=None)
    succeeded_count = sum(1 for task in tasks if task.status == "succeeded")
    failed_count = sum(1 for task in tasks if task.status == "failed")
    preview_tasks = sorted(tasks, key=lambda item: item.created_at, reverse=True)[:4]
    return OrderOut(
        id=order.id,
        note=order.note,
        created_at=order.created_at,
        updated_at=order.updated_at,
        latest_task_id=latest_task.id if latest_task else None,
        preview_tasks=[TaskOut.model_validate({
            "id": task.id,
            "group_id": task.group_id,
            "order_id": task.order_id,
            "template": task.template,
            "prompt": task.prompt,
            "note": task.note,
            "status": task.status,
            "result_url": task.result_url,
            "error_message": task.error_message,
            "request_id": task.request_id,
            "provider_model": task.provider_model,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
        }).model_copy(deep=True) for task in preview_tasks],
        task_count=len(tasks),
        succeeded_count=succeeded_count,
        failed_count=failed_count,
    )


async def create_order(note: str) -> OrderOut:
    clean_note = note.strip()
    if not clean_note:
        raise ValueError("订单备注不能为空。")

    now = _now_iso()
    order = Order(
        id=_create_order_id(),
        note=clean_note,
        created_at=now,
        updated_at=now,
    )
    async with async_session() as session:
        session.add(order)
        await session.commit()
    return _to_order_out(order, [])


async def get_order(order_id: str) -> OrderOut | None:
    async with async_session() as session:
        order_result = await session.execute(select(Order).where(Order.id == order_id))
        order = order_result.scalar_one_or_none()
        if not order:
            return None
        task_result = await session.execute(
            select(Task).where(Task.order_id == order_id).order_by(Task.created_at.desc())
        )
        tasks = task_result.scalars().all()
    return _to_order_out(order, tasks)


async def list_orders(limit: int = 50) -> list[OrderOut]:
    async with async_session() as session:
        order_result = await session.execute(select(Order).order_by(Order.created_at.desc()))
        orders = order_result.scalars().all()
        task_result = await session.execute(
            select(Task).where(Task.order_id.is_not(None)).order_by(Task.created_at.desc())
        )
        tasks = task_result.scalars().all()

    task_map: dict[str, list[Task]] = {}
    for task in tasks:
        if not task.order_id:
            continue
        task_map.setdefault(task.order_id, []).append(task)

    return [_to_order_out(order, task_map.get(order.id, [])) for order in orders[:limit]]


async def get_order_tasks(order_id: str) -> list[Task]:
    async with async_session() as session:
        task_result = await session.execute(
            select(Task).where(Task.order_id == order_id).order_by(Task.created_at.desc(), Task.id.desc())
        )
        return task_result.scalars().all()


async def delete_order(order_id: str) -> bool:
    async with async_session() as session:
        order_result = await session.execute(select(Order).where(Order.id == order_id))
        order = order_result.scalar_one_or_none()
        if not order:
            return False

        task_result = await session.execute(select(Task).where(Task.order_id == order_id))
        tasks = task_result.scalars().all()

        for task in tasks:
            await delete_result_image(task.id)
            await session.delete(task)

        await session.delete(order)
        await session.commit()

    return True

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import CreateOrderRequest, TaskOut
from app.services.order_store import create_order, delete_order, get_order, get_order_tasks, list_orders

router = APIRouter(prefix="/api/orders")


@router.post("")
async def create_order_route(body: CreateOrderRequest):
    try:
        order = await create_order(body.note)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return order.model_dump(by_alias=True)


@router.get("")
async def list_orders_route():
    orders = await list_orders(50)
    return [order.model_dump(by_alias=True) for order in orders]


@router.get("/{order_id}")
async def get_order_route(order_id: str):
    order = await get_order(order_id)
    if not order:
        raise HTTPException(404, "订单不存在。")
    return order.model_dump(by_alias=True)


@router.post("/{order_id}")
async def delete_order_legacy_post_route(order_id: str):
    deleted = await delete_order(order_id)
    if not deleted:
        raise HTTPException(404, "订单不存在。")
    return {"ok": True}


@router.get("/{order_id}/tasks")
async def get_order_tasks_route(order_id: str):
    order = await get_order(order_id)
    if not order:
        raise HTTPException(404, "订单不存在。")
    tasks = await get_order_tasks(order_id)
    return [TaskOut.model_validate({
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
    }).model_dump(by_alias=True) for task in tasks]


@router.delete("/{order_id}")
async def delete_order_route(order_id: str):
    deleted = await delete_order(order_id)
    if not deleted:
        raise HTTPException(404, "订单不存在。")
    return {"ok": True}


@router.post("/{order_id}/delete")
async def delete_order_post_route(order_id: str):
    deleted = await delete_order(order_id)
    if not deleted:
        raise HTTPException(404, "订单不存在。")
    return {"ok": True}

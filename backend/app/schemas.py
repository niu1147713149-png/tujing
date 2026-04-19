from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class TaskOut(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    id: str
    group_id: str
    order_id: str | None = None
    template: str
    prompt: str
    note: str | None = None
    status: str
    result_url: str | None = None
    error_message: str | None = None
    request_id: str | None = None
    provider_model: str | None = None
    created_at: str
    updated_at: str


class TaskGroupOut(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    group_id: str
    tasks: list[TaskOut]
    note: str | None = None
    created_at: str


class CreateTaskRequest(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    template: str
    prompt: str
    count: int = 1
    note: str | None = None
    order_id: str
    model_id: str | None = None


class CreateOrderRequest(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    note: str = Field(min_length=1)


class ModelOut(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    id: str
    name: str


class ModelsResponse(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    models: list[ModelOut]
    default_model: str


class OrderOut(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    id: str
    note: str
    created_at: str
    updated_at: str
    latest_task_id: str | None = None
    preview_tasks: list[TaskOut] = Field(default_factory=list)
    task_count: int = 0
    succeeded_count: int = 0
    failed_count: int = 0


class CreateSingleResponse(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    task_id: str
    status: str


class CreateBatchResponse(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    group_id: str
    task_id: str
    count: int

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(w.capitalize() for w in parts[1:])


class TaskOut(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    id: str
    group_id: str
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
    template: str
    prompt: str
    count: int = 1
    note: str | None = None


class CreateSingleResponse(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    task_id: str
    status: str


class CreateBatchResponse(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True)

    group_id: str
    task_id: str
    count: int

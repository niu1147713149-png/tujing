from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import OUTPUT_DIR, init_db
from app.routers import orders, tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Reset and resume unfinished tasks on startup.
    from app.services.task_store import reset_stuck_tasks
    from app.services.task_runner import resume_pending_tasks

    await reset_stuck_tasks()
    app.state.resume_pending_tasks_job = asyncio.create_task(resume_pending_tasks())
    try:
        yield
    finally:
        resume_job = getattr(app.state, "resume_pending_tasks_job", None)
        if resume_job and not resume_job.done():
            resume_job.cancel()
            with suppress(asyncio.CancelledError):
                await resume_job


app = FastAPI(title="图鲸 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(orders.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Serve generated images
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

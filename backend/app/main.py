from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import OUTPUT_DIR, init_db
from app.routers import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Reset any stuck "processing" tasks on startup
    from app.services.task_store import reset_stuck_tasks
    await reset_stuck_tasks()
    yield


app = FastAPI(title="图鲸 API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Serve generated images
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=str(OUTPUT_DIR)), name="outputs")

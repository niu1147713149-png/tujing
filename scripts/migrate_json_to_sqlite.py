"""Migrate data/tasks.json → SQLite database.

Usage:
    python scripts/migrate_json_to_sqlite.py
"""

from __future__ import annotations

import json
import re
import shutil
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JSON_FILE = ROOT / "data" / "tasks.json"
OLD_OUTPUTS = ROOT / "public" / "outputs"
DB_PATH = ROOT / "backend" / "data" / "tujing.db"
NEW_OUTPUTS = ROOT / "backend" / "data" / "outputs"


def _looks_corrupted(value: str) -> bool:
    if not value:
        return False
    if "\ufffd" in value:
        return True
    mojibake = len(re.findall(r"[ÃÂÐÑØæçèéêëîïðñòóôöùúäå]", value))
    cjk = len(re.findall(r"[\u4e00-\u9fff]", value))
    return mojibake >= 4 and cjk == 0


def _normalize(value: str | None, fallback: str) -> str | None:
    if not value:
        return None
    trimmed = value.strip()
    if not trimmed:
        return None
    return fallback if _looks_corrupted(trimmed) else trimmed


CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS tasks (
    id             TEXT PRIMARY KEY,
    group_id       TEXT NOT NULL,
    template       TEXT NOT NULL,
    prompt         TEXT NOT NULL,
    note           TEXT,
    status         TEXT NOT NULL DEFAULT 'queued',
    result_url     TEXT,
    error_message  TEXT,
    request_id     TEXT,
    provider_model TEXT,
    owner_id       TEXT DEFAULT 'local-default',
    owner_type     TEXT DEFAULT 'local',
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
);
"""

INSERT_SQL = """
INSERT OR IGNORE INTO tasks
    (id, group_id, template, prompt, note, status, result_url, error_message,
     request_id, provider_model, owner_id, owner_type, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
"""


def main() -> None:
    if not JSON_FILE.exists():
        print(f"No JSON file found at {JSON_FILE}, nothing to migrate.")
        return

    raw = JSON_FILE.read_text("utf-8")
    data = json.loads(raw)
    tasks = data.get("tasks", [])
    print(f"Found {len(tasks)} tasks in JSON file.")

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    NEW_OUTPUTS.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(CREATE_TABLE)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_group_id ON tasks(group_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC)")

    migrated = 0
    for t in tasks:
        tid = t.get("id", "")
        if not tid:
            continue
        group_id = t.get("groupId", tid)
        prompt = _normalize(t.get("prompt"), "历史提示词存在编码问题，请重新填写。") or "历史提示词存在编码问题，请重新填写。"
        note = _normalize(t.get("note"), "历史备注存在编码问题。")
        error_msg = _normalize(t.get("errorMessage"), "历史错误信息存在编码问题。")

        conn.execute(INSERT_SQL, (
            tid, group_id, t.get("template", "amazon"), prompt, note,
            t.get("status", "queued"), t.get("resultUrl"), error_msg,
            t.get("requestId"), t.get("providerModel"),
            "local-default", "local",
            t.get("createdAt", ""), t.get("updatedAt", ""),
        ))
        migrated += 1

    conn.commit()
    conn.close()
    print(f"Migrated {migrated} tasks to {DB_PATH}")

    # Copy output images
    if OLD_OUTPUTS.exists():
        copied = 0
        for png in OLD_OUTPUTS.glob("*.png"):
            dest = NEW_OUTPUTS / png.name
            if not dest.exists():
                shutil.copy2(png, dest)
                copied += 1
        print(f"Copied {copied} images to {NEW_OUTPUTS}")


if __name__ == "__main__":
    main()

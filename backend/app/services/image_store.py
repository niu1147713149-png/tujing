"""Save base64 data URL as PNG file."""

from __future__ import annotations

import base64
from pathlib import Path

from app.database import OUTPUT_DIR


async def save_result_image(task_id: str, data_url: str) -> str:
    parts = data_url.split(",", 1)
    if len(parts) != 2 or not parts[0].startswith("data:image/"):
        raise ValueError("模型返回的图片数据格式无效，无法保存结果。")

    image_bytes = base64.b64decode(parts[1])
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    file_path = OUTPUT_DIR / f"{task_id}.png"
    file_path.write_bytes(image_bytes)

    return f"/outputs/{task_id}.png"

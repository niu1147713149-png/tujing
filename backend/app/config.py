from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class AiConfig:
    domain: str
    api_key: str
    model_id: str


_CONFIG_PATH = Path(__file__).resolve().parent.parent.parent / "config" / "ai.config.json"


def _normalize_domain(domain: str) -> str:
    trimmed = domain.strip().rstrip("/")
    if not trimmed:
        return ""
    if trimmed.startswith("http://") or trimmed.startswith("https://"):
        return trimmed
    return f"https://{trimmed}"


def mask_api_key(api_key: str) -> str:
    if len(api_key) <= 8:
        return "已配置"
    return f"{api_key[:4]}****{api_key[-4:]}"


def load_ai_config() -> AiConfig:
    try:
        raw = _CONFIG_PATH.read_text("utf-8")
    except FileNotFoundError:
        raise RuntimeError("未找到 config/ai.config.json，请先创建并填写配置文件。")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise RuntimeError("config/ai.config.json 不是合法 JSON。")

    domain = _normalize_domain(data.get("domain", ""))
    api_key = data.get("apiKey", "").strip()
    model_id = data.get("modelId", "").strip()

    if not domain:
        raise RuntimeError("config/ai.config.json 缺少 domain。")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        raise RuntimeError("config/ai.config.json 缺少有效的 apiKey。")
    if not model_id:
        raise RuntimeError("config/ai.config.json 缺少 modelId。")

    return AiConfig(domain=domain, api_key=api_key, model_id=model_id)

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ModelConfig:
    id: str
    name: str
    domain: str
    api_key: str


@dataclass
class AiConfig:
    models: list[ModelConfig]
    default_model: str
    batch_task_delay_seconds: float = 5.0

    def get_model(self, model_id: str) -> ModelConfig:
        for model in self.models:
            if model.id == model_id:
                return model
        raise RuntimeError(f"未找到模型配置：{model_id}")


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


def _parse_batch_task_delay_seconds(data: dict) -> float:
    raw_value = data.get("batchTaskDelaySeconds", 5)
    try:
        delay_seconds = float(raw_value)
    except (TypeError, ValueError) as exc:
        raise RuntimeError("config/ai.config.json 的 batchTaskDelaySeconds 必须是数字。") from exc

    if delay_seconds < 0:
        raise RuntimeError("config/ai.config.json 的 batchTaskDelaySeconds 不能小于 0。")

    return delay_seconds


def _parse_single_model(data: dict) -> AiConfig:
    domain = _normalize_domain(data.get("domain", ""))
    api_key = data.get("apiKey", "").strip()
    model_id = data.get("modelId", "").strip()

    if not domain:
        raise RuntimeError("config/ai.config.json 缺少 domain。")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY":
        raise RuntimeError("config/ai.config.json 缺少有效的 apiKey。")
    if not model_id:
        raise RuntimeError("config/ai.config.json 缺少 modelId。")

    return AiConfig(
        models=[
            ModelConfig(
                id=model_id,
                name=model_id,
                domain=domain,
                api_key=api_key,
            )
        ],
        default_model=model_id,
        batch_task_delay_seconds=_parse_batch_task_delay_seconds(data),
    )


def _parse_models(data: dict) -> AiConfig:
    raw_models = data.get("models")
    if not isinstance(raw_models, list) or not raw_models:
        raise RuntimeError("config/ai.config.json 缺少 models 配置。")

    models: list[ModelConfig] = []
    seen_ids: set[str] = set()
    for index, raw_model in enumerate(raw_models, start=1):
        if not isinstance(raw_model, dict):
            raise RuntimeError(f"config/ai.config.json 第 {index} 个模型配置无效。")

        model_id = str(raw_model.get("id", "")).strip()
        name = str(raw_model.get("name", "")).strip() or model_id
        domain = _normalize_domain(str(raw_model.get("domain", "")))
        api_key = str(raw_model.get("apiKey", "")).strip()

        if not model_id:
            raise RuntimeError(f"config/ai.config.json 第 {index} 个模型缺少 id。")
        if model_id in seen_ids:
            raise RuntimeError(f"config/ai.config.json 存在重复模型 id：{model_id}")
        if not domain:
            raise RuntimeError(f"config/ai.config.json 模型 {model_id} 缺少 domain。")
        if not api_key or api_key == "YOUR_GEMINI_API_KEY":
            raise RuntimeError(f"config/ai.config.json 模型 {model_id} 缺少有效的 apiKey。")

        seen_ids.add(model_id)
        models.append(
            ModelConfig(
                id=model_id,
                name=name,
                domain=domain,
                api_key=api_key,
            )
        )

    default_model = str(data.get("defaultModel", "")).strip() or models[0].id
    if default_model not in seen_ids:
        raise RuntimeError(f"config/ai.config.json defaultModel 未匹配任何模型：{default_model}")

    return AiConfig(
        models=models,
        default_model=default_model,
        batch_task_delay_seconds=_parse_batch_task_delay_seconds(data),
    )


def load_ai_config() -> AiConfig:
    try:
        raw = _CONFIG_PATH.read_text("utf-8")
    except FileNotFoundError:
        raise RuntimeError("未找到 config/ai.config.json，请先创建并填写配置文件。")

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise RuntimeError("config/ai.config.json 不是合法 JSON。")

    if isinstance(data.get("models"), list):
        return _parse_models(data)
    if "modelId" in data:
        return _parse_single_model(data)

    raise RuntimeError("config/ai.config.json 缺少 models 或旧版 modelId 配置。")

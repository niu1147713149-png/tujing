"""Gemini API integration — ported from lib/gemini.ts."""

from __future__ import annotations

import logging
import time

import httpx

from app.config import load_ai_config, mask_api_key
from app.services.template import build_aspect_ratio, build_prompt

logger = logging.getLogger(__name__)


def _pick_image_part(candidates: list[dict]) -> str:
    for candidate in candidates:
        parts = candidate.get("content", {}).get("parts", [])
        for part in parts:
            inline = part.get("inline_data") or part.get("inlineData") or {}
            mime = inline.get("mime_type") or inline.get("mimeType", "")
            data = inline.get("data", "")
            if mime.startswith("image/") and data:
                return f"data:{mime};base64,{data}"
    return ""


async def _request_gemini(
    client: httpx.AsyncClient,
    model_id: str,
    domain: str,
    api_key: str,
    prompt: str,
    aspect_ratio: str,
    request_id: str,
    attempt: int,
) -> dict:
    started = time.monotonic()
    logger.info("[gemini][%s] request started attempt=%d model=%s", request_id, attempt, model_id)

    url = f"{domain}/v1beta/models/{model_id}:generateContent"
    resp = await client.post(
        url,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"imageConfig": {"aspectRatio": aspect_ratio}},
        },
    )

    payload = resp.json()
    elapsed = int((time.monotonic() - started) * 1000)
    logger.info("[gemini][%s] finished attempt=%d status=%d elapsed=%dms", request_id, attempt, resp.status_code, elapsed)
    return {"status_code": resp.status_code, "payload": payload}


async def _request_without_timeout(
    model_id: str, domain: str, api_key: str, prompt: str, aspect_ratio: str, request_id: str,
) -> dict:
    async with httpx.AsyncClient(timeout=None) as client:
        return await _request_gemini(client, model_id, domain, api_key, prompt, aspect_ratio, request_id, 1)


async def generate_image_for_task(template_id: str, prompt: str, request_id: str) -> dict:
    config = load_ai_config()
    aspect_ratio = build_aspect_ratio(template_id)
    final_prompt = build_prompt(template_id, prompt)

    result = await _request_without_timeout(
        config.model_id, config.domain, config.api_key, final_prompt, aspect_ratio, request_id,
    )

    if result["status_code"] >= 400:
        error_msg = result["payload"].get("error", {}).get("message", "Gemini 请求失败，请检查配置文件。")
        raise RuntimeError(error_msg)

    result_url = _pick_image_part(result["payload"].get("candidates", []))
    if not result_url:
        raise RuntimeError("请求已发出，但模型没有返回图片结果。请检查当前模型是否支持文生图。")

    return {
        "resultUrl": result_url,
        "meta": {
            "brand": "图鲸",
            "modelId": config.model_id,
            "domain": config.domain,
            "apiKeyMasked": mask_api_key(config.api_key),
            "requestId": request_id,
        },
    }

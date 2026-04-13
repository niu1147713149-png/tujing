"""Template configuration and prompt building — ported from template-options.ts."""

from __future__ import annotations

from dataclasses import dataclass, field

ASPECT_RATIO_MAP: dict[str, str] = {
    "amazon": "1:1",
    "detail": "3:4",
    "poster": "16:9",
}


@dataclass
class TemplateOption:
    id: str
    name: str
    description: str
    ratio: str
    sample_prompts: list[str] = field(default_factory=list)


TEMPLATES: list[TemplateOption] = [
    TemplateOption(
        id="amazon",
        name="电商主图",
        description="适合亚马逊、淘宝等平台的正方形商品主图",
        ratio="1:1 / 建议 1024x1024",
        sample_prompts=[
            "一款高端无线蓝牙耳机，白色背景，产品居中，光影柔和，突出金属质感和简约设计风格",
        ],
    ),
    TemplateOption(
        id="detail",
        name="商品详情图",
        description="适合商品详情页的竖版长图展示",
        ratio="3:4 / 建议 1024x1365",
        sample_prompts=[
            "一款智能手表的详情展示图，深色背景，手表正面特写，标注心率监测、防水等核心卖点",
        ],
    ),
    TemplateOption(
        id="poster",
        name="营销海报",
        description="适合社交媒体和广告投放的横版海报",
        ratio="16:9 / 建议 1280x720",
        sample_prompts=[
            '双十一大促海报，红色喜庆背景，中间放置电子产品，大字标题"限时特惠"',
        ],
    ),
]

_TEMPLATE_MAP = {t.id: t for t in TEMPLATES}


def get_template_by_id(template_id: str) -> TemplateOption:
    return _TEMPLATE_MAP.get(template_id, TEMPLATES[0])


def build_aspect_ratio(template_id: str) -> str:
    return ASPECT_RATIO_MAP.get(template_id, "1:1")


def build_prompt(template_id: str, prompt: str | None = None) -> str:
    template = get_template_by_id(template_id)
    base = (prompt or "").strip()
    if not base:
        return f"生成一张{template.name}风格图片，适合电商展示，画面干净、主体清晰。"
    return f"请生成一张{template.name}风格图片。要求：{base}"

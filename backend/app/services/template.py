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
            "一瓶精华液护肤品，纯白背景，瓶身居中，柔光打亮，体现高端护肤品牌的精致感",
            "一双运动跑鞋，白色背景，侧面展示，突出鞋底科技感和透气网面材质细节",
            "一款不锈钢保温杯，浅灰背景，产品直立居中，杯身高光清晰，突出磨砂金属质感和商务风格",
            "一台便携咖啡机，白底干净场景，产品三分之二侧角度，突出按键结构和现代家电质感",
        ],
    ),
    TemplateOption(
        id="detail",
        name="商品详情图",
        description="适合商品详情页的竖版长图展示",
        ratio="3:4 / 建议 1024x1365",
        sample_prompts=[
            "一款智能手表的详情展示图，深色背景，手表正面特写，标注心率监测、防水等核心卖点",
            "一套护肤品礼盒的详情图，浅色渐变背景，展示礼盒内所有单品，标注功效和使用顺序",
            "一款机械键盘的详情展示图，暗色背景，键盘斜侧角度，突出轴体结构和背光效果",
            "一款空气炸锅的详情展示图，暖灰背景，展示产品外观、容量和触控面板，画面信息层级清晰",
            "一款旅行拉杆箱的详情页长图，中性色背景，展示容量分区、万向轮和拉杆细节，突出耐用感",
        ],
    ),
    TemplateOption(
        id="poster",
        name="营销海报",
        description="适合社交媒体和广告投放的横版海报",
        ratio="16:9 / 建议 1280x720",
        sample_prompts=[
            '双十一大促海报，红色喜庆背景，中间放置电子产品，大字标题"限时特惠"',
            "夏季新品上市海报，清新蓝绿渐变背景，展示防晒霜产品，配合海滩度假元素",
            "年终清仓促销海报，金色黑色撞色背景，展示多品类商品组合，突出折扣力度",
            "开学季促销海报，蓝黄色活力背景，展示文具和数码配件组合，突出满减活动和限时优惠",
            "品牌周年庆海报，深色高级背景，中间展示护肤套装，突出礼盒感、会员专享和赠品信息",
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

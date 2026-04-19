export type PromptGroup = {
  id: string
  label: string
  prompts: string[]
}

export type TemplateOption = {
  id: 'amazon' | 'detail' | 'poster'
  name: string
  description: string
  ratio: string
  colorClass: string
  accentClass: string
  bulletPoints: string[]
  samplePrompts: string[]
  promptGroups: PromptGroup[]
}

const AMAZON_PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'digital',
    label: '数码家电',
    prompts: [
      '蓝牙耳机主图，白底干净，产品居中，金属高光清晰，突出降噪与高级质感',
      '便携咖啡机主图，浅灰白背景，机身正面偏侧角度，突出按钮结构与精致小家电感',
      '不锈钢保温杯主图，纯净浅色背景，杯身直立居中，突出磨砂金属与密封质感',
      '桌面风扇主图，白底明亮场景，产品三分之二角度，突出简洁外观与清凉科技感',
    ],
  },
  {
    id: 'beauty',
    label: '美妆个护',
    prompts: [
      '精华液主图，纯白背景，瓶身居中，柔光打亮，体现高端护肤品牌的精致感',
      '防晒霜主图，浅米色背景，产品正面展示，突出清爽感、防晒卖点与夏日氛围',
      '高速吹风机主图，白底简洁构图，机身悬浮展示，突出流线外观与高端个护质感',
      '面霜主图，浅灰白背景，罐体居中，质地细腻干净，突出保湿修护与品牌高级感',
    ],
  },
  {
    id: 'fashion',
    label: '服饰箱包',
    prompts: [
      '运动跑鞋主图，白色背景，侧面展示，突出鞋底科技感和透气网面材质细节',
      '女士斜挎包主图，浅灰背景，包身正面偏侧展示，突出皮革纹理和五金细节',
      '旅行拉杆箱主图，纯净背景，箱体居中直立，突出硬壳材质、万向轮和商务出行感',
      '轻薄羽绒服主图，白底服饰展示，版型利落，突出面料轻盈感和秋冬上新氛围',
    ],
  },
]

const DETAIL_PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'digital-features',
    label: '数码卖点',
    prompts: [
      '智能手表详情图，深色背景，手表正面特写，标注心率监测、防水和续航等核心卖点',
      '机械键盘详情图，暗色背景，键盘斜侧角度，突出轴体结构、背光效果和键帽细节',
      '蓝牙音箱详情图，深灰背景，产品近景展示，突出低音表现、便携尺寸和材质细节',
      '投影仪详情图，科技感背景，展示镜头、接口和投射场景，信息层级清晰',
    ],
  },
  {
    id: 'beauty-detail',
    label: '美妆套装',
    prompts: [
      '护肤品礼盒详情图，浅色渐变背景，展示礼盒内所有单品，标注功效和使用顺序',
      '防晒套装详情图，清爽浅蓝背景，展示喷雾和乳液组合，突出场景适用性和卖点说明',
      '香水礼盒详情图，浅金色背景，展示主瓶和赠品组合，突出送礼感和高级包装细节',
      '洗护套装详情图，柔和背景，展示洗发水、护发素和精油，突出顺滑修护卖点',
    ],
  },
  {
    id: 'home-detail',
    label: '家居厨电',
    prompts: [
      '空气炸锅详情图，暖灰背景，展示产品外观、容量和触控面板，画面信息层级清晰',
      '手持吸尘器详情图，深浅灰背景，展示刷头配件、续航和收纳方式，突出家居清洁效率',
      '锅具套装详情图，浅色厨房场景，展示多件组合、材质层次和适用炉灶信息',
      '加湿器详情图，静谧家居背景，展示出雾效果、水箱容量和桌面使用场景',
    ],
  },
]

const POSTER_PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'promotion',
    label: '大促活动',
    prompts: [
      '双十一大促海报，红色喜庆背景，中间放置电子产品组合，突出限时特惠和大额优惠券',
      '618 年中大促海报，蓝紫渐变背景，展示多款数码产品，强调爆款直降和限时抢购',
      '年终清仓促销海报，金色黑色撞色背景，展示多品类商品组合，突出折扣力度和倒计时感',
      '限时秒杀海报，亮黄色背景，主商品大图居中，强化秒杀价、库存紧张和活动冲击力',
    ],
  },
  {
    id: 'new-arrival',
    label: '新品上新',
    prompts: [
      '夏季新品上市海报，清新蓝绿渐变背景，展示防晒霜产品，配合海滩度假元素',
      '春季上新海报，柔和浅粉背景，展示护肤新品组合，突出焕新感和轻盈氛围',
      '秋冬新品海报，深棕暖调背景，展示服饰或箱包新品，突出质感和季节氛围',
      '数码新品发布海报，深色科技背景，中间展示主打设备，突出新配色、新功能和开售时间',
    ],
  },
  {
    id: 'brand',
    label: '品牌营销',
    prompts: [
      '品牌周年庆海报，深色高级背景，中间展示护肤套装，突出礼盒感、会员专享和赠品信息',
      '会员日海报，紫金色背景，展示品牌明星产品，突出专属折扣、积分翻倍和限时福利',
      '直播预热海报，活力背景，展示主推商品和主播档期，突出开播时间和福利机制',
      '节日送礼海报，暖金色背景，展示礼盒或精品商品组合，突出送礼氛围和品牌高级感',
    ],
  },
]

function flattenPromptGroups(promptGroups: PromptGroup[]) {
  return promptGroups.flatMap((group) => group.prompts)
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'amazon',
    name: '电商主图',
    description: '适合亚马逊、淘宝等平台的正方形商品主图',
    ratio: '1:1 / 建议 1024x1024',
    colorClass: 'from-blue-500/20 to-cyan-400/10',
    accentClass: 'text-blue-300',
    bulletPoints: ['白底主体', '高清细节', '适合多平台'],
    promptGroups: AMAZON_PROMPT_GROUPS,
    samplePrompts: flattenPromptGroups(AMAZON_PROMPT_GROUPS),
  },
  {
    id: 'detail',
    name: '商品详情图',
    description: '适合商品详情页的竖版长图展示',
    ratio: '3:4 / 建议 1024x1365',
    colorClass: 'from-violet-500/20 to-fuchsia-400/10',
    accentClass: 'text-violet-300',
    bulletPoints: ['竖版构图', '信息层级清晰', '适合详情页展示'],
    promptGroups: DETAIL_PROMPT_GROUPS,
    samplePrompts: flattenPromptGroups(DETAIL_PROMPT_GROUPS),
  },
  {
    id: 'poster',
    name: '营销海报',
    description: '适合社交媒体和广告投放的横版海报',
    ratio: '16:9 / 建议 1280x720',
    colorClass: 'from-emerald-500/20 to-lime-400/10',
    accentClass: 'text-emerald-300',
    bulletPoints: ['横版构图', '视觉冲击力', '适合广告投放'],
    promptGroups: POSTER_PROMPT_GROUPS,
    samplePrompts: flattenPromptGroups(POSTER_PROMPT_GROUPS),
  },
]

export function getTemplateById(templateId: string) {
  return TEMPLATE_OPTIONS.find((item) => item.id === templateId) ?? TEMPLATE_OPTIONS[0]
}

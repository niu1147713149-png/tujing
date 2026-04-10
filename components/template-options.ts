export type TemplateOption = {
  id: 'amazon' | 'detail' | 'poster'
  name: string
  description: string
  ratio: string
  colorClass: string
  accentClass: string
  bulletPoints: string[]
  samplePrompts: string[]
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
    samplePrompts: [
      '一款高端无线蓝牙耳机，白色背景，产品居中，光影柔和，突出金属质感和简约设计风格',
      '一瓶精华液护肤品，纯白背景，瓶身居中，柔光打亮，体现高端护肤品牌的精致感',
      '一双运动跑鞋，白色背景，侧面展示，突出鞋底科技感和透气网面材质细节',
    ],
  },
  {
    id: 'detail',
    name: '商品详情图',
    description: '适合商品详情页的竖版长图展示',
    ratio: '3:4 / 建议 1024x1365',
    colorClass: 'from-violet-500/20 to-fuchsia-400/10',
    accentClass: 'text-violet-300',
    bulletPoints: ['竖版构图', '信息层级清晰', '适合详情页展示'],
    samplePrompts: [
      '一款智能手表的详情展示图，深色背景，手表正面特写，标注心率监测、防水等核心卖点',
      '一套护肤品礼盒的详情图，浅色渐变背景，展示礼盒内所有单品，标注功效和使用顺序',
      '一款机械键盘的详情展示图，暗色背景，键盘斜侧角度，突出轴体结构和背光效果',
    ],
  },
  {
    id: 'poster',
    name: '营销海报',
    description: '适合社交媒体和广告投放的横版海报',
    ratio: '16:9 / 建议 1280x720',
    colorClass: 'from-emerald-500/20 to-lime-400/10',
    accentClass: 'text-emerald-300',
    bulletPoints: ['横版构图', '视觉冲击力', '适合广告投放'],
    samplePrompts: [
      '双十一大促海报，红色喜庆背景，中间放置电子产品，大字标题"限时特惠"',
      '夏季新品上市海报，清新蓝绿渐变背景，展示防晒霜产品，配合海滩度假元素',
      '年终清仓促销海报，金色黑色撞色背景，展示多品类商品组合，突出折扣力度',
    ],
  },
]

export function getTemplateById(templateId: string) {
  return TEMPLATE_OPTIONS.find((item) => item.id === templateId) ?? TEMPLATE_OPTIONS[0]
}

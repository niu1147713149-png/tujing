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
    description: '适合首页点击转化，强调主体、白底和商品质感。',
    ratio: '1:1 · 预览 1024×1024',
    colorClass: 'from-blue-500/20 to-cyan-400/10',
    accentClass: 'text-blue-300',
    bulletPoints: ['主体居中', '白底清爽', '适合点击转化'],
    samplePrompts: [
      '生成一张高转化电商主图，白底，主体居中，产品边缘清晰，光线柔和干净，适合首页点击转化。',
      '生成一张极简科技感主图，白底，突出产品材质与轮廓，构图居中，视觉高级，适合电商首页。',
      '生成一张写实风格商品主图，白底，干净阴影，突出产品细节和品质感，适合平台首图展示。',
    ],
  },
  {
    id: 'detail',
    name: '详情页长图',
    description: '适合卖点拆解、功能展示和场景说明。',
    ratio: '3:4 · 预览 1024×1365',
    colorClass: 'from-violet-500/20 to-fuchsia-400/10',
    accentClass: 'text-violet-300',
    bulletPoints: ['卖点分区', '信息层级清晰', '适合详情页展示'],
    samplePrompts: [
      '生成一张电商详情页长图，分区展示产品卖点、材质细节和使用场景，版式整洁清晰，适合详情页说明。',
      '生成一张高端感详情页长图，突出功能亮点与设计细节，构图有层次，文案留白合理，适合品牌电商展示。',
      '生成一张偏科技感的详情页长图，展示产品结构、核心优势和生活化场景，信息层级明确，适合转化页。',
    ],
  },
  {
    id: 'poster',
    name: '营销海报',
    description: '适合活动投放、社媒传播和视觉冲击型广告。',
    ratio: '16:9 · 预览 1280×720',
    colorClass: 'from-emerald-500/20 to-lime-400/10',
    accentClass: 'text-emerald-300',
    bulletPoints: ['促销氛围', '大标题视觉', '适合广告投放'],
    samplePrompts: [
      '生成一张营销海报，突出促销氛围和产品主体，大标题感强，适合广告投放和社媒传播。',
      '生成一张高级感品牌海报，深色背景，聚光灯氛围，突出产品卖点与视觉冲击力，适合活动宣传。',
      '生成一张高转化促销海报，画面有折扣氛围、强主标题和清晰产品展示，适合电商活动页和广告素材。',
    ],
  },
]

export function getTemplateById(templateId: string) {
  return TEMPLATE_OPTIONS.find((item) => item.id === templateId) ?? TEMPLATE_OPTIONS[0]
}

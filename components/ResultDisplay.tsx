'use client'

type ResultDisplayProps = {
  resultUrl: string
  templateName: string
  onDownload: () => void
  onRegenerate: () => void
  onRetryVariant: () => void
  onRestart: () => void
}

export default function ResultDisplay({
  resultUrl,
  templateName,
  onDownload,
  onRegenerate,
  onRetryVariant,
  onRestart,
}: ResultDisplayProps) {
  return (
    <div className="space-y-6">
      <div className="tj-panel overflow-hidden p-5 md:p-7">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="tj-label">图鲸输出</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.03em] text-white">
              {`${templateName} 已生成`}
            </h2>
          </div>
          <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            Gemini 实时返回
          </div>
        </div>

        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-black/30">
          <img src={resultUrl} alt={`${templateName} 生成结果`} className="w-full object-cover" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <button type="button" onClick={onDownload} className="tj-button-primary">
          下载图片
        </button>
        <button type="button" onClick={onRetryVariant} className="tj-button-secondary">
          再来 1 张
        </button>
        <button type="button" onClick={onRegenerate} className="tj-button-secondary">
          返回修改提示词
        </button>
        <button type="button" onClick={onRestart} className="tj-button-secondary">
          返回首页
        </button>
      </div>
    </div>
  )
}

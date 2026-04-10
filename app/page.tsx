'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ConfigCheckResult = {
  ok: boolean
  domain: string
  modelId: string
  apiKeyMasked?: string
  message: string
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [configStatus, setConfigStatus] = useState<ConfigCheckResult | null>(null)

  const handleCheckConfig = async () => {
    setChecking(true)
    setConfigStatus(null)

    try {
      const response = await fetch('/api/config-check', { method: 'POST' })
      const data = (await response.json()) as ConfigCheckResult
      setConfigStatus(data)
    } catch (error) {
      setConfigStatus({
        ok: false,
        domain: '-',
        modelId: '-',
        apiKeyMasked: '-',
        message: error instanceof Error ? error.message : '配置检测失败，请稍后重试。',
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <main className="tj-shell min-h-screen">
      <div className="tj-container py-6 md:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 shadow-soft backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#7170ff] text-sm font-semibold text-white">
              T
            </div>
            <div>
              <p className="text-sm font-medium text-white">图鲸</p>
              <p className="text-xs text-slate-400">AI 电商出图工作台</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 md:block">
            Premium preview / Linear inspired
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="mb-4 inline-flex rounded-full border border-[#7170ff]/25 bg-[#7170ff]/10 px-4 py-2 text-sm text-[#c7c8ff]">
              一句提示词，快速生成电商图
            </div>
            <h1 className="tj-title max-w-3xl text-3xl md:text-4xl">
              图鲸，把
              <span className="bg-gradient-to-r from-[#f7f8f8] via-[#c7c8ff] to-[#6ee7f9] bg-clip-text text-transparent">
                高级感电商素材
              </span>
              做成一条可复用流程。
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              用更像产品而不是 demo 的方式组织出图流程：模板、提示词、配置检测、结果下载全部收在一个工作台里。
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => router.push('/generate')} className="tj-button-primary">
                进入图鲸工作台
              </button>
              <button
                type="button"
                onClick={() => void handleCheckConfig()}
                disabled={checking}
                className="tj-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking ? '正在检测配置...' : '检测配置是否可用'}
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['文生图优先', '先验证可用性与稳定性'],
                ['轻量预览规格', '先追速度，再做高分辨率'],
                ['配置文件驱动', '域名 / Key / 模型 ID 可替换'],
              ].map(([title, description]) => (
                <div key={title} className="tj-panel-soft p-3">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            {configStatus ? (
              <div className={`mt-6 rounded-[28px] border p-5 shadow-soft backdrop-blur-xl ${configStatus.ok ? 'border-emerald-400/20 bg-emerald-500/10' : 'border-rose-400/20 bg-rose-500/10'}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className={`text-sm font-medium ${configStatus.ok ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {configStatus.ok ? '配置检测通过' : '配置检测失败'}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-100">{configStatus.message}</p>
                  </div>
                  <div className="grid gap-3 text-sm text-slate-300 md:min-w-[320px] md:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-slate-500">当前域名</p>
                      <p className="mt-1 break-all text-white">{configStatus.domain}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-slate-500">当前模型</p>
                        <p className="mt-1 break-all text-white">{configStatus.modelId}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <p className="text-slate-500">API Key</p>
                        <p className="mt-1 break-all text-white">{configStatus.apiKeyMasked ?? '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="tj-panel relative overflow-hidden p-3 md:p-5">
            <div className="absolute inset-x-10 top-0 h-32 rounded-full bg-[#7170ff]/20 blur-3xl" />
            <div className="relative">
              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="tj-label">图鲸输出面板</p>
                  <p className="mt-2 text-base font-medium text-white">高级感结果预览</p>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                  Real-time preview
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(113,112,255,0.18),rgba(16,18,24,0.82))] p-4">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="tj-label">模板</p>
                      <p className="mt-2 text-xl font-medium text-white">电商主图 / 详情页 / 海报</p>
                    </div>
                    <div className="rounded-full bg-white/[0.08] px-3 py-1 text-xs text-slate-200">
                      轻量规格预览
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[20px] border border-white/10 bg-black/30 p-4">
                      <div className="aspect-[4/3] overflow-hidden rounded-[18px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_36%),linear-gradient(180deg,#11131a,#0b0d12)] p-4">
                        <div className="flex h-full flex-col justify-between rounded-[14px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="tj-label text-white/60">Preview</p>
                              <p className="mt-2 text-2xl font-medium text-white">图鲸主图视觉</p>
                            </div>
                            <div className="h-16 w-16 rounded-2xl bg-white/90" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-24 rounded-full bg-white/80" />
                            <div className="h-2 w-40 rounded-full bg-white/50" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        ['主图', '1024x1024', '白底主体清晰'],
                        ['详情图', '1024x1365', '信息层级清晰'],
                        ['海报', '1280x720', '适合广告投放'],
                      ].map(([title, size, desc]) => (
                        <div key={title} className="rounded-[20px] border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{title}</p>
                            <span className="text-xs text-slate-400">{size}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-400">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="tj-panel-soft p-5">
                    <p className="tj-label">品牌气质</p>
                    <p className="mt-3 text-lg font-medium text-white">更像专业工具，而不是草台 demo</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      深色底、弱边框、强层级，把视觉焦点让给生成结果本身。
                    </p>
                  </div>
                  <div className="tj-panel-soft p-5">
                    <p className="tj-label">工作流</p>
                    <p className="mt-3 text-lg font-medium text-white">模板 / Prompt / 出图 / 下载</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      每一步都能看清状态，减少像实验项目一样的跳转感。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

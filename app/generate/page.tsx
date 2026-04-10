'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import TemplateSelector from '@/components/TemplateSelector'
import { getTemplateById } from '@/components/template-options'

const STORAGE_KEYS = {
  selectedTemplate: 'tujing.selectedTemplate',
  generationPrompt: 'tujing.generationPrompt',
  currentTaskId: 'tujing.currentTaskId',
}

export default function GeneratePage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState('amazon')
  const [prompt, setPrompt] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const storedTemplate = localStorage.getItem(STORAGE_KEYS.selectedTemplate)
    const storedPrompt = localStorage.getItem(STORAGE_KEYS.generationPrompt)
    const initialTemplate = storedTemplate ?? 'amazon'
    const template = getTemplateById(initialTemplate)

    setSelectedTemplate(initialTemplate)
    setPrompt(storedPrompt ?? template.samplePrompts[0])
  }, [])

  const currentTemplate = getTemplateById(selectedTemplate)

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setSubmitting(true)

    try {
      localStorage.setItem(STORAGE_KEYS.selectedTemplate, selectedTemplate)
      localStorage.setItem(STORAGE_KEYS.generationPrompt, prompt.trim())

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template: selectedTemplate,
          prompt: prompt.trim(),
        }),
      })

      const data = (await response.json()) as { taskId?: string; error?: string }
      if (!response.ok || !data.taskId) {
        throw new Error(data.error ?? '创建任务失败，请重试')
      }

      localStorage.setItem(STORAGE_KEYS.currentTaskId, data.taskId)
      router.push(`/result/${data.taskId}`)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '创建任务失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="tj-shell min-h-screen">
      <div className="tj-container py-6 md:py-8">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tj-label">图鲸 / Step 1</p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.04em] text-[#f7f8f8] md:text-4xl">
              选择模板，输入提示词
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              图鲸 V2 采用任务型生成流：选择模板、填写提示词、提交后异步生成，完成后自动展示结果。
            </p>
          </div>
          <button type="button" onClick={() => router.push('/')} className="tj-button-secondary">
            返回首页
          </button>
        </div>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="tj-panel p-5 md:p-6">
            <p className="tj-label">当前配置</p>
            <h2 className="mt-3 text-2xl font-medium text-white">生成参数一览</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              以下是当前选择的模板和生成参数，确认无误后在下方输入提示词并提交生成任务。
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ['当前模板', currentTemplate.name],
                ['输出规格', currentTemplate.ratio],
                ['输出格式', '文生图 / 预览 / 可下载'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
                  <p className="mt-3 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tj-panel p-5 md:p-6">
            <p className="tj-label">提示词技巧</p>
            <div className="mt-4 space-y-4">
              {[
                ['背景', '明确指定背景颜色或场景，如白底、渐变'],
                ['构图', '描述产品角度、位置和画面布局，突出主体'],
                ['风格', '指定视觉风格，如3D渲染、摄影棚、极简'],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onSelect={(templateId) => {
            setSelectedTemplate(templateId)
            setPrompt(getTemplateById(templateId).samplePrompts[0])
          }}
        />

        <section className="mt-6 tj-panel p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="tj-label">Prompt</p>
              <h2 className="mt-3 text-2xl font-medium text-white">输入你的生成提示词</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                提示词将直接发送给 Gemini，描述越具体、画面感越强，生成效果越好。
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrompt(currentTemplate.samplePrompts[0])}
              className="tj-button-secondary px-4 py-3"
            >
              使用示例提示词
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {currentTemplate.samplePrompts.map((samplePrompt, index) => (
              <button
                key={samplePrompt}
                type="button"
                onClick={() => setPrompt(samplePrompt)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08]"
              >
                {`示例 ${index + 1}`}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            className="mt-6 w-full rounded-[24px] border border-white/10 bg-black/30 px-5 py-5 text-sm leading-7 text-[#f7f8f8] outline-none transition placeholder:text-slate-500 focus:border-[#7170ff]/50 focus:bg-black/40"
            placeholder="在这里输入你的生成提示词..."
          />

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!prompt.trim() || submitting}
              className="tj-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '正在提交任务...' : `生成图片 ${currentTemplate.name}`}
            </button>
            <button type="button" onClick={() => router.push('/')} className="tj-button-secondary">
              返回首页
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

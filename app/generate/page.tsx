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
        throw new Error(data.error ?? '???????')
      }

      localStorage.setItem(STORAGE_KEYS.currentTaskId, data.taskId)
      router.push(`/result/${data.taskId}`)
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : '???????')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="tj-shell min-h-screen">
      <div className="tj-container py-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="tj-label">?? ? Step 1</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-[#f7f8f8] md:text-5xl">
              ??????????
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              ?? V2 ????????????????????????????????????????
            </p>
          </div>
          <button type="button" onClick={() => router.push('/')} className="tj-button-secondary">
            ????
          </button>
        </div>

        <section className="mb-8 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="tj-panel p-6 md:p-7">
            <p className="tj-label">????</p>
            <h2 className="mt-3 text-2xl font-medium text-white">???????</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              ????????????????????????????????????????????????????
            </p>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ['????', currentTemplate.name],
                ['????', currentTemplate.ratio],
                ['????', '???? ? ?? ? ????'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
                  <p className="mt-3 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="tj-panel p-6 md:p-7">
            <p className="tj-label">?????</p>
            <div className="mt-4 space-y-4">
              {[
                ['??', '?????????????????'],
                ['??', '???????????????????????'],
                ['??', '?????????3D?????????'],
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

        <section className="mt-8 tj-panel p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="tj-label">Prompt</p>
              <h2 className="mt-3 text-2xl font-medium text-white">?????????</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
                ?????????? Gemini?????????????????????????????
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPrompt(currentTemplate.samplePrompts[0])}
              className="tj-button-secondary px-4 py-3"
            >
              ????????
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
                {`?? ${index + 1}`}
              </button>
            ))}
          </div>

          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={8}
            className="mt-6 w-full rounded-[24px] border border-white/10 bg-black/30 px-5 py-5 text-sm leading-7 text-[#f7f8f8] outline-none transition placeholder:text-slate-500 focus:border-[#7170ff]/50 focus:bg-black/40"
            placeholder="???????????????"
          />

          <div className="mt-6 flex flex-col gap-3 md:flex-row">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!prompt.trim() || submitting}
              className="tj-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? '???????' : `???? ${currentTemplate.name}`}
            </button>
            <button type="button" onClick={() => router.push('/')} className="tj-button-secondary">
              ????
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}

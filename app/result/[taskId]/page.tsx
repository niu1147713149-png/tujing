'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import GeneratingLoader from '@/components/GeneratingLoader'
import ResultDisplay from '@/components/ResultDisplay'
import { getTemplateById } from '@/components/template-options'

type TaskStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

type Task = {
  id: string
  template: 'amazon' | 'detail' | 'poster'
  prompt: string
  status: TaskStatus
  resultUrl: string | null
  errorMessage: string | null
  requestId: string | null
  providerModel: string | null
}

function getDownloadExtension(dataUrl: string) {
  if (dataUrl.startsWith('data:image/jpeg')) return 'jpg'
  if (dataUrl.startsWith('data:image/webp')) return 'webp'
  if (dataUrl.startsWith('data:image/png')) return 'png'
  return 'png'
}

export default function TaskResultPage({ params }: { params: { taskId: string } }) {
  const router = useRouter()
  const [task, setTask] = useState<Task | null>(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    const fetchTask = async () => {
      try {
        const response = await fetch(`/api/tasks/${params.taskId}`, { cache: 'no-store' })
        const data = (await response.json()) as Task | { error?: string }

        if (!response.ok || !('id' in data)) {
          throw new Error(('error' in data && data.error) || '任务加载失败。')
        }

        if (!cancelled) {
          setTask(data)
          setLoadError('')
        }

        return data
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : '任务加载失败。')
        }
        return null
      }
    }

    void fetchTask()
    const timer = window.setInterval(async () => {
      const current = await fetchTask()
      if (!current || current.status === 'succeeded' || current.status === 'failed') {
        window.clearInterval(timer)
      }
    }, 2000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [params.taskId])

  const currentTemplate = useMemo(() => getTemplateById(task?.template ?? 'amazon'), [task?.template])

  const handleDownload = () => {
    if (!task?.resultUrl) return
    const link = document.createElement('a')
    link.href = task.resultUrl
    link.download = `tujing-${currentTemplate.id}.${getDownloadExtension(task.resultUrl)}`
    link.click()
  }

  const handleRetryVariant = async () => {
    const response = await fetch(`/api/tasks/${params.taskId}/regenerate`, {
      method: 'POST',
    })
    const data = (await response.json()) as { taskId?: string; error?: string }
    if (!response.ok || !data.taskId) {
      setLoadError(data.error ?? '???????')
      return
    }
    router.push(`/result/${data.taskId}`)
    router.refresh()
  }

  if (loadError && !task) {
    return (
      <main className="tj-shell min-h-screen">
        <div className="tj-container py-10">
          <div className="rounded-[32px] border border-rose-400/20 bg-rose-500/10 p-8 shadow-soft backdrop-blur-xl">
            <h1 className="text-3xl font-medium text-white">??????</h1>
            <p className="mt-4 text-sm leading-7 text-rose-100">{loadError}</p>
          </div>
        </div>
      </main>
    )
  }

  if (!task || task.status === 'queued' || task.status === 'processing') {
    return (
      <main className="tj-shell min-h-screen">
        <div className="tj-container py-10">
          <div className="mb-8 max-w-4xl">
            <p className="tj-label">?? ? Step 2</p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-[#f7f8f8] md:text-5xl">
              ??????
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              ???? ID?{params.taskId}????????????????????????????????
            </p>
          </div>
          <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
            <GeneratingLoader templateName={currentTemplate.name} />
          </div>
        </div>
      </main>
    )
  }

  if (task.status === 'failed') {
    return (
      <main className="tj-shell min-h-screen">
        <div className="tj-container py-10">
          <div className="rounded-[32px] border border-rose-400/20 bg-rose-500/10 p-8 shadow-soft backdrop-blur-xl">
            <h2 className="text-2xl font-medium text-white">????</h2>
            <p className="mt-3 text-sm leading-7 text-rose-100">{task.errorMessage}</p>
            {task.requestId ? (
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-rose-200/80">
                Request ID ? {task.requestId}
              </p>
            ) : null}
            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <button type="button" onClick={handleRetryVariant} className="tj-button-primary bg-rose-500 hover:bg-rose-400">
                ?? 1 ?
              </button>
              <button type="button" onClick={() => router.push('/generate')} className="tj-button-secondary">
                ???????
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="tj-shell min-h-screen">
      <div className="tj-container py-10">
        <div className="mb-8">
          <p className="tj-label">?? ? Step 2</p>
          <h1 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-[#f7f8f8] md:text-5xl">
            ??????
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            ???????????????????????????????????
          </p>
        </div>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="tj-panel p-5">
            <p className="tj-label">????</p>
            <h2 className="mt-3 text-2xl font-medium text-white">{currentTemplate.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{currentTemplate.ratio}</p>
          </div>
          <div className="tj-panel p-5">
            <p className="tj-label">Prompt ??</p>
            <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-200">{task.prompt}</p>
          </div>
        </section>

        <ResultDisplay
          resultUrl={task.resultUrl ?? ''}
          templateName={currentTemplate.name}
          onDownload={handleDownload}
          onRetryVariant={handleRetryVariant}
          onRegenerate={() => router.push('/generate')}
          onRestart={() => router.push('/')}
        />
      </div>
    </main>
  )
}

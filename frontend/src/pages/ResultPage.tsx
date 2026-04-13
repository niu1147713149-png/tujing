import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTemplateById } from '../components/template-options'
import GeneratingLoader from '../components/GeneratingLoader'
import TemplateSelector from '../components/TemplateSelector'
import type { Task } from '../api/tasks'
import { apiFetch, resolveApiUrl } from '../api/client'

function formatDate(value?: string) {
  if (!value) return '刚刚'
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return value }
}

export default function ResultPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadError, setLoadError] = useState('')
  const [copyState, setCopyState] = useState<Record<string, boolean>>({})
  const [downloadingZip, setDownloadingZip] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    let timer: number | undefined
    const loadTasks = async () => {
      try {
        const taskData = await apiFetch<Task>(`/api/tasks/${taskId}`)
        const groupId = taskData.groupId || taskData.id
        const groupData = await apiFetch<Task[]>(`/api/tasks/group/${groupId}`)
        const sorted = [...groupData].sort((a, b) => a.id.localeCompare(b.id))
        if (!cancelled) { setTasks(sorted); setLoadError('') }
        const finished = sorted.every(t => t.status === 'succeeded' || t.status === 'failed')
        if (!finished && !cancelled) { timer = window.setTimeout(() => { void loadTasks() }, 2000) }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '任务加载失败。')
      }
    }
    void loadTasks()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [taskId])

  const firstTask = tasks[0] ?? null
  const batchNote = tasks.find((task) => task.note)?.note ?? null
  const currentTemplate = getTemplateById(firstTask?.template ?? 'amazon')
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'succeeded' || t.status === 'failed').length
  const succeededCount = tasks.filter(t => t.status === 'succeeded').length
  const failedCount = tasks.filter(t => t.status === 'failed').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const isGenerating = total === 0 || completed < total

  const handleDownloadSingle = (task: Task) => {
    if (!task.resultUrl) return
    const link = document.createElement('a')
    link.href = resolveApiUrl(task.resultUrl)
    link.download = `tujing-${task.id}.png`
    link.click()
  }

  const handleCopyLink = async (task: Task) => {
    if (!task.resultUrl) return
    try {
      await navigator.clipboard.writeText(resolveApiUrl(task.resultUrl))
      setCopyState(c => ({ ...c, [task.id]: true }))
      window.setTimeout(() => setCopyState(c => ({ ...c, [task.id]: false })), 1500)
    } catch { window.alert('复制失败，请稍后重试。') }
  }

  const handleDownloadZip = () => {
    if (!firstTask?.groupId || succeededCount === 0) return
    setDownloadingZip(true)
    window.open(resolveApiUrl(`/api/tasks/groups/${firstTask.groupId}/download`), '_blank', 'noopener,noreferrer')
    window.setTimeout(() => setDownloadingZip(false), 1500)
  }

  const handleRegenerateBatch = async () => {
    setRegenerating(true)
    try {
      const data = await apiFetch<{ taskId: string }>(`/api/tasks/${taskId}/regenerate`, { method: 'POST' })
      navigate(`/result/${data.taskId}`)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '重新生成失败，请重试。')
    } finally { setRegenerating(false) }
  }

  return (
    <main className="tj-studio">
      <aside className="tj-sidebar">
        <div className="tj-sidebar-scroll">
          <div>
            <p className="tj-eyebrow">Studio / Result State</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-white">结果工作台</h1>
            <p className="mt-3 text-sm leading-7 text-slate-400">当前页面沿用 Studio 结构：左侧展示批次信息和操作，右侧画布根据任务状态切换生成中、失败或最终结果。</p>
          </div>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="tj-eyebrow">Template</p>
              <span className="tj-tag">{currentTemplate.name}</span>
            </div>
            <TemplateSelector selectedTemplate={currentTemplate.id} onSelect={() => undefined} />
          </section>
          <section className="tj-panel-soft p-4">
            <p className="tj-eyebrow">批次摘要</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between"><span>客户备注</span><span className="max-w-[160px] truncate text-right text-white">{batchNote ?? '未填写'}</span></div>
              <div className="flex items-center justify-between"><span>创建时间</span><span className="text-white">{formatDate(firstTask?.createdAt)}</span></div>
              <div className="flex items-center justify-between"><span>批次数量</span><span className="text-white">{total || 0} 张</span></div>
              <div className="flex items-center justify-between"><span>成功 / 失败</span><span className="text-white">{succeededCount} / {failedCount}</span></div>
            </div>
          </section>
          <section className="tj-panel-soft p-4">
            <p className="tj-eyebrow">Prompt</p>
            <p className="mt-4 text-sm leading-7 text-slate-300">{firstTask?.prompt ?? '正在加载提示词...'}</p>
          </section>
          <section className="tj-panel-soft p-4">
            <div className="flex items-center justify-between">
              <p className="tj-eyebrow">批次进度</p>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500">{completed}/{total || 0}</span>
            </div>
            <div className="mt-4 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-2 rounded-full bg-[#7170ff] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-400">成功 {succeededCount} 张 / 失败 {failedCount} 张</p>
            {loadError ? <p className="mt-3 text-sm text-rose-200">{loadError}</p> : null}
          </section>
          <div className="tj-sidebar-footer flex flex-col gap-3">
            <button type="button" onClick={handleDownloadZip} disabled={succeededCount === 0 || downloadingZip} className="tj-button-primary w-full">{downloadingZip ? '正在打包...' : '全部下载 ZIP'}</button>
            <button type="button" onClick={() => void handleRegenerateBatch()} disabled={regenerating} className="tj-button-secondary w-full">{regenerating ? '正在重新生成...' : '重新生成一批'}</button>
            <button type="button" onClick={() => navigate('/generate')} className="tj-button-secondary w-full">返回修改提示词</button>
            <button type="button" onClick={() => navigate('/history')} className="tj-button-secondary w-full">查看历史订单</button>
          </div>
        </div>
      </aside>
      <section className="tj-canvas">
        <div className="tj-canvas-scroll items-start lg:items-center">
          {!firstTask || isGenerating ? (
            <GeneratingLoader templateName={currentTemplate.name} />
          ) : failedCount === total ? (
            <div className="w-full max-w-3xl">
              <div className="tj-panel p-8 md:p-10">
                <p className="tj-eyebrow">Canvas / Failed State</p>
                <h2 className="mt-4 text-4xl font-medium tracking-tight text-white">本批次生成失败</h2>
                <p className="mt-4 text-sm leading-7 text-slate-400">所有图片都未成功返回。你可以重新生成一批，或返回左侧重新调整提示词与模板。</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="rounded-[24px] border border-rose-400/15 bg-rose-500/10 p-5">
                      <p className="tj-eyebrow">第 {index + 1} 张</p>
                      <p className="mt-3 text-sm font-medium text-white">{task.errorMessage ?? '生成失败，请稍后重试。'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-7xl">
              <div className="mb-6 max-w-3xl">
                <p className="tj-eyebrow">Canvas / Result State</p>
                <h2 className="mt-4 text-4xl font-medium tracking-tight text-white md:text-5xl">批量结果已进入画布</h2>
                <p className="mt-4 text-sm leading-7 text-slate-400 md:text-base">画布只负责展示结果本身。你可以逐张下载、复制链接，或在左侧对整批结果继续处理。</p>
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                {tasks.map((task, index) => (
                  <article key={task.id} className="tj-panel overflow-hidden p-5 md:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="tj-eyebrow">第 {index + 1} 张</p>
                        <h3 className="mt-3 text-2xl font-medium text-white">{currentTemplate.name}</h3>
                        <p className="mt-2 text-sm text-slate-500">任务 ID：{task.id}</p>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200">
                        <span className={`tj-status-dot ${task.status === 'succeeded' ? 'bg-emerald-400' : task.status === 'failed' ? 'bg-rose-400' : 'bg-[#7170ff]'}`} />
                        {task.status === 'succeeded' ? '已完成' : task.status === 'failed' ? '失败' : '处理中'}
                      </div>
                    </div>
                    {task.status === 'succeeded' && task.resultUrl ? (
                      <div className="tj-image-frame mt-6"><img src={resolveApiUrl(task.resultUrl)} alt={`${currentTemplate.name} 生成结果`} className="w-full object-cover" /></div>
                    ) : task.status === 'failed' ? (
                      <div className="mt-6 rounded-[24px] border border-rose-400/15 bg-rose-500/10 p-5"><p className="text-sm leading-7 text-rose-100">{task.errorMessage ?? '生成失败，请稍后重试。'}</p></div>
                    ) : (
                      <div className="mt-6 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-5">
                        <div className="aspect-[16/10] rounded-[20px] bg-white/[0.05] animate-pulse" />
                        <p className="mt-4 text-sm text-slate-400">{task.status === 'queued' ? '任务已创建，正在排队生成。' : '请求已发出，正在等待上游模型返回。'}</p>
                      </div>
                    )}
                    {task.status === 'succeeded' && task.resultUrl ? (
                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <button type="button" onClick={() => void handleCopyLink(task)} className="tj-button-secondary" aria-label="复制图片链接">{copyState[task.id] ? '已复制!' : '复制链接'}</button>
                        <button type="button" onClick={() => handleDownloadSingle(task)} className="tj-button-primary">下载图片</button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

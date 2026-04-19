import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTemplateById } from '../components/template-options'
import GeneratingLoader from '../components/GeneratingLoader'
import { useModels, type Task } from '../api/tasks'
import { apiFetch, resolveApiUrl } from '../api/client'

function formatDate(value?: string) {
  if (!value) return '刚刚'
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return value }
}

function getTaskStatusText(status: Task['status']) {
  if (status === 'queued') return '排队中'
  if (status === 'processing') return '生成中'
  if (status === 'succeeded') return '完成'
  return '失败'
}

export default function ResultPage() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const { data: modelsData } = useModels()
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
  const modelNameMap = useMemo(
    () => new Map((modelsData?.models ?? []).map((model) => [model.id, model.name])),
    [modelsData],
  )
  const total = tasks.length
  const completed = tasks.filter(t => t.status === 'succeeded' || t.status === 'failed').length
  const succeededCount = tasks.filter(t => t.status === 'succeeded').length
  const failedCount = tasks.filter(t => t.status === 'failed').length
  const queuedCount = tasks.filter((task) => task.status === 'queued').length
  const processingCount = tasks.filter((task) => task.status === 'processing').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const isGenerating = total === 0 || completed < total
  const hasBlockingLoadError = !firstTask && !!loadError
  const currentModelLabel = firstTask?.providerModel
    ? (modelNameMap.get(firstTask.providerModel) ?? firstTask.providerModel)
    : '默认模型'
  const headerStatus = isGenerating
    ? (processingCount > 0 ? '生成中' : queuedCount > 0 ? '排队中' : '读取中')
    : '已完成'
  const progressHint = isGenerating
    ? (processingCount > 0
      ? '请求已发出，正在等待上游模型返回结果。'
      : '任务已进入队列，正在等待开始处理。')
    : failedCount > 0
      ? '本批次已结束，部分结果失败，可查看原因后重新生成。'
      : '本批次已全部完成，现在可以直接下载结果。'

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

  // 动态决定画廊网格布局
  const gridClass = currentTemplate.id === 'detail' 
    ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' 
    : currentTemplate.id === 'poster' 
      ? 'grid-cols-1 xl:grid-cols-2' 
      : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <main className="tj-studio">
      {/* 高级极简侧边栏 */}
      <aside className="tj-sidebar w-full lg:w-[360px] bg-[#050505] border-white/[0.04]">
        
        {/* 顶部：订单与状态信息 */}
        <header className="px-6 py-5 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isGenerating ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-pulse' : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'}`} />
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
                {headerStatus}
              </span>
            </div>
            <span className="text-[10px] text-slate-600 font-mono" title={firstTask?.groupId}>
              批次 {firstTask?.groupId?.slice(0, 8)}...
            </span>
          </div>
          <h2 className="mt-2 text-sm font-medium text-white truncate pr-4" title={batchNote ?? '未命名订单'}>
            {batchNote ?? '未命名订单'}
          </h2>
        </header>

        <div className="tj-sidebar-scroll flex-1 px-0 py-0 gap-0 overflow-x-hidden">
          
          {/* 进度条区块 */}
          <section className="p-6 border-b border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-slate-300">批次进度</label>
              <span className="text-[10px] font-mono text-[#7170ff] bg-[#7170ff]/10 px-2 py-0.5 rounded-full">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/[0.04] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#5e6ad2] to-[#7170ff] shadow-[0_0_10px_rgba(113,112,255,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>{completed} / {total || 0} 项</span>
              <span className="flex gap-2">
                <span className="text-amber-300/80">{queuedCount} 排队</span>
                <span className="text-sky-300/80">{processingCount} 生成中</span>
                <span className="text-emerald-400/80">{succeededCount} 成功</span>
                <span className="text-rose-400/80">{failedCount} 失败</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">{progressHint}</p>
          </section>

          {/* Prompt 展示区 */}
          <section className="p-6 border-b border-white/[0.04]">
            <label className="text-xs font-medium text-slate-300 block mb-3">提示词快照</label>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-white/5 to-white/5 rounded-[20px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
              <div className="relative w-full rounded-[18px] border border-white/[0.06] bg-[#0a0a0c] p-4 text-sm leading-relaxed text-slate-300 shadow-inner">
                {firstTask?.prompt ?? '正在加载提示词...'}
              </div>
            </div>
          </section>

          {/* 规格元数据 */}
          <section className="p-6 space-y-4">
            <label className="text-xs font-medium text-slate-300 block mb-1">参数配置</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">模板</p>
                <p className="text-xs font-medium text-slate-200">{currentTemplate.name}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">模型</p>
                <p className="text-xs font-medium text-slate-200">{currentModelLabel}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">画幅比例</p>
                <p className="text-xs font-medium text-slate-200 font-mono">{currentTemplate.ratio.split(' ')[0]}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">创建时间</p>
                <p className="text-xs font-medium text-slate-200">{formatDate(firstTask?.createdAt)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">图片数量</p>
                <p className="text-xs font-medium text-slate-200">{total} 张</p>
              </div>
            </div>
            {loadError ? <p className="mt-3 text-xs text-rose-300/80 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{loadError}</p> : null}
          </section>

        </div>

        {/* 底部操作区 */}
        <div className="p-6 border-t border-white/[0.04] bg-white/[0.01] flex flex-col gap-3">
          <button 
            type="button" 
            onClick={handleDownloadZip} 
            disabled={succeededCount === 0 || downloadingZip || isGenerating} 
            className="w-full relative group overflow-hidden rounded-2xl bg-[#5e6ad2] text-white px-4 py-3.5 text-sm font-semibold transition-all hover:bg-[#7170ff] active:scale-[0.98] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(113,112,255,0.15)]"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              {downloadingZip ? '正在打包压缩包...' : '下载压缩包'}
            </span>
            <div className="absolute inset-0 top-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <button 
            type="button" 
            onClick={() => void handleRegenerateBatch()} 
            disabled={regenerating || isGenerating} 
            className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {regenerating ? (
              <svg className="h-4 w-4 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
            {regenerating ? '正在重新生成...' : '重新生成一批'}
          </button>
          <p className="text-xs leading-6 text-slate-500">
            重新生成会沿用当前模型：{currentModelLabel}
          </p>
        </div>
      </aside>

      {/* 右侧主画布 - 高端画廊风格 */}
      <section className="tj-canvas relative bg-[#020202]">
        {/* 全局网格背景辅助线 */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="absolute top-6 right-8 flex items-center gap-3 z-50">
          {firstTask?.orderId ? (
            <button type="button" onClick={() => navigate(`/generate/${firstTask.orderId}`)} className="tj-button-secondary py-2 px-5 min-h-0 rounded-full text-xs bg-white/[0.02] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] shadow-xl">返回工作台</button>
          ) : null}
          <button type="button" onClick={() => navigate('/history')} className="tj-button-secondary py-2 px-5 min-h-0 rounded-full text-xs bg-white/[0.02] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] shadow-xl">历史记录</button>
          <button type="button" onClick={() => navigate('/')} className="tj-button-secondary py-2 px-5 min-h-0 rounded-full text-xs bg-white/[0.02] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] shadow-xl">退出工作台</button>
        </div>
        
        <div className="tj-canvas-scroll relative w-full h-full p-6 md:p-10 flex flex-col items-center">
          
          {hasBlockingLoadError ? (
            <div className="flex-1 w-full flex items-center justify-center max-w-2xl animate-in fade-in duration-700">
              <div className="w-full relative tj-panel border-rose-500/20 bg-rose-500/[0.02] p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-medium tracking-tight text-white mb-2">任务状态读取失败</h2>
                <p className="text-sm leading-7 text-slate-400 mb-8">{loadError}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button type="button" onClick={() => window.location.reload()} className="tj-button-primary">重新加载</button>
                  <button type="button" onClick={() => navigate('/history')} className="tj-button-secondary">返回历史记录</button>
                </div>
              </div>
            </div>
          ) : !firstTask || isGenerating ? (
            <div className="flex-1 w-full flex items-center justify-center">
              <GeneratingLoader templateName={currentTemplate.name} />
            </div>
          ) : failedCount === total ? (
            <div className="flex-1 w-full flex items-center justify-center max-w-2xl animate-in fade-in duration-700">
              <div className="w-full relative tj-panel border-rose-500/20 bg-rose-500/[0.02] p-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-medium tracking-tight text-white mb-2">本批次生成失败</h2>
                <p className="text-sm leading-7 text-slate-400 mb-8">所有图片都未成功返回。这通常是由于提示词被安全策略拦截或上游模型波动导致。</p>
                <div className="w-full text-left space-y-3">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="rounded-2xl border border-rose-400/10 bg-rose-500/5 p-4 flex gap-4 items-start">
                      <span className="text-xs font-mono text-rose-400/60 mt-0.5">#{index + 1}</span>
                      <p className="text-sm text-rose-200/80">{task.errorMessage ?? '生成失败，请稍后重试。'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[1600px] animate-in fade-in duration-700 pt-16">
              
              <div className="mb-10 flex flex-col items-center text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-mono mb-3">结果画廊</p>
                <h2 className="text-3xl font-medium tracking-tight text-white md:text-4xl">渲染结果已就绪</h2>
                <p className="mt-3 text-sm text-slate-400">将光标悬浮在图像上以进行高画质下载或复制链接。</p>
                {failedCount > 0 ? (
                  <p className="mt-4 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
                    本批次共 {succeededCount} 张成功，{failedCount} 张失败。成功结果可先下载，失败项可稍后重新生成。
                  </p>
                ) : null}
              </div>
              
              {/* 瀑布流/网格画廊 */}
              <div className={`grid gap-6 ${gridClass}`}>
                {tasks.map((task, index) => {
                  const isSuccess = task.status === 'succeeded' && task.resultUrl;
                  const isFailed = task.status === 'failed';
                  
                  return (
                    <article 
                      key={task.id} 
                      className={`relative group rounded-[28px] overflow-hidden border transition-all duration-500 ${
                        isSuccess ? 'border-white/[0.04] bg-white/[0.01] hover:border-white/10 hover:shadow-2xl' 
                        : isFailed ? 'border-rose-500/10 bg-rose-500/[0.02]' 
                        : 'border-white/[0.04] bg-white/[0.01]'
                      }`}
                    >
                      {/* 画幅骨架保持比例 */}
                      <div className={`w-full ${currentTemplate.id === 'detail' ? 'aspect-[3/4]' : currentTemplate.id === 'poster' ? 'aspect-[16/9]' : 'aspect-square'} relative flex items-center justify-center bg-[#0a0a0c]`}>
                        
                        {isSuccess ? (
                          <>
                            <img src={resolveApiUrl(task.resultUrl!)} alt={`第 ${index + 1} 张结果图`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                            {/* 悬浮操作遮罩 */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px] flex flex-col justify-end p-6">
                              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex gap-3">
                                <button 
                                  type="button" 
                                  onClick={() => handleDownloadSingle(task)} 
                                  className="flex-1 bg-white text-black px-4 py-3 rounded-2xl text-xs font-semibold hover:bg-slate-200 transition-colors shadow-xl flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                  保存图像
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => void handleCopyLink(task)} 
                                  className="px-4 py-3 rounded-2xl border border-white/20 bg-white/10 text-white hover:bg-white/20 text-xs font-semibold transition-colors backdrop-blur-md shadow-xl flex items-center justify-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                  {copyState[task.id] ? '已复制' : '链接'}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : isFailed ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                            <svg className="w-8 h-8 text-rose-500/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            <p className="text-xs text-rose-400/60 leading-relaxed line-clamp-3">{task.errorMessage ?? '生成失败，请稍后重试。'}</p>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-2 border-white/10 border-t-[#7170ff] rounded-full animate-spin mb-4" />
                            <p className="text-[10px] tracking-widest font-mono text-slate-500">
                              {task.status === 'processing' ? '模型生成中' : '任务排队中'}
                            </p>
                          </div>
                        )}
                        
                        {/* 左上角状态角标 */}
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 z-10 shadow-lg">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuccess ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : isFailed ? 'bg-rose-400 shadow-[0_0_6px_#fb7185]' : 'bg-amber-400 animate-pulse'}`} />
                          <span className="text-[9px] font-mono font-medium text-white/90 uppercase tracking-wider">
                            {isSuccess ? '完成' : isFailed ? '失败' : getTaskStatusText(task.status)}
                          </span>
                        </div>
                        
                        {/* 右上角索引号 */}
                        <div className="absolute top-4 right-4 px-2 py-1 rounded bg-black/40 backdrop-blur-md text-[9px] font-mono text-white/50 border border-white/5 z-10">
                          #{index + 1}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

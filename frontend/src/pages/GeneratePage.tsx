import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTemplateById } from '../components/template-options'
import { useCreateTask } from '../api/tasks'
import { normalizeErrorMessage } from '../api/client'

const STORAGE_KEYS = {
  selectedTemplate: 'tujing.selectedTemplate',
  generationPrompt: 'tujing.generationPrompt',
  currentTaskId: 'tujing.currentTaskId',
}

export default function GeneratePage() {
  const navigate = useNavigate()
  const [selectedTemplate, setSelectedTemplate] = useState('amazon')
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(2)
  const [note, setNote] = useState('')
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const createTask = useCreateTask()

  useEffect(() => {
    const storedTemplate = localStorage.getItem(STORAGE_KEYS.selectedTemplate)
    const storedPrompt = localStorage.getItem(STORAGE_KEYS.generationPrompt)
    const initialTemplate = storedTemplate ?? 'amazon'
    const template = getTemplateById(initialTemplate)
    setSelectedTemplate(initialTemplate)
    setPrompt(storedPrompt ?? template.samplePrompts[0])
  }, [])

  useEffect(() => {
    let cancelled = false

    const checkBackend = async () => {
      try {
        const response = await fetch('/api/health')
        if (!cancelled) {
          setBackendReady(response.ok)
        }
      } catch {
        if (!cancelled) {
          setBackendReady(false)
        }
      }
    }

    void checkBackend()
    return () => {
      cancelled = true
    }
  }, [])

  const currentTemplate = getTemplateById(selectedTemplate)

  const handleSubmit = async () => {
    if (!prompt.trim() || backendReady === false) return
    localStorage.setItem(STORAGE_KEYS.selectedTemplate, selectedTemplate)
    localStorage.setItem(STORAGE_KEYS.generationPrompt, prompt.trim())

    try {
      const data = await createTask.mutateAsync({
        template: selectedTemplate,
        prompt: prompt.trim(),
        count,
        note: note.trim() || undefined,
      })
      localStorage.setItem(STORAGE_KEYS.currentTaskId, data.taskId)
      navigate(`/result/${data.taskId}`)
    } catch (error) {
      console.error('[generate] create task failed', error)
      alert(normalizeErrorMessage(error, '创建任务失败，请稍后重试。'))
    }
  }

  const isGenerating = createTask.isPending
  const canSubmit = backendReady !== false && !!prompt.trim() && !isGenerating

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#08090a] text-slate-300 antialiased selection:bg-[#7170ff]/30">
      <aside className="flex w-[340px] flex-col border-r border-white/5 bg-[#0b0c10] shadow-2xl z-10 relative">
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gradient-to-br from-[#7170ff] to-[#5e6ad2] text-xs font-bold text-white shadow-lg shadow-[#7170ff]/20">T</div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">图鲸 Studio</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Workspace</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide space-y-8">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">出图模板</label>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-slate-400 border border-white/5">Step 1</span>
            </div>
            <div className="grid gap-2">
              {[
                { id: 'amazon', name: '电商主图', ratio: '1:1', desc: '纯色背景/突出主体' },
                { id: 'detail', name: '详情长图', ratio: '3:4', desc: '竖版展示/结构清晰' },
                { id: 'poster', name: '营销海报', ratio: '16:9', desc: '横版/视觉冲击感' },
              ].map((tpl) => (
                <button key={tpl.id} onClick={() => { setSelectedTemplate(tpl.id); setPrompt(getTemplateById(tpl.id).samplePrompts[0]) }}
                  className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${selectedTemplate === tpl.id ? 'border-[#7170ff]/50 bg-[#7170ff]/10 ring-1 ring-[#7170ff]/20' : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'}`}>
                  <div className="flex w-full items-center justify-between">
                    <span className={`text-sm font-medium ${selectedTemplate === tpl.id ? 'text-[#c7c8ff]' : 'text-slate-200'}`}>{tpl.name}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-black/30 px-1.5 py-0.5 rounded">{tpl.ratio}</span>
                  </div>
                  <span className="text-xs text-slate-500">{tpl.desc}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">画面描述 Prompt</label>
              <button onClick={() => setPrompt(currentTemplate.samplePrompts[0])} className="text-[10px] text-[#7170ff] hover:text-white transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                恢复默认
              </button>
            </div>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="描述你想要的画面，越具体越好..."
              className="w-full h-32 resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-[#7170ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7170ff]/30 transition-all" />
          </section>
          <section className="space-y-3">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">生成数量</label>
            <div className="rounded-xl border border-white/5 bg-white/[0.01] p-1 flex">
              {[1, 2, 3, 4].map(num => (
                <button key={num} onClick={() => setCount(num)}
                  className={`flex-1 text-xs py-1.5 rounded-lg transition-colors ${count === num ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-slate-500 hover:text-slate-300'}`}>
                  {num} 张
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">客户备注</label>
              <span className="text-[10px] text-slate-500">选填</span>
            </div>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="订单号 / 客户名称 / 备注..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#7170ff]/50 focus:outline-none focus:ring-1 focus:ring-[#7170ff]/30 transition-all" />
          </section>
        </div>
        <div className="border-t border-white/5 bg-[#0b0c10] p-6 pb-8">
          <button onClick={handleSubmit} disabled={!canSubmit}
            className={`w-full relative group overflow-hidden rounded-xl bg-[#5e6ad2] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#7170ff] active:scale-[0.98] ${isGenerating ? 'opacity-80 cursor-wait' : 'hover:shadow-glow'}`}>
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" /></svg>
                正在发起任务...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                开始生成
              </span>
            )}
            <div className="absolute inset-0 top-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-t-xl" />
          </button>
          <p className="text-center text-[10px] text-slate-500 mt-3">
            {backendReady === false
              ? '后端未连接，请先启动 8000 端口服务。'
              : backendReady === null
                ? '正在检查后端连接状态...'
                : '点击后会先创建任务，再跳转到结果页轮询生成状态。'}
          </p>
        </div>
      </aside>
      <main className="relative flex-1 bg-[#08090a] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px] flex flex-col items-center justify-center p-8">
        <div className="absolute top-6 right-8 flex items-center gap-3">
          <button onClick={() => navigate('/history')} className="text-xs text-slate-400 hover:text-white transition-colors border border-white/10 rounded-full px-4 py-1.5 bg-black/20 backdrop-blur-sm shadow-soft">历史订单</button>
          <button onClick={() => navigate('/')} className="text-xs text-slate-400 hover:text-white transition-colors border border-white/10 rounded-full px-4 py-1.5 bg-black/20 backdrop-blur-sm shadow-soft">退出工作台</button>
        </div>
        <div className={`relative w-full max-w-2xl ${selectedTemplate === 'detail' ? 'aspect-[3/4]' : selectedTemplate === 'poster' ? 'aspect-[16/9]' : 'aspect-square'} border border-white/5 bg-[#0f1011] rounded-2xl shadow-panel flex flex-col items-center justify-center transition-all duration-700 ${isGenerating ? 'ring-1 ring-[#7170ff]/30 shadow-glow' : ''}`}>
          {isGenerating ? (
            <div className="flex flex-col items-center gap-6 animate-pulse">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#7170ff]/40 flex items-center justify-center bg-[#7170ff]/5">
                <svg className="w-8 h-8 text-[#7170ff] animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-slate-200">正在打包提示词并创建任务</p>
                <p className="text-xs text-slate-500">即将跳转到云端渲染页面...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 opacity-60">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm text-slate-400">在左侧输入参数，开始生成图像</p>
            </div>
          )}
          <div className="absolute bottom-4 text-center w-full">
            <span className="text-[10px] text-slate-600 font-mono tracking-widest">CANVAS WORKSPACE // TUJING MVP</span>
          </div>
        </div>
      </main>
    </div>
  )
}

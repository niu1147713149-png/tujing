import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getTemplateById, TEMPLATE_OPTIONS } from '../components/template-options'
import GeneratingLoader from '../components/GeneratingLoader'
import { useCreateTask, useModels } from '../api/tasks'
import { BASE_URL, normalizeErrorMessage } from '../api/client'
import { getOrder } from '../api/orders'

const STORAGE_KEYS = {
  selectedTemplate: 'tujing.selectedTemplate',
  selectedModel: 'tujing.selectedModel',
  generationPrompt: 'tujing.generationPrompt',
  currentTaskId: 'tujing.currentTaskId',
}

const SAMPLE_PROMPTS_PER_BATCH = 3

export default function GeneratePage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  
  const [selectedTemplate, setSelectedTemplate] = useState('amazon')
  const [selectedPromptGroup, setSelectedPromptGroup] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [count, setCount] = useState(2)
  const [orderNote, setOrderNote] = useState('未命名订单')
  const [backendReady, setBackendReady] = useState<boolean | null>(null)
  const [samplePromptBatch, setSamplePromptBatch] = useState(0)
  
  const createTask = useCreateTask()
  const { data: modelsData, error: modelsError } = useModels()

  useEffect(() => {
    if (!orderId) {
      navigate('/')
      return
    }

    let cancelled = false
    const loadOrder = async () => {
      try {
        const order = await getOrder(orderId)
        if (!cancelled) {
          setOrderNote(order.note || '未命名订单')
        }
      } catch {
        if (!cancelled) {
          navigate('/history')
        }
      }
    }

    void loadOrder()
    return () => { cancelled = true }
  }, [orderId, navigate])

  useEffect(() => {
    const storedTemplate = localStorage.getItem(STORAGE_KEYS.selectedTemplate)
    const storedPrompt = localStorage.getItem(STORAGE_KEYS.generationPrompt)
    const initialTemplate = storedTemplate ?? 'amazon'
    const template = getTemplateById(initialTemplate)
    setSelectedTemplate(initialTemplate)
    setSelectedPromptGroup(template.promptGroups[0]?.id ?? '')
    setPrompt(storedPrompt ?? template.samplePrompts[0])
  }, [])

  useEffect(() => {
    if (!modelsData?.models.length) return

    const storedModel = localStorage.getItem(STORAGE_KEYS.selectedModel)
    const availableIds = new Set(modelsData.models.map((model) => model.id))
    const fallbackModel = availableIds.has(modelsData.defaultModel)
      ? modelsData.defaultModel
      : modelsData.models[0]?.id ?? ''
    const nextModel = [
      storedModel,
      selectedModel,
      fallbackModel,
    ].find((candidate) => candidate && availableIds.has(candidate)) ?? ''

    if (!nextModel) return
    if (nextModel !== selectedModel) {
      setSelectedModel(nextModel)
    }
    localStorage.setItem(STORAGE_KEYS.selectedModel, nextModel)
  }, [modelsData, selectedModel])

  useEffect(() => {
    let cancelled = false
    const checkBackend = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/health`)
        if (!cancelled) setBackendReady(response.ok)
      } catch {
        if (!cancelled) setBackendReady(false)
      }
    }
    void checkBackend()
    return () => { cancelled = true }
  }, [])

  const currentTemplate = getTemplateById(selectedTemplate)
  const currentPromptGroup =
    currentTemplate.promptGroups.find((group) => group.id === selectedPromptGroup)
    ?? currentTemplate.promptGroups[0]
  const selectedModelMeta = modelsData?.models.find((model) => model.id === selectedModel) ?? null
  const modelsErrorMessage = modelsError
    ? normalizeErrorMessage(modelsError, '模型配置暂不可用，请检查配置后重试。')
    : ''
  const samplePromptBatchCount = Math.max(
    1,
    Math.ceil(currentPromptGroup.prompts.length / SAMPLE_PROMPTS_PER_BATCH),
  )
  const visibleSamplePrompts = useMemo(() => {
    const startIndex = samplePromptBatch * SAMPLE_PROMPTS_PER_BATCH
    return currentPromptGroup.prompts.slice(startIndex, startIndex + SAMPLE_PROMPTS_PER_BATCH)
  }, [currentPromptGroup.prompts, samplePromptBatch])

  const handleTemplateSelect = (templateId: string) => {
    const nextTemplate = getTemplateById(templateId)
    setSelectedTemplate(templateId)
    setSelectedPromptGroup(nextTemplate.promptGroups[0]?.id ?? '')
    setPrompt(nextTemplate.samplePrompts[0])
    setSamplePromptBatch(0)
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    localStorage.setItem(STORAGE_KEYS.selectedModel, modelId)
  }

  const handleApplySamplePrompt = (samplePrompt: string) => {
    setPrompt(samplePrompt)
  }

  const handlePromptGroupSelect = (groupId: string) => {
    setSelectedPromptGroup(groupId)
    setSamplePromptBatch(0)
  }

  const handleCycleSamplePrompts = () => {
    setSamplePromptBatch((current) => (current + 1) % samplePromptBatchCount)
  }

  const handleSubmit = async () => {
    if (!prompt.trim() || backendReady === false) return
    localStorage.setItem(STORAGE_KEYS.selectedTemplate, selectedTemplate)
    localStorage.setItem(STORAGE_KEYS.generationPrompt, prompt.trim())

    try {
      const data = await createTask.mutateAsync({
        template: selectedTemplate,
        prompt: prompt.trim(),
        count,
        note: orderNote,
        orderId,
        modelId: selectedModel || undefined,
      })
      localStorage.setItem(STORAGE_KEYS.currentTaskId, data.taskId)
      navigate(`/result/${data.taskId}`)
    } catch (error) {
      console.error('[generate] create task failed', error)
      alert(normalizeErrorMessage(error, '创建任务失败，请稍后重试。'))
    }
  }

  const isGenerating = createTask.isPending
  const modelsReady = !!modelsData?.models.length && !!selectedModel && !modelsErrorMessage
  const canSubmit = backendReady === true && !!prompt.trim() && !isGenerating && modelsReady

  return (
    <main className="tj-studio">
      {/* 高级极简侧边栏 */}
      <aside className="tj-sidebar w-full lg:w-[360px] bg-[#050505] border-white/[0.04]">
        
        {/* 顶部订单信息栏 */}
        <header className="px-6 py-5 border-b border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">工作台</span>
            </div>
            <span className="text-[10px] text-slate-600 font-mono">{orderId}</span>
          </div>
          <h2 className="mt-2 text-sm font-medium text-white truncate pr-4" title={orderNote}>{orderNote}</h2>
        </header>

        <div className="tj-sidebar-scroll flex-1 px-0 py-0 gap-0 overflow-x-hidden">
          
          {/* 核心区：Prompt 输入 */}
          <section className="p-6 border-b border-white/[0.04]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-slate-300">提示词 / 画面描述</label>
              <button type="button" onClick={() => setPrompt(currentPromptGroup.prompts[0] ?? currentTemplate.samplePrompts[0])} className="text-[10px] text-[#7170ff] hover:text-[#c7c8ff] transition-colors flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                恢复默认提示词
              </button>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#7170ff]/30 to-[#3b82f6]/30 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
              <textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                placeholder="描述您的商品特征、光影、背景结构..."
                className="relative w-full h-40 resize-none rounded-[22px] border border-white/[0.08] bg-[#0a0a0c] px-5 py-4 text-sm leading-relaxed text-slate-200 placeholder:text-slate-600 focus:border-[#7170ff]/40 focus:bg-[#0f1014] focus:outline-none transition-all shadow-inner scrollbar-hide" 
              />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-medium text-slate-400">推荐默认提示词</p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">{currentPromptGroup.prompts.length} 条可选</span>
                  {samplePromptBatchCount > 1 ? (
                    <button
                      type="button"
                      onClick={handleCycleSamplePrompts}
                      className="text-[10px] text-[#7170ff] hover:text-[#c7c8ff] transition-colors"
                    >
                      换一批
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {currentTemplate.promptGroups.map((group) => {
                  const isSelected = currentPromptGroup.id === group.id
                  return (
                    <button
                      key={`${currentTemplate.id}-${group.id}`}
                      type="button"
                      onClick={() => handlePromptGroupSelect(group.id)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] transition-all ${
                        isSelected
                          ? 'border-[#7170ff]/40 bg-[#7170ff]/12 text-slate-100'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      {group.label}
                    </button>
                  )
                })}
              </div>
              <div className="grid gap-2">
                {visibleSamplePrompts.map((samplePrompt, index) => {
                  const isActive = prompt.trim() === samplePrompt
                  const displayIndex = samplePromptBatch * SAMPLE_PROMPTS_PER_BATCH + index + 1
                  return (
                    <button
                      key={`${currentTemplate.id}-${displayIndex}`}
                      type="button"
                      onClick={() => handleApplySamplePrompt(samplePrompt)}
                      className={`rounded-2xl border px-4 py-3 text-left text-xs leading-6 transition-all ${
                        isActive
                          ? 'border-[#7170ff]/40 bg-[#7170ff]/10 text-slate-100'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-slate-200'
                      }`}
                    >
                      <span className="mr-2 text-[10px] text-slate-500">推荐 {displayIndex}</span>
                      {samplePrompt}
                    </button>
                  )
                })}
              </div>
            </div>
          </section>

          {/* 设置区 */}
          <section className="p-6 space-y-8">
            
            {/* 模板/尺寸选择：网格化UI */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-slate-300">画幅 / 场景</label>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TEMPLATE_OPTIONS.map((tpl) => (
                  <button 
                    key={tpl.id} 
                    type="button" 
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                      selectedTemplate === tpl.id 
                        ? 'border-[#7170ff]/50 bg-[#7170ff]/10 text-white shadow-[0_0_20px_rgba(113,112,255,0.15)]' 
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <div className={`mb-2 border-2 rounded ${
                      selectedTemplate === tpl.id ? 'border-[#c7c8ff]' : 'border-slate-500'
                    } ${tpl.id === 'amazon' ? 'w-5 h-5' : tpl.id === 'detail' ? 'w-4 h-6' : 'w-6 h-4'}`} />
                    <span className="text-[10px] font-medium mb-1">{tpl.name}</span>
                    <span className="text-[9px] font-mono opacity-50">{tpl.ratio.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-[11px] text-slate-500 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/[0.04]">
                <span className="text-[#7170ff] mr-1">说明</span> {currentTemplate.description}
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-slate-300">模型选择</label>
                <span className="text-[10px] font-mono text-slate-500">
                  {modelsErrorMessage ? '配置异常' : selectedModelMeta?.name ?? '读取中...'}
                </span>
              </div>
              <div className="relative p-1 rounded-2xl bg-[#0a0a0c] border border-white/[0.06] flex flex-wrap gap-1">
                {(modelsData?.models ?? []).map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => handleModelSelect(model.id)}
                    className={`relative z-10 min-w-[110px] flex-1 px-3 py-2 text-xs font-medium rounded-xl transition-all duration-300 ${
                      selectedModel === model.id ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {selectedModel === model.id ? (
                      <div className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] rounded-xl" />
                    ) : null}
                    <span className="relative">{model.name}</span>
                  </button>
                ))}
                {!modelsData?.models.length ? (
                  <div className="w-full px-3 py-2 text-xs text-slate-500 text-center">模型列表加载中...</div>
                ) : null}
              </div>
              {modelsErrorMessage ? (
                <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-xs leading-6 text-rose-100">
                  {modelsErrorMessage}
                </p>
              ) : null}
            </div>

            {/* 生成数量：分段控制器 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-medium text-slate-300">生成数量</label>
                <span className="text-[10px] font-mono text-slate-500">{count} 张</span>
              </div>
              <div className="relative p-1 rounded-2xl bg-[#0a0a0c] border border-white/[0.06] flex">
                {[1, 2, 3, 4].map(num => (
                  <button 
                    key={num} 
                    type="button" 
                    onClick={() => setCount(num)}
                    className={`relative z-10 flex-1 py-2 text-xs font-medium rounded-xl transition-all duration-300 ${
                      count === num ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {count === num && (
                      <div className="absolute inset-0 bg-white/[0.08] border border-white/[0.08] rounded-xl" />
                    )}
                    <span className="relative">{num}</span>
                  </button>
                ))}
              </div>
            </div>

          </section>
        </div>
        
        {/* 底部悬浮提交区 */}
        <div className="p-6 border-t border-white/[0.04] bg-white/[0.01]">
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={!canSubmit} 
            className="w-full relative group overflow-hidden rounded-2xl bg-white text-black px-4 py-4 text-sm font-bold transition-all hover:bg-slate-200 active:scale-[0.98] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(255,255,255,0.08)]"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="h-4 w-4 animate-spin text-black disabled:text-white/30" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75" /></svg>
                正在排队生成...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 relative z-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                立即生成
              </span>
            )}
            <div className="absolute inset-0 top-0 w-full h-1/2 bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          {backendReady === false ? (
            <p className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-3 text-xs leading-6 text-rose-100">
              当前无法连接后端服务，请先确认 8000 端口服务已启动，再继续提交生成任务。
            </p>
          ) : null}
          <div className="mt-4 flex items-center justify-between px-1">
            <span className="text-[10px] text-slate-500 font-mono tracking-wider">
              提交后将跳转到结果页
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${modelsErrorMessage ? 'bg-rose-400' : backendReady ? 'bg-emerald-400' : backendReady === false ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
              <span className="text-[10px] text-slate-500 font-mono">
                {modelsErrorMessage
                  ? '模型配置异常'
                  : backendReady
                    ? '引擎已就绪'
                    : backendReady === false
                      ? '引擎离线'
                      : '连接中...'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 右侧主画布：深空无限画板风格 */}
      <section className="tj-canvas relative bg-[#020202]">
        {/* 全局网格背景辅助线 */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="absolute top-6 right-8 flex items-center gap-3 z-50">
            <button type="button" onClick={() => navigate('/history', { state: { fromOrderId: orderId } })} className="tj-button-secondary py-2 px-5 min-h-0 rounded-full text-xs bg-white/[0.02] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] shadow-xl">历史记录</button>
          <button type="button" onClick={() => navigate('/')} className="tj-button-secondary py-2 px-5 min-h-0 rounded-full text-xs bg-white/[0.02] backdrop-blur-xl border-white/10 hover:bg-white/[0.06] shadow-xl">退出工作台</button>
        </div>
        
        <div className="tj-canvas-scroll flex flex-col items-center justify-center relative w-full h-full p-8 md:p-12">
          {isGenerating ? (
            <GeneratingLoader templateName={currentTemplate.name} />
          ) : (
            <div className="relative flex flex-col items-center justify-center w-full h-full max-w-5xl animate-in fade-in duration-1000">
              
              {/* 高级空状态指示器，根据所选尺寸动态变化 */}
              <div className={`relative w-full ${selectedTemplate === 'detail' ? 'aspect-[3/4] max-w-[400px]' : selectedTemplate === 'poster' ? 'aspect-[16/9] max-w-[800px]' : 'aspect-square max-w-[500px]'} transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center justify-center group`}>
                
                {/* 悬浮呼吸边框 */}
                <div className="absolute inset-0 rounded-[32px] border-2 border-dashed border-white/[0.08] group-hover:border-[#7170ff]/30 bg-[#050505]/40 backdrop-blur-sm transition-colors duration-500" />
                
                {/* 中心发光点 */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7170ff]/10 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center text-center p-8 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-16 h-16 mb-6 rounded-[20px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-[#7170ff]/40 group-hover:from-[#7170ff]/20 transition-all duration-500">
                    <svg className="w-7 h-7 text-white group-hover:text-[#c7c8ff] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  
                  <h3 className="text-xl font-medium text-white mb-2 tracking-wide">可以开始生成</h3>
                  <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed">
                    在左侧面板完善您的商品描述<br/>
                    图鲸 V2 引擎随时为您渲染高品质画面
                  </p>
                  
                  {/* 底部参数小标 */}
                  <div className="mt-8 flex items-center justify-center gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 opacity-80 shadow-[0_0_8px_#34d399]" /> 
                      {currentTemplate.ratio.split(' ')[0]}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7170ff] opacity-80 shadow-[0_0_8px_#7170ff]" />
                      {selectedModelMeta?.name ?? '默认模型'}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.05] bg-white/[0.02] backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 opacity-80 shadow-[0_0_8px_#38bdf8]" /> 
                      共 {count} 张
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

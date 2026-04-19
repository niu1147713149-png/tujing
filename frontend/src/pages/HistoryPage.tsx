import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTemplateById } from '../components/template-options'
import { resolveApiUrl, useDeleteOrder, useOrders } from '../api/orders'
import { useModels } from '../api/tasks'
import NewOrderModal from '../components/NewOrderModal'
import { normalizeErrorMessage } from '../api/client'

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return value }
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingOrderId, setDeletingOrderId] = useState('')
  const { data: modelsData } = useModels()
  const { data: orders = [], isLoading: loading, error: queryError } = useOrders()
  const deleteOrder = useDeleteOrder()
  const error = queryError instanceof Error ? queryError.message : queryError ? '加载历史记录失败。' : ''
  const modelNameMap = useMemo(
    () => new Map((modelsData?.models ?? []).map((model) => [model.id, model.name])),
    [modelsData],
  )

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders
    const keyword = search.trim().toLowerCase()
    return orders.filter((order) => {
      const templateName = getTemplateById(order.previewTasks[0]?.template ?? 'amazon').name.toLowerCase()
      return order.note.toLowerCase().includes(keyword) || templateName.includes(keyword)
    })
  }, [orders, search])

  const handleDeleteOrder = async (orderId: string, note: string) => {
    const confirmed = window.confirm(`确认彻底删除订单“${note || orderId}”吗？\n\n这会同时删除该订单下的历史任务和已生成图片，且无法恢复。`)
    if (!confirmed) return
    setDeletingOrderId(orderId)
    try {
      await deleteOrder.mutateAsync(orderId)
    } catch (error) {
      window.alert(normalizeErrorMessage(error, '删除订单失败，请稍后重试。'))
    } finally {
      setDeletingOrderId('')
    }
  }

  const handleEnterOrder = (orderId: string, latestTaskId: string | null) => {
    if (latestTaskId) {
      navigate(`/result/${latestTaskId}`)
      return
    }
    navigate(`/generate/${orderId}`)
  }

  return (
    <main className="tj-page">
      <div className="tj-glow-orb left-[-100px] top-[80px] h-[260px] w-[260px] bg-[#7170ff]/14" />
      <div className="tj-glow-orb right-[-120px] top-[220px] h-[280px] w-[280px] bg-sky-500/10" />
      <div className="tj-container py-8 md:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tj-eyebrow">订单历史</p>
            <h1 className="tj-title-page mt-3">历史记录（订单）</h1>
            <p className="tj-body mt-4 max-w-2xl">当前页面按订单维度展示历史生成记录。你可以继续回到订单工作台补充提示词、重新生成或清理旧订单。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setIsModalOpen(true)} className="tj-button-primary">新建订单</button>
            <button type="button" onClick={() => navigate('/')} className="tj-button-secondary">返回首页</button>
          </div>
        </header>
        <section className="mt-10 grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="tj-panel h-fit p-5 md:p-6">
            <p className="tj-eyebrow">搜索 / 筛选</p>
            <h2 className="mt-3 text-2xl font-medium text-white">定位结果</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">支持按客户备注或模板名搜索。</p>
            <input aria-label="搜索订单" value={search} onChange={(e) => setSearch(e.target.value)} className="tj-input mt-6" placeholder="搜索备注或模板名..." />
            <div className="mt-6 space-y-3">
              <div className="tj-panel-soft p-4">
                <p className="tj-eyebrow">批次数量</p>
                <p className="mt-3 text-3xl font-medium text-white">{orders.length}</p>
                <p className="mt-2 text-sm text-slate-400">当前最多展示最近 50 个订单。</p>
              </div>
            </div>
          </aside>
          <section className="space-y-4">
            {loading ? (
              <div className="grid gap-4">{[1, 2, 3].map(i => (<div key={i} className="tj-panel p-5 md:p-6"><div className="h-28 rounded-[24px] bg-white/[0.05] animate-pulse" /></div>))}</div>
            ) : error ? (
              <div className="tj-panel border-rose-400/15 bg-rose-500/10 p-6">
                <h2 className="text-2xl font-medium text-white">加载失败</h2>
                <p className="mt-3 text-sm leading-7 text-rose-100">{error}</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="tj-panel p-8 text-center md:p-12">
                <p className="tj-eyebrow">暂无记录</p>
                <h2 className="mt-4 text-3xl font-medium text-white">还没有历史记录</h2>
                <p className="mt-4 text-sm leading-7 text-slate-400">去开启你的第一个订单吧。</p>
                <button type="button" onClick={() => setIsModalOpen(true)} className="mt-6 tj-button-primary">立即新建订单</button>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const template = getTemplateById(order.previewTasks[0]?.template ?? 'amazon')
                const previewTasks = order.previewTasks.slice(0, 4)
                const isDeleting = deletingOrderId === order.id && deleteOrder.isPending
                const latestTaskModelId = order.previewTasks[0]?.providerModel ?? null
                const latestTaskModelName = latestTaskModelId
                  ? (modelNameMap.get(latestTaskModelId) ?? latestTaskModelId)
                  : null
                return (
                  <article key={order.id}
                    className="tj-panel flex w-full flex-col gap-5 p-5 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] md:p-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="hidden shrink-0 gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
                        {previewTasks.map(task => (
                          <div key={task.id} className="h-16 w-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                            {task.status === 'succeeded' && task.resultUrl ? <img src={resolveApiUrl(task.resultUrl)} alt={`${template.name} 缩略图`} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-white/[0.04]" />}
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tj-tag">{template.name}</span>
                          {latestTaskModelName ? <span className="tj-tag">{latestTaskModelName}</span> : null}
                          <span className="text-sm text-slate-300">{order.note}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-400">{formatDate(order.createdAt)} / 共 {order.taskCount} 张 / 订单 ID：{order.id}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{order.previewTasks[0]?.prompt ?? '该订单下还没有生成记录。'}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-4 text-sm xl:justify-end">
                      <div><p className="tj-eyebrow">成功</p><p className="mt-2 text-xl font-medium text-emerald-300">{order.succeededCount}</p></div>
                      <div><p className="tj-eyebrow">失败</p><p className="mt-2 text-xl font-medium text-rose-300">{order.failedCount}</p></div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleEnterOrder(order.id, order.latestTaskId)}
                          className="tj-button-secondary min-h-0 rounded-full px-4 py-2 text-xs"
                        >
                          {order.latestTaskId ? '查看最近任务' : '进入工作台'}
                        </button>
                        <button type="button" onClick={() => void handleDeleteOrder(order.id, order.note)} disabled={isDeleting}
                          className="min-h-0 rounded-full border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60">
                          {isDeleting ? '删除中...' : '删除订单'}
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </section>
        </section>
      </div>
      
      <NewOrderModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  )
}

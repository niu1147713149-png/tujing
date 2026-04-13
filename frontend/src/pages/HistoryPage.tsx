import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTemplateById } from '../components/template-options'
import { useTaskGroups } from '../api/tasks'

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  } catch { return value }
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data: groups = [], isLoading: loading, error: queryError } = useTaskGroups()
  const error = queryError instanceof Error ? queryError.message : queryError ? '加载历史订单失败。' : ''

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups
    const keyword = search.trim().toLowerCase()
    return groups.filter((group) => {
      const templateName = getTemplateById(group.tasks[0]?.template ?? 'amazon').name.toLowerCase()
      return (group.note ?? '').toLowerCase().includes(keyword) || templateName.includes(keyword)
    })
  }, [groups, search])

  return (
    <main className="tj-page">
      <div className="tj-glow-orb left-[-100px] top-[80px] h-[260px] w-[260px] bg-[#7170ff]/14" />
      <div className="tj-glow-orb right-[-120px] top-[220px] h-[280px] w-[280px] bg-sky-500/10" />
      <div className="tj-container py-8 md:py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="tj-eyebrow">History / Order Workspace</p>
            <h1 className="tj-title-page mt-3">历史订单</h1>
            <p className="tj-body mt-4 max-w-2xl">这里按批次聚合最近 50 组订单，用更像 Studio 档案柜的方式管理历史结果，而不是传统列表后台。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => navigate('/generate')} className="tj-button-primary">新建订单</button>
            <button type="button" onClick={() => navigate('/')} className="tj-button-secondary">返回首页</button>
          </div>
        </header>
        <section className="mt-10 grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="tj-panel h-fit p-5 md:p-6">
            <p className="tj-eyebrow">Search / Filter</p>
            <h2 className="mt-3 text-2xl font-medium text-white">定位订单</h2>
            <p className="mt-3 text-sm leading-7 text-slate-400">支持按客户备注或模板名搜索，优先服务批量接单场景。</p>
            <input aria-label="搜索订单" value={search} onChange={(e) => setSearch(e.target.value)} className="tj-input mt-6" placeholder="搜索备注或模板名..." />
            <div className="mt-6 space-y-3">
              <div className="tj-panel-soft p-4">
                <p className="tj-eyebrow">订单数量</p>
                <p className="mt-3 text-3xl font-medium text-white">{groups.length}</p>
                <p className="mt-2 text-sm text-slate-400">当前最多展示最近 50 组。</p>
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
            ) : filteredGroups.length === 0 ? (
              <div className="tj-panel p-8 text-center md:p-12">
                <p className="tj-eyebrow">Archive / Empty</p>
                <h2 className="mt-4 text-3xl font-medium text-white">还没有历史订单</h2>
                <p className="mt-4 text-sm leading-7 text-slate-400">先去生成第一批图片，随后这里会自动成为你的接单档案库。</p>
                <button type="button" onClick={() => navigate('/generate')} className="mt-6 tj-button-primary">去生成第一批图片</button>
              </div>
            ) : (
              filteredGroups.map((group) => {
                const template = getTemplateById(group.tasks[0]?.template ?? 'amazon')
                const successCount = group.tasks.filter(t => t.status === 'succeeded').length
                const failCount = group.tasks.filter(t => t.status === 'failed').length
                const previewTasks = group.tasks.slice(0, 4)
                return (
                  <button key={group.groupId} type="button" onClick={() => navigate(`/result/${group.tasks[0]?.id}`)}
                    className="tj-panel flex w-full flex-col gap-5 p-5 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04] md:p-6 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <div className="hidden shrink-0 gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
                        {previewTasks.map(task => (
                          <div key={task.id} className="h-16 w-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                            {task.status === 'succeeded' && task.resultUrl ? <img src={task.resultUrl} alt={`${template.name} 缩略图`} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-white/[0.04]" />}
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="tj-tag">{template.name}</span>
                          <span className="text-sm text-slate-300">{group.note ?? '未填写备注'}</span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-slate-400">{formatDate(group.createdAt)} / 共 {group.tasks.length} 张 / 批次 ID：{group.groupId}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-500">{group.tasks[0]?.prompt}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-6 text-sm">
                      <div><p className="tj-eyebrow">Success</p><p className="mt-2 text-xl font-medium text-emerald-300">{successCount}</p></div>
                      <div><p className="tj-eyebrow">Failed</p><p className="mt-2 text-xl font-medium text-rose-300">{failCount}</p></div>
                    </div>
                  </button>
                )
              })
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

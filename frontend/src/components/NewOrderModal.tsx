import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createOrder } from '../api/orders'
import { normalizeErrorMessage } from '../api/client'

type NewOrderModalProps = {
  isOpen: boolean
  onClose: () => void
  initialPrompt?: string
}

export default function NewOrderModal({ isOpen, onClose, initialPrompt = '' }: NewOrderModalProps) {
  const navigate = useNavigate()
  const [note, setNote] = useState('')
  const [prompt, setPrompt] = useState(initialPrompt)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setPrompt(initialPrompt)
      setNote('')
    }
  }, [isOpen, initialPrompt])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const order = await createOrder({ note: note.trim() })
      if (prompt.trim()) {
        localStorage.setItem('tujing.generationPrompt', prompt.trim())
      }
      navigate(`/generate/${order.id}`)
    } catch (error) {
      window.alert(normalizeErrorMessage(error, '创建订单失败，请稍后重试。'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="tj-panel relative w-full max-w-lg overflow-hidden p-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#7170ff]/10 to-[#3b82f6]/10 blur-xl pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="tj-eyebrow">新建订单</p>
              <h2 className="mt-2 text-2xl font-medium text-white">新建出图订单</h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3">
              <label className="tj-eyebrow">客户名称 / 订单备注 (必填)</label>
              <input
                autoFocus
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例如：王小姐的春季上新 / 批次 A..."
                className="tj-input"
                required
              />
              <p className="text-xs text-slate-500">进入工作台后，所有生成的图片将自动归档到该订单下。</p>
            </div>

            {prompt && (
              <div className="space-y-3">
                <label className="tj-eyebrow">已携带的基础提示词</label>
                <div className="tj-panel-soft p-3 text-sm text-slate-300 line-clamp-2">
                  {prompt}
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <button type="button" onClick={onClose} className="tj-button-secondary flex-1" disabled={creating}>取消</button>
              <button type="submit" disabled={!note.trim() || creating} className="tj-button-primary flex-1">{creating ? '正在创建订单...' : '进入专属工作台'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

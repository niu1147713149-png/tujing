import { useEffect, useMemo, useState } from 'react'

type GeneratingLoaderProps = {
  templateName: string
}

const baseMessages = [
  '正在整理画面结构与主体层级...',
  '正在等待上游模型返回图像结果...',
  '如果等待较久，通常是上游仍在处理中。',
]

export default function GeneratingLoader({ templateName }: GeneratingLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)

  const messages = useMemo(
    () => [`已进入 ${templateName} 生成流程`, ...baseMessages],
    [templateName],
  )

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length)
    }, 1800)

    const secondTimer = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => {
      window.clearInterval(messageTimer)
      window.clearInterval(secondTimer)
    }
  }, [messages.length])

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="tj-panel relative overflow-hidden p-8 md:p-12">
        <div className="absolute inset-x-16 top-4 h-28 rounded-full bg-[#7170ff]/20 blur-[100px]" />
        <div className="relative rounded-[28px] border border-white/[0.08] bg-[#050505]/80 p-8 md:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
            <div className="relative h-12 w-12 animate-pulse rounded-full border border-[#7170ff]/40 bg-[#7170ff]/10">
              <div className="absolute inset-2 rounded-full border border-white/10" />
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(113,112,255,0.42),transparent_62%)]" />
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="tj-eyebrow">生成状态</p>
            <h2 className="mt-4 text-3xl font-medium tracking-tight text-white md:text-4xl">
              正在生成画面结构
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{messages[messageIndex]}</p>
            <p className="mt-3 text-xs tracking-[0.2em] text-slate-500">已等待 {seconds} 秒</p>
          </div>

          <div className="mt-8 rounded-[24px] border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="aspect-[16/9] rounded-[20px] border border-white/[0.06] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

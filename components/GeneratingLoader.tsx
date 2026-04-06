'use client'

import { useEffect, useMemo, useState } from 'react'

const BASE_MESSAGES = [
  '\u56fe\u9cb8\u5df2\u5411\u4e0a\u6e38\u6a21\u578b\u53d1\u51fa\u8bf7\u6c42\u2026',
  '\u6b63\u5728\u6574\u7406\u6784\u56fe\u4e0e\u80cc\u666f\u5c42\u6b21\u2026',
  '\u5982\u679c\u7b49\u5f85\u8f83\u4e45\uff0c\u901a\u5e38\u662f\u4e0a\u6e38\u4ecd\u5728\u5904\u7406\u4e2d\u2026',
]

type GeneratingLoaderProps = {
  templateName: string
}

export default function GeneratingLoader({ templateName }: GeneratingLoaderProps) {
  const [progress, setProgress] = useState(8)
  const [messageIndex, setMessageIndex] = useState(0)
  const [seconds, setSeconds] = useState(0)

  const messages = useMemo(() => {
    const phaseMessage =
      seconds < 12
        ? '\u8bf7\u6c42\u5df2\u53d1\u51fa\uff0c\u6b63\u5728\u7b49\u5f85\u6a21\u578b\u5f00\u59cb\u8fd4\u56de\u2026'
        : seconds < 35
          ? '\u6a21\u578b\u4ecd\u5728\u5904\u7406\u4e2d\uff0c\u8bf7\u7ee7\u7eed\u7b49\u5f85\u2026'
          : '\u7b49\u5f85\u65f6\u95f4\u8f83\u957f\uff0c\u82e5\u6700\u7ec8\u8d85\u65f6\uff0c\u540e\u53f0\u4ecd\u53ef\u80fd\u7ee7\u7eed\u751f\u6210\u3002'

    return [`\u5df2\u8fdb\u5165 ${templateName} \u751f\u6210\u6d41\u7a0b`, phaseMessage, ...BASE_MESSAGES]
  }, [seconds, templateName])

  useEffect(() => {
    const progressTimer = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : current + 4))
    }, 420)

    const messageTimer = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % messages.length)
    }, 1400)

    const secondTimer = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => {
      window.clearInterval(progressTimer)
      window.clearInterval(messageTimer)
      window.clearInterval(secondTimer)
    }
  }, [messages.length])

  return (
    <div className="tj-panel w-full max-w-2xl p-8 md:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-[#7170ff]/12 shadow-soft">
        <div className="h-7 w-7 rounded-full border-2 border-[#8f96ff] bg-[radial-gradient(circle,rgba(143,150,255,0.95)_0%,rgba(143,150,255,0.18)_45%,transparent_75%)]" />
      </div>
      <h2 className="mt-6 text-center text-3xl font-medium tracking-[-0.03em] text-white">
        {'\u56fe\u9cb8\u6b63\u5728\u751f\u6210\u4e2d'}
      </h2>
      <p className="mt-3 text-center text-sm leading-7 text-slate-300">{messages[messageIndex]}</p>

      <div className="mt-8 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-[#5e6ad2] via-[#7170ff] to-[#6ee7f9] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-slate-500">
        <span>{'\u5904\u7406\u4e2d'}</span>
        <span>{progress}% / {seconds}s</span>
      </div>
    </div>
  )
}

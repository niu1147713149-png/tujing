import type { Metadata } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: '图鲸 - AI 电商设计工具',
  description: '一句提示词，快速生成主图、详情页长图和营销海报。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  )
}

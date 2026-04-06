'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ResultIndexPage() {
  const router = useRouter()

  useEffect(() => {
    const taskId = localStorage.getItem('tujing.currentTaskId')
    if (taskId) {
      router.replace(`/result/${taskId}`)
      return
    }
    router.replace('/generate')
  }, [router])

  return null
}

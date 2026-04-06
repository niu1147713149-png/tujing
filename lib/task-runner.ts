import { generateImageForTask, isTimeoutError } from '@/lib/gemini'
import { getTask, updateTask } from '@/lib/task-store'

const activeRuns = new Set<string>()

export async function runTask(taskId: string) {
  if (activeRuns.has(taskId)) return
  activeRuns.add(taskId)

  try {
    const task = await getTask(taskId)
    if (!task) return
    if (task.status === 'processing' || task.status === 'succeeded') return

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await updateTask(taskId, {
      status: 'processing',
      errorMessage: null,
      requestId,
    })

    try {
      const generated = await generateImageForTask(task.template, task.prompt, requestId)
      await updateTask(taskId, {
        status: 'succeeded',
        resultUrl: generated.resultUrl,
        requestId,
        providerModel: generated.meta.modelId,
        errorMessage: null,
      })
    } catch (error) {
      const message = isTimeoutError(error)
        ? '请求已经发给上游模型，但等待返回超过 60 秒且自动重试后仍超时。后台可能仍在继续生成，请稍后检查上游记录。'
        : error instanceof Error
          ? error.message
          : '生成失败，请稍后重试。'

      await updateTask(taskId, {
        status: 'failed',
        errorMessage: message,
        requestId,
      })
    }
  } finally {
    activeRuns.delete(taskId)
  }
}

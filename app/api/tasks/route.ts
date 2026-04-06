import { NextResponse } from 'next/server'

import { createTask } from '@/lib/task-store'
import { runTask } from '@/lib/task-runner'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      template?: 'amazon' | 'detail' | 'poster'
      prompt?: string
    }

    if (!body.template || !body.prompt?.trim()) {
      return NextResponse.json({ error: '缺少模板或提示词。' }, { status: 400 })
    }

    const task = await createTask({
      template: body.template,
      prompt: body.prompt.trim(),
    })

    setTimeout(() => {
      void runTask(task.id)
    }, 0)

    return NextResponse.json({
      taskId: task.id,
      status: task.status,
    })
  } catch (error) {
    console.error('[api/tasks] create failed', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建任务失败。' },
      { status: 500 },
    )
  }
}

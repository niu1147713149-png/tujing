import { NextResponse } from 'next/server'

import { createTask, getTask } from '@/lib/task-store'
import { runTask } from '@/lib/task-runner'

export async function POST(
  _request: Request,
  { params }: { params: { taskId: string } },
) {
  const sourceTask = await getTask(params.taskId)

  if (!sourceTask) {
    return NextResponse.json({ error: '原任务不存在。' }, { status: 404 })
  }

  const task = await createTask({
    template: sourceTask.template,
    prompt: sourceTask.prompt,
  })

  setTimeout(() => {
    void runTask(task.id)
  }, 0)

  return NextResponse.json({
    taskId: task.id,
    status: task.status,
  })
}

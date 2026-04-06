import { NextResponse } from 'next/server'

import { getTask } from '@/lib/task-store'

export async function GET(
  _request: Request,
  { params }: { params: { taskId: string } },
) {
  const task = await getTask(params.taskId)

  if (!task) {
    return NextResponse.json({ error: '任务不存在。' }, { status: 404 })
  }

  return NextResponse.json(task)
}

import { promises as fs } from 'fs'
import path from 'path'

export type TaskStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

export type ImageTask = {
  id: string
  template: 'amazon' | 'detail' | 'poster'
  prompt: string
  status: TaskStatus
  resultUrl: string | null
  errorMessage: string | null
  requestId: string | null
  providerModel: string | null
  createdAt: string
  updatedAt: string
}

type TaskFile = {
  tasks: ImageTask[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const TASK_FILE = path.join(DATA_DIR, 'tasks.json')

let writeChain = Promise.resolve()

function nowIso() {
  return new Date().toISOString()
}

export function createTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(TASK_FILE)
  } catch {
    await fs.writeFile(TASK_FILE, JSON.stringify({ tasks: [] }, null, 2), 'utf8')
  }
}

async function readStore(): Promise<TaskFile> {
  await ensureStore()
  const raw = await fs.readFile(TASK_FILE, 'utf8')
  return JSON.parse(raw) as TaskFile
}

async function writeStore(store: TaskFile) {
  await ensureStore()
  writeChain = writeChain.then(() => fs.writeFile(TASK_FILE, JSON.stringify(store, null, 2), 'utf8'))
  await writeChain
}

export async function createTask(input: Pick<ImageTask, 'template' | 'prompt'>) {
  const store = await readStore()
  const task: ImageTask = {
    id: createTaskId(),
    template: input.template,
    prompt: input.prompt,
    status: 'queued',
    resultUrl: null,
    errorMessage: null,
    requestId: null,
    providerModel: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  store.tasks.unshift(task)
  await writeStore(store)
  return task
}

export async function getTask(taskId: string) {
  const store = await readStore()
  return store.tasks.find((task) => task.id === taskId) ?? null
}

export async function updateTask(taskId: string, patch: Partial<Omit<ImageTask, 'id' | 'createdAt'>>) {
  const store = await readStore()
  const index = store.tasks.findIndex((task) => task.id === taskId)
  if (index === -1) return null

  const current = store.tasks[index]
  const next: ImageTask = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  }
  store.tasks[index] = next
  await writeStore(store)
  return next
}

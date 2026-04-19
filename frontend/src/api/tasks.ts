import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'

export type TaskStatus = 'queued' | 'processing' | 'succeeded' | 'failed'

export type Task = {
  id: string
  groupId: string
  orderId: string | null
  template: 'amazon' | 'detail' | 'poster'
  prompt: string
  note: string | null
  status: TaskStatus
  resultUrl: string | null
  errorMessage: string | null
  requestId: string | null
  providerModel: string | null
  createdAt: string
  updatedAt: string
}

export type TaskGroup = {
  groupId: string
  tasks: Task[]
  note: string | null
  createdAt: string
}

export type Model = {
  id: string
  name: string
}

export type ModelsResponse = {
  models: Model[]
  defaultModel: string
}

export function useTaskGroups() {
  return useQuery<TaskGroup[]>({
    queryKey: ['taskGroups'],
    queryFn: () => apiFetch('/api/tasks'),
  })
}

export function useModels() {
  return useQuery<ModelsResponse>({
    queryKey: ['models'],
    queryFn: () => apiFetch('/api/models'),
  })
}

export function useTask(taskId: string, polling = false) {
  return useQuery<Task>({
    queryKey: ['task', taskId],
    queryFn: () => apiFetch(`/api/tasks/${taskId}`),
    refetchInterval: polling ? 2000 : false,
  })
}

export function useGroupTasks(groupId: string | undefined, polling = false) {
  return useQuery<Task[]>({
    queryKey: ['groupTasks', groupId],
    queryFn: () => apiFetch(`/api/tasks/group/${groupId}`),
    enabled: !!groupId,
    refetchInterval: polling ? 2000 : false,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { template: string; prompt: string; count: number; note?: string; orderId?: string; modelId?: string }) =>
      apiFetch<{ taskId: string }>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['taskGroups'] }),
  })
}

export function useRegenerateTask() {
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<{ taskId: string }>(`/api/tasks/${taskId}/regenerate`, { method: 'POST' }),
  })
}

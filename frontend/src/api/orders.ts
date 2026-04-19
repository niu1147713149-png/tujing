import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, resolveApiUrl } from './client'
import type { Task } from './tasks'

export type Order = {
  id: string
  note: string
  createdAt: string
  updatedAt: string
  latestTaskId: string | null
  previewTasks: Task[]
  taskCount: number
  succeededCount: number
  failedCount: number
}

export function createOrder(body: { note: string }) {
  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: () => apiFetch('/api/orders'),
  })
}

export function getOrder(orderId: string) {
  return apiFetch<Order>(`/api/orders/${orderId}`)
}

export function deleteOrder(orderId: string) {
  return apiFetch<{ ok: true }>(`/api/orders/${orderId}`, {
    method: 'DELETE',
  })
}

export function useOrderTasks(orderId: string | undefined) {
  return useQuery<Task[]>({
    queryKey: ['orderTasks', orderId],
    queryFn: () => apiFetch(`/api/orders/${orderId}/tasks`),
    enabled: !!orderId,
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => deleteOrder(orderId),
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.removeQueries({ queryKey: ['orderTasks', orderId] })
      qc.removeQueries({ queryKey: ['taskGroups'] })
    },
  })
}

export { resolveApiUrl }

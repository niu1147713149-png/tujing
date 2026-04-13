export const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function resolveApiUrl(path: string) {
  if (!path) return path
  if (/^https?:\/\//i.test(path)) return path
  return `${BASE_URL}${path}`
}

function getStatusMessage(status: number) {
  if (status === 400) return '请求参数不完整或格式不正确。'
  if (status === 401 || status === 403) return '当前请求未通过鉴权，请检查接口配置。'
  if (status === 404) return '请求的接口不存在，请检查前后端地址配置。'
  if (status === 408) return '请求等待过久，请稍后重试。'
  if (status >= 500) return '服务端处理失败，请查看后端日志或稍后重试。'
  return `请求失败 (${status})`
}

export function normalizeErrorMessage(error: unknown, fallback = '请求失败，请稍后重试。') {
  if (error instanceof Error) {
    const message = error.message?.trim()
    if (!message) return fallback
    if (
      message === 'Failed to fetch' ||
      message.includes('NetworkError') ||
      message.includes('Load failed')
    ) {
      return '无法连接到后端服务，请确认前后端都已启动。'
    }
    return message
  }
  return fallback
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch (error) {
    throw new Error(normalizeErrorMessage(error))
  }
  const raw = await res.text()
  const trimmedRaw = raw.trim()
  let data: unknown = null
  if (trimmedRaw) {
    try {
      data = JSON.parse(trimmedRaw)
    } catch {
      if (!res.ok) {
        if (res.status >= 500) {
          throw new Error('后端服务未正常响应，可能未启动或开发代理连接失败。')
        }
        throw new Error(getStatusMessage(res.status))
      }
      throw new Error('接口返回格式异常，请稍后重试。')
    }
  }
  if (!res.ok) {
    if (!trimmedRaw && res.status >= 500) {
      throw new Error('后端服务未正常响应，可能未启动或开发代理连接失败。')
    }
    const errorData = data as { error?: string; detail?: string } | null
    throw new Error(errorData?.error ?? errorData?.detail ?? getStatusMessage(res.status))
  }
  if (data === null) {
    throw new Error('接口没有返回有效数据，请稍后重试。')
  }
  return data as T
}

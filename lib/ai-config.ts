import { promises as fs } from 'fs'
import path from 'path'

export type AiConfig = {
  domain: string
  apiKey: string
  modelId: string
}

const CONFIG_PATH = path.join(process.cwd(), 'config', 'ai.config.json')

function normalizeDomain(domain: string) {
  const trimmed = domain.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  return `https://${trimmed}`
}

export function maskApiKey(apiKey: string) {
  if (apiKey.length <= 8) return '已配置'
  return `${apiKey.slice(0, 4)}****${apiKey.slice(-4)}`
}

export async function loadAiConfig(): Promise<AiConfig> {
  const raw = await fs.readFile(CONFIG_PATH, 'utf8').catch(() => '')

  if (!raw) {
    throw new Error('未找到 config/ai.config.json，请先创建并填写配置文件。')
  }

  let parsed: Partial<AiConfig>

  try {
    parsed = JSON.parse(raw) as Partial<AiConfig>
  } catch {
    throw new Error('config/ai.config.json 不是合法 JSON。')
  }

  const domain = normalizeDomain(parsed.domain ?? '')
  const apiKey = (parsed.apiKey ?? '').trim()
  const modelId = (parsed.modelId ?? '').trim()

  if (!domain) {
    throw new Error('config/ai.config.json 缺少 domain。')
  }

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('config/ai.config.json 缺少有效的 apiKey。')
  }

  if (!modelId) {
    throw new Error('config/ai.config.json 缺少 modelId。')
  }

  return {
    domain,
    apiKey,
    modelId,
  }
}

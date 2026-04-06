import { NextResponse } from 'next/server'

import { getTemplateById } from '@/components/template-options'
import { loadAiConfig, maskApiKey } from '@/lib/ai-config'

type GeminiPart =
  | { text?: string }
  | {
      inline_data?: {
        mime_type?: string
        data?: string
      }
      inlineData?: {
        mimeType?: string
        data?: string
      }
    }

type GeminiCandidate = {
  content?: {
    parts?: GeminiPart[]
  }
}

type GeminiPayload = {
  candidates?: GeminiCandidate[]
  error?: {
    message?: string
  }
}

function buildAspectRatio(templateId: string) {
  const template = getTemplateById(templateId)
  const aspectRatioMap: Record<string, string> = {
    amazon: '1:1',
    detail: '3:4',
    poster: '16:9',
  }

  return aspectRatioMap[template.id] ?? '1:1'
}

function buildPrompt(templateId: string, prompt?: string) {
  const template = getTemplateById(templateId)
  const basePrompt = prompt?.trim()

  if (!basePrompt) {
    return `生成一张${template.name}风格图片，适合电商展示，画面干净、主体清晰。`
  }

  return `请生成一张${template.name}风格图片。要求：${basePrompt}`
}

function pickImagePart(candidates: GeminiCandidate[] = []) {
  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? []
    for (const part of parts) {
      const inlineData =
        'inline_data' in part
          ? part.inline_data
          : 'inlineData' in part
            ? part.inlineData
            : undefined

      const normalizedInlineData = inlineData as
        | { mime_type?: string; mimeType?: string; data?: string }
        | undefined

      const mimeType = normalizedInlineData?.mime_type ?? normalizedInlineData?.mimeType
      const data = normalizedInlineData?.data

      if (mimeType?.startsWith('image/') && data) {
        return `data:${mimeType};base64,${data}`
      }
    }
  }

  return ''
}

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && error.name === 'TimeoutError'
}

async function requestGeminiImage(
  modelId: string,
  domain: string,
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  requestId: string,
  attempt: number,
) {
  const startedAt = Date.now()
  console.log(`[api/generate][${requestId}] upstream request started`, {
    attempt,
    modelId,
    domain,
    aspectRatio,
  })

  const response = await fetch(`${domain}/v1beta/models/${modelId}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        imageConfig: {
          aspectRatio,
        },
      },
    }),
    signal: AbortSignal.timeout(60000),
  })

  const payload = (await response.json()) as GeminiPayload
  console.log(`[api/generate][${requestId}] upstream request finished`, {
    attempt,
    status: response.status,
    elapsedMs: Date.now() - startedAt,
    hasCandidates: Boolean(payload.candidates?.length),
  })

  return {
    response,
    payload,
  }
}

async function requestWithRetry(
  modelId: string,
  domain: string,
  apiKey: string,
  prompt: string,
  aspectRatio: string,
  requestId: string,
) {
  try {
    return await requestGeminiImage(modelId, domain, apiKey, prompt, aspectRatio, requestId, 1)
  } catch (error) {
    if (!isTimeoutError(error)) throw error

    console.warn(`[api/generate][${requestId}] attempt 1 timed out after 60000ms, retrying once`)

    try {
      return await requestGeminiImage(modelId, domain, apiKey, prompt, aspectRatio, requestId, 2)
    } catch (retryError) {
      if (isTimeoutError(retryError)) {
        console.error(`[api/generate][${requestId}] attempt 2 also timed out after 60000ms`)
      }
      throw retryError
    }
  }
}

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  try {
    const body = (await request.json()) as {
      templateId?: string
      prompt?: string
    }

    if (!body.templateId) {
      return NextResponse.json({ error: '缺少模板参数。' }, { status: 400 })
    }

    const config = await loadAiConfig()
    const aspectRatio = buildAspectRatio(body.templateId)
    const prompt = buildPrompt(body.templateId, body.prompt)

    const { response, payload } = await requestWithRetry(
      config.modelId,
      config.domain,
      config.apiKey,
      prompt,
      aspectRatio,
      requestId,
    )

    if (!response.ok) {
      return NextResponse.json(
        {
          error: payload.error?.message ?? 'Gemini 请求失败，请检查配置文件。',
        },
        { status: response.status },
      )
    }

    const resultUrl = pickImagePart(payload.candidates)

    if (!resultUrl) {
      return NextResponse.json(
        {
          error: '请求已发出，但模型没有返回图片结果。请检查当前模型是否支持文生图。',
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      resultUrl,
      meta: {
        brand: '图鲸',
        modelId: config.modelId,
        domain: config.domain,
        apiKeyMasked: maskApiKey(config.apiKey),
        requestId,
      },
    })
  } catch (error) {
    console.error(`[api/generate][${requestId}] route failed`, error)

    if (isTimeoutError(error)) {
      return NextResponse.json(
        {
          error:
            '请求已经发给上游模型，但等待返回超过 60 秒且自动重试后仍超时。后台可能仍在继续生成，请稍后检查上游记录。',
          requestId,
        },
        { status: 504 },
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '生成失败，请稍后重试。',
        requestId,
      },
      { status: 500 },
    )
  }
}

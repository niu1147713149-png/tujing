import { NextResponse } from 'next/server'

import { loadAiConfig, maskApiKey } from '@/lib/ai-config'

function isTimeoutError(error: unknown) {
  return error instanceof DOMException && error.name === 'TimeoutError'
}

async function requestConfigCheck(
  domain: string,
  modelId: string,
  apiKey: string,
  requestId: string,
  attempt: number,
) {
  const startedAt = Date.now()
  console.log(`[api/config-check][${requestId}] upstream request started`, {
    attempt,
    modelId,
    domain,
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
              text: '生成一张简洁的蓝色电商主图。',
            },
          ],
        },
      ],
      generationConfig: {
        imageConfig: {
          aspectRatio: '1:1',
        },
      },
    }),
    signal: AbortSignal.timeout(45000),
  })

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inline_data?: { data?: string; mime_type?: string }
          inlineData?: { data?: string; mimeType?: string }
        }>
      }
    }>
    error?: {
      message?: string
    }
  }

  console.log(`[api/config-check][${requestId}] upstream request finished`, {
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

export async function POST() {
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  try {
    const config = await loadAiConfig()

    let result
    try {
      result = await requestConfigCheck(config.domain, config.modelId, config.apiKey, requestId, 1)
    } catch (error) {
      if (!isTimeoutError(error)) throw error
      console.warn(`[api/config-check][${requestId}] attempt 1 timed out after 45000ms, retrying once`)
      result = await requestConfigCheck(config.domain, config.modelId, config.apiKey, requestId, 2)
    }

    const { response, payload } = result

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          domain: config.domain,
          modelId: config.modelId,
          apiKeyMasked: maskApiKey(config.apiKey),
          requestId,
          message: payload.error?.message ?? 'Gemini 请求失败。',
        },
        { status: response.status },
      )
    }

    const hasImage = (payload.candidates ?? []).some((candidate) =>
      (candidate.content?.parts ?? []).some((part) => {
        const inline = part.inline_data ?? part.inlineData
        return Boolean(inline?.data)
      }),
    )

    if (!hasImage) {
      return NextResponse.json(
        {
          ok: false,
          domain: config.domain,
          modelId: config.modelId,
          apiKeyMasked: maskApiKey(config.apiKey),
          requestId,
          message: '配置已连通，请求也已经发给上游，但当前模型没有返回图片结果，请检查模型是否支持文生图。',
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      ok: true,
      domain: config.domain,
      modelId: config.modelId,
      apiKeyMasked: maskApiKey(config.apiKey),
      requestId,
      message: '配置可用：域名可访问、API Key 有效、模型已成功返回图片结果。',
    })
  } catch (error) {
    console.error(`[api/config-check][${requestId}] route failed`, error)

    if (isTimeoutError(error)) {
      return NextResponse.json(
        {
          ok: false,
          domain: '-',
          modelId: '-',
          apiKeyMasked: '-',
          requestId,
          message:
            '配置检测请求已经发给上游，但等待返回超过 45 秒且重试后仍超时。请检查上游网关日志。',
        },
        { status: 504 },
      )
    }

    return NextResponse.json(
      {
        ok: false,
        domain: '-',
        modelId: '-',
        apiKeyMasked: '-',
        requestId,
        message: error instanceof Error ? error.message : '配置检测失败。',
      },
      { status: 500 },
    )
  }
}

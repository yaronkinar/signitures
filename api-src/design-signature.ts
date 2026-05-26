import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildAiSystemPrompt,
  buildAiUserPrompt,
  buildImageExtractionSystemPrompt,
  parseAiSignatureDesign
} from '../lib/aiSignatureDesign'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const IMAGE_EXTRACTION_BRIEF =
  'Extract the contact details and visual style from this uploaded email signature image. Preserve the visible colors as closely as possible and fill the signature form so the site can recreate it as editable Outlook HTML.'

const normalizeApiKey = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed.replace(/^['"]|['"]$/g, '')
}

const getServerApiKey = (): string =>
  normalizeApiKey(process.env.OPENAI_API_KEY) ||
  normalizeApiKey(process.env.VITE_OPENAI_API_KEY)

const parseJsonBody = (body: unknown): Record<string, unknown> => {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsed = JSON.parse(body) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // fall through
    }
  }
  return {}
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    if (req.method === 'GET') {
      res.status(200).json({
        ok: true,
        hasApiKey: Boolean(getServerApiKey()),
        model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
      })
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const apiKey = getServerApiKey()
    if (!apiKey) {
      res.status(500).json({
        error:
          'OPENAI_API_KEY is not set on the server. In Vercel: Settings → Environment Variables → add OPENAI_API_KEY for Production, then redeploy.'
      })
      return
    }

    const body = parseJsonBody(req.body)
    const imageDataUrl = typeof body.imageDataUrl === 'string' ? body.imageDataUrl.trim() : ''
    const brief = typeof body.brief === 'string' ? body.brief.trim() : ''
    const snapshot = body.snapshot
    const mode = body.mode === 'create' ? 'create' : 'refine'
    const keepContact = body.keepContact !== false

    if (!imageDataUrl && (!brief || !snapshot || typeof snapshot !== 'object')) {
      res.status(400).json({ error: 'Missing brief or snapshot' })
      return
    }

    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL

    const messages = imageDataUrl
      ? [
          { role: 'system', content: buildImageExtractionSystemPrompt() },
          {
            role: 'user',
            content: [
              { type: 'text', text: IMAGE_EXTRACTION_BRIEF },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ]
      : [
          { role: 'system', content: buildAiSystemPrompt(mode) },
          {
            role: 'user',
            content: buildAiUserPrompt(brief, snapshot as never, { mode, keepContact })
          }
        ]

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: imageDataUrl ? 0.2 : mode === 'create' ? 0.55 : 0.4,
        response_format: { type: 'json_object' },
        messages
      })
    })

    if (!response.ok) {
      let detail = response.statusText
      try {
        const errorBody = (await response.json()) as { error?: { message?: string } }
        detail = errorBody.error?.message ?? detail
      } catch {
        // ignore
      }
      res.status(response.status).json({ error: detail || `OpenAI API error ${response.status}` })
      return
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content
    if (!content?.trim()) {
      res.status(502).json({ error: 'Empty response from AI' })
      return
    }

    const design = parseAiSignatureDesign(content)
    res.status(200).json({ design })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    console.error('[design-signature]', message, error)
    res.status(500).json({ error: message })
  }
}

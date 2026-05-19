import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  buildAiSystemPrompt,
  buildAiUserPrompt,
  parseAiSignatureDesign
} from '../lib/aiSignatureDesign'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

const normalizeApiKey = (value: string | undefined): string => {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed.replace(/^['"]|['"]$/g, '')
}

const getServerApiKey = (): string =>
  normalizeApiKey(process.env.OPENAI_API_KEY) ||
  normalizeApiKey(process.env.VITE_OPENAI_API_KEY)

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

    const brief = typeof req.body?.brief === 'string' ? req.body.brief.trim() : ''
    const snapshot = req.body?.snapshot
    const mode = req.body?.mode === 'create' ? 'create' : 'refine'
    const keepContact = req.body?.keepContact !== false

    if (!brief || !snapshot || typeof snapshot !== 'object') {
      res.status(400).json({ error: 'Missing brief or snapshot' })
      return
    }

    const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
    const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: mode === 'create' ? 0.55 : 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildAiSystemPrompt(mode) },
          {
            role: 'user',
            content: buildAiUserPrompt(brief, snapshot as never, { mode, keepContact })
          }
        ]
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

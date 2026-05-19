import {
  buildAiSystemPrompt,
  buildAiUserPrompt,
  parseAiSignatureDesign,
  type AiDesignMode,
  type SignatureFormSnapshot
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

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

export async function GET(): Promise<Response> {
  return json({
    ok: true,
    hasApiKey: Boolean(getServerApiKey()),
    model: process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL
  })
}

export async function POST(request: Request): Promise<Response> {
  try {
    const apiKey = getServerApiKey()
    if (!apiKey) {
      return json(
        {
          error:
            'OPENAI_API_KEY is not set on the server. In Vercel: Settings → Environment Variables → add OPENAI_API_KEY for Production, then redeploy.'
        },
        500
      )
    }

    let brief = ''
    let snapshot: SignatureFormSnapshot | undefined
    let mode: AiDesignMode = 'refine'
    let keepContact = true
    try {
      const body = (await request.json()) as {
        brief?: string
        snapshot?: SignatureFormSnapshot
        mode?: AiDesignMode
        keepContact?: boolean
      }
      brief = body.brief?.trim() ?? ''
      snapshot = body.snapshot
      mode = body.mode === 'create' ? 'create' : 'refine'
      keepContact = body.keepContact !== false
    } catch {
      return json({ error: 'Invalid request body' }, 400)
    }

    if (!brief || !snapshot) {
      return json({ error: 'Missing brief or snapshot' }, 400)
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
          { role: 'user', content: buildAiUserPrompt(brief, snapshot, { mode, keepContact }) }
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
      return json({ error: detail || `OpenAI API error ${response.status}` }, response.status)
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content
    if (!content?.trim()) {
      return json({ error: 'Empty response from AI' }, 502)
    }

    const design = parseAiSignatureDesign(content)
    return json({ design })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed'
    console.error('[design-signature]', message, error)
    return json({ error: message }, 500)
  }
}

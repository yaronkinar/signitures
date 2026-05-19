import {
  buildAiSystemPrompt,
  buildAiUserPrompt,
  parseAiSignatureDesign,
  type SignatureFormSnapshot
} from '../src/aiSignatureDesign'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'

const getServerApiKey = (): string =>
  process.env.OPENAI_API_KEY?.trim() ||
  process.env.VITE_OPENAI_API_KEY?.trim() ||
  ''

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const apiKey = getServerApiKey()
  if (!apiKey) {
    return json(
      {
        error:
          'OPENAI_API_KEY is not set on the server. Add it in Vercel → Project → Settings → Environment Variables.'
      },
      500
    )
  }

  let brief = ''
  let snapshot: SignatureFormSnapshot | undefined
  try {
    const body = (await request.json()) as { brief?: string; snapshot?: SignatureFormSnapshot }
    brief = body.brief?.trim() ?? ''
    snapshot = body.snapshot
  } catch {
    return json({ error: 'Invalid request body' }, 400)
  }

  if (!brief || !snapshot) {
    return json({ error: 'Missing brief or snapshot' }, 400)
  }

  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/$/, '')
  const model = process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildAiSystemPrompt() },
          { role: 'user', content: buildAiUserPrompt(brief, snapshot) }
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
    return json({ error: message }, 500)
  }
}

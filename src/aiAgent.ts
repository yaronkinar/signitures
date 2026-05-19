import {
  buildAiSystemPrompt,
  buildAiUserPrompt,
  parseAiSignatureDesign,
  type AiSignatureDesign,
  type SignatureFormSnapshot
} from './aiSignatureDesign'

export type AiAgentConfig = {
  apiKey: string
  baseUrl?: string
  model?: string
}

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const DEFAULT_MODEL = 'gpt-4o-mini'
const DESIGN_API_PATH = '/api/design-signature'

const readViteEnv = (name: 'VITE_OPENAI_API_KEY' | 'VITE_OPENAI_BASE_URL' | 'VITE_OPENAI_MODEL'): string => {
  if (!import.meta.env.DEV) return ''
  const value = import.meta.env[name] as string | undefined
  return value?.trim() ?? ''
}

/** Local dev only (`npm run dev` + `.env`). */
const getEnvApiKey = (): string => readViteEnv('VITE_OPENAI_API_KEY')

const getEnvBaseUrl = (): string => readViteEnv('VITE_OPENAI_BASE_URL') || DEFAULT_BASE_URL

const getEnvModel = (): string => readViteEnv('VITE_OPENAI_MODEL') || DEFAULT_MODEL

/** Production on Vercel uses `/api/design-signature` with server env vars. */
export const usesServerAiProxy = (): boolean => import.meta.env.PROD

export const resolveAiApiKey = (userApiKey: string): string => {
  const fromField = userApiKey.trim()
  if (fromField) return fromField
  return getEnvApiKey()
}

export const hasConfiguredAiApiKey = (userApiKey: string): boolean =>
  Boolean(resolveAiApiKey(userApiKey)) || usesServerAiProxy()

export const isUsingEnvApiKey = (userApiKey: string): boolean =>
  import.meta.env.DEV && !userApiKey.trim() && Boolean(getEnvApiKey())

export const isUsingServerAiProxy = (userApiKey: string): boolean =>
  usesServerAiProxy() && !userApiKey.trim() && !getEnvApiKey()

const SESSION_KEY = 'signitures-openai-api-key'

export const loadStoredApiKey = (): string => {
  try {
    return sessionStorage.getItem(SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

export const storeApiKey = (apiKey: string): void => {
  try {
    const trimmed = apiKey.trim()
    if (trimmed) {
      sessionStorage.setItem(SESSION_KEY, trimmed)
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // sessionStorage may be unavailable in restricted contexts
  }
}

const designViaDirectOpenAi = async (
  brief: string,
  snapshot: SignatureFormSnapshot,
  config: AiAgentConfig
): Promise<AiSignatureDesign> => {
  const apiKey = resolveAiApiKey(config.apiKey)
  if (!apiKey) {
    throw new Error('MISSING_API_KEY')
  }

  const baseUrl = (config.baseUrl?.trim() || getEnvBaseUrl()).replace(/\/$/, '')
  const model = config.model?.trim() || getEnvModel()

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
      // ignore parse errors
    }
    throw new Error(detail || `API error ${response.status}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = payload.choices?.[0]?.message?.content
  if (!content?.trim()) {
    throw new Error('Empty response from AI')
  }

  return parseAiSignatureDesign(content)
}

const designViaServerProxy = async (
  brief: string,
  snapshot: SignatureFormSnapshot
): Promise<AiSignatureDesign> => {
  const response = await fetch(DESIGN_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, snapshot })
  })

  let payload: { design?: AiSignatureDesign; error?: string } = {}
  try {
    payload = (await response.json()) as { design?: AiSignatureDesign; error?: string }
  } catch {
    // ignore
  }

  if (!response.ok) {
    throw new Error(payload.error || `Server error ${response.status}`)
  }

  if (!payload.design) {
    throw new Error(payload.error || 'Invalid server response')
  }

  return payload.design
}

export const designSignatureWithAi = async (
  brief: string,
  snapshot: SignatureFormSnapshot,
  config: AiAgentConfig
): Promise<AiSignatureDesign> => {
  if (usesServerAiProxy() && !config.apiKey.trim()) {
    return designViaServerProxy(brief, snapshot)
  }
  return designViaDirectOpenAi(brief, snapshot, config)
}

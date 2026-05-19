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

const readViteEnv = (name: 'VITE_OPENAI_API_KEY' | 'VITE_OPENAI_BASE_URL' | 'VITE_OPENAI_MODEL'): string => {
  if (!import.meta.env.DEV) return ''
  const value = import.meta.env[name] as string | undefined
  return value?.trim() ?? ''
}

/** Only available in `npm run dev`; production builds must use the in-app key field. */
const getEnvApiKey = (): string => readViteEnv('VITE_OPENAI_API_KEY')

const getEnvBaseUrl = (): string => readViteEnv('VITE_OPENAI_BASE_URL') || DEFAULT_BASE_URL

const getEnvModel = (): string => readViteEnv('VITE_OPENAI_MODEL') || DEFAULT_MODEL

export const resolveAiApiKey = (userApiKey: string): string => {
  const fromField = userApiKey.trim()
  if (fromField) return fromField
  return getEnvApiKey()
}

export const hasConfiguredAiApiKey = (userApiKey: string): boolean =>
  Boolean(resolveAiApiKey(userApiKey))

export const isUsingEnvApiKey = (userApiKey: string): boolean =>
  !userApiKey.trim() && Boolean(getEnvApiKey())

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

export const designSignatureWithAi = async (
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

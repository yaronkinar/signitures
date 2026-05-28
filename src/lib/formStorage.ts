import { createDefaultFormState } from './defaultFormState'
import { sanitizeFileName } from './fileNames'
import { getLayoutSettings } from './signatureUtils'
import type { AppLanguage } from '../i18n'
import type { LinkImage, SignatureFormState } from '../types/signatureForm'

const STORAGE_KEY = 'signitures-form-state'

const parseLinkImages = (value: unknown, fallback: LinkImage[]): LinkImage[] => {
  if (!Array.isArray(value) || value.length === 0) return fallback

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      return { id: crypto.randomUUID(), imageUrl: '', href: '', alt: '' }
    }

    const row = item as Partial<LinkImage>
    return {
      id: typeof row.id === 'string' && row.id.trim() ? row.id : crypto.randomUUID(),
      imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '',
      href: typeof row.href === 'string' ? row.href : '',
      alt: typeof row.alt === 'string' ? row.alt : ''
    }
  })
}

const parseStoredFormState = (value: unknown): SignatureFormState | null => {
  if (!value || typeof value !== 'object') return null

  const parsed = value as Partial<SignatureFormState>
  const defaults = createDefaultFormState()
  const signatureLanguage: AppLanguage = parsed.signatureLanguage === 'en' ? 'en' : 'he'

  const merged: SignatureFormState = {
    ...defaults,
    ...parsed,
    signatureLanguage,
    linkImages: parseLinkImages(parsed.linkImages, defaults.linkImages)
  }

  return { ...merged, ...getLayoutSettings(merged) }
}

export const loadStoredFormState = (): SignatureFormState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseStoredFormState(JSON.parse(raw))
  } catch {
    return null
  }
}

export const storeFormState = (form: SignatureFormState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    return true
  } catch {
    return false
  }
}

export const clearStoredFormState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage may be unavailable in restricted contexts
  }
}

export const createInitialFormState = (): SignatureFormState =>
  loadStoredFormState() ?? createDefaultFormState()

export const parseFormStateJson = (raw: string): SignatureFormState | null => {
  try {
    return parseStoredFormState(JSON.parse(raw))
  } catch {
    return null
  }
}

const downloadTextFile = (content: string, filename: string, mimeType: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadFormStateExport = (form: SignatureFormState): void => {
  const base = sanitizeFileName(form.fullName.trim() || form.company.trim() || 'signature-params')
  downloadTextFile(JSON.stringify(form, null, 2), `${base}-params.json`, 'application/json')
}

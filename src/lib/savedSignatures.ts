import { parseFormStateJson } from './formStorage'
import type { SignatureFormState } from '../types/signatureForm'

const STORAGE_KEY = 'signitures-named-saves'
const MAX_SAVED_SIGNATURES = 30

export type SavedSignatureEntry = {
  id: string
  name: string
  savedAt: number
  formJson: string
}

export type SaveSignatureResult =
  | { ok: true; entry: SavedSignatureEntry }
  | { ok: false; reason: 'empty_name' | 'too_many' | 'storage_failed' }

const readEntries = (): SavedSignatureEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item): item is SavedSignatureEntry =>
          !!item &&
          typeof item === 'object' &&
          typeof (item as SavedSignatureEntry).id === 'string' &&
          typeof (item as SavedSignatureEntry).name === 'string' &&
          typeof (item as SavedSignatureEntry).savedAt === 'number' &&
          typeof (item as SavedSignatureEntry).formJson === 'string'
      )
      .sort((left, right) => right.savedAt - left.savedAt)
  } catch {
    return []
  }
}

const writeEntries = (entries: SavedSignatureEntry[]): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

export const listSavedSignatures = (): SavedSignatureEntry[] => readEntries()

export const findSavedSignatureByName = (name: string): SavedSignatureEntry | null => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  return readEntries().find((entry) => entry.name.trim().toLowerCase() === normalized) ?? null
}

export const saveSignatureAs = (
  name: string,
  form: SignatureFormState,
  options: { overwriteId?: string } = {}
): SaveSignatureResult => {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { ok: false, reason: 'empty_name' }
  }

  const entries = readEntries()
  const formJson = JSON.stringify(form)
  const now = Date.now()
  const overwriteId = options.overwriteId
  const overwriteIndex = overwriteId ? entries.findIndex((entry) => entry.id === overwriteId) : -1

  let savedEntry: SavedSignatureEntry
  let nextEntries: SavedSignatureEntry[]

  if (overwriteIndex >= 0) {
    savedEntry = {
      ...entries[overwriteIndex],
      name: trimmedName,
      savedAt: now,
      formJson
    }
    nextEntries = entries.map((entry, index) => (index === overwriteIndex ? savedEntry : entry))
  } else {
    if (entries.length >= MAX_SAVED_SIGNATURES) {
      return { ok: false, reason: 'too_many' }
    }
    savedEntry = { id: crypto.randomUUID(), name: trimmedName, savedAt: now, formJson }
    nextEntries = [savedEntry, ...entries]
  }

  nextEntries.sort((left, right) => right.savedAt - left.savedAt)

  if (!writeEntries(nextEntries)) {
    return { ok: false, reason: 'storage_failed' }
  }

  return { ok: true, entry: savedEntry }
}

export const loadSavedSignatureForm = (id: string): SignatureFormState | null => {
  const entry = readEntries().find((item) => item.id === id)
  if (!entry) return null
  return parseFormStateJson(entry.formJson)
}

export const deleteSavedSignature = (id: string): boolean => {
  const entries = readEntries()
  const nextEntries = entries.filter((entry) => entry.id !== id)
  if (nextEntries.length === entries.length) return false
  return writeEntries(nextEntries)
}

export const defaultSaveAsName = (form: SignatureFormState): string =>
  form.fullName.trim() || form.company.trim() || 'signature'

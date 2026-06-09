import type { SignatureFormState } from '../types/signatureForm'
import type { BulkPersonRow, BulkRowFormOverrides } from './bulkSignatures'
import type { SignatureStyleExport } from './formStorage'

const STORAGE_KEY = 'signitures-bulk-state'

export type StoredBulkState = {
  rows: BulkPersonRow[]
  overrides: BulkRowFormOverrides
  /** Style fields the current previews were built with (for design-change detection + rebuild). */
  designStyle: Partial<SignatureStyleExport>
  /** Style signature the user dismissed, so the banner stays hidden until the next change. */
  dismissedSignature: string | null
}

const isBulkPersonRow = (value: unknown): value is BulkPersonRow =>
  !!value && typeof value === 'object' && typeof (value as BulkPersonRow).fullName === 'string'

const isOverride = (value: unknown): value is SignatureFormState | null =>
  value === null || (!!value && typeof value === 'object')

export const loadBulkState = (): StoredBulkState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredBulkState>
    if (!Array.isArray(parsed.rows) || !parsed.rows.every(isBulkPersonRow)) return null
    if (!parsed.rows.length) return null

    const overridesRaw = Array.isArray(parsed.overrides) ? parsed.overrides : []
    const overrides: BulkRowFormOverrides = parsed.rows.map((_, index) => {
      const value = overridesRaw[index]
      return isOverride(value) ? (value as SignatureFormState | null) : null
    })

    return {
      rows: parsed.rows,
      overrides,
      designStyle:
        parsed.designStyle && typeof parsed.designStyle === 'object' ? parsed.designStyle : {},
      dismissedSignature:
        typeof parsed.dismissedSignature === 'string' ? parsed.dismissedSignature : null
    }
  } catch {
    return null
  }
}

export const storeBulkState = (state: StoredBulkState): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    // localStorage may be unavailable or over quota (large per-row images); skip silently.
    return false
  }
}

export const clearBulkState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage may be unavailable in restricted contexts
  }
}

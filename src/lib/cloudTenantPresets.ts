import { authedFetch } from './cloudSignatures'
import type { SignatureFormState } from '../types/signatureForm'

export type TenantPresetEntry = {
  id: string
  name: string
  values: Partial<SignatureFormState>
  createdAt: number
}

const apiBase = '/api/tenant-presets'

export const fetchTenantPresets = async (): Promise<{
  available: boolean
  defaultPresetId: string | null
  entries: TenantPresetEntry[]
}> => {
  try {
    const response = await authedFetch(apiBase)
    if (!response.ok) return { available: false, defaultPresetId: null, entries: [] }
    const payload = await response.json() as {
      available?: boolean
      defaultPresetId?: string | null
      entries?: TenantPresetEntry[]
    }
    return {
      available: Boolean(payload.available),
      defaultPresetId: payload.defaultPresetId ?? null,
      entries: Array.isArray(payload.entries) ? payload.entries : []
    }
  } catch {
    return { available: false, defaultPresetId: null, entries: [] }
  }
}

export const saveTenantPreset = async (
  name: string,
  values: Partial<SignatureFormState>,
  overwriteId?: string
): Promise<{ ok: true; entry: TenantPresetEntry } | { ok: false; reason: 'unavailable' | 'too_many' | 'too_large' | 'failed' }> => {
  try {
    const response = await authedFetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, values, overwriteId })
    })
    if (response.status === 503) return { ok: false, reason: 'unavailable' }
    if (response.status === 409) return { ok: false, reason: 'too_many' }
    if (response.status === 413) return { ok: false, reason: 'too_large' }
    if (!response.ok) return { ok: false, reason: 'failed' }
    const payload = await response.json() as { entry?: TenantPresetEntry }
    if (!payload.entry) return { ok: false, reason: 'failed' }
    return { ok: true, entry: payload.entry }
  } catch {
    return { ok: false, reason: 'failed' }
  }
}

export const deleteTenantPreset = async (id: string): Promise<boolean> => {
  try {
    const response = await authedFetch(apiBase, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    return response.ok
  } catch {
    return false
  }
}

export const setTenantDefaultPreset = async (defaultPresetId: string | null): Promise<boolean> => {
  try {
    const response = await authedFetch(apiBase, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ defaultPresetId })
    })
    return response.ok
  } catch {
    return false
  }
}

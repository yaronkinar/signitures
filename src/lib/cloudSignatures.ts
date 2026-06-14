import { blobToBase64, buildFormParamsExportZip } from './buildFormExportZip'
import { parseFormFromExportZip } from './formStorage'
import type { SignatureFormState } from '../types/signatureForm'

export type CloudSignatureEntry = {
  id: string
  name: string
  savedAt: number
}

type CloudListResponse = {
  available: boolean
  entries?: CloudSignatureEntry[]
  error?: string
}

type CloudSaveResponse = {
  entry?: CloudSignatureEntry
  error?: string
}

const apiBase = '/api/signatures'

// Set by `AuthGate` once the user is signed in. We avoid pulling React hooks into
// this module so existing call sites (none of which are React components)
// keep working unchanged.
type TokenGetter = () => Promise<string | null>
let getToken: TokenGetter = async () => null

export const setCloudAuthTokenGetter = (next: TokenGetter): void => {
  getToken = next
}

const authedFetch = async (input: RequestInfo, init: RequestInit = {}): Promise<Response> => {
  const token = await getToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(input, { ...init, headers })
}

export const fetchCloudSignatures = async (): Promise<{
  available: boolean
  entries: CloudSignatureEntry[]
}> => {
  const response = await authedFetch(apiBase)
  if (!response.ok) {
    return { available: false, entries: [] }
  }
  const payload = (await response.json()) as CloudListResponse
  return {
    available: Boolean(payload.available),
    entries: Array.isArray(payload.entries) ? payload.entries : []
  }
}

export const saveCloudSignature = async (
  name: string,
  form: SignatureFormState,
  overwriteId?: string
): Promise<
  | { ok: true; entry: CloudSignatureEntry }
  | { ok: false; reason: 'unavailable' | 'too_large' | 'too_many' | 'storage_failed' | 'empty_name' }
> => {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { ok: false, reason: 'empty_name' }
  }

  const zipBlob = await buildFormParamsExportZip(form)
  const zipBase64 = await blobToBase64(zipBlob)

  const response = await authedFetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: trimmedName, overwriteId, zipBase64 })
  })

  if (response.status === 503) return { ok: false, reason: 'unavailable' }
  if (response.status === 413) return { ok: false, reason: 'too_large' }
  if (response.status === 409) return { ok: false, reason: 'too_many' }
  if (!response.ok) return { ok: false, reason: 'storage_failed' }

  const payload = (await response.json()) as CloudSaveResponse
  if (!payload.entry) return { ok: false, reason: 'storage_failed' }
  return { ok: true, entry: payload.entry }
}

export const loadCloudSignatureForm = async (
  id: string
): Promise<SignatureFormState | null> => {
  const response = await authedFetch(`${apiBase}/download?id=${encodeURIComponent(id)}`)
  if (!response.ok) return null

  const imported = await parseFormFromExportZip(await response.arrayBuffer())
  return imported?.kind === 'full' ? imported.form : null
}

export const deleteCloudSignature = async (id: string): Promise<boolean> => {
  const response = await authedFetch(apiBase, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  return response.ok
}

export const findCloudSignatureByName = (
  entries: CloudSignatureEntry[],
  name: string
): CloudSignatureEntry | null => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  return entries.find((entry) => entry.name.trim().toLowerCase() === normalized) ?? null
}

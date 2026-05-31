import { blobToBase64, buildFormParamsExportZip } from './buildFormExportZip'
import { parseFormFromExportZip } from './formStorage'
import type { SignatureFormState } from '../types/signatureForm'
import { getWorkspaceId } from './workspaceId'

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

export const fetchCloudSignatures = async (): Promise<{
  available: boolean
  entries: CloudSignatureEntry[]
}> => {
  const workspaceId = getWorkspaceId()
  const response = await fetch(`${apiBase}?workspaceId=${encodeURIComponent(workspaceId)}`)

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

  const workspaceId = getWorkspaceId()
  const zipBlob = await buildFormParamsExportZip(form)
  const zipBase64 = await blobToBase64(zipBlob)

  const response = await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspaceId,
      name: trimmedName,
      overwriteId,
      zipBase64
    })
  })

  if (response.status === 503) {
    return { ok: false, reason: 'unavailable' }
  }
  if (response.status === 413) {
    return { ok: false, reason: 'too_large' }
  }
  if (response.status === 409) {
    return { ok: false, reason: 'too_many' }
  }
  if (!response.ok) {
    return { ok: false, reason: 'storage_failed' }
  }

  const payload = (await response.json()) as CloudSaveResponse
  if (!payload.entry) {
    return { ok: false, reason: 'storage_failed' }
  }

  return { ok: true, entry: payload.entry }
}

export const loadCloudSignatureForm = async (
  id: string
): Promise<SignatureFormState | null> => {
  const workspaceId = getWorkspaceId()
  const response = await fetch(
    `${apiBase}/download?workspaceId=${encodeURIComponent(workspaceId)}&id=${encodeURIComponent(id)}`
  )

  if (!response.ok) {
    return null
  }

  const imported = await parseFormFromExportZip(await response.arrayBuffer())
  return imported?.kind === 'full' ? imported.form : null
}

export const deleteCloudSignature = async (id: string): Promise<boolean> => {
  const workspaceId = getWorkspaceId()
  const response = await fetch(apiBase, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workspaceId, id })
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

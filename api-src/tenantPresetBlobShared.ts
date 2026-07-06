import { get, put } from '@vercel/blob'
import type { SignatureFormState } from '../src/types/signatureForm'

export const MAX_TENANT_PRESETS = 20

export type TenantPresetEntry = {
  id: string
  name: string
  values: Partial<SignatureFormState>
  createdAt: number
}

export type TenantPresetsFile = {
  version: 1
  defaultPresetId: string | null
  entries: TenantPresetEntry[]
}

export const isTenantPresetBlobConfigured = (): boolean =>
  Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

export const tenantPresetsPath = (tenantId: string): string =>
  `presets/tenants/${tenantId}/presets.json`

const emptyFile = (): TenantPresetsFile => ({
  version: 1,
  defaultPresetId: null,
  entries: []
})

export const readTenantPresets = async (tenantId: string): Promise<TenantPresetsFile> => {
  try {
    const result = await get(tenantPresetsPath(tenantId), { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) return emptyFile()
    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text) as TenantPresetsFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) return emptyFile()
    return {
      version: 1,
      defaultPresetId: typeof parsed.defaultPresetId === 'string' ? parsed.defaultPresetId : null,
      entries: parsed.entries.filter(
        (e) =>
          e &&
          typeof e.id === 'string' &&
          typeof e.name === 'string' &&
          typeof e.createdAt === 'number' &&
          e.values &&
          typeof e.values === 'object'
      )
    }
  } catch {
    return emptyFile()
  }
}

export const writeTenantPresets = async (
  tenantId: string,
  file: TenantPresetsFile
): Promise<void> => {
  await put(tenantPresetsPath(tenantId), JSON.stringify(file), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}

export const upsertPresetEntry = (
  file: TenantPresetsFile,
  entry: TenantPresetEntry
): TenantPresetsFile => {
  const isExisting = file.entries.some((e) => e.id === entry.id)
  if (!isExisting && file.entries.length >= MAX_TENANT_PRESETS) {
    throw new Error('TOO_MANY')
  }
  const withoutEntry = file.entries.filter((e) => e.id !== entry.id)
  return {
    ...file,
    entries: [entry, ...withoutEntry].sort((a, b) => b.createdAt - a.createdAt)
  }
}

export const removePresetEntry = (
  file: TenantPresetsFile,
  id: string
): TenantPresetsFile => {
  return {
    ...file,
    defaultPresetId: file.defaultPresetId === id ? null : file.defaultPresetId,
    entries: file.entries.filter((e) => e.id !== id)
  }
}

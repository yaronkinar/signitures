import { del, get, put } from '@vercel/blob'

export const MAX_CLOUD_SAVES = 30
export const MAX_ZIP_BYTES = 10 * 1024 * 1024

export type ManifestEntry = {
  id: string
  name: string
  savedAt: number
}

export type SignatureManifest = {
  version: 1
  entries: ManifestEntry[]
}

export const isBlobConfigured = (): boolean => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())

export const validateSaveId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

export const validateTenantId = (value: string): boolean =>
  /^(domain:[a-z0-9.-]+|user:[A-Za-z0-9_-]+)$/.test(value)

export const manifestPath = (tenantId: string): string =>
  `signatures/tenants/${tenantId}/manifest.json`

export const zipPath = (tenantId: string, saveId: string): string =>
  `signatures/tenants/${tenantId}/${saveId}.zip`

const emptyManifest = (): SignatureManifest => ({ version: 1, entries: [] })

export const readManifest = async (tenantId: string): Promise<SignatureManifest> => {
  try {
    const pathname = manifestPath(tenantId)
    const result = await get(pathname, { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return emptyManifest()
    }

    const text = await new Response(result.stream).text()
    const parsed = JSON.parse(text) as SignatureManifest
    if (parsed?.version !== 1 || !Array.isArray(parsed.entries)) {
      return emptyManifest()
    }

    return {
      version: 1,
      entries: parsed.entries.filter(
        (entry) =>
          entry &&
          typeof entry.id === 'string' &&
          typeof entry.name === 'string' &&
          typeof entry.savedAt === 'number'
      )
    }
  } catch {
    return emptyManifest()
  }
}

export const writeManifest = async (
  tenantId: string,
  manifest: SignatureManifest
): Promise<void> => {
  await put(manifestPath(tenantId), JSON.stringify(manifest), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}

export const saveZipToBlob = async (
  tenantId: string,
  saveId: string,
  zipBytes: Buffer
): Promise<void> => {
  await put(zipPath(tenantId, saveId), zipBytes, {
    access: 'private',
    contentType: 'application/zip',
    addRandomSuffix: false,
    allowOverwrite: true
  })
}

export const readZipFromBlob = async (tenantId: string, saveId: string): Promise<Buffer | null> => {
  try {
    const result = await get(zipPath(tenantId, saveId), { access: 'private' })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return null
    }

    const arrayBuffer = await new Response(result.stream).arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

export const deleteZipFromBlob = async (tenantId: string, saveId: string): Promise<void> => {
  await del(zipPath(tenantId, saveId))
}

export const upsertManifestEntry = (
  manifest: SignatureManifest,
  entry: ManifestEntry,
  replaceId?: string
): SignatureManifest => {
  const withoutEntry = manifest.entries.filter((item) => item.id !== entry.id)
  const isNew = !manifest.entries.some((item) => item.id === entry.id)

  if (replaceId) {
    const withoutReplace = withoutEntry.filter((item) => item.id !== replaceId)
    return {
      version: 1,
      entries: [entry, ...withoutReplace].sort((left, right) => right.savedAt - left.savedAt)
    }
  }

  if (isNew && manifest.entries.length >= MAX_CLOUD_SAVES) {
    throw new Error('TOO_MANY')
  }

  return {
    version: 1,
    entries: [entry, ...withoutEntry].sort((left, right) => right.savedAt - left.savedAt)
  }
}

export const findManifestEntryByName = (
  manifest: SignatureManifest,
  name: string
): ManifestEntry | null => {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return null
  return manifest.entries.find((entry) => entry.name.trim().toLowerCase() === normalized) ?? null
}

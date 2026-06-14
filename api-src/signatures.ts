import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { AuthError, requireUser, resolveTenant } from './auth'
import {
  deleteZipFromBlob,
  findManifestEntryByName,
  isBlobConfigured,
  readManifest,
  saveZipToBlob,
  upsertManifestEntry,
  validateSaveId,
  writeManifest,
  type ManifestEntry
} from './signatureBlobShared'

const parseJsonBody = (body: unknown): Record<string, unknown> => {
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  if (typeof body === 'string' && body.trim()) {
    try {
      const parsed = JSON.parse(body) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>
      }
    } catch {
      // fall through
    }
  }
  return {}
}

const blobUnavailable = (res: VercelResponse): void => {
  res.status(503).json({
    available: false,
    error: 'Blob storage is not configured. Add BLOB_READ_WRITE_TOKEN in Vercel project settings.'
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (!isBlobConfigured()) {
      if (req.method === 'GET') {
        res.status(200).json({ available: false, entries: [] })
        return
      }
      blobUnavailable(res)
      return
    }

    if (req.method === 'GET') {
      const manifest = await readManifest(tenant.id)
      res.status(200).json({ available: true, entries: manifest.entries })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req.body)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const zipBase64 = typeof body.zipBase64 === 'string' ? body.zipBase64.trim() : ''
      const overwriteId =
        typeof body.overwriteId === 'string' && validateSaveId(body.overwriteId)
          ? body.overwriteId
          : undefined

      if (!name) {
        res.status(400).json({ error: 'Missing name' })
        return
      }
      if (!zipBase64) {
        res.status(400).json({ error: 'Missing zipBase64' })
        return
      }

      const zipBytes = Buffer.from(zipBase64, 'base64')
      if (!zipBytes.length) {
        res.status(400).json({ error: 'Invalid zip payload' })
        return
      }
      if (zipBytes.length > 10 * 1024 * 1024) {
        res.status(413).json({ error: 'Signature package is too large (max 10 MB).' })
        return
      }

      const manifest = await readManifest(tenant.id)
      const existingByName = findManifestEntryByName(manifest, name)
      const saveId = overwriteId ?? existingByName?.id ?? randomUUID()
      const now = Date.now()
      const entry: ManifestEntry = { id: saveId, name, savedAt: now }

      let nextManifest
      try {
        nextManifest = upsertManifestEntry(manifest, entry, overwriteId ?? existingByName?.id)
      } catch (error) {
        if (error instanceof Error && error.message === 'TOO_MANY') {
          res.status(409).json({ error: 'Too many saved signatures' })
          return
        }
        throw error
      }

      await saveZipToBlob(tenant.id, saveId, zipBytes)
      await writeManifest(tenant.id, nextManifest)

      res.status(200).json({ entry })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody(req.body)
      const saveId = typeof body.id === 'string' ? body.id.trim() : ''

      if (!validateSaveId(saveId)) {
        res.status(400).json({ error: 'Invalid id' })
        return
      }

      const manifest = await readManifest(tenant.id)
      const nextManifest = {
        version: 1 as const,
        entries: manifest.entries.filter((entry) => entry.id !== saveId)
      }

      await deleteZipFromBlob(tenant.id, saveId).catch(() => undefined)
      await writeManifest(tenant.id, nextManifest)

      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Blob request failed'
    console.error('[signatures]', message, error)
    res.status(500).json({ error: message })
  }
}

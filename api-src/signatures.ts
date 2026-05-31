import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import {
  deleteZipFromBlob,
  findManifestEntryByName,
  isBlobConfigured,
  readManifest,
  readZipFromBlob,
  saveZipToBlob,
  upsertManifestEntry,
  validateSaveId,
  validateWorkspaceId,
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
    if (!isBlobConfigured()) {
      if (req.method === 'GET') {
        res.status(200).json({ available: false, entries: [] })
        return
      }
      blobUnavailable(res)
      return
    }

    if (req.method === 'GET') {
      const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
      if (!validateWorkspaceId(workspaceId)) {
        res.status(400).json({ error: 'Invalid workspaceId' })
        return
      }

      const manifest = await readManifest(workspaceId)
      res.status(200).json({ available: true, entries: manifest.entries })
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req.body)
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const zipBase64 = typeof body.zipBase64 === 'string' ? body.zipBase64.trim() : ''
      const overwriteId =
        typeof body.overwriteId === 'string' && validateSaveId(body.overwriteId)
          ? body.overwriteId
          : undefined

      if (!validateWorkspaceId(workspaceId)) {
        res.status(400).json({ error: 'Invalid workspaceId' })
        return
      }
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

      const manifest = await readManifest(workspaceId)
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

      await saveZipToBlob(workspaceId, saveId, zipBytes)
      await writeManifest(workspaceId, nextManifest)

      res.status(200).json({ entry })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody(req.body)
      const workspaceId = typeof body.workspaceId === 'string' ? body.workspaceId.trim() : ''
      const saveId = typeof body.id === 'string' ? body.id.trim() : ''

      if (!validateWorkspaceId(workspaceId) || !validateSaveId(saveId)) {
        res.status(400).json({ error: 'Invalid workspaceId or id' })
        return
      }

      const manifest = await readManifest(workspaceId)
      const nextManifest = {
        version: 1 as const,
        entries: manifest.entries.filter((entry) => entry.id !== saveId)
      }

      await deleteZipFromBlob(workspaceId, saveId).catch(() => undefined)
      await writeManifest(workspaceId, nextManifest)

      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Blob request failed'
    console.error('[signatures]', message, error)
    res.status(500).json({ error: message })
  }
}

export const downloadHandler = async (req: VercelRequest, res: VercelResponse): Promise<void> => {
  try {
    if (!isBlobConfigured()) {
      blobUnavailable(res)
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const saveId = typeof req.query.id === 'string' ? req.query.id.trim() : ''
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''

    if (!validateWorkspaceId(workspaceId) || !validateSaveId(saveId)) {
      res.status(400).json({ error: 'Invalid workspaceId or id' })
      return
    }

    const manifest = await readManifest(workspaceId)
    if (!manifest.entries.some((entry) => entry.id === saveId)) {
      res.status(404).json({ error: 'Saved signature not found' })
      return
    }

    const zipBytes = await readZipFromBlob(workspaceId, saveId)
    if (!zipBytes) {
      res.status(404).json({ error: 'Saved signature file not found' })
      return
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).send(zipBytes)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed'
    console.error('[signatures-download]', message, error)
    res.status(500).json({ error: message })
  }
}

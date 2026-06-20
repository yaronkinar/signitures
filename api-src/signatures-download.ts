import type { VercelRequest, VercelResponse } from '@vercel/node'
import { AuthError, requireUser, resolveTenant } from './auth'
import { isPro, readEntitlements } from './entitlements'
import {
  isBlobConfigured,
  readManifest,
  readZipFromBlob,
  validateSaveId
} from './signatureBlobShared'

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

    const entitlements = await readEntitlements(tenant.id)
    if (!isPro(entitlements)) {
      res.status(403).json({ error: 'Pro subscription required' })
      return
    }

    if (!isBlobConfigured()) {
      blobUnavailable(res)
      return
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const saveId = typeof req.query.id === 'string' ? req.query.id.trim() : ''
    if (!validateSaveId(saveId)) {
      res.status(400).json({ error: 'Invalid id' })
      return
    }

    const manifest = await readManifest(tenant.id)
    if (!manifest.entries.some((entry) => entry.id === saveId)) {
      res.status(404).json({ error: 'Saved signature not found' })
      return
    }

    const zipBytes = await readZipFromBlob(tenant.id, saveId)
    if (!zipBytes) {
      res.status(404).json({ error: 'Saved signature file not found' })
      return
    }

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Cache-Control', 'private, no-store')
    res.status(200).send(zipBytes)
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Download failed'
    console.error('[signatures-download]', message, error)
    res.status(500).json({ error: message })
  }
}

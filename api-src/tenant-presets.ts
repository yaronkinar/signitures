import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { AuthError, requireUser, resolveTenant } from './auth'
import {
  isTenantPresetBlobConfigured,
  readTenantPresets,
  writeTenantPresets,
  upsertPresetEntry,
  removePresetEntry,
  type TenantPresetEntry
} from './tenantPresetBlobShared'
import { validateSaveId } from './signatureBlobShared'

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
  res.status(503).json({ available: false, error: 'Blob storage is not configured.' })
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const user = await requireUser(req)
    const tenant = resolveTenant(user)

    if (req.method === 'GET') {
      if (!isTenantPresetBlobConfigured()) {
        res.status(200).json({ available: false, defaultPresetId: null, entries: [] })
        return
      }
      const file = await readTenantPresets(tenant.id)
      res.status(200).json({ available: true, defaultPresetId: file.defaultPresetId, entries: file.entries })
      return
    }

    if (!isTenantPresetBlobConfigured()) {
      blobUnavailable(res)
      return
    }

    if (req.method === 'POST') {
      const body = parseJsonBody(req.body)
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      const values = body.values && typeof body.values === 'object' && !Array.isArray(body.values)
        ? body.values
        : null
      const overwriteId =
        typeof body.overwriteId === 'string' && validateSaveId(body.overwriteId)
          ? body.overwriteId
          : undefined

      if (!name) {
        res.status(400).json({ error: 'Missing name' })
        return
      }
      if (!values) {
        res.status(400).json({ error: 'Missing values' })
        return
      }
      if (JSON.stringify(values).length > 50_000) {
        res.status(413).json({ error: 'Preset values too large' })
        return
      }

      const file = await readTenantPresets(tenant.id)
      const id = overwriteId ?? randomUUID()
      const entry: TenantPresetEntry = { id, name, values: values as Record<string, unknown>, createdAt: Date.now() }

      let nextFile
      try {
        nextFile = upsertPresetEntry(file, entry)
      } catch (error) {
        if (error instanceof Error && error.message === 'TOO_MANY') {
          res.status(409).json({ error: 'Too many presets (max 20)' })
          return
        }
        throw error
      }

      await writeTenantPresets(tenant.id, nextFile)
      res.status(200).json({ entry })
      return
    }

    if (req.method === 'DELETE') {
      const body = parseJsonBody(req.body)
      const id = typeof body.id === 'string' ? body.id.trim() : ''
      if (!validateSaveId(id)) {
        res.status(400).json({ error: 'Invalid id' })
        return
      }

      const file = await readTenantPresets(tenant.id)
      const nextFile = removePresetEntry(file, id)
      await writeTenantPresets(tenant.id, nextFile)
      res.status(200).json({ ok: true })
      return
    }

    if (req.method === 'PATCH') {
      const body = parseJsonBody(req.body)
      const defaultPresetId =
        body.defaultPresetId === null
          ? null
          : typeof body.defaultPresetId === 'string' && validateSaveId(body.defaultPresetId)
          ? body.defaultPresetId
          : undefined

      if (defaultPresetId === undefined) {
        res.status(400).json({ error: 'Invalid defaultPresetId' })
        return
      }

      const file = await readTenantPresets(tenant.id)

      if (defaultPresetId !== null && !file.entries.some((e) => e.id === defaultPresetId)) {
        res.status(404).json({ error: 'Preset not found' })
        return
      }

      await writeTenantPresets(tenant.id, { ...file, defaultPresetId })
      res.status(200).json({ ok: true })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Request failed'
    console.error('[tenant-presets]', message, error)
    res.status(500).json({ error: message })
  }
}

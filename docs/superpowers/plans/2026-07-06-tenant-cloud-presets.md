# Tenant Cloud Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store a per-tenant library of named style presets (+ an optional default) in Vercel Blob so every signed-in user of a tenant sees shared presets and the tenant default is applied automatically on first load.

**Architecture:** Single private JSON blob per tenant at `presets/tenants/{tenantId}/presets.json`. A new `api/tenant-presets.js` serverless function handles CRUD + set-default. The client module `src/lib/cloudTenantPresets.ts` wraps the API calls. `useSignatureApp.ts` fetches presets on mount and auto-applies the default when the form is still at its initial default state. UI controls live in the Layout & Typography panel of `App.tsx`.

**Tech Stack:** TypeScript, `@vercel/blob`, Vitest, React, Clerk auth (same as existing signatures feature)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `api-src/tenantPresetBlobShared.ts` | Create | Types + Blob read/write helpers |
| `api-src/tenant-presets.ts` | Create | Serverless handler (GET/POST/DELETE/PATCH) |
| `api/tenant-presets.js` | Create (generated) | Bundled serverless function |
| `scripts/bundle-api.mjs` | Modify | Add bundle entry for tenant-presets |
| `src/lib/cloudTenantPresets.ts` | Create | Client-side fetch wrappers |
| `src/i18n.ts` | Modify | Add tenant preset UI strings (en + he) |
| `src/hooks/useSignatureApp.ts` | Modify | Fetch presets on mount, auto-apply default, expose actions |
| `src/App.tsx` | Modify | Tenant preset UI in Layout & Typography panel |

---

## Task 1: Blob shared helpers + types

**Files:**
- Create: `api-src/tenantPresetBlobShared.ts`

- [ ] **Step 1: Write failing tests**

Create `api-src/tenantPresetBlobShared.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  tenantPresetsPath,
  upsertPresetEntry,
  removePresetEntry,
  MAX_TENANT_PRESETS,
  type TenantPresetsFile,
  type TenantPresetEntry
} from './tenantPresetBlobShared'

const makeEntry = (id: string, name: string): TenantPresetEntry => ({
  id,
  name,
  values: { accentColor: '#ff0000' },
  createdAt: 1000
})

const emptyFile = (): TenantPresetsFile => ({
  version: 1,
  defaultPresetId: null,
  entries: []
})

describe('tenantPresetsPath', () => {
  it('builds the correct blob path', () => {
    expect(tenantPresetsPath('domain:example.com')).toBe(
      'presets/tenants/domain:example.com/presets.json'
    )
  })
})

describe('upsertPresetEntry', () => {
  it('adds a new entry', () => {
    const file = emptyFile()
    const entry = makeEntry('id-1', 'My Preset')
    const result = upsertPresetEntry(file, entry)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].id).toBe('id-1')
  })

  it('overwrites an existing entry by id', () => {
    const entry = makeEntry('id-1', 'Old Name')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries: [entry] }
    const updated = { ...entry, name: 'New Name' }
    const result = upsertPresetEntry(file, updated)
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].name).toBe('New Name')
  })

  it('throws TOO_MANY when at the limit', () => {
    const entries = Array.from({ length: MAX_TENANT_PRESETS }, (_, i) =>
      makeEntry(`id-${i}`, `Preset ${i}`)
    )
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries }
    expect(() => upsertPresetEntry(file, makeEntry('new-id', 'Extra'))).toThrow('TOO_MANY')
  })

  it('does NOT throw when overwriting an existing entry at the limit', () => {
    const entries = Array.from({ length: MAX_TENANT_PRESETS }, (_, i) =>
      makeEntry(`id-${i}`, `Preset ${i}`)
    )
    const file: TenantPresetsFile = { version: 1, defaultPresetId: null, entries }
    const updated = { ...entries[0], name: 'Renamed' }
    expect(() => upsertPresetEntry(file, updated)).not.toThrow()
  })
})

describe('removePresetEntry', () => {
  it('removes the matching entry', () => {
    const entry = makeEntry('id-1', 'My Preset')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [entry] }
    const result = removePresetEntry(file, 'id-1')
    expect(result.entries).toHaveLength(0)
    expect(result.defaultPresetId).toBeNull()
  })

  it('clears defaultPresetId when the default entry is removed', () => {
    const e1 = makeEntry('id-1', 'A')
    const e2 = makeEntry('id-2', 'B')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [e1, e2] }
    const result = removePresetEntry(file, 'id-1')
    expect(result.defaultPresetId).toBeNull()
    expect(result.entries).toHaveLength(1)
  })

  it('keeps defaultPresetId when a non-default entry is removed', () => {
    const e1 = makeEntry('id-1', 'A')
    const e2 = makeEntry('id-2', 'B')
    const file: TenantPresetsFile = { version: 1, defaultPresetId: 'id-1', entries: [e1, e2] }
    const result = removePresetEntry(file, 'id-2')
    expect(result.defaultPresetId).toBe('id-1')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run api-src/tenantPresetBlobShared.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create `api-src/tenantPresetBlobShared.ts`**

```ts
import { del, get, put } from '@vercel/blob'
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run api-src/tenantPresetBlobShared.test.ts
```

Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add api-src/tenantPresetBlobShared.ts api-src/tenantPresetBlobShared.test.ts
git commit -m "feat: add tenant preset blob shared helpers"
```

---

## Task 2: API handler

**Files:**
- Create: `api-src/tenant-presets.ts`

- [ ] **Step 1: Create `api-src/tenant-presets.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add api-src/tenant-presets.ts
git commit -m "feat: add tenant-presets API handler"
```

---

## Task 3: Bundle the new API function

**Files:**
- Modify: `scripts/bundle-api.mjs`
- Create (generated): `api/tenant-presets.js`

- [ ] **Step 1: Add the bundle entry to `scripts/bundle-api.mjs`**

In the `bundles` array, add after the `admin-tenants` entry:

```js
  ['api-src/tenant-presets.ts', 'api/tenant-presets.js'],
```

The full array should look like:
```js
const bundles = [
  ['api-src/design-signature.ts', 'api/design-signature.js'],
  ['api-src/signatures.ts', 'api/signatures.js'],
  ['api-src/signatures-download.ts', 'api/signatures/download.js'],
  ['api-src/entitlements-get.ts', 'api/entitlements.js'],
  ['api-src/entitlements-checkout.ts', 'api/entitlements/checkout.js'],
  ['api-src/webhooks-lemonsqueezy.ts', 'api/webhooks/lemonsqueezy.js'],
  ['api-src/admin-set-pro.ts', 'api/admin/set-pro.js'],
  ['api-src/admin-global-pro.ts', 'api/admin/global-pro.js'],
  ['api-src/admin-tenants.ts', 'api/admin/tenants.js'],
  ['api-src/tenant-presets.ts', 'api/tenant-presets.js'],
]
```

- [ ] **Step 2: Run the bundle script**

```bash
node scripts/bundle-api.mjs
```

Expected output includes: `Bundled api/tenant-presets.js`

- [ ] **Step 3: Commit**

```bash
git add scripts/bundle-api.mjs api/tenant-presets.js
git commit -m "feat: bundle tenant-presets serverless function"
```

---

## Task 4: Client module

**Files:**
- Create: `src/lib/cloudTenantPresets.ts`

- [ ] **Step 1: Create `src/lib/cloudTenantPresets.ts`**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cloudTenantPresets.ts
git commit -m "feat: add cloudTenantPresets client module"
```

---

## Task 5: i18n strings

**Files:**
- Modify: `src/i18n.ts`

- [ ] **Step 1: Add English strings**

In `src/i18n.ts`, find the English block. After the `brandPresetHint` / `brandColors` lines (around line 202), add:

```ts
    tenantPresets: 'Team presets',
    tenantPresetPlaceholder: 'Apply a team preset...',
    tenantPresetSaveButton: 'Save current style as preset',
    tenantPresetNameLabel: 'Preset name',
    tenantPresetNamePlaceholder: 'e.g. Blue theme',
    tenantPresetSaveConfirm: 'Save preset',
    tenantPresetCancel: 'Cancel',
    tenantPresetSetDefault: 'Set as default',
    tenantPresetClearDefault: 'Clear default',
    tenantPresetDelete: 'Delete',
    tenantPresetDeleteConfirm: 'Delete this preset?',
    tenantPresetSaveSuccess: 'Preset saved',
    tenantPresetSaveTooMany: 'Cannot save — 20 presets already exist',
    tenantPresetSaveFailed: 'Failed to save preset',
    tenantPresetDeleteSuccess: 'Preset deleted',
    tenantPresetDeleteFailed: 'Failed to delete preset',
    tenantPresetDefaultSet: 'Default updated',
    tenantPresetDefaultFailed: 'Failed to update default',
```

- [ ] **Step 2: Add Hebrew strings**

In `src/i18n.ts`, find the Hebrew block. After the `brandColors` Hebrew line (around line 646), add:

```ts
    tenantPresets: 'תבניות הצוות',
    tenantPresetPlaceholder: 'החלת תבנית צוות...',
    tenantPresetSaveButton: 'שמירת הסגנון הנוכחי כתבנית',
    tenantPresetNameLabel: 'שם התבנית',
    tenantPresetNamePlaceholder: 'למשל: ערכת כחול',
    tenantPresetSaveConfirm: 'שמירת תבנית',
    tenantPresetCancel: 'ביטול',
    tenantPresetSetDefault: 'הגדרה כברירת מחדל',
    tenantPresetClearDefault: 'ניקוי ברירת המחדל',
    tenantPresetDelete: 'מחיקה',
    tenantPresetDeleteConfirm: 'למחוק תבנית זו?',
    tenantPresetSaveSuccess: 'התבנית נשמרה',
    tenantPresetSaveTooMany: 'לא ניתן לשמור — כבר קיימות 20 תבניות',
    tenantPresetSaveFailed: 'שמירת התבנית נכשלה',
    tenantPresetDeleteSuccess: 'התבנית נמחקה',
    tenantPresetDeleteFailed: 'מחיקת התבנית נכשלה',
    tenantPresetDefaultSet: 'ברירת המחדל עודכנה',
    tenantPresetDefaultFailed: 'עדכון ברירת המחדל נכשל',
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/i18n.ts
git commit -m "feat: add tenant preset i18n strings"
```

---

## Task 6: Hook — fetch, auto-apply, and expose actions

**Files:**
- Modify: `src/hooks/useSignatureApp.ts`

- [ ] **Step 1: Add imports at the top of `useSignatureApp.ts`**

After the `cloudSignatures` import block, add:

```ts
import {
  deleteTenantPreset,
  fetchTenantPresets,
  saveTenantPreset,
  setTenantDefaultPreset,
  type TenantPresetEntry
} from '../lib/cloudTenantPresets'
import { loadStoredFormState } from '../lib/formStorage'
```

- [ ] **Step 2: Add state and refs inside `useSignatureApp`**

After the `cloudStorageAvailable` state (line ~124), add:

```ts
  const [tenantPresetsAvailable, setTenantPresetsAvailable] = useState(false)
  const [tenantPresets, setTenantPresets] = useState<TenantPresetEntry[]>([])
  const [tenantDefaultPresetId, setTenantDefaultPresetId] = useState<string | null>(null)
  // true when the form was at its factory default on mount (nothing in localStorage)
  const formWasDefaultOnMountRef = useRef(loadStoredFormState() === null)
  const tenantDefaultAppliedRef = useRef(false)
```

- [ ] **Step 3: Add `refreshTenantPresets` callback**

After `refreshSavedSignatures`, add:

```ts
  const refreshTenantPresets = useCallback(async () => {
    const result = await fetchTenantPresets()
    setTenantPresetsAvailable(result.available)
    setTenantPresets(result.entries)
    setTenantDefaultPresetId(result.defaultPresetId)
    return result
  }, [])
```

- [ ] **Step 4: Add auto-apply effect**

After the `refreshSavedSignatures` useEffect (the one that calls it on mount), add:

```ts
  useEffect(() => {
    if (tenantDefaultAppliedRef.current) return
    if (!tenantPresetsAvailable) return
    if (!tenantDefaultPresetId) return
    if (!formWasDefaultOnMountRef.current) return
    const preset = tenantPresets.find((e) => e.id === tenantDefaultPresetId)
    if (!preset) return
    tenantDefaultAppliedRef.current = true
    updateForm(preset.values, { immediate: true })
  }, [tenantPresetsAvailable, tenantDefaultPresetId, tenantPresets, updateForm])
```

- [ ] **Step 5: Fetch tenant presets on mount (inside `refreshSavedSignatures`)**

In `refreshSavedSignatures`, call `refreshTenantPresets` in parallel. Find the existing `refreshSavedSignatures` and add the parallel fetch:

```ts
  const refreshSavedSignatures = useCallback(async () => {
    if (!isPro) {
      setCloudStorageAvailable(false)
      setSavedSignatures(listSavedSignatures())
      setTenantPresetsAvailable(false)
      return
    }
    try {
      const [cloud] = await Promise.all([
        fetchCloudSignatures(),
        refreshTenantPresets()
      ])
      setCloudStorageAvailable(cloud.available)
      if (cloud.available) {
        setSavedSignatures(cloud.entries)
        return
      }
    } catch {
      // fall through
    }
    setSavedSignatures(listSavedSignatures())
  }, [isPro, refreshTenantPresets])
```

- [ ] **Step 6: Add `handleSaveTenantPreset`, `handleDeleteTenantPreset`, `handleSetTenantDefault`**

After `handleDeleteSaved`, add:

```ts
  const handleSaveTenantPreset = useCallback(
    async (name: string, overwriteId?: string): Promise<boolean> => {
      const styleFields: Array<keyof typeof form> = [
        'fontFamily', 'nameFontWeight', 'titleFontWeight', 'bodyFontWeight',
        'accentColor', 'textColor', 'secondaryTextColor', 'dividerColor', 'linkColor',
        'backgroundColor', 'nameColor', 'jobTitleColor', 'companyColor',
        'contactLabelColor', 'phoneColor', 'emailColor', 'websiteColor',
        'layoutPreset', 'logoSide', 'dividerThickness', 'textColumnWidth',
        'titleFontSize', 'logoMaxWidth', 'logoOffsetX', 'logoOffsetY', 'verticalAlign',
        'showContactLabels', 'contactMatchNameTitle', 'socialIconsLtrOrder',
        'textAlign', 'facebookIconVariant', 'instagramIconVariant',
        'linkedinIconVariant', 'xIconVariant', 'youtubeIconVariant'
      ]
      const values = Object.fromEntries(styleFields.map((k) => [k, form[k]])) as Partial<typeof form>
      const result = await saveTenantPreset(name, values, overwriteId)
      if (!result.ok) {
        const key =
          result.reason === 'too_many' ? 'tenantPresetSaveTooMany' : 'tenantPresetSaveFailed'
        addToast(t(lang, key), 'error')
        return false
      }
      await refreshTenantPresets()
      addToast(t(lang, 'tenantPresetSaveSuccess'), 'success')
      return true
    },
    [addToast, form, lang, refreshTenantPresets]
  )

  const handleDeleteTenantPreset = useCallback(
    async (id: string): Promise<void> => {
      if (!window.confirm(t(lang, 'tenantPresetDeleteConfirm'))) return
      const ok = await deleteTenantPreset(id)
      if (!ok) {
        addToast(t(lang, 'tenantPresetDeleteFailed'), 'error')
        return
      }
      await refreshTenantPresets()
      addToast(t(lang, 'tenantPresetDeleteSuccess'), 'success')
    },
    [addToast, lang, refreshTenantPresets]
  )

  const handleSetTenantDefaultPreset = useCallback(
    async (id: string | null): Promise<void> => {
      const ok = await setTenantDefaultPreset(id)
      if (!ok) {
        addToast(t(lang, 'tenantPresetDefaultFailed'), 'error')
        return
      }
      setTenantDefaultPresetId(id)
      addToast(t(lang, 'tenantPresetDefaultSet'), 'success')
    },
    [addToast, lang]
  )

  const applyTenantPreset = useCallback(
    (entry: TenantPresetEntry) => {
      updateForm(entry.values, { immediate: true })
    },
    [updateForm]
  )
```

- [ ] **Step 7: Add the new state and handlers to the hook's return value**

Find the `return {` at the bottom of `useSignatureApp` and add:

```ts
    tenantPresetsAvailable,
    tenantPresets,
    tenantDefaultPresetId,
    handleSaveTenantPreset,
    handleDeleteTenantPreset,
    handleSetTenantDefaultPreset,
    applyTenantPreset,
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useSignatureApp.ts src/lib/cloudTenantPresets.ts
git commit -m "feat: fetch tenant presets on mount and auto-apply tenant default"
```

---

## Task 7: UI in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Destructure new values from `app`**

At the top of `App.tsx` where `app` is destructured, add:

```ts
  const {
    // ... existing ...
    tenantPresetsAvailable,
    tenantPresets,
    tenantDefaultPresetId,
    handleSaveTenantPreset,
    handleDeleteTenantPreset,
    handleSetTenantDefaultPreset,
    applyTenantPreset
  } = app
```

- [ ] **Step 2: Add local state for the save-preset modal**

After the existing `brandPresetId` state (around line 272), add:

```ts
  const [tenantPresetSaveOpen, setTenantPresetSaveOpen] = useState(false)
  const [tenantPresetSaveName, setTenantPresetSaveName] = useState('')
  const [tenantPresetSaving, setTenantPresetSaving] = useState(false)
```

- [ ] **Step 3: Add the save-preset submit handler**

After the existing `applyBrandPreset` function, add:

```ts
  const submitSaveTenantPreset = async () => {
    const name = tenantPresetSaveName.trim()
    if (!name) return
    setTenantPresetSaving(true)
    const ok = await handleSaveTenantPreset(name)
    setTenantPresetSaving(false)
    if (ok) {
      setTenantPresetSaveOpen(false)
      setTenantPresetSaveName('')
    }
  }
```

- [ ] **Step 4: Add the tenant presets UI section in the Layout & Typography panel**

In the Layout & Typography panel (`<Panel id="panel-layout" ...>`), directly after the closing `</div>` of the `brand-preset-row` div (around line 979), add:

```tsx
              {tenantPresetsAvailable && (
                <div className="tenant-preset-row">
                  <Field label={t(lang, 'tenantPresets')}>
                    <SelectInput value="" onChange={(e) => {
                      const entry = tenantPresets.find((p) => p.id === e.target.value)
                      if (entry) applyTenantPreset(entry)
                    }}>
                      <option value="">{t(lang, 'tenantPresetPlaceholder')}</option>
                      {tenantPresets.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}{preset.id === tenantDefaultPresetId ? ' ★' : ''}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>

                  {tenantPresets.length > 0 && (
                    <div className="tenant-preset-actions">
                      {tenantPresets.map((preset) => (
                        <div key={preset.id} className="tenant-preset-action-row">
                          <span className="tenant-preset-action-name">{preset.name}</span>
                          <button
                            type="button"
                            className="tenant-preset-btn"
                            title={preset.id === tenantDefaultPresetId
                              ? t(lang, 'tenantPresetClearDefault')
                              : t(lang, 'tenantPresetSetDefault')}
                            onClick={() => handleSetTenantDefaultPreset(
                              preset.id === tenantDefaultPresetId ? null : preset.id
                            )}
                          >
                            {preset.id === tenantDefaultPresetId ? '★' : '☆'}
                          </button>
                          <button
                            type="button"
                            className="tenant-preset-btn tenant-preset-btn--delete"
                            title={t(lang, 'tenantPresetDelete')}
                            onClick={() => handleDeleteTenantPreset(preset.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {!tenantPresetSaveOpen && (
                    <button
                      type="button"
                      className="tenant-preset-save-btn"
                      onClick={() => setTenantPresetSaveOpen(true)}
                    >
                      {t(lang, 'tenantPresetSaveButton')}
                    </button>
                  )}

                  {tenantPresetSaveOpen && (
                    <div className="tenant-preset-save-form">
                      <label className="field-label">{t(lang, 'tenantPresetNameLabel')}</label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder={t(lang, 'tenantPresetNamePlaceholder')}
                        value={tenantPresetSaveName}
                        onChange={(e) => setTenantPresetSaveName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitSaveTenantPreset() }}
                        autoFocus
                      />
                      <div className="tenant-preset-save-btns">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={!tenantPresetSaveName.trim() || tenantPresetSaving}
                          onClick={submitSaveTenantPreset}
                        >
                          {t(lang, 'tenantPresetSaveConfirm')}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => { setTenantPresetSaveOpen(false); setTenantPresetSaveName('') }}
                        >
                          {t(lang, 'tenantPresetCancel')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add tenant preset UI to layout panel"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run the full test suite**

```bash
npx vitest run
```

Expected: all existing tests still pass, plus the new 8 tests from Task 1.

- [ ] **Step 2: Run the build**

```bash
npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 3: Commit any build artifacts**

If `api/tenant-presets.js` was regenerated by the build:

```bash
git add api/tenant-presets.js
git commit -m "chore: update bundled tenant-presets function"
```

---

## Self-Review Checklist

- [x] Spec section "Data Shape" → Task 1 (types + blob helpers)
- [x] Spec section "API Endpoints" (GET/POST/DELETE/PATCH) → Task 2
- [x] Spec "bundle" requirement → Task 3
- [x] Spec "Client Module" → Task 4
- [x] i18n for all new UI copy → Task 5
- [x] Spec "Auto-Apply Default on Load" → Task 6 Steps 4–5
- [x] Spec "UI" (dropdown, save, set-default, delete) → Task 7
- [x] Max 20 presets guard → Task 1 `upsertPresetEntry` + Task 2 POST handler
- [x] `defaultPresetId` cleared on delete → Task 1 `removePresetEntry`
- [x] No Pro gate (any signed-in user) → Task 2 (no `isPro` check)
- [x] Form default guard for auto-apply → Task 6 `formWasDefaultOnMountRef`

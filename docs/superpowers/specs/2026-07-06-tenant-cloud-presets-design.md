# Tenant Cloud Presets

**Date:** 2026-07-06  
**Status:** Approved  

## Summary

Each tenant gets a shared library of named style presets stored in Vercel Blob. One preset can be marked as the tenant default and is auto-applied when any user of that tenant first loads the app. Any signed-in user of the tenant can create, rename, delete, and promote presets.

---

## Data Shape

One file per tenant in Vercel Blob:

```
presets/tenants/{tenantId}/presets.json
```

Tenant ID follows the existing convention from `signatureBlobShared.ts`:
- `domain:{domain}` for organisation-level tenants
- `user:{userId}` for individual users

```ts
type TenantPresetEntry = {
  id: string                        // uuid v4
  name: string                      // user-given label
  values: Partial<SignatureFormState> // same fields as SignatureBrandPreset.values
  createdAt: number                 // unix ms
}

type TenantPresetsFile = {
  version: 1
  defaultPresetId: string | null    // entry.id of the auto-apply default, or null
  entries: TenantPresetEntry[]      // max 20
}
```

`values` carries the same style fields already used by `SignatureBrandPreset` in `brandPresets.ts` — colors, fonts, layout flags, icon variants, etc. Capturing `Partial<SignatureFormState>` allows saving either style-only or full layout+style combinations.

---

## API Endpoints

Single route file: `api-src/tenant-presets.ts` → compiled to `api/tenant-presets.js`.

All requests require a valid Clerk Bearer token (same auth pattern as `api-src/signatures.ts`). The tenant is derived from the token.

| Method   | Body                                      | Action                                      |
|----------|-------------------------------------------|---------------------------------------------|
| `GET`    | —                                         | Return `{ available, defaultPresetId, entries }` |
| `POST`   | `{ name, values, overwriteId? }`          | Create or overwrite a named preset          |
| `DELETE` | `{ id }`                                  | Delete a preset by id                       |
| `PATCH`  | `{ defaultPresetId: string \| null }`     | Set or clear the tenant default             |

**Error codes:**
- `503` — Blob not configured
- `409` — 20-preset limit reached (POST only)
- `413` — values payload too large (POST only)
- `404` — preset id not found (DELETE / PATCH)
- `401` — missing or invalid auth token

---

## Blob Helpers

New file: `api-src/tenantPresetBlobShared.ts`

Mirrors `signatureBlobShared.ts`. Exports:

```ts
isTenantPresetBlobConfigured(): boolean
tenantPresetsPath(tenantId: string): string
readTenantPresets(tenantId: string): Promise<TenantPresetsFile>
writeTenantPresets(tenantId: string, file: TenantPresetsFile): Promise<void>
```

Reads/writes a single private JSON blob. `readTenantPresets` returns an empty file `{ version: 1, defaultPresetId: null, entries: [] }` if the blob doesn't exist yet.

---

## Client Module

New file: `src/lib/cloudTenantPresets.ts`

Mirrors `cloudSignatures.ts`. Uses `authedFetch` from the same module.

```ts
fetchTenantPresets(): Promise<{ available: boolean; defaultPresetId: string | null; entries: TenantPresetEntry[] }>
saveTenantPreset(name: string, values: Partial<SignatureFormState>, overwriteId?: string): Promise<{ ok: boolean; entry?: TenantPresetEntry; reason?: string }>
deleteTenantPreset(id: string): Promise<boolean>
setTenantDefaultPreset(defaultPresetId: string | null): Promise<boolean>
```

---

## Auto-Apply Default on Load

In `useSignatureApp.ts`, after the Clerk token becomes available:

1. Call `fetchTenantPresets()` once.
2. If `defaultPresetId` is set, find the matching entry.
3. Apply its `values` via `updateForm(values, { immediate: true })` **only if** the form is still in its default state (i.e. the user has not loaded a cloud save, imported a file, or made manual edits since page load).
4. Store the fetched preset list in a state variable for the UI to consume.

The "untouched" check uses an existing `formIsDirty` or equivalent flag. If none exists, track a boolean `tenantDefaultApplied` ref that flips after the first user edit.

---

## UI

All changes in `App.tsx`, in the Layout & Typography panel alongside the existing `SBA_BRAND_PRESETS` dropdown.

**Tenant presets section** (rendered only when the user is signed in and `available === true`):

- Dropdown listing tenant preset names — selecting one calls `updateForm(entry.values, { immediate: true })`
- **"Save as preset…"** button → inline modal: name input + confirm → `saveTenantPreset`
- Each entry row (in a small management popover or list) has:
  - **★ Set as default** — calls `setTenantDefaultPreset(entry.id)`; active default shown with filled star
  - **✕ Delete** — calls `deleteTenantPreset(entry.id)` with confirmation

The existing hardcoded `SBA_BRAND_PRESETS` dropdown is unchanged. Tenant presets are additive.

---

## Constraints

- Max **20** named presets per tenant.
- `values` is stored as-is; no schema migration needed because `updateForm` already handles partial application via spread.
- The blob is private (not publicly accessible).
- No optimistic UI — all mutations await the API response before updating local state.

---

## Out of Scope

- Admin-only write permissions (deferred)
- Preset versioning or history
- Sharing presets across tenants

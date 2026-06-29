# Admin tenant list — design

**Date:** 2026-06-29
**Status:** Approved, ready for implementation plan

## Summary

The admin page (added in [2026-06-29-admin-pro-toggle-design.md](2026-06-29-admin-pro-toggle-design.md)) only supports looking up one customer by email at a time. There's no way to browse all tenants or grant Pro to a tenant that has no Clerk account yet (e.g. a corporate domain tenant before anyone at that domain has signed in — this came up for `service.economy.gov.il` and required a manual one-off script). Add a paginated "All tenants" table to `/admin` that lists every tenant with its Pro status and a per-row toggle.

## Decisions (locked)

| # | Decision |
|---|---|
| 1 | List tenants via `@vercel/blob`'s native `list({ prefix: 'entitlements/' })`, paginated with its cursor — no separate index file to maintain. |
| 2 | Page size is 25. Each page reads that page's entitlements content (`Promise.all`) to get `pro.active` — no reads beyond the current page. |
| 3 | `admin-set-pro` is extended to accept either `{ email, active }` (existing) or `{ tenantId, active }` (new) — the latter skips the Clerk lookup entirely, since the table already has a real tenant id. |
| 4 | The `_global-pro-override.json` blob (not a real tenant) is filtered out of the listing. |
| 5 | No search/filter and no sorting in v1 — just sequential pages via "Load more". |

## Architecture

```
Browser (AdminPage.tsx)
  "All tenants" section
    - table: tenant id | Pro badge | Make Pro / Remove Pro button
    - "Load more" button (re-fetches with last nextCursor)

Vercel Functions (/api/*)
  GET /api/admin/tenants?cursor=<opaque>     (new) → paginated tenant list
  POST /api/admin/set-pro                    (existing, extended) → now accepts tenantId OR email

Vercel Blob (private, unchanged storage shape)
  entitlements/<tenantId>.json   — listed via list({ prefix: 'entitlements/' }), read per-page only
```

## Backend

**New: `api-src/admin-tenants.ts`** → bundled to `/api/admin/tenants`

```ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { list } from '@vercel/blob'
import { AuthError, requireAdmin } from './auth'
import { readEntitlements, GLOBAL_PRO_OVERRIDE_PATH } from './entitlements'

const ENTITLEMENTS_PREFIX = 'entitlements/'
const PAGE_SIZE = 25

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    await requireAdmin(req)

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined

    const result = await list({ prefix: ENTITLEMENTS_PREFIX, cursor, limit: PAGE_SIZE })

    const tenantIds = result.blobs
      .map((blob) => blob.pathname)
      .filter((pathname) => pathname !== GLOBAL_PRO_OVERRIDE_PATH)
      .map((pathname) => pathname.slice(ENTITLEMENTS_PREFIX.length, -'.json'.length))

    const tenants = await Promise.all(
      tenantIds.map(async (id) => {
        const entitlements = await readEntitlements(id)
        return { id, active: entitlements.pro.active }
      })
    )

    res.status(200).json({
      tenants,
      nextCursor: result.hasMore ? result.cursor : null
    })
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.status).json({ error: error.message })
      return
    }
    const message = error instanceof Error ? error.message : 'Admin tenants request failed'
    console.error('[admin-tenants]', message, error)
    res.status(500).json({ error: message })
  }
}
```

**`api-src/entitlements.ts` change:** export `GLOBAL_PRO_OVERRIDE_PATH` (already defined, just needs to be importable — it already is exported, no change needed; confirmed during planning).

**`api-src/admin-set-pro.ts` change:** accept `tenantId` as an alternative to `email`.

```ts
type SetProBody = { email?: unknown; tenantId?: unknown; active?: unknown }

// after parsing `active` as before:
const rawTenantId = typeof body.tenantId === 'string' ? body.tenantId.trim() : ''
const email = typeof body.email === 'string' ? body.email.trim() : ''

if (active === undefined || (!email && !rawTenantId)) {
  res.status(400).json({ error: 'active (boolean) and either email or tenantId are required' })
  return
}

let tenantId: string
let resolvedEmail: string | undefined

if (rawTenantId) {
  if (!validateTenantId(rawTenantId)) {
    res.status(400).json({ error: 'Invalid tenantId' })
    return
  }
  tenantId = rawTenantId
} else {
  const clerk = getClerk()
  const { data: users } = await clerk.users.getUserList({ emailAddress: [email] })
  const found = users[0]
  if (!found) {
    res.status(404).json({ error: 'No account found for that email' })
    return
  }
  const primary = found.emailAddresses.find((address) => address.id === found.primaryEmailAddressId)
  resolvedEmail = primary?.emailAddress ?? email
  tenantId = resolveTenant({ userId: found.id, email: resolvedEmail }).id
}

const entitlements = await readEntitlements(tenantId)
await writeEntitlements(tenantId, { ...entitlements, pro: { ...entitlements.pro, active } })

res.status(200).json({ tenantId, email: resolvedEmail, active })
```

`validateTenantId` and `resolveTenant` are already imported in this file (`resolveTenant` already imported; `validateTenantId` needs adding from `./signatureBlobShared`).

**`scripts/bundle-api.mjs` change:** add one entry —
```js
['api-src/admin-tenants.ts', 'api/admin/tenants.js']
```

## Frontend

**`src/components/AdminPage.tsx` addition:** new third section, "All tenants":

- On mount, `GET /api/admin/tenants` with no cursor (same pattern as the existing "Pro for everyone" section, which already loads on mount), render a table: tenant id, Pro/Free badge, a "Make Pro"/"Remove Pro" button per row (button calls `POST /api/admin/set-pro` with `{ tenantId, active }`, sends a fresh request, then updates just that row's state).
- A "Load more" button at the bottom, visible only when `nextCursor` is non-null; clicking re-fetches `GET /api/admin/tenants?cursor=<nextCursor>` and appends the results.
- Empty state: if the first page returns zero tenants, show "No tenants yet."

## Edge cases

| Case | Behavior |
|---|---|
| No tenants exist yet | Table shows "No tenants yet." |
| Cursor exhausted (`hasMore: false`) | "Load more" button not rendered |
| Toggling a row | Re-uses `set-pro`; only that row's local state updates from the response, not a full re-fetch |
| `email` and `tenantId` both provided to `set-pro` | `tenantId` wins (checked first in the updated handler) |
| Tenant id from the list happens to be malformed (shouldn't happen, but defensively) | `validateTenantId` rejects it with 400 before any write |

## Rollout

1. Add `admin-tenants.ts`, register in `bundle-api.mjs`. Verify with `curl`: 401 signed-out, 403 non-admin, 200 with a `tenants` array and correct `nextCursor` behavior across pages (test with `limit` temporarily lowered, or by creating several tenants first).
2. Extend `admin-set-pro.ts` to accept `tenantId`. Verify: existing email-based calls still work unchanged; a direct `tenantId` call writes the correct blob without any Clerk lookup.
3. Add the "All tenants" table + "Load more" to `AdminPage.tsx`. Verify end-to-end in the browser: table renders, toggling a row flips its badge and is reflected in `GET /api/entitlements` for that tenant, "Load more" fetches additional pages.

## Verification

- `curl` checks per task above.
- `npm run build` succeeds; `npm test` passes.
- No new Vitest coverage planned for `admin-tenants.ts` or the `admin-set-pro.ts` extension — consistent with the existing project convention that handlers touching Clerk/Blob directly are verified manually rather than unit tested (see prior admin-pro-toggle work).

## Out of scope for v1

- Search/filter by tenant id substring.
- Sorting (by Pro status, by id, etc).
- Bulk actions (toggle multiple tenants at once).
- Showing more than `id` + `active` per tenant (no subscriptionId, renewsAt, or unlockedSignatureIds in the table).

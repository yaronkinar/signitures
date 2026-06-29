import { useEffect, useState } from 'react'
import { Field, TextInput } from './Field'
import { authedFetch } from '../lib/cloudSignatures'

type SetProResult = { tenantId: string; email?: string; active: boolean }
type ApiError = { error: string }
type TenantRow = { id: string; active: boolean }
type TenantsResponse = { tenants: TenantRow[]; nextCursor: string | null }

const describeError = (response: Response, fallback: string): string =>
  response.status === 403 ? "You don't have admin access" : fallback

export const AdminPage = () => {
  const [email, setEmail] = useState('')
  const [customerStatus, setCustomerStatus] = useState('')
  const [customerWorking, setCustomerWorking] = useState(false)

  const [globalActive, setGlobalActive] = useState(false)
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [globalWorking, setGlobalWorking] = useState(false)
  const [globalStatus, setGlobalStatus] = useState('')

  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [tenantsLoaded, setTenantsLoaded] = useState(false)
  const [tenantsCursor, setTenantsCursor] = useState<string | null>(null)
  const [tenantsStatus, setTenantsStatus] = useState('')
  const [tenantsLoadingMore, setTenantsLoadingMore] = useState(false)
  const [tenantWorkingId, setTenantWorkingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    authedFetch('/api/admin/global-pro')
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) {
          setGlobalStatus(describeError(response, `Failed to load global override (${response.status})`))
          return
        }
        const payload = (await response.json()) as { active: boolean }
        setGlobalActive(Boolean(payload.active))
      })
      .catch(() => {
        if (!cancelled) setGlobalStatus('Failed to load global override')
      })
      .finally(() => {
        if (!cancelled) setGlobalLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadTenants = async (cursor: string | null, isCancelled?: () => boolean) => {
    if (cursor && tenantsLoadingMore) return
    if (cursor) {
      setTenantsLoadingMore(true)
    }
    try {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
      const response = await authedFetch(`/api/admin/tenants${query}`)
      if (isCancelled?.()) return
      if (!response.ok) {
        const payload = (await response.json()) as ApiError
        if (isCancelled?.()) return
        setTenantsStatus(describeError(response, payload.error ?? `Failed to load tenants (${response.status})`))
        return
      }
      const payload = (await response.json()) as TenantsResponse
      if (isCancelled?.()) return
      setTenants((existing) => (cursor ? [...existing, ...payload.tenants] : payload.tenants))
      setTenantsCursor(payload.nextCursor)
    } catch {
      if (!isCancelled?.()) setTenantsStatus('Failed to load tenants')
    } finally {
      if (!isCancelled?.()) {
        setTenantsLoaded(true)
        setTenantsLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    let cancelled = false
    loadTenants(null, () => cancelled)
    return () => {
      cancelled = true
    }
  }, [])

  const setCustomerPro = async (active: boolean) => {
    const trimmed = email.trim()
    if (!trimmed) {
      setCustomerStatus('Enter an email first')
      return
    }
    setCustomerWorking(true)
    setCustomerStatus('Working…')
    try {
      const response = await authedFetch('/api/admin/set-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, active })
      })
      const payload = (await response.json()) as SetProResult | ApiError
      if (!response.ok) {
        const fallback = 'error' in payload ? payload.error : `Request failed (${response.status})`
        setCustomerStatus(describeError(response, fallback))
        return
      }
      const result = payload as SetProResult
      setCustomerStatus(
        `${result.email} → tenant ${result.tenantId} is now ${result.active ? 'Pro' : 'Free'}`
      )
    } catch {
      setCustomerStatus('Request failed')
    } finally {
      setCustomerWorking(false)
    }
  }

  const setGlobalOverride = async (active: boolean) => {
    setGlobalWorking(true)
    setGlobalStatus('Working…')
    try {
      const response = await authedFetch('/api/admin/global-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active })
      })
      if (!response.ok) {
        const payload = (await response.json()) as ApiError
        setGlobalStatus(describeError(response, payload.error ?? `Request failed (${response.status})`))
        return
      }
      setGlobalActive(active)
      setGlobalStatus(active ? 'Pro is now on for everyone' : 'Global override is off')
    } catch {
      setGlobalStatus('Request failed')
    } finally {
      setGlobalWorking(false)
    }
  }

  const setTenantRowPro = async (tenantId: string, active: boolean) => {
    if (tenantWorkingId !== null) return
    setTenantWorkingId(tenantId)
    setTenantsStatus('')
    try {
      const response = await authedFetch('/api/admin/set-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, active })
      })
      const payload = (await response.json()) as SetProResult | ApiError
      if (!response.ok) {
        const fallback = 'error' in payload ? payload.error : `Request failed (${response.status})`
        setTenantsStatus(describeError(response, fallback))
        return
      }
      setTenants((existing) =>
        existing.map((row) => (row.id === tenantId ? { ...row, active } : row))
      )
    } catch {
      setTenantsStatus('Request failed')
    } finally {
      setTenantWorkingId(null)
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: '48px auto', padding: '0 16px' }}>
      <h1>Admin</h1>

      <section style={{ marginTop: 32 }}>
        <h2>Customer Pro status</h2>
        <Field label="Customer email">
          <TextInput
            value={email}
            placeholder="customer@example.com"
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button type="button" className="primary" disabled={customerWorking} onClick={() => setCustomerPro(true)}>
            Make Pro
          </button>
          <button type="button" className="secondary" disabled={customerWorking} onClick={() => setCustomerPro(false)}>
            Remove Pro
          </button>
        </div>
        {customerStatus && <p className="hint">{customerStatus}</p>}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Pro for everyone</h2>
        <p className="hint">Overrides every tenant&apos;s individual Pro status while on.</p>
        <button
          type="button"
          className={globalActive ? 'primary' : 'secondary'}
          disabled={!globalLoaded || globalWorking}
          onClick={() => setGlobalOverride(!globalActive)}
        >
          {globalActive ? 'Pro for everyone: ON' : 'Pro for everyone: OFF'}
        </button>
        {globalStatus && <p className="hint">{globalStatus}</p>}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>All tenants</h2>
        {tenantsStatus && <p className="hint">{tenantsStatus}</p>}
        {tenantsLoaded && tenants.length === 0 ? (
          <p className="hint">No tenants yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Tenant</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{tenant.id}</td>
                  <td style={{ padding: '4px 8px' }}>{tenant.active ? 'Pro' : 'Free'}</td>
                  <td style={{ padding: '4px 8px' }}>
                    <button
                      type="button"
                      className={tenant.active ? 'secondary' : 'primary'}
                      disabled={tenantWorkingId === tenant.id}
                      onClick={() => setTenantRowPro(tenant.id, !tenant.active)}
                    >
                      {tenant.active ? 'Remove Pro' : 'Make Pro'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tenantsCursor && (
          <button
            type="button"
            className="secondary"
            disabled={tenantsLoadingMore}
            onClick={() => loadTenants(tenantsCursor)}
            style={{ marginTop: 8 }}
          >
            Load more
          </button>
        )}
      </section>
    </main>
  )
}

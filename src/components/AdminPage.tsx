import { useEffect, useState } from 'react'
import { Field, TextInput } from './Field'
import { authedFetch } from '../lib/cloudSignatures'

type SetProResult = { tenantId: string; email: string; active: boolean }
type ApiError = { error: string }

export const AdminPage = () => {
  const [email, setEmail] = useState('')
  const [customerStatus, setCustomerStatus] = useState('')
  const [customerWorking, setCustomerWorking] = useState(false)

  const [globalActive, setGlobalActive] = useState(false)
  const [globalLoaded, setGlobalLoaded] = useState(false)
  const [globalWorking, setGlobalWorking] = useState(false)
  const [globalStatus, setGlobalStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    authedFetch('/api/admin/global-pro')
      .then(async (response) => {
        if (cancelled) return
        if (!response.ok) {
          setGlobalStatus(`Failed to load global override (${response.status})`)
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
        setCustomerStatus('error' in payload ? payload.error : `Request failed (${response.status})`)
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
        setGlobalStatus(payload.error ?? `Request failed (${response.status})`)
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

  return (
    <main style={{ maxWidth: 560, margin: '48px auto', padding: '0 16px' }}>
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
          <button
            type="button"
            className="primary"
            disabled={customerWorking}
            onClick={() => setCustomerPro(true)}
          >
            Make Pro
          </button>
          <button
            type="button"
            className="secondary"
            disabled={customerWorking}
            onClick={() => setCustomerPro(false)}
          >
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
    </main>
  )
}

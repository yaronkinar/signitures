// src/components/PaywallModal.tsx
import { useState } from 'react'
import { usePaywallModal } from '../contexts/PaywallModalContext'
import { useEntitlements } from '../hooks/useEntitlements'
import { useUiLanguage } from '../contexts/UiLanguageContext'
import { createCheckout } from '../lib/entitlements'
import { openLemonCheckout } from '../lib/lemonSqueezy'
import { t } from '../i18n'

type Phase = 'idle' | 'checking-out' | 'finalizing' | 'timeout' | 'error'

export const PaywallModal = () => {
  const { isOpen, request, resolveUnlock, closeModal } = usePaywallModal()
  const { refresh, pollUntilUnlocked } = useEntitlements()
  const { uiLanguage } = useUiLanguage()
  const [phase, setPhase] = useState<Phase>('idle')

  if (!isOpen || !request) return null

  const dir = uiLanguage === 'he' ? 'rtl' : 'ltr'

  const matchesUnlock = (ids: string[], pro: boolean) =>
    request.kind === 'pro' ? pro : pro || ids.includes(request.signatureId)

  const startCheckout = async () => {
    setPhase('checking-out')
    const checkoutUrl = await createCheckout(request)
    if (!checkoutUrl) {
      setPhase('error')
      return
    }
    await openLemonCheckout(checkoutUrl, async (outcome) => {
      if (outcome === 'closed') {
        setPhase('idle')
        return
      }
      if (outcome !== 'success') return
      setPhase('finalizing')
      try {
        const unlocked = await pollUntilUnlocked(matchesUnlock)
        setPhase(unlocked ? 'idle' : 'timeout')
        if (unlocked) resolveUnlock()
      } catch {
        setPhase('error')
      }
    })
  }

  const retryAfterTimeout = async () => {
    const fresh = await refresh()
    if (matchesUnlock(fresh.unlockedSignatureIds, fresh.tier === 'pro')) {
      resolveUnlock()
    }
    // Still not unlocked: stay in 'timeout' phase, the user can click Refresh again.
  }

  const title = request.kind === 'pro' ? t(uiLanguage, 'paywallProTitle') : t(uiLanguage, 'paywallDownloadTitle')
  const body = request.kind === 'pro' ? t(uiLanguage, 'paywallProBody') : t(uiLanguage, 'paywallDownloadBody')
  const cta = request.kind === 'pro' ? t(uiLanguage, 'paywallProCta') : t(uiLanguage, 'paywallDownloadCta')

  return (
    <div className="install-wizard-backdrop paywall-modal-backdrop" role="presentation" onClick={closeModal}>
      <div
        className="install-wizard paywall-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-modal-title"
        dir={dir}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-wizard-header">
          <h2 id="paywall-modal-title">{title}</h2>
          <button
            type="button"
            className="install-wizard-close"
            onClick={closeModal}
            aria-label={t(uiLanguage, 'paywallClose')}
          >
            ×
          </button>
        </div>
        <p>{body}</p>
        {phase === 'finalizing' && <p className="ai-status">{t(uiLanguage, 'paywallFinalizing')}</p>}
        {phase === 'timeout' && <p className="ai-status">{t(uiLanguage, 'paywallTimeout')}</p>}
        {phase === 'error' && <p className="ai-status is-error">{t(uiLanguage, 'paywallError')}</p>}
        <div className="install-wizard-actions">
          {phase === 'timeout' ? (
            <button
              type="button"
              className="primary"
              onClick={() => {
                retryAfterTimeout().catch(() => setPhase('error'))
              }}
            >
              {t(uiLanguage, 'paywallRetry')}
            </button>
          ) : (
            <button
              type="button"
              className="primary"
              disabled={phase === 'checking-out' || phase === 'finalizing'}
              onClick={() => {
                startCheckout().catch(() => setPhase('error'))
              }}
            >
              {cta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

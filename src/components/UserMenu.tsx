import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { t, type AppLanguage } from '../i18n'
import { useRequireSignIn } from '../hooks/useRequireSignIn'
import { useEntitlements } from '../hooks/useEntitlements'
import { usePaywallModal } from '../contexts/PaywallModalContext'

type UserMenuProps = {
  lang: AppLanguage
}

export const UserMenu = ({ lang }: UserMenuProps) => {
  const { ensureSignedIn } = useRequireSignIn()
  const { isPro } = useEntitlements()
  const { requestUnlock } = usePaywallModal()

  return (
    <div className="user-menu">
      <SignedOut>
        <button
          type="button"
          className="secondary"
          onClick={() => {
            ensureSignedIn().catch(() => undefined)
          }}
        >
          {t(lang, 'userMenuSignIn')}
        </button>
      </SignedOut>
      <SignedIn>
        {isPro ? (
          <span className="user-menu-pro-badge">{t(lang, 'userMenuProBadge')}</span>
        ) : (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              requestUnlock({ kind: 'pro' }).catch(() => undefined)
            }}
          >
            {t(lang, 'userMenuUpgrade')}
          </button>
        )}
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </div>
  )
}

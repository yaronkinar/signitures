import { SignIn } from '@clerk/clerk-react'
import { useUiLanguage } from '../contexts/UiLanguageContext'
import { useSignInModal } from '../contexts/SignInModalContext'
import { t } from '../i18n'

export const SignInModal = () => {
  const { isOpen, closeModal } = useSignInModal()
  const { uiLanguage } = useUiLanguage()
  if (!isOpen) return null

  const dir = uiLanguage === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="install-wizard-backdrop sign-in-modal-backdrop" role="presentation" onClick={closeModal}>
      <div
        className="install-wizard sign-in-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-in-modal-title"
        dir={dir}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-wizard-header">
          <h2 id="sign-in-modal-title">{t(uiLanguage, 'signInModalTitle')}</h2>
          <button
            type="button"
            className="install-wizard-close"
            onClick={closeModal}
            aria-label={t(uiLanguage, 'signInModalClose')}
          >
            ×
          </button>
        </div>
        <SignIn routing="virtual" />
      </div>
    </div>
  )
}

import { useRegisterSW } from 'virtual:pwa-register/react'
import type { AppLanguage } from '../i18n'
import { t } from '../i18n'

const UPDATE_CHECK_MS = 60 * 60 * 1000

type UpdatePromptProps = {
  lang: AppLanguage
}

export const UpdatePrompt = ({ lang }: UpdatePromptProps) => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      if (!registration) return
      window.setInterval(() => {
        registration.update().catch(() => undefined)
      }, UPDATE_CHECK_MS)
    }
  })

  if (!needRefresh) return null

  return (
    <div className="update-prompt" role="status" aria-live="polite">
      <p className="update-prompt-message">{t(lang, 'appUpdateAvailable')}</p>
      <div className="update-prompt-actions">
        <button
          type="button"
          className="primary update-prompt-reload"
          onClick={() => updateServiceWorker(true)}
        >
          {t(lang, 'appUpdateReload')}
        </button>
        <button
          type="button"
          className="secondary update-prompt-dismiss"
          onClick={() => setNeedRefresh(false)}
        >
          {t(lang, 'appUpdateDismiss')}
        </button>
      </div>
    </div>
  )
}

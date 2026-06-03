import { t, type AppLanguage } from '../i18n'

export const CREATOR_NAME = 'Yaron Kinar'
export const CREATOR_PHONE = '+972523357076'
export const CREATOR_EMAIL = 'yaronkinar@gmail.com'

type CreatorModalProps = {
  open: boolean
  lang: AppLanguage
  onClose: () => void
}

export const CreatorModal = ({ open, lang, onClose }: CreatorModalProps) => {
  if (!open) return null

  const dir = lang === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="install-wizard-backdrop creator-backdrop" role="presentation" onClick={onClose}>
      <div
        className="install-wizard creator-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="creator-modal-title"
        dir={dir}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-wizard-header">
          <h2 id="creator-modal-title">{t(lang, 'creatorModalTitle')}</h2>
          <button
            type="button"
            className="install-wizard-close"
            onClick={onClose}
            aria-label={t(lang, 'creatorClose')}
          >
            ×
          </button>
        </div>

        <div className="creator-details">
          <p className="creator-name">{CREATOR_NAME}</p>
          <dl className="creator-contact-list">
            <div className="creator-contact-row">
              <dt>{t(lang, 'creatorPhoneLabel')}</dt>
              <dd>
                <a href={`tel:${CREATOR_PHONE.replace(/\s/g, '')}`}>{CREATOR_PHONE}</a>
              </dd>
            </div>
            <div className="creator-contact-row">
              <dt>{t(lang, 'creatorEmailLabel')}</dt>
              <dd>
                <a href={`mailto:${CREATOR_EMAIL}`}>{CREATOR_EMAIL}</a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="install-wizard-actions">
          <button type="button" className="primary" onClick={onClose}>
            {t(lang, 'creatorClose')}
          </button>
        </div>
      </div>
    </div>
  )
}

import { CHANGELOG_HE, formatChangelogDateHe } from '../changelogHe'
import { getAppVersion } from '../lib/buildInfo'
import { t, type AppLanguage } from '../i18n'

type ChangelogModalProps = {
  open: boolean
  lang: AppLanguage
  onClose: () => void
}

export const ChangelogModal = ({ open, lang, onClose }: ChangelogModalProps) => {
  if (!open) return null

  return (
    <div className="install-wizard-backdrop changelog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="install-wizard changelog-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
        dir="rtl"
        lang="he"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="install-wizard-header">
          <h2 id="changelog-title">{t(lang, 'changelogTitle')}</h2>
          <button
            type="button"
            className="install-wizard-close"
            onClick={onClose}
            aria-label={t(lang, 'changelogClose')}
          >
            ×
          </button>
        </div>

        <p className="hint changelog-intro">
          {t(lang, 'changelogIntro').replace('{version}', getAppVersion())}
        </p>

        <div className="changelog-list">
          {CHANGELOG_HE.map((day) => (
            <section key={day.date} className="changelog-day">
              <header className="changelog-day-header">
                <time dateTime={day.date}>{formatChangelogDateHe(day.date)}</time>
                {day.version ? <span className="changelog-version">v{day.version}</span> : null}
              </header>
              <ul className="changelog-items">
                {day.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="install-wizard-actions">
          <button type="button" className="primary" onClick={onClose}>
            {t(lang, 'changelogClose')}
          </button>
        </div>
      </div>
    </div>
  )
}

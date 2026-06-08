import { t, type AppLanguage } from '../i18n'

type LanguageToggleProps = {
  lang: AppLanguage
  onChange: (lang: AppLanguage) => void
}

export const LanguageToggle = ({ lang, onChange }: LanguageToggleProps) => (
  <div
    className="language-toggle"
    role="group"
    aria-label={t(lang, 'languageToggleLabel')}
  >
    <button
      type="button"
      className={`language-toggle-btn${lang === 'en' ? ' is-active' : ''}`}
      aria-pressed={lang === 'en'}
      onClick={() => onChange('en')}
    >
      EN
    </button>
    <button
      type="button"
      className={`language-toggle-btn${lang === 'he' ? ' is-active' : ''}`}
      aria-pressed={lang === 'he'}
      onClick={() => onChange('he')}
    >
      עב
    </button>
  </div>
)

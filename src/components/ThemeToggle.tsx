import { t, type AppLanguage } from '../i18n'
import type { AppUiTheme } from '../lib/uiTheme'

type ThemeToggleProps = {
  lang: AppLanguage
  theme: AppUiTheme
  onChange: (theme: AppUiTheme) => void
}

export const ThemeToggle = ({ lang, theme, onChange }: ThemeToggleProps) => (
  <div className="theme-toggle" role="group" aria-label={t(lang, 'uiThemeToggleLabel')}>
    <button
      type="button"
      className={`theme-toggle-btn${theme === 'classic' ? ' is-active' : ''}`}
      aria-pressed={theme === 'classic'}
      onClick={() => onChange('classic')}
    >
      {t(lang, 'uiThemeClassic')}
    </button>
    <button
      type="button"
      className={`theme-toggle-btn${theme === 'precision' ? ' is-active' : ''}`}
      aria-pressed={theme === 'precision'}
      onClick={() => onChange('precision')}
    >
      {t(lang, 'uiThemePrecision')}
    </button>
  </div>
)

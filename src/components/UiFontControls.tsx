import { t, type AppLanguage } from '../i18n'
import { UI_FONT_OPTIONS } from '../lib/uiFont'

type UiFontControlsProps = {
  lang: AppLanguage
  fontId: string
  fontScale: number
  onFontChange: (id: string) => void
  onIncrease: () => void
  onDecrease: () => void
  canIncrease: boolean
  canDecrease: boolean
}

export const UiFontControls = ({
  lang,
  fontId,
  fontScale,
  onFontChange,
  onIncrease,
  onDecrease,
  canIncrease,
  canDecrease
}: UiFontControlsProps) => (
  <div className="ui-font-controls" role="group" aria-label={t(lang, 'uiFontGroupLabel')}>
    <label className="ui-font-select-label">
      <span className="ui-font-select-caption">{t(lang, 'uiFontLabel')}</span>
      <select
        className="ui-font-select"
        value={fontId}
        onChange={(event) => onFontChange(event.target.value)}
        aria-label={t(lang, 'uiFontLabel')}
      >
        {UI_FONT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.id === 'default' ? t(lang, 'uiFontDefault') : option.label}
          </option>
        ))}
      </select>
    </label>
    <div className="ui-font-size" role="group" aria-label={t(lang, 'uiFontSizeLabel')}>
      <button
        type="button"
        className="ui-font-size-btn"
        onClick={onDecrease}
        disabled={!canDecrease}
        aria-label={t(lang, 'uiFontSizeDecrease')}
      >
        A−
      </button>
      <span className="ui-font-size-value" aria-live="polite">
        {fontScale}%
      </span>
      <button
        type="button"
        className="ui-font-size-btn"
        onClick={onIncrease}
        disabled={!canIncrease}
        aria-label={t(lang, 'uiFontSizeIncrease')}
      >
        A+
      </button>
    </div>
  </div>
)

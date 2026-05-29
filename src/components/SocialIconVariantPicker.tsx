import { useEffect, useState } from 'react'
import type { AppLanguage } from '../i18n'
import { t } from '../i18n'
import {
  SOCIAL_ICON_VARIANT_LABEL_KEYS,
  SOCIAL_ICON_VARIANTS_BY_PLATFORM,
  type SocialIconVariantId,
  type SocialPlatform
} from '../lib/socialIconCatalog'
import { areSocialIconVariantsReady, getSocialIconVariantPreviewUrl } from '../lib/socialIcons'

type SocialIconVariantPickerProps = {
  platform: SocialPlatform
  lang: AppLanguage
  selectedVariant: string
  customIconUrl: string
  disabled?: boolean
  onSelectVariant: (variant: SocialIconVariantId) => void
}

export const SocialIconVariantPicker = ({
  platform,
  lang,
  selectedVariant,
  customIconUrl,
  disabled = false,
  onSelectVariant
}: SocialIconVariantPickerProps) => {
  const [ready, setReady] = useState(areSocialIconVariantsReady())
  const variants = SOCIAL_ICON_VARIANTS_BY_PLATFORM[platform]
  const hasCustomIcon = customIconUrl.trim().length > 0

  useEffect(() => {
    if (ready) return
    const intervalId = window.setInterval(() => {
      if (areSocialIconVariantsReady()) {
        setReady(true)
        window.clearInterval(intervalId)
      }
    }, 120)
    return () => window.clearInterval(intervalId)
  }, [ready])

  return (
    <div className="social-icon-variant-picker">
      <p className="hint social-icon-variant-hint">
        {hasCustomIcon ? t(lang, 'socialIconVariantCustomActive') : t(lang, 'socialIconVariantHint')}
      </p>
      <div
        className="social-icon-variant-grid"
        role="radiogroup"
        aria-label={t(lang, 'socialIconVariantLabel')}
      >
        {variants.map((variant) => {
          const previewUrl = getSocialIconVariantPreviewUrl(platform, variant)
          const isSelected = !hasCustomIcon && selectedVariant === variant
          const labelKey = SOCIAL_ICON_VARIANT_LABEL_KEYS[variant]

          return (
            <button
              key={variant}
              type="button"
              className={`social-icon-variant-option${isSelected ? ' is-selected' : ''}`}
              role="radio"
              aria-checked={isSelected}
              aria-label={t(lang, labelKey)}
              title={t(lang, labelKey)}
              disabled={disabled || !ready || !previewUrl}
              onClick={() => onSelectVariant(variant)}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="" width={28} height={28} />
              ) : (
                <span className="social-icon-variant-placeholder" aria-hidden="true" />
              )}
              <span className="social-icon-variant-caption">{t(lang, labelKey)}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

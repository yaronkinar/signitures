import { useEffect, useState } from 'react'
import type { AppLanguage } from '../i18n'
import { t } from '../i18n'
import {
  SOCIAL_ICON_VARIANT_LABEL_KEYS,
  SOCIAL_ICON_VARIANTS_BY_PLATFORM,
  type SocialIconVariantId,
  type SocialPlatform
} from '../lib/socialIconCatalog'
import {
  getSocialIconVariantPreviewUrl,
  initializeSocialIconDataUrls,
  isSocialIconVariantReady
} from '../lib/socialIcons'

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
  const variants = SOCIAL_ICON_VARIANTS_BY_PLATFORM[platform]
  const hasCustomIcon = customIconUrl.trim().length > 0
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(() => {
    if (variants.every((variant) => isSocialIconVariantReady(platform, variant))) {
      return 'ready'
    }
    return 'loading'
  })

  useEffect(() => {
    let cancelled = false

    const allVariantsReady = (): boolean =>
      variants.every((variant) => isSocialIconVariantReady(platform, variant))

    const markReadyIfLoaded = (): boolean => {
      if (cancelled || !allVariantsReady()) {
        return false
      }
      setLoadState('ready')
      return true
    }

    if (markReadyIfLoaded()) {
      return
    }

    setLoadState('loading')
    initializeSocialIconDataUrls()
      .then(() => {
        if (!cancelled) {
          setLoadState(allVariantsReady() ? 'ready' : 'error')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadState('error')
        }
      })

    const intervalId = window.setInterval(() => {
      if (markReadyIfLoaded()) {
        window.clearInterval(intervalId)
      }
    }, 120)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [platform, variants])

  return (
    <div className="social-icon-variant-picker">
      <p className="hint social-icon-variant-hint">
        {loadState === 'error'
          ? t(lang, 'socialIconVariantLoadFailed')
          : hasCustomIcon
            ? t(lang, 'socialIconVariantCustomActive')
            : t(lang, 'socialIconVariantHint')}
      </p>
      <div
        className="social-icon-variant-grid"
        role="radiogroup"
        aria-label={t(lang, 'socialIconVariantLabel')}
      >
        {variants.map((variant) => {
          const previewUrl = getSocialIconVariantPreviewUrl(platform, variant)
          const variantReady = isSocialIconVariantReady(platform, variant)
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
              disabled={disabled || !variantReady}
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
      {loadState === 'loading' ? (
        <p className="hint social-icon-variant-loading">{t(lang, 'socialIconVariantLoading')}</p>
      ) : null}
    </div>
  )
}

import { DEFAULT_INSTAGRAM_ICON_DATA_URL } from '../defaultInstagramIconDataUrl'
import { siFacebook, siInstagram, siX, siYoutube } from 'simple-icons'
import {
  DEFAULT_SOCIAL_ICON_VARIANT,
  normalizeSocialIconVariant,
  SOCIAL_ICON_VARIANTS_BY_PLATFORM,
  type SocialIconVariantId,
  type SocialPlatform
} from './socialIconCatalog'
import { normalizeUrl } from './signatureUtils'

const MONO_FILL = '#4c4c4e'
const BRAND_COLORS = {
  Facebook: '#1877F2',
  Instagram: '#E4405F',
  X: '#111111',
  YouTube: '#FF0000'
} as const

const socialIconVariantDataUrls: Record<SocialPlatform, Partial<Record<SocialIconVariantId, string>>> =
  {
    Facebook: {},
    Instagram: { gradient: DEFAULT_INSTAGRAM_ICON_DATA_URL },
    LinkedIn: {},
    X: {},
    YouTube: {}
  }

let socialIconsInitializationPromise: Promise<void> | null = null

const buildSocialIconSvg = (icon: { path: string }, fillColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="${icon.path}" fill="${fillColor}" />
  </svg>`

const linkedInBadgeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="0" y="0" width="24" height="24" rx="4" fill="#0A66C2" />
  <g transform="translate(0.3 0.2) scale(0.92)">
    <path fill="#ffffff" d="M7.05 9.35H4.79V19h2.26V9.35zM5.92 8.22a1.31 1.31 0 1 0 0-2.62 1.31 1.31 0 0 0 0 2.62zM19.2 13.2V19h-2.24v-5.32c0-1.34-.48-2.25-1.67-2.25-.91 0-1.45.61-1.69 1.2-.09.21-.11.5-.11.79V19h-2.25s.03-9.1 0-10.05h2.25v1.42c.3-.47.84-1.15 2.05-1.15 1.5 0 2.62.98 2.62 3.98z"/>
  </g>
</svg>`

const linkedInGlyphPath =
  'M7.05 9.35H4.79V19h2.26V9.35zM5.92 8.22a1.31 1.31 0 1 0 0-2.62 1.31 1.31 0 0 0 0 2.62zM19.2 13.2V19h-2.24v-5.32c0-1.34-.48-2.25-1.67-2.25-.91 0-1.45.61-1.69 1.2-.09.21-.11.5-.11.79V19h-2.25s.03-9.1 0-10.05h2.25v1.42c.3-.47.84-1.15 2.05-1.15 1.5 0 2.62.98 2.62 3.98z'

const linkedInMonoIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="${MONO_FILL}" d="${linkedInGlyphPath}"/>
</svg>`

const linkedInWhiteIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <path fill="#ffffff" d="${linkedInGlyphPath}"/>
</svg>`

const svgToPngDataUrl = (svg: string, size = 44): Promise<string> =>
  new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('Canvas not available'))
        return
      }
      context.drawImage(image, 0, 0, size, size)
      URL.revokeObjectURL(svgUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('Cannot render social icon'))
    }
    image.src = svgUrl
  })

const setVariantUrl = (
  platform: SocialPlatform,
  variant: SocialIconVariantId,
  dataUrl: string
): void => {
  socialIconVariantDataUrls[platform][variant] = dataUrl
}

const renderSimpleIconVariants = async (
  platform: SocialPlatform,
  icon: { path: string },
  brandColor: string
): Promise<void> => {
  const variants = SOCIAL_ICON_VARIANTS_BY_PLATFORM[platform]
  const tasks: Promise<void>[] = []

  if (variants.includes('brand')) {
    tasks.push(
      svgToPngDataUrl(buildSocialIconSvg(icon, brandColor)).then((dataUrl) => {
        setVariantUrl(platform, 'brand', dataUrl)
      })
    )
  }
  if (variants.includes('mono')) {
    tasks.push(
      svgToPngDataUrl(buildSocialIconSvg(icon, MONO_FILL)).then((dataUrl) => {
        setVariantUrl(platform, 'mono', dataUrl)
      })
    )
  }
  if (variants.includes('white')) {
    tasks.push(
      svgToPngDataUrl(buildSocialIconSvg(icon, '#ffffff')).then((dataUrl) => {
        setVariantUrl(platform, 'white', dataUrl)
      })
    )
  }

  await Promise.all(tasks)
}

export const initializeSocialIconDataUrls = async (): Promise<void> => {
  if (socialIconsInitializationPromise) {
    return socialIconsInitializationPromise
  }

  socialIconsInitializationPromise = Promise.all([
    renderSimpleIconVariants('Facebook', siFacebook, BRAND_COLORS.Facebook),
    renderSimpleIconVariants('Instagram', siInstagram, BRAND_COLORS.Instagram),
    renderSimpleIconVariants('X', siX, BRAND_COLORS.X),
    renderSimpleIconVariants('YouTube', siYoutube, BRAND_COLORS.YouTube),
    svgToPngDataUrl(linkedInBadgeIconSvg).then((dataUrl) => {
      setVariantUrl('LinkedIn', 'badge', dataUrl)
    }),
    svgToPngDataUrl(linkedInMonoIconSvg).then((dataUrl) => {
      setVariantUrl('LinkedIn', 'mono', dataUrl)
    }),
    svgToPngDataUrl(linkedInWhiteIconSvg).then((dataUrl) => {
      setVariantUrl('LinkedIn', 'white', dataUrl)
    })
  ]).then(() => undefined)

  return socialIconsInitializationPromise
}

export const getSocialIconVariantPreviewUrl = (
  platform: SocialPlatform,
  variant: SocialIconVariantId
): string => socialIconVariantDataUrls[platform][variant] ?? ''

export const areSocialIconVariantsReady = (): boolean => {
  for (const platform of Object.keys(SOCIAL_ICON_VARIANTS_BY_PLATFORM) as SocialPlatform[]) {
    for (const variant of SOCIAL_ICON_VARIANTS_BY_PLATFORM[platform]) {
      if (!socialIconVariantDataUrls[platform][variant]) {
        return false
      }
    }
  }
  return true
}

export const resolveSocialIconUrl = (
  platform: SocialPlatform,
  customIconUrl: string,
  variantId: string | undefined
): string => {
  const custom = customIconUrl.trim()
  if (custom) {
    return normalizeUrl(custom)
  }

  const variant = normalizeSocialIconVariant(platform, variantId)
  const dataUrl = socialIconVariantDataUrls[platform][variant]
  if (dataUrl) {
    return dataUrl
  }

  const fallback = DEFAULT_SOCIAL_ICON_VARIANT[platform]
  return socialIconVariantDataUrls[platform][fallback] ?? ''
}

export type { SocialPlatform, SocialIconVariantId }

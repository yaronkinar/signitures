export type SocialPlatform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'YouTube'

export type SocialIconVariantId = 'brand' | 'mono' | 'white' | 'gradient' | 'badge'

export const SOCIAL_ICON_VARIANTS_BY_PLATFORM: Record<
  SocialPlatform,
  readonly SocialIconVariantId[]
> = {
  Facebook: ['brand', 'mono', 'white'],
  Instagram: ['brand', 'gradient', 'mono', 'white'],
  LinkedIn: ['badge', 'mono', 'white'],
  X: ['brand', 'mono', 'white'],
  YouTube: ['brand', 'mono', 'white']
}

export const DEFAULT_SOCIAL_ICON_VARIANT: Record<SocialPlatform, SocialIconVariantId> = {
  Facebook: 'brand',
  Instagram: 'brand',
  LinkedIn: 'badge',
  X: 'brand',
  YouTube: 'brand'
}

export const isSocialIconVariantForPlatform = (
  platform: SocialPlatform,
  variant: string
): variant is SocialIconVariantId =>
  (SOCIAL_ICON_VARIANTS_BY_PLATFORM[platform] as readonly string[]).includes(variant)

export const normalizeSocialIconVariant = (
  platform: SocialPlatform,
  variant: string | undefined
): SocialIconVariantId => {
  if (variant && isSocialIconVariantForPlatform(platform, variant)) {
    return variant
  }
  return DEFAULT_SOCIAL_ICON_VARIANT[platform]
}

export type SocialIconVariantLabelKey =
  | 'socialIconVariantBrand'
  | 'socialIconVariantMono'
  | 'socialIconVariantWhite'
  | 'socialIconVariantGradient'
  | 'socialIconVariantBadge'

export const SOCIAL_ICON_VARIANT_LABEL_KEYS: Record<
  SocialIconVariantId,
  SocialIconVariantLabelKey
> = {
  brand: 'socialIconVariantBrand',
  mono: 'socialIconVariantMono',
  white: 'socialIconVariantWhite',
  gradient: 'socialIconVariantGradient',
  badge: 'socialIconVariantBadge'
}

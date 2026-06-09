import type { AppLanguage } from '../i18n'

export type SignatureLayoutPresetId =
  | 'side-right'
  | 'side-left'
  | 'side-right-banner'
  | 'side-left-banner'
  | 'logo-top-banner-bottom'
  | 'banner-top-logo-bottom'
  | 'text-only'
  | 'text-only-banner'

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type LogoSide = 'left' | 'right' | 'top' | 'bottom' | 'none'
export type LinkImagePlacement = 'footer' | 'with-social' | 'top' | 'bottom'

export const DEFAULT_LINK_IMAGE_MAX_WIDTH = 160
export const DEFAULT_LINK_IMAGE_MAX_HEIGHT = 40

export type LinkImage = {
  id: string
  imageUrl: string
  href: string
  alt: string
  placement: LinkImagePlacement
  align: TextAlign
  maxWidth: number
  maxHeight: number
  offsetX: number
  offsetY: number
}

export type SignatureLayoutSettings = {
  fontFamily: string
  nameFontWeight: number
  titleFontWeight: number
  bodyFontWeight: number
  nameFontSize: number
  titleFontSize: number
  bodyFontSize: number
  lineSpacing: number
  signatureWidth: number
  signatureHeight: number
  textColumnWidth: number
  logoMaxWidth: number
  bannerMaxWidth: number
  textAlign: TextAlign
  nameTitleAlign: TextAlign
  emailAlign: TextAlign
  logoAlign: TextAlign
  logoSide: LogoSide
  verticalAlign: VerticalAlign
  textOffsetX: number
  textOffsetY: number
  logoOffsetX: number
  logoOffsetY: number
  dividerThickness: number
  socialIconGap: number
  accentColor: string
  textColor: string
  secondaryTextColor: string
  dividerColor: string
  linkColor: string
  backgroundColor: string
  nameColor: string
  jobTitleColor: string
  companyColor: string
  contactLabelColor: string
  phoneColor: string
  emailColor: string
  websiteColor: string
}

export type SignatureFormState = {
  signatureLanguage: AppLanguage
  /** When true, name and title/company render as PNG images so recipients see the same typography. */
  rasterizeNameTitle: boolean
  /** When true, phone/email/website use the same horizontal alignment as name and title. */
  contactMatchNameTitle: boolean
  /** When true, contact rows show their label (Mobile:/Email:/Website:); when false, only the value. */
  showContactLabels: boolean
  fullName: string
  /** ASCII name for classic Outlook signature files (list + .htm base name). */
  outlookSignatureName: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  facebookUrl: string
  facebookIconUrl: string
  facebookIconVariant: string
  instagramUrl: string
  instagramIconUrl: string
  instagramIconVariant: string
  linkedinUrl: string
  linkedinIconUrl: string
  linkedinIconVariant: string
  xUrl: string
  xIconUrl: string
  xIconVariant: string
  youtubeUrl: string
  youtubeIconUrl: string
  youtubeIconVariant: string
  /** Last selected layout preset from the Logo & banner panel. */
  layoutPreset: SignatureLayoutPresetId
  logoUrl: string
  bannerUrl: string
  bannerLink: string
  linkImages: LinkImage[]
} & SignatureLayoutSettings

import type { AppLanguage } from '../i18n'

export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'

export type LinkImage = {
  id: string
  imageUrl: string
  href: string
  alt: string
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
  textAlign: TextAlign
  nameTitleAlign: TextAlign
  emailAlign: TextAlign
  logoAlign: TextAlign
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
}

export type SignatureFormState = {
  signatureLanguage: AppLanguage
  fullName: string
  jobTitle: string
  company: string
  phone: string
  email: string
  website: string
  facebookUrl: string
  facebookIconUrl: string
  instagramUrl: string
  instagramIconUrl: string
  linkedinUrl: string
  linkedinIconUrl: string
  xUrl: string
  xIconUrl: string
  youtubeUrl: string
  youtubeIconUrl: string
  logoUrl: string
  bannerUrl: string
  bannerLink: string
  linkImages: LinkImage[]
} & SignatureLayoutSettings

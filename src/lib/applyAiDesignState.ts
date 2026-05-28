import type { AiSignatureDesign, AppLanguage, TextAlign, VerticalAlign } from '../aiSignatureDesign'
import type { SignatureFormState } from '../types/signatureForm'

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const applyContact = (
  state: SignatureFormState,
  design: AiSignatureDesign
): SignatureFormState => {
  const contact = design.contact
  if (!contact) return state

  let next = { ...state }
  if (contact.signatureLanguage) next.signatureLanguage = contact.signatureLanguage
  if (contact.fullName) next.fullName = contact.fullName
  if (contact.jobTitle) next.jobTitle = contact.jobTitle
  if (contact.company) next.company = contact.company
  if (contact.phone) next.phone = contact.phone
  if (contact.email) next.email = contact.email
  if (contact.website) next.website = contact.website
  return next
}

const applyLayout = (
  state: SignatureFormState,
  design: AiSignatureDesign
): SignatureFormState => {
  const layout = design.layout
  if (!layout) return state

  let next = { ...state }
  if (layout.fontFamily) next.fontFamily = layout.fontFamily
  if (layout.nameFontWeight !== undefined) {
    next.nameFontWeight = clamp(layout.nameFontWeight, 300, 800)
  }
  if (layout.titleFontWeight !== undefined) {
    next.titleFontWeight = clamp(layout.titleFontWeight, 300, 800)
  }
  if (layout.bodyFontWeight !== undefined) {
    next.bodyFontWeight = clamp(layout.bodyFontWeight, 300, 800)
  }
  if (layout.nameFontSize !== undefined) {
    next.nameFontSize = clamp(layout.nameFontSize, 14, 72)
  }
  if (layout.titleFontSize !== undefined) {
    next.titleFontSize = clamp(layout.titleFontSize, 10, 48)
  }
  if (layout.bodyFontSize !== undefined) {
    next.bodyFontSize = clamp(layout.bodyFontSize, 9, 24)
  }
  if (layout.lineSpacing !== undefined) {
    next.lineSpacing = clamp(layout.lineSpacing, 1, 2)
  }
  if (layout.signatureWidth !== undefined) {
    next.signatureWidth = clamp(layout.signatureWidth, 250, 900)
  }
  if (layout.signatureHeight !== undefined) {
    next.signatureHeight = clamp(layout.signatureHeight, 120, 500)
  }
  if (layout.textColumnWidth !== undefined) {
    next.textColumnWidth = clamp(layout.textColumnWidth, 120, 760)
  }
  if (layout.logoMaxWidth !== undefined) {
    next.logoMaxWidth = clamp(layout.logoMaxWidth, 60, 400)
  }
  if (layout.textAlign) next.textAlign = layout.textAlign as TextAlign
  if (layout.nameTitleAlign) next.nameTitleAlign = layout.nameTitleAlign as TextAlign
  if (layout.emailAlign) next.emailAlign = layout.emailAlign as TextAlign
  if (layout.logoAlign) next.logoAlign = layout.logoAlign as TextAlign
  if (layout.verticalAlign) next.verticalAlign = layout.verticalAlign as VerticalAlign
  if (layout.textOffsetX !== undefined) {
    next.textOffsetX = clamp(layout.textOffsetX, -120, 120)
  }
  if (layout.textOffsetY !== undefined) {
    next.textOffsetY = clamp(layout.textOffsetY, -120, 120)
  }
  if (layout.logoOffsetX !== undefined) {
    next.logoOffsetX = clamp(layout.logoOffsetX, -120, 120)
  }
  if (layout.logoOffsetY !== undefined) {
    next.logoOffsetY = clamp(layout.logoOffsetY, -120, 120)
  }
  if (layout.dividerThickness !== undefined) {
    next.dividerThickness = clamp(layout.dividerThickness, 0, 10)
  }
  if (layout.socialIconGap !== undefined) {
    next.socialIconGap = clamp(layout.socialIconGap, 0, 20)
  }
  return next
}

const applyColors = (
  state: SignatureFormState,
  design: AiSignatureDesign
): SignatureFormState => {
  const colors = design.colors
  if (!colors) return state

  let next = { ...state }
  if (colors.accentColor) next.accentColor = colors.accentColor
  if (colors.textColor) next.textColor = colors.textColor
  if (colors.secondaryTextColor) next.secondaryTextColor = colors.secondaryTextColor
  if (colors.dividerColor) next.dividerColor = colors.dividerColor
  if (colors.linkColor) next.linkColor = colors.linkColor
  if (colors.backgroundColor) next.backgroundColor = colors.backgroundColor
  return next
}

const applySocial = (
  state: SignatureFormState,
  design: AiSignatureDesign
): SignatureFormState => {
  const social = design.social
  if (!social) return state

  let next = { ...state }
  if (social.facebookUrl !== undefined) next.facebookUrl = social.facebookUrl
  if (social.instagramUrl !== undefined) next.instagramUrl = social.instagramUrl
  if (social.linkedinUrl !== undefined) next.linkedinUrl = social.linkedinUrl
  if (social.xUrl !== undefined) next.xUrl = social.xUrl
  if (social.youtubeUrl !== undefined) next.youtubeUrl = social.youtubeUrl
  return next
}

export const applyAiSignatureDesignToState = (
  state: SignatureFormState,
  design: AiSignatureDesign
): SignatureFormState => {
  let next = applyContact(state, design)
  next = applyLayout(next, design)
  next = applyColors(next, design)
  next = applySocial(next, design)

  const lang = next.signatureLanguage as AppLanguage
  if (lang === 'he' && !design.layout?.textAlign) {
    next = { ...next, textAlign: 'right', nameTitleAlign: 'right', emailAlign: 'right' }
  }
  return next
}

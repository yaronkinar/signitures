import type { AiSignatureDesign, AppLanguage, TextAlign, VerticalAlign } from './aiSignatureDesign'
import { applyAiSignatureDesignToState } from './lib/applyAiDesignState'
import { createDefaultFormState } from './lib/defaultFormState'
import type { SignatureFormState } from './types/signatureForm'

/** @deprecated Use applyAiSignatureDesignToState with React form state */
export type SignatureFormInputs = {
  signatureLanguage: HTMLSelectElement
  fullName: HTMLInputElement
  jobTitle: HTMLInputElement
  company: HTMLInputElement
  phone: HTMLInputElement
  email: HTMLInputElement
  website: HTMLInputElement
  facebookUrl: HTMLInputElement
  instagramUrl: HTMLInputElement
  linkedinUrl: HTMLInputElement
  xUrl: HTMLInputElement
  youtubeUrl: HTMLInputElement
  fontFamily: HTMLSelectElement
  nameFontSize: HTMLInputElement
  titleFontSize: HTMLInputElement
  bodyFontSize: HTMLInputElement
  lineSpacing: HTMLInputElement
  signatureWidth: HTMLInputElement
  signatureHeight: HTMLInputElement
  textColumnWidth: HTMLInputElement
  logoMaxWidth: HTMLInputElement
  textAlign: HTMLSelectElement
  nameTitleAlign: HTMLSelectElement
  emailAlign: HTMLSelectElement
  logoAlign: HTMLSelectElement
  verticalAlign: HTMLSelectElement
  textOffsetX: HTMLInputElement
  textOffsetY: HTMLInputElement
  logoOffsetX: HTMLInputElement
  logoOffsetY: HTMLInputElement
  dividerThickness: HTMLInputElement
  socialIconGap: HTMLInputElement
  accentColor: HTMLInputElement
  textColor: HTMLInputElement
  secondaryTextColor: HTMLInputElement
  dividerColor: HTMLInputElement
  linkColor: HTMLInputElement
  backgroundColor: HTMLInputElement
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const setInputValue = (input: HTMLInputElement, value: string | number): void => {
  input.value = String(value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const setSelectValue = (select: HTMLSelectElement, value: string): void => {
  const hasOption = Array.from(select.options).some((option) => option.value === value)
  if (!hasOption) return
  select.value = value
  select.dispatchEvent(new Event('change', { bubbles: true }))
}

const setAlignSelect = (select: HTMLSelectElement, value: TextAlign | undefined): void => {
  if (value) setSelectValue(select, value)
}

const applyContact = (form: SignatureFormInputs, design: AiSignatureDesign): void => {
  const contact = design.contact
  if (!contact) return

  if (contact.signatureLanguage) {
    setSelectValue(form.signatureLanguage, contact.signatureLanguage)
  }
  if (contact.fullName) setInputValue(form.fullName, contact.fullName)
  if (contact.jobTitle) setInputValue(form.jobTitle, contact.jobTitle)
  if (contact.company) setInputValue(form.company, contact.company)
  if (contact.phone) setInputValue(form.phone, contact.phone)
  if (contact.email) setInputValue(form.email, contact.email)
  if (contact.website) setInputValue(form.website, contact.website)
}

const applyLayout = (form: SignatureFormInputs, design: AiSignatureDesign): void => {
  const layout = design.layout
  if (!layout) return

  if (layout.fontFamily) setSelectValue(form.fontFamily, layout.fontFamily)
  if (layout.nameFontSize !== undefined) {
    setInputValue(form.nameFontSize, clamp(layout.nameFontSize, 14, 72))
  }
  if (layout.titleFontSize !== undefined) {
    setInputValue(form.titleFontSize, clamp(layout.titleFontSize, 10, 48))
  }
  if (layout.bodyFontSize !== undefined) {
    setInputValue(form.bodyFontSize, clamp(layout.bodyFontSize, 9, 24))
  }
  if (layout.lineSpacing !== undefined) {
    setInputValue(form.lineSpacing, clamp(layout.lineSpacing, 1, 2))
  }
  if (layout.signatureWidth !== undefined) {
    setInputValue(form.signatureWidth, clamp(layout.signatureWidth, 250, 900))
  }
  if (layout.signatureHeight !== undefined) {
    setInputValue(form.signatureHeight, clamp(layout.signatureHeight, 120, 500))
  }
  if (layout.textColumnWidth !== undefined) {
    setInputValue(form.textColumnWidth, clamp(layout.textColumnWidth, 120, 760))
  }
  if (layout.logoMaxWidth !== undefined) {
    setInputValue(form.logoMaxWidth, clamp(layout.logoMaxWidth, 60, 400))
  }

  setAlignSelect(form.textAlign, layout.textAlign)
  setAlignSelect(form.nameTitleAlign, layout.nameTitleAlign)
  setAlignSelect(form.emailAlign, layout.emailAlign)
  setAlignSelect(form.logoAlign, layout.logoAlign)

  if (layout.verticalAlign) {
    setSelectValue(form.verticalAlign, layout.verticalAlign as VerticalAlign)
  }
  if (layout.textOffsetX !== undefined) {
    setInputValue(form.textOffsetX, clamp(layout.textOffsetX, -120, 120))
  }
  if (layout.textOffsetY !== undefined) {
    setInputValue(form.textOffsetY, clamp(layout.textOffsetY, -120, 120))
  }
  if (layout.logoOffsetX !== undefined) {
    setInputValue(form.logoOffsetX, clamp(layout.logoOffsetX, -120, 120))
  }
  if (layout.logoOffsetY !== undefined) {
    setInputValue(form.logoOffsetY, clamp(layout.logoOffsetY, -120, 120))
  }
  if (layout.dividerThickness !== undefined) {
    setInputValue(form.dividerThickness, clamp(layout.dividerThickness, 0, 10))
  }
  if (layout.socialIconGap !== undefined) {
    setInputValue(form.socialIconGap, clamp(layout.socialIconGap, 0, 20))
  }
}

const applyColors = (form: SignatureFormInputs, design: AiSignatureDesign): void => {
  const colors = design.colors
  if (!colors) return

  if (colors.accentColor) setInputValue(form.accentColor, colors.accentColor)
  if (colors.textColor) setInputValue(form.textColor, colors.textColor)
  if (colors.secondaryTextColor) setInputValue(form.secondaryTextColor, colors.secondaryTextColor)
  if (colors.dividerColor) setInputValue(form.dividerColor, colors.dividerColor)
  if (colors.linkColor) setInputValue(form.linkColor, colors.linkColor)
  if (colors.backgroundColor) setInputValue(form.backgroundColor, colors.backgroundColor)
}

const applySocial = (form: SignatureFormInputs, design: AiSignatureDesign): void => {
  const social = design.social
  if (!social) return

  if (social.facebookUrl !== undefined) setInputValue(form.facebookUrl, social.facebookUrl)
  if (social.instagramUrl !== undefined) setInputValue(form.instagramUrl, social.instagramUrl)
  if (social.linkedinUrl !== undefined) setInputValue(form.linkedinUrl, social.linkedinUrl)
  if (social.xUrl !== undefined) setInputValue(form.xUrl, social.xUrl)
  if (social.youtubeUrl !== undefined) setInputValue(form.youtubeUrl, social.youtubeUrl)
}

/** @deprecated DOM-based helper; React app uses applyAiSignatureDesignToState */
export const applyAiSignatureDesign = (
  form: SignatureFormInputs,
  design: AiSignatureDesign
): void => {
  applyContact(form, design)
  applyLayout(form, design)
  applyColors(form, design)
  applySocial(form, design)

  const lang = form.signatureLanguage.value as AppLanguage
  if (lang === 'he' && !design.layout?.textAlign) {
    setSelectValue(form.textAlign, 'right')
    setSelectValue(form.nameTitleAlign, 'right')
    setSelectValue(form.emailAlign, 'right')
  }
}

export const applyAiSignatureDesignFromDom = applyAiSignatureDesign

export const stateFromDomInputs = (form: SignatureFormInputs): SignatureFormState => {
  const base = createDefaultFormState()
  return {
    ...base,
    signatureLanguage: form.signatureLanguage.value as AppLanguage,
    fullName: form.fullName.value,
    jobTitle: form.jobTitle.value,
    company: form.company.value,
    phone: form.phone.value,
    email: form.email.value,
    website: form.website.value,
    facebookUrl: form.facebookUrl.value,
    instagramUrl: form.instagramUrl.value,
    linkedinUrl: form.linkedinUrl.value,
    xUrl: form.xUrl.value,
    youtubeUrl: form.youtubeUrl.value,
    fontFamily: form.fontFamily.value,
    nameFontSize: Number(form.nameFontSize.value),
    titleFontSize: Number(form.titleFontSize.value),
    bodyFontSize: Number(form.bodyFontSize.value),
    lineSpacing: Number(form.lineSpacing.value),
    signatureWidth: Number(form.signatureWidth.value),
    signatureHeight: Number(form.signatureHeight.value),
    textColumnWidth: Number(form.textColumnWidth.value),
    logoMaxWidth: Number(form.logoMaxWidth.value),
    textAlign: form.textAlign.value as SignatureFormState['textAlign'],
    nameTitleAlign: form.nameTitleAlign.value as SignatureFormState['nameTitleAlign'],
    emailAlign: form.emailAlign.value as SignatureFormState['emailAlign'],
    logoAlign: form.logoAlign.value as SignatureFormState['logoAlign'],
    verticalAlign: form.verticalAlign.value as SignatureFormState['verticalAlign'],
    textOffsetX: Number(form.textOffsetX.value),
    textOffsetY: Number(form.textOffsetY.value),
    logoOffsetX: Number(form.logoOffsetX.value),
    logoOffsetY: Number(form.logoOffsetY.value),
    dividerThickness: Number(form.dividerThickness.value),
    socialIconGap: Number(form.socialIconGap.value),
    accentColor: form.accentColor.value,
    textColor: form.textColor.value,
    secondaryTextColor: form.secondaryTextColor.value,
    dividerColor: form.dividerColor.value,
    linkColor: form.linkColor.value,
    backgroundColor: form.backgroundColor.value
  }
}

export { applyAiSignatureDesignToState }

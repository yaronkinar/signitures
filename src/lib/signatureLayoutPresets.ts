import type { SignatureFormState, SignatureLayoutPresetId } from '../types/signatureForm'

export const SIGNATURE_LAYOUT_PRESET_IDS = [
  'side-right',
  'side-left',
  'side-right-banner',
  'side-left-banner',
  'logo-top-banner-bottom',
  'banner-top-logo-bottom',
  'text-only',
  'text-only-banner'
] as const satisfies readonly SignatureLayoutPresetId[]

export type SignatureLayoutPresetMeta = {
  id: SignatureLayoutPresetId
  labelKey:
    | 'layoutSideRight'
    | 'layoutSideLeft'
    | 'layoutSideRightBanner'
    | 'layoutSideLeftBanner'
    | 'layoutStackedBanner'
    | 'layoutBannerTopLogoBottom'
    | 'layoutTextOnly'
    | 'layoutTextOnlyBanner'
  icon: string
}

export const SIGNATURE_LAYOUT_PRESETS: SignatureLayoutPresetMeta[] = [
  { id: 'side-right', labelKey: 'layoutSideRight', icon: '◨' },
  { id: 'side-left', labelKey: 'layoutSideLeft', icon: '◧' },
  { id: 'side-right-banner', labelKey: 'layoutSideRightBanner', icon: '◨\n▬' },
  { id: 'side-left-banner', labelKey: 'layoutSideLeftBanner', icon: '◧\n▬' },
  { id: 'logo-top-banner-bottom', labelKey: 'layoutStackedBanner', icon: '▭\n▬' },
  { id: 'banner-top-logo-bottom', labelKey: 'layoutBannerTopLogoBottom', icon: '▬\n▭' },
  { id: 'text-only', labelKey: 'layoutTextOnly', icon: '≡' },
  { id: 'text-only-banner', labelKey: 'layoutTextOnlyBanner', icon: '≡\n▬' }
]

export const applySignatureLayoutPreset = (
  presetId: SignatureLayoutPresetId,
  form: SignatureFormState
): Partial<SignatureFormState> => {
  const width = form.signatureWidth
  const align = form.emailAlign

  const sideBase = {
    dividerThickness: form.dividerThickness > 0 ? form.dividerThickness : 2,
    textColumnWidth: 252,
    logoMaxWidth: 122,
    verticalAlign: 'top' as const,
    layoutPreset: presetId
  }

  switch (presetId) {
    case 'side-right':
      return { ...sideBase, logoSide: 'right', logoOffsetX: 10, logoOffsetY: 6 }
    case 'side-left':
      return { ...sideBase, logoSide: 'left', logoOffsetX: 10, logoOffsetY: 6 }
    case 'side-right-banner':
      return {
        ...sideBase,
        logoSide: 'right',
        logoOffsetX: 10,
        logoOffsetY: 6,
        bannerMaxWidth: width
      }
    case 'side-left-banner':
      return {
        ...sideBase,
        logoSide: 'left',
        logoOffsetX: 10,
        logoOffsetY: 6,
        bannerMaxWidth: width
      }
    case 'logo-top-banner-bottom':
      return {
        layoutPreset: presetId,
        logoSide: 'top',
        dividerThickness: 0,
        textColumnWidth: width,
        logoMaxWidth: Math.min(320, width),
        bannerMaxWidth: width,
        logoAlign: align,
        verticalAlign: 'top',
        logoOffsetX: 0,
        logoOffsetY: 0
      }
    case 'banner-top-logo-bottom':
      return {
        layoutPreset: presetId,
        logoSide: 'bottom',
        dividerThickness: 0,
        textColumnWidth: width,
        logoMaxWidth: Math.min(280, width),
        bannerMaxWidth: width,
        logoAlign: align,
        verticalAlign: 'top',
        logoOffsetX: 0,
        logoOffsetY: 0
      }
    case 'text-only':
      return {
        layoutPreset: presetId,
        logoSide: 'none',
        dividerThickness: 0,
        textColumnWidth: width,
        verticalAlign: 'top',
        logoOffsetX: 0,
        logoOffsetY: 0
      }
    case 'text-only-banner':
      return {
        layoutPreset: presetId,
        logoSide: 'none',
        dividerThickness: 0,
        textColumnWidth: width,
        bannerMaxWidth: width,
        verticalAlign: 'top',
        logoOffsetX: 0,
        logoOffsetY: 0
      }
    default:
      return { layoutPreset: presetId }
  }
}

export const detectSignatureLayoutPreset = (
  form: SignatureFormState
): SignatureLayoutPresetId => {
  if (form.layoutPreset && SIGNATURE_LAYOUT_PRESET_IDS.includes(form.layoutPreset)) {
    return form.layoutPreset
  }

  if (form.logoSide === 'top') return 'logo-top-banner-bottom'
  if (form.logoSide === 'bottom') return 'banner-top-logo-bottom'
  if (form.logoSide === 'none') {
    return form.bannerMaxWidth >= form.signatureWidth - 16 ? 'text-only-banner' : 'text-only'
  }
  if (form.logoSide === 'left') {
    return form.bannerMaxWidth >= form.signatureWidth - 16 ? 'side-left-banner' : 'side-left'
  }
  return form.bannerMaxWidth >= form.signatureWidth - 16 ? 'side-right-banner' : 'side-right'
}

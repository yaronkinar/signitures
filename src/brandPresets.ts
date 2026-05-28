import type { AppLanguage } from './i18n'
import type { SignatureFormState } from './types/signatureForm'

export const SBA_BRAND_COLORS = [
  '#4d4c4f',
  '#dadee7',
  '#a74e8d',
  '#30bbed',
  '#4c4c4e',
  '#33ccff',
  '#88236f'
] as const

type SignatureBrandPreset = {
  id: string
  label: Record<AppLanguage, string>
  values: Pick<
    SignatureFormState,
    | 'fontFamily'
    | 'nameFontWeight'
    | 'titleFontWeight'
    | 'bodyFontWeight'
    | 'accentColor'
    | 'textColor'
    | 'secondaryTextColor'
    | 'dividerColor'
    | 'linkColor'
    | 'backgroundColor'
  >
}

const SBA_SIGNATURE_COLORS = {
  accentColor: '#88236f',
  textColor: '#4c4c4e',
  secondaryTextColor: '#4d4c4f',
  dividerColor: '#30bbed',
  linkColor: '#33ccff',
  backgroundColor: '#ffffff'
} as const

export const SBA_BRAND_PRESETS: SignatureBrandPreset[] = [
  {
    id: 'sba-rubik',
    label: {
      en: 'Maof - Rubik',
      he: 'מעוף - Rubik'
    },
    values: {
      fontFamily: "'Rubik', Arial, Helvetica, sans-serif",
      nameFontWeight: 700,
      titleFontWeight: 600,
      bodyFontWeight: 400,
      ...SBA_SIGNATURE_COLORS
    }
  },
  {
    id: 'sba-cairo',
    label: {
      en: 'Maof - Cairo',
      he: 'מעוף - Cairo'
    },
    values: {
      fontFamily: "'Cairo', Arial, Helvetica, sans-serif",
      nameFontWeight: 700,
      titleFontWeight: 600,
      bodyFontWeight: 400,
      ...SBA_SIGNATURE_COLORS
    }
  }
]

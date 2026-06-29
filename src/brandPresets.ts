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
    | 'nameColor'
    | 'jobTitleColor'
    | 'companyColor'
    | 'contactLabelColor'
    | 'phoneColor'
    | 'emailColor'
    | 'websiteColor'
  > &
    Partial<
      Pick<
        SignatureFormState,
        | 'layoutPreset'
        | 'logoSide'
        | 'dividerThickness'
        | 'textColumnWidth'
        | 'logoMaxWidth'
        | 'logoOffsetX'
        | 'logoOffsetY'
        | 'verticalAlign'
        | 'showContactLabels'
        | 'contactMatchNameTitle'
        | 'textAlign'
        | 'facebookIconVariant'
        | 'instagramIconVariant'
        | 'linkedinIconVariant'
        | 'xIconVariant'
        | 'youtubeIconVariant'
      >
    >
}

const SBA_SIGNATURE_COLORS = {
  accentColor: '#88236f',
  textColor: '#4c4c4e',
  secondaryTextColor: '#4d4c4f',
  dividerColor: '#30bbed',
  linkColor: '#33ccff',
  backgroundColor: '#ffffff',
  nameColor: '#88236f',
  jobTitleColor: '#4d4c4f',
  companyColor: '#4d4c4f',
  contactLabelColor: '#4d4c4f',
  phoneColor: '#88236f',
  emailColor: '#88236f',
  websiteColor: '#33ccff'
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
  },
  {
    id: 'sba-full-signature',
    label: {
      en: 'Maof - Full signature',
      he: 'מעוף - חתימה מלאה'
    },
    values: {
      fontFamily: "'Rubik', Arial, Helvetica, sans-serif",
      nameFontWeight: 700,
      titleFontWeight: 600,
      bodyFontWeight: 400,
      ...SBA_SIGNATURE_COLORS,
      dividerColor: '#c9c9c9',
      phoneColor: '#4d4c4f',
      emailColor: '#4d4c4f',
      websiteColor: '#4d4c4f',
      layoutPreset: 'side-right',
      logoSide: 'right',
      dividerThickness: 1,
      textColumnWidth: 252,
      logoMaxWidth: 122,
      logoOffsetX: 10,
      logoOffsetY: 6,
      verticalAlign: 'top',
      showContactLabels: false,
      contactMatchNameTitle: false,
      textAlign: 'left',
      facebookIconVariant: 'brand',
      instagramIconVariant: 'gradient',
      linkedinIconVariant: 'badge',
      xIconVariant: 'brand',
      youtubeIconVariant: 'brand'
    }
  }
]

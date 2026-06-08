import type { ReactNode } from 'react'
import { t, type AppLanguage } from '../i18n'
import type { SignatureLayoutSettings, TextAlign } from '../types/signatureForm'

const FONT_LABELS: Record<string, string> = {
  "'Rubik', Arial, Helvetica, sans-serif": 'Rubik',
  "'Cairo', Arial, Helvetica, sans-serif": 'Cairo',
  'Arial, Helvetica, sans-serif': 'Arial',
  "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif": 'Comeback SemiBold',
  "'Calibri', Arial, Helvetica, sans-serif": 'Calibri',
  "'Segoe UI', Arial, Helvetica, sans-serif": 'Segoe UI',
  "'Tahoma', Arial, Helvetica, sans-serif": 'Tahoma',
  "'Verdana', Arial, Helvetica, sans-serif": 'Verdana',
  "'Trebuchet MS', Arial, Helvetica, sans-serif": 'Trebuchet MS',
  "'Times New Roman', Times, serif": 'Times New Roman',
  "'Georgia', serif": 'Georgia'
}

const fontFamilyLabel = (value: string): string =>
  FONT_LABELS[value] ?? value.split(',')[0]?.replace(/['"]/g, '').trim() ?? value

const alignLabel = (lang: AppLanguage, align: TextAlign): string => {
  if (align === 'left') return t(lang, 'alignLeft')
  if (align === 'center') return t(lang, 'alignCenter')
  return t(lang, 'alignRight')
}

const COLOR_KEYS = [
  { key: 'backgroundColor', labelKey: 'background' },
  { key: 'dividerColor', labelKey: 'divider' },
  { key: 'textColor', labelKey: 'primaryText' },
  { key: 'nameColor', labelKey: 'fullName' },
  { key: 'jobTitleColor', labelKey: 'jobTitle' },
  { key: 'companyColor', labelKey: 'company' },
  { key: 'contactLabelColor', labelKey: 'contactLabels' },
  { key: 'phoneColor', labelKey: 'phone' },
  { key: 'emailColor', labelKey: 'email' },
  { key: 'websiteColor', labelKey: 'website' }
] as const satisfies ReadonlyArray<{
  key: keyof Pick<
    SignatureLayoutSettings,
    | 'backgroundColor'
    | 'dividerColor'
    | 'textColor'
    | 'nameColor'
    | 'jobTitleColor'
    | 'companyColor'
    | 'contactLabelColor'
    | 'phoneColor'
    | 'emailColor'
    | 'websiteColor'
  >
  labelKey:
    | 'background'
    | 'divider'
    | 'primaryText'
    | 'fullName'
    | 'jobTitle'
    | 'company'
    | 'contactLabels'
    | 'phone'
    | 'email'
    | 'website'
}>

type StyleSummaryProps = {
  layout: SignatureLayoutSettings
  lang: AppLanguage
}

const SummarySection = ({
  title,
  children
}: {
  title: string
  children: ReactNode
}) => (
  <section className="style-summary-section">
    <h4 className="style-summary-section-title">{title}</h4>
    <div className="style-summary-rows">{children}</div>
  </section>
)

const SummaryRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="style-summary-row">
    <span className="style-summary-key">{label}</span>
    <span className="style-summary-value">{value}</span>
  </div>
)

export const StyleSummary = ({ layout, lang }: StyleSummaryProps) => {
  const logoSide =
    layout.logoSide === 'left'
      ? t(lang, 'logoSideLeft')
      : layout.logoSide === 'top'
        ? t(lang, 'logoSideTop')
        : layout.logoSide === 'bottom'
          ? t(lang, 'logoSideBottom')
          : layout.logoSide === 'none'
            ? t(lang, 'logoSideNone')
            : t(lang, 'logoSideRight')

  return (
    <details className="style-summary-panel" open>
      <summary>{t(lang, 'styleSummary')}</summary>
      <div className="style-summary">
        <SummarySection title={t(lang, 'layoutTypography')}>
        <SummaryRow label={t(lang, 'fontFamily')} value={fontFamilyLabel(layout.fontFamily)} />
        <SummaryRow
          label={t(lang, 'styleSummaryTypeScale')}
          value={
            <span dir="ltr">
              {layout.nameFontSize}/{layout.titleFontSize}/{layout.bodyFontSize} px · w
              {layout.nameFontWeight}/{layout.titleFontWeight}/{layout.bodyFontWeight}
            </span>
          }
        />
        <SummaryRow label={t(lang, 'lineSpacing')} value={layout.lineSpacing} />
      </SummarySection>

      <SummarySection title={t(lang, 'positionAlignment')}>
        <SummaryRow
          label={t(lang, 'styleSummaryDimensions')}
          value={
            <span dir="ltr">
              {layout.signatureWidth} × {layout.signatureHeight} px
            </span>
          }
        />
        <SummaryRow
          label={t(lang, 'logoSide')}
          value={
            <span dir="ltr">
              {logoSide} · {layout.logoMaxWidth}px
            </span>
          }
        />
        <SummaryRow label={t(lang, 'mainTextAlign')} value={alignLabel(lang, layout.textAlign)} />
      </SummarySection>

      <SummarySection title={t(lang, 'colors')}>
        <ul className="style-color-grid" aria-label={t(lang, 'colors')}>
          {COLOR_KEYS.map(({ key, labelKey }) => (
            <li key={key} className="style-color-chip" title={`${t(lang, labelKey)}: ${layout[key]}`}>
              <span className="style-color-swatch" style={{ backgroundColor: layout[key] }} aria-hidden="true" />
              <span className="style-color-label">{t(lang, labelKey)}</span>
            </li>
          ))}
        </ul>
      </SummarySection>
      </div>
    </details>
  )
}

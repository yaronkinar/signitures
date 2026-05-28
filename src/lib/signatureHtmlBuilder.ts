import { signatureStrings, type AppLanguage } from '../i18n'
import type { SignatureFormState, SignatureLayoutSettings } from '../types/signatureForm'
import { escapeHtml, hasHebrew, normalizeUrl } from './signatureUtils'
import { resolveSocialIconUrl } from './socialIcons'

export const buildSignatureHtml = (
  form: SignatureFormState,
  layout: SignatureLayoutSettings
): string => {
  const lang: AppLanguage = form.signatureLanguage
  const strings = signatureStrings[lang]
  const contactDirection = lang === 'he' ? 'rtl' : 'ltr'
  const fullName = escapeHtml(form.fullName.trim())
  const jobTitle = escapeHtml(form.jobTitle.trim())
  const company = escapeHtml(form.company.trim())
  const phone = escapeHtml(form.phone.trim())
  const email = form.email.trim()
  const website = normalizeUrl(form.website)
  const facebookUrl = normalizeUrl(form.facebookUrl)
  const instagramUrl = normalizeUrl(form.instagramUrl)
  const linkedinUrl = normalizeUrl(form.linkedinUrl)
  const xUrl = normalizeUrl(form.xUrl)
  const youtubeUrl = normalizeUrl(form.youtubeUrl)
  const logoUrl = normalizeUrl(form.logoUrl)
  const accentColor = layout.accentColor
  const textColor = layout.textColor
  const secondaryTextColor = layout.secondaryTextColor
  const dividerColor = layout.dividerColor
  const linkColor = layout.linkColor
  const backgroundColor = layout.backgroundColor
  const signatureWidth = layout.signatureWidth
  const nameFontWeight = layout.nameFontWeight
  const titleFontWeight = layout.titleFontWeight
  const bodyFontWeight = layout.bodyFontWeight
  const textColumnWidth = Math.min(layout.textColumnWidth, signatureWidth - 80)
  const logoColumnWidth = Math.max(60, signatureWidth - textColumnWidth - layout.dividerThickness)
  const fontFamilyCss = escapeHtml(layout.fontFamily)
  const bodyFontSizePx = `${layout.bodyFontSize}px`
  const compactLinkFontSizePx = `${Math.max(9, layout.bodyFontSize - 2)}px`
  const detailsLineHeight = Math.max(1, layout.lineSpacing - 0.15)
  const nameLineHeight = Math.max(1, layout.lineSpacing - 0.35)
  const titleLineHeight = Math.max(1, layout.lineSpacing - 0.3)
  const rtlContent =
    lang === 'he' || [form.fullName, form.jobTitle, form.company].some(hasHebrew)
  const nameTitleDirection = rtlContent ? 'rtl' : 'ltr'
  const textOffsetLeft = Math.max(layout.textOffsetX, 0)
  const textOffsetRight = Math.max(-layout.textOffsetX, 0)
  const contentAlign = rtlContent ? 'right' : layout.nameTitleAlign
  const contentAlignAttr =
    contentAlign === 'left' ? 'left' : contentAlign === 'center' ? 'center' : 'right'
  const edgeInset = 8
  const dividerInset = 12

  const contactRowBorder = dividerColor
  const formatBreakableText = (value: string): string =>
    escapeHtml(value).replace(/([@._-])/g, '$1<wbr>')
  const buildContactRow = (
    labelHtml: string,
    valueHtml: string,
    valueStyle = 'unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:break-word;'
  ): string =>
    `<tr>
      <td dir="${contactDirection}" align="${contentAlignAttr}" style="padding:3px ${edgeInset}px 6px;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};text-align:${contentAlign};border-bottom:1px solid ${contactRowBorder};">
        <span style="font-weight:${titleFontWeight};color:${secondaryTextColor};">${labelHtml}</span>&nbsp;<span style="${valueStyle}font-weight:${bodyFontWeight};">${valueHtml}</span>
      </td>
    </tr>`

  const contactRows: string[] = []
  if (phone.trim()) {
    contactRows.push(
      buildContactRow(
        strings.phoneLabel,
        `<a href="${escapeHtml(normalizeUrl(`tel:${form.phone.trim()}`))}" style="text-decoration:none;color:${accentColor};">${phone}</a>`
      )
    )
  }
  if (email) {
    contactRows.push(
      buildContactRow(
        strings.emailLabel,
        `<a href="${escapeHtml(normalizeUrl(`mailto:${email}`))}" style="text-decoration:underline;color:${accentColor};font-size:${compactLinkFontSizePx};white-space:nowrap;">${escapeHtml(email)}</a>`,
        'unicode-bidi:plaintext;white-space:nowrap;'
      )
    )
  }
  if (website) {
    const websiteDisplayText = website.replace(/^https?:\/\//i, '')
    contactRows.push(
      buildContactRow(
        strings.websiteLabel,
        `<a href="${escapeHtml(website)}" style="text-decoration:underline;color:${linkColor};overflow-wrap:anywhere;word-break:break-word;">${formatBreakableText(websiteDisplayText)}</a>`
      )
    )
  }

  const socialLinks = [
    {
      label: 'Facebook',
      url: facebookUrl,
      iconUrl: resolveSocialIconUrl('Facebook', form.facebookIconUrl)
    },
    {
      label: 'Instagram',
      url: instagramUrl,
      iconUrl: resolveSocialIconUrl('Instagram', form.instagramIconUrl)
    },
    {
      label: 'LinkedIn',
      url: linkedinUrl,
      iconUrl: resolveSocialIconUrl('LinkedIn', form.linkedinIconUrl)
    },
    { label: 'X', url: xUrl, iconUrl: resolveSocialIconUrl('X', form.xIconUrl) },
    {
      label: 'YouTube',
      url: youtubeUrl,
      iconUrl: resolveSocialIconUrl('YouTube', form.youtubeIconUrl)
    }
  ].filter((item) => item.url && item.iconUrl)

  const socialIconSize = layout.bodyFontSize + 4
  const socialAlign = contentAlign
  const socialIconMargin =
    nameTitleDirection === 'rtl'
      ? `0 0 ${layout.socialIconGap}px ${layout.socialIconGap}px`
      : `0 ${layout.socialIconGap}px ${layout.socialIconGap}px 0`
  const socialTextRow = socialLinks.length
    ? `<tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="padding:${edgeInset}px ${edgeInset}px 0;text-align:${socialAlign};font-size:0;line-height:0;">
      ${socialLinks
        .map(
          (item) => `<span style="display:inline-block;vertical-align:middle;margin:${socialIconMargin};font-size:0;line-height:0;">
            <a href="${escapeHtml(item.url)}" title="${escapeHtml(item.label)}" style="text-decoration:none;display:inline-block;line-height:0;">
              <img
                src="${escapeHtml(item.iconUrl)}"
                alt="${escapeHtml(item.label)}"
                width="${socialIconSize}"
                height="${socialIconSize}"
                style="display:block;width:${socialIconSize}px;height:${socialIconSize}px;border:0;"
              />
            </a>
          </span>`
        )
        .join('')}
    </td></tr>`
    : ''

  const logoOnLeft = layout.logoSide === 'left'
  const textPaddingLeft = textOffsetLeft + (logoOnLeft ? dividerInset : edgeInset)
  const textPaddingRight = textOffsetRight + (logoOnLeft ? edgeInset : dividerInset)
  const logoPaddingLeft = logoOnLeft ? edgeInset : dividerInset
  const logoPaddingRight = logoOnLeft ? dividerInset : edgeInset
  const logoHorizontalShift = layout.logoOffsetX

  const textCell = `<td style="vertical-align:${layout.verticalAlign};padding-left:${textPaddingLeft}px;padding-right:${textPaddingRight}px;padding-top:${Math.max(
    0,
    layout.textOffsetY
  ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.textOffsetY) + edgeInset}px;width:${textColumnWidth}px;max-width:${textColumnWidth}px;text-align:${contentAlign};unicode-bidi:plaintext;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${nameTitleDirection}" style="text-align:${contentAlign};">
        <tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="font-size:${layout.nameFontSize}px;line-height:${nameLineHeight};font-weight:${nameFontWeight};color:${accentColor};padding:0 0 1px;text-align:${contentAlign};unicode-bidi:plaintext;">${fullName || strings.fullNamePlaceholder}</td></tr>
        <tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="font-size:${layout.titleFontSize}px;line-height:${titleLineHeight};font-weight:${titleFontWeight};color:${secondaryTextColor};padding:0 0 3px;text-align:${contentAlign};unicode-bidi:plaintext;">${jobTitle || strings.jobTitlePlaceholder}${company ? `<br style="line-height:${titleLineHeight};" /><span style="font-weight:${titleFontWeight};line-height:${titleLineHeight};">${company}</span>` : ''}</td></tr>
        ${contactRows.length ? `<tr><td dir="${contactDirection}" align="${contentAlignAttr}" style="padding-top:2px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${contactDirection}" style="text-align:${contentAlign};border-collapse:collapse;">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialTextRow}
      </table>
    </td>`

  const dividerCell = `<td style="width:${layout.dividerThickness}px;min-width:${layout.dividerThickness}px;background:${dividerColor};font-size:0;line-height:0;padding:0;">&nbsp;</td>`

  const logoGraphic = logoUrl
    ? `<span style="display:inline-block;line-height:0;font-size:0;margin-left:${logoHorizontalShift}px;vertical-align:top;">
          <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(strings.companyLogoAlt)}" width="${layout.logoMaxWidth}" style="display:block;border:0;max-width:${layout.logoMaxWidth}px;height:auto;" />
        </span>`
    : `<div style="display:inline-block;font-size:14px;color:${accentColor};font-weight:700;margin-left:${logoHorizontalShift}px;">${strings.companyLogoPlaceholder}</div>`

  const logoCell = `<td style="vertical-align:${layout.verticalAlign};padding-left:${logoPaddingLeft}px;padding-right:${logoPaddingRight}px;padding-top:${Math.max(
    0,
    layout.logoOffsetY
  ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.logoOffsetY) + edgeInset}px;width:${logoColumnWidth}px;max-width:${logoColumnWidth}px;text-align:${layout.logoAlign};font-size:0;line-height:0;">
      ${logoGraphic}
    </td>`

  const rowCells = logoOnLeft ? [logoCell, dividerCell, textCell] : [textCell, dividerCell, logoCell]

  const signatureTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" style="font-family:${fontFamilyCss};color:${textColor};background:${backgroundColor};width:${signatureWidth}px;max-width:${signatureWidth}px;mso-line-height-rule:exactly;">
  <tr>
    ${rowCells.join('\n    ')}
  </tr>
</table>`

  return `<!-- Outlook email signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="ltr">
  <tr>
    <td align="${layout.emailAlign}" style="text-align:${layout.emailAlign};">
      ${signatureTable}
    </td>
  </tr>
</table>`
}

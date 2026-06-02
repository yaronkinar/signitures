import { signatureStrings, type AppLanguage } from '../i18n'
import type { SignatureFormState, SignatureLayoutSettings } from '../types/signatureForm'
import type { SignatureTextImageSlot } from './signatureTextImages'
import { escapeHtml, hasHebrew, normalizeUrl, outlookFontFamilyStyle, sanitizeFontFamily, sanitizeSignatureInlineHtml } from './signatureUtils'
import { resolveSocialIconUrl } from './socialIcons'

export type BuildSignatureHtmlOptions = {
  textImages?: {
    name?: SignatureTextImageSlot
    titleBlock?: SignatureTextImageSlot
  }
}

const buildTextImageRow = (
  slot: SignatureTextImageSlot,
  nameTitleDirection: string,
  contentAlignAttr: string,
  contentAlign: string,
  padding: string
): string => {
  const src = escapeHtml(slot.dataUrl)
  const alt = escapeHtml(slot.alt)
  return `<tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="padding:${padding};font-size:0;line-height:0;text-align:${contentAlign};">
        <img src="${src}" alt="${alt}" width="${slot.width}" height="${slot.height}" style="display:block;width:${slot.width}px;height:${slot.height}px;border:0;max-width:100%;" />
      </td></tr>`
}

export const buildSignatureHtml = (
  form: SignatureFormState,
  layout: SignatureLayoutSettings,
  options: BuildSignatureHtmlOptions = {}
): string => {
  const lang: AppLanguage = form.signatureLanguage
  const strings = signatureStrings[lang]
  const contactDirection = lang === 'he' ? 'rtl' : 'ltr'
  const fullName = sanitizeSignatureInlineHtml(form.fullName.trim())
  const jobTitle = sanitizeSignatureInlineHtml(form.jobTitle.trim())
  const company = sanitizeSignatureInlineHtml(form.company.trim())
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
  const dividerColor = layout.dividerColor
  const backgroundColor = layout.backgroundColor
  const nameColor = layout.nameColor
  const jobTitleColor = layout.jobTitleColor
  const companyColor = layout.companyColor
  const contactLabelColor = layout.contactLabelColor
  const phoneColor = layout.phoneColor
  const emailColor = layout.emailColor
  const websiteColor = layout.websiteColor
  const signatureWidth = layout.signatureWidth
  const nameFontWeight = layout.nameFontWeight
  const titleFontWeight = layout.titleFontWeight
  const bodyFontWeight = layout.bodyFontWeight
  const textColumnWidth = Math.min(layout.textColumnWidth, signatureWidth - 80)
  const logoColumnWidth = Math.max(60, signatureWidth - textColumnWidth - layout.dividerThickness)
  const fontFamilyCss = escapeHtml(sanitizeFontFamily(layout.fontFamily))
  const fontFamilyStyle = outlookFontFamilyStyle(layout.fontFamily)
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

  const socialLinks = [
    {
      label: 'Facebook',
      url: facebookUrl,
      iconUrl: resolveSocialIconUrl('Facebook', form.facebookIconUrl, form.facebookIconVariant)
    },
    {
      label: 'Instagram',
      url: instagramUrl,
      iconUrl: resolveSocialIconUrl('Instagram', form.instagramIconUrl, form.instagramIconVariant)
    },
    {
      label: 'LinkedIn',
      url: linkedinUrl,
      iconUrl: resolveSocialIconUrl('LinkedIn', form.linkedinIconUrl, form.linkedinIconVariant)
    },
    {
      label: 'X',
      url: xUrl,
      iconUrl: resolveSocialIconUrl('X', form.xIconUrl, form.xIconVariant)
    },
    {
      label: 'YouTube',
      url: youtubeUrl,
      iconUrl: resolveSocialIconUrl('YouTube', form.youtubeIconUrl, form.youtubeIconVariant)
    }
  ].filter((item) => item.url && item.iconUrl)

  const buildContactRow = (
    labelHtml: string,
    valueHtml: string,
    valueStyle = 'unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:break-word;'
  ): string => {
    const contactBorderStyle = socialLinks.length
      ? ''
      : `border-bottom:1px solid ${contactRowBorder};`
    return `<tr>
      <td dir="${contactDirection}" align="${contentAlignAttr}" style="padding:3px ${edgeInset}px 6px;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};text-align:${contentAlign};${contactBorderStyle}">
        <span style="font-weight:${titleFontWeight};color:${contactLabelColor};">${labelHtml}</span>&nbsp;<span style="${valueStyle}font-weight:${bodyFontWeight};">${valueHtml}</span>
      </td>
    </tr>`
  }

  const contactRows: string[] = []
  if (phone.trim()) {
    contactRows.push(
      buildContactRow(
        strings.phoneLabel,
        `<a href="${escapeHtml(normalizeUrl(`tel:${form.phone.trim()}`))}" style="text-decoration:none;color:${phoneColor};">${phone}</a>`
      )
    )
  }
  if (email) {
    contactRows.push(
      buildContactRow(
        strings.emailLabel,
        `<a href="${escapeHtml(normalizeUrl(`mailto:${email}`))}" style="text-decoration:underline;color:${emailColor};font-size:${compactLinkFontSizePx};white-space:nowrap;">${escapeHtml(email)}</a>`,
        'unicode-bidi:plaintext;white-space:nowrap;'
      )
    )
  }
  if (website) {
    const websiteDisplayText = website.replace(/^https?:\/\//i, '')
    contactRows.push(
      buildContactRow(
        strings.websiteLabel,
        `<a href="${escapeHtml(website)}" style="text-decoration:underline;color:${websiteColor};overflow-wrap:anywhere;word-break:break-word;">${formatBreakableText(websiteDisplayText)}</a>`
      )
    )
  }

  const socialIconSize = layout.bodyFontSize + 4
  const socialAlign = contentAlign
  const socialIconGapPx = Math.max(0, layout.socialIconGap)
  const socialIconSpacerPx = Math.max(16, socialIconGapPx + 12)
  const socialIconCellPadPx = 2
  const orderedSocialLinks = rtlContent ? [...socialLinks].reverse() : socialLinks
  const socialIconsRowWidth =
    orderedSocialLinks.length * socialIconSize +
    Math.max(0, orderedSocialLinks.length - 1) * socialIconGapPx
  const socialIconsTableAlign = contentAlignAttr
  const socialFooterPadHorizontal = '0'
  const socialFooterPadIcons = '0 0 10px'

  const buildSocialIconGapCell = (): string =>
    socialIconGapPx <= 0
      ? ''
      : `<td width="${socialIconGapPx}" style="width:${socialIconGapPx}px;min-width:${socialIconGapPx}px;max-width:${socialIconGapPx}px;font-size:1px;line-height:1px;mso-line-height-rule:exactly;padding:0;border:0;">&nbsp;</td>`

  const buildSocialIconCell = (item: (typeof socialLinks)[number]): string =>
    `<td width="${socialIconSize}" valign="middle" align="center" style="width:${socialIconSize}px;height:${socialIconSize + socialIconCellPadPx * 2}px;padding:${socialIconCellPadPx}px 0;vertical-align:middle;text-align:center;line-height:${socialIconSize}px;mso-line-height-rule:exactly;">
      <a href="${escapeHtml(item.url)}" title="${escapeHtml(item.label)}" style="text-decoration:none;line-height:${socialIconSize}px;">
        <img
          src="${escapeHtml(item.iconUrl)}"
          alt="${escapeHtml(item.label)}"
          width="${socialIconSize}"
          height="${socialIconSize}"
          border="0"
          style="display:block;width:${socialIconSize}px;height:${socialIconSize}px;border:0;margin:0 auto;padding:0;"
        />
      </a>
    </td>`

  const socialIconRowCells = orderedSocialLinks
    .map((item, index) => `${index > 0 ? buildSocialIconGapCell() : ''}${buildSocialIconCell(item)}`)
    .join('')

  const socialFooterBlock = socialLinks.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${nameTitleDirection}" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;text-align:${socialAlign};">
      ${
        contactRows.length
          ? `<tr>
      <td align="${contentAlignAttr}" style="padding:10px 0 0;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td height="1" style="height:1px;line-height:1px;font-size:1px;border-top:1px solid ${contactRowBorder};mso-line-height-rule:exactly;padding:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>`
          : ''
      }
      <tr>
        <td height="${socialIconSpacerPx}" align="${contentAlignAttr}" style="height:${socialIconSpacerPx}px;line-height:${socialIconSpacerPx}px;font-size:${socialIconSpacerPx}px;mso-line-height-rule:exactly;padding:${socialFooterPadHorizontal};">&nbsp;</td>
      </tr>
      <tr>
        <td align="${contentAlignAttr}" valign="top" style="padding:${socialFooterPadIcons};vertical-align:top;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${socialIconsTableAlign}" width="${socialIconsRowWidth}" style="width:${socialIconsRowWidth}px;max-width:100%;table-layout:fixed;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
            <tr>
              ${socialIconRowCells}
            </tr>
          </table>
        </td>
      </tr>
    </table>`
    : ''

  const logoOnLeft = layout.logoSide === 'left'
  const textPaddingLeft = textOffsetLeft + (logoOnLeft ? dividerInset : edgeInset)
  const textPaddingRight = textOffsetRight + (logoOnLeft ? edgeInset : dividerInset)
  const logoPaddingLeft = logoOnLeft ? edgeInset : dividerInset
  const logoPaddingRight = logoOnLeft ? dividerInset : edgeInset
  const logoHorizontalShift = layout.logoOffsetX

  const dividerOnTextSide =
    layout.dividerThickness > 0
      ? logoOnLeft
        ? `border-left:${layout.dividerThickness}px solid ${dividerColor};`
        : `border-right:${layout.dividerThickness}px solid ${dividerColor};`
      : ''

  const textColumnVerticalAlign = socialLinks.length ? 'top' : layout.verticalAlign
  const textCell = `<td valign="${textColumnVerticalAlign}" style="${dividerOnTextSide}vertical-align:${textColumnVerticalAlign};padding-left:${textPaddingLeft}px;padding-right:${textPaddingRight}px;padding-top:${Math.max(
    0,
    layout.textOffsetY
  ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.textOffsetY) + edgeInset}px;width:${textColumnWidth}px;max-width:${textColumnWidth}px;text-align:${contentAlign};unicode-bidi:plaintext;overflow:visible;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${nameTitleDirection}" style="${fontFamilyStyle}text-align:${contentAlign};border-collapse:collapse;">
        ${
          options.textImages?.name
            ? buildTextImageRow(
                options.textImages.name,
                nameTitleDirection,
                contentAlignAttr,
                contentAlign,
                '0 0 1px'
              )
            : `<tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="${fontFamilyStyle}font-size:${layout.nameFontSize}px;line-height:${nameLineHeight};font-weight:${nameFontWeight};color:${nameColor};padding:0 0 1px;text-align:${contentAlign};unicode-bidi:plaintext;">${fullName || strings.fullNamePlaceholder}</td></tr>`
        }
        ${
          options.textImages?.titleBlock
            ? buildTextImageRow(
                options.textImages.titleBlock,
                nameTitleDirection,
                contentAlignAttr,
                contentAlign,
                '0 0 3px'
              )
            : `<tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="${fontFamilyStyle}font-size:${layout.titleFontSize}px;line-height:${titleLineHeight};font-weight:${titleFontWeight};color:${jobTitleColor};padding:0 0 3px;text-align:${contentAlign};unicode-bidi:plaintext;">${jobTitle || strings.jobTitlePlaceholder}${company ? `<br style="line-height:${titleLineHeight};" /><span style="${fontFamilyStyle}font-weight:${titleFontWeight};line-height:${titleLineHeight};color:${companyColor};">${company}</span>` : ''}</td></tr>`
        }
        ${contactRows.length ? `<tr><td dir="${contactDirection}" align="${contentAlignAttr}" style="padding-top:2px;padding-bottom:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${contactDirection}" style="text-align:${contentAlign};border-collapse:collapse;">${contactRows.join('')}</table></td></tr>` : ''}
      </table>
      ${socialFooterBlock}
    </td>`

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

  const rowCells = logoOnLeft ? [logoCell, textCell] : [textCell, logoCell]

  const signatureTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" style="direction:ltr;font-family:${fontFamilyCss};color:${textColor};background:${backgroundColor};width:${signatureWidth}px;max-width:${signatureWidth}px;border-collapse:collapse;mso-line-height-rule:exactly;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    ${rowCells.join('\n    ')}
  </tr>
</table>`

  return `<!-- Outlook email signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="ltr" style="direction:ltr;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="${layout.emailAlign}" style="text-align:${layout.emailAlign};">
      ${signatureTable}
    </td>
  </tr>
</table>`
}

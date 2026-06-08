import { signatureStrings, type AppLanguage } from '../i18n'
import type {
  LinkImagePlacement,
  SignatureFormState,
  SignatureLayoutSettings,
  TextAlign
} from '../types/signatureForm'
import { DEFAULT_LINK_IMAGE_MAX_HEIGHT, DEFAULT_LINK_IMAGE_MAX_WIDTH } from '../types/signatureForm'
import type { SignatureTextImageSlot } from './signatureTextImages'
import {
  escapeHtml,
  hasHebrew,
  normalizeUrl,
  outlookFontFamilyStyle,
  sanitizeFontFamily,
  sanitizeSignatureInlineHtml,
  type ImageDisplaySize
} from './signatureUtils'
import { resolveSocialIconUrl } from './socialIcons'

export type BuildSignatureHtmlOptions = {
  textImages?: {
    name?: SignatureTextImageSlot
    titleBlock?: SignatureTextImageSlot
  }
  logoDisplaySize?: ImageDisplaySize
  bannerDisplaySize?: ImageDisplaySize
}

const buildTextImageRow = (
  slot: SignatureTextImageSlot,
  nameTitleDirection: string,
  nameTitleAlignAttr: string,
  nameTitleAlign: string,
  padding: string
): string => {
  const src = escapeHtml(slot.dataUrl)
  const alt = escapeHtml(slot.alt)
  return `<tr><td dir="${nameTitleDirection}" align="${nameTitleAlignAttr}" style="padding:${padding};font-size:0;line-height:0;text-align:${nameTitleAlign};">
        <img src="${src}" alt="${alt}" width="${slot.width}" height="${slot.height}" style="display:block;width:${slot.width}px;height:${slot.height}px;border:0;" />
      </td></tr>`
}

export const buildSignatureHtml = (
  form: SignatureFormState,
  layout: SignatureLayoutSettings,
  options: BuildSignatureHtmlOptions = {}
): string => {
  const lang: AppLanguage = form.signatureLanguage
  const strings = signatureStrings[lang]
  const rtlContent =
    lang === 'he' || [form.fullName, form.jobTitle, form.company].some(hasHebrew)
  const nameTitleDirection = rtlContent ? 'rtl' : 'ltr'
  const contactDirection = nameTitleDirection
  const textOffsetLeft = Math.max(layout.textOffsetX, 0)
  const textOffsetRight = Math.max(-layout.textOffsetX, 0)
  const nameTitleAlign = rtlContent ? 'right' : layout.nameTitleAlign
  const nameTitleAlignAttr =
    nameTitleAlign === 'left' ? 'left' : nameTitleAlign === 'center' ? 'center' : 'right'
  const contactAlign = form.contactMatchNameTitle !== false ? nameTitleAlign : layout.textAlign
  const contactAlignAttr =
    contactAlign === 'left' ? 'left' : contactAlign === 'center' ? 'center' : 'right'
  const edgeInset = 8
  const dividerInset = 12

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
  const bannerUrl = normalizeUrl(form.bannerUrl)
  const bannerLink = normalizeUrl(form.bannerLink)
  const stackedLayout = layout.logoSide === 'top' || layout.logoSide === 'bottom'
  const textOnlyLayout = layout.logoSide === 'none'
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
  const textColumnWidth = stackedLayout || textOnlyLayout
    ? Math.min(layout.textColumnWidth, signatureWidth - edgeInset * 2)
    : Math.min(layout.textColumnWidth, signatureWidth - 80)
  const logoColumnWidth =
    stackedLayout || textOnlyLayout
      ? 0
      : Math.max(60, signatureWidth - textColumnWidth - layout.dividerThickness)
  const fontFamilyCss = escapeHtml(sanitizeFontFamily(layout.fontFamily))
  const fontFamilyStyle = outlookFontFamilyStyle(layout.fontFamily)
  const bodyFontSizePx = `${layout.bodyFontSize}px`
  const compactLinkFontSizePx = `${Math.max(9, layout.bodyFontSize - 2)}px`
  const detailsLineHeight = Math.max(1, layout.lineSpacing - 0.15)
  const nameLineHeight = Math.max(1, layout.lineSpacing - 0.35)
  const titleLineHeight = Math.max(1, layout.lineSpacing - 0.3)

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

  type ParsedLinkImage = {
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

  const alignToAttr = (align: TextAlign): string =>
    align === 'left' ? 'left' : align === 'center' ? 'center' : 'right'

  const linkImagesWithUrl = form.linkImages.filter((row) => row.imageUrl.trim())
  const hasLinkFooterIcons = linkImagesWithUrl.some((row) => {
    const placement = row.placement ?? 'footer'
    return placement === 'footer' || placement === 'with-social'
  })
  const hasFooterIcons = socialLinks.length > 0 || hasLinkFooterIcons

  const buildContactRow = (
    labelHtml: string,
    valueHtml: string,
    valueStyle = 'unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:break-word;'
  ): string => {
    const contactBorderStyle = hasFooterIcons
      ? ''
      : `border-bottom:1px solid ${contactRowBorder};`
    return `<tr>
      <td dir="${contactDirection}" align="${contactAlignAttr}" style="padding:3px 0 6px;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};text-align:${contactAlign};${contactBorderStyle}">
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
        'white-space:nowrap;'
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

  const socialIconSize = Math.max(layout.bodyFontSize + 8, 22)
  const socialIconGapPx = Math.max(0, layout.socialIconGap)
  const socialIconPadTopPx = 4
  const socialIconPadBottomPx = 8
  const socialIconCellWidth = socialIconSize + 4
  const gapBelowDividerPx = 6
  const buildOutlookSpacerRow = (heightPx: number): string =>
    `<tr>
      <td align="${nameTitleAlignAttr}" height="${heightPx}" style="height:${heightPx}px;mso-height-rule:exactly;line-height:${heightPx}px;font-size:${heightPx}px;mso-line-height-rule:exactly;padding:0;border:0;">&nbsp;</td>
    </tr>`
  const orderedSocialLinks = rtlContent ? [...socialLinks].reverse() : socialLinks
  const socialIconsRowWidth =
    orderedSocialLinks.length * socialIconCellWidth +
    Math.max(0, orderedSocialLinks.length - 1) * socialIconGapPx
  const socialIconsTableAlign = nameTitleAlignAttr
  const socialFooterPadHorizontal = '0'

  const buildSocialIconGapCell = (): string =>
    socialIconGapPx <= 0
      ? ''
      : `<td width="${socialIconGapPx}" valign="middle" style="width:${socialIconGapPx}px;min-width:${socialIconGapPx}px;max-width:${socialIconGapPx}px;vertical-align:middle;mso-line-height-rule:exactly;padding:0;border:0;font-size:1px;line-height:1px;">&nbsp;</td>`

  const buildSocialIconCell = (item: (typeof socialLinks)[number]): string =>
    `<td width="${socialIconCellWidth}" valign="middle" align="center" style="width:${socialIconCellWidth}px;padding:${socialIconPadTopPx}px 2px ${socialIconPadBottomPx}px;vertical-align:middle;text-align:center;mso-line-height-rule:exactly;">
      <a href="${escapeHtml(item.url)}" title="${escapeHtml(item.label)}" style="display:block;text-decoration:none;">
        <img
          src="${escapeHtml(item.iconUrl)}"
          alt="${escapeHtml(item.label)}"
          width="${socialIconSize}"
          height="${socialIconSize}"
          border="0"
          style="display:block;width:${socialIconSize}px;height:${socialIconSize}px;max-height:none;border:0;margin:0;padding:0;-ms-interpolation-mode:bicubic;"
        />
      </a>
    </td>`

  const defaultLinkImageMaxHeight = Math.max(socialIconSize + 12, DEFAULT_LINK_IMAGE_MAX_HEIGHT)

  const parsedLinkImages: ParsedLinkImage[] = linkImagesWithUrl.map((row) => ({
    imageUrl: normalizeUrl(row.imageUrl),
    href: row.href.trim() ? normalizeUrl(row.href) : '',
    alt: row.alt.trim() || strings.linkedImageAlt,
    placement: row.placement ?? 'footer',
    align: row.align ?? nameTitleAlign,
    maxWidth: row.maxWidth > 0 ? row.maxWidth : DEFAULT_LINK_IMAGE_MAX_WIDTH,
    maxHeight: row.maxHeight > 0 ? row.maxHeight : defaultLinkImageMaxHeight,
    offsetX: row.offsetX ?? 0,
    offsetY: row.offsetY ?? 0
  }))

  const footerLinkImages = parsedLinkImages.filter((item) => item.placement === 'footer')
  const socialRowLinkImages = parsedLinkImages.filter((item) => item.placement === 'with-social')
  const topLinkImages = parsedLinkImages.filter((item) => item.placement === 'top')
  const bottomLinkImages = parsedLinkImages.filter((item) => item.placement === 'bottom')
  const orderedSocialRowLinkImages = rtlContent
    ? [...socialRowLinkImages].reverse()
    : socialRowLinkImages
  const orderedFooterLinkImages = rtlContent ? [...footerLinkImages].reverse() : footerLinkImages

  const buildCustomLinkImageCell = (item: ParsedLinkImage): string => {
    const img = `<img
          src="${escapeHtml(item.imageUrl)}"
          alt="${escapeHtml(item.alt)}"
          border="0"
          style="display:block;border:0;max-height:${item.maxHeight}px;max-width:${item.maxWidth}px;width:auto;height:auto;margin:${item.offsetY}px 0 0 ${item.offsetX}px;padding:0;-ms-interpolation-mode:bicubic;"
        />`
    const graphic = item.href
      ? `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.alt)}" style="display:block;text-decoration:none;line-height:0;font-size:0;">${img}</a>`
      : img
    return `<td valign="middle" align="center" style="padding:${socialIconPadTopPx}px 2px ${socialIconPadBottomPx}px;vertical-align:middle;text-align:center;mso-line-height-rule:exactly;">
      ${graphic}
    </td>`
  }

  const buildCustomLinkImageRowCells = (images: ParsedLinkImage[]): string => {
    const ordered = rtlContent ? [...images].reverse() : images
    return ordered
      .map((item, index) => `${index > 0 ? buildSocialIconGapCell() : ''}${buildCustomLinkImageCell(item)}`)
      .join('')
  }

  const socialRowCells = [
    ...orderedSocialLinks.map(
      (item, index) => `${index > 0 ? buildSocialIconGapCell() : ''}${buildSocialIconCell(item)}`
    ),
    ...orderedSocialRowLinkImages.map((item, index) => {
      const needsGap = orderedSocialLinks.length > 0 || index > 0
      return `${needsGap ? buildSocialIconGapCell() : ''}${buildCustomLinkImageCell(item)}`
    })
  ].join('')

  const footerLinkImageRowCells = buildCustomLinkImageRowCells(footerLinkImages)

  const buildSocialFooterRows = (): string => {
    if (!hasFooterIcons) return ''

    const showSocialRow = socialLinks.length > 0 || socialRowLinkImages.length > 0

    const dividerRow = contactRows.length
      ? `<tr>
      <td align="${nameTitleAlignAttr}" style="padding:6px 0 0;font-size:1px;line-height:1px;mso-line-height-rule:exactly;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
          <tr>
            <td style="height:1px;line-height:1px;font-size:1px;border-top:1px solid ${contactRowBorder};mso-line-height-rule:exactly;padding:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
    </tr>
    ${buildOutlookSpacerRow(gapBelowDividerPx)}`
      : buildOutlookSpacerRow(8)

    return `<tr>
      <td align="${nameTitleAlignAttr}" valign="top" style="padding:0 ${socialFooterPadHorizontal} 12px;vertical-align:top;text-align:${nameTitleAlign};overflow:visible;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${nameTitleAlignAttr}" dir="${nameTitleDirection}" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
          ${dividerRow}
          ${
            showSocialRow
              ? `<tr>
            <td align="${nameTitleAlignAttr}" valign="middle" style="padding:0;text-align:${nameTitleAlign};vertical-align:middle;overflow:visible;mso-line-height-rule:exactly;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${socialIconsTableAlign}"${
                socialLinks.length && !socialRowLinkImages.length
                  ? ` width="${socialIconsRowWidth}" style="width:${socialIconsRowWidth}px;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"`
                  : ' style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;"'
              }>
                <tr valign="middle" style="vertical-align:middle;mso-line-height-rule:exactly;">
                  ${socialRowCells}
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }
          ${
            footerLinkImages.length
              ? `<tr>
            <td align="${alignToAttr(orderedFooterLinkImages[0]?.align ?? nameTitleAlign)}" valign="middle" style="padding:${showSocialRow ? '6px' : '0'} 0 0;text-align:${orderedFooterLinkImages[0]?.align ?? nameTitleAlign};vertical-align:middle;overflow:visible;mso-line-height-rule:exactly;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${alignToAttr(orderedFooterLinkImages[0]?.align ?? nameTitleAlign)}" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
                <tr valign="middle" style="vertical-align:middle;mso-line-height-rule:exactly;">
                  ${footerLinkImageRowCells}
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }
        </table>
      </td>
    </tr>`
  }

  const logoOnLeft = layout.logoSide === 'left'
  const textPaddingLeft = stackedLayout
    ? edgeInset + textOffsetLeft
    : textOffsetLeft + (logoOnLeft ? dividerInset : edgeInset)
  const textPaddingRight = stackedLayout
    ? edgeInset + textOffsetRight
    : textOffsetRight + (logoOnLeft ? edgeInset : dividerInset)
  const logoPaddingLeft = logoOnLeft ? edgeInset : dividerInset
  const logoPaddingRight = logoOnLeft ? dividerInset : edgeInset
  const logoHorizontalShift = layout.logoOffsetX

  const dividerOnTextSide =
    stackedLayout || textOnlyLayout
      ? ''
      : layout.dividerThickness > 0
        ? logoOnLeft
          ? `border-left:${layout.dividerThickness}px solid ${dividerColor};`
          : `border-right:${layout.dividerThickness}px solid ${dividerColor};`
        : ''

  const textColumnVerticalAlign = hasFooterIcons ? 'top' : layout.verticalAlign
  const textCellOutlookHeight = hasFooterIcons ? 'height:auto;mso-height-rule:at-least;' : ''
  const textInnerTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${nameTitleAlignAttr}" dir="${nameTitleDirection}" style="${fontFamilyStyle}text-align:${nameTitleAlign};border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        ${
          options.textImages?.name
            ? buildTextImageRow(
                options.textImages.name,
                nameTitleDirection,
                nameTitleAlignAttr,
                nameTitleAlign,
                '0 0 1px'
              )
            : `<tr><td dir="${nameTitleDirection}" align="${nameTitleAlignAttr}" style="${fontFamilyStyle}font-size:${layout.nameFontSize}px;line-height:${nameLineHeight};font-weight:${nameFontWeight};color:${nameColor};padding:0 0 1px;text-align:${nameTitleAlign};unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:break-word;">${fullName || strings.fullNamePlaceholder}</td></tr>`
        }
        ${
          options.textImages?.titleBlock
            ? buildTextImageRow(
                options.textImages.titleBlock,
                nameTitleDirection,
                nameTitleAlignAttr,
                nameTitleAlign,
                '0 0 3px'
              )
            : `<tr><td dir="${nameTitleDirection}" align="${nameTitleAlignAttr}" style="${fontFamilyStyle}font-size:${layout.titleFontSize}px;line-height:${titleLineHeight};font-weight:${titleFontWeight};color:${jobTitleColor};padding:0 0 3px;text-align:${nameTitleAlign};unicode-bidi:plaintext;overflow-wrap:anywhere;word-break:break-word;">${jobTitle || strings.jobTitlePlaceholder}${company ? `<br style="line-height:${titleLineHeight};" /><span style="${fontFamilyStyle}font-weight:${titleFontWeight};line-height:${titleLineHeight};color:${companyColor};overflow-wrap:anywhere;word-break:break-word;">${company}</span>` : ''}</td></tr>`
        }
        ${contactRows.length ? `<tr><td dir="${contactDirection}" align="${contactAlignAttr}" style="padding-top:2px;padding-bottom:0;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contactAlignAttr}" dir="${contactDirection}" style="text-align:${contactAlign};border-collapse:collapse;">${contactRows.join('')}</table></td></tr>` : ''}
        ${buildSocialFooterRows()}
      </table>`
  const textCell = `<td valign="${textColumnVerticalAlign}" style="${dividerOnTextSide}vertical-align:${textColumnVerticalAlign};${textCellOutlookHeight}padding-left:${textPaddingLeft}px;padding-right:${textPaddingRight}px;padding-top:${Math.max(
    0,
    layout.textOffsetY
  ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.textOffsetY) + edgeInset}px;width:${textColumnWidth}px;max-width:100%;text-align:${nameTitleAlign};unicode-bidi:plaintext;overflow:visible;">
      ${textInnerTable}
    </td>`

  const logoAlignAttr =
    layout.logoAlign === 'left' ? 'left' : layout.logoAlign === 'center' ? 'center' : 'right'

  const buildSizedImageTag = (
    src: string,
    alt: string,
    displaySize: ImageDisplaySize | undefined,
    fallbackMaxWidth: number
  ): string => {
    const width = displaySize?.width ?? fallbackMaxWidth
    const height = displaySize?.height
    const heightAttr = height ? ` height="${height}"` : ''
    const heightStyle = height ? `height:${height}px;` : ''
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" width="${width}"${heightAttr} style="display:block;border:0;width:${width}px;${heightStyle}max-width:${width}px;" />`
  }

  const buildLogoGraphic = (maxWidth: number, displaySize?: ImageDisplaySize): string =>
    logoUrl
      ? `<span style="display:inline-block;line-height:0;font-size:0;margin-left:${logoHorizontalShift}px;vertical-align:top;">
          ${buildSizedImageTag(logoUrl, strings.companyLogoAlt, displaySize, maxWidth)}
        </span>`
      : `<div style="display:inline-block;font-size:14px;color:${accentColor};font-weight:700;margin-left:${logoHorizontalShift}px;">${strings.companyLogoPlaceholder}</div>`

  const buildBannerGraphic = (): string => {
    if (!bannerUrl) return ''
    const bannerMaxWidth = Math.min(layout.bannerMaxWidth, signatureWidth)
    const img = buildSizedImageTag(
      bannerUrl,
      strings.bannerAlt,
      options.bannerDisplaySize,
      bannerMaxWidth
    )
    return bannerLink
      ? `<a href="${escapeHtml(bannerLink)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">${img}</a>`
      : img
  }

  const buildBannerRow = (colspan: number, position: 'top' | 'bottom' = 'bottom'): string => {
    const graphic = buildBannerGraphic()
    if (!graphic) return ''
    const colspanAttr = colspan > 1 ? ` colspan="${colspan}"` : ''
    const padding =
      position === 'top'
        ? `${edgeInset}px ${edgeInset}px 6px`
        : `10px ${edgeInset}px ${edgeInset}px`
    return `<tr>
    <td${colspanAttr} align="${layout.emailAlign}" style="padding:${padding};text-align:${layout.emailAlign};font-size:0;line-height:0;max-width:100%;">
      ${graphic}
    </td>
  </tr>`
  }

  const buildLinkImagesBandRow = (
    images: ParsedLinkImage[],
    colspan: number,
    edge: 'top' | 'bottom'
  ): string => {
    if (!images.length) return ''
    const colspanAttr = colspan > 1 ? ` colspan="${colspan}"` : ''
    const padding =
      edge === 'top' ? `${edgeInset}px ${edgeInset}px 6px` : `6px ${edgeInset}px ${edgeInset}px`
    const rowAlign = alignToAttr(images[0]?.align ?? layout.emailAlign)
    return `<tr>
    <td${colspanAttr} align="${rowAlign}" style="padding:${padding};text-align:${rowAlign};font-size:0;line-height:0;max-width:100%;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${rowAlign}" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
        <tr valign="middle" style="vertical-align:middle;mso-line-height-rule:exactly;">
          ${buildCustomLinkImageRowCells(images)}
        </tr>
      </table>
    </td>
  </tr>`
  }

  const logoGraphic = buildLogoGraphic(layout.logoMaxWidth, options.logoDisplaySize)

  const logoVerticalAlign = hasFooterIcons ? 'top' : layout.verticalAlign
  const logoCell = `<td valign="${logoVerticalAlign}" style="vertical-align:${logoVerticalAlign};padding-left:${logoPaddingLeft}px;padding-right:${logoPaddingRight}px;padding-top:${Math.max(
    0,
    layout.logoOffsetY
  ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.logoOffsetY) + edgeInset}px;width:${logoColumnWidth}px;max-width:${logoColumnWidth}px;text-align:${layout.logoAlign};font-size:0;line-height:0;">
      ${logoGraphic}
    </td>`

  const rowCells = textOnlyLayout
    ? [textCell]
    : logoOnLeft
      ? [logoCell, textCell]
      : [textCell, logoCell]
  const mainRowStyle = hasFooterIcons
    ? 'height:auto;mso-height-rule:at-least;'
    : ''

  const tableStyle = `direction:ltr;font-family:${fontFamilyCss};color:${textColor};background:${backgroundColor};width:${signatureWidth}px;max-width:100%;border-collapse:collapse;mso-line-height-rule:exactly;mso-table-lspace:0pt;mso-table-rspace:0pt;`

  const buildStackedTextRow = (): string => `<tr style="${mainRowStyle}">
    <td valign="${textColumnVerticalAlign}" style="vertical-align:${textColumnVerticalAlign};${textCellOutlookHeight}padding-left:${textPaddingLeft}px;padding-right:${textPaddingRight}px;padding-top:${Math.max(
      0,
      layout.textOffsetY
    ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.textOffsetY) + edgeInset}px;width:${textColumnWidth}px;max-width:100%;text-align:${nameTitleAlign};unicode-bidi:plaintext;overflow:visible;">
      ${textInnerTable}
    </td>
  </tr>`

  const buildStackedLogoRow = (position: 'top' | 'bottom'): string => {
    const topPadding =
      position === 'top'
        ? `${Math.max(0, layout.logoOffsetY) + edgeInset}px ${edgeInset}px 6px`
        : `6px ${edgeInset}px ${Math.max(0, -layout.logoOffsetY) + edgeInset}px`
    return `<tr>
    <td align="${logoAlignAttr}" style="padding:${topPadding};text-align:${layout.logoAlign};font-size:0;line-height:0;max-width:100%;">
      ${buildLogoGraphic(
        Math.min(layout.logoMaxWidth, signatureWidth - edgeInset * 2),
        options.logoDisplaySize
      )}
    </td>
  </tr>`
  }

  const sideBannerColspan = textOnlyLayout ? 1 : 2

  const signatureTable =
    layout.logoSide === 'top'
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" width="${signatureWidth}" style="${tableStyle}">
  ${buildLinkImagesBandRow(topLinkImages, 1, 'top')}
  ${buildStackedLogoRow('top')}
  ${buildStackedTextRow()}
  ${buildBannerRow(1, 'bottom')}
  ${buildLinkImagesBandRow(bottomLinkImages, 1, 'bottom')}
</table>`
      : layout.logoSide === 'bottom'
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" width="${signatureWidth}" style="${tableStyle}">
  ${buildLinkImagesBandRow(topLinkImages, 1, 'top')}
  ${buildBannerRow(1, 'top')}
  ${buildStackedTextRow()}
  ${buildStackedLogoRow('bottom')}
  ${buildLinkImagesBandRow(bottomLinkImages, 1, 'bottom')}
</table>`
        : `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" width="${signatureWidth}" style="${tableStyle}">
  ${buildLinkImagesBandRow(topLinkImages, sideBannerColspan, 'top')}
  <tr style="${mainRowStyle}">
    ${rowCells.join('\n    ')}
  </tr>
  ${buildBannerRow(sideBannerColspan, 'bottom')}
  ${buildLinkImagesBandRow(bottomLinkImages, sideBannerColspan, 'bottom')}
</table>`

  return `<!-- Outlook email signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" dir="ltr" style="direction:ltr;width:100%;max-width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="${layout.emailAlign}" style="text-align:${layout.emailAlign};max-width:100%;">
      ${signatureTable}
    </td>
  </tr>
</table>`
}

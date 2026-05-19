import { DEFAULT_LOGO_DATA_URL } from './defaultLogoDataUrl'
import { siFacebook, siInstagram, siX, siYoutube } from 'simple-icons'

type LinkImage = {
  imageUrl: string
  href: string
  alt: string
}

type SignatureLayoutSettings = {
  fontFamily: string
  nameFontSize: number
  titleFontSize: number
  bodyFontSize: number
  lineSpacing: number
  signatureWidth: number
  signatureHeight: number
  textColumnWidth: number
  logoMaxWidth: number
  textAlign: 'left' | 'center' | 'right'
  nameTitleAlign: 'left' | 'center' | 'right'
  logoAlign: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
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

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`Missing element: ${id}`)
  }
  return element as T
}

const inputs = {
  fullName: byId<HTMLInputElement>('fullName'),
  jobTitle: byId<HTMLInputElement>('jobTitle'),
  company: byId<HTMLInputElement>('company'),
  phone: byId<HTMLInputElement>('phone'),
  email: byId<HTMLInputElement>('email'),
  website: byId<HTMLInputElement>('website'),
  facebookUrl: byId<HTMLInputElement>('facebookUrl'),
  facebookIconUrl: byId<HTMLInputElement>('facebookIconUrl'),
  facebookIconFile: byId<HTMLInputElement>('facebookIconFile'),
  instagramUrl: byId<HTMLInputElement>('instagramUrl'),
  instagramIconUrl: byId<HTMLInputElement>('instagramIconUrl'),
  instagramIconFile: byId<HTMLInputElement>('instagramIconFile'),
  linkedinUrl: byId<HTMLInputElement>('linkedinUrl'),
  linkedinIconUrl: byId<HTMLInputElement>('linkedinIconUrl'),
  linkedinIconFile: byId<HTMLInputElement>('linkedinIconFile'),
  xUrl: byId<HTMLInputElement>('xUrl'),
  xIconUrl: byId<HTMLInputElement>('xIconUrl'),
  xIconFile: byId<HTMLInputElement>('xIconFile'),
  youtubeUrl: byId<HTMLInputElement>('youtubeUrl'),
  youtubeIconUrl: byId<HTMLInputElement>('youtubeIconUrl'),
  youtubeIconFile: byId<HTMLInputElement>('youtubeIconFile'),
  logoUrl: byId<HTMLInputElement>('logoUrl'),
  logoFile: byId<HTMLInputElement>('logoFile'),
  bannerUrl: byId<HTMLInputElement>('bannerUrl'),
  bannerFile: byId<HTMLInputElement>('bannerFile'),
  bannerLink: byId<HTMLInputElement>('bannerLink'),
  fontFamily: byId<HTMLSelectElement>('fontFamily'),
  nameFontSize: byId<HTMLInputElement>('nameFontSize'),
  titleFontSize: byId<HTMLInputElement>('titleFontSize'),
  bodyFontSize: byId<HTMLInputElement>('bodyFontSize'),
  lineSpacing: byId<HTMLInputElement>('lineSpacing'),
  signatureWidth: byId<HTMLInputElement>('signatureWidth'),
  signatureHeight: byId<HTMLInputElement>('signatureHeight'),
  textColumnWidth: byId<HTMLInputElement>('textColumnWidth'),
  logoMaxWidth: byId<HTMLInputElement>('logoMaxWidth'),
  textAlign: byId<HTMLSelectElement>('textAlign'),
  nameTitleAlign: byId<HTMLSelectElement>('nameTitleAlign'),
  logoAlign: byId<HTMLSelectElement>('logoAlign'),
  verticalAlign: byId<HTMLSelectElement>('verticalAlign'),
  textOffsetX: byId<HTMLInputElement>('textOffsetX'),
  textOffsetY: byId<HTMLInputElement>('textOffsetY'),
  logoOffsetX: byId<HTMLInputElement>('logoOffsetX'),
  logoOffsetY: byId<HTMLInputElement>('logoOffsetY'),
  dividerThickness: byId<HTMLInputElement>('dividerThickness'),
  socialIconGap: byId<HTMLInputElement>('socialIconGap'),
  accentColor: byId<HTMLInputElement>('accentColor'),
  textColor: byId<HTMLInputElement>('textColor'),
  secondaryTextColor: byId<HTMLInputElement>('secondaryTextColor'),
  dividerColor: byId<HTMLInputElement>('dividerColor'),
  linkColor: byId<HTMLInputElement>('linkColor'),
  backgroundColor: byId<HTMLInputElement>('backgroundColor')
}

const linkImagesContainer = byId<HTMLDivElement>('linkImages')
const addLinkImageButton = byId<HTMLButtonElement>('addLinkImage')
const generateButton = byId<HTMLButtonElement>('generate')
const copyButton = byId<HTMLButtonElement>('copy')
const downloadButton = byId<HTMLButtonElement>('download')
const installOutlookButton = byId<HTMLButtonElement>('installOutlook')
const installNewOutlookButton = byId<HTMLButtonElement>('installNewOutlook')
const previewElement = byId<HTMLDivElement>('preview')
const outputElement = byId<HTMLTextAreaElement>('output')
const newOutlookStatusElement = byId<HTMLParagraphElement>('newOutlookStatus')

const NEW_OUTLOOK_SIGNATURE_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/layout/EmailSignature'

type SocialPlatform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'YouTube'

const socialIconDataUrls: Record<SocialPlatform, string> = {
  Facebook: '',
  Instagram: '',
  LinkedIn: '',
  X: '',
  YouTube: ''
}

let socialIconsInitializationPromise: Promise<void> | null = null
let livePreviewTimer: number | null = null

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const hasHebrew = (value: string): boolean => /[\u0590-\u05FF]/.test(value)

const sanitizeFontFamily = (value: string): string => {
  const cleaned = value.replace(/[;{}<>]/g, '').trim()
  return cleaned || 'Arial, Helvetica, sans-serif'
}

const parseNumberInput = (
  value: string,
  fallback: number,
  min: number,
  max: number,
  decimals = 0
): number => {
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) return fallback
  const clamped = Math.min(max, Math.max(min, parsed))
  if (decimals <= 0) return Math.round(clamped)
  return Number(clamped.toFixed(decimals))
}

const parseEnumInput = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

const parseColorInput = (value: string, fallback: string): string =>
  /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback

const normalizeUrl = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^data:image\//i.test(trimmed)) return trimmed
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Cannot read file'))
    reader.readAsDataURL(file)
  })

const bindFileInputToUrl = (fileInput: HTMLInputElement, urlInput: HTMLInputElement): void => {
  fileInput.addEventListener('change', () => {
    const [file] = Array.from(fileInput.files ?? [])
    if (!file) return
    fileToDataUrl(file)
      .then((dataUrl) => {
        if (dataUrl) {
          urlInput.value = dataUrl
          urlInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
      })
      .catch(() => {
        // Keep current value if file conversion fails.
      })
  })
}

const scheduleLivePreviewUpdate = (delayMs = 120): void => {
  if (livePreviewTimer !== null) {
    window.clearTimeout(livePreviewTimer)
  }
  livePreviewTimer = window.setTimeout(() => {
    livePreviewTimer = null
    generate().catch(() => {
      // Keep form responsive even if preview generation fails.
    })
  }, delayMs)
}

const buildSocialIconSvg = (icon: { path: string }, fillColor: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <path d="${icon.path}" fill="${fillColor}" />
  </svg>`

const linkedInSocialIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  <rect x="0" y="0" width="24" height="24" rx="4" fill="#0A66C2" />
  <g transform="translate(0.3 0.2) scale(0.92)">
    <path fill="#ffffff" d="M7.05 9.35H4.79V19h2.26V9.35zM5.92 8.22a1.31 1.31 0 1 0 0-2.62 1.31 1.31 0 0 0 0 2.62zM19.2 13.2V19h-2.24v-5.32c0-1.34-.48-2.25-1.67-2.25-.91 0-1.45.61-1.69 1.2-.09.21-.11.5-.11.79V19h-2.25s.03-9.1 0-10.05h2.25v1.42c.3-.47.84-1.15 2.05-1.15 1.5 0 2.62.98 2.62 3.98z"/>
  </g>
</svg>`

const svgToPngDataUrl = (svg: string, size = 22): Promise<string> =>
  new Promise((resolve, reject) => {
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('Canvas not available'))
        return
      }
      context.drawImage(image, 0, 0, size, size)
      URL.revokeObjectURL(svgUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('Cannot render social icon'))
    }
    image.src = svgUrl
  })

const initializeSocialIconDataUrls = async (): Promise<void> => {
  if (socialIconsInitializationPromise) {
    return socialIconsInitializationPromise
  }
  socialIconsInitializationPromise = Promise.all([
    svgToPngDataUrl(buildSocialIconSvg(siFacebook, '#1877F2')).then((dataUrl) => {
      socialIconDataUrls.Facebook = dataUrl
    }),
    svgToPngDataUrl(buildSocialIconSvg(siInstagram, '#E4405F')).then((dataUrl) => {
      socialIconDataUrls.Instagram = dataUrl
    }),
    svgToPngDataUrl(linkedInSocialIconSvg).then((dataUrl) => {
      socialIconDataUrls.LinkedIn = dataUrl
    }),
    svgToPngDataUrl(buildSocialIconSvg(siX, '#111111')).then((dataUrl) => {
      socialIconDataUrls.X = dataUrl
    }),
    svgToPngDataUrl(buildSocialIconSvg(siYoutube, '#FF0000')).then((dataUrl) => {
      socialIconDataUrls.YouTube = dataUrl
    })
  ]).then(() => undefined)

  return socialIconsInitializationPromise
}

const resolveSocialIconUrl = (platform: SocialPlatform, customIconUrl: string): string => {
  const custom = customIconUrl.trim()
  if (custom) {
    return normalizeUrl(custom)
  }
  return socialIconDataUrls[platform]
}

const addLinkImageRow = (seed?: Partial<LinkImage>): void => {
  const row = document.createElement('div')
  row.className = 'link-image-row'
  row.innerHTML = `
    <label>Image URL <input class="link-image-url" placeholder="https://..." value="${escapeHtml(seed?.imageUrl ?? '')}" /></label>
    <label>Link URL <input class="link-image-href" placeholder="https://..." value="${escapeHtml(seed?.href ?? '')}" /></label>
    <label>Alt text <input class="link-image-alt" placeholder="Linked image" value="${escapeHtml(seed?.alt ?? '')}" /></label>
    <label>Image file <input class="link-image-file" type="file" accept="image/*" /></label>
    <button type="button" class="secondary remove-link-image">Remove</button>
  `
  linkImagesContainer.appendChild(row)

  const removeButton = row.querySelector('.remove-link-image')
  removeButton?.addEventListener('click', () => {
    row.remove()
    scheduleLivePreviewUpdate()
  })

  const fileInput = row.querySelector('.link-image-file') as HTMLInputElement | null
  const imageUrlInput = row.querySelector('.link-image-url') as HTMLInputElement | null
  if (fileInput && imageUrlInput) {
    bindFileInputToUrl(fileInput, imageUrlInput)
  }
}

const getLinkImages = (): LinkImage[] => {
  const rows = Array.from(linkImagesContainer.querySelectorAll('.link-image-row'))
  return rows
    .map((row): LinkImage => {
      const imageUrl = (row.querySelector('.link-image-url') as HTMLInputElement).value.trim()
      const href = (row.querySelector('.link-image-href') as HTMLInputElement).value.trim()
      const alt = (row.querySelector('.link-image-alt') as HTMLInputElement).value.trim() || 'Linked image'
      return { imageUrl, href, alt }
    })
    .filter((item) => item.imageUrl && item.href)
}

const getLayoutSettings = (): SignatureLayoutSettings => ({
  fontFamily: sanitizeFontFamily(inputs.fontFamily.value),
  nameFontSize: parseNumberInput(inputs.nameFontSize.value, 28, 14, 72),
  titleFontSize: parseNumberInput(inputs.titleFontSize.value, 19, 10, 48),
  bodyFontSize: parseNumberInput(inputs.bodyFontSize.value, 12, 9, 24),
  lineSpacing: parseNumberInput(inputs.lineSpacing.value, 1.25, 1, 2, 2),
  signatureWidth: parseNumberInput(inputs.signatureWidth.value, 400, 250, 900),
  signatureHeight: parseNumberInput(inputs.signatureHeight.value, 200, 120, 500),
  textColumnWidth: parseNumberInput(inputs.textColumnWidth.value, 252, 120, 760),
  logoMaxWidth: parseNumberInput(inputs.logoMaxWidth.value, 122, 60, 400),
  textAlign: parseEnumInput(inputs.textAlign.value, ['left', 'center', 'right'] as const, 'right'),
  nameTitleAlign: parseEnumInput(
    inputs.nameTitleAlign.value,
    ['left', 'center', 'right'] as const,
    'right'
  ),
  logoAlign: parseEnumInput(inputs.logoAlign.value, ['left', 'center', 'right'] as const, 'left'),
  verticalAlign: parseEnumInput(inputs.verticalAlign.value, ['top', 'middle', 'bottom'] as const, 'top'),
  textOffsetX: parseNumberInput(inputs.textOffsetX.value, 0, -120, 120),
  textOffsetY: parseNumberInput(inputs.textOffsetY.value, 0, -120, 120),
  logoOffsetX: parseNumberInput(inputs.logoOffsetX.value, 10, -120, 120),
  logoOffsetY: parseNumberInput(inputs.logoOffsetY.value, 6, -120, 120),
  dividerThickness: parseNumberInput(inputs.dividerThickness.value, 2, 0, 10),
  socialIconGap: parseNumberInput(inputs.socialIconGap.value, 5, 0, 20),
  accentColor: parseColorInput(inputs.accentColor.value, '#92278f'),
  textColor: parseColorInput(inputs.textColor.value, '#111827'),
  secondaryTextColor: parseColorInput(inputs.secondaryTextColor.value, '#666666'),
  dividerColor: parseColorInput(inputs.dividerColor.value, '#bcbec0'),
  linkColor: parseColorInput(inputs.linkColor.value, '#5a5a5a'),
  backgroundColor: parseColorInput(inputs.backgroundColor.value, '#ffffff')
})

const buildSignatureHtml = (layout: SignatureLayoutSettings): string => {
  const fullName = escapeHtml(inputs.fullName.value.trim())
  const jobTitle = escapeHtml(inputs.jobTitle.value.trim())
  const company = escapeHtml(inputs.company.value.trim())
  const phone = escapeHtml(inputs.phone.value.trim())
  const email = escapeHtml(inputs.email.value.trim())
  const website = normalizeUrl(inputs.website.value)
  const facebookUrl = normalizeUrl(inputs.facebookUrl.value)
  const instagramUrl = normalizeUrl(inputs.instagramUrl.value)
  const linkedinUrl = normalizeUrl(inputs.linkedinUrl.value)
  const xUrl = normalizeUrl(inputs.xUrl.value)
  const youtubeUrl = normalizeUrl(inputs.youtubeUrl.value)
  const logoUrl = normalizeUrl(inputs.logoUrl.value)
  const accentColor = layout.accentColor
  const textColor = layout.textColor
  const secondaryTextColor = layout.secondaryTextColor
  const dividerColor = layout.dividerColor
  const linkColor = layout.linkColor
  const backgroundColor = layout.backgroundColor
  const signatureWidth = layout.signatureWidth
  const signatureHeight = layout.signatureHeight
  const textColumnWidth = Math.min(layout.textColumnWidth, signatureWidth - 80)
  const logoColumnWidth = Math.max(60, signatureWidth - textColumnWidth - layout.dividerThickness)
  const fontFamilyCss = escapeHtml(layout.fontFamily)
  const bodyFontSizePx = `${layout.bodyFontSize}px`
  const detailsLineHeight = layout.lineSpacing
  const rtlContent = [fullName, jobTitle, company].some(hasHebrew)
  const nameTitleDirection = rtlContent ? 'rtl' : 'ltr'
  const textOffsetLeft = Math.max(layout.textOffsetX, 0)
  const textOffsetRight = Math.max(-layout.textOffsetX, 0)
  const logoOffsetLeft = Math.max(layout.logoOffsetX, 0)
  const logoOffsetRight = Math.max(-layout.logoOffsetX, 0)

  const contactRows: string[] = []
  if (phone.trim()) {
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">נייד:&nbsp;</td>
        <td style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(normalizeUrl(`tel:${inputs.phone.value.trim()}`))}" style="text-decoration:none;color:${accentColor};">${phone}</a>
        </td>
      </tr>`
    )
  }
  if (email.trim()) {
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">דוא"ל:&nbsp;</td>
        <td style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(normalizeUrl(`mailto:${inputs.email.value.trim()}`))}" style="text-decoration:underline;color:${accentColor};">${email}</a>
        </td>
      </tr>`
    )
  }
  if (website) {
    const websiteLabel = escapeHtml(website.replace(/^https?:\/\//i, ''))
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">אתר:&nbsp;</td>
        <td style="padding:2px 0;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};color:${secondaryTextColor};unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(website)}" style="text-decoration:underline;color:${linkColor};">${websiteLabel}</a>
        </td>
      </tr>`
    )
  }

  const socialLinks = [
    {
      label: 'Facebook',
      url: facebookUrl,
      iconUrl: resolveSocialIconUrl('Facebook', inputs.facebookIconUrl.value)
    },
    {
      label: 'Instagram',
      url: instagramUrl,
      iconUrl: resolveSocialIconUrl('Instagram', inputs.instagramIconUrl.value)
    },
    {
      label: 'LinkedIn',
      url: linkedinUrl,
      iconUrl: resolveSocialIconUrl('LinkedIn', inputs.linkedinIconUrl.value)
    },
    {
      label: 'X',
      url: xUrl,
      iconUrl: resolveSocialIconUrl('X', inputs.xIconUrl.value)
    },
    {
      label: 'YouTube',
      url: youtubeUrl,
      iconUrl: resolveSocialIconUrl('YouTube', inputs.youtubeIconUrl.value)
    }
  ].filter((item) => item.url && item.iconUrl)

  const socialTextRow = socialLinks.length
    ? `<tr><td style="padding-top:5px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${socialLinks
            .map(
              (item) => `<td style="padding-right:${layout.socialIconGap}px;vertical-align:middle;">
              <a href="${escapeHtml(item.url)}" title="${escapeHtml(
                item.label
              )}" style="text-decoration:none;display:inline-block;">
                <img
                  src="${escapeHtml(item.iconUrl)}"
                  alt="${escapeHtml(item.label)}"
                  width="16"
                  height="16"
                  style="display:block;width:16px;height:16px;border:0;"
                />
              </a>
            </td>`
            )
            .join('')}
        </tr>
      </table>
    </td></tr>`
    : ''

  return `<!-- Outlook email signature -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" style="font-family:${fontFamilyCss};color:${textColor};background:${backgroundColor};width:${signatureWidth}px;max-width:${signatureWidth}px;height:${signatureHeight}px;overflow:hidden;">
  <tr>
    <td style="vertical-align:${layout.verticalAlign};padding-left:${textOffsetLeft}px;padding-right:${textOffsetRight}px;padding-top:${Math.max(
      0,
      layout.textOffsetY
    )}px;padding-bottom:${Math.max(0, -layout.textOffsetY)}px;width:${textColumnWidth}px;max-width:${textColumnWidth}px;text-align:${layout.textAlign};unicode-bidi:plaintext;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td dir="${nameTitleDirection}" style="font-size:${layout.nameFontSize}px;line-height:${Math.max(1, layout.lineSpacing - 0.2)};font-weight:700;color:${accentColor};padding-bottom:2px;text-align:${layout.nameTitleAlign};unicode-bidi:plaintext;">${fullName || 'שם מלא'}</td></tr>
        <tr><td dir="${nameTitleDirection}" style="font-size:${layout.titleFontSize}px;line-height:${Math.max(1, layout.lineSpacing - 0.15)};font-weight:700;color:${secondaryTextColor};padding-bottom:8px;text-align:${layout.nameTitleAlign};unicode-bidi:plaintext;">${jobTitle || 'תפקיד'}${company ? ` | ${company}` : ''}</td></tr>
        ${contactRows.length ? `<tr><td dir="rtl" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="rtl" align="${layout.nameTitleAlign === 'left' ? 'left' : layout.nameTitleAlign === 'center' ? 'center' : 'right'}" style="text-align:${layout.nameTitleAlign};">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialTextRow.replace(/width="16"/g, `width="${layout.bodyFontSize + 4}"`).replace(/height="16"/g, `height="${layout.bodyFontSize + 4}"`).replace(/width:16px/g, `width:${layout.bodyFontSize + 4}px`).replace(/height:16px/g, `height:${layout.bodyFontSize + 4}px`)}
      </table>
    </td>
    <td style="width:${layout.dividerThickness}px;background:${dividerColor};font-size:0;line-height:0;">&nbsp;</td>
    <td style="vertical-align:${layout.verticalAlign};padding-left:${logoOffsetLeft}px;padding-right:${logoOffsetRight}px;padding-top:${Math.max(
      0,
      layout.logoOffsetY
    )}px;padding-bottom:${Math.max(0, -layout.logoOffsetY)}px;width:${logoColumnWidth}px;max-width:${logoColumnWidth}px;text-align:${layout.logoAlign};">
      ${
        logoUrl
          ? `<img src="${escapeHtml(logoUrl)}" alt="Company logo" width="${layout.logoMaxWidth}" style="display:block;border:0;max-width:${layout.logoMaxWidth}px;height:auto;margin-left:${layout.logoAlign === 'left' ? '0' : 'auto'};margin-right:${layout.logoAlign === 'right' ? '0' : 'auto'};" />`
          : `<div style="font-size:14px;color:${accentColor};font-weight:700;">לוגו חברה</div>`
      }
    </td>
  </tr>
</table>`
}

const generate = async (): Promise<void> => {
  await initializeSocialIconDataUrls()
  const layout = getLayoutSettings()
  const html = buildSignatureHtml(layout)
  outputElement.value = html
  previewElement.style.width = `${layout.signatureWidth}px`
  previewElement.style.height = `${layout.signatureHeight}px`
  previewElement.innerHTML = html
}

const enableLivePreview = (): void => {
  Object.values(inputs).forEach((input) => {
    input.addEventListener('input', () => scheduleLivePreviewUpdate())
    input.addEventListener('change', () => scheduleLivePreviewUpdate())
  })
  linkImagesContainer.addEventListener('input', () => scheduleLivePreviewUpdate())
  linkImagesContainer.addEventListener('change', () => scheduleLivePreviewUpdate())
}

const copyOutput = async (): Promise<void> => {
  const value = outputElement.value.trim()
  if (!value) return
  await navigator.clipboard.writeText(value)
}

const copyHtmlForPasting = async (html: string): Promise<boolean> => {
  const clipboardItemCtor = (window as typeof window & { ClipboardItem?: typeof ClipboardItem })
    .ClipboardItem

  if (clipboardItemCtor && navigator.clipboard?.write) {
    try {
      const clipboardItem = new clipboardItemCtor({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html], { type: 'text/plain' })
      })
      await navigator.clipboard.write([clipboardItem])
      return true
    } catch {
      // Fallback to execCommand below.
    }
  }

  try {
    const helper = document.createElement('div')
    helper.setAttribute('contenteditable', 'true')
    helper.style.position = 'fixed'
    helper.style.left = '-9999px'
    helper.style.top = '0'
    helper.innerHTML = html
    document.body.appendChild(helper)

    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(helper)
    selection?.removeAllRanges()
    selection?.addRange(range)

    const success = document.execCommand('copy')
    selection?.removeAllRanges()
    document.body.removeChild(helper)
    return success
  } catch {
    return false
  }
}

const downloadOutput = (): void => {
  const value = outputElement.value.trim()
  if (!value) return
  const htmlDocument = `<!doctype html>
<html lang="he">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outlook Signature</title>
  </head>
  <body>
${value}
  </body>
</html>`
  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'outlook-signature.html'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const toPlainTextSignature = (): string => {
  const lines: string[] = []
  const fullName = inputs.fullName.value.trim()
  const roleBits = [inputs.jobTitle.value.trim(), inputs.company.value.trim()].filter(Boolean)
  const phone = inputs.phone.value.trim()
  const email = inputs.email.value.trim()
  const website = normalizeUrl(inputs.website.value)

  if (fullName) lines.push(fullName)
  if (roleBits.length) lines.push(roleBits.join(' | '))
  if (phone) lines.push(`Phone: ${phone}`)
  if (email) lines.push(`Email: ${email}`)
  if (website) lines.push(`Website: ${website}`)

  return lines.join('\r\n')
}

const plainTextToRtf = (plainText: string): string => {
  const escaped = plainText
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r\n|\n|\r/g, '\\par ')
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs20 ${escaped}}`
}

const sanitizeSignatureName = (value: string): string => {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
  return cleaned || 'Outlook-Signature'
}

const toBase64Utf8 = (value: string): string => {
  const utf8Bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of utf8Bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const downloadOutlookInstaller = (): void => {
  const value = outputElement.value.trim()
  if (!value) return

  const signatureName = sanitizeSignatureName(inputs.fullName.value)
  const htmlDocument = `<!doctype html>
<html lang="he">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outlook Signature</title>
  </head>
  <body>
${value}
  </body>
</html>`
  const txtDocument = toPlainTextSignature()
  const rtfDocument = plainTextToRtf(txtDocument)
  const htmlBase64 = toBase64Utf8(htmlDocument)
  const txtBase64 = toBase64Utf8(txtDocument)
  const rtfBase64 = toBase64Utf8(rtfDocument)

  const scriptContent = `$ErrorActionPreference = "Stop"

$signatureName = "${signatureName.replace(/"/g, "'")}"
$signatureDir = Join-Path $env:APPDATA "Microsoft\\Signatures"
$htmlFile = Join-Path $signatureDir "$signatureName.htm"
$txtFile = Join-Path $signatureDir "$signatureName.txt"
$rtfFile = Join-Path $signatureDir "$signatureName.rtf"
$filesDir = Join-Path $signatureDir "$($signatureName)_files"

if (-not (Test-Path $signatureDir)) {
  New-Item -Path $signatureDir -ItemType Directory | Out-Null
}
if (-not (Test-Path $filesDir)) {
  New-Item -Path $filesDir -ItemType Directory | Out-Null
}

$htmlBase64 = "${htmlBase64}"
$txtBase64 = "${txtBase64}"
$rtfBase64 = "${rtfBase64}"
$htmlContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($htmlBase64))
$txtContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($txtBase64))
$rtfContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($rtfBase64))
[System.IO.File]::WriteAllText($htmlFile, $htmlContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($txtFile, $txtContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($rtfFile, $rtfContent, [System.Text.Encoding]::UTF8)

$mailSettingsPaths = @(
  "HKCU:\\Software\\Microsoft\\Office\\16.0\\Common\\MailSettings",
  "HKCU:\\Software\\Microsoft\\Office\\15.0\\Common\\MailSettings"
)

foreach ($path in $mailSettingsPaths) {
  if (Test-Path $path) {
    New-ItemProperty -Path $path -Name "NewSignature" -Value $signatureName -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $path -Name "ReplySignature" -Value $signatureName -PropertyType String -Force | Out-Null
  }
}

Write-Host "Signature installed successfully:" -ForegroundColor Green
Write-Host $htmlFile
Write-Host ""
Write-Host "Set as default for New/Reply where supported."
Write-Host "If Outlook was open, restart Outlook to refresh signatures."
Write-Host "Note: works with classic Outlook desktop. New Outlook may ignore local signature files."
`
  const batchContent = `@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-outlook-signature.ps1"
if errorlevel 1 (
  echo.
  echo Installation failed. If blocked by policy, right-click the .ps1 and run with PowerShell.
  pause
  exit /b 1
)
echo.
echo Signature installation completed.
pause
`

  const psBlob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' })
  const psUrl = URL.createObjectURL(psBlob)
  const psLink = document.createElement('a')
  psLink.href = psUrl
  psLink.download = 'install-outlook-signature.ps1'
  document.body.appendChild(psLink)
  psLink.click()
  document.body.removeChild(psLink)
  URL.revokeObjectURL(psUrl)

  const batBlob = new Blob([batchContent], { type: 'text/plain;charset=utf-8' })
  const batUrl = URL.createObjectURL(batBlob)
  const batLink = document.createElement('a')
  batLink.href = batUrl
  batLink.download = 'run-install-outlook-signature.bat'
  document.body.appendChild(batLink)
  // Stagger download slightly so both files are reliably saved in all browsers.
  window.setTimeout(() => {
    batLink.click()
    document.body.removeChild(batLink)
    URL.revokeObjectURL(batUrl)
  }, 120)
}

const installForNewOutlook = async (): Promise<void> => {
  const value = outputElement.value.trim()
  if (!value) return

  const richCopied = await copyHtmlForPasting(value)
  const popup = window.open(NEW_OUTLOOK_SIGNATURE_SETTINGS_URL, '_blank', 'noopener,noreferrer')
  const openedSettings = !!popup

  newOutlookStatusElement.innerHTML =
    'New Outlook setup: open <a href="https://outlook.office.com/mail/options/mail/layout/EmailSignature" target="_blank" rel="noopener noreferrer">Compose and reply settings</a>, paste into signature editor, then save.'

  if (richCopied && openedSettings) {
    window.alert('Signature copied and New Outlook settings opened. Paste in the signature editor and click Save.')
    return
  }
  if (richCopied && !openedSettings) {
    window.alert(
      'Signature copied. Please open New Outlook settings (Compose and reply), paste into signature editor, and click Save.'
    )
    return
  }
  if (!richCopied && openedSettings) {
    window.alert(
      'New Outlook settings opened, but clipboard copy was blocked. Copy from "Generated HTML", paste into signature editor, and click Save.'
    )
    return
  }
  window.alert(
    'Could not auto-open settings or copy automatically. Open New Outlook > Settings > Mail > Compose and reply, paste from "Generated HTML", and click Save.'
  )
}

addLinkImageButton.addEventListener('click', () => addLinkImageRow())
generateButton.addEventListener('click', () => {
  generate().catch(() => {
    window.alert('Could not generate social icons. Please try again.')
  })
})
copyButton.addEventListener('click', () => {
  copyOutput().catch(() => {
    outputElement.select()
    document.execCommand('copy')
  })
})
downloadButton.addEventListener('click', downloadOutput)
installOutlookButton.addEventListener('click', () => {
  const hasSignature = outputElement.value.trim().length > 0
  const run = hasSignature ? Promise.resolve() : generate()
  run
    .then(() => {
      downloadOutlookInstaller()
      window.alert(
        'Installers downloaded: install-outlook-signature.ps1 and run-install-outlook-signature.bat. Double-click the .bat for easiest install, or run the .ps1 directly.'
      )
    })
    .catch(() => {
      window.alert('Could not prepare Outlook installer. Please generate the signature first.')
    })
})
installNewOutlookButton.addEventListener('click', () => {
  const hasSignature = outputElement.value.trim().length > 0
  const run = hasSignature ? Promise.resolve() : generate()
  run
    .then(() => installForNewOutlook())
    .catch(() => {
      window.alert('Could not prepare New Outlook setup. Please generate the signature first.')
    })
})
bindFileInputToUrl(inputs.logoFile, inputs.logoUrl)
bindFileInputToUrl(inputs.bannerFile, inputs.bannerUrl)
bindFileInputToUrl(inputs.facebookIconFile, inputs.facebookIconUrl)
bindFileInputToUrl(inputs.instagramIconFile, inputs.instagramIconUrl)
bindFileInputToUrl(inputs.linkedinIconFile, inputs.linkedinIconUrl)
bindFileInputToUrl(inputs.xIconFile, inputs.xIconUrl)
bindFileInputToUrl(inputs.youtubeIconFile, inputs.youtubeIconUrl)
enableLivePreview()

if (!inputs.logoUrl.value.trim()) {
  inputs.logoUrl.value = DEFAULT_LOGO_DATA_URL
}

addLinkImageRow({ alt: 'Linked image' })
generate().catch(() => {
  // Initial render should not block form usage.
})

import {
  buildAiBriefPresets,
  buildAiCreatePresets,
  presetPromptsFromList
} from './aiBriefPresets'
import {
  designSignatureWithAi,
  hasConfiguredAiApiKey,
  isUsingEnvApiKey,
  isUsingServerAiProxy,
  loadStoredApiKey,
  storeApiKey
} from './aiAgent'
import type { AiDesignMode, SignatureFormSnapshot } from './aiSignatureDesign'
import { applyAiSignatureDesign } from './applyAiDesign'
import { DEFAULT_LOGO_DATA_URL } from './defaultLogoDataUrl'
import {
  applyUiLanguage,
  localizeLinkImageRow,
  outlookHelpStatusHtml,
  signatureStrings,
  t,
  type AppLanguage,
  type I18nKey
} from './i18n'
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
  emailAlign: 'left' | 'center' | 'right'
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
  signatureLanguage: byId<HTMLSelectElement>('signatureLanguage'),
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
  emailAlign: byId<HTMLSelectElement>('emailAlign'),
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
const previewCard = byId<HTMLElement>('previewCard')
const aiPreviewWrap = byId<HTMLDivElement>('aiPreviewWrap')
const aiPreviewElement = byId<HTMLDivElement>('aiPreview')
const outputElement = byId<HTMLTextAreaElement>('output')
const installGuideGif = document.getElementById('installGuideGif') as HTMLImageElement | null
const aiBriefInput = byId<HTMLTextAreaElement>('aiBrief')
const aiBriefPresetSelect = byId<HTMLSelectElement>('aiBriefPreset')
const aiPresetLabelElement = byId<HTMLSpanElement>('aiPresetLabel')
const aiDesignLeadElement = byId<HTMLParagraphElement>('aiDesignLead')
const aiApiKeyInput = byId<HTMLInputElement>('aiApiKey')
const aiDesignButton = byId<HTMLButtonElement>('aiDesign')
const aiCreateNewButton = byId<HTMLButtonElement>('aiCreateNew')
const aiKeepContactWrap = byId<HTMLLabelElement>('aiKeepContactWrap')
const aiKeepContactCheckbox = byId<HTMLInputElement>('aiKeepContact')
const aiModeRefineRadio = byId<HTMLInputElement>('aiModeRefine')
const aiModeCreateRadio = byId<HTMLInputElement>('aiModeCreate')
const aiStatusElement = byId<HTMLParagraphElement>('aiStatus')

const outlookHelpStatusElement = (() => {
  const element =
    document.getElementById('outlookHelpStatus') ?? document.getElementById('newOutlookStatus')
  if (!element) {
    throw new Error('Missing #outlookHelpStatus element in index.html')
  }
  return element as HTMLParagraphElement
})()

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
let aiPresetRefreshTimer: number | null = null
let aiBriefPresetPrompts = new Map<string, string>()

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const hasHebrew = (value: string): boolean => /[\u0590-\u05FF]/.test(value)

const getSignatureLanguage = (): AppLanguage =>
  parseEnumInput(inputs.signatureLanguage.value, ['en', 'he'] as const, 'he')

const getSignatureStrings = () => signatureStrings[getSignatureLanguage()]

const refreshUiLanguage = (): void => {
  const lang = getSignatureLanguage()
  applyUiLanguage(lang)
  outlookHelpStatusElement.dir = lang === 'he' ? 'rtl' : 'ltr'
  outlookHelpStatusElement.innerHTML = outlookHelpStatusHtml(lang)
  if (installGuideGif) {
    installGuideGif.alt = t(lang, 'installGuideAlt')
  }
  linkImagesContainer.querySelectorAll('.link-image-row').forEach((row) => {
    localizeLinkImageRow(row as HTMLElement, lang)
  })
}

const wrapHtmlDocument = (bodyHtml: string, lang: AppLanguage): string =>
  `<!doctype html>
<html lang="${lang}"${lang === 'he' ? ' dir="rtl"' : ''}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Outlook Signature</title>
  </head>
  <body>
${bodyHtml}
  </body>
</html>`

const sanitizeFontFamily = (value: string): string => {
  const cleaned = value.replace(/[;{}<>]/g, '').trim()
  return cleaned || "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif"
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
  const lang = getSignatureLanguage()
  const defaultAlt = seed?.alt ?? t(lang, 'linkedImageAlt')
  const row = document.createElement('div')
  row.className = 'link-image-row'
  row.innerHTML = `
    <label><span class="link-image-url-label"></span> <input class="link-image-url" placeholder="https://..." value="${escapeHtml(seed?.imageUrl ?? '')}" /></label>
    <label><span class="link-image-href-label"></span> <input class="link-image-href" placeholder="https://..." value="${escapeHtml(seed?.href ?? '')}" /></label>
    <label><span class="link-image-alt-label"></span> <input class="link-image-alt" placeholder="Linked image" value="${escapeHtml(defaultAlt)}" /></label>
    <label><span class="link-image-file-label"></span> <input class="link-image-file" type="file" accept="image/*" /></label>
    <button type="button" class="secondary remove-link-image">Remove</button>
  `
  localizeLinkImageRow(row, lang)
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
      const alt =
        (row.querySelector('.link-image-alt') as HTMLInputElement).value.trim() ||
        t(getSignatureLanguage(), 'linkedImageAlt')
      return { imageUrl, href, alt }
    })
    .filter((item) => item.imageUrl && item.href)
}

const getLayoutSettings = (): SignatureLayoutSettings => ({
  fontFamily: sanitizeFontFamily(inputs.fontFamily.value),
  nameFontSize: parseNumberInput(inputs.nameFontSize.value, 28, 14, 72),
  titleFontSize: parseNumberInput(inputs.titleFontSize.value, 19, 10, 48),
  bodyFontSize: parseNumberInput(inputs.bodyFontSize.value, 12, 9, 24),
  lineSpacing: parseNumberInput(inputs.lineSpacing.value, 1.1, 1, 2, 2),
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
  emailAlign: parseEnumInput(inputs.emailAlign.value, ['left', 'center', 'right'] as const, 'right'),
  logoAlign: parseEnumInput(inputs.logoAlign.value, ['left', 'center', 'right'] as const, 'right'),
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

const getFormSnapshot = (): SignatureFormSnapshot => {
  const layout = getLayoutSettings()
  return {
    signatureLanguage: getSignatureLanguage(),
    fullName: inputs.fullName.value.trim(),
    jobTitle: inputs.jobTitle.value.trim(),
    company: inputs.company.value.trim(),
    phone: inputs.phone.value.trim(),
    email: inputs.email.value.trim(),
    website: inputs.website.value.trim(),
    fontFamily: layout.fontFamily,
    nameFontSize: layout.nameFontSize,
    titleFontSize: layout.titleFontSize,
    bodyFontSize: layout.bodyFontSize,
    lineSpacing: layout.lineSpacing,
    signatureWidth: layout.signatureWidth,
    signatureHeight: layout.signatureHeight,
    textColumnWidth: layout.textColumnWidth,
    logoMaxWidth: layout.logoMaxWidth,
    textAlign: layout.textAlign,
    nameTitleAlign: layout.nameTitleAlign,
    emailAlign: layout.emailAlign,
    logoAlign: layout.logoAlign,
    verticalAlign: layout.verticalAlign,
    accentColor: layout.accentColor,
    secondaryTextColor: layout.secondaryTextColor,
    socialIconGap: layout.socialIconGap,
    dividerThickness: layout.dividerThickness
  }
}

const hasLogoConfigured = (): boolean => Boolean(inputs.logoUrl.value.trim())

const hasBannerConfigured = (): boolean => Boolean(inputs.bannerUrl.value.trim())

const hasSocialConfigured = (): boolean =>
  [
    inputs.facebookUrl,
    inputs.instagramUrl,
    inputs.linkedinUrl,
    inputs.xUrl,
    inputs.youtubeUrl
  ].some((input) => input.value.trim().length > 0)

const refreshAiApiKeyFieldState = (): void => {
  const lang = getSignatureLanguage()
  const usingServer = isUsingServerAiProxy(aiApiKeyInput.value)
  const usingEnv = isUsingEnvApiKey(aiApiKeyInput.value)
  aiApiKeyInput.placeholder = usingServer
    ? t(lang, 'aiApiKeyUsingServer')
    : usingEnv
      ? t(lang, 'aiApiKeyUsingEnv')
      : t(lang, 'aiApiKeyPlaceholder')
}

const getAiDesignMode = (): AiDesignMode => (aiModeCreateRadio.checked ? 'create' : 'refine')

const getDefaultDesignSnapshot = (): SignatureFormSnapshot => ({
  signatureLanguage: getSignatureLanguage(),
  fullName: '',
  jobTitle: '',
  company: '',
  phone: '',
  email: '',
  website: '',
  fontFamily: "'Comeback SemiBold', 'Comeback Semi', Comeback, Arial, Helvetica, sans-serif",
  nameFontSize: 28,
  titleFontSize: 19,
  bodyFontSize: 12,
  lineSpacing: 1.1,
  signatureWidth: 400,
  signatureHeight: 200,
  textColumnWidth: 252,
  logoMaxWidth: 122,
  textAlign: getSignatureLanguage() === 'he' ? 'right' : 'right',
  nameTitleAlign: getSignatureLanguage() === 'he' ? 'right' : 'right',
  emailAlign: getSignatureLanguage() === 'he' ? 'right' : 'right',
  logoAlign: 'right',
  verticalAlign: 'top',
  accentColor: '#92278f',
  secondaryTextColor: '#666666',
  socialIconGap: 5,
  dividerThickness: 2
})

const buildAiRequestSnapshot = (mode: AiDesignMode, keepContact: boolean): SignatureFormSnapshot => {
  if (mode === 'refine') return getFormSnapshot()

  const defaults = getDefaultDesignSnapshot()
  if (!keepContact) return defaults

  const current = getFormSnapshot()
  return {
    ...defaults,
    signatureLanguage: current.signatureLanguage,
    fullName: current.fullName,
    jobTitle: current.jobTitle,
    company: current.company,
    phone: current.phone,
    email: current.email,
    website: current.website
  }
}

const clearSocialFields = (): void => {
  inputs.facebookUrl.value = ''
  inputs.instagramUrl.value = ''
  inputs.linkedinUrl.value = ''
  inputs.xUrl.value = ''
  inputs.youtubeUrl.value = ''
}

const clearContactFields = (): void => {
  inputs.fullName.value = ''
  inputs.jobTitle.value = ''
  inputs.company.value = ''
  inputs.phone.value = ''
  inputs.email.value = ''
  inputs.website.value = ''
}

const prepareFormForCreate = (keepContact: boolean): void => {
  clearSocialFields()
  if (!keepContact) clearContactFields()
}

const refreshAiPanelState = (): void => {
  const lang = getSignatureLanguage()
  const mode = getAiDesignMode()
  aiKeepContactWrap.hidden = mode === 'refine'
  aiDesignLeadElement.textContent =
    mode === 'create' ? t(lang, 'aiCreateLead') : t(lang, 'aiDesignLead')
  aiPresetLabelElement.textContent =
    mode === 'create' ? t(lang, 'aiCreatePresetLabel') : t(lang, 'aiPresetLabel')
  aiBriefInput.dataset.i18nPlaceholder =
    mode === 'create' ? 'aiCreateBriefPlaceholder' : 'aiBriefPlaceholder'
  aiBriefInput.placeholder = t(
    lang,
    mode === 'create' ? 'aiCreateBriefPlaceholder' : 'aiBriefPlaceholder'
  )
  refreshAiBriefPresets()
}

const refreshAiBriefPresets = (): void => {
  const lang = getSignatureLanguage()
  const mode = getAiDesignMode()
  const snapshot = getFormSnapshot()
  const presets =
    mode === 'create'
      ? buildAiCreatePresets(lang)
      : buildAiBriefPresets(snapshot, {
          hasLogo: hasLogoConfigured(),
          hasBanner: hasBannerConfigured(),
          hasSocial: hasSocialConfigured(),
          hasWebsite: Boolean(snapshot.website.trim())
        })
  aiBriefPresetPrompts = presetPromptsFromList(presets)

  const selectedId = aiBriefPresetSelect.value
  aiBriefPresetSelect.innerHTML = ''

  const placeholder = document.createElement('option')
  placeholder.value = ''
  placeholder.textContent = t(lang, 'aiPresetPlaceholder')
  aiBriefPresetSelect.appendChild(placeholder)

  for (const preset of presets) {
    const option = document.createElement('option')
    option.value = preset.id
    option.textContent = preset.label
    aiBriefPresetSelect.appendChild(option)
  }

  if (selectedId && aiBriefPresetPrompts.has(selectedId)) {
    aiBriefPresetSelect.value = selectedId
  }
}

const scheduleAiBriefPresetRefresh = (delayMs = 200): void => {
  if (aiPresetRefreshTimer !== null) {
    window.clearTimeout(aiPresetRefreshTimer)
  }
  aiPresetRefreshTimer = window.setTimeout(() => {
    aiPresetRefreshTimer = null
    if (getAiDesignMode() === 'refine') refreshAiBriefPresets()
  }, delayMs)
}

const setAiStatus = (message: string, tone: 'idle' | 'working' | 'success' | 'error'): void => {
  aiStatusElement.hidden = !message
  aiStatusElement.textContent = message
  aiStatusElement.classList.remove('is-success', 'is-error')
  if (tone === 'success') aiStatusElement.classList.add('is-success')
  if (tone === 'error') aiStatusElement.classList.add('is-error')
}

const runAiDesign = async (mode: AiDesignMode): Promise<void> => {
  const lang = getSignatureLanguage()
  const brief = aiBriefInput.value.trim()
  if (!brief) {
    setAiStatus(t(lang, 'aiDesignMissingBrief'), 'error')
    aiBriefInput.focus()
    return
  }

  storeApiKey(aiApiKeyInput.value)
  if (!hasConfiguredAiApiKey(aiApiKeyInput.value)) {
    setAiStatus(t(lang, 'aiDesignMissingApiKey'), 'error')
    aiApiKeyInput.focus()
    return
  }

  const keepContact = mode === 'refine' || aiKeepContactCheckbox.checked
  if (mode === 'create') {
    prepareFormForCreate(keepContact)
  }

  aiDesignButton.disabled = true
  aiCreateNewButton.disabled = true
  setAiStatus(t(lang, 'aiDesignWorking'), 'working')

  try {
    const design = await designSignatureWithAi(brief, buildAiRequestSnapshot(mode, keepContact), {
      apiKey: aiApiKeyInput.value,
      mode,
      keepContact
    })
    applyAiSignatureDesign(inputs, design)
    refreshUiLanguage()
    await generate()
    revealSignaturePreview({ scrollToMain: true, showInline: true })
    refreshAiPanelState()
    const successPrefix =
      mode === 'create' ? t(lang, 'aiCreateSuccess') : t(lang, 'aiDesignSuccess')
    setAiStatus(`${successPrefix} ${design.designSummary}`, 'success')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    setAiStatus(`${t(lang, 'aiDesignFailed')} ${message}`, 'error')
  } finally {
    aiDesignButton.disabled = false
    aiCreateNewButton.disabled = false
  }
}

const buildSignatureHtml = (layout: SignatureLayoutSettings): string => {
  const lang = getSignatureLanguage()
  const strings = getSignatureStrings()
  const contactDirection = lang === 'he' ? 'rtl' : 'ltr'
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
  const detailsLineHeight = Math.max(1, layout.lineSpacing - 0.15)
  const nameLineHeight = Math.max(1, layout.lineSpacing - 0.35)
  const titleLineHeight = Math.max(1, layout.lineSpacing - 0.3)
  const rtlContent =
    lang === 'he' ||
    [inputs.fullName.value, inputs.jobTitle.value, inputs.company.value].some(hasHebrew)
  const nameTitleDirection = rtlContent ? 'rtl' : 'ltr'
  const textOffsetLeft = Math.max(layout.textOffsetX, 0)
  const textOffsetRight = Math.max(-layout.textOffsetX, 0)
  const logoOffsetLeft = Math.max(layout.logoOffsetX, 0)
  const logoOffsetRight = Math.max(-layout.logoOffsetX, 0)
  const contentAlign = rtlContent ? 'right' : layout.nameTitleAlign
  const contentAlignAttr =
    contentAlign === 'left' ? 'left' : contentAlign === 'center' ? 'center' : 'right'
  const edgeInset = 8
  const dividerInset = 12

  const contactRowBorder = dividerColor
  const buildContactRow = (labelHtml: string, valueHtml: string): string =>
    `<tr>
      <td dir="${contactDirection}" align="${contentAlignAttr}" style="padding:3px ${edgeInset}px 6px;font-size:${bodyFontSizePx};line-height:${detailsLineHeight};text-align:${contentAlign};border-bottom:1px solid ${contactRowBorder};">
        <span style="font-weight:700;color:${secondaryTextColor};">${labelHtml}</span>&nbsp;<span style="unicode-bidi:plaintext;">${valueHtml}</span>
      </td>
    </tr>`

  const contactRows: string[] = []
  if (phone.trim()) {
    contactRows.push(
      buildContactRow(
        strings.phoneLabel,
        `<a href="${escapeHtml(normalizeUrl(`tel:${inputs.phone.value.trim()}`))}" style="text-decoration:none;color:${accentColor};">${phone}</a>`
      )
    )
  }
  if (email.trim()) {
    contactRows.push(
      buildContactRow(
        strings.emailLabel,
        `<a href="${escapeHtml(normalizeUrl(`mailto:${inputs.email.value.trim()}`))}" style="text-decoration:underline;color:${accentColor};word-break:break-all;">${email}</a>`
      )
    )
  }
  if (website) {
    const websiteLabel = escapeHtml(website.replace(/^https?:\/\//i, ''))
    contactRows.push(
      buildContactRow(
        strings.websiteLabel,
        `<a href="${escapeHtml(website)}" style="text-decoration:underline;color:${linkColor};word-break:break-all;">${websiteLabel}</a>`
      )
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

  // Keep layout LTR so columns stay text | divider | logo (logo on the right).
  const signatureTable = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" align="${layout.emailAlign}" style="font-family:${fontFamilyCss};color:${textColor};background:${backgroundColor};width:${signatureWidth}px;max-width:${signatureWidth}px;mso-line-height-rule:exactly;">
  <tr>
    <td style="vertical-align:${layout.verticalAlign};padding-left:${textOffsetLeft + edgeInset}px;padding-right:${textOffsetRight + dividerInset}px;padding-top:${Math.max(
      0,
      layout.textOffsetY
    ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.textOffsetY) + edgeInset}px;width:${textColumnWidth}px;max-width:${textColumnWidth}px;text-align:${contentAlign};unicode-bidi:plaintext;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${nameTitleDirection}" style="text-align:${contentAlign};">
        <tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="font-size:${layout.nameFontSize}px;line-height:${nameLineHeight};font-weight:700;color:${accentColor};padding:0 0 1px;text-align:${contentAlign};unicode-bidi:plaintext;">${fullName || strings.fullNamePlaceholder}</td></tr>
        <tr><td dir="${nameTitleDirection}" align="${contentAlignAttr}" style="font-size:${layout.titleFontSize}px;line-height:${titleLineHeight};font-weight:700;color:${secondaryTextColor};padding:0 0 3px;text-align:${contentAlign};unicode-bidi:plaintext;">${jobTitle || strings.jobTitlePlaceholder}${company ? `<br style="line-height:${titleLineHeight};" /><span style="font-weight:700;line-height:${titleLineHeight};">${company}</span>` : ''}</td></tr>
        ${contactRows.length ? `<tr><td dir="${contactDirection}" align="${contentAlignAttr}" style="padding-top:2px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" align="${contentAlignAttr}" dir="${contactDirection}" style="text-align:${contentAlign};border-collapse:collapse;">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialTextRow}
      </table>
    </td>
    <td style="width:${layout.dividerThickness}px;min-width:${layout.dividerThickness}px;background:${dividerColor};font-size:0;line-height:0;padding:0;">&nbsp;</td>
    <td style="vertical-align:${layout.verticalAlign};padding-left:${logoOffsetLeft + dividerInset}px;padding-right:${logoOffsetRight + edgeInset}px;padding-top:${Math.max(
      0,
      layout.logoOffsetY
    ) + edgeInset}px;padding-bottom:${Math.max(0, -layout.logoOffsetY) + edgeInset}px;width:${logoColumnWidth}px;max-width:${logoColumnWidth}px;text-align:${layout.logoAlign};">
      ${
        logoUrl
          ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(strings.companyLogoAlt)}" width="${layout.logoMaxWidth}" style="display:block;border:0;max-width:${layout.logoMaxWidth}px;height:auto;margin-left:${layout.logoAlign === 'left' ? '0' : 'auto'};margin-right:${layout.logoAlign === 'right' ? '0' : 'auto'};" />`
          : `<div style="font-size:14px;color:${accentColor};font-weight:700;">${strings.companyLogoPlaceholder}</div>`
      }
    </td>
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

const renderSignaturePreview = (html: string, layout: SignatureLayoutSettings): void => {
  outputElement.value = html
  for (const element of [previewElement, aiPreviewElement]) {
    element.style.width = `${layout.signatureWidth}px`
    element.style.minHeight = `${layout.signatureHeight}px`
    element.style.height = 'auto'
    element.innerHTML = html
  }
}

const revealSignaturePreview = (options?: { scrollToMain?: boolean; showInline?: boolean }): void => {
  const scrollToMain = options?.scrollToMain ?? true
  const showInline = options?.showInline ?? true

  if (showInline) {
    aiPreviewWrap.hidden = false
  }

  const previewDetails = previewCard.querySelector('details')
  if (previewDetails && !previewDetails.open) {
    previewDetails.open = true
  }

  if (scrollToMain) {
    previewCard.classList.add('preview-highlight')
    window.setTimeout(() => previewCard.classList.remove('preview-highlight'), 2200)
    window.requestAnimationFrame(() => {
      previewCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }
}

const generate = async (): Promise<void> => {
  await initializeSocialIconDataUrls()
  const layout = getLayoutSettings()
  const html = buildSignatureHtml(layout)
  renderSignaturePreview(html, layout)
}

const enableLivePreview = (): void => {
  Object.values(inputs).forEach((input) => {
    input.addEventListener('input', () => {
      scheduleLivePreviewUpdate()
      scheduleAiBriefPresetRefresh()
    })
    input.addEventListener('change', () => {
      scheduleLivePreviewUpdate()
      scheduleAiBriefPresetRefresh()
    })
  })
  linkImagesContainer.addEventListener('input', () => {
    scheduleLivePreviewUpdate()
    scheduleAiBriefPresetRefresh()
  })
  linkImagesContainer.addEventListener('change', () => {
    scheduleLivePreviewUpdate()
    scheduleAiBriefPresetRefresh()
  })
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
  const htmlDocument = wrapHtmlDocument(value, getSignatureLanguage())
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
  const strings = getSignatureStrings()
  const lines: string[] = []
  const fullName = inputs.fullName.value.trim()
  const roleBits = [inputs.jobTitle.value.trim(), inputs.company.value.trim()].filter(Boolean)
  const phone = inputs.phone.value.trim()
  const email = inputs.email.value.trim()
  const website = normalizeUrl(inputs.website.value)

  if (fullName) lines.push(fullName)
  if (roleBits.length) lines.push(roleBits.join('\r\n'))
  if (phone) lines.push(`${strings.phoneLabel} ${phone}`)
  if (email) lines.push(`${strings.emailLabel} ${email}`)
  if (website) lines.push(`${strings.websiteLabel} ${website}`)

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

const encodeBatFile = (content: string): Uint8Array => {
  const normalized = content.replace(/\r?\n/g, '\r\n')
  const body = new TextEncoder().encode(normalized)
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])
  const out = new Uint8Array(bom.length + body.length)
  out.set(bom, 0)
  out.set(body, bom.length)
  return out
}

const downloadBatFile = (filename: string, content: string): void => {
  const blob = new Blob([encodeBatFile(content)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const OUTLOOK_INSTALL_SCRIPT_MARKER = '# SIGSCRIPT'
const POWERSHELL_EXE = '%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

const escapePsSingleQuoted = (value: string): string => value.replace(/'/g, "''")

/**
 * Legacy conhost shows Hebrew in reversed visual order. Pre-reverse so it reads correctly.
 * Pure Hebrew lines: reverse the whole string. Mixed lines: reverse each Hebrew run only.
 */
const fixConsoleHebrew = (text: string, lang: AppLanguage): string => {
  if (lang !== 'he') return text
  if (!/[A-Za-z]/.test(text)) {
    return [...text].reverse().join('')
  }
  return text.replace(/[\u0590-\u05FF]+/g, (run) => [...run].reverse().join(''))
}

const psConsoleMessage = (lang: AppLanguage, key: I18nKey): string =>
  escapePsSingleQuoted(fixConsoleHebrew(t(lang, key), lang))

const batUtf8Preamble = (lang: AppLanguage): string =>
  lang === 'he' ? 'chcp 65001 >nul\r\n' : ''

const buildBatPauseCommand = (lang: AppLanguage, outcome: 'success' | 'failure'): string => {
  const utf8Console =
    lang === 'he' ? '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); ' : ''
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')
  const lines =
    outcome === 'success'
      ? [psConsoleMessage(lang, 'batInstallComplete')]
      : [psConsoleMessage(lang, 'batInstallFailed'), psConsoleMessage(lang, 'batInstallSecurityHint')]
  const writeLines = lines.map((line) => `Write-Host '${line}'`).join('; ')
  return `"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${utf8Console}${writeLines}; Read-Host '${pressEnter}'"`
}

const buildSelfContainedInstallBat = (scriptContent: string, lang: AppLanguage): string => {
  const scriptLines = scriptContent.replace(/\r?\n/g, '\r\n').trimEnd()
  const corruptMsg = psConsoleMessage(lang, 'batInstallerCorrupt')

  return `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
set "EC=0"
set "SCRIPT=%TEMP%\\install-outlook-signature-%RANDOM%.ps1"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "$marker='${OUTLOOK_INSTALL_SCRIPT_MARKER}'; $lines=Get-Content -LiteralPath '%~f0' -Encoding UTF8; $start=[Array]::IndexOf($lines,$marker); if ($start -lt 0) { Write-Error '${corruptMsg}'; exit 1 }; $lines[($start+1)..($lines.Length-1)] | Set-Content -LiteralPath '%SCRIPT%' -Encoding UTF8"
if errorlevel 1 set "EC=1" & goto :finish
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "EC=%ERRORLEVEL%"
del "%SCRIPT%" 2>nul
:finish
if "%EC%"=="0" (
  ${buildBatPauseCommand(lang, 'success')}
) else (
  ${buildBatPauseCommand(lang, 'failure')}
)
exit /b %EC%

goto :eof
${OUTLOOK_INSTALL_SCRIPT_MARKER}
${scriptLines}
`
}

const downloadOpenSignaturesFolderBat = (lang: AppLanguage): void => {
  const utf8Console =
    lang === 'he' ? '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); ' : ''
  const folderOpened = psConsoleMessage(lang, 'batFolderOpened')
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')

  downloadBatFile(
    'open-signatures-folder.bat',
    `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
if not exist "%APPDATA%\\Microsoft\\Signatures" mkdir "%APPDATA%\\Microsoft\\Signatures" 2>nul
start "" "%SystemRoot%\\explorer.exe" "%APPDATA%\\Microsoft\\Signatures"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${utf8Console}Write-Host '${folderOpened}'; Read-Host '${pressEnter}'"
exit /b 0
`
  )
}

const downloadOutlookInstaller = (): void => {
  const value = outputElement.value.trim()
  if (!value) return

  const lang = getSignatureLanguage()
  const signatureName = sanitizeSignatureName(inputs.fullName.value)
  const htmlDocument = wrapHtmlDocument(value, getSignatureLanguage())
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

Write-Host '${psConsoleMessage(lang, 'batPsInstallSuccess')}' -ForegroundColor Green
Write-Host $htmlFile
Write-Host ""
Write-Host '${psConsoleMessage(lang, 'batPsSetDefault')}'
Write-Host '${psConsoleMessage(lang, 'batPsRestartOutlook')}'
Write-Host '${psConsoleMessage(lang, 'batPsClassicNote')}'
`
  downloadBatFile('install-outlook-signature.bat', buildSelfContainedInstallBat(scriptContent, lang))
}

const installForNewOutlook = async (): Promise<void> => {
  const value = outputElement.value.trim()
  if (!value) return

  const richCopied = await copyHtmlForPasting(value)
  const popup = window.open(NEW_OUTLOOK_SIGNATURE_SETTINGS_URL, '_blank', 'noopener,noreferrer')
  const openedSettings = !!popup

  const lang = getSignatureLanguage()

  if (richCopied && openedSettings) {
    window.alert(t(lang, 'alertNewOutlookCopiedOpened'))
    return
  }
  if (richCopied && !openedSettings) {
    window.alert(t(lang, 'alertNewOutlookCopied'))
    return
  }
  if (!richCopied && openedSettings) {
    window.alert(t(lang, 'alertNewOutlookOpenedNoCopy'))
    return
  }
  window.alert(t(lang, 'alertNewOutlookManual'))
}

outlookHelpStatusElement.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest('.open-signatures-folder')
  if (!target) return
  event.preventDefault()
  downloadOpenSignaturesFolderBat(getSignatureLanguage())
})

addLinkImageButton.addEventListener('click', () => addLinkImageRow())
aiBriefPresetSelect.addEventListener('change', () => {
  const presetId = aiBriefPresetSelect.value
  if (!presetId) return
  const prompt = aiBriefPresetPrompts.get(presetId)
  if (prompt) {
    aiBriefInput.value = prompt
    aiBriefInput.dispatchEvent(new Event('input', { bubbles: true }))
    aiBriefInput.focus()
  }
  aiBriefPresetSelect.value = ''
})
aiModeRefineRadio.addEventListener('change', () => refreshAiPanelState())
aiModeCreateRadio.addEventListener('change', () => refreshAiPanelState())
aiDesignButton.addEventListener('click', () => {
  runAiDesign('refine').catch(() => {
    setAiStatus(t(getSignatureLanguage(), 'aiDesignFailed'), 'error')
  })
})
aiCreateNewButton.addEventListener('click', () => {
  runAiDesign('create').catch(() => {
    setAiStatus(t(getSignatureLanguage(), 'aiDesignFailed'), 'error')
  })
})
aiApiKeyInput.value = loadStoredApiKey()
aiApiKeyInput.addEventListener('input', () => refreshAiApiKeyFieldState())
refreshAiApiKeyFieldState()
generateButton.addEventListener('click', () => {
  generate().catch(() => {
    window.alert(t(getSignatureLanguage(), 'alertGenerateFailed'))
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
      window.alert(t(getSignatureLanguage(), 'alertOutlookInstallSuccess'))
    })
    .catch(() => {
      window.alert(t(getSignatureLanguage(), 'alertOutlookInstallFailed'))
    })
})
installNewOutlookButton.addEventListener('click', () => {
  const hasSignature = outputElement.value.trim().length > 0
  const run = hasSignature ? Promise.resolve() : generate()
  run
    .then(() => installForNewOutlook())
    .catch(() => {
      window.alert(t(getSignatureLanguage(), 'alertNewOutlookFailed'))
    })
})
inputs.signatureLanguage.addEventListener('change', () => {
  if (getSignatureLanguage() === 'he') {
    inputs.textAlign.value = 'right'
    inputs.nameTitleAlign.value = 'right'
    inputs.emailAlign.value = 'right'
  }
  refreshUiLanguage()
  refreshAiPanelState()
  refreshAiApiKeyFieldState()
  scheduleLivePreviewUpdate()
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

refreshUiLanguage()
refreshAiPanelState()
refreshAiApiKeyFieldState()
addLinkImageRow()
generate().catch(() => {
  // Initial render should not block form usage.
})

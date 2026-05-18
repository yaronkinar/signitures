import { DEFAULT_LOGO_DATA_URL } from './defaultLogoDataUrl'
import { siFacebook, siInstagram, siX, siYoutube } from 'simple-icons'

type LinkImage = {
  imageUrl: string
  href: string
  alt: string
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
  instagramUrl: byId<HTMLInputElement>('instagramUrl'),
  linkedinUrl: byId<HTMLInputElement>('linkedinUrl'),
  xUrl: byId<HTMLInputElement>('xUrl'),
  youtubeUrl: byId<HTMLInputElement>('youtubeUrl'),
  logoUrl: byId<HTMLInputElement>('logoUrl'),
  logoFile: byId<HTMLInputElement>('logoFile'),
  bannerUrl: byId<HTMLInputElement>('bannerUrl'),
  bannerFile: byId<HTMLInputElement>('bannerFile'),
  bannerLink: byId<HTMLInputElement>('bannerLink')
}

const linkImagesContainer = byId<HTMLDivElement>('linkImages')
const addLinkImageButton = byId<HTMLButtonElement>('addLinkImage')
const generateButton = byId<HTMLButtonElement>('generate')
const copyButton = byId<HTMLButtonElement>('copy')
const downloadButton = byId<HTMLButtonElement>('download')
const installOutlookButton = byId<HTMLButtonElement>('installOutlook')
const previewElement = byId<HTMLDivElement>('preview')
const outputElement = byId<HTMLTextAreaElement>('output')

type SocialPlatform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'YouTube'

const socialIconDataUrls: Record<SocialPlatform, string> = {
  Facebook: '',
  Instagram: '',
  LinkedIn: '',
  X: '',
  YouTube: ''
}

let socialIconsInitializationPromise: Promise<void> | null = null

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const hasHebrew = (value: string): boolean => /[\u0590-\u05FF]/.test(value)

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
        if (dataUrl) urlInput.value = dataUrl
      })
      .catch(() => {
        // Keep current value if file conversion fails.
      })
  })
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
  removeButton?.addEventListener('click', () => row.remove())

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

const buildSignatureHtml = (): string => {
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
  const accentColor = '#92278f'
  const signatureWidth = 400
  const signatureHeight = 200
  const textColumnWidth = 252
  const logoColumnWidth = 138
  const rtlContent = [fullName, jobTitle, company].some(hasHebrew)
  const textDirection = rtlContent ? 'rtl' : 'ltr'
  const textAlign = rtlContent ? 'right' : 'left'
  const nameTitleDirection = 'rtl'
  const nameTitleAlign = 'right'
  const dividerPadding = 'padding-right:6px;'
  const logoPadding = 'padding-left:10px;'

  const contactRows: string[] = []
  if (phone.trim()) {
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">נייד:&nbsp;</td>
        <td style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(normalizeUrl(`tel:${inputs.phone.value.trim()}`))}" style="text-decoration:none;color:${accentColor};">${phone}</a>
        </td>
      </tr>`
    )
  }
  if (email.trim()) {
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">דוא"ל:&nbsp;</td>
        <td style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(normalizeUrl(`mailto:${inputs.email.value.trim()}`))}" style="text-decoration:underline;color:${accentColor};">${email}</a>
        </td>
      </tr>`
    )
  }
  if (website) {
    const websiteLabel = escapeHtml(website.replace(/^https?:\/\//i, ''))
    contactRows.push(
      `<tr>
        <td dir="rtl" style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;font-weight:700;white-space:nowrap;border-bottom:1px solid #d1d5db;">אתר:&nbsp;</td>
        <td style="padding:2px 0;font-size:12px;line-height:1.25;color:#666666;unicode-bidi:plaintext;border-bottom:1px solid #d1d5db;">
          <a href="${escapeHtml(website)}" style="text-decoration:underline;color:#5a5a5a;">${websiteLabel}</a>
        </td>
      </tr>`
    )
  }

  const socialLinks = [
    {
      label: 'Facebook',
      url: facebookUrl,
      iconUrl: socialIconDataUrls.Facebook
    },
    {
      label: 'Instagram',
      url: instagramUrl,
      iconUrl: socialIconDataUrls.Instagram
    },
    {
      label: 'LinkedIn',
      url: linkedinUrl,
      iconUrl: socialIconDataUrls.LinkedIn
    },
    {
      label: 'X',
      url: xUrl,
      iconUrl: socialIconDataUrls.X
    },
    {
      label: 'YouTube',
      url: youtubeUrl,
      iconUrl: socialIconDataUrls.YouTube
    }
  ].filter((item) => item.url)

  const socialTextRow = socialLinks.length
    ? `<tr><td style="padding-top:5px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${socialLinks
            .map(
              (item) => `<td style="padding-right:5px;vertical-align:middle;">
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
<table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="ltr" style="font-family:Arial,Helvetica,sans-serif;color:#111827;width:${signatureWidth}px;max-width:${signatureWidth}px;height:${signatureHeight}px;overflow:hidden;">
  <tr>
    <td style="vertical-align:top;${dividerPadding}width:${textColumnWidth}px;max-width:${textColumnWidth}px;text-align:${textAlign};unicode-bidi:plaintext;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr><td dir="${nameTitleDirection}" style="font-size:28px;line-height:1.05;font-weight:700;color:${accentColor};padding-bottom:2px;text-align:${nameTitleAlign};unicode-bidi:plaintext;">${fullName || 'שם מלא'}</td></tr>
        <tr><td dir="${nameTitleDirection}" style="font-size:19px;line-height:1.1;font-weight:700;color:#6b6b74;padding-bottom:8px;text-align:${nameTitleAlign};unicode-bidi:plaintext;">${jobTitle || 'מנהל פיתוח אזורי'}${company ? ` | ${company}` : ''}</td></tr>
        ${contactRows.length ? `<tr><td dir="rtl" style="padding-top:1px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" dir="rtl" align="right" style="text-align:right;">${contactRows.join('')}</table></td></tr>` : ''}
        ${socialTextRow}
      </table>
    </td>
    <td style="width:2px;background:#bcbec0;font-size:0;line-height:0;">&nbsp;</td>
    <td style="vertical-align:top;${logoPadding}padding-top:6px;width:${logoColumnWidth}px;max-width:${logoColumnWidth}px;">
      ${
        logoUrl
          ? `<img src="${escapeHtml(logoUrl)}" alt="Company logo" width="122" style="display:block;border:0;max-width:122px;height:auto;" />`
          : `<div style="font-size:14px;color:${accentColor};font-weight:700;">לוגו חברה</div>`
      }
    </td>
  </tr>
</table>`
}

const generate = async (): Promise<void> => {
  await initializeSocialIconDataUrls()
  const html = buildSignatureHtml()
  outputElement.value = html
  previewElement.innerHTML = html
}

const copyOutput = async (): Promise<void> => {
  const value = outputElement.value.trim()
  if (!value) return
  await navigator.clipboard.writeText(value)
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

const downloadOutlookInstaller = (): void => {
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

  const utf8Bytes = new TextEncoder().encode(htmlDocument)
  let binaryHtml = ''
  for (const byte of utf8Bytes) {
    binaryHtml += String.fromCharCode(byte)
  }
  const htmlBase64 = btoa(binaryHtml)
  const scriptContent = `$ErrorActionPreference = "Stop"

$signatureName = "Outlook-Signature"
$signatureDir = Join-Path $env:APPDATA "Microsoft\\Signatures"
$htmlFile = Join-Path $signatureDir "$signatureName.htm"

if (-not (Test-Path $signatureDir)) {
  New-Item -Path $signatureDir -ItemType Directory | Out-Null
}

$htmlBase64 = "${htmlBase64}"
$htmlContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($htmlBase64))
[System.IO.File]::WriteAllText($htmlFile, $htmlContent, [System.Text.Encoding]::UTF8)

Write-Host "Signature installed successfully:" -ForegroundColor Green
Write-Host $htmlFile
Write-Host ""
Write-Host "Next step: open Outlook > File > Options > Mail > Signatures and select '$signatureName'."
`

  const blob = new Blob([scriptContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'install-outlook-signature.ps1'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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
      window.alert('PowerShell installer downloaded. Run install-outlook-signature.ps1 to install your signature in Outlook.')
    })
    .catch(() => {
      window.alert('Could not prepare Outlook installer. Please generate the signature first.')
    })
})
bindFileInputToUrl(inputs.logoFile, inputs.logoUrl)
bindFileInputToUrl(inputs.bannerFile, inputs.bannerUrl)

if (!inputs.logoUrl.value.trim()) {
  inputs.logoUrl.value = DEFAULT_LOGO_DATA_URL
}

addLinkImageRow({ alt: 'Linked image' })
generate().catch(() => {
  // Initial render should not block form usage.
})

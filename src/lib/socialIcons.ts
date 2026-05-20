import { siFacebook, siInstagram, siX, siYoutube } from 'simple-icons'
import { normalizeUrl } from './signatureUtils'

type SocialPlatform = 'Facebook' | 'Instagram' | 'LinkedIn' | 'X' | 'YouTube'

const socialIconDataUrls: Record<SocialPlatform, string> = {
  Facebook: '',
  Instagram: '',
  LinkedIn: '',
  X: '',
  YouTube: ''
}

let socialIconsInitializationPromise: Promise<void> | null = null

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

export const initializeSocialIconDataUrls = async (): Promise<void> => {
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

export const resolveSocialIconUrl = (platform: SocialPlatform, customIconUrl: string): string => {
  const custom = customIconUrl.trim()
  if (custom) {
    return normalizeUrl(custom)
  }
  return socialIconDataUrls[platform]
}

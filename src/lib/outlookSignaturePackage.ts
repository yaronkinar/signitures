import JSZip from 'jszip'
import { signatureStrings } from '../i18n'
import { initializeSocialIconDataUrls } from './socialIcons'
import type { SignatureFormState } from '../types/signatureForm'
import { buildSignatureHtml } from './signatureHtmlBuilder'
import {
  bundleSignatureHtmlImages,
  stripOutlookStoredAssetPathsFromForm,
  type ImageAssetFile
} from './signatureImageAssets'
import { fetchSignatureFontPayloads, getOutlookSignatureFontFileNames } from './fontInstallScripts'
import { getLayoutSettings, normalizeUrl, wrapHtmlDocument } from './signatureUtils'

export type OutlookSignaturePackage = {
  fileBase: string
  htm: string
  txt: string
  rtf: string
  assetFiles: ImageAssetFile[]
}

const sanitizeSignatureName = (value: string): string => {
  const cleaned = value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, ' ')
  return cleaned || 'Outlook-Signature'
}

const isAsciiOnlySignatureName = (value: string): boolean => /^[\x20-\x7E]+$/.test(value)

const hashSignatureFileBase = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `Signature-${(hash >>> 0).toString(36)}`
}

const signatureFileBaseFromEmail = (email: string): string | null => {
  const localPart = email.trim().split('@')[0]?.trim()
  if (!localPart) return null

  const safe = localPart
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (safe.length < 2) return null

  return safe
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

const HEBREW_TO_ASCII_MAP: Record<string, string> = {
  א: 'a',
  ב: 'b',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'ch',
  ט: 't',
  י: 'y',
  כ: 'k',
  ך: 'k',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: 'a',
  פ: 'p',
  ף: 'p',
  צ: 'tz',
  ץ: 'tz',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't'
}

const signatureFileBaseFromFullName = (fullName: string): string | null => {
  const trimmed = fullName.trim()
  if (!trimmed) return null

  const transliterated = [...trimmed]
    .map((char) => HEBREW_TO_ASCII_MAP[char] ?? char)
    .join('')
    .replace(/[^A-Za-z0-9._\s-]+/g, ' ')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (transliterated.length < 2) return null
  return transliterated
}

/** Outlook often fails to register non-ASCII signature file names (Hebrew, etc.). */
export const toOutlookSignatureFileBase = (
  fullName: string,
  email = '',
  outlookSignatureName = ''
): string => {
  const englishName = sanitizeSignatureName(outlookSignatureName)
  if (englishName !== 'Outlook-Signature' && isAsciiOnlySignatureName(englishName)) {
    return englishName
  }

  const cleaned = sanitizeSignatureName(fullName)
  if (isAsciiOnlySignatureName(cleaned)) return cleaned

  const fromEmail = signatureFileBaseFromEmail(email)
  if (fromEmail && isAsciiOnlySignatureName(fromEmail)) return fromEmail

  const fromFullName = signatureFileBaseFromFullName(fullName)
  if (fromFullName && isAsciiOnlySignatureName(fromFullName)) return fromFullName

  return hashSignatureFileBase(cleaned)
}

export const toPlainTextSignature = (form: SignatureFormState): string => {
  const strings = signatureStrings[form.signatureLanguage]
  const lines: string[] = []
  const fullName = form.fullName.trim()
  const roleBits = [form.jobTitle.trim(), form.company.trim()].filter(Boolean)
  const phone = form.phone.trim()
  const email = form.email.trim()
  const website = normalizeUrl(form.website)

  if (fullName) lines.push(fullName)
  if (roleBits.length) lines.push(roleBits.join('\r\n'))
  if (phone) lines.push(`${strings.phoneLabel} ${phone}`)
  if (email) lines.push(`${strings.emailLabel} ${email}`)
  if (website) lines.push(`${strings.websiteLabel} ${website}`)

  return lines.join('\r\n')
}

export const plainTextToRtf = (plainText: string): string => {
  const escaped = plainText
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r\n|\n|\r/g, '\\par ')
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs20 ${escaped}}`
}

const fontPayloadsToAssetFiles = (
  payloads: { fileName: string; base64: string }[]
): ImageAssetFile[] =>
  payloads.map(({ fileName, base64 }) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return {
      relativePath: fileName,
      fileName,
      bytes
    }
  })

export const buildOutlookSignaturePackage = async (
  htmlBody: string,
  form: SignatureFormState,
  fileBaseOverride?: string
): Promise<OutlookSignaturePackage> => {
  await initializeSocialIconDataUrls()
  const installForm = stripOutlookStoredAssetPathsFromForm(form)
  const packageHtmlBody = buildSignatureHtml(installForm, getLayoutSettings(installForm))

  const fileBase =
    fileBaseOverride ??
    toOutlookSignatureFileBase(installForm.fullName, installForm.email, installForm.outlookSignatureName)
  const filesFolderName = `${fileBase}_files`
  const fontFileNames = getOutlookSignatureFontFileNames(installForm)
  const fontPayloads = fontFileNames.length ? await fetchSignatureFontPayloads(fontFileNames) : []
  const { html: bundledHtmlBody, files: imageFiles } = await bundleSignatureHtmlImages(
    packageHtmlBody,
    installForm,
    filesFolderName,
    { embedImages: false }
  )
  const htmlDocument = wrapHtmlDocument(bundledHtmlBody, installForm.signatureLanguage, {
    fontFamily: installForm.fontFamily,
    bundledFontAssetsBase: filesFolderName,
    bundledFontFileNames: fontFileNames
  })

  const txt = toPlainTextSignature(installForm)

  return {
    fileBase,
    htm: htmlDocument,
    txt,
    rtf: plainTextToRtf(txt),
    assetFiles: [...imageFiles, ...fontPayloadsToAssetFiles(fontPayloads)]
  }
}

export const addOutlookSignaturePackageToZip = (zip: JSZip, pkg: OutlookSignaturePackage): void => {
  zip.file(`${pkg.fileBase}.htm`, pkg.htm)
  zip.file(`${pkg.fileBase}.txt`, pkg.txt)
  zip.file(`${pkg.fileBase}.rtf`, pkg.rtf)

  if (!pkg.assetFiles.length) return

  const folder = zip.folder(`${pkg.fileBase}_files`)
  if (!folder) return

  for (const file of pkg.assetFiles) {
    folder.file(file.fileName, file.bytes)
  }
}

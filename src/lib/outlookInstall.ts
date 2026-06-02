import type { AppLanguage } from '../i18n'
import { t } from '../i18n'
import { signatureStrings } from '../i18n'
import type { SignatureFormState } from '../types/signatureForm'
import {
  bundleSignatureHtmlImages,
  imageAssetsToWritePayloads
} from './signatureImageAssets'
import { normalizeUrl, wrapHtmlDocument } from './signatureUtils'
import {
  buildWriteFontFilesPs,
  buildWindowsFontInstallPsForForm,
  fetchSignatureFontPayloads,
  getOutlookSignatureFontFileNames
} from './fontInstallScripts'
import JSZip from 'jszip'
import {
  OUTLOOK_INSTALL_SCRIPT_MARKER,
  POWERSHELL_EXE,
  batUtf8Preamble,
  encodeBatFile,
  prefixPowerShellScript,
  psConsoleMessage,
  psHostStatement,
  psInlinePreamble,
  psReadHostStatement,
  psWarningStatement,
  psWriteErrorStatement
} from './batScriptUtils'

export const NEW_OUTLOOK_SIGNATURE_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/layout/EmailSignature'

const buildBatPauseCommand = (lang: AppLanguage, outcome: 'success' | 'failure'): string => {
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')
  const lines =
    outcome === 'success'
      ? [psConsoleMessage(lang, 'batInstallComplete')]
      : [psConsoleMessage(lang, 'batInstallFailed'), psConsoleMessage(lang, 'batInstallSecurityHint')]
  const writeLines = lines.map((line) => psHostStatement(lang, line)).join('; ')
  return `"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${writeLines}; ${psReadHostStatement(lang, pressEnter)}"`
}

const buildSelfContainedInstallBat = (scriptContent: string, lang: AppLanguage): string => {
  const scriptLines = scriptContent.replace(/\r?\n/g, '\r\n').trimEnd()
  const corruptMsg = psConsoleMessage(lang, 'batInstallerCorrupt')
  const corruptError = psWriteErrorStatement(lang, corruptMsg)

  return `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
set "EC=0"
set "SCRIPT=%TEMP%\\install-outlook-signature-%RANDOM%.ps1"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}$marker='${OUTLOOK_INSTALL_SCRIPT_MARKER}'; $lines=Get-Content -LiteralPath '%~f0' -Encoding UTF8; $start=[Array]::IndexOf($lines,$marker); if ($start -lt 0) { ${corruptError}; exit 1 }; $lines[($start+1)..($lines.Length-1)] | Set-Content -LiteralPath '%SCRIPT%' -Encoding UTF8"
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

  return hashSignatureFileBase(cleaned)
}

const toBase64Utf8 = (value: string): string => {
  const utf8Bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of utf8Bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

const toPlainTextSignature = (form: SignatureFormState): string => {
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

const plainTextToRtf = (plainText: string): string => {
  const escaped = plainText
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\r\n|\n|\r/g, '\\par ')
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs20 ${escaped}}`
}

export const downloadExportSignaturesFolderBat = (lang: AppLanguage): void => {
  const zipCreated = psConsoleMessage(lang, 'batSignaturesZipCreated')
  const zipFailed = psConsoleMessage(lang, 'batSignaturesZipFailed')
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')

  downloadBatFile(
    'export-outlook-signatures.bat',
    `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
set "EC=0"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}$ErrorActionPreference='Stop'; $signatureDir=Join-Path $env:APPDATA 'Microsoft\\Signatures'; if (-not (Test-Path $signatureDir)) { Write-Error 'missing' }; $desktop=[Environment]::GetFolderPath('Desktop'); $stamp=Get-Date -Format 'yyyyMMdd-HHmm'; $zipPath=Join-Path $desktop ('Outlook-Signatures-' + $stamp + '.zip'); if (Test-Path $zipPath) { Remove-Item -LiteralPath $zipPath -Force }; $items=Get-ChildItem -LiteralPath $signatureDir -Force; if (-not $items) { Write-Error 'empty' }; Compress-Archive -LiteralPath ($items | ForEach-Object { $_.FullName }) -DestinationPath $zipPath -Force; ${psHostStatement(lang, zipCreated)}; Write-Host $zipPath; Invoke-Item -LiteralPath $zipPath"
if errorlevel 1 (
  "${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psHostStatement(lang, zipFailed)}; ${psReadHostStatement(lang, pressEnter)}"
  exit /b 1
)
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psReadHostStatement(lang, pressEnter)}"
exit /b 0
`
  )
}

export const downloadOpenSignaturesFolderBat = (lang: AppLanguage): void => {
  const folderOpened = psConsoleMessage(lang, 'batFolderOpened')
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')

  downloadBatFile(
    'open-signatures-folder.bat',
    `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
if not exist "%APPDATA%\\Microsoft\\Signatures" mkdir "%APPDATA%\\Microsoft\\Signatures" 2>nul
start "" "%SystemRoot%\\explorer.exe" "%APPDATA%\\Microsoft\\Signatures"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psHostStatement(lang, folderOpened)}; ${psReadHostStatement(lang, pressEnter)}"
exit /b 0
`
  )
}

export const downloadOutlookInstaller = async (
  htmlBody: string,
  form: SignatureFormState
): Promise<void> => {
  const lang = form.signatureLanguage
  const signatureName = toOutlookSignatureFileBase(
    form.fullName,
    form.email,
    form.outlookSignatureName
  )
  const filesFolderName = `${signatureName}_files`
  const fontFileNames = getOutlookSignatureFontFileNames(form)
  const fontPayloads = fontFileNames.length ? await fetchSignatureFontPayloads(fontFileNames) : []
  const { html: bundledHtmlBody, files: imageFiles } = bundleSignatureHtmlImages(
    htmlBody,
    form,
    filesFolderName
  )
  const imagePayloads = imageAssetsToWritePayloads(imageFiles)
  const htmlDocument = wrapHtmlDocument(bundledHtmlBody, lang, {
    fontFamily: form.fontFamily,
    bundledFontAssetsBase: filesFolderName,
    bundledFontFileNames: fontFileNames
  })
  const txtDocument = toPlainTextSignature(form)
  const rtfDocument = plainTextToRtf(txtDocument)
  const htmlBase64 = toBase64Utf8(htmlDocument)
  const txtBase64 = toBase64Utf8(txtDocument)
  const rtfBase64 = toBase64Utf8(rtfDocument)
  const writeFontFilesPs = buildWriteFontFilesPs('$filesDir', fontPayloads)
  const writeImageFilesPs = buildWriteFontFilesPs('$filesDir', imagePayloads)
  const writeAssetFilesPs = [writeFontFilesPs, writeImageFilesPs].filter(Boolean).join('\n')
  const windowsFontInstallPs = await buildWindowsFontInstallPsForForm(lang, form)
  const installSuccessLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsInstallSuccess'), {
    foregroundColor: 'Green'
  })
  const setDefaultLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsSetDefault'))
  const restartOutlookLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsRestartOutlook'))
  const classicNoteLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsClassicNote'))

  const scriptContent = prefixPowerShellScript(
    lang,
    `$ErrorActionPreference = "Stop"

${windowsFontInstallPs ? `${windowsFontInstallPs}\n` : ''}$signatureName = "${signatureName.replace(/"/g, "'")}"
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
${writeAssetFilesPs ? `\n${writeAssetFilesPs}\n` : ''}
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

$outlookSetupPaths = @(
  "HKCU:\\Software\\Microsoft\\Office\\16.0\\Outlook\\Setup",
  "HKCU:\\Software\\Microsoft\\Office\\15.0\\Outlook\\Setup"
)
foreach ($path in $outlookSetupPaths) {
  if (-not (Test-Path $path)) {
    New-Item -Path $path -Force | Out-Null
  }
  New-ItemProperty -Path $path -Name "DisableRoamingSignatures" -Value 1 -PropertyType DWord -Force | Out-Null
}

${installSuccessLine}
Write-Host $htmlFile
Write-Host ""
${setDefaultLine}
${restartOutlookLine}
${classicNoteLine}
`
  )
  downloadBatFile('install-outlook-signature.bat', buildSelfContainedInstallBat(scriptContent, lang))
}

export const copyHtmlForPasting = async (html: string): Promise<boolean> => {
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
      // Fallback below.
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

export const installForNewOutlook = async (htmlBody: string, lang: AppLanguage): Promise<void> => {
  const richCopied = await copyHtmlForPasting(htmlBody)
  const popup = window.open(NEW_OUTLOOK_SIGNATURE_SETTINGS_URL, '_blank', 'noopener,noreferrer')
  const openedSettings = !!popup

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

export const downloadHtmlOutput = async (
  htmlBody: string,
  lang: AppLanguage,
  fontFamily?: string,
  form?: SignatureFormState
): Promise<void> => {
  const assetsFolder = 'images'
  const { html: bundledHtmlBody, files: imageFiles } = form
    ? bundleSignatureHtmlImages(htmlBody, form, assetsFolder)
    : { html: htmlBody, files: [] }
  const htmlDocument = wrapHtmlDocument(bundledHtmlBody, lang, fontFamily)

  if (!imageFiles.length) {
    const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'outlook-signature.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    return
  }

  const zip = new JSZip()
  zip.file('outlook-signature.html', htmlDocument)
  for (const file of imageFiles) {
    zip.folder(assetsFolder)?.file(file.fileName, file.bytes)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipUrl = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = zipUrl
  link.download = 'outlook-signature.zip'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(zipUrl)
}

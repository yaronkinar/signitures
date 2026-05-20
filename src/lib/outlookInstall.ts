import type { AppLanguage, I18nKey } from '../i18n'
import { t } from '../i18n'
import { signatureStrings } from '../i18n'
import type { SignatureFormState } from '../types/signatureForm'
import { normalizeUrl, wrapHtmlDocument } from './signatureUtils'

export const NEW_OUTLOOK_SIGNATURE_SETTINGS_URL =
  'https://outlook.office.com/mail/options/mail/layout/EmailSignature'

const OUTLOOK_INSTALL_SCRIPT_MARKER = '# SIGSCRIPT'
const POWERSHELL_EXE = '%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

const escapePsSingleQuoted = (value: string): string => value.replace(/'/g, "''")

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

export const downloadOpenSignaturesFolderBat = (lang: AppLanguage): void => {
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

export const downloadOutlookInstaller = (
  htmlBody: string,
  form: SignatureFormState
): void => {
  const lang = form.signatureLanguage
  const signatureName = sanitizeSignatureName(form.fullName)
  const htmlDocument = wrapHtmlDocument(htmlBody, lang)
  const txtDocument = toPlainTextSignature(form)
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

export const downloadHtmlOutput = (htmlBody: string, lang: AppLanguage): void => {
  const htmlDocument = wrapHtmlDocument(htmlBody, lang)
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

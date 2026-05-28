import type { AppLanguage } from '../i18n'
import { t } from '../i18n'
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
import {
  getBundledFontCssFamily,
  requiredBundledFontFileNames,
  requiredWindowsFontTtfFileNames,
  signatureFontPublicUrl,
  signatureFontTtfPublicUrl
} from './signatureFonts'
import type { SignatureFormState } from '../types/signatureForm'

export type FontFilePayload = {
  fileName: string
  base64: string
}

const buildSelfContainedInstallBat = (
  scriptContent: string,
  lang: AppLanguage,
  successKey: Parameters<typeof t>[1],
  failureKey: Parameters<typeof t>[1]
): string => {
  const scriptLines = scriptContent.replace(/\r?\n/g, '\r\n').trimEnd()
  const corruptMsg = psConsoleMessage(lang, 'batInstallerCorrupt')
  const corruptError = psWriteErrorStatement(lang, corruptMsg)
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')

  return `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
set "EC=0"
set "SCRIPT=%TEMP%\\install-font-%RANDOM%.ps1"
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}$marker='${OUTLOOK_INSTALL_SCRIPT_MARKER}'; $lines=Get-Content -LiteralPath '%~f0' -Encoding UTF8; $start=[Array]::IndexOf($lines,$marker); if ($start -lt 0) { ${corruptError}; exit 1 }; $lines[($start+1)..($lines.Length-1)] | Set-Content -LiteralPath '%SCRIPT%' -Encoding UTF8"
if errorlevel 1 set "EC=1" & goto :finish
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT%"
set "EC=%ERRORLEVEL%"
del "%SCRIPT%" 2>nul
:finish
if "%EC%"=="0" (
  "${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psHostStatement(lang, psConsoleMessage(lang, successKey))}; ${psReadHostStatement(lang, pressEnter)}"
) else (
  "${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psHostStatement(lang, psConsoleMessage(lang, failureKey))}; ${psReadHostStatement(lang, pressEnter)}"
)
exit /b %EC%

goto :eof
${OUTLOOK_INSTALL_SCRIPT_MARKER}
${scriptLines}
`
}

const downloadBatFile = (
  filename: string,
  scriptContent: string,
  lang: AppLanguage,
  successKey: Parameters<typeof t>[1],
  failureKey: Parameters<typeof t>[1]
): void => {
  const blob = new Blob([encodeBatFile(buildSelfContainedInstallBat(scriptContent, lang, successKey, failureKey))], {
    type: 'application/octet-stream'
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const toBase64Bytes = (bytes: Uint8Array): string => {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

const fetchFontPayloads = async (fileNames: string[], urlForFile: (fileName: string) => string): Promise<FontFilePayload[]> =>
  Promise.all(
    fileNames.map(async (fileName) => {
      const response = await fetch(urlForFile(fileName))
      if (!response.ok) {
        throw new Error(`Missing font file: ${fileName}`)
      }
      const bytes = new Uint8Array(await response.arrayBuffer())
      return { fileName, base64: toBase64Bytes(bytes) }
    })
  )

export const fetchSignatureFontPayloads = async (fileNames: string[]): Promise<FontFilePayload[]> =>
  fetchFontPayloads(fileNames, signatureFontPublicUrl)

export const fetchWindowsFontTtfPayloads = async (fileNames: string[]): Promise<FontFilePayload[]> =>
  fetchFontPayloads(fileNames, signatureFontTtfPublicUrl)

export const getOutlookSignatureFontFileNames = (form: SignatureFormState): string[] =>
  requiredBundledFontFileNames(form.fontFamily, [
    form.nameFontWeight,
    form.titleFontWeight,
    form.bodyFontWeight
  ])

export const getWindowsFontTtfFileNames = (form: SignatureFormState): string[] =>
  requiredWindowsFontTtfFileNames(form.fontFamily)

export const buildWriteFontFilesPs = (
  targetDirPsVar: string,
  payloads: FontFilePayload[]
): string => {
  if (!payloads.length) return ''
  return payloads
    .map(
      ({ fileName, base64 }) =>
        `$fontPath = Join-Path ${targetDirPsVar} "${fileName.replace(/"/g, '`"')}"
[System.IO.File]::WriteAllBytes($fontPath, [System.Convert]::FromBase64String(@'
${base64}
'@))`
    )
    .join('\n')
}

export const buildWindowsFontInstallPs = (
  lang: AppLanguage,
  payloads: FontFilePayload[]
): string | null => {
  if (!payloads.length) return null

  const writeFontFilesPs = buildWriteFontFilesPs('$fontTempDir', payloads)
  const installingLine = psHostStatement(lang, psConsoleMessage(lang, 'batWindowsFontInstalling'), {
    foregroundColor: 'Cyan'
  })
  const successLine = psHostStatement(lang, psConsoleMessage(lang, 'batWindowsFontSuccess'), {
    foregroundColor: 'Green'
  })
  const skippedPrefix = psConsoleMessage(lang, 'batWindowsFontInstallSkipped')

  return `try {
  ${installingLine}
  $fontTempDir = Join-Path $env:TEMP ("signature-font-install-" + [Guid]::NewGuid().ToString())
  New-Item -Path $fontTempDir -ItemType Directory | Out-Null
${writeFontFilesPs}

  $fontFiles = Get-ChildItem -LiteralPath $fontTempDir -File -Include *.ttf,*.otf
  if (-not $fontFiles -or $fontFiles.Count -eq 0) {
    throw '${psConsoleMessage(lang, 'batWindowsFontMissingFiles')}'
  }

  $shell = New-Object -ComObject Shell.Application
  $fontsFolder = $shell.Namespace(0x14)
  if (-not $fontsFolder) {
    throw '${psConsoleMessage(lang, 'batWindowsFontFolderFailed')}'
  }

  foreach ($fontFile in $fontFiles) {
    $fontsFolder.CopyHere($fontFile.FullName, 0x10)
  }

  Remove-Item -LiteralPath $fontTempDir -Recurse -Force -ErrorAction SilentlyContinue
  ${successLine}
} catch {
  if (Test-Path $fontTempDir) {
    Remove-Item -LiteralPath $fontTempDir -Recurse -Force -ErrorAction SilentlyContinue
  }
  ${psWarningStatement(lang, skippedPrefix, '$_.Exception.Message')}
}`
}

export const buildWindowsFontInstallPsForForm = async (
  lang: AppLanguage,
  form: SignatureFormState
): Promise<string | null> => {
  const fileNames = getWindowsFontTtfFileNames(form)
  if (!fileNames.length) return null
  const payloads = await fetchWindowsFontTtfPayloads(fileNames)
  return buildWindowsFontInstallPs(lang, payloads)
}

export const downloadWindowsFontInstaller = async (form: SignatureFormState): Promise<void> => {
  const lang = form.signatureLanguage
  const fontInstallPs = await buildWindowsFontInstallPsForForm(lang, form)
  const cssFamily = getBundledFontCssFamily(form.fontFamily)
  if (!fontInstallPs || !cssFamily) return

  const scriptContent = prefixPowerShellScript(
    lang,
    `$ErrorActionPreference = "Stop"
${fontInstallPs}
${psHostStatement(lang, psConsoleMessage(lang, 'batWindowsFontRestartOutlook'))}`
  )

  downloadBatFile(
    `install-${cssFamily.toLowerCase()}-font.bat`,
    scriptContent,
    lang,
    'batWindowsFontDone',
    'batWindowsFontFailed'
  )
}

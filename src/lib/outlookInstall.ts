import type { AppLanguage } from '../i18n'
import { t } from '../i18n'
import type { SignatureFormState } from '../types/signatureForm'
import { bundleSignatureHtmlImages, imageAssetsToWritePayloads } from './signatureImageAssets'
import { wrapHtmlDocument } from './signatureUtils'
import {
  addOutlookSignaturePackageToZip,
  buildOutlookSignaturePackage,
  toOutlookSignatureFileBase
} from './outlookSignaturePackage'
import { buildWriteFontFilesPs, buildWindowsFontInstallPsForForm } from './fontInstallScripts'
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

export { toOutlookSignatureFileBase } from './outlookSignaturePackage'

const toBase64Utf8 = (value: string): string => {
  const utf8Bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of utf8Bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export const downloadExportSignaturesFolderBat = async (
  htmlBody: string,
  form: SignatureFormState
): Promise<void> => {
  const pkg = await buildOutlookSignaturePackage(htmlBody, form)
  const zip = new JSZip()
  addOutlookSignaturePackageToZip(zip, pkg)
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const zipUrl = URL.createObjectURL(zipBlob)
  const link = document.createElement('a')
  link.href = zipUrl
  link.download = `${pkg.fileBase}-outlook-signature.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(zipUrl)
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

export type OutlookInstallOptions = {
  /** Close and reopen Outlook after writing signature files. */
  restartOutlook?: boolean
  /** Install Rubik/Cairo on Windows before writing the signature. */
  installFont?: boolean
  /** After save, attempt to launch the installer on Windows (default true). */
  autoRun?: boolean
  /** When set, write here instead of opening a picker or downloading. */
  fileHandle?: FileSystemFileHandle
}

const OUTLOOK_INSTALLER_SAVE_TYPES = [
  { description: 'Batch file', accept: { 'application/x-bat': ['.bat'] } }
] as const

export const canPickOutlookInstallerSaveLocation = (): boolean =>
  typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function'

/** Open a save dialog during a user gesture (call before slow async work). */
export const pickOutlookInstallerSaveLocation = async (): Promise<FileSystemFileHandle> => {
  const savePicker = window.showSaveFilePicker
  if (!savePicker) {
    throw new DOMException('Save picker is not available', 'NotSupportedError')
  }
  return savePicker({
    suggestedName: INSTALLER_FILE_NAME,
    types: [...OUTLOOK_INSTALLER_SAVE_TYPES]
  })
}

export type OutlookInstallerSaveResult = {
  fileName: string
  /** User-facing hint: folder name or file name from save picker. */
  locationHint: string
  usedSavePicker: boolean
}

const OUTLOOK_INSTALL_PROTOCOL = 'outlook-signature-install'
const OUTLOOK_INSTALL_LOCAL_DIR = 'outlook-signature-install'
const INSTALLER_FILE_NAME = 'install-outlook-signature.bat'

export const isWindowsPlatform = (): boolean => /Windows/i.test(navigator.userAgent)

export const downloadOpenDownloadsFolderBat = (lang: AppLanguage): void => {
  const folderOpened = psConsoleMessage(lang, 'batDownloadsFolderOpened')
  const pressEnter = psConsoleMessage(lang, 'batPressEnterToClose')

  downloadBatFile(
    'open-downloads-folder.bat',
    `@echo off
setlocal
${batUtf8Preamble(lang)}cd /d "%~dp0"
start "" explorer.exe shell:Downloads
"${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -Command "${psInlinePreamble(lang)}${psHostStatement(lang, folderOpened)}; ${psReadHostStatement(lang, pressEnter)}"
exit /b 0
`
  )
}

const buildOutlookInstallScriptContent = async (
  htmlBody: string,
  form: SignatureFormState,
  options: OutlookInstallOptions = {}
): Promise<string> => {
  const lang = form.signatureLanguage
  const restartOutlook = options.restartOutlook !== false
  const installFont = options.installFont === true
  const logoSide = form.logoSide === 'left' ? 'left' : form.logoSide === 'top' ? 'top' : form.logoSide === 'bottom' ? 'bottom' : form.logoSide === 'none' ? 'none' : 'right'
  const pkg = await buildOutlookSignaturePackage(htmlBody, form)
  const signatureName = pkg.fileBase
  const htmlBase64 = toBase64Utf8(pkg.htm)
  const txtBase64 = toBase64Utf8(pkg.txt)
  const rtfBase64 = toBase64Utf8(pkg.rtf)
  const writeAssetFilesPs = buildWriteFontFilesPs('$filesDir', imageAssetsToWritePayloads(pkg.assetFiles))
  const windowsFontInstallPs = installFont ? await buildWindowsFontInstallPsForForm(lang, form) : ''
  const closingOutlookLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsClosingOutlook'))
  const startingOutlookLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsStartingOutlook'))
  const restartOutlookPs = restartOutlook
    ? `$shouldRestartOutlook = $true
${closingOutlookLine}
Get-Process -Name OUTLOOK -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
`
    : `$shouldRestartOutlook = $false
`
  const installSuccessLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsInstallSuccess'), {
    foregroundColor: 'Green'
  })
  const setDefaultLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsSetDefault'))
  const restartOutlookLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsRestartOutlook'))
  const classicNoteLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsClassicNote'))
  const installZipCreatedLine = psHostStatement(lang, psConsoleMessage(lang, 'batPsInstallZipCreated'), {
    foregroundColor: 'Green'
  })
  const installZipFailedPrefix = psConsoleMessage(lang, 'batPsInstallZipFailed')
  const installMissingAssetRefsPrefix = psConsoleMessage(lang, 'batPsInstallMissingAssetRefs')
  const installCorruptPrefix = psConsoleMessage(lang, 'batInstallerCorrupt')

  return prefixPowerShellScript(
    lang,
    `$ErrorActionPreference = "Stop"

${restartOutlookPs}${windowsFontInstallPs ? `${windowsFontInstallPs}\n` : ''}$signatureName = "${signatureName.replace(/"/g, "'")}"
$signatureDir = Join-Path $env:APPDATA "Microsoft\\Signatures"
$htmlFile = Join-Path $signatureDir "$signatureName.htm"
$txtFile = Join-Path $signatureDir "$signatureName.txt"
$rtfFile = Join-Path $signatureDir "$signatureName.rtf"
$filesDir = Join-Path $signatureDir "$($signatureName)_files"
$scriptSourcePath = $MyInvocation.MyCommand.Path
if ($scriptSourcePath -and (Test-Path -LiteralPath $scriptSourcePath)) {
  $scriptSourceContent = [System.IO.File]::ReadAllText($scriptSourcePath)
  if ($scriptSourceContent -match '(?i)\\bundefined\\b') {
    ${psWriteErrorStatement(lang, installCorruptPrefix)}
    exit 1
  }
}

if (-not (Test-Path $signatureDir)) {
  New-Item -Path $signatureDir -ItemType Directory | Out-Null
}
if (Test-Path $filesDir) {
  Remove-Item -LiteralPath $filesDir -Recurse -Force
}
New-Item -Path $filesDir -ItemType Directory | Out-Null

$htmlBase64 = "${htmlBase64}"
$txtBase64 = "${txtBase64}"
$rtfBase64 = "${rtfBase64}"
$htmlContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($htmlBase64))
$txtContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($txtBase64))
$rtfContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($rtfBase64))
[System.IO.File]::WriteAllText($txtFile, $txtContent, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($rtfFile, $rtfContent, [System.Text.Encoding]::UTF8)
${writeAssetFilesPs ? `\n${writeAssetFilesPs}\n` : ''}
$imageFileCount = (Get-ChildItem -LiteralPath $filesDir -File -Include *.png,*.jpg,*.jpeg,*.gif,*.webp,*.svg -ErrorAction SilentlyContinue | Measure-Object).Count
if ($imageFileCount -lt 1) {
  ${psWarningStatement(lang, 'batPsInstallNoImages', '$imageFileCount')}
}
$missingAssetRefs = New-Object 'System.Collections.Generic.List[string]'
$assetRefPattern = '(?i)<img\\b[^>]*\\bsrc\\s*=\\s*["'']([^"'']+)["'']'
$assetRefMatches = [System.Text.RegularExpressions.Regex]::Matches($htmlContent, $assetRefPattern)
foreach ($match in $assetRefMatches) {
  $srcValue = $match.Groups[1].Value
  if (-not $srcValue) { continue }
  if ($srcValue.StartsWith('data:', [System.StringComparison]::OrdinalIgnoreCase)) { continue }
  if ($srcValue -match '^[a-zA-Z][a-zA-Z0-9+.-]*:') { continue }
  if ($srcValue -match '^[\\/]{2}') { continue }
  if ($srcValue -notmatch '(?i)(^|[\\/])[^\\/]+_files[\\/]') { continue }
  $normalizedPath = $srcValue -replace '/', '\\'
  $fileName = [System.IO.Path]::GetFileName($normalizedPath)
  if (-not $fileName) { continue }
  $expectedPath = Join-Path $filesDir $fileName
  if (-not (Test-Path -LiteralPath $expectedPath)) {
    [void]$missingAssetRefs.Add($srcValue)
  }
}
if ($missingAssetRefs.Count -gt 0) {
  ${psWarningStatement(lang, installMissingAssetRefsPrefix, "''")}
  Write-Host ""
  Write-Host "Missing image asset references detected in HTML:"
  foreach ($missingRef in $missingAssetRefs) {
    Write-Host (" - " + $missingRef)
  }
  Write-Host ""
}
[System.IO.File]::WriteAllText($htmlFile, $htmlContent, [System.Text.Encoding]::UTF8)
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
Write-Host "Install layout logo side: ${logoSide}"
Write-Host $htmlFile
Write-Host ""
try {
  $zipDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Signatures'
  if (-not (Test-Path -LiteralPath $zipDir)) {
    New-Item -Path $zipDir -ItemType Directory -Force | Out-Null
  }
  $zipPath = Join-Path $zipDir ($signatureName + '-outlook-signature.zip')
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  $zipItems = @($htmlFile, $txtFile, $rtfFile)
  if (Test-Path -LiteralPath $filesDir) {
    $zipItems += $filesDir
  }
  Compress-Archive -LiteralPath $zipItems -DestinationPath $zipPath -Force
  ${installZipCreatedLine}
  Write-Host $zipPath
  Write-Host ""
} catch {
  ${psWarningStatement(lang, installZipFailedPrefix, '$_.Exception.Message')}
}
${setDefaultLine}
${restartOutlook ? '' : `${restartOutlookLine}\n`}${classicNoteLine}
if ($shouldRestartOutlook) {
  ${startingOutlookLine}
  $outlookCandidates = @(
    (Join-Path $env:ProgramFiles "Microsoft Office\\root\\Office16\\OUTLOOK.EXE"),
    (Join-Path \${env:ProgramFiles(x86)} "Microsoft Office\\root\\Office16\\OUTLOOK.EXE"),
    (Join-Path $env:ProgramFiles "Microsoft Office\\Office16\\OUTLOOK.EXE"),
    (Join-Path \${env:ProgramFiles(x86)} "Microsoft Office\\Office16\\OUTLOOK.EXE")
  )
  $outlookExe = $outlookCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
  if ($outlookExe) {
    Start-Process -FilePath $outlookExe
  } else {
    Start-Process -FilePath "outlook" -ErrorAction SilentlyContinue
  }
} else {
  ${restartOutlookLine}
}

try {
  $oneClickDir = Join-Path $env:LOCALAPPDATA "${OUTLOOK_INSTALL_LOCAL_DIR}"
  if (-not (Test-Path -LiteralPath $oneClickDir)) {
    New-Item -Path $oneClickDir -ItemType Directory -Force | Out-Null
  }
  if ($scriptSourcePath -and (Test-Path -LiteralPath $scriptSourcePath)) {
    Copy-Item -LiteralPath $scriptSourcePath -Destination (Join-Path $oneClickDir "${INSTALLER_FILE_NAME}") -Force
  }
  $launchPs1 = @'
$bat = Join-Path (Join-Path $env:LOCALAPPDATA '${OUTLOOK_INSTALL_LOCAL_DIR}') '${INSTALLER_FILE_NAME}'
if (Test-Path -LiteralPath $bat) {
  Start-Process -FilePath $bat -Wait
}
'@
  Set-Content -LiteralPath (Join-Path $oneClickDir 'launch.ps1') -Value $launchPs1 -Encoding UTF8
  $protocol = '${OUTLOOK_INSTALL_PROTOCOL}'
  New-Item -Path ("HKCU:\\Software\\Classes\\" + $protocol) -Force | Out-Null
  New-ItemProperty -Path ("HKCU:\\Software\\Classes\\" + $protocol) -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
  $psExe = (Get-Command powershell.exe).Source
  $launchFile = Join-Path $oneClickDir 'launch.ps1'
  $handler = '"' + $psExe + '" -NoProfile -ExecutionPolicy Bypass -File "' + $launchFile + '"'
  New-Item -Path ("HKCU:\\Software\\Classes\\" + $protocol + "\\shell\\open\\command") -Force | Out-Null
  Set-Item -Path ("HKCU:\\Software\\Classes\\" + $protocol + "\\shell\\open\\command") -Value $handler
} catch {
}
`
  )
}

const writeOutlookInstallerBytes = async (
  bytes: Uint8Array,
  batContent: string,
  fileName: string,
  fileHandle?: FileSystemFileHandle
): Promise<OutlookInstallerSaveResult> => {
  if (fileHandle) {
    const writable = await fileHandle.createWritable()
    await writable.write(bytes)
    await writable.close()
    return {
      fileName: fileHandle.name || fileName,
      locationHint: fileHandle.name || fileName,
      usedSavePicker: true
    }
  }

  const savePicker = window.showSaveFilePicker
  if (savePicker) {
    try {
      const handle = await savePicker({
        suggestedName: fileName,
        types: [...OUTLOOK_INSTALLER_SAVE_TYPES]
      })
      return writeOutlookInstallerBytes(bytes, batContent, fileName, handle)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error
      }
    }
  }

  downloadBatFile(fileName, batContent)
  return {
    fileName,
    locationHint: 'Downloads',
    usedSavePicker: false
  }
}

export const saveOutlookInstaller = async (
  htmlBody: string,
  form: SignatureFormState,
  options: OutlookInstallOptions = {}
): Promise<OutlookInstallerSaveResult> => {
  const lang = form.signatureLanguage
  const autoRun = options.autoRun !== false && isWindowsPlatform() && !options.fileHandle
  const scriptContent = await buildOutlookInstallScriptContent(htmlBody, form, options)
  const batContent = buildSelfContainedInstallBat(scriptContent, lang)
  const fileName = INSTALLER_FILE_NAME
  const bytes = encodeBatFile(batContent)

  // Wizard flow: one download to Downloads, no blocking pickers behind the modal.
  if (autoRun) {
    downloadBatFile(fileName, batContent)
    return {
      fileName,
      locationHint: 'Downloads',
      usedSavePicker: false
    }
  }

  return writeOutlookInstallerBytes(bytes, batContent, fileName, options.fileHandle)
}

/** @deprecated Prefer saveOutlookInstaller with OutlookInstallOptions. */
export const downloadOutlookInstaller = async (
  htmlBody: string,
  form: SignatureFormState,
  options: OutlookInstallOptions = {}
): Promise<void> => {
  await saveOutlookInstaller(htmlBody, form, options)
}

export const prepareHtmlForOutlookPaste = async (
  htmlBody: string,
  form: SignatureFormState
): Promise<string> => {
  const { html } = await bundleSignatureHtmlImages(htmlBody, form, 'images', {
    embedImages: true
  })
  return html
}

export const copySignatureForOutlookPaste = async (
  htmlBody: string,
  form: SignatureFormState
): Promise<boolean> => {
  const html = await prepareHtmlForOutlookPaste(htmlBody, form)
  return copyHtmlForPasting(html)
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

export const installForNewOutlook = async (
  htmlBody: string,
  lang: AppLanguage,
  form?: SignatureFormState
): Promise<void> => {
  const htmlForClipboard =
    form != null ? await prepareHtmlForOutlookPaste(htmlBody, form) : htmlBody

  const richCopied = await copyHtmlForPasting(htmlForClipboard)
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
    ? await bundleSignatureHtmlImages(htmlBody, form, assetsFolder, { embedImages: true })
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

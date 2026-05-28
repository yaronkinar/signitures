import type { AppLanguage, I18nKey } from '../i18n'
import { t } from '../i18n'

export const OUTLOOK_INSTALL_SCRIPT_MARKER = '# SIGSCRIPT'
export const POWERSHELL_EXE = '%SystemRoot%\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

const HEBREW_RUN = /[\u0590-\u05FF\uFB1D-\uFB4F]+/g

/** Reverse Hebrew runs so legacy cmd.exe (LTR) displays them correctly. */
export const fixConsoleHebrewForCmd = (text: string): string =>
  text.replace(HEBREW_RUN, (run) => [...run].reverse().join(''))

export const escapePsSingleQuoted = (value: string): string => value.replace(/'/g, "''")

export const psConsoleMessage = (lang: AppLanguage, key: I18nKey): string => {
  const message = t(lang, key)
  const display = lang === 'he' ? fixConsoleHebrewForCmd(message) : message
  return escapePsSingleQuoted(display)
}

export const batUtf8Preamble = (lang: AppLanguage): string =>
  lang === 'he' ? 'chcp 65001 >nul\r\n' : ''

export const psUtf8Preamble = (lang: AppLanguage): string =>
  lang === 'he'
    ? "[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)\n[Console]::InputEncoding = [Text.UTF8Encoding]::new($false)\n"
    : ''

export const psInlinePreamble = (lang: AppLanguage): string =>
  lang === 'he' ? '[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false); ' : ''

export const psHostStatement = (
  lang: AppLanguage,
  message: string,
  options?: { foregroundColor?: string }
): string => {
  if (options?.foregroundColor) {
    return `Write-Host '${message}' -ForegroundColor ${options.foregroundColor}`
  }
  return `Write-Host '${message}'`
}

export const psReadHostStatement = (lang: AppLanguage, message: string): string =>
  `Read-Host '${message}'`

export const psWarningStatement = (lang: AppLanguage, prefix: string, suffixPs: string): string =>
  `Write-Warning ('${prefix}' + ${suffixPs})`

export const psWriteErrorStatement = (lang: AppLanguage, message: string): string =>
  `Write-Error '${message}'`

export const encodeBatFile = (content: string): Uint8Array => {
  const normalized = content.replace(/\r?\n/g, '\r\n')
  const body = new TextEncoder().encode(normalized)
  const bom = new Uint8Array([0xef, 0xbb, 0xbf])
  const out = new Uint8Array(bom.length + body.length)
  out.set(bom, 0)
  out.set(body, bom.length)
  return out
}

export const prefixPowerShellScript = (lang: AppLanguage, script: string): string =>
  `${psUtf8Preamble(lang)}${script}`

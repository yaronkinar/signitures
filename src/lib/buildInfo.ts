import type { AppLanguage } from '../i18n'

const version = import.meta.env.VITE_APP_VERSION ?? 'dev'
const buildTime = import.meta.env.VITE_BUILD_TIME ?? ''

export function formatBuildStamp(lang: AppLanguage): string {
  if (!buildTime) return `v${version}`
  const date = new Date(buildTime)
  if (Number.isNaN(date.getTime())) return `v${version}`
  const when = date.toLocaleString(lang === 'he' ? 'he-IL' : 'en-GB', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
  return `v${version} · ${when}`
}

export function buildStampTitle(): string {
  if (!buildTime) return `Version ${version}`
  return `Version ${version} — built ${buildTime}`
}

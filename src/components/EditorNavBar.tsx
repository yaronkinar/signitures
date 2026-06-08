import { type RefObject, useEffect, useState } from 'react'
import { scrollToPanel } from '../lib/scrollToPanel'
import { t, type AppLanguage, type I18nKey } from '../i18n'

type NavItem = {
  id: string
  labelKey: I18nKey
  shortLabelKey: I18nKey
}

const NAV_ITEMS: NavItem[] = [
  { id: 'panel-preview', labelKey: 'navPreview', shortLabelKey: 'navPreviewShort' },
  { id: 'panel-ai', labelKey: 'aiDesignAssistant', shortLabelKey: 'navAiShort' },
  { id: 'panel-contact', labelKey: 'contactDetails', shortLabelKey: 'navContactShort' },
  { id: 'panel-bulk', labelKey: 'bulkSignatures', shortLabelKey: 'navBulkShort' },
  { id: 'panel-logo', labelKey: 'logoBanner', shortLabelKey: 'navLogoShort' },
  { id: 'panel-social', labelKey: 'socialMedia', shortLabelKey: 'navSocialShort' },
  { id: 'panel-layout', labelKey: 'layoutTypography', shortLabelKey: 'navLayoutShort' },
  { id: 'panel-position', labelKey: 'positionAlignment', shortLabelKey: 'navPositionShort' },
  { id: 'panel-colors', labelKey: 'colors', shortLabelKey: 'navColorsShort' },
  { id: 'panel-linked-images', labelKey: 'extraLinkedImages', shortLabelKey: 'navImagesShort' },
  { id: 'panel-install', labelKey: 'installGuide', shortLabelKey: 'navInstallShort' }
]

const COMPACT_NAV_QUERY = '(max-width: 640px)'

type EditorNavBarProps = {
  lang: AppLanguage
  scrollContainerRef: RefObject<HTMLElement | null>
  usePageScroll?: boolean
}

export const EditorNavBar = ({
  lang,
  scrollContainerRef,
  usePageScroll = false
}: EditorNavBarProps) => {
  const [compactNav, setCompactNav] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(COMPACT_NAV_QUERY).matches
  )

  useEffect(() => {
    const media = window.matchMedia(COMPACT_NAV_QUERY)
    const onChange = () => setCompactNav(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const scrollOptions = { usePageScroll, scrollPadding: usePageScroll ? 56 : 12 }

  const handleNavClick = (item: NavItem) => {
    if (item.id === 'panel-preview') {
      if (usePageScroll) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        document.querySelector('.preview-main')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        return
      }
      scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
      document.querySelector('.preview-main')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      return
    }
    scrollToPanel(item.id, scrollContainerRef.current, scrollOptions)
  }

  return (
    <nav className="app-navbar" aria-label={t(lang, 'navSectionsLabel')}>
      <div className="app-navbar-scroll">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="app-nav-link"
            aria-label={compactNav ? t(lang, item.labelKey) : undefined}
            onClick={() => handleNavClick(item)}
          >
            {t(lang, compactNav ? item.shortLabelKey : item.labelKey)}
          </button>
        ))}
      </div>
    </nav>
  )
}

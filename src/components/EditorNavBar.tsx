import { type RefObject } from 'react'
import { scrollToPanel } from '../lib/scrollToPanel'
import { t, type AppLanguage, type I18nKey } from '../i18n'

type NavItem = {
  id: string
  labelKey: I18nKey
}

const NAV_ITEMS: NavItem[] = [
  { id: 'panel-preview', labelKey: 'navPreview' },
  { id: 'panel-ai', labelKey: 'aiDesignAssistant' },
  { id: 'panel-contact', labelKey: 'contactDetails' },
  { id: 'panel-bulk', labelKey: 'bulkSignatures' },
  { id: 'panel-logo', labelKey: 'logoBanner' },
  { id: 'panel-social', labelKey: 'socialMedia' },
  { id: 'panel-layout', labelKey: 'layoutTypography' },
  { id: 'panel-position', labelKey: 'positionAlignment' },
  { id: 'panel-colors', labelKey: 'colors' },
  { id: 'panel-linked-images', labelKey: 'extraLinkedImages' },
  { id: 'panel-install', labelKey: 'installGuide' }
]

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
            onClick={() => handleNavClick(item)}
          >
            {t(lang, item.labelKey)}
          </button>
        ))}
      </div>
    </nav>
  )
}

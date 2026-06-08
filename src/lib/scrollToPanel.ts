const isVerticallyScrollable = (element: HTMLElement): boolean => {
  const { overflowY } = getComputedStyle(element)
  if (overflowY !== 'auto' && overflowY !== 'scroll' && overflowY !== 'overlay') {
    return false
  }
  return element.scrollHeight > element.clientHeight + 1
}

const scrollPanelInContainer = (
  panel: HTMLElement,
  scrollContainer: HTMLElement,
  scrollPadding: number
): void => {
  const containerRect = scrollContainer.getBoundingClientRect()
  const panelRect = panel.getBoundingClientRect()
  const nextTop = panelRect.top - containerRect.top + scrollContainer.scrollTop - scrollPadding
  scrollContainer.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
}

const scrollPanelInPage = (panel: HTMLElement, scrollPadding: number): void => {
  const nextTop = panel.getBoundingClientRect().top + window.scrollY - scrollPadding
  window.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' })
}

export type ScrollToPanelOptions = {
  scrollPadding?: number
  /** When true, scroll the document instead of the sidebar container (classic layout). */
  usePageScroll?: boolean
}

export const scrollToPanel = (
  panelId: string,
  scrollContainer: HTMLElement | null,
  options: ScrollToPanelOptions | number = {}
): void => {
  const { scrollPadding = 12, usePageScroll = false } =
    typeof options === 'number' ? { scrollPadding: options } : options

  const panel = document.getElementById(panelId)
  if (!(panel instanceof HTMLDetailsElement)) return

  panel.open = true
  requestAnimationFrame(() => {
    if (usePageScroll) {
      scrollPanelInPage(panel, scrollPadding)
      return
    }

    if (scrollContainer && isVerticallyScrollable(scrollContainer)) {
      scrollPanelInContainer(panel, scrollContainer, scrollPadding)
      return
    }

    scrollPanelInPage(panel, scrollPadding)
  })
}

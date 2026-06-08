import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

const STORAGE_KEY = 'signitures-sidebar-width'
export const SIDEBAR_MIN_WIDTH = 320
export const SIDEBAR_MAX_WIDTH = 1200
export const SIDEBAR_DEFAULT_WIDTH = 420
const PREVIEW_MIN_WIDTH = 340
const RESIZE_HANDLE_WIDTH = 6

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const maxSidebarForViewport = (viewportWidth: number): number =>
  clamp(
    viewportWidth - PREVIEW_MIN_WIDTH - RESIZE_HANDLE_WIDTH,
    SIDEBAR_MIN_WIDTH,
    SIDEBAR_MAX_WIDTH
  )

const readStoredWidth = (): number => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? Number(raw) : SIDEBAR_DEFAULT_WIDTH
    const max = maxSidebarForViewport(
      typeof window !== 'undefined' ? window.innerWidth : 1280
    )
    return Number.isFinite(parsed)
      ? clamp(parsed, SIDEBAR_MIN_WIDTH, max)
      : clamp(SIDEBAR_DEFAULT_WIDTH, SIDEBAR_MIN_WIDTH, max)
  } catch {
    return SIDEBAR_DEFAULT_WIDTH
  }
}

export const useResizableSidebar = (rtl = false) => {
  const [sidebarWidth, setSidebarWidth] = useState(readStoredWidth)
  const sidebarScrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(sidebarWidth))
    } catch {
      // localStorage may be unavailable
    }
  }, [sidebarWidth])

  useEffect(() => {
    const onWindowResize = () => {
      const max = maxSidebarForViewport(window.innerWidth)
      setSidebarWidth((current) => clamp(current, SIDEBAR_MIN_WIDTH, max))
    }
    window.addEventListener('resize', onWindowResize)
    onWindowResize()
    return () => window.removeEventListener('resize', onWindowResize)
  }, [])

  const fitToContentWidth = useCallback((minimumContentWidth: number) => {
    const max = maxSidebarForViewport(window.innerWidth)
    const needed = clamp(minimumContentWidth + 48, SIDEBAR_MIN_WIDTH, max)
    setSidebarWidth((current) => (needed > current ? needed : current))
  }, [])

  const measureAndFitScrollContent = useCallback(() => {
    const scroll = sidebarScrollRef.current
    if (!scroll) return
    fitToContentWidth(scroll.scrollWidth)
  }, [fitToContentWidth])

  const onResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      dragRef.current = { startX: event.clientX, startWidth: sidebarWidth }
      event.currentTarget.setPointerCapture(event.pointerId)
      document.body.classList.add('is-sidebar-resizing')
    },
    [sidebarWidth]
  )

  const onResizePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const delta = rtl ? drag.startX - event.clientX : event.clientX - drag.startX
    const next = clamp(
      drag.startWidth + delta,
      SIDEBAR_MIN_WIDTH,
      maxSidebarForViewport(window.innerWidth)
    )
    setSidebarWidth(next)
  }, [rtl])

  const onResizePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    event.currentTarget.releasePointerCapture(event.pointerId)
    document.body.classList.remove('is-sidebar-resizing')
  }, [])

  return {
    sidebarWidth,
    setSidebarWidth,
    sidebarScrollRef,
    fitToContentWidth,
    measureAndFitScrollContent,
    onResizePointerDown,
    onResizePointerMove,
    onResizePointerUp
  }
}

import { useCallback, useEffect, useState } from 'react'
import {
  buildUiFontCss,
  clampUiFontScale,
  DEFAULT_UI_FONT_ID,
  DEFAULT_UI_FONT_SCALE,
  loadStoredUiFontId,
  loadStoredUiFontScale,
  MAX_UI_FONT_SCALE,
  MIN_UI_FONT_SCALE,
  storeUiFontId,
  storeUiFontScale,
  UI_FONT_SCALE_STEP
} from '../lib/uiFont'

const STYLE_ELEMENT_ID = 'ui-font-overrides'

export const useUiFont = () => {
  const [fontId, setFontIdState] = useState<string>(() => loadStoredUiFontId())
  const [fontScale, setFontScaleState] = useState<number>(() => loadStoredUiFontScale())

  useEffect(() => {
    let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
    if (!style) {
      style = document.createElement('style')
      style.id = STYLE_ELEMENT_ID
      document.head.appendChild(style)
    }
    style.textContent = buildUiFontCss(fontId, fontScale)
  }, [fontId, fontScale])

  const setFontId = useCallback((id: string) => {
    setFontIdState(id)
    storeUiFontId(id)
  }, [])

  const setFontScale = useCallback((scale: number) => {
    const next = clampUiFontScale(scale)
    setFontScaleState(next)
    storeUiFontScale(next)
  }, [])

  const increaseFontScale = useCallback(() => {
    setFontScale(fontScale + UI_FONT_SCALE_STEP)
  }, [fontScale, setFontScale])

  const decreaseFontScale = useCallback(() => {
    setFontScale(fontScale - UI_FONT_SCALE_STEP)
  }, [fontScale, setFontScale])

  const resetFont = useCallback(() => {
    setFontId(DEFAULT_UI_FONT_ID)
    setFontScale(DEFAULT_UI_FONT_SCALE)
  }, [setFontId, setFontScale])

  return {
    fontId,
    fontScale,
    setFontId,
    setFontScale,
    increaseFontScale,
    decreaseFontScale,
    resetFont,
    canIncrease: fontScale < MAX_UI_FONT_SCALE,
    canDecrease: fontScale > MIN_UI_FONT_SCALE
  }
}

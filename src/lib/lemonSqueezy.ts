// src/lib/lemonSqueezy.ts
const SCRIPT_SRC = 'https://app.lemonsqueezy.com/js/lemon.js'
let scriptLoadPromise: Promise<void> | null = null
let overlayConfigured = false

export type LemonCheckoutOutcome = 'success' | 'closed'
let currentHandler: ((outcome: LemonCheckoutOutcome) => void) | null = null

const loadLemonScript = (): Promise<void> => {
  if (scriptLoadPromise) return scriptLoadPromise
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Lemon Squeezy script'))
    document.head.appendChild(script)
  })
  return scriptLoadPromise
}

const ensureOverlayConfigured = (): void => {
  if (overlayConfigured) return
  overlayConfigured = true
  window.LemonSqueezy?.Setup({
    eventHandler: (event) => {
      if (event.event === 'Checkout.Success') {
        currentHandler?.('success')
      } else if (event.event === 'Checkout.Closed') {
        currentHandler?.('closed')
      }
    }
  })
}

export const openLemonCheckout = async (
  checkoutUrl: string,
  onEvent: (outcome: LemonCheckoutOutcome) => void
): Promise<void> => {
  await loadLemonScript()
  window.createLemonSqueezy?.()
  ensureOverlayConfigured()
  currentHandler = onEvent
  window.LemonSqueezy?.Url.Open(checkoutUrl)
}

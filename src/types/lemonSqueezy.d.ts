// src/types/lemonSqueezy.d.ts
export type LemonSqueezyOverlayEvent = {
  event: string
  data?: unknown
}

declare global {
  interface Window {
    createLemonSqueezy?: () => void
    LemonSqueezy?: {
      Setup: (config: { eventHandler: (event: LemonSqueezyOverlayEvent) => void }) => void
      Url: { Open: (url: string) => void; Close?: () => void }
    }
  }
}

export {}

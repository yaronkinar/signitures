import { createHmac, timingSafeEqual } from 'node:crypto'

const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1'

export type LemonCheckoutCustomData = {
  tenantId: string
  userId: string
  signatureId?: string
}

export const createLemonCheckout = async (
  variantId: string,
  customData: LemonCheckoutCustomData
): Promise<string> => {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY
  const storeId = process.env.LEMONSQUEEZY_STORE_ID
  if (!apiKey || !storeId) {
    throw new Error('Lemon Squeezy is not configured on the server')
  }

  const response = await fetch(`${LEMONSQUEEZY_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: { custom: customData },
          product_options: { enabled_variants: [Number(variantId)] }
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variantId } }
        }
      }
    })
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText)
    throw new Error(`Lemon Squeezy checkout failed: ${response.status} ${detail}`)
  }

  const payload = (await response.json()) as { data?: { attributes?: { url?: string } } }
  const url = payload.data?.attributes?.url
  if (!url) {
    throw new Error('Lemon Squeezy checkout response missing url')
  }
  return url
}

export const verifyLemonSqueezySignature = (
  rawBody: string,
  signatureHeader: string | undefined,
  secret: string
): boolean => {
  if (!signatureHeader) return false
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const actualBuffer = Buffer.from(signatureHeader, 'utf8')
  if (expectedBuffer.length !== actualBuffer.length) return false
  return timingSafeEqual(expectedBuffer, actualBuffer)
}

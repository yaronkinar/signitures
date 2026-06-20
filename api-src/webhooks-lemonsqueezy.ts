import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readEntitlements, writeEntitlements } from './entitlements'
import { verifyLemonSqueezySignature } from './lemonsqueezy'

const readRawBody = (req: VercelRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

type LemonWebhookPayload = {
  meta?: {
    event_name?: string
    custom_data?: { tenantId?: string; signatureId?: string }
  }
  data?: {
    id?: string
    attributes?: { renews_at?: string }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhooks-lemonsqueezy] LEMONSQUEEZY_WEBHOOK_SECRET is not set')
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  const rawBody = await readRawBody(req)
  const signatureHeader = req.headers['x-signature']
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader

  if (!verifyLemonSqueezySignature(rawBody, signature, secret)) {
    res.status(400).json({ error: 'Invalid signature' })
    return
  }

  let payload: LemonWebhookPayload
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const eventName = payload.meta?.event_name
  const tenantId = payload.meta?.custom_data?.tenantId
  const signatureId = payload.meta?.custom_data?.signatureId

  if (!eventName || !tenantId) {
    res.status(200).json({ ok: true })
    return
  }

  const entitlements = await readEntitlements(tenantId)

  if (eventName === 'order_created') {
    if (signatureId && !entitlements.unlockedSignatureIds.includes(signatureId)) {
      await writeEntitlements(tenantId, {
        ...entitlements,
        unlockedSignatureIds: [...entitlements.unlockedSignatureIds, signatureId]
      })
    }
    res.status(200).json({ ok: true })
    return
  }

  if (eventName === 'subscription_created' || eventName === 'subscription_payment_success') {
    const renewsAt = payload.data?.attributes?.renews_at
    await writeEntitlements(tenantId, {
      ...entitlements,
      pro: {
        active: true,
        subscriptionId: payload.data?.id,
        renewsAt: renewsAt ? Date.parse(renewsAt) : undefined
      }
    })
    res.status(200).json({ ok: true })
    return
  }

  if (
    eventName === 'subscription_cancelled' ||
    eventName === 'subscription_expired' ||
    eventName === 'subscription_payment_failed'
  ) {
    await writeEntitlements(tenantId, {
      ...entitlements,
      pro: { ...entitlements.pro, active: false }
    })
    res.status(200).json({ ok: true })
    return
  }

  res.status(200).json({ ok: true })
}

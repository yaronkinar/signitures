import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Minimal route to verify Vercel detects the api/ folder. */
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ ok: true, service: 'signitures-api' })
}
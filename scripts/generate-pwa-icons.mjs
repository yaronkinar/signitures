import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const svg = await readFile(join(publicDir, 'icon.svg'))

const sizes = [
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'pwa-192.png', size: 192 },
  { name: 'pwa-512.png', size: 512 },
  { name: 'maskable-512.png', size: 512, maskable: true }
]

for (const { name, size, maskable } of sizes) {
  let pipeline = sharp(svg).resize(size, size)
  if (maskable) {
    pipeline = pipeline.extend({
      top: Math.round(size * 0.1),
      bottom: Math.round(size * 0.1),
      left: Math.round(size * 0.1),
      right: Math.round(size * 0.1),
      background: { r: 29, g: 78, b: 216, alpha: 1 }
    })
  }
  await pipeline.png().toFile(join(publicDir, name))
}

console.log('Generated PWA icons in public/')

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const iconSvg = await readFile(join(publicDir, 'icon.svg'), 'utf8')

const WIDTH = 1200
const HEIGHT = 630
const BRAND_COLOR = '#88236f'
const ICON_SIZE = 220
const ICON_X = 140
const ICON_Y = (HEIGHT - ICON_SIZE) / 2

const iconDataUri = `data:image/svg+xml;base64,${Buffer.from(iconSvg).toString('base64')}`

const ogSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BRAND_COLOR}"/>
  <image href="${iconDataUri}" x="${ICON_X}" y="${ICON_Y}" width="${ICON_SIZE}" height="${ICON_SIZE}"/>
  <text x="${ICON_X + ICON_SIZE + 60}" y="${HEIGHT / 2 - 20}" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Outlook Signature</text>
  <text x="${ICON_X + ICON_SIZE + 60}" y="${HEIGHT / 2 + 50}" font-family="Arial, sans-serif" font-size="56" font-weight="700" fill="#ffffff">Generator</text>
</svg>
`

await sharp(Buffer.from(ogSvg)).png().toFile(join(publicDir, 'og-image.png'))

console.log('Generated public/og-image.png')

import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'signature-fonts')
const weights = [300, 400, 500, 600, 700, 800]
const families = [
  { id: 'rubik', packageDir: '@fontsource/rubik', subsets: ['latin', 'hebrew'] },
  { id: 'cairo', packageDir: '@fontsource/cairo', subsets: ['latin', 'arabic'] }
]

mkdirSync(outDir, { recursive: true })

let copied = 0

for (const { id, packageDir, subsets } of families) {
  const filesDir = join(root, 'node_modules', packageDir, 'files')
  if (!existsSync(filesDir)) {
    console.warn(`Skip ${id}: missing ${filesDir}`)
    continue
  }

  for (const weight of weights) {
    for (const subset of subsets) {
      const fileName = `${id}-${subset}-${weight}-normal.woff2`
      const source = join(filesDir, fileName)
      if (!existsSync(source)) {
        console.warn(`Missing ${fileName}`)
        continue
      }
      cpSync(source, join(outDir, fileName))
      copied += 1
    }
  }
}

console.log(`Copied ${copied} signature font files to public/signature-fonts/`)

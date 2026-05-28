import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'signature-fonts')
const ttfOutDir = join(root, 'public', 'signature-fonts-ttf')
const weights = [300, 400, 500, 600, 700, 800]
const families = [
  { id: 'rubik', packageDir: '@fontsource/rubik', subsets: ['latin', 'hebrew'] },
  { id: 'cairo', packageDir: '@fontsource/cairo', subsets: ['latin', 'arabic'] }
]
const variableTtfSources = [
  {
    id: 'rubik',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/rubik/Rubik%5Bwght%5D.ttf'
  },
  {
    id: 'cairo',
    url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/cairo/Cairo%5Bslnt%2Cwght%5D.ttf'
  }
]

mkdirSync(outDir, { recursive: true })
mkdirSync(ttfOutDir, { recursive: true })

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

let ttfCopied = 0

for (const { id, url } of variableTtfSources) {
  const target = join(ttfOutDir, `${id}.ttf`)
  if (existsSync(target)) {
    ttfCopied += 1
    continue
  }

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.warn(`Missing variable TTF ${id}.ttf (${response.status})`)
      continue
    }
    writeFileSync(target, Buffer.from(await response.arrayBuffer()))
    ttfCopied += 1
    console.log(`Fetched ${id}.ttf`)
  } catch (error) {
    console.warn(
      `Failed to download ${id}.ttf: ${error instanceof Error ? error.message : error}`
    )
  }
}

console.log(`Prepared ${ttfCopied} Windows TTF files in public/signature-fonts-ttf/`)

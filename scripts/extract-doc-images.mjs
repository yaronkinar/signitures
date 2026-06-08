import fs from 'node:fs'
import path from 'node:path'

const docPath = process.argv[2]
const outDir = process.argv[3]
if (!docPath || !outDir) {
  console.error('Usage: node extract-doc-images.mjs <doc> <outDir>')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
const buf = fs.readFileSync(docPath)

const signatures = [
  { type: 'png', magic: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), end: Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]) },
  { type: 'jpg', magic: Buffer.from([0xff, 0xd8, 0xff]) },
  { type: 'gif', magic: Buffer.from('GIF89a') }
]

let index = 0
for (let i = 0; i < buf.length - 8; i += 1) {
  for (const sig of signatures) {
    if (!buf.subarray(i, i + sig.magic.length).equals(sig.magic)) continue

    let end = buf.length
    if (sig.type === 'png' && sig.end) {
      const found = buf.indexOf(sig.end, i + sig.magic.length)
      if (found !== -1) end = found + sig.end.length
    } else if (sig.type === 'jpg') {
      for (let j = i + 3; j < buf.length - 1; j += 1) {
        if (buf[j] === 0xff && buf[j + 1] === 0xd9) {
          end = j + 2
          break
        }
      }
    } else if (sig.type === 'gif') {
      const found = buf.indexOf(0x3b, i + 10)
      if (found !== -1) end = found + 1
    }

    const slice = buf.subarray(i, end)
    if (slice.length < 500) continue
    const outPath = path.join(outDir, `${String(index).padStart(2, '0')}.${sig.type}`)
    fs.writeFileSync(outPath, slice)
    console.log('saved', outPath, slice.length)
    index += 1
    i = end
    break
  }
}

console.log('total', index)

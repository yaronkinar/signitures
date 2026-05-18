import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const MIME_BY_EXTENSION = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
}

const getMimeType = (filePath) => {
  const extension = path.extname(filePath).toLowerCase()
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}

const toForwardSlashes = (value) => value.replaceAll('\\', '/')

const buildHtml = ({ dataUrl, imageName }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${imageName} (embedded)</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:0;">
          <img src="${dataUrl}" alt="${imageName}" style="display:block;max-width:100%;height:auto;border:0;" />
        </td>
      </tr>
    </table>
  </body>
</html>
`

const run = async () => {
  const [, , imagePathArg, outputArg] = process.argv

  if (!imagePathArg) {
    console.error(
      'Usage: node scripts/convert-image-to-html.mjs <image-path> [output-html-path]\n' +
        'Example: node scripts/convert-image-to-html.mjs ./signature.png ./dist/signature.html'
    )
    process.exitCode = 1
    return
  }

  const imagePath = path.resolve(imagePathArg)
  const imageName = path.basename(imagePath)
  const outputPath = path.resolve(outputArg ?? `${imagePath}.html`)
  const outputDirectory = path.dirname(outputPath)

  const imageBuffer = await readFile(imagePath)
  const mimeType = getMimeType(imagePath)
  const base64 = imageBuffer.toString('base64')
  const dataUrl = `data:${mimeType};base64,${base64}`
  const html = buildHtml({ dataUrl, imageName })

  await mkdir(outputDirectory, { recursive: true })
  await writeFile(outputPath, html, 'utf8')

  console.log(`Created HTML: ${toForwardSlashes(outputPath)}`)
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})

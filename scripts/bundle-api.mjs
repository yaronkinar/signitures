import * as esbuild from 'esbuild'
import { mkdir } from 'node:fs/promises'

await mkdir('api/design-signature', { recursive: true })

await esbuild.build({
  entryPoints: ['api-src/design-signature.ts'],
  outfile: 'api/design-signature/index.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  packages: 'bundle',
  logLevel: 'info',
  // Vercel invokes module.exports directly, not .default
  footer: {
    js: 'module.exports = module.exports.default ?? module.exports;'
  }
})

console.log('Bundled api/design-signature/index.js')

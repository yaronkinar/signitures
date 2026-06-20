import * as esbuild from 'esbuild'

const bundles = [
  ['api-src/design-signature.ts', 'api/design-signature.js'],
  ['api-src/signatures.ts', 'api/signatures.js'],
  ['api-src/signatures-download.ts', 'api/signatures/download.js'],
  ['api-src/entitlements-get.ts', 'api/entitlements.js'],
  ['api-src/entitlements-checkout.ts', 'api/entitlements/checkout.js']
]

for (const [entry, outfile] of bundles) {
  await esbuild.build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    packages: 'bundle',
    logLevel: 'info',
    footer: {
      js: 'module.exports = module.exports.default ?? module.exports;'
    }
  })
  console.log(`Bundled ${outfile}`)
}

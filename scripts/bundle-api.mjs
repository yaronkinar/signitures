import * as esbuild from 'esbuild'

const bundles = [
  ['api-src/design-signature.ts', 'api/design-signature.js'],
  ['api-src/signatures.ts', 'api/signatures.js'],
  ['api-src/signatures-download.ts', 'api/signatures/download.js'],
  ['api-src/entitlements-get.ts', 'api/entitlements.js'],
  ['api-src/entitlements-checkout.ts', 'api/entitlements/checkout.js'],
  ['api-src/webhooks-lemonsqueezy.ts', 'api/webhooks/lemonsqueezy.js'],
  ['api-src/admin-set-pro.ts', 'api/admin/set-pro.js'],
  ['api-src/admin-global-pro.ts', 'api/admin/global-pro.js'],
  ['api-src/admin-tenants.ts', 'api/admin/tenants.js']
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
      js: 'const __exports = module.exports; const __handler = __exports.default ?? __exports; if (__handler !== __exports) { for (const __key of Object.keys(__exports)) { if (__key !== "default") __handler[__key] = __exports[__key]; } } module.exports = __handler;'
    }
  })
  console.log(`Bundled ${outfile}`)
}

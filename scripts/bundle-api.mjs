import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['api-src/design-signature.ts'],
  outfile: 'api/design-signature.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  packages: 'bundle',
  logLevel: 'info',
  footer: {
    js: 'module.exports = module.exports.default ?? module.exports;'
  }
})

console.log('Bundled api/design-signature.js')

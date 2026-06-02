import { readFileSync, writeFileSync } from 'node:fs'

const packagePath = new URL('../package.json', import.meta.url)
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'))
const match = String(pkg.version ?? '0.0.0').match(/^(\d+)\.(\d+)\.(\d+)$/)

if (!match) {
  console.error(`Cannot bump non-semver version: ${pkg.version}`)
  process.exit(1)
}

const major = Number(match[1])
const minor = Number(match[2])
const patch = Number(match[3]) + 1
const nextVersion = `${major}.${minor}.${patch}`

pkg.version = nextVersion
writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
console.log(`Version bumped to ${nextVersion}`)

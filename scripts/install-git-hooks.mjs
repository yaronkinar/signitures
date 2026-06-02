import { chmodSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { join } from 'node:path'

const hooksDir = '.githooks'
const preCommit = join(hooksDir, 'pre-commit')

if (!existsSync(preCommit)) {
  console.warn('No .githooks/pre-commit found; skipping hook install.')
  process.exit(0)
}

try {
  chmodSync(preCommit, 0o755)
} catch {
  // Windows may ignore chmod; Git for Windows still runs the hook.
}

const desiredPath = hooksDir
let currentPath = ''

try {
  currentPath = execSync('git config --get core.hooksPath', { encoding: 'utf8' }).trim()
} catch {
  // Not set yet.
}

if (currentPath !== desiredPath) {
  execSync(`git config core.hooksPath ${desiredPath}`, { stdio: 'inherit' })
  console.log(`Git hooks path set to ${desiredPath}`)
}

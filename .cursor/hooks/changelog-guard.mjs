#!/usr/bin/env node
/**
 * beforeShellExecution hook.
 *
 * Before a `git commit`, make sure the site's changelog (src/changelogHe.ts,
 * the CHANGELOG_HE array shown in the "יומן שינויים" modal) was updated to
 * describe the staged changes. If code is staged but the changelog wasn't,
 * ask the agent to add an entry to the site first.
 *
 * Fails open: any error allows the commit so a buggy guard never blocks work.
 */
import { execSync } from 'node:child_process'

const CHANGELOG_PATH = 'src/changelogHe.ts'
const CODE_DIR_RE = /^(src|api|scripts)\//
const ALWAYS_IGNORE = new Set(['package.json'])

const allow = () => {
  process.stdout.write(JSON.stringify({ permission: 'allow' }))
  process.exit(0)
}

const readStdin = async () => {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const gitLines = (args) => {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8' })
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

try {
  const raw = (await readStdin()).replace(/^\uFEFF/, '').trim()
  let input = {}
  try {
    input = raw ? JSON.parse(raw) : {}
  } catch {
    allow()
  }

  const command = String(input.command ?? '')
  if (!/git\s+commit/.test(command)) allow()

  const commitsAll = /\s-a\b|\s--all\b|\s-[a-zA-Z]*a/.test(` ${command}`)
  const staged = gitLines('diff --cached --name-only')
  const tracked = commitsAll ? gitLines('diff --name-only') : []
  const relevant = new Set([...staged, ...tracked])

  const changelogTouched = relevant.has(CHANGELOG_PATH)
  const codeFiles = [...relevant].filter(
    (file) => file !== CHANGELOG_PATH && !ALWAYS_IGNORE.has(file) && CODE_DIR_RE.test(file)
  )

  if (codeFiles.length === 0 || changelogTouched) allow()

  const sample = codeFiles.slice(0, 10).join(', ')
  const more = codeFiles.length > 10 ? `, +${codeFiles.length - 10} more` : ''

  process.stdout.write(
    JSON.stringify({
      permission: 'ask',
      user_message:
        'The site changelog (src/changelogHe.ts) was not updated for this commit. Add a changelog entry before committing?',
      agent_message:
        `Before committing, add a new Hebrew entry to the top of CHANGELOG_HE in ${CHANGELOG_PATH} ` +
        `describing the user-facing changes for the site's "יומן שינויים" modal, then stage that file and retry the commit. ` +
        `Use today's date and the current package.json version. ` +
        `Staged code files: ${sample}${more}. ` +
        'If this commit has no user-facing change (e.g. internal tooling only), you may proceed without a changelog entry.'
    })
  )
  process.exit(0)
} catch {
  allow()
}

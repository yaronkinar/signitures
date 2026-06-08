import { readFileSync, writeFileSync } from 'node:fs'

const [, , inputPath, outputPath, scopeArg] = process.argv
if (!inputPath || !outputPath) {
  console.error('Usage: node scope-theme-css.mjs <input.css> <output.css> [scope]')
  process.exit(1)
}

const scope = scopeArg || 'html[data-ui-theme="classic"]'
const source = readFileSync(inputPath, 'utf8')

const prefixSelector = (selector) => {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith(scope)) return trimmed
  if (trimmed === ':root') return scope
  if (trimmed === 'html' || trimmed === 'body') return `${scope} ${trimmed}`
  return `${scope} ${trimmed}`
}

const lines = source.split('\n')
const output = []
let inKeyframes = false
let keyframesDepth = 0
let inAtRuleBlock = false
let atRuleDepth = 0

for (const line of lines) {
  const trimmed = line.trim()

  if (trimmed.startsWith('@import')) {
    output.push(line)
    continue
  }

  if (trimmed.startsWith('@keyframes')) {
    inKeyframes = true
    keyframesDepth = 0
    output.push(line)
    continue
  }

  if (inKeyframes) {
    const openCount = (line.match(/\{/g) || []).length
    const closeCount = (line.match(/\}/g) || []).length
    keyframesDepth += openCount - closeCount
    output.push(line)
    if (keyframesDepth <= 0 && trimmed.includes('}')) inKeyframes = false
    continue
  }

  if (trimmed.startsWith('@media') || trimmed.startsWith('@supports')) {
    inAtRuleBlock = true
    atRuleDepth = 0
    output.push(line)
    continue
  }

  if (inAtRuleBlock) {
    const openCount = (line.match(/\{/g) || []).length
    const closeCount = (line.match(/\}/g) || []).length
    atRuleDepth += openCount - closeCount

    const selectorMatch = line.match(/^(\s*)([^{]+)\{\s*$/)
    if (selectorMatch && !selectorMatch[2].trim().startsWith('@')) {
      const [, indent, selector] = selectorMatch
      const prefixed = selector
        .split(',')
        .map((part) => prefixSelector(part))
        .join(', ')
      output.push(`${indent}${prefixed} {`)
    } else {
      output.push(line)
    }

    if (atRuleDepth <= 0 && trimmed.includes('}')) {
      inAtRuleBlock = false
    }
    continue
  }

  const selectorMatch = line.match(/^(\s*)([^{]+)\{\s*$/)
  if (selectorMatch && !selectorMatch[2].trim().startsWith('@')) {
    const [, indent, selector] = selectorMatch
    const prefixed = selector
      .split(',')
      .map((part) => prefixSelector(part))
      .join(', ')
    output.push(`${indent}${prefixed} {`)
    continue
  }

  output.push(line)
}

writeFileSync(outputPath, output.join('\n'))

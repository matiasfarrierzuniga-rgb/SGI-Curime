#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import process from 'node:process'

const ROOT = resolve(process.argv[2] ?? 'src')
const ALIAS = '@'
const SHARED_FORBIDDEN = new Set(['app', 'features', 'pages', 'services', 'types', 'components', 'auth', 'users', 'roles'])
const FEATURE_FORBIDDEN = new Set(['app', 'pages', 'services', 'types', 'components'])

const violations = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full)
    else if (/\.(ts|tsx)$/.test(entry)) visit(full)
  }
}

function layerOf(absPath) {
  const rel = relative(ROOT, absPath).replaceAll('\\', '/')
  if (rel.startsWith('app/')) return { zone: 'app', feature: null }
  if (rel.startsWith('features/')) {
    const seg = rel.split('/')
    return { zone: 'features', feature: seg[1] }
  }
  if (rel.startsWith('shared/')) return { zone: 'shared', feature: null }
  return { zone: rel.split('/')[0] || 'legacy', feature: null }
}

function specifierToPath(specifier, importerAbs) {
  if (specifier === ALIAS) return ROOT
  if (specifier.startsWith(ALIAS + '/')) return resolve(ROOT, specifier.slice(2).replaceAll('/', '\\'))
  if (specifier.startsWith('.')) {
    return resolve(dirname(importerAbs), specifier.replaceAll('/', '\\'))
  }
  return null // bare module
}

function check(importerAbs, lineNo, rawLine) {
  const importer = layerOf(importerAbs)
  const specifiers = [...rawLine.matchAll(/(?:from|import|vi\.mock)\s*\(?\s*['"]([^'"]+)['"]/g)].map(m => m[1])
  for (const spec of specifiers) {
    const target = specifierToPath(spec, importerAbs)
    if (!target) continue
    const targetLayer = layerOf(target)

    if (importer.zone === 'shared') {
      if (SHARED_FORBIDDEN.has(targetLayer.zone)) {
        violations.push(`${relative(process.cwd(), importerAbs)}:${lineNo}: shared -> ${targetLayer.zone} forbidden (${spec})`)
      }
      continue
    }

    if (importer.zone === 'features') {
      if (FEATURE_FORBIDDEN.has(targetLayer.zone)) {
        violations.push(`${relative(process.cwd(), importerAbs)}:${lineNo}: feature -> ${targetLayer.zone} forbidden (${spec})`)
        continue
      }
    }

    const crossesFeatureBoundary = targetLayer.zone === 'features' &&
      (importer.zone !== 'features' || importer.feature !== targetLayer.feature)
    const targetRel = relative(ROOT, target).replaceAll('\\', '/')
    const usesPublicApi = targetRel === `features/${targetLayer.feature}`
    if (crossesFeatureBoundary && !usesPublicApi) {
      violations.push(
        `${relative(process.cwd(), importerAbs)}:${lineNo}: cross-feature internal import (${spec}); use the feature public API (index.ts)`,
      )
    }
  }
}

function visit(file) {
  const rel = relative(ROOT, file).replaceAll('\\', '/')
  const content = readFileSync(file, 'utf8')
  if (content.includes('import.meta.env') && rel !== 'shared/config/env.ts') {
    violations.push(`${relative(process.cwd(), file)}: direct import.meta.env access forbidden; use shared/config/env.ts`)
  }
  content.split(/\r?\n/).forEach((line, i) => {
    if (/['"]/.test(line)) check(file, i + 1, line)
  })
}

walk(ROOT)

if (violations.length > 0) {
  console.error(`Architecture boundary violations (${violations.length}):`)
  for (const v of violations) console.error(`  - ${v}`)
  process.exit(1)
}
console.log(`Architecture boundaries OK (scanned ${ROOT})`)

#!/usr/bin/env node
/**
 * Enforcement del design contract (DESIGN.md) sobre el código fuente.
 *
 * Reglas detectadas (solo dentro de valores `className`):
 *   - hex/rgb/rgba literales            → usar tokens semánticos
 *   - clases de color genéricas         → (slate/gray/blue-*, …) → usar tokens
 *   - valores arbitrarios de espaciado  → p-[13px], gap-[7px], … → usar escala de tokens
 *
 * Alcance por defecto: FALLA sobre violaciones en código nuevo/cambiado (diff vs `--base`),
 * y solo REPORTEA el total en código legacy. Esto evita bloquear por las miles de
 * violaciones históricas sin limpiar.
 *
 * Uso:
 *   node scripts/lint-design.mjs                    # fail en código nuevo, reporta legacy
 *   node scripts/lint-design.mjs --report-only      # nunca falla, solo reporta
 *   node scripts/lint-design.mjs --base origin/main # base del diff (default: main)
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const SRC_EXT = /\.(js|jsx|ts|tsx)$/

const RULES = [
  {
    id: 'hex',
    label: 'color literal (hex/rgb/rgba)',
    re: /#(?:[0-9a-fA-F]{3,8})\b|rgba?\(/,
  },
  {
    id: 'generic-color',
    label: 'clase de color genérica (slate/gray/blue-*, …)',
    re: /\b(?:bg|text|border|ring|from|to|via|divide|outline|placeholder|caret|accent|fill|stroke|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-/,
  },
  {
    id: 'arbitrary-spacing',
    label: 'valor arbitrario de espaciado (p-[13px], gap-[7px], …)',
    re: /\b(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|space-[xy]?)-\[[^\]]*px\]/,
  },
]

const args = process.argv.slice(2)
const REPORT_ONLY = args.includes('--report-only')
const baseIdx = args.indexOf('--base')
const BASE = baseIdx !== -1 ? args[baseIdx + 1] : 'main'

function git(argsList) {
  return execFileSync('git', argsList, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function listSrcFiles() {
  return git(['ls-files', '--cached', '--others', '--exclude-standard', 'src'])
    .split('\n')
    .filter((f) => f && SRC_EXT.test(f))
    .filter((f) => existsSync(join(ROOT, f))) // ignora archivos borrados aún sin stagear
}

/** Archivos cambiados desde BASE (tracked diff + untracked). */
function changedFiles() {
  const set = new Set()
  try {
    git(['diff', '--name-only', '--diff-filter=ACMR', BASE])
      .split('\n')
      .filter(Boolean)
      .forEach((f) => set.add(f))
  } catch {
    console.error(`✗ No se pudo obtener el diff contra "${BASE}". ¿Existe la ref? Usa --base <ref>.`)
    process.exit(2)
  }
  git(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
    .forEach((f) => set.add(f))
  return [...set].filter((f) => f.startsWith('src/') && SRC_EXT.test(f))
}

/** Líneas cambiadas (1-indexadas) de un archivo vs BASE: `{ line, content, oldContent }`.
 *  `oldContent = null` → adición pura (todas las violaciones cuentan). Si hay
 *  `oldContent`, es una modificación: solo cuentan las violaciones NUEVAS (que no
 *  estaban en la línea vieja), para no reflaggear violaciones legacy ante renames. */
function changedLines(file) {
  let diff
  try {
    diff = git(['diff', '--unified=0', BASE, '--', file])
  } catch {
    return null
  }
  if (diff === '') {
    // Sin diff tracked: o es untracked (todas las líneas) o no cambió.
    if (!existsSync(join(ROOT, file))) return null
    const content = readFileSync(join(ROOT, file), 'utf8').split('\n')
    return content.map((c, i) => ({ line: i + 1, content: c, oldContent: null }))
  }
  const changes = []
  let newLine = 0
  let pendingOld = []
  for (const line of diff.split('\n')) {
    const m = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (m) {
      newLine = parseInt(m[1], 10)
      pendingOld = []
      continue
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1)
      const oldContent = pendingOld.length ? pendingOld.shift() : null
      changes.push({ line: newLine, content, oldContent })
      newLine++
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      pendingOld.push(line.slice(1))
    } else if (!line.startsWith('\\')) {
      newLine++
    }
  }
  return changes
}

function extractClassNames(line) {
  const classes = []
  const re = /className=(?:"([^"]*)"|'([^']*)'|`([^`]*)`|\{`([^`]*)`\})/g
  let m
  while ((m = re.exec(line)) !== null) {
    const val = m[1] ?? m[2] ?? m[3] ?? m[4] ?? ''
    if (val) classes.push(val)
  }
  return classes
}

function checkLine(line) {
  const found = []
  for (const cls of extractClassNames(line)) {
    for (const rule of RULES) {
      const re = new RegExp(rule.re.source, rule.re.flags.replace(/g/g, '') + 'g')
      let m
      while ((m = re.exec(cls)) !== null) {
        found.push({ rule: rule.id, label: rule.label, cls, token: m[0] })
      }
    }
  }
  return found
}

// ── Escaneo de código nuevo (fail) ────────────────────────────────────────────
const changed = changedFiles()
const newViolations = []
for (const file of changed) {
  const changes = changedLines(file)
  if (!changes) continue
  for (const { line, content, oldContent } of changes) {
    const oldSigs = new Set(
      (oldContent != null ? checkLine(oldContent) : []).map((v) => `${v.rule}|${v.token}`)
    )
    for (const v of checkLine(content)) {
      if (!oldSigs.has(`${v.rule}|${v.token}`)) {
        newViolations.push({ file, line, ...v })
      }
    }
  }
}

// ── Reporte de legacy (solo conteo) ───────────────────────────────────────────
const legacyCounts = Object.fromEntries(RULES.map((r) => [r.id, 0]))
const legacyTop = new Map()
for (const file of listSrcFiles()) {
  if (changed.includes(file)) continue
  const content = readFileSync(join(ROOT, file), 'utf8').split('\n')
  for (const line of content) {
    for (const v of checkLine(line)) {
      legacyCounts[v.rule]++
      legacyTop.set(file, (legacyTop.get(file) || 0) + 1)
    }
  }
}

// ── Salida ────────────────────────────────────────────────────────────────────
const rel = (f) => relative(ROOT, f)

if (newViolations.length > 0) {
  console.error(`\n✗ ${newViolations.length} violaciones del design contract en código nuevo/cambiado:\n`)
  for (const v of newViolations) {
    console.error(`  ${rel(v.file)}:${v.line}  [${v.rule}] ${v.label}`)
    console.error(`      → ${v.cls.trim()}`)
  }
  console.error(`\nRevisa DESIGN.md. Corrige y vuelve a ejecutar.`)
}

const legacyTotal = Object.values(legacyCounts).reduce((a, b) => a + b, 0)
const topFiles = [...legacyTop.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)
console.log(`\nLegacy (fuera del diff, no bloquea): ${legacyTotal} violaciones en ${legacyTop.size} archivos`)
for (const r of RULES) {
  console.log(`  ${r.id.padEnd(18)} ${String(legacyCounts[r.id]).padStart(6)}`)
}
if (topFiles.length) {
  console.log('\n  Top archivos legacy:')
  for (const [f, n] of topFiles) console.log(`    ${n.toString().padStart(5)}  ${rel(f)}`)
}

if (newViolations.length > 0 && !REPORT_ONLY) {
  process.exit(1)
}
console.log('\n✓ Código nuevo limpio' + (REPORT_ONLY ? ' (modo report-only)' : ''))

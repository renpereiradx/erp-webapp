#!/usr/bin/env node
/**
 * Regenera el bloque de tokens (Tailwind 4) dentro de `src/index.css` desde
 * `design/tokens.json`, entre los marcadores `/* @tokens:start *​/` y
 * `/* @tokens:end *​/`.
 *
 * tokens.json es la fuente única de verdad. Emite:
 *   - `@custom-variant dark (...)`   → variante dark basada en la clase .dark
 *   - `@theme { ... }`               → valores light + tokens independientes de modo
 *   - `.dark { ... }`                → overrides de modo oscuro
 *
 * Uso:
 *   node scripts/generate-tokens.mjs            # escribe src/index.css
 *   node scripts/generate-tokens.mjs --check    # falla si hay drift
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS_PATH = join(ROOT, 'design', 'tokens.json')
const OUT_PATH = join(ROOT, 'src', 'index.css')
const START_MARK = '/* @tokens:start */'
const END_MARK = '/* @tokens:end */'

// ── Colores ──────────────────────────────────────────────────────────────────
function emitColorEntry(themeLines, darkLines, name, value) {
  const base = `--color-${name}`
  if (typeof value === 'string') {
    themeLines.push(`  ${base}: ${value};`)
    return
  }
  if ('light' in value && 'dark' in value) {
    themeLines.push(`  ${base}: ${value.light};`)
    darkLines.push(`  ${base}: ${value.dark};`)
    return
  }
  for (const [shade, shadeValue] of Object.entries(value)) {
    const suffix = shade === 'DEFAULT' ? '' : `-${shade}`
    emitColorEntry(themeLines, darkLines, `${name}${suffix}`, shadeValue)
  }
}

function emitSimple(obj, prefix) {
  return Object.entries(obj).map(([name, value]) => `  ${prefix}${name}: ${value};`)
}

function emitFontSize(obj) {
  const lines = []
  for (const [name, spec] of Object.entries(obj)) {
    const [size, mods = {}] = spec
    lines.push(`  --text-${name}: ${size};`)
    if (mods.lineHeight) lines.push(`  --text-${name}--line-height: ${mods.lineHeight};`)
    if (mods.fontWeight) lines.push(`  --text-${name}--font-weight: ${mods.fontWeight};`)
    if (mods.letterSpacing) lines.push(`  --text-${name}--letter-spacing: ${mods.letterSpacing};`)
  }
  return lines
}

function emitFontFamily(obj) {
  return Object.entries(obj).map(([name, families]) => {
    const value = families.map((f) => (/\s/.test(f) ? JSON.stringify(f) : f)).join(', ')
    return `  --font-${name}: ${value};`
  })
}

function emitBreakpoints(obj) {
  return Object.entries(obj).map(([name, value]) => `  --breakpoint-${name}: ${value};`)
}

function loadTokens() {
  let raw
  try {
    raw = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'))
  } catch (err) {
    console.error(`✗ No se pudo leer/parsear ${TOKENS_PATH}: ${err.message}`)
    process.exit(1)
  }
  return raw
}

function generateBlock(tokens) {
  const theme = []
  const dark = []
  for (const [name, value] of Object.entries(tokens.color || {})) {
    emitColorEntry(theme, dark, name, value)
  }
  theme.push(
    ...emitSimple(tokens.spacing || {}, '--spacing-'),
    ...(tokens.spacing && tokens.spacing['container-max']
      ? [`  --container-container-max: ${tokens.spacing['container-max']};`]
      : []),
    ...emitSimple(tokens.borderRadius || {}, '--radius-'),
    ...emitFontSize(tokens.fontSize || {}),
    ...emitFontFamily(tokens.fontFamily || {}),
    ...emitSimple(tokens.boxShadow || {}, '--shadow-'),
    ...emitBreakpoints(tokens.breakpoints || {}),
  )

  const out = [
    '@custom-variant dark (&:where(.dark, .dark *));',
    '',
    '@theme {',
    ...theme,
    '}',
    '',
    '.dark {',
    ...(dark.length ? dark : ['  /* sin overrides de color */']),
    '}',
    '',
  ]
  return out.join('\n')
}

function generateIndexCss(tokens) {
  let text = readFileSync(OUT_PATH, 'utf8')
  const startIdx = text.indexOf(START_MARK)
  const endIdx = text.indexOf(END_MARK)
  if (startIdx === -1 || endIdx === -1) {
    console.error(`✗ Faltan los marcadores "${START_MARK}" / "${END_MARK}" en ${OUT_PATH}.`)
    process.exit(1)
  }
  if (endIdx < startIdx) {
    console.error(`✗ Los marcadores están en orden incorrecto en ${OUT_PATH}.`)
    process.exit(1)
  }
  const before = text.slice(0, startIdx + START_MARK.length)
  const after = text.slice(endIdx)
  return `${before}\n${generateBlock(tokens)}\n${after}`
}

const tokens = loadTokens()
const generated = generateIndexCss(tokens)

if (process.argv.includes('--check')) {
  const current = readFileSync(OUT_PATH, 'utf8')
  if (generated === current) {
    console.log('✓ src/index.css está sincronizado con design/tokens.json')
    process.exit(0)
  }
  console.error('✗ Drift detectado: src/index.css no coincide con design/tokens.json.')
  console.error('  Ejecuta `pnpm tokens:generate` y commitea el resultado.')
  process.exit(1)
}

writeFileSync(OUT_PATH, generated)
console.log('✓ src/index.css regenerado desde design/tokens.json')

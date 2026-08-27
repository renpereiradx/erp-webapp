#!/usr/bin/env node
/**
 * Regenera las secciones de tokens de `tailwind.config.js` desde `design/tokens.json`.
 *
 * tokens.json es la fuente única de verdad. Las secciones `colors`, `spacing`,
 * `borderRadius`, `fontSize` y `boxShadow` de `theme.extend` se generan desde ahí.
 * Todo lo demás del config (darkMode, content, screens, fontFamily, transitionDuration,
 * plugins) se conserva intacto.
 *
 * Uso:
 *   node scripts/generate-tailwind-config.mjs            # escribe el config
 *   node scripts/generate-tailwind-config.mjs --check    # falla si hay drift
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const TOKENS_PATH = join(ROOT, 'design', 'tokens.json')
const CONFIG_PATH = join(ROOT, 'tailwind.config.js')

const CATEGORIES = ['color', 'spacing', 'borderRadius', 'fontSize', 'boxShadow']
const INDENT = '        ' // 8 espacios, alineado con las claves dentro de `extend`

const isIdentifier = (key) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)

/** Serializa un objeto de tokens en líneas JS `key: value,` con indent dado. */
function serializeBlock(obj) {
  return Object.entries(obj)
    .map(([key, value]) => {
      const jsKey = isIdentifier(key) ? key : JSON.stringify(key)
      return `${INDENT}${jsKey}: ${JSON.stringify(value)},`
    })
    .join('\n')
}

function loadTokens() {
  let raw
  try {
    raw = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'))
  } catch (err) {
    console.error(`✗ No se pudo leer/parsear ${TOKENS_PATH}: ${err.message}`)
    process.exit(1)
  }
  for (const cat of CATEGORIES) {
    if (!raw[cat] || typeof raw[cat] !== 'object' || Array.isArray(raw[cat])) {
      console.error(`✗ tokens.json debe tener un objeto "${cat}"`)
      process.exit(1)
    }
  }
  return raw
}

function findMarkerLine(lines, marker) {
  const idx = lines.findIndex((line) => line.includes(marker))
  if (idx === -1) {
    console.error(`✗ Falta el marcador "${marker}" en ${CONFIG_PATH}.`)
    process.exit(1)
  }
  return idx
}

function generateConfig(tokens) {
  let lines = readFileSync(CONFIG_PATH, 'utf8').split('\n')

  for (const cat of CATEGORIES) {
    const startMarker = `/* @tokens:${cat}:start */`
    const endMarker = `/* @tokens:${cat}:end */`

    const startLine = findMarkerLine(lines, startMarker)
    const endLine = findMarkerLine(lines, endMarker)
    if (endLine <= startLine) {
      console.error(`✗ Marcadores de "${cat}" en orden incorrecto en ${CONFIG_PATH}.`)
      process.exit(1)
    }

    const blockLines = serializeBlock(tokens[cat]).split('\n')
    lines = [...lines.slice(0, startLine + 1), ...blockLines, ...lines.slice(endLine)]
  }

  return lines.join('\n')
}

const tokens = loadTokens()
const generated = generateConfig(tokens)

if (process.argv.includes('--check')) {
  const current = readFileSync(CONFIG_PATH, 'utf8')
  if (generated === current) {
    console.log('✓ tailwind.config.js está sincronizado con design/tokens.json')
    process.exit(0)
  }
  console.error('✗ Drift detectado: tailwind.config.js no coincide con design/tokens.json.')
  console.error('  Ejecuta `pnpm tokens:generate` y commitea el resultado.')
  process.exit(1)
}

writeFileSync(CONFIG_PATH, generated)
console.log('✓ tailwind.config.js regenerado desde design/tokens.json')

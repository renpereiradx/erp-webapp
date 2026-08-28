#!/usr/bin/env node
/**
 * Revisión visual automatizada del design contract (DESIGN.md §9 / prompt §9).
 *
 * Pipeline: vite preview (build demo) → sesión demo pre-seedeada (localStorage) →
 * screenshots de páginas clave (light + dark) → comparación pixelmatch contra
 * baselines versionados en design/baselines/.
 *
 * Uso:
 *   node scripts/visual-check.mjs --update        # (re)captura baselines
 *   node scripts/visual-check.mjs                 # compara contra baselines, falla si hay drift
 *   node scripts/visual-check.mjs --threshold 0.1 # tolerancia por imagen (0-1, default 0.02)
 *   node scripts/visual-check.mjs --base-url http://localhost:4173  # server propio
 *
 * Requiere un build demo previo (`vite build --mode demo` → .env.demo →
 * VITE_USE_DEMO=true) o pasar --base-url apuntando a un server ya corriendo.
 * `pnpm visual:check` / `pnpm visual:update` ya hacen el build.
 *
 * Sesión: se pre-seedea localStorage con el token demo (DEMO_TOKEN) + rol admin
 * (F2VLso), equivalente a un usuario ya logueado. NOTA: el flujo real de login
 * navega a /select-branch y un reload posterior expulsa la sesión (bug conocido
 * del modo demo); el pre-seed lo evita y es estable para screenshots.
 *
 * Red: las llamadas al backend (localhost:5050) se ABORTAN determinísticamente
 * (route abort) para que el estado final (error/empty state) no dependa de
 * timeouts de red variables. Las páginas elegidas renderizan su UI real con
 * datos mock/inline; /dashboard queda en su ErrorState, también determinista.
 *
 * Determinismo: viewport fijo 1440×900, animations disabled, caret hidden,
 * document.fonts.ready + settle, colorScheme + clase .dark vía ThemeContext.
 */
import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASELINE_DIR = join(ROOT, 'design', 'baselines')
const OUT_DIR = join(ROOT, 'node_modules', '.cache', 'visual')

const args = process.argv.slice(2)
const UPDATE = args.includes('--update')
const thresholdIdx = args.indexOf('--threshold')
const THRESHOLD = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1]) : 0.02
const baseUrlIdx = args.indexOf('--base-url')
const BASE_URL = baseUrlIdx !== -1 ? args[baseUrlIdx + 1] : 'http://localhost:4173'

// Páginas curadas: representativas de los layouts de DESIGN.md (§4/§7) y de
// componentes base (PageHeader, Card, Table, Badge, EmptyState, wizard, listado).
const PAGES = [
  { name: 'login', path: '/login', auth: false },
  { name: 'dashboard', path: '/dashboard', auth: true }, // ErrorState determinista (API abortada)
  { name: 'ventas', path: '/ventas', auth: true },
  { name: 'productos', path: '/productos', auth: true },
  { name: 'parties', path: '/parties', auth: true },
  { name: 'receivables-list', path: '/receivables/list', auth: true },
  { name: 'payables-aging-report', path: '/payables/aging-report', auth: true },
  { name: 'pronosticos-dashboard', path: '/bi/pronosticos/dashboard', auth: true },
]

const MODES = ['light', 'dark']

// ── Utilidades ────────────────────────────────────────────────────────────────

async function newPage(browser, mode, { withSession = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: mode,
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  // Abort determinista de toda llamada al backend: sin backend en el entorno de
  // captura, un fetch colgado variaría el timing del estado final capturado.
  await context.route(/^http:\/\/localhost:5050\//, (route) => route.abort())
  // Tema persistido + (opcional) sesión demo pre-seedeada, ANTES de que corra la app.
  // El login se captura SIN sesión: con token presente, /login redirige a /dashboard.
  await page.addInitScript(
    ({ mode, withSession }) => {
      localStorage.clear()
      localStorage.setItem('erp-theme-mode', mode === 'dark' ? 'dark' : 'light')
      if (withSession) {
        localStorage.setItem('authToken', 'demo-jwt-token-12345')
        localStorage.setItem('demoUserEmail', 'demo')
        localStorage.setItem('roleId', 'F2VLso')
      }
    },
    { mode, withSession }
  )
  return { context, page }
}

async function capture(page, name) {
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  const currentPath = join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: currentPath, fullPage: false, animations: 'disabled', caret: 'hide' })

  const baselinePath = join(BASELINE_DIR, `${name}.png`)
  if (UPDATE) {
    writeFileSync(baselinePath, readFileSync(currentPath))
    results.push({ name, status: 'updated' })
  } else if (!existsSync(baselinePath)) {
    missing.push(name)
    results.push({ name, status: 'missing-baseline' })
  } else {
    const diffPath = join(OUT_DIR, `${name}.diff.png`)
    const { diffPixels, total, sizeMismatch } = comparePngs(baselinePath, currentPath, diffPath)
    const ratio = total ? diffPixels / total : 1
    const fail = sizeMismatch || ratio > THRESHOLD
    results.push({ name, status: fail ? 'FAIL' : 'pass', ratio, diffPixels, total, sizeMismatch })
  }
}

function comparePngs(baselinePath, currentPath, diffPath) {
  const img1 = PNG.sync.read(readFileSync(baselinePath))
  const img2 = PNG.sync.read(readFileSync(currentPath))
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return { diffPixels: Math.max(img1.width * img1.height, img2.width * img2.height), total: img2.width * img2.height, sizeMismatch: true }
  }
  const { width, height } = img1
  const diff = new PNG({ width, height })
  const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1, // por-canal; el THRESHOLD del CLI es sobre la proporción de píxeles
    includeAA: false,
  })
  writeFileSync(diffPath, PNG.sync.write(diff))
  return { diffPixels, total: width * height, sizeMismatch: false }
}

// Espera a que el server responda (máx ~15s)
async function waitReady(url) {
  const deadline = Date.now() + 15000
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await new Promise((r) => setTimeout(r, 300))
  }
  console.error(`✗ El server de preview no respondió en ${url}`)
  process.exit(2)
}

// ── Main ──────────────────────────────────────────────────────────────────────

// Servir dist/ con vite preview (salvo --base-url). El script es dueño del
// server: lo apaga en finally para que el exit code llegue intacto a CI.
const ownServer = baseUrlIdx === -1
let server = null
if (ownServer) {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('✗ No existe dist/index.html. Corre `vite build --mode demo` primero (o usa --base-url).')
    process.exit(2)
  }
  server = spawn('node_modules/.bin/vite', ['preview', '--port', '4173', '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    detached: true,
  })
  await waitReady(BASE_URL)
}

const browser = await chromium.launch()
mkdirSync(OUT_DIR, { recursive: true })
if (UPDATE) mkdirSync(BASELINE_DIR, { recursive: true })

const results = []
const missing = []

try {
  for (const mode of MODES) {
    // 1) Páginas públicas SIN sesión (login): en contexto limpio.
    for (const p of PAGES.filter((x) => !x.auth)) {
      const { context, page } = await newPage(browser, mode, { withSession: false })
      try {
        const name = `${p.name}-${mode}`
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
        await page.waitForLoadState('load').catch(() => {})
        await capture(page, name)
      } catch (err) {
        results.push({ name: `${p.name}-${mode}`, status: 'error', error: err.message.split('\n')[0] })
      } finally {
        await context.close()
      }
    }
    // 2) Páginas protegidas CON sesión demo pre-seedeada (equivalente a usuario logueado).
    const { context, page } = await newPage(browser, mode, { withSession: true })
    try {
      for (const p of PAGES.filter((x) => x.auth)) {
        const name = `${p.name}-${mode}`
        try {
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {})
          await page.waitForLoadState('load').catch(() => {})
          await capture(page, name)
        } catch (err) {
          results.push({ name, status: 'error', error: err.message.split('\n')[0] })
        }
      }
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
  if (server) {
    try { process.kill(-server.pid, 'SIGTERM') } catch {}
  }
}

// ── Reporte ──────────────────────────────────────────────────────────────────

let fails = 0
console.log(`\nRevisión visual (${UPDATE ? 'UPDATE' : 'CHECK'}) — ${PAGES.length} páginas × ${MODES.length} modos, threshold ${(THRESHOLD * 100).toFixed(1)}%\n`)
for (const r of results) {
  if (r.status === 'updated') console.log(`  ✓ ${r.name} — baseline actualizado`)
  else if (r.status === 'pass') console.log(`  ✓ ${r.name} — diff ${(r.ratio * 100).toFixed(3)}%`)
  else if (r.status === 'missing-baseline') console.log(`  ? ${r.name} — sin baseline (corre con --update)`)
  else if (r.status === 'error') { fails++; console.log(`  ✗ ${r.name} — ERROR: ${r.error}`) }
  else { fails++; console.log(`  ✗ ${r.name} — diff ${(r.ratio * 100).toFixed(3)}% (${r.diffPixels}/${r.total} px${r.sizeMismatch ? ', tamaño distinto' : ''}) → ${join('node_modules', '.cache', 'visual', `${r.name}.diff.png`)}`) }
}

const pass = results.filter((r) => r.status === 'pass').length
console.log(`\n${fails === 0 && missing.length === 0 ? '✓' : '✗'} ${pass}/${results.length} pasan${missing.length ? `, ${missing.length} sin baseline` : ''}${fails ? `, ${fails} fallan` : ''}`)
if (!UPDATE && (fails > 0 || missing.length > 0)) process.exit(1)

# PLAN_VERSION_UI_FRONTEND_2026-10-07

Versión del sistema visible en la UI con **una sola fuente de dato y un solo punto de render**.
Cerrado con release `v1.1.0` (BE + FE en lockstep, ver AGENTS.md wrapper §Versionado).

## Problema

- La UI no mostraba ninguna versión del sistema en ningún lado.
- Peor: había un literal hardcodeado **"Fluent ERP v2.0"** en el sidebar (`layouts/main/Sidebar.tsx:29`)
  con el sistema real en v1.0.x — exactamente el drift "una página dice 2.0 y otra 1.5" que se
  quería evitar. Los docs de instalación (RUNBOOK v1.3) ya sufrían una variante del mismo problema:
  versión de documento confundible con versión de producto.
- El guard anti-drift (D6), corrido en modo reporte, destapó MÁS drift real, corregido en este
  mismo diff:
  - `pages/Settings.tsx` mostraba "ERP Business Intelligence **v1.2.0**" (key i18n con versión
    dentro — `settings.footer.version`, eliminada y reemplazada por `settings.footer.brand` + badge).
  - `pages/BranchSelection.tsx` mostraba "Core Engine **v2.0.4**" literal.
  - **5 módulos mandaban al backend un `system_version` hardcodeado cada uno distinto**
    (`4.3.0-frontend`, `1.1.0-frontend`, `2.1.0-frontend` ×2, `1.0.0-frontend`): stock movements,
    purchases, price adjustments ×2 y price transactions. Ahora todos derivan de
    `FE_APP_VERSION` (`src/domain/version/feVersion.ts`) con sufijo `-frontend`.

## Decisiones

| # | Decisión | Motivo |
| :--- | :--- | :--- |
| D1 | Dos orígenes de dato: `__APP_VERSION__` (build FE, desde `package.json` vía `define` de Vite) + `GET /version` (BE runtime, sin auth, ya existente para installer smoke / soporte) | Ningún número escrito a mano; el flujo de release existente (sync `package.json` + tag) alimenta la UI solo |
| D2 | Un solo componente renderiza versión: `SystemVersionBadge` (`src/components/`) | El desalineo entre páginas es imposible por construcción: no existe un segundo camino |
| D3 | Fetch único de `/version` en `useVersionStore` (idempotente, fail-open) | Varios badges montados nunca disparan fetches duplicados; si el BE no responde, el badge sigue mostrando la versión FE |
| D4 | Divergencia FE vs BE visible: si las bases SemVer difieren, el badge muestra `vX.Y.Z · servidor vA.B.C` | Detecta instalaciones parcialmente actualizadas (bundle FE y binario BE de releases distintas) sin preguntarle al cliente |
| D5 | Tooltip nativo (`title`) con detalle: versión completa BE (con sufijo `git describe`), commit, build date | Oro para soporte remoto; Radix Tooltip requiere Provider y es frágil en jsdom — nativo es determinista |
| D6 | Guard anti-drift en `lint:design`: literales de versión en `src/` (comentarios excluidos) fallan en código nuevo | El guard es mecánico, no disciplina; pragma `allow-version` para excepciones justificadas |
| D7 | El badge muestra la versión FE como número principal | `package.json` es la SSOT del release (regla de versionado del wrapper); BE lleva sufijos de build que ensuciarían el número principal |

## Descartes

- **Servir un único número desde el BE**: acopla despliegues y puede mentir cuando FE y BE se
  actualizan por separado en el cliente.
- **Leer `/version` desde cada página**: N fetches y drift por cache; un fetch en el store alcanza.
- **Solo `package.json` sin `/version`**: en instalaciones de cliente el FE estático puede quedar
  viejo respecto al binario BE — la divergencia es información de soporte valiosa.

## Implementación

```
vite.config.js                      ← define __APP_VERSION__ (package.json)
src/vite-env.d.ts                   ← declare const __APP_VERSION__
src/domain/version/version.ts       ← lógica pura: normalize/base/comparación/display (sin React)
src/domain/version/feVersion.ts     ← FE_APP_VERSION: única constante de versión (badge + payloads)
src/services/versionService.ts      ← GET /version (raíz del router, NO /api/v1)
src/store/useVersionStore.ts        ← Zustand: feVersion, backend, status, fetchVersion idempotente
src/components/SystemVersionBadge.tsx
src/lib/i18n/locales/{es,en}/version.js + registro en index.js de ambos
src/layouts/main/Sidebar.tsx        ← BrandMark: "Fluent ERP v2.0" → t('nav.brandTagline') + badge
src/pages/Login.tsx                 ← footer: © año • marca • badge (pre-auth: /version es sin auth)
src/pages/Settings.tsx              ← footer: "ERP Business Intelligence v1.2.0" → brand + badge
src/pages/BranchSelection.tsx       ← footer: "Core Engine v2.0.4" → badge
src/domain/stock/movements.ts, features/purchases/hooks/usePurchasesLogic.ts,
pages/PriceAdjustmentDetail.jsx, services/priceAdjustmentService.ts,
services/priceTransactionService.ts ← system_version: `${FE_APP_VERSION}-frontend`
scripts/lint-design.mjs             ← regla version-literal (comentarios excluidos, pragma allow-version)
```

## Tests (diseño único, `conductor/PLAN_TEST_DESIGN_FRONTEND.md`)

- `src/domain/version/version.test.ts` — colocación junto al módulo de dominio.
- `src/services/__tests__/versionService.service.test.ts` — mock en `@/services/api`.
- `src/store/__tests__/useVersionStore.store.test.ts` — mock del servicio (frontera consumida);
  idempotencia del fetch + fail-open.
- `src/components/__tests__/SystemVersionBadge.test.tsx` — store real + servicio mockeado;
  asserts por `data-testid` y texto de fallback real (fakeT); nunca clases cosméticas.

## Excepciones documentadas

- `ProductFormModal.tsx` badge "v1.2" = versión de la **spec externa SIFEN** (SET Paraguay), no del
  sistema. Línea legacy (no bloquea); si se toca, marcar con pragma `allow-version`.
- `fiscal.inutilize.rangeTooBig` menciona "MT §11.1.1" (sección del Manual Técnico SIFEN) — matchea
  el guard pero es una referencia de spec, no una versión del sistema; idem pragma si se toca.
- Literales de versión permitidos SOLO en: `src/domain/version/`, tests, y líneas con
  `allow-version`.
- Limitación conocida del stripper de comentarios de `lint-design.mjs`: los literales de regex o
  secuencias con comillas dentro de código pueden desincronizar el estado de string/comentario y
  dejar pasar (o sobre-marcar) en ese archivo. Es un guard best-effort con escape hatch; los
  falsos positivos se resuelven con `allow-version` o whitelist.

## Cierre

- Gates: `npx vitest --run` (0 fallos), `npx tsc --noEmit` (0), `pnpm build`, `pnpm lint:design`.
- Release: bump `package.json` → `1.1.0`, tag `v1.1.0` en BE (9a91a32) y FE (HEAD del commit), regla
  agregada a AGENTS.md wrapper (Convenciones Frontend + §Versionado).

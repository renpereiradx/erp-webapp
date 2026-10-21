# PLAN — Eliminación y re-implementación de las pantallas BI (frontend)

**Fecha:** 2026-10-17 · **Rama de trabajo:** `feature/bi-ui-rebuild` (creada desde `dev`)
**Owner-decision:** el owner encontró secciones inventadas y hardcodeadas en las pantallas BI.
Decisión: **eliminar TODAS las pantallas BI del frontend y re-implementarlas de cero**,
pantalla por pantalla, sobre los endpoints reales del backend.

---

## 1. Estrategia de ramas (verificada 2026-10-17)

- `dev` es la línea viva: AGENTS.md (wrapper) §Versionado — "Los tags se crean sobre `dev` (línea viva)
  al cerrar el hito". El trabajo cotidiano va sobre `dev`.
- Estado actual `erp-webapp`: `dev` = `82710c7` (sincronizado con `origin/dev`, árbol limpio);
  `main` = `3d0c2a0`, **230 commits detrás de `dev` y 0 adelante** (merge-base = HEAD de main →
  fast-forward posible). `main` es solo snapshot de release.
- Flujo de este plan: `feature/bi-ui-rebuild` (desde `dev`) → integrar a `dev` al cerrar cada hito
  → `dev` → `main` en el próximo release taggeado (SemVer, AGENTS.md §Versionado).
- Regla: la rama se mantiene rebaseada/mergeada con `dev` periódicamente para no divergir 230-style.

## 2. Diagnóstico base (barridos del 2026-10-17)

### 2.1 Backend: 100% real, NO se toca

Superficie verificada en `business_management/internal/analytics/http/routes.go` (rama `dev`):
~150 endpoints GET en 12 grupos (`/dashboard/*`, `/receivables/*`, `/payables/*`,
`/financial-reports/*`, `/vat-prorrateo/*`, `/sales-analytics/*`, `/purchase-analytics/*`,
`/inventory-analytics/*`, `/profitability/*`, `/forecast/*`, `/api/v1/audit/*`), todos con SQL
real contra Postgres + caché Redis 60-120s, detrás de `biChain` = `RequireModule("bi")` →
permiso de módulo. **Cero stubs/mocks/hardcode en el BE** (única excepción histórica ya
centralizada en `internal/analytics/alert_routes.go`). Los pronósticos (`/forecast/*`) son
algoritmos estadísticos en Go (regresión/estacional/media móvil) sobre ventas históricas —
**no hay IA/ML externa**. Conclusión: la re-implementación es 100% frontend; el contrato está
inventariado y estable.

### 2.2 Frontend: qué está inventado/hardcodeado hoy

1. **Pronósticos BI en modo demo = 100% inventado**: `services/bi/biForecastingService.ts`
   (líneas 463-484) devuelve `services/mocks/biForecastingMock.js` (255 líneas: KPIs ₲150M/₲600M,
   insights "+15.4%", recomendaciones "SKU #2045") cuando `VITE_USE_DEMO=true`, sin llamar al BE.
2. **Mock muerto**: `src/data/mockInventoryAnalytics.ts` (150 productos fabricados, 0 consumidores).
   `src/data/mockInventoryABCData.ts` solo conserva tipos (nombre engañoso).
3. **Micro-hardcodes en páginas reales**: "Objetivo: 75%" (`features/receivables/components/OverdueKpiGrid.tsx:46`),
   claim "* Actualizado en tiempo real" (`pages/sales-analytics/Dashboard.tsx:316`), badge "Live"
   (`pages/Dashboard.tsx:547`), factura display `#FAC-000` fabricada (`domain/payables/dashboard.ts:~160`).
4. **Historial**: la auditoría `conductor/audits/bi-2026-09/` (50 páginas, matriz página×veredicto)
   documentó decenas de fabricaciones (curvas SVG inventadas, chips "Sincronizado" falsos, growth/churn
   literales, KPIs "$0" en sistema PYG, drift envelope `.data`, botones decorativos). Fueron parcheadas
   por partes (comentarios "Auditoría BI 2A/2E/2H" en el código) — el resultado es una colcha de parches
   que motiva esta re-implementación completa.

### 2.3 Decisión de alcance: qué capa se re-hace

| Capa | Decisión | Motivo |
|:--|:--|:--|
| Pantallas (pages/, features/*/components, hooks de feature, useDashboardStore, components/InventoryAnalytics) | **ELIMINAR y re-implementar** | Es donde viven las fabricaciones y el debt visual |
| `services/bi/*` (10 servicios) + `types/bi.ts` | **CONSERVAR** (excepto el fallback demo de biForecastingService) | Capa de contrato verificada real y testeada (`biServices.p0-methods`); reescribirla re-importaría el mismo fetch |
| `domain/{dashboard,payables,receivables,profitability,relational-analytics,sales-analytics,inventory-analytics,finance}` | **CONSERVAR** (con tests) | Lógica pura, testeada, sin fabricaciones; las pantallas nuevas se apoyan en ella. Excepción: revisar `domain/payables/dashboard.ts:~160` (FAC-000) |
| Infra de licencias (BiModuleRoute, entitlements, LicenseBanner, LicenseRequiredGate, LicenseStatusPage) | **CONSERVAR** | Es plumbing Core del pack, no pantalla BI |
| SIFEN (`/finance/sifen-ops`, `/finance/sifen-inutilizacion`) | **NO tocar** | Carve-out ADR-3: son Core (PermissionGuard `sifen:read`), no BI |
| `pages/AdminSessionsDashboard.tsx` + `features/sessions` | **NO tocar** | Pertenece a Configuración y Sistema, sin BiModuleRoute |
| i18n `bi.js` (es/en) + keys `nav.*` BI de `shell.js` | **ELIMINAR y re-agregar por pantalla** | Fuerza verificar keys es+en en el mismo diff de cada pantalla (regla 3 de tests) |

> Alternativa (si el owner la pide): purga total incluyendo services/domain. Costo: reescribir el
> contrato ya verificado; beneficio: cero herencia. Este plan asume la tabla de arriba.

**Compatibilidad TS de lo conservado (verificado 2026-10-17):** los 10 servicios `services/bi/*`,
los módulos `domain/*` de BI y `types/bi.ts` ya son `.ts` con tests `.ts` — cumplen la regla TS de
AGENTS.md. Los pocos `.js` del módulo (`hooks/useFinancialReports.js`, `lib/i18n/loadBiNamespace.js`,
`services/mocks/biForecastingMock.js`) se eliminan todos en F1: tras el teardown no queda ningún
`.js`/`.jsx` en superficie BI.

## 3. F1 — Remoción completa (el sistema queda shippeable sin BI)

### 3.1 Rutas a eliminar en `src/App.tsx` (~45)

- `/dashboard`, `/dashboard/financial-summary`, `/dashboard/kpis`, `/dashboard/sales-heatmap`,
  `/dashboard/alerts`, `/dashboard/top-products`, `/dashboard/receivables`, `/dashboard/payables`
- `/payables/*` (5: invoices, detail/:id, cash-flow, aging-report, suppliers/:id/analysis)
- `/finance/analytical-cash-flow`, `/finance/tax-management`, `/finance/profit-and-loss`,
  `/finance/legal-books` — **conservar** `/finance/sifen-*` (Core)
- `/bi/pronosticos/*` (5)
- `/profitability/*` (6)
- `/receivables/*` (6)
- `/sales-analytics/*` (9) · `/purchase-analytics/*` (2) · `/inventory-analytics/*` (4)
- `/auditoria` (4)
- `BiPermissionGuard`/`DashboardRoute` wrappers: quedan definidos (los reusa F2+) o se comentan
  con referencia a este plan — decisión del implementador, sin rutas muertas.

### 3.2 Archivos a eliminar

- **Páginas:** `src/pages/sales-analytics/` (8), `src/pages/purchase-analytics/` (2),
  `src/pages/InventoryAnalytics/` (4) + sueltos: Dashboard, FinancialSummaryDashboard, DetailedKPIs,
  SalesHeatmap, ConsolidatedAlerts, TopProductsOverview, ReceivablesDashboard, ReceivablesMasterList,
  ReceivableDetail, OverdueAccounts, ClientCreditProfile, AgingReport, PayablesDashboard,
  InvoicesMasterList, InvoiceDetail, CashFlowProjection, PayablesAgingReport, SupplierAnalysis,
  CashFlowAnalysisDashboard, TaxManagementDashboard, ProfitAndLoss, LegalBooks, AuditDashboard,
  AuditLogs, AuditLogDetail, AuditUserActivity.
- **Features:** `bi-forecasting/`, `profitability/`, `relational-analytics/`, `receivables/`,
  `accounts-payable/`, `cash-flow/`, `financial-reports/` (hooks). NO: `fiscal/`, `sessions/`.
- **Compartidos:** `components/InventoryAnalytics/` (12 archivos), `store/useDashboardStore.ts`,
  `hooks/useFinancialReports.js`, `components/InventoryAnalytics` consumers check.
- **Mocks:** `services/mocks/biForecastingMock.js`, `data/mockInventoryAnalytics.ts`;
  `data/mockInventoryABCData.ts` → mover sus 2 interfaces al feature de inventario en F5 y borrarlo.
- **i18n:** `locales/{es,en}/bi.js`, `lib/i18n/loadBiNamespace.js` + su llamada en `main.tsx:10-12`;
  keys `nav.*` BI en `locales/{es,en}/shell.js` (las fallbacks inline de navigation.ts se van con el bloque).
- **Tests (regla 6 — delete con sujeto, documentado aquí):** `src/pages/__tests__/` (23 page tests BI),
  `features/{bi-forecasting,profitability,accounts-payable,cash-flow,receivables}/__tests__/`,
  `store/__tests__/useDashboardStore.store.test.ts`. **Ajustar (no borrar):**
  `layouts/main/__tests__/navigation.bi-pack.test.ts` (grupo BI ausente también con `biEnabled=true`
  durante la ventana), `components/auth/__tests__/bi-pack-routes.test.tsx` (HomeRedirect sin ruta
  `/dashboard` → siempre `/pedidos` hasta F2).

### 3.3 Nav, links y redirecciones (checklist de remoción → re-ubicación)

Cada fila se ELIMINA en F1 y se RE-ACTIVA en la fase indicada (mismo diff que la pantalla):

| # | Punto de entrada | Archivo:línea (hoy) | Acción F1 | Re-activa |
|:--|:--|:--|:--|:--|
| 1 | Grupo nav "Inteligencia de Negocios" completo (10 subgrupos) | `layouts/main/navigation.ts:61-195` | eliminar bloque spread `biEnabled` (dejar parámetro/firma para F2+) | F2-F11 por grupo; padre aparece al tener ≥1 hoja (`filterNavigationItems`) |
| 2 | Click en marca del sidebar → `/dashboard` | `layouts/main/Sidebar.tsx:41` | → `/pedidos` | F2 |
| 3 | HomeRedirect con pack BI → `/dashboard` | `components/auth/HomeRedirect.tsx:21-27` | → siempre `/pedidos` (+ ajustar test) | F2 |
| 4 | Breadcrumb "Inicio" PartiesPage → `/dashboard` | `pages/PartiesPage.tsx:48` | → `/pedidos` | F2 |
| 5 | Fallback 403 PermissionGuard/RoleGuard → `/dashboard` | `components/auth/{PermissionGuard,RoleGuard}.tsx:74/76` | → `/pedidos` | F2 |
| 6 | Redirect ReservationsModuleRoute off → `/dashboard` | `App.tsx:204` | → `/pedidos` | F2 |
| 7 | Link "Ir al Dashboard" en 404 | `App.tsx:933` | → `/pedidos` o quitar | F2 |
| 8 | Botón "Productos que compra" (modal cliente) | `features/party/components/ClientDetailsModal.tsx:68` | eliminar botón | F3 |
| 9 | Botón "Análisis de Riesgo" (modal cliente) | `features/party/components/ClientDetailsModal.tsx:80` | eliminar botón | F7 |
| 10 | Botón "Productos suministrados" (modal proveedor) | `features/party/components/SupplierDetailsModal.tsx:86` | eliminar botón | F3 |
| 11 | Botones "Ver compradores" + "Comparar proveedores" (modal producto) | `features/products/components/ProductDetailsModal.tsx:164,172` | eliminar botones | F3 |
| 12 | Rutas BI en buscador global sin gate | `config/searchableRoutes.js` (`/receivables/list`, `/payables/invoices`, `/finance/tax-management`, `/finance/legal-books`) | eliminar entradas | F7/F8/F9 **con** `requiredModule: 'bi'` + permiso de la cadena BE. F7 (`receivables:read`) y F8 (`payables:read`) hechos; `/finance/*` queda para F9 |
| 13 | Filtro `isDegradableBI` del buscador | `layouts/main/search.ts:36-88` | conservar (no-op sin ítems BI) | — |
| 14 | Tabs internas pronósticos | `features/bi-forecasting/components/BIForecastingNav.tsx` | muere con la feature | F11 |
| 15 | Cross-links internos BI (Dashboard→kpis/receivables/alerts, aging→detail, audit→usuarios, pivotes RowActionsMenu) | ver inventario por página | mueren con sus páginas | vuelven con cada pantalla |

Nota: `vite.config.js:143-145` (chunk `recharts`) se conserva — sin importadores el chunk no se genera.

**Criterio de salida F1:** `npx vitest --run` 0 fails · `tsc --noEmit` 0 · `pnpm build` · `pnpm lint:design`
· smoke manual: login admin+pack aterriza en `/pedidos`, sidebar sin grupo BI, SIFEN visible en grupo
"Fiscal (SIFEN)", modales cliente/proveedor/producto sin botones BI, buscador global sin rutas BI.
Commits: `refactor(bi): remove BI screens — F1 teardown (PLAN_REBUILD_BI_UI)`.

## 4. Fases de re-implementación (F2-F11)

Orden por valor: primero la landing del pack (dashboard), luego los drill-downs que desbloquean
botones de módulos Core, después los grupos analíticos puros, pronósticos al final (mayor deuda).

| Fase | Grupo | Rutas/pantallas | Insumos |
|:--|:--|:--|:--|
| F2 | Dashboard BI | `/dashboard`, `/dashboard/kpis`, `/dashboard/sales-heatmap`, `/dashboard/alerts`, `/dashboard/top-products` (+ useDashboardStore nuevo, HomeRedirect/brand/404/guards → `/dashboard`) | audit pages `Dashboard-*.md`; endpoints `/dashboard/*` |
| F3 | Drill-downs relacionales | `/sales-analytics/products/buyers`, `/sales-analytics/customers/top-products`, `/purchase-analytics/suppliers/top-products`, `/purchase-analytics/products/suppliers` (+ botones modales #8/#10/#11, nav Compras) | audit `Sales-*.md`/`Purchase-*`; endpoints `/sales-analytics/{products,customers}/…`, `/purchase-analytics/…`; `domain/relational-analytics` se reusa |
| F4 | Analítica de Ventas | `/sales-analytics/{dashboard,products-categories,insights,trends-velocity,period-comparison,discounts}` (nav grupo Ventas completo) | audit `Sales-*.md`; `/sales-analytics/*` |
| F5 | Analítica de Inventario | `/inventory-analytics/{dashboard,turnover-abc,stock-levels,risk}` | audit `Inventario-*.md`; `/inventory-analytics/*` |
| F6 | Rentabilidad | `/profitability/{dashboard,products,customers,categories,trends,sellers}` | audit `Rentabilidad-*`; `/profitability/*` |
| F7 | Cuentas por Cobrar | `/receivables`, `/receivables/list`, `/receivables/detail/:id`, `/receivables/overdue`, `/receivables/client-profile/:clientId`, `/receivables/aging-report` (+ botón #9, searchableRoute) | audit `CxC-*.md`; `/receivables/*` |
| F8 | Cuentas por Pagar | `/payables/*` 5 rutas + `/dashboard/payables` (+ searchableRoute) | audit `CxP-*.md`; `/payables/*` |
| F9 | Reportes Financieros | `/dashboard/financial-summary`, `/finance/{analytical-cash-flow,tax-management,profit-and-loss,legal-books}` (+ searchableRoutes ×2; SIFEN ya Core queda en su grupo) | audit `FinReportes-*.md`; `/financial-reports/*`, `/vat-prorrateo/*` |
| F10 | Auditoría | `/auditoria`, `/auditoria/logs`, `/auditoria/logs/:id`, `/auditoria/usuarios/:id` | audit `Auditoria-*.md`; `/api/v1/audit/*` |
| F11 | Pronósticos | `/bi/pronosticos/{dashboard,inventario,ventas,demanda,ingresos}` — SIEMPRE contra `/forecast/*` real, **sin fallback mock** (biForecastingService pierde el branch demo en F1) | audit `Pronosticos-*`; decidir con owner si el label "(IA)" se mantiene (el BE es estadístico, no IA) |

**Plantilla arquitectónica obligatoria por grupo (AGENTS.md: TypeScript + Feature-Sliced + dominio puro).**
Cada fase re-implementa su grupo con esta estructura — no es opcional:

```
src/features/<grupo>/          ← p.ej. features/bi-dashboard, features/sales-analytics
├── components/                ← SOLO UI pura (Radix UI + Fluent 2): sin fetch, sin cálculo, sin reglas
├── hooks/                     ← orquestación: react-query sobre services/bi/*, estado de UI, atajos
└── types/                     ← tipos TS del feature (payloads ya tipados en services/bi/* + types/bi.ts)

src/domain/<grupo>/            ← lógica pura: derivaciones, formatos, sorting, umbrales de riesgo
│                                sin imports de React, sin side effects, tests colocados (*.test.ts)
src/pages/<Grupo>/*.tsx        ← página delgada: layout + composición del feature (§6.3 DESIGN.md)
```

- **TODO archivo nuevo es `.ts`/`.tsx`** — regla AGENTS.md, sin excepciones (regla §5.8 con gate).
- **HTTP solo en `services/bi/*`** (frontera del módulo — también frontera de mock en tests,
  PLAN_TEST_DESIGN §2); hooks llaman servicios, componentes reciben props.
- **Dirección de dependencias**: `pages → features → (domain, services)`; un feature NO importa
  componentes de otro feature — lo compartido va a `src/components/` (como hoy `components/ui/`).
- **Estado**: global solo si es compartido entre grupos (el `useDashboardStore` nuevo nace `.ts`
  en `src/store/`, zustand); el resto vive en hooks del feature con react-query + `useState`.
- Dominio nuevo (cálculos que hoy no existen) se agrega a `domain/<grupo>/` CON test en el mismo
  diff — prohibido derivar cifras dentro de componentes.

**Cada fase cierra con:** estructura según plantilla de arriba (TS estricto + FSD) ·
todo dato renderizado proviene de endpoint (cero literales de cifras/metas/claims) · i18n keys es+en
en el mismo diff · page test + hooks tests según `PLAN_TEST_DESIGN_FRONTEND.md` · nav/link checklist
fila(s) re-activadas · `vitest`/`tsc`/`build`/`lint:design` verde · smoke vivo en `pnpm dev:api`
(receta JWT en memoria `live-smoke-jwt-dev-recipe`) · auditoría `vercel-react-best-practices`
aplicada con criterio (sin reporte en conductor salvo pedido).

## 5. Reglas anti-invención (aplican a TODAS las fases)

1. **Ninguna cifra/meta/porcentaje/claim en el JSX**: si el endpoint no lo trae, no se muestra.
   Prohibido "Objetivo X%", "en tiempo real", badges "Live", growth literales (casos reales en §2.2).
2. **Sin mocks ni fallbacks demo en servicios BI**: solo `services/bi/*` → API. `DEMO_CONFIG` no
   interviene en BI (el modo demo queda para auth/entitlements, no para datos).
3. **Gate grep por pantalla nueva**: `grep -rnE 'mock|Math\.random|sample|dummy|placeholder'`
   en los archivos de la fase debe volver vacío (o justificado en el commit).
4. **Envelope `.data`**: todo consume `{rows,total,…}`/`.data` según el servicio — los drifts
   NA-DB-1/P0-2 de la auditoría 2026-09 fueron el fallo #1; los tests de servicio existen para esto.
5. **Formato money**: `formatPYG`/helpers de domain en TODOS los montos (auditoría encontró "$0").
6. **Estados honestos**: loading/error/empty explícitos; nunca ceros silenciosos.
7. **DESIGN.md primero**: leer antes de maquetar; patrones §6.3 (card con tabla), Fluent 2,
   glass-mica/acrylic en modales, atajos §12 si aplica buscador.
8. **TypeScript sin excepciones (AGENTS.md)**: todo archivo nuevo `.ts`/`.tsx`. Gate por fase:
   `git diff --name-only --diff-filter=A main..HEAD -- src/ | grep -E '\.(js|jsx)$'` → vacío.
9. **Botones accionables o no existen**: si no hay handler/endpoint, no se renderiza.

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|:--|:--|
| Ventana sin BI para clientes con pack pagado | F1 se integra solo cuando la rama esté completa o el owner lo decide; alternativa: integrar F1+F2 juntos para minimizar la ventana sin landing |
| Divergencia larga feature/dev | rebase/merge desde `dev` al cierre de cada fase; ramas cortas por fase si hace falta |
| Tests de guard/nav quebrados en la ventana | ajustes puntuales listados en §3.2 (documentados acá, no "skip") |
| Re-inventar fabricaciones por confianza | reglas §5 + revisión de la fila de auditoría `audits/bi-2026-09/pages/<página>.md` antes de cada pantalla |
| Contrato BE cambia mientras tanto | BE congelado para BI (FASE 10 completa); cualquier cambio de endpoint exige tocar `services/bi/*` + pantalla en el mismo diff |

## 7. Referencias

- Auditoría BI 2026-09: `conductor/audits/bi-2026-09/` (SUMMARY + 1 archivo por página)
- Plan original del pack: `conductor/BI_PACK_PREMIUM_LICENCIAS_FRONTEND_2026-09-21.md`
- REQ funcional: `docs/requirements/REQ_BIPACK_LICENCIAMIENTO_BI.md` (wrapper)
- Superficie BE: `business_management/internal/analytics/http/routes.go` (12 grupos, ~150 GET)
- Tests: `conductor/PLAN_TEST_DESIGN_FRONTEND.md` · Diseño: `DESIGN.md`

---

## 8. Estado de ejecución — F1 (2026-10-20)

**Rama:** `feature/bi-ui-rebuild` · **Base:** `dev` = `82710c7` (sincronizada con `origin/dev`, 0/0).

### Ejecutado

- Rutas BI eliminadas de `src/App.tsx` (~45); SIFEN preservado con `PermissionGuard sifen:read`.
- 174 archivos eliminados: páginas BI, features (`bi-forecasting`, `profitability`,
  `relational-analytics`, `receivables`, `accounts-payable`, `cash-flow`, `financial-reports`),
  `components/InventoryAnalytics/`, `store/useDashboardStore.ts`, `hooks/useFinancialReports.js`,
  mocks BI y 35 tests (22 page tests + 12 feature tests + 1 store test).
- Puntos de entrada §3.3 re-ubicados: HomeRedirect/BranchSelection/Sidebar/Partidas/guards/404 →
  `/pedidos`; modales cliente/proveedor/producto sin botones BI; `searchableRoutes` sin rutas BI.
- Nav: grupo BI eliminado con cualquier valor de `biEnabled`; SIFEN queda como grupo Core propio.
- `biForecastingService` pierde el branch demo (`DEMO_CONFIG`/mocks) — solo `/forecast/*` real.
- `domain/payables/dashboard.ts`: eliminado el fallback fabricado `#FAC-000` (test agregado).

### Decisiones de borde (documentadas)

- `src/types/inventoryAnalytics.ts` se eliminó: quedó sin consumidores al borrar la UI legacy.
- Namespaces i18n `dashboard`, `receivables` y `payables` se eliminaron: solo los consumían
  pantallas BI borradas; F2/F7/F8 los re-agregan por pantalla.
- Las 3 keys de paginación que vivían en `bi.*` (`TablePagination`, componente ui compartido) se
  movieron a `common.pagination.*` (es+en).
- Plan estimaba 23 page tests; el repo tenía 22 (no existe test de `AuditLogDetail`/`Dashboard`).

### Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: 188 archivos / 1378 tests OK.
- `pnpm build`: OK.
- `pnpm lint:design`: OK (código nuevo limpio).
- Smoke manual (login admin+pack → `/pedidos`, sidebar sin BI, SIFEN visible, modales y buscador
  sin BI): **pendiente de validación del owner** con `pnpm dev:api`.

---

## 9. Estado de ejecución — F2 Dashboard BI (2026-10-20)

**Rama:** `feature/bi-ui-rebuild` (1 commit de F1 sobre `dev` = `82710c7`).

### Ejecutado

- **Rutas (5)** en `src/App.tsx`: `/dashboard`, `/dashboard/kpis`,
  `/dashboard/sales-heatmap`, `/dashboard/alerts`, `/dashboard/top-products`, todas lazy y
  envueltas en `DashboardRoute` = `BiModuleRoute` (pack) → `PermissionGuard(dashboard:read)`,
  el mismo orden que la cadena BE (`RequireModule` → permiso de módulo).
- **Feature `src/features/bi-dashboard/`** con la plantilla FSD: `components/` (solo UI pura),
  `hooks/useDashboardQueries.ts` (react-query sobre `services/bi/dashboardService`) y barrel
  público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/dashboard/`: `DashboardPage`, `DashboardKpisPage`,
  `SalesHeatmapPage`, `AlertsPage`, `TopProductsPage` (layout + composición).
- **Dominio puro** en `src/domain/dashboard/`: `alerts.ts` y `heatmap.ts` re-escritos contra el
  contrato real; `kpis.ts`, `trends.ts`, `topProducts.ts` nuevos; `shared.ts` endurecido
  (`getTimeAgo` devuelve `''` con timestamp inválido en vez de "Invalid Date"). Todos con tests
  colocados.
- **`src/store/useDashboardStore.ts`** nuevo (`.ts`, zustand): solo estado de UI compartido
  (`period`, `heatmapWeeks`). Los datos de servidor viven en react-query.
- **Contrato tipado real** en `src/types/bi.ts` + `services/bi/dashboardService.ts`:
  `DashboardSummary` anidado por área (no la forma plana legacy), 5 grupos de KPIs, trends,
  alerts, top-products, heatmap y recent-activity; el servicio conserva el envelope
  `{success,data,metadata}` para que el hook pueda leer `metadata.partial`. Sin fallback demo.
- **Puntos de entrada §3.3 re-activados**: grupo nav `Inteligencia de Negocios` → subgrupo
  `Dashboard` (5 hojas), HomeRedirect (`dashboard:read` + pack; vendor puro sigue en
  `/pedidos`), BranchSelection (misma regla), marca del Sidebar, breadcrumb de Parties,
  fallbacks de `PermissionGuard`/`RoleGuard`, redirect de reservas y 404 → `/dashboard`.
- **i18n**: namespaces `dashboard` en `locales/{es,en}/dashboard.ts` (mismas claves, 116
  estáticas verificadas) + `nav.*` BI en `shell.js` + `roleGuard.goDashboard` y 404 con
  `notFound.backToDashboard`.

### Decisiones de borde (documentadas)

- **Alertas sin `action_url` en F2**: los destinos del catálogo BE son pantallas que aún no
  existen (`/inventory-analytics/*` F5, `/profitability/*` F6, `/receivables/overdue` F7). Se
  renderizan solo severidad/categoría/detalle; el botón "Gestionar" vuelve cuando su pantalla
  destino exista (regla §5.9, sin affordances muertas).
- **Tendencias**: el panel usa solo ventas, compras y ticket promedio. Se omiten
  `gross_margin` (el BE lo calcula como ventas − compras, distinto del margen del summary que
  usa COGS) y `customer_count` (el BE lo llena con la cantidad de ventas, no de clientes);
  mostrarlos con el label del JSON sería una cifra engañosa.
- **Top productos**: los totales del endpoint suman solo los N productos devueltos; la UI los
  rotula "Ingresos del top" / "Utilidad del top" (no "totales del negocio"). Límite fijo 10,
  sin paginación: el contrato devuelve un ranking, no un listado paginado.
- **Heatmap**: grilla completa 0-23 h (el BE devuelve todas las horas; recortar a 8-21 ocultaba
  datos), celdas con `sales_count` y tooltip/aria con `sales_total` en PYG. Se eliminó el
  símbolo `$` y la intensidad pasó a niveles 0-3 (sin `$$`/`$$$`).
- **Períodos honestos**: `week/month/year` del BE son semana/mes/año **calendario**
  (`Period.Resolve`), no ventanas móviles; los labels dicen "Esta semana / Este mes / Este año"
  en vez de "7D/30D".
- **Filtros de alertas client-side** sobre el payload completo: los contadores del resumen del
  servidor no cambian al filtrar y no se disparan refetch por cada chip.
- Los dos módulos de locale nuevos son `.ts` (no `.js`) para cumplir el gate TS de AGENTS.md.

### Tests

- 5 page tests (`Dashboard`, `DashboardKpis`, `SalesHeatmap`, `Alerts`, `TopProducts`) + test de
  hooks react-query + test del store + test de contrato del servicio + tests de dominio
  (`alerts`, `heatmap`, `kpis`, `trends`, `topProducts`, `shared`).
- Tests F1 ajustados: `navigation.bi-pack.test.ts` (grupo BI presente con pack y 5 rutas),
  `bi-pack-routes.test.tsx` (HomeRedirect → `/dashboard` con pack/permiso; BiModuleRoute igual)
  y `BranchSelection.page.test.tsx` (dashboard con pack, pedidos sin pack).

### Pase UX — Operación del negocio (post-smoke)

- La grilla de 5 KPI cards dentro de una card de media página se reemplazó por un **ledger**:
  icono tonal + label/hint a la izquierda, cifra completa a la derecha. A 1440 px las cards
  quedaban de ~90 px y los montos (`Gs. 13.377.100`, `Gs. 6.414.250`) se partían en dos líneas.
- Hints pasaron a formato `Label: valor` (`Cajas abiertas: 1`, `Cuentas vencidas: 1`,
  `Esta semana: Gs. 0`) para evitar plurales falsos como "1 cajas abiertas".
- En mobile el valor baja a una línea propia debajo del hint (grid de 2 columnas), sin recortar
  montos; en `sm+` vuelve a la columna derecha.
- `DashboardSection` gana `min-w-0`: una tabla ancha (Trends) fijaba el min-content del grid item
  y recortaba la card hermana en mobile.
- Test de componente `OperationsPanel.test.tsx` (5 filas, valores completos, hints y semántica
  `dl`/`dt`/`dd`).

### Pase UX — Actividad reciente (post-smoke)

- La fila pasa de 50/50 a `xl:grid-cols-5` con **Alertas 2/5 · Actividad 3/5**: las
  descripciones de ventas/pagos son largas y necesitan más ancho que las 2 alertas.
- `formatActorName` (dominio) colapsa repeticiones adyacentes: el BE manda
  `first_name + last_name` y la UI mostraba "ADMINISTRADOR ADMINISTRADOR".
- Descripción en `text-body-md-bold`; metadata compacta tipo · actor · tiempo en una sola
  línea con `time[dateTime]`; icono tonal por tipo (venta/compra/pago/ajuste/otro).
- Columna de importe estable: monto en `text-title-md` o `—` con `aria-label="Sin importe"`
  cuando el movimiento no tiene monto.
- Mobile: grilla de 2 columnas con el importe debajo de la metadata (sin robarle ancho a la
  descripción); `sm+` restaura la columna derecha. Verificado a 390/1440 px: 6 filas, 0
  overflow, sin actor duplicado y 0 errores de consola.
- Tests: `domain/dashboard/activity.test.ts` y `ActivityPanel.test.tsx`.

### Cierre de wraps (2026-10-20)

- **Cards superiores**: el valor de `KpiCard` baja a `text-title-md` (20 px) y la grilla del
  summary pasa a 2 columnas hasta `lg` y 4 desde `xl`. `Gs. 13.377.100` deja de partirse a
  1280/1440 y las 4 cards no se comprimen en tablet.
- **Comparación**: la tabla de 4 columnas se reemplaza por una lista de 3 métricas (label +
  "Anterior" a la izquierda; cifra actual + variación a la derecha). El monto nunca se parte y
  la card vuelve a 50/50 con Operación del negocio (`xl:grid-cols-2`).
- **Operación del negocio**: hints acortados (`Bajo: 5 · Agotado: 1`, `Esta semana: Gs. 0`)
  para que entren en una línea en la card de 50 % a 1280 px.
- **Filas**: `DashboardSection` usa `h-full` para que las cards 50/50 igualen altura; la fila
  Alertas/Actividad usa `items-start` para que Alertas no quede como una card vacía enorme.
- **Breakpoints**: Trends/Operaciones se apilan hasta `xl`; Alertas/Actividad también, evitando
  cards de 250 px en tablet.
- Verificado a 1440/1280/1024/390 px: todos los montos en una línea, `bodyOverflow=false`,
  hints de operaciones en una línea, 0 errores de consola.
- Test de componente `TrendsPanel.test.tsx` (3 métricas, actual/anterior/variación, sin tabla).

### Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: 203 archivos / 1462 tests OK.
- `pnpm build`: OK (chunks lazy por página: `DashboardPage`, `DashboardKpisPage`,
  `SalesHeatmapPage`, `AlertsPage`, `TopProductsPage`).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; legacy fuera del diff no bloquea).
- `pnpm lint` (eslint): **OK** (0 errores). Se eliminaron las 3 claves duplicadas muertas de
  `categories.js` (es/en) y `cashMovement.js` (es) que eran los únicos errores; quedan 132
  warnings legacy.
- Smoke vivo ejecutado contra el backend `:5050` + Vite `:5173` (`--mode api`), con JWT de dev
  acuñado en memoria (admin `jJkV4F6HR`, rol `F2VLso`, entitlements `core+bi`):
  - `/` aterriza en `/dashboard` (HomeRedirect con pack).
  - Sidebar: grupo **INTELIGENCIA DE NEGOCIOS** con las 5 entradas del Dashboard y
    **FISCAL (SIFEN)** como grupo Core.
  - `/dashboard` muestra el summary real (ventas Gs. 1.475.500, compras Gs. 275.000, utilidad
    bruta Gs. 530.500, inventario Gs. 13.377.100) — sin ceros falsos.
  - `/dashboard/kpis`, `/sales-heatmap` (168 celdas, sin `$`), `/alerts` (2 alertas activas,
    sin botones muertos) y `/top-products` (6 filas, tendencias sin flotantes crudos) renderizan.
  - 0 errores de consola y 0 respuestas HTTP ≥400.
  - Nota operativa: el rename de los locales `dashboard.js` → `.ts` requirió tocar los
    `index.js` de i18n para que el Vite long-lived re-resolviera el módulo; un reinicio de
    `pnpm dev:api` produce el mismo efecto.
- Sin push: la rama queda con F1+F2 locales.

---

## 10. Estado de ejecución — F3 Drill-downs relacionales (2026-10-20)

**Rama:** `feature/bi-ui-rebuild` (F1+F2 sobre `dev` = `82710c7`).

### Ejecutado

- **Rutas (4)** en `src/App.tsx`, lazy y con `AnalyticsRoute` =
  `BiModuleRoute` (pack) → `PermissionGuard(analytics:read)`, el mismo par que
  `biChain("analytics:read", …)` del BE:
  `/sales-analytics/products/buyers`, `/sales-analytics/customers/top-products`,
  `/purchase-analytics/suppliers/top-products`, `/purchase-analytics/products/suppliers`.
- **Feature `src/features/relational-analytics/`** con la plantilla FSD:
  `components/` (solo UI), `hooks/` (react-query + picker + copia), `types/` y
  barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/sales-analytics/` (2) y
  `src/pages/purchase-analytics/` (2): config de columnas, labels, menú por
  fila y composición del `DrilldownScreen`.
- **Dominio puro** en `src/domain/relational-analytics/`: whitelist de sort
  espejo de `ParseRelationalSort` + `withSortableColumns`, validación de rango
  de fechas, identidad de entidad (nombre/documento/SKU con fallback al id),
  formateadores money/units/count/date. Todo con tests colocados.
- **Servicio tipado** `services/bi/relationalAnalyticsService.ts`: 4 métodos
  con `BIEnvelope<RelationalResponse<Row>>` (rows del contrato #1/#2/#3/#4),
  limpieza de params y telemetría de error. Test de contrato de rutas/params.
- **Puntos de entrada §3.3 re-activados**:
  - Grupo nav BI: subgrupos `Analítica de Ventas` (Compradores por Producto,
    Productos por Cliente) y `Analítica de Compras` (Productos Suministrados,
    Comparar Proveedores), con `analytics:read`. F4 completa Ventas.
  - #8 modal de cliente → Productos que compra.
  - #10 modal de proveedor → Productos suministrados.
  - #11 ficha de producto → Ver compradores + Comparar proveedores.
  - Los 3 botones usan el componente compartido `components/bi/BiDrilldownButton`,
    que se oculta sin pack BI o sin `analytics:read` (evita un botón que
    termina en redirect). `searchableRoutes` sigue pendiente de F7/F8/F9.
- **i18n**: namespace `relationalAnalytics` en `locales/{es,en}` + claves
  `nav.*` de los dos subgrupos; test de paridad es/en y de claves nav.
- **Compartido**: `QueryBoundary` y `TableEmptyState` se promovieron de
  `features/bi-dashboard/` a `components/ui/` para que F3 no importe de otra
  feature (F2 actualizado a la ruta compartida).
- **Fix Core detectado en el smoke**: `variantService.getVariantById` devolvía
  `response.data` sobre un endpoint que responde la variante directa (sin
  envelope) → `undefined` y la cabecera caía al id. Ahora tolera ambas formas;
  test agregado.

### Decisiones de borde (documentadas)

- **Insumos de auditoría**: la auditoría 2026-09 no tiene archivos para estos
  4 drill-downs (se agregaron después del barrido). La verificación se hizo
  contra el contrato §4 (`internal/analytics/relational.go`), el SQL de los
  repos y los endpoints en vivo, más los tests de contrato del servicio.
- **Nombres de entidad**: la URL solo lleva el id; la cabecera resuelve el
  nombre contra el endpoint Core de la entidad (`/products/{id}`,
  `/api/v1/clients/{id}`, `/api/v1/suppliers/{id}`) y cae al id si falla. La
  query BI nunca depende de esa resolución (corren en paralelo).
- **Sort**: las columnas ordenables se derivan de la whitelist del BE
  (`withSortableColumns`), no se marcan a mano; un campo fuera de la lista
  sería un 400. Defaults del BE visibles desde el primer render
  (`-total`, `-units`, `+last_unit_price`).
- **Envelope**: si `data` falta, la query falla y se muestra el error; nunca
  una tabla vacía silenciosa. El mensaje visible es i18n; el error crudo queda
  en telemetría.
- **Filtros**: fecha server-side (aplican al elegirlas), texto con
  draft/aplicado (Enter/Aplicar, F2 enfoca el buscador). Un rango `Desde >
  Hasta` bloquea la query, muestra el aviso y oculta la tabla anterior.
  Cambiar de entidad limpia filtros y página (nuevo análisis = estado limpio).
- **Placeholder de paginación**: `keepPreviousData` solo dentro del mismo
  scope (endpoint + entidad + variante); al cambiar de producto/cliente no se
  muestran filas de la entidad anterior mientras carga.
- **Unidades**: la UOM base se muestra real (`40 kg`, `1,5 kg`); los códigos
  genéricos (`unit`/`unidad`) se rotulan `ud.`/`uds.` y `units <= 0` se
  muestra `—`: el BE devuelve 0 cuando `sdBaseQty` no pudo normalizar, no una
  venta de 0 unidades (había filas con importe real y "0 uds.").
- **Fechas**: se formatean con el locale de la UI (`es-PY`/`en-US`), no con el
  del navegador (en un navegador en inglés las fechas de una pantalla es
  salían `5/22/2026`).
- **#4 (proveedores por producto)**: los montos usan la `currency` que declara
  cada fila; se eliminó la columna "Moneda" porque el símbolo ya está en cada
  monto y liberaba ancho para las 8 columnas. El banner
  `excluded_other_currency` sale del payload y solo aparece si el BE excluyó
  compras en otra moneda. `last_unit_price` ordena ASC por defecto (D5: el
  más barato primero).
- **Menú por fila**: pivotes reales entre los 4 análisis + copiar
  documento/SKU (clipboard con toast). Resúmenes en formato `Label: valor`
  (`Compras: 3`) para no imprimir "1 compras"; el importe va primero para que
  un truncado no se lleve la cifra principal.
- **Picker**: producto con la búsqueda plana canónica (`granularity=variant`,
  signal reenviado al HTTP); clientes/proveedores con `searchByName` (no
  acepta signal — deuda Core preexistente; el dropdown descarta respuestas
  viejas). "Cambiar" vuelve al picker conservando la ruta.
- **Mobile**: buscador a ancho completo y aviso "Deslizá la tabla…" para la
  tabla densa (scroll horizontal dentro de la card, sin overflow del body).

### Tests

- Dominio: `sort` (whitelist/defaults/columnas), `entity`, `filters`,
  `normalize` (money/units/date/count) — 38 tests.
- Servicios: contrato de los 4 endpoints + limpieza de params + error
  telemetrizado; `variantService.getVariantById` (respuesta directa y envelope).
- Feature: `useDrilldownQuery` (9), `useDrilldownEntity`, `useEntitySearch`,
  `DrilldownTable` (formatos, aria-sort, empty, colSpan).
- Páginas: `ProductBuyers` (11: picker, fetch, draft/aplicado, sort, empty,
  rango inválido, error/retry, menú, copiar, variante/base),
  `RelationalTopProducts` (6: #2/#3, UOM, costo, pivotes, picker cliente) y
  `ProductSuppliers` (6: sort default, moneda, banner D3, menú, picker, cambiar).
- Modales: `BiDrilldownButton` (gating + navegación), cliente, proveedor y
  producto (botones BI + navegación + ocultamiento sin pack).

### Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: 217 archivos / 1556 tests OK.
- `pnpm build`: OK (chunks lazy por página: `ProductBuyersPage`,
  `CustomerTopProductsPage`, `SupplierTopProductsPage`, `ProductSuppliersPage`;
  feature compartida en un chunk de ~20 kB).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: sin `mock`/`Math.random`/`sample`/`dummy` en
  código de producción de la fase; los únicos matches son `vi.mock` de tests
  y props `placeholder` de los buscadores.
- Gate TS: `git diff --name-only --diff-filter=A dev..HEAD -- src/ | grep -E
  '\.(js|jsx)$'` → vacío (solo se agregaron `.ts`/`.tsx`). La variante
  `main..HEAD` del §5.8 lista los `.js` legacy que ya venían en los 230
  commits de `dev` anteriores a la rama, no archivos de esta fase.
- **Smoke vivo** contra backend `:5050` + Vite `:5173` (`--mode api`) con JWT de
  dev (`admin` `jJkV4F6HR`, rol `F2VLso`, sesión 1379):
  - Los 4 endpoints responden 200 con datos reales; sort server-side verificado
    en la UI (`-purchases`, `-last_unit_price`).
  - 4 páginas renderizadas con contexto resuelto (producto/cliente/proveedor),
    paginación real y 0 overflow del body a 1440/390 px.
  - Sidebar: BI con Dashboard + Analítica de Ventas/Compras; FISCAL (SIFEN)
    como grupo Core.
  - Picker: búsqueda "coca" → 1 resultado → filas; F2 enfoca el buscador;
    "Cambiar Producto" vuelve al picker.
  - Variante: `?product_id=Cc2y5JnvR&variant_id=cY_Aif-vg` muestra el nombre de
    la variante y filtra el request (`variant_id`).
  - Modales: ficha de producto (2 botones), cliente y proveedor (1 botón cada
    uno) navegan a su drill-down y cierran el modal. 0 errores de consola y 0
    respuestas HTTP ≥400.

### Pendiente / deuda declarada

- `searchableRoutes` de las rutas BI sigue vacío hasta F7/F8/F9 (con
  `requiredModule: 'bi'`).
- `searchByName` de clientes/proveedores no acepta `AbortSignal` (deuda Core).
- Los agregados #1/#2/#3 no traen código de moneda: se formatean como PYG
  (moneda base de la instalación), igual que F2; #4 sí usa `currency`.
- Sin push: F1+F2+F3 quedan locales en la rama.

---

## 12. Estado de ejecución — F4 Analítica de Ventas (2026-10-20)

**Rama FE:** `feature/bi-ui-rebuild` (F1+F2+F3 sobre `dev` = `82710c7`).
**Backend:** fix de agregados en `dev` (ver §12.2), sin cambio de contrato.

### 12.1 Ejecutado

- **Rutas (6)** en `src/App.tsx`, lazy, con los mismos guards que la cadena BE:
  `/sales-analytics/{dashboard,products-categories,insights,trends-velocity,period-comparison}`
  con `AnalyticsRoute` (`BiModuleRoute` → `analytics:read`) y
  `/sales-analytics/discounts` con `ReportsRoute` (`BiModuleRoute` →
  `reports:read`, el subrouter propio del BE).
- **Feature `src/features/sales-analytics/`** con la plantilla FSD:
  `components/` (UI pura), `hooks/` (react-query, período en URL, refresh),
  `types/` y barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/sales-analytics/`:
  `SalesDashboardPage`, `ProductsCategoriesPage`,
  `CustomerSellerInsightsPage`, `TrendsVelocityPage`, `PeriodComparisonPage`
  y `DiscountsPage`.
- **Dominio puro** en `src/domain/sales-analytics/`: `format`, `periods`,
  `kpis`, `trends`, `products`, `customers`, `velocity`, `comparison`,
  `discounts` y `constants`, todos con tests colocados. Se conservaron
  `roundPct1`/`clampPage` del plan anterior.
- **Servicio tipado** `services/bi/salesAnalyticsService.ts`: contrato real
  de 15 endpoints (`performance`, `dashboard`, `trends`, `by-category`,
  `by-product`, `top-bottom-products`, `by-customer`, `by-seller`, `by-hour`,
  `by-day-of-week`, `heatmap`, `velocity`, `compare`, `discounts`,
  `discounts/summary`), limpieza de params y telemetría; sin fallback demo.
- **Nav**: `Analítica de Ventas` pasa a 8 hojas (6 de F4 + 2 drill-downs de
  F3). El padre usa `permissions` anyOf (`analytics:read` / `reports:read`) y
  cada hoja declara su permiso; `filterNavigationItems` ahora descarta también
  padres con gate anyOf sin hojas visibles (antes quedaba un grupo vacío).
- **i18n**: namespace `salesAnalytics` en `locales/{es,en}` (mismas claves) +
  `nav.sales*` en ambos shells + gate que escanea las claves estáticas usadas
  en el código de F4 y verifica que existan en es/en.
- **Compartido**: `SectionCard` (reemplaza al `DashboardSection` de F2),
  `CardGridSkeleton`/`PanelSkeleton`/`TableSkeleton` (`DataSkeletons`) y
  `BiPeriodSelector` se promovieron a `components/ui`/`components/bi`; F2
  re-exporta sus wrappers con los `data-testid` intactos.
- **Período del grupo**: vive en `?period=` (deep-link y navegación entre las
  4 pantallas que lo usan), no en un store global. `week` se rotula
  **“Últimos 7 días”** porque `/sales-analytics/*` usa `NewPeriodRolling`
  (a diferencia del week calendario de F2).

### 12.2 Bug del backend encontrado en el smoke (desviación documentada)

El plan asumía BE congelado. El smoke en vivo descubrió una **duplicación de
totales por join a detalles** en 4 queries de `internal/platform/postgres/
analytics_sales_repo.go`: sumaban `sales_orders.total_amount` en la misma
query que joinea `sales_order_details`, así que una orden multi-línea contaba
su total una vez por línea.

- Evidencia (octubre 2026): canónico `SUM(total_amount)` = **Gs. 1.475.500**
  con 6 órdenes; las queries afectadas devolvían **Gs. 3.983.700** (8 filas
  por join). `/sales-analytics/compare` y `/dashboard/summary` ya daban el
  valor correcto, por eso el KPI y el mix de pagos no cuadraban entre sí.
- Endpoints afectados: `performance`, `trends`, `velocity.overall` y
  `dashboard.trends`. Se corrigieron separando el dinero a nivel de orden
  (CTE sin join a detalles) de las unidades a nivel de línea (CTE con join) y
  uniéndolos 1:1.
- Test de regresión con BD real:
  `internal/platform/postgres/analytics_sales_totals_test.go`
  (`TestSalesAnalytics_AggregatesDoNotDuplicateMultiLineOrders`) exige que la
  suma de la serie, el KPI, la velocidad y el dashboard igualen
  `SUM(total_amount)` del período; skippea si la ventana no tiene órdenes
  multi-línea.
- **No cambia el contrato** (mismos campos/JSON, valores correctos). Sin este
  fix, F4 mostraba ventas 2,7× y era imposible cumplir la regla §5.1.
- Backend reiniciado en `:5050` con `CORS_ALLOWED_ORIGINS=http://localhost:5173,
  http://localhost:3000` (el reinicio sin esa variable rompía el preflight).

### 12.3 Decisiones de borde (documentadas)

- **Crecimiento de KPIs**: se usa `performance?compare=true` (variación real
  contra la ventana previa). Los `*_growth_pct` del dashboard consolidado no
  se muestran: el repositorio no los calcula (viajaban en 0, el “+0%” que
  marcó la auditoría). Si la ventana previa no tuvo base (`pct=0` con cambio
  distinto de 0) no se muestra chip.
- **Alertas del dashboard**: `/sales-analytics/dashboard.alerts` lo devuelve
  siempre vacío (no se calcula); no se renderiza el panel.
- **Serie de ventas**: sale de `/sales-analytics/trends` con granularidad
  derivada del período (`today`→hourly, `year`→monthly, resto daily), no del
  `trends` embebido en `/dashboard`, que corta a 30 días y sería engañoso en
  “Este año”. El crecimiento del resumen se rotula “primera vs última fecha”
  (es lo que calcula el BE, no la ventana previa).
- **Sin heatmap en F4**: la landing de F2 ya tiene `/dashboard/sales-heatmap`;
  acá se usan `/by-hour` y `/by-day-of-week`, que sí traen `peak_hour`/
  `best_day` reales. Se eliminó la “hora pico 14:00” hardcodeada de la
  pantalla vieja.
- **Comparativa**: solo variaciones relativas (`change_pct`), nunca “pp”; el
  `end_date` del payload es exclusivo, así que se muestra con el día inclusive
  (`previousCalendarDay`). En modo período se avisa que la ventana actual
  puede estar en curso (el BE compara contra una ventana previa de igual
  duración, no contra el mes calendario anterior exacto). El modo custom usa
  4 fechas con draft + “Comparar” y bloquea requests con rangos inválidos.
- **Descuentos**: precios **unitarios** y descuento de **línea** se muestran
  por separado; nunca se multiplica para reconstruir totales (origen de la
  fila 100.000→105.690 de la auditoría). El contrato no trae `product_name`
  (la vista solo guarda `product_id`): el id va como sublínea de la venta, sin
  llamadas extra al catálogo. `data: null` de Go (slice nil) se trata como
  lista vacía, no como envelope roto; solo `data` ausente es error. El
  `metadata.end_date` del BE es el límite exclusivo: la UI muestra el rango
  aplicado. Participación por grupo = total del grupo / total descontado.
- **Productos**: sin columna SKU (el BE devuelve el id como `sku`), sin rank
  (es rank por ventas aunque se ordene por margen) y sin crecimiento (`growth_pct`
  no lo calcula el repo). El sort usa la whitelist real (`sales`, `units`,
  `margin`, `name`, `last_sale`), server-side, con `aria-sort` y vuelta a
  página 1 al cambiar de orden.
- **Vendedores**: `rankings.by_*` del payload son copias de la página, no
  rankings independientes; no se muestran. `target_progress`/`conversion_rate`
  no vienen.
- **Top categorías del dashboard**: el payload anidado no trae `percentage`;
  se muestran ventas y transacciones (como sublínea), sin inventar share.
- **Unidades**: `0` del BE (base qty no normalizada) se muestra `—`, no
  “0 uds.” junto a un importe real. Aplica a series, categorías, productos y
  rankings.
- **Medios de pago**: `unknown` se rotula “Sin método registrado” y explica
  que son ventas sin método asociado; nunca el código crudo.
- **Paginación**: 10 filas por página (regla del proyecto) para productos,
  clientes, vendedores y descuentos; totales y páginas salen del BE. El empty
  state de tabla se renderiza fuera del `<table>` cuando no hay filas
  (con 8-10 columnas el thead fijaba un min-width y dejaba el empty fuera del
  viewport en mobile). Tablas anchas con hint “Deslizá la tabla…” en mobile.

### 12.4 Tests

- Dominio: `format`, `periods`, `kpis`, `trends`, `products`, `customers`,
  `velocity`, `comparison`, `discounts` — 70+ casos (redondeo, rangos
  inclusivos/exclusivos, slices nil, whitelist de sort, shares, sellout).
- Servicio: contrato de rutas/params de los 15 métodos, limpieza de params y
  error telemetrizado.
- Hooks: params por endpoint (compare, granularidad, paginación, sort),
  normalización de `null` de Go, `data:null` de descuentos como lista vacía,
  comparación deshabilitada con rango inválido, período en URL.
- Páginas: 6 tests (30 casos) con datos reales del contrato, estados, sort,
  paginación, empty honesto y ausencia de claims fabricados (`$0`, “Live”,
  “en tiempo real”, churn/meta, “14:00 - 15:00”, floats crudos, “pp”).
- i18n: paridad es/en, sin strings vacíos, claves nav y **todas** las claves
  estáticas usadas en el código de F4.
- Nav: 8 hojas, anyOf del padre, hoja de descuentos solo con `reports:read`,
  sin grupo vacío con permisos BI sin pantalla.

### 12.5 Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: **235 archivos / 1692 tests OK**.
- `pnpm build`: OK; chunks lazy por página (`SalesDashboardPage`,
  `ProductsCategoriesPage`, `CustomerSellerInsightsPage`,
  `TrendsVelocityPage`, `PeriodComparisonPage`, `DiscountsPage`).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; 1108 legacy).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: sin `mock`/`Math.random`/`sample`/`dummy` en
  producción de F4 (solo el comentario “Sin fallback demo/mock” del servicio).
- Gate TS: archivos nuevos de la fase solo `.ts`/`.tsx`.
- Backend: `gofmt` limpio, `make build` OK,
  `go test ./internal/platform/postgres ./internal/analytics/...` OK (incluye
  el nuevo invariante). `go test ./...` sigue fallando en
  `tests/integration` por el clúster efímero sin schema
  (`relation "public.branches" does not exist`), condición preexistente
  ajena a este cambio.
- **Smoke vivo** (`:5050` + Vite `:5173` `--mode api`, JWT de dev admin
  `jJkV4F6HR`, rol `F2VLso`, sesión 1379, entitlements core+bi):
  **47/47 checks OK**, 0 errores de consola y 0 respuestas HTTP ≥400.
  - Consistencia KPI = suma de la serie = mix de pagos = **Gs. 1.475.500**
    (antes del fix: KPI/serie 3.983.700 vs mix 1.475.500).
  - Las 6 pantallas renderizan con datos reales; sort asc/desc, paginación,
    comparativa custom y rango inválido verificados.
  - Descuentos con datos (01–14 sept 2026): línea `SALE-1789393146-771`,
    Gs. 70.000 → 66.780, descuento de línea Gs. 3.220; empty honesto con el
    rango default sin datos.
  - Sidebar con las 8 hojas; 1440 y 390 px sin overflow del body.

### 12.6 Pendiente / deuda declarada

- `searchableRoutes` de las rutas BI sigue vacío hasta F7/F8/F9 (con
  `requiredModule: 'bi'`).
- El contrato de descuentos no trae nombre de producto ni de sucursal (solo
  ids); se muestran como ids/sublíneas hasta que el BE los agregue.
- El fix de agregados del BE es un commit separado en `dev`
  (`business_management`), sin push.
- Sin push: F1+F2+F3+F4 quedan locales en la rama FE.


---

## 13. Estado de ejecución — F5 Analítica de Inventario (2026-10-20)

**Rama FE:** `feature/bi-ui-rebuild` (F1+F2+F3+F4 sobre `dev` = `82710c7`).
**Backend:** fix de sort en `dev` (ver §13.2), sin cambio de contrato.

### 13.1 Ejecutado

- **Rutas (4)** en `src/App.tsx`, lazy y con `AnalyticsRoute` =
  `BiModuleRoute` (pack) → `PermissionGuard(analytics:read)`, el mismo par que
  `biChain("analytics:read", "inventory-analytics")` del BE:
  `/inventory-analytics/dashboard`, `/inventory-analytics/turnover-abc`,
  `/inventory-analytics/stock-levels`, `/inventory-analytics/risk`.
- **Feature `src/features/inventory-analytics/`** con la plantilla FSD:
  `components/` (UI pura), `hooks/` (react-query + período en URL), `types/` y
  barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/inventory-analytics/`:
  `InventoryDashboardPage`, `TurnoverAbcPage`, `StockLevelsPage`,
  `InventoryRiskPage`.
- **Dominio puro** en `src/domain/inventory-analytics/`: `format`, `stock`,
  `kpis`, `turnover`, `abc` (re-escrito), `reorder`, `deadStock`, `alerts`,
  `aging`, `periods` y `constants`, todos con tests colocados.
- **Servicio tipado** `services/bi/inventoryAnalyticsService.ts`: contrato real
  de 8 endpoints (`overview`, `dashboard`, `stock-levels`, `turnover`, `abc`,
  `dead-stock`, `reorder`, `aging`), limpieza de params y telemetría; sin
  fallback demo. Se eliminaron `getForecast`/`getMovements` (F11 usa
  `/forecast/*`; movimientos no está en el plan) y los tipos legacy
  `StockLevelItem`/`InventoryTurnover` de `types/bi.ts` (sin consumidores).
- **Nav**: subgrupo `Analítica de Inventario` con 4 hojas, permiso
  `analytics:read` en todas (el padre BI ya usa anyOf). La marca del sidebar,
  HomeRedirect y guards se mantienen en `/dashboard` (F2).
- **i18n**: namespace `inventoryAnalytics` en `locales/{es,en}` (mismas claves,
  verificadas por test) + `nav.inventory*` en ambos shells.
- **Compartido**: `TableCard` se promovió de `features/sales-analytics` a
  `components/ui/TableCard` (F4 re-exporta desde la ruta compartida); el
  feature de inventario no importa componentes de Ventas.
- **Alertas F2**: se re-activó "Gestionar" para
  `/inventory-analytics/stock-levels` en `AlertCard` (destino ya existente).
  `/profitability/*` (F6), `/receivables/overdue` (F7) y
  `/comercial/presupuestos` siguen sin link; el page test de Alertas se ajustó.

### 13.2 Bug del backend encontrado en el smoke (desviación documentada)

`GET /inventory-analytics/stock-levels?sort_by=value` y `?sort_by=days`
respondían **500** (`pq: column "stock_value"/"days_of_stock" does not exist`)
en cualquier página/estado. El `validSortFields` del repo ofrecía
`value → stock_value` y `days → days_of_stock`, pero el SELECT calculaba ambas
expresiones **sin alias**. Se agregaron los alias (sin cambio de contrato JSON)
y un test de regresión con BD real:
`internal/platform/postgres/analytics_inventory_sort_test.go`
(`TestInventoryAnalytics_StockLevelsSortFields`: recorre la whitelist completa
y verifica orden DESC/ASC de `value` y `days`).
El backend se reconstruyó y reinició en `:5050` con
`CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000` (el
reinicio sin esa variable rompía el preflight; misma nota que F4).

### 13.3 Decisiones de borde (documentadas)

- **Dashboard sin selector de período**: `/inventory-analytics/dashboard` y
  `/overview` usan una ventana fija de 30 días (no aceptan `period`). Los
  labels dicen "30 días"; no se ofrece un selector que el BE ignoraría.
- **Estado del stock**: los cuatro umbrales del SQL se superponen
  (`in_stock` > 5 incluye `overstock` > 15). No se dibuja una torta; se listan
  conteos/porcentajes con la nota de superposición.
- **Niveles de stock**: `summary.total_units/total_value` suman solo la página
  (no el filtro completo): se rotulan "en esta página". `min_stock/max_stock/
  reorder_point` son constantes 5/15/5 del SQL, no configuración del producto:
  no se muestran por fila; los umbrales van en la descripción. No hay buscador
  de texto porque el endpoint no lo acepta (filtrar solo la página sería una
  mentira).
- **Fechas con fallback**: el BE usa `created_at` si el producto nunca se
  vendió/movió; la tabla de niveles lo aclara en la descripción y la de stock
  muerto rotula "Última venta / alta" y "Último mov. / alta".
- **Días 0 vs 999**: en niveles de stock/reposición `0` es real (quiebre
  inmediato con stock 0 y demanda) y solo `999` es "sin ventas en 30 días". En
  rotación `days_of_inventory <= 0` significa "sin costo de ventas en el
  período" y se muestra `—` (no "0 días").
- **Rotación**: `average_inventory` del contrato es el **valor actual del
  stock a costo**, no un promedio del período: se rotula así. La nota explica
  que los días se calculan con las ventas del período (los 2.839/3.822 días del
  dev son reales, no un error de UI). `current_stock` es real; no se muestra
  `average_stock` (el SQL escanea el stock actual, no un promedio).
- **ABC**: se calcula sobre **ventas**, no sobre valor de inventario; montos
  del `summary` sin re-derivar. `sku` es el id del producto y `turnover_rate`
  viaja en 0 (el SELECT no lo calcula): no se muestran. El dashboard (30 días)
  y la pantalla de rotación (período) pueden dar clases distintas porque usan
  ventanas distintas; cada uno lo dice. El explorador abre la primera clase con
  productos (en `week` puede haber solo clase C).
- **Stock muerto**: no se muestra `potential_loss` (es `total_value * 0.3`
  hardcodeado, no una pérdida medida) ni las recomendaciones en español del
  BE; la recomendación por fila se deriva de los días reales con claves i18n
  (mismos umbrales 120/180 del BE). Se sumó la antigüedad del stock
  (`/aging`, no estaba en la pantalla vieja) con labels por `min_days/
  max_days`, no por el texto español del servidor.
- **Reposición**: `estimated_cost = 0` con pendientes se muestra `—` + hint
  (costo unitario ausente), nunca "Gs. 0". La cantidad sugerida repone hasta
  10 unidades (regla del reporte, explicitada). No se muestran
  `average_lead_time_days` (viaja 0) ni `by_supplier` (no se completa).
  `last_order_date` cero no se renderiza.
- **Períodos**: `week` es rolling (últimos 7 días) en inventario
  (`NewPeriodRolling`), `month`/`year` calendario y `today` el día calendario.
  El valor vive en `?period=`.
- **Scroll de tablas**: el hint "Deslizá la tabla…" aparece solo cuando la
  tabla desborda su contenedor (ResizeObserver), no por breakpoint: a 1280 px
  una tabla de 9-10 columnas scrollea aunque no sea mobile.

### 13.4 Tests

- Dominio: `format` (tasas < 0,01 con 4 decimales, días, fechas cero,
  paginación), `stock` (estados, whitelist de sort, centinela 999 vs 0),
  `kpis` (dashboard/turnover, days sin COGS), `turnover` (performance),
  `abc` (summary/classes), `reorder` (prioridad, costo faltante, centinela),
  `deadStock` (umbrales/recomendación, sin potential_loss), `aging` (tramos por
  min/max), `alerts` (tipos/rutas existentes), `periods` — 43 casos.
- Servicio: rutas/params de los 8 métodos, limpieza de params y error
  telemetrizado — 7 tests.
- Hooks: params por endpoint (página/estado/sort, período, días), normalización
  de slices nil, error; período en URL — 14 tests.
- Páginas: `InventoryDashboard` (KPIs/costos, estado, alertas + links, ABC,
  movers, reposición, empty, error), `TurnoverAbc` (KPIs, nota de días,
  performance, ABC tabs, clase por defecto no vacía, error de ABC sin tumbar
  rotación), `StockLevels` (resumen page-scope, filtro/orden/paginación
  server-side, costo faltante, centinela, empty, error), `InventoryRisk`
  (umbrales, recomendaciones i18n, antigüedad, empty, error) — 18 tests.
- i18n: paridad es/en, sin vacíos, claves nav y todas las claves estáticas de
  F5 — 4 tests.
- Nav: 4 hojas de inventario con `analytics:read`, grupo presente/ausente
  según pack y permisos — test de F2-F4 actualizado.
- Alertas: "Gestionar" solo con destino existente — page test F2 actualizado.

### 13.5 Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: **252 archivos / 1775 tests OK**.
- `pnpm build`: OK; chunks lazy `InventoryDashboardPage`, `TurnoverAbcPage`,
  `StockLevelsPage`, `InventoryRiskPage` (+ `InventoryKpiLedger`,
  `InventoryRefreshButton` compartidos).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; 1108 legacy).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: sin `mock`/`Math.random`/`sample`/`dummy` en
  producción de F5 (solo el comentario "Sin fallback demo/mock" del servicio).
- Gate TS: archivos nuevos de la fase solo `.ts`/`.tsx` (0 `.js`/`.jsx`).
- Backend: `gofmt` limpio, `make build` OK,
  `go test ./internal/platform/postgres ./internal/analytics/...` OK
  (incluye el invariante de sort).
- Auditoría `vercel-react-best-practices` aplicada con criterio: páginas lazy,
  queries en paralelo/deduplicadas por react-query, `AbcExplorer` deriva la
  clase activa sin `useEffect`, `InventoryTable` mide el overflow con
  `ResizeObserver` (deps primitivas) y no hay componentes definidos dentro de
  componentes. Excepción consciente: el barrel público del feature (plantilla
  FSD del plan) en lugar de imports profundos.
- **Smoke vivo** (`:5050` + Vite `:5173` `--mode api`, JWT de dev admin
  `jJkV4F6HR`, rol `F2VLso`, entitlements core+bi): 4 pantallas con datos
  reales, 0 errores de consola y 0 respuestas HTTP ≥400.
  - Dashboard: valor Gs. 18.559.280 (costo Gs. 13.377.100), ganancia potencial
    Gs. 5.182.180, rotación 0,11x, 277 días, quiebre 5,6 %, stock muerto
    30,4 %; ABC 30 días A 3/Gs. 1.550.000/78,6 %, B 2/313.000/15,9 %,
    C 13/107.965/5,5 %; 3 alertas con links a stock/riesgos; reposición 5 filas;
    "Menor movimiento" vacío (el BE devuelve `[]`: empty honesto).
  - Rotación/ABC (mes): 0,07x, 439 días, inventario a costo Gs. 13.377.100,
    COGS Gs. 945.000; 3 categorías, 17 productos; ABC A 1/595.000/47,1 %,
    B 1/455.000/36 %, C 16/214.500/17 %.
  - `?period=week` (rolling): 0,0021x, 3.822 días, COGS Gs. 28.000; ABC clase C
    18 productos (el explorador abre C, no la A vacía).
  - Niveles: 18 productos, 10 filas server-side, 571 unidades y
    Gs. 11.427.700 en la página; filtro Sin stock → 1 fila (0 días real);
    sort por valor y días DESC/ASC verificado; reposición 6 (5 urgentes, 1 próximo),
    Gs. 8.868.600, y una fila sin costo en `—`.
  - Riesgos: 6 productos, 87 unidades, Gs. 4.062.700 (30,4 %), 282 días
    promedio; umbral 120 recarga; antigüedad 5 tramos (promedio 140 días,
    40,4 % > 90 d).
  - Responsive 1440/1280/1024/390: `bodyOverflow=false`, tablas con scroll
    interno y hint solo cuando desbordan; ABC como ledger en mobile.
- Sin push: F1-F5 quedan locales en la rama FE; el fix BE queda local en
  `dev` (mismo criterio que F4).

### 13.6 Pendiente / deuda declarada

- `searchableRoutes` de las rutas BI sigue vacío hasta F7/F8/F9 (con
  `requiredModule: 'bi'`).
- `AlertCard` solo linkea stock-levels; faltan F6/F7 y decidir
  `/comercial/presupuestos` (Core, fuera del checklist del plan).
- Los conteos de estado de stock se superponen por diseño del BE; si se quiere
  un donut mutuamente excluyente hay que cambiar el contrato.
- ABC clase C incluye productos sin ventas (stock > 0) con 0 %; es el SQL del
  BE, no se filtra en el cliente.
- `InventoryAnalyticsDashboard.trends`, `slow_movers.turnover_rate/
  days_of_inventory` y `value_change_pct/turnover_change_pct` siguen sin
  usarse: son relleno del payload, no métricas calculadas.
- Sin pantalla de movimientos de stock ni pronóstico de inventario: fuera del
  alcance de F5 (F11 cubre `/forecast/*`).

---

## 14. Estado de ejecución — F6 Rentabilidad (2026-10-20)

**Rama FE:** `feature/bi-ui-rebuild` (F1-F5 sobre `dev` = `82710c7`).
**Backend:** fixes de agregados/sort/KPI en `dev` (ver §14.2), sin cambio de
contrato JSON.

### 14.1 Ejecutado

- **Rutas (6)** en `src/App.tsx`, lazy y con `AnalyticsRoute` =
  `BiModuleRoute` (pack) → `PermissionGuard(analytics:read)`, el mismo par que
  `biChain("analytics:read", "profitability")` del BE:
  `/profitability/{dashboard,products,customers,categories,trends,sellers}`.
- **Feature `src/features/profitability/`** con la plantilla FSD:
  `components/` (UI pura), `hooks/` (react-query + período/granularidad en URL),
  `types/` y barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/profitability/`:
  `ProfitabilityDashboardPage`, `ProductProfitabilityPage`,
  `CustomerProfitabilityPage`, `CategoryProfitabilityPage`,
  `ProfitabilityTrendsPage`, `SellerProfitabilityPage`.
- **Dominio puro** en `src/domain/profitability/`: `format`, `periods`,
  `constants`, `kpis`, `performance`, `products`, `customers`, `categories`,
  `trends`, `sellers`, `alerts`, todos con tests colocados. Se conservó
  `margins.ts` del plan anterior (tests incluidos), según §2.3.
- **Servicio tipado** `services/bi/profitabilityService.ts`: contrato real de
  los 6 endpoints consumidos (`dashboard`, `products`, `customers`,
  `categories`, `trends`, `sellers`), limpieza de params y telemetría; sin
  fallback demo. `/profitability/overview` no se consume (el dashboard
  consolidado ya trae KPIs + crecimiento en una sola llamada).
- **Tipos** en `types/bi.ts`: `ProfitabilityOverview`, `ProfitabilityDashboard`,
  `ProductProfitabilityReport`, `CustomerProfitabilityReport`,
  `CategoryProfitabilityReport`, `ProfitabilityTrendsReport`,
  `SellerProfitabilityReport`, KPIs/alertas y paginación; los campos que el BE
  nunca calcula quedan comentados en el contrato (`sku`, `low_profitable`,
  `at_risk_customers`, `top_customers_pct`, `break_even_status`,
  `operating_*`, `net_*`).
- **Nav**: subgrupo `Rentabilidad` con 6 hojas y permiso `analytics:read` en el
  padre. La marca del sidebar, HomeRedirect y guards se mantienen en
  `/dashboard` (F2).
- **i18n**: namespace `profitability` en `locales/{es,en}` (mismas claves,
  verificadas por test) + `nav.profitability*` en ambos shells; fallbacks en
  español para las etiquetas dinámicas (performance, segmento, granularidad,
  dirección y alertas).
- **Compartido**: se reusan `SectionCard`, `TableCard`, `QueryBoundary`,
  `TableEmptyState`, `DataSkeletons`, `BiPeriodSelector`, `SegmentedControl` y
  `TablePagination`. La tabla y el ledger KPI son locales del feature (mismo
  criterio de F4/F5: un feature no importa componentes de otro).
- **Alerta F2 re-activada**: `AlertCard` ahora enlaza "Gestionar" de margen
  negativo a `/profitability/products` (el destino ya existe); el page test de
  Alertas de F2 se amplió con ese caso. `/receivables/overdue` (F7) sigue
  fuera de `ACTIONABLE_ALERT_ROUTES`.

### 14.2 Bugs del backend encontrados en el smoke (desviación documentada)

El plan asumía BE congelado. El smoke en vivo (y la lectura del SQL) descubrió
cinco defectos en `analytics_profitability_repo.go`, todos con test de
regresión contra BD real en `internal/platform/postgres/
analytics_profitability_test.go`:

1. **`sort_by=name` respondía 500**: el whitelist mapeaba a `p.name`, alias que
   no existe en el SELECT externo (`ranked_products`). Se mapeó a
   `product_name`. Test: `TestProfitability_ProductSortWhitelist` (recorre el
   whitelist completo y verifica el orden ASC por nombre).
2. **Resumen de productos/clientes subestimado**: el costo se sumaba sin
   `COALESCE`; una línea sin costo registrado producía `gross_profit NULL` y
   desaparecía del `SUM`, mientras la página la mostraba con costo 0. En dev,
   `summary.total_profit` era **410.500** contra **530.500** del overview, y la
   suma de contribuciones por fila daba **129 %**. Se aplicó el mismo
   `COALESCE(...,0)` que usa el detalle. Tests:
   `TestProfitability_ProductSummaryMatchesOverview` y
   `TestProfitability_CustomerSummaryMatchesRows` (además exige contribución
   total ≈ 100 % cuando todas las filas entran en una página).
3. **Tendencias colapsaba el beneficio a 0**: `COALESCE(SUM(rev) - SUM(cost),0)`
   anulaba el profit entero de un bucket con costo NULL (20 oct: ingresos
   120.000 → beneficio 0, growth -100 %). Se separó en
   `COALESCE(SUM(rev),0) - COALESCE(SUM(cost),0)`. Test:
   `TestProfitability_TrendsSumMatchesOverview` (cada punto cumple
   `gross = revenue - cost` y la serie suma el overview).
4. **`profit_per_transaction` llevaba `profit_per_unit`** (132.625 en vez de
   88.417). El dashboard ahora calcula `gross_profit / total_transactions`. Test:
   `TestProfitability_DashboardProfitPerTransaction`.
5. **`days_since_last_purchase` usaba `EXTRACT(DAY FROM NOW()-last_purchase)`**
   (componente día del intervalo, no días totales). Se cambió a
   `CURRENT_DATE - last_purchase::date`. Test:
   `TestProfitability_CustomerDaysSinceLastPurchase`. La UI igualmente deriva
   la antigüedad de `last_purchase` para no depender del reloj del servidor.

Evidencia del smoke (dev, octubre 2026, sucursal 1): overview
`revenue 1.475.500 / cost 945.000 / gross 530.500`; productos
`total_profit 530.500` y contribuciones que suman 100 %; tendencia 20 oct con
`gross_profit 120.000`; dashboard `profit_per_transaction 88.416,67`.

El backend se reconstruyó y reinició en `:5050` con
`CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000` (misma nota
operativa que F4/F5).

### 14.3 Decisiones de borde (documentadas)

- **Períodos**: solo `today|week|month|year` (`quarter` da 400 en el BE). Todos
  los endpoints usan `NewPeriodRolling`: `week` son los últimos 7 días
  (label "Últimos 7 días"), `month`/`year` calendario y `today` el día. El
  estado vive en `?period=` con default `month`.
- **Dashboard**: se consume solo `/profitability/dashboard`; no se muestra
  `break_even_status` (struct zero), ni "margen operativo/neto" (espejan el
  bruto porque el BE no modela gastos operativos), ni `contribution_margin`
  (es un monto, no un margen). `ROI` se rotula con su fórmula real
  (beneficio bruto / costo), que es la misma del markup. `profit_per_transaction`
  usa el valor corregido. Los KPIs de crecimiento son relativos contra la
  ventana previa de igual duración; `margin_change` se muestra como porcentaje
  con hint "puntos porcentuales".
- **Alertas**: se descarta el `message` en español del servidor y se traduce
  el `type` real (`LOW_MARGIN`, `DECLINING_PROFIT`, `UNPROFITABLE_PRODUCTS`,
  `PROFIT_GROWTH`) mostrando `value` y `threshold` de la regla. Un tipo
  desconocido no se renderiza.
- **Productos**: sin columna SKU (el SQL devuelve `''`) y sin buscador (el
  endpoint no lo acepta). Sort server-side con whitelist
  `profit|margin|revenue|units|name` y `aria-sort`; `rank` no se muestra
  porque es global por beneficio, no la posición de la página. `units_sold = 0`
  con importes reales se muestra `—` (normalización de unidades). La
  contribución se oculta si el beneficio total no es positivo. El margen global
  del resumen se deriva ponderado (`profit/revenue`); `average_margin` del BE es
  promedio simple y se rotula así. Top 5 / losers usan SELECTs propios con
  `gross_margin_pct` en 0: el margen del panel se deriva de
  `gross_profit/revenue`.
- **Clientes**: orden fijo por beneficio, sin búsqueda ni sort (el endpoint no
  los acepta). `customer_type` ("REGULAR" hardcodeado) no se muestra;
  `top_customers` es page-scoped y `at_risk_customers`/`top_customers_pct`
  nunca se calculan: no se renderizan. `average_customer_value` es **beneficio
  promedio por cliente** (no ticket) y se rotula así. "Clientes sin beneficio"
  se deriva de `total - rentables` (conteos reales). La antigüedad de la última
  compra se deriva de `last_purchase`, no del campo del BE. El segmento
  (PLATINUM ≥10 %, GOLD ≥5 %, SILVER ≥2 %, resto BRONZE) se documenta en la
  descripción de la tabla.
- **Categorías**: sin paginación ni sort; solo entran categorías con ventas
  (INNER JOIN: los productos sin categoría quedan fuera). `contribution_pct` es
  una copia de `profit_share`: se muestra una sola vez. El monto del "líder" no
  está en el summary: los extremos se derivan de la primera/última fila real.
  El margen promedio es simple (no ponderado) y se rotula.
- **Tendencias**: granularidad diaria/semanal/mensual en `?granularity=`;
  default por período (año → mensual, resto → diario), el mismo criterio del
  dashboard. Semanal es la semana calendario de Postgres (lunes) y se rotula
  "Semana del {fecha}". No se rellenan huecos: solo buckets con ventas. El BE
  emite `label` en inglés (`to_char`) y no valida una granularidad inválida
  (la ecoa): la UI valida y re-deriva las etiquetas de `date` en el locale de
  la UI, en UTC porque son fechas date-only. Dirección (umbral ±5 %) y
  crecimiento primera→última se re-derivan con las mismas reglas del BE para
  localizar las fechas de los extremos; sin base positiva el crecimiento es
  `—`, no 0 %.
- **Vendedores**: sin paginación; `total_sales` es COUNT(DISTINCT orden) y los
  montos se suman por línea: el fan-out T15 de la auditoría **no está presente**
  (verificado: revenue de sellers = revenue del overview). La contribución se
  oculta si el beneficio total no es positivo.
- **Sesgos de costo/unidades del contrato** (se muestran con `—` cuando
  corresponde, no se corrigen en FE): una línea sin costo registrado suma su
  revenue completo al beneficio (costo 0 implícito), y las líneas cuya unidad
  no convierte a la base quedan fuera de las unidades (`units_sold` 0 con
  importe real). Las descripciones de cada pantalla lo explican.
- **Errores silenciados del dashboard**: el BE hace `if err == nil` por
  subconsulta y no expone `metadata.partial`; un fallo parcial se vería como
  ceros. No es detectable desde el FE: deuda declarada.

### 14.4 Tests

- Dominio: `format`, `periods`, `kpis`, `performance`, `products`, `customers`,
  `categories`, `trends`, `sellers`, `alerts` — 97 casos (incluye los 15 de
  `margins.ts` conservado): redondeo, fechas date-only en UTC, fin exclusivo,
  antigüedad derivada, disponibilidad de contribución, extremos, dirección,
  umbrales y alertas desconocidas.
- Servicio: rutas/params de los 6 métodos, defaults, limpieza de params y
  error telemetrizado — 10 tests.
- Hooks: params por endpoint (página/orden/granularidad), normalización de
  slices nil, re-derivación del insight y granularidad pedida — 7 tests; URL
  de período/granularidad (validación, defaults, escritura y limpieza) — 9
  tests.
- Páginas: Dashboard (KPIs, alertas traducidas, topes, serie, ausencia de
  break-even/claims, empty, error), Productos (resumen, sort/paginación
  server-side, contribución, unidades `—`, paneles, empty), Clientes
  (resumen, segmento, antigüedad derivada, sin REGULAR/Pareto, paginación,
  empty), Categorías (extremos y montos, participaciones, sin NaN, una sola
  categoría, empty), Tendencias (default diario/mensual, labels derivados,
  cambio a semanal, granularidad inválida, empty), Vendedores (resumen,
  ranking, top, empty) — 30 tests.
- i18n: paridad es/en, sin vacíos, claves nav y todas las claves estáticas de
  F6 — 4 tests. Nav: 6 hojas de Rentabilidad con `analytics:read`, grupo
  presente/ausente según pack y permisos — test de F2-F5 actualizado. Alertas:
  "Gestionar" de margen negativo hacia `/profitability/products` — page test
  de F2 actualizado.

### 14.5 Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: **268 archivos / 1916 tests OK** (un timeout flaky
  preexistente de `CounterOrdersPage` bajo carga paralela pasó en aislamiento
  y en la corrida limpia posterior).
- `pnpm build`: OK; chunks lazy `ProfitabilityDashboardPage`,
  `ProductProfitabilityPage`, `CustomerProfitabilityPage`,
  `CategoryProfitabilityPage`, `ProfitabilityTrendsPage`,
  `SellerProfitabilityPage` (+ `ProfitabilityBadge`, `TrendsTable`
  compartidos).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; 1108 legacy).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: sin `mock`/`Math.random`/`sample`/`dummy` en
  producción de F6 (solo el comentario "Sin fallback demo/mock" del servicio).
- Gate TS: archivos nuevos de la fase solo `.ts`/`.tsx` (0 `.js`/`.jsx`).
- Backend: `gofmt` limpio, `make build` OK,
  `go test ./internal/analytics/... ./internal/platform/postgres` OK (incluye
  los 6 invariantes nuevos).
- Auditoría `vercel-react-best-practices` aplicada con criterio: páginas
  lazy, queries paralelas/deduplicadas por react-query, sin `useEffect` para
  estado derivado (el insight se deriva en el hook/render), `ResizeObserver`
  con deps primitivas en la tabla y sin componentes definidos dentro de
  componentes. Excepción consciente: el barrel público del feature (plantilla
  FSD del plan) en lugar de imports profundos.
- **Smoke vivo** (`:5050` + Vite `:5173` `--mode api`, JWT de dev admin
  `jJkV4F6HR`, rol `F2VLso`, sesión 1379, entitlements core+bi), 6 pantallas:
  - Dashboard: ingresos Gs. 1.475.500, beneficio Gs. 530.500, margen 36 %,
    ROI 56,1 %, beneficio/transacción Gs. 88.417, crecimiento +60,4 % /
    +51,1 %, cambio de margen -2,2 pp; alerta real de crecimiento +51,1 %;
    top productos/clientes/categorías y serie de 4 buckets.
  - Productos: 6 productos, beneficio Gs. 530.500, margen global 36 %,
    promedio simple 45,1 %, contribuciones 41,4 %/31,7 %/29,2 %/14,9 %/11,5 %/
    0,6 % (suma 100 %); sort por nombre verificado en vivo; unidades sin
    conversión en `—`.
  - Clientes: 2 clientes, beneficio Gs. 530.500, promedio Gs. 265.250,
    PLATINUM/GOLD por participación, antigüedad "Hoy"/"Hace 6 días" derivada.
  - Categorías: 4 categorías, Electrónicos Gs. 300.000 (56,6 % del beneficio),
    Alquiler Gs. 181.000 (34,1 %), Despensa Gs. 47.100 (8,9 %), Bebidas
    Gs. 2.400 (0,45 %); extremos con monto (sin NaN).
  - Tendencias: 4 buckets diarios (01/05/14/20 oct), ingresos Gs. 1.475.500,
    beneficio Gs. 530.500, -65,4 % primera vs última, dirección "En baja",
    margen promedio 63 %, margen más bajo 27,7 %; `?granularity=weekly` →
    "Semana del 28 sept", 05, 12 y 19 oct.
  - Vendedores: 1 vendedor, 6 órdenes, Gs. 1.475.500 de ingresos, Gs. 530.500
    de beneficio, 100 % de participación.
  - 0 errores de consola, 0 respuestas HTTP ≥400, `bodyOverflow=false` a
    1440/1280/1024/390 px; sin `$`, sin NaN, sin "en tiempo real", "Live",
    "objetivo", "Pareto" ni "punto de equilibrio"; sidebar con el grupo
    Rentabilidad y sus 6 hojas.
- Sin push: F1-F6 quedan locales en la rama FE; los fixes BE quedan locales en
  `dev` (mismo criterio que F4/F5).

### 14.6 Pendiente / deuda declarada

- `searchableRoutes` de las rutas BI sigue vacío hasta F7/F8/F9 (con
  `requiredModule: 'bi'`).
- El dashboard no puede distinguir un fallo parcial de una cifra real: el BE
  silencia los errores de sus subconsultas y no emite `metadata.partial`.
- La política de costo del BE excluye del costo las líneas sin costo registrado
  (su revenue sí suma), y las unidades sin conversión quedan fuera de
  `units_sold`: los importes de beneficio pueden estar sobreestimados y las
  unidades subestimadas. Se documenta en pantalla; corregirlo exige cambiar el
  contrato de costos/unidades.
- `/profitability/overview` y `/overview/date-range` no se consumen (el
  dashboard consolidado los reemplaza); `OverviewWithComparison` sigue sin
  handler.
- El resumen de productos/clientes ya es consistente con el overview, pero el
  dashboard sigue silenciando errores de subconsulta (ver arriba).
- Sin pantalla de comparación custom de períodos para rentabilidad: fuera del
  alcance de F6 (4 períodos estándar).

---

## 15. Estado de ejecución — F7 Cuentas por Cobrar (2026-10-20)

**Rama FE:** `feature/bi-ui-rebuild` (F1-F6 sobre `dev` = `82710c7`).
**Backend:** sin cambios (el contrato de `/receivables/*` alcanzó; no se encontró
defecto nuevo en el smoke).

### 15.1 Ejecutado

- **Rutas (6)** en `src/App.tsx`, lazy y con `ReceivablesRoute` =
  `BiModuleRoute` (pack) → `PermissionGuard(receivables:read)`, el mismo par que
  `biChain("receivables:read", "receivables")` del BE:
  `/receivables`, `/receivables/list`, `/receivables/detail/:id`,
  `/receivables/overdue`, `/receivables/client-profile/:clientId`,
  `/receivables/aging-report`.
- **Feature `src/features/receivables/`** con la plantilla FSD:
  `components/` (UI pura), `hooks/` (react-query + período en URL), `types/` y
  barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/receivables/`:
  `ReceivablesDashboardPage`, `ReceivablesListPage`, `ReceivableDetailPage`,
  `OverdueReceivablesPage`, `ClientCreditProfilePage`,
  `ReceivablesAgingReportPage`.
- **Dominio puro** en `src/domain/receivables/`: `format`, `status`, `aging`,
  `risk`, `collection`, `kpis`, `periods`, `constants` y `errors`, todos con
  tests colocados. `aging` y `risk` se re-escribieron contra el contrato real;
  `mappers.ts` y su test se eliminaron (ver §15.4).
- **Servicio tipado** `services/bi/receivablesService.ts`: contrato real de los
  9 endpoints consumidos (`overview`, listado, detalle, vencidas, ficha cliente,
  riesgo, reporte de antigüedad, top deudores y estadísticas del período),
  limpieza de params y telemetría; sin fallback demo. Tipos nuevos en
  `types/bi.ts` (`ReceivablesOverview`, `Receivable`, `ReceivablesList`,
  `ClientReceivables`, `ClientRisk`, `ReceivablesAgingReport`,
  `ReceivablesStatistics`, etc.).
- **Nav**: subgrupo `Cuentas por Cobrar` con 4 hojas (`/receivables`,
  `/receivables/list`, `/receivables/overdue`, `/receivables/aging-report`) y
  permiso `receivables:read`. Detalle y ficha de crédito no duplican entradas:
  se alcanzan desde tablas, modales y alertas.
- **i18n**: namespace `receivables` en `locales/{es,en}` (mismas claves,
  verificadas por test) + `nav.receivables*` en ambos shells.
- **Puntos de entrada §3.3 re-activados**:
  - #9 `ClientDetailsModal` → "Análisis de Riesgo" a la ficha de crédito, con
    `BiDrilldownButton` y permiso propio `receivables:read` (el componente ganó
    la prop opcional `permission`, default `analytics:read` para F3).
  - #12 `searchableRoutes`: `/receivables/list` vuelve con
    `requiredModule: 'bi'` y `requiredPermission: 'receivables:read'`. El
    buscador global (`search.ts`/`useGlobalSearch`/`Header`) ahora gatea ambos
    campos — sin pack o sin permiso la entrada no se ofrece.
  - F2: `AlertCard` re-activa "Gestionar" para `/receivables/overdue` (el
    `action_url` del catálogo `alert_routes.go`).
- **Compartido**: `SectionCard`, `TableCard`, `QueryBoundary`,
  `TableEmptyState`, `DataSkeletons`, `BiPeriodSelector`, `SegmentedControl` y
  `TablePagination` se reusan. La tabla, el ledger KPI y los badges son locales
  del feature (un feature no importa componentes de otro).

### 15.2 Decisiones de borde (documentadas)

- **Períodos**: `statistics` usa `NewPeriod` (variant A): `week` es la semana
  calendario que empieza el lunes, rotulada "Esta semana" (no rolling). Solo el
  dashboard usa período; overview, listados, vencidas y antigüedad son
  snapshots "a hoy" y el selector vive en la card de estadísticas, no en el
  header.
- **Aging desde la venta, no desde el vencimiento**: los 4 tramos del BE usan
  `NOW() - sale_date`. Todas las pantallas lo dicen; no se rotula "días
  vencidos" (eso es `days_overdue`, otro campo).
- **`due_date` no se muestra**: el listado/detalle lo sintetiza como
  `sale_date + 30 días`, mientras `days_overdue` usa el vencimiento real de la
  orden. Mostrarlo contradecía la cifra; la nota del detalle explica el plazo.
- **Cartera pendiente = summary del listado**, no `overview.total_pending`: el
  overview suma pendientes negativos de órdenes sobrepagadas (en dev difieren
  Gs. 0,50). El listado garantiza `total_amount > pagos` y coincide con las
  filas y con el aging.
- **`average_days_to_collect`** es el promedio de días desde la venta de las
  órdenes ya saldadas, no un plazo de cobro: se rotula "Antigüedad media
  (saldadas)".
- **`collection_rate` del overview** = cobrado / facturado sobre todas las
  ventas no canceladas: se rotula "Tasa de cobro histórica". La del período
  (`statistics`) es de flujos (cobrado del período / facturado del período), no
  de cohortes, y la card lo aclara.
- **`average_dso`** = días promedio desde la venta hasta el primer pago (sin
  pago cuenta hasta hoy): se rotula "Días hasta el primer pago", no "DSO".
- **Serie semanal**: el `WITH RECURSIVE` del BE emite un bucket posterior al
  fin del rango; el dominio lo descarta comparando con `statistics.period` (fin
  exclusivo). El `LIMIT 12` devuelve las primeras 12 semanas del rango, no las
  últimas: el subtítulo lo dice.
- **`top_debtors` de statistics no se usa**: el dashboard llama a
  `/receivables/top-debtors` (dato a hoy, independiente del período). El
  `payment_behavior` de esa lista lo deriva el BE de la proporción vencida,
  distinto del promedio de días de pago de la ficha; la card lo documenta.
- **Listado**: solo 3 estados filtrables (PENDING/PARTIAL/OVERDUE; `PAID` nunca
  aparece porque el WHERE exige saldo) y se superponen: la nota lo avisa. Sort
  server-side con la whitelist `date|amount|client|days_overdue` (dirección por
  defecto por columna) y 10 filas por página. Los totales del resumen son del
  set filtrado completo (ventanas del repo), no de la página.
- **Vencidas**: el endpoint fija `status=OVERDUE` y ordena por días vencidos
  desc; la UI solo pagina. "Alta prioridad" = >60 días vencidos, el mismo
  umbral de `summary.high_priority_count`.
- **Ficha de cliente**: `total_overdue` de este endpoint usa >30 días desde la
  venta (distinto del vencimiento real del listado) y se rotula con esa
  definición. `max_days_overdue`/`avg_days_outstanding` son antigüedad desde la
  venta, no días vencidos. La antigüedad por tramos se deriva de `sale_date` de
  las cuentas listadas (mismo criterio del BE) y se avisa si el endpoint capa a
  100. Sin pagos (`total_payments = 0`) el BE devuelve `payment_behavior =
  EXCELLENT` con promedio 0: la UI muestra "Sin pagos registrados" y `—`.
- **`collection_rate` del riesgo no se muestra**: su fórmula puede superar
  100 % (dev: 286,9 % para un cliente con historial). Mostrarlo como tasa sería
  una cifra engañosa.
- **Sub-unidad**: un saldo real de 0,38 Gs se redondearía a "Gs. 0" con
  `formatPYG`; `formatMoney` muestra 2 decimales cuando `0 < |monto| < 1`
  ("Gs. 0,38") para no simular una cuenta saldada.
- **Errores aislados por sección**: cada card tiene su `QueryBoundary` (el P0
  de la auditoría era un `Promise.all` que tumbaba el dashboard completo). El
  404 del detalle/ficha es un estado propio ("no encontrado"), no un fallo.

### 15.3 Tests

- Dominio: `format` (montos/sub-unidad, fechas UTC vs locales, rango
  exclusivo, `daysSince`), `status` (estados, filtros, prioridad >60),
  `aging` (tramos, sin clasificar, totales de página, antigüedad derivada),
  `risk` (niveles, comportamiento, señales, sin pagos), `collection`
  (whitelist/aria-sort/toggle, serie sin bucket posterior), `kpis` (portafolio,
  período, listado, vencidas, antigüedad, ficha; `collection_rate` del riesgo
  excluido), `periods`, `errors` — 42 casos.
- Servicio: rutas/params de los 9 métodos, codificación de ids, limpieza de
  params y error telemetrizado — 11 tests.
- Hooks: params por endpoint (paginación/estado/orden/período), normalización
  de slices nil, rango + serie, fallo cuando falta `data` — 11 tests; período
  en URL (default, validación, escritura, limpieza) — 4 tests.
- Páginas: Dashboard (10: KPIs, rango, serie, aging, deudores, recientes,
  empty, error aislado, selector), Lista (10: resumen, orden/aria-sort,
  filtro, paginación, empty, error, sin floats), Detalle (6: campos, pagos,
  sin `due_date`, 404, error), Vencidas (6: resumen, prioridades, paginación,
  empty, error), Ficha de crédito (9: cartera, riesgo/señales, sin pagos, sin
  `collection_rate`, aging derivado, cap 100, 404, error), Antigüedad (7:
  totales, tabla, sin clasificar condicional, paginación, empty, error) — 48
  tests.
- i18n: paridad es/en, sin vacíos, claves nav y todas las claves estáticas de
  F7 — 4 tests. Nav: 4 hojas con `receivables:read`, grupo presente/ausente
  según pack y permisos — test de F2-F6 actualizado. Alertas: "Gestionar" de
  CxC hacia `/receivables/overdue` — page test de F2 actualizado. Buscador:
  gate `requiredModule`/`requiredPermission` — 4 tests. Modal de cliente:
  pivote de riesgo con `receivables:read` — 6 tests.

### 15.4 Archivos retirados (regla 6, documentado)

- `src/domain/receivables/mappers.ts` + `mappers.test.ts`: fabricaba
  `riskScore = days_overdue + 20`, caía a `CLI-001`/`Cliente Desconocido`,
  inventaba `nextAction`/`lastContact`/`contactVia` y duplicaba `activities`.
  Sin consumidores tras F1; el feature nuevo deriva solo del contrato.
- `risk.test.ts` y `aging.test.ts` viejos: reemplazados por los tests de los
  módulos re-escritos (mismos nombres de archivo).
- El bloque `receivablesService` de
  `services/__tests__/biServices.p0-methods.service.test.ts` se retiró: el
  contrato vive en `receivables.service.test.ts` (el service se reescribió
  tipado y perdió los aliases `@deprecated`).

### 15.5 Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: **284 archivos / 1985 tests OK**.
- `pnpm build`: OK; chunks lazy `ReceivablesDashboardPage`,
  `ReceivablesListPage`, `ReceivableDetailPage`, `OverdueReceivablesPage`,
  `ClientCreditProfilePage`, `ReceivablesAgingReportPage` (+ badges y refresh
  compartidos).
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; 1108 legacy).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: sin `mock`/`Math.random`/`sample`/`dummy` en
  producción de F7 (solo el comentario "Sin fallback demo/mock" del servicio).
- Gate TS: archivos nuevos de la fase solo `.ts`/`.tsx` (0 `.js`/`.jsx`).
- Backend: sin cambios (`git status` limpio); contrato verificado con `psql` y
  los 9 endpoints en vivo.
- Auditoría `vercel-react-best-practices` aplicada con criterio: páginas lazy,
  las 4 queries del dashboard corren en paralelo y react-query las deduplica,
  sin `useEffect` para estado derivado (aging, cap de 100, KPIs y señales se
  derivan en render), `ResizeObserver` con deps primitivas, sin componentes
  definidos dentro de componentes y mapas de metadatos a nivel de módulo.
  Excepción consciente: el barrel público del feature (plantilla FSD del plan)
  en lugar de imports profundos.
- **Smoke vivo** (`:5050` + Vite `:5173` `--mode api`, JWT de dev admin
  `jJkV4F6HR`, rol `F2VLso`, sesión 1379, entitlements core+bi):
  6 pantallas, 0 errores de consola, 0 page errors y 0 respuestas HTTP ≥400.
  - Dashboard: cartera Gs. 315.250 (pendiente y vencido), 3 cuentas (todas
    vencidas), alta prioridad 3, tasa histórica 93,8 %, antigüedad media
    (saldadas) 116 d; período mes: facturado/cobrado Gs. 1.475.500, tasa 100 %,
    días al primer pago 0, vencido 0 %; serie semanal 28 sept Gs. 1.254.100,
    05 oct Gs. 26.000, 12 oct Gs. 75.400/Gs. 117.260/−41.860, 19 oct
    Gs. 120.000 (sin el bucket 02 nov); aging 100 % >90 d; deudores Erika
    Gs. 314.600 y Rene Gs. 650 (comportamiento POOR); 3 cuentas recientes.
  - Período año: rango 01 ene 2026 – 31 dic 2026, facturado Gs. 4.837.175,
    cobrado Gs. 4.521.925, tasa 93,5 %, DSO 16 d, vencido 70,2 %; 12 semanas
    desde el inicio del rango.
  - Lista: resumen Gs. 477.890 / 315.250 / 162.640, 3 cuentas y 3 de alta
    prioridad; filtro "Vencidas" y sort por cliente verificados (request
    `status=OVERDUE`, `sort_by=client&sort_order=ASC`, `aria-sort=ascending`);
    la fila de Gs. 0,38 se muestra como `Gs. 0,38`.
  - Vencidas: 286/121/111 días, 3 en alta prioridad, paginación real.
  - Detalle `SALE-1780338284-194`: Erika, vencida, 111 días, original =
    pendiente Gs. 314.600, cobrado Gs. 0; sin pagos registrados; sin fecha de
    vencimiento sintetizada.
  - Ficha de Erika: Gs. 314.600 pendiente/vencido, 1 cuenta, venta más antigua
    01 jun 2026, antigüedad máx./prom. 141 d, >90 d Gs. 314.600, 7 pagos,
    promedio de pago 0 d; riesgo alto, proporción vencida 100 %, 4 señales,
    comportamiento excelente; `collection_rate` 286,9 % **no** visible.
  - Antigüedad: cartera Gs. 315.250, 2 clientes, >90 d 100 %; tabla de 2 filas
    con Total visible a 1440 (se eliminó el scroll horizontal de la versión
    intermedia).
  - Alertas: "Gestionar" de CxC apunta y navega a `/receivables/overdue`;
    buscador global encuentra las 4 hojas del grupo.
  - Responsive 1440/390: `bodyOverflow=false` en las 6 pantallas.

### 15.6 Pendiente / deuda declarada

- Endpoints no consumidos por falta de pantalla en el plan:
  `/receivables/aging/summary` (overview y reporte la embeben),
  `/receivables/collection/reminders`, `/receivables/collection/high-priority`
  y `/receivables/statistics/date-range` (solo 4 períodos estándar). No se
  agregaron métodos muertos.
- `statistics.top_debtors` sigue viniendo en el payload pero no se usa: el
  dashboard pide `/receivables/top-debtors` para no atar el dato al período.
- La ficha de cliente lista hasta 100 cuentas (cap del BE); si el cliente tiene
  más, el aviso lo dice y la antigüedad derivada queda acotada a esa página.
- Un saldo positivo menor a 1 Gs se muestra con 2 decimales; el resto sigue la
  convención PYG sin decimales.
- El 404 de la ficha se decide solo por el cliente: un fallo del endpoint de
  riesgo se muestra como error de la sección de riesgo, no como "cliente no
  encontrado".
- Sin push: F1-F7 quedan locales en la rama FE.

---

## 16. Estado de ejecución — F8 Cuentas por Pagar (2026-10-20)

**Rama FE:** `feature/bi-ui-rebuild` (F1-F7 sobre `dev` = `82710c7`).
**Backend:** sin cambios (`git status` limpio); contrato de `/payables/*` verificado
con la API en vivo y el SQL del repo.

### 16.1 Ejecutado

- **Rutas (6)** en `src/App.tsx`, lazy y con `PayablesRoute` =
  `BiModuleRoute` (pack) → `PermissionGuard(payables:read)`, el mismo par que
  `biChain("payables:read", "payables")`:
  `/dashboard/payables`, `/payables/invoices`, `/payables/detail/:id`,
  `/payables/cash-flow`, `/payables/aging-report` y
  `/payables/suppliers/:id/analysis`.
- **Feature `src/features/payables/`** con la plantilla FSD:
  `components/` (UI pura), `hooks/` (react-query + período en URL), `types/` y
  barrel público. Cero fetch/cálculo en componentes.
- **Páginas delgadas** en `src/pages/payables/`:
  `PayablesDashboardPage`, `InvoicesMasterListPage`, `InvoiceDetailPage`,
  `CashFlowProjectionPage`, `PayablesAgingReportPage` y
  `SupplierAnalysisPage`.
- **Dominio puro** en `src/domain/payables/`: `format`, `status`, `listing`,
  `overview`, `aging` (re-escrito), `schedule`, `cashFlow`, `suppliers`,
  `statistics`, `periods`, `constants` y `errors`, todos con tests colocados.
- **Servicio tipado** `services/bi/payablesService.ts`: contrato real de los 9
  endpoints consumidos (`overview`, listado, detalle, top-suppliers, schedule,
  aging/report, statistics, cash-flow y supplier analysis), limpieza de params
  y telemetría; sin fallback demo. Tipos nuevos en `types/bi.ts`
  (`PayablesOverview`, `Payable`, `PayablesList`, `PaymentCalendar`,
  `CashFlowProjection`, `PayablesAgingReport`, `PayablesStatistics`,
  `SupplierAnalysis`, etc.).
- **Nav**: subgrupo `Cuentas por Pagar` con 4 hojas (`/dashboard/payables`,
  `/payables/invoices`, `/payables/cash-flow`, `/payables/aging-report`) y
  permiso `payables:read`; `Dashboard` gana la hoja `Cartera de CxP`
  (`/dashboard/payables`, mismo permiso). Detalle y análisis de proveedor no
  duplican entradas: se alcanzan desde tablas.
- **i18n**: namespace `payables` en `locales/{es,en}` (mismas claves,
  verificadas por test) + `nav.payables*` y `nav.dashboardPayables` en ambos
  shells. Las etiquetas dinámicas usan mapas de fallback en español, no el
  código crudo del BE.
- **Puntos de entrada §3.3 re-activados**:
  - #12 `searchableRoutes`: `/payables/invoices` vuelve con
    `requiredModule: 'bi'` y `requiredPermission: 'payables:read'`.
  - Los links salen de los datos reales: proveedor → análisis, factura →
    detalle, aging → análisis. Las alertas del dashboard no tienen destino de
    CxP en `alert_routes.go`, así que no se agregó un botón muerto.
- **Compartido**: `SectionCard`, `TableCard`, `QueryBoundary`,
  `TableEmptyState`, `DataSkeletons`, `BiPeriodSelector`, `SegmentedControl` y
  `TablePagination` se reusan. La tabla, el ledger KPI, los badges y el panel
  de calendario son locales del feature (un feature no importa componentes de
  otro).
- **UX verificada en vivo (1440/390 px)**: tabla del listado sin scroll a
  1440 (se quitó la columna "Acciones" redundante; el id ya linkea al
  detalle), top de proveedores con conteo y comportamiento bajo el nombre,
  selector de período dentro de la card (el título ya no se parte en 3
  líneas).

### 16.2 Contrato y hallazgos de datos (sin cambio de backend)

- **Sobrepagos netean el overview**: `PayablesOverview.total_pending` suma
  pendientes negativos de órdenes sobrepagadas. En dev el overview daba
  **Gs. 6.014.250** mientras el listado y el aging daban **Gs. 6.414.250**
  (diferencia exacta de Gs. 400.000): el "saldo pendiente" quedaba por debajo
  del "saldo vencido". La UI usa el **total clasificado del aging** (que
  coincide con el listado) y lo documenta en el hint. No se tocó el contrato.
- **Vencimiento sintético**: todos los cálculos usan
  `order_date + INTERVAL '30 days'` (overview, listado, detalle, calendario,
  flujo, prioridad). La UI lo rotula "compra + 30 d" y el detalle aclara que
  no es una condición del proveedor.
- **Antigüedad desde la compra**: los tramos del aging se calculan con
  `NOW() - order_date`, no con el vencimiento. Todas las pantallas lo dicen.
- **`status` PAID nunca aparece** en `/payables`: el WHERE exige saldo. El
  filtro ofrece solo PENDING/PARTIAL/OVERDUE y los tres se superponen.
- **Calendario desordenado**: el slice sale de un `map` de Go; el dominio lo
  ordena por fecha y los ítems por monto. Solo incluye vencimientos entre hoy
  y hoy+N días (todo lo vencido queda fuera).
- **Flujo de caja = vencimientos esperados**, no saldos bancarios:
  `expected_inflows` son CxC pendientes y `expected_outflows` CxP pendientes
  que vencen en la ventana. La cobertura se deriva (cobros ÷ pagos) con los
  umbrales 80/100 del BE; sin pagos esperados se muestra `—`, no `0 %`. La
  ventana tiene N+1 días (incluye hoy).
- **Estadísticas**: `average_dpo` mide compra → primer pago y cuenta hasta hoy
  si no hubo pago; `top_suppliers` del payload NO está acotado al período y
  no se renderiza (el dashboard usa `/payables/top-suppliers`, snapshot a
  hoy). La serie semanal descarta el bucket que arranca después del fin
  exclusivo del rango (artefacto del `WITH RECURSIVE`) y muestra hasta 12
  semanas desde el inicio.
- **Reporte de aging**: pagina por proveedor con totales globales
  (`total_amount`/`total_suppliers`); la suma de la página puede ser menor y
  la UI lo avisa. Riesgo crítico = deuda >90 d; moderado = 61-90 d o >50 % en
  31-60; mínimo = resto.
- **Análisis de proveedor**: `credit_terms` es el literal 30 del repositorio
  (no una condición negociada); `share_percentage` e `importance` son reales;
  `avg_days_to_pay` promedia todos los pagos (`0` puede ser pago el mismo día
  o ausencia de pagos; el contrato no expone el conteo). Las facturas se
  listan con `/payables?supplier_id=` porque el endpoint de análisis no las
  incluye.
- **`payment_history` de top-suppliers** se deriva de la proporción vencida,
  distinto del historial de la ficha; la card lo documenta.
- **Precisión honesta**: un porcentaje real >0 que redondea a 0 se muestra
  `<0,1%` (no `0 %`); los montos entre -1 y 1 Gs conservan 2 decimales.
- **Legado retirado**: `domain/payables/dashboard.ts` y `statusLabels.ts`
  (labels hardcodeados en español, factura `#FAC-` derivada y helpers de una
  forma de payload que ya no existe) se eliminaron con sus tests; los tipos
  `FinancialOverview`/`AgingReportItem` también (sin consumidores).

### 16.3 Tests

- Dominio: `format` (sub-unidad, `<0,1%`, fechas UTC vs locales, rango
  exclusivo, `daysSince`), `status` (estados/prioridades/comportamientos/
  importancias), `listing` (defaults, toggle de sort, aria-sort, rango
  inválido, filtros activos), `overview` (KPIs de cartera/período/listado/
  calendario/flujo/aging/proveedor y formateadores), `aging` (tramos,
  remanente sin clasificar, riesgo, totales de página), `schedule` (orden de
  días e ítems, aplanado, totales), `cashFlow` (días con movimiento, cobertura
  nula sin pagos, umbrales, totales), `suppliers` (proporción vencida,
  antigüedad), `statistics` (orden y descarte del bucket posterior), `errors`
  — 41 casos.
- Servicio: rutas/params de los 9 métodos, codificación de ids, limpieza de
  params y error telemetrizado — 11 tests. El bloque legacy de CxP se retiró
  de `biServices.p0-methods.service.test.ts` (contrato canónico nuevo).
- Hooks: params por endpoint (estado/prioridad/texto/fechas/página/orden),
  rango inválido sin request, normalización de slices nil, paginación derivada
  del aging, ventanas (schedule/cash-flow), detalle y análisis — 10 tests;
  período en URL (default, validación, escritura y limpieza) — 5 tests.
- Páginas: Dashboard (cartera/aging/período/trend/top/calendario, error
  aislado, sin claims), Lista (resumen, links, sort, filtros, texto, rango
  inválido, empty, paginación, sin `#FAC-`/`$`), Detalle (montos, pagos, 404,
  sin pagos, nota del vencimiento), Flujo (totales, cobertura, empty, ventana,
  sin bancos/insights), Aging (totales, distribución, riesgo, paginación,
  error con retry) y Proveedor (KPIs, comportamiento, condiciones, facturas,
  404, sin límite de crédito/trends) — 33 tests.
- i18n: paridad es/en, sin vacíos, claves nav y todas las claves estáticas de
  F8 — 4 tests. Nav: 7 subgrupos BI con CxP, 4 hojas y `payables:read`; leaf
  `Cartera de CxP`; gate anyOf sin grupo vacío (`audit:read` sigue sin hoja
  hasta F10). Buscador: gate `requiredModule`/`requiredPermission` de
  `/payables/invoices` — 3 tests.

### 16.4 Gates

- `npx tsc --noEmit`: 0 errores.
- `npx vitest --run`: **301 archivos / 2044 tests OK**.
- `pnpm build`: OK; chunks lazy `PayablesDashboardPage`,
  `InvoicesMasterListPage`, `InvoiceDetailPage`, `CashFlowProjectionPage`,
  `PayablesAgingReportPage` y `SupplierAnalysisPage`.
- `pnpm lint:design -- --base dev`: OK (código nuevo limpio; 1108 legacy).
- `pnpm lint`: 0 errores (132 warnings legacy, sin cambios).
- Gate anti-fabricación §5.3: en producción de F8 solo el comentario "Sin
  fallback demo/mock" del servicio; los demás matches son `vi.mock` de tests.
- Gate TS: archivos nuevos de la fase solo `.ts`/`.tsx` (0 `.js`/`.jsx`).
- Backend: sin cambios (`git status` limpio).
- Auditoría `vercel-react-best-practices` aplicada con criterio: páginas
  lazy, queries paralelas/deduplicadas por react-query (el dashboard dispara
  4 en paralelo y cada card aísla su error), sin `useEffect` para estado
  derivado (KPIs, aging, cobertura y riesgo se derivan en render),
  `ResizeObserver` con deps primitivas en la tabla y sin componentes
  definidos dentro de componentes. Excepción consciente: el barrel público
  del feature (plantilla FSD del plan).
- **Smoke vivo** (`:5050` + Vite `:5173`, JWT de dev acuñado con el
  `JWT_SECRET` local, admin `jJkV4F6HR`, rol `F2VLso`, sucursal 1):
  6 pantallas, **0 errores de consola, 0 page errors y 0 respuestas HTTP ≥400**.
  - Cartera: pendiente/vencido Gs. 6.414.250, 18 cuentas (todas vencidas),
    aging 31-60 Gs. 1.000 `<0,1 %`, 61-90 Gs. 2.903.800 (45,3 %), >90
    Gs. 3.509.450 (54,7 %), tasa histórica 60,4 %, antigüedad media (saldadas)
    127 d.
  - Período mes: comprado/pagado Gs. 275.000, tasa 100 %, primer pago 0 d,
    vencido 0 %; serie semanal 5 buckets (sin el 02 nov posterior al rango).
  - Lista: 18 cuentas, 10 filas, 2 páginas, resumen pendiente Gs. 6.414.250;
    sort por proveedor y filtro Vencidas verificados.
  - Detalle `PO-2`: Protek PRO, Gs. 500.000 pendiente, 315 días vencidos,
    sin pagos registrados, sin fecha de vencimiento contractual.
  - Proveedor Protek PRO: Gs. 500.000 pendiente/vencido, participación 8,3 %,
    importancia media (traducida), comportamiento excelente, plazo estándar
    30 d, deuda más antigua 08 nov 2025 (hace 346 días), 1 factura pendiente.
  - Aging: 4 proveedores, Gs. 6.414.250, riesgos crítico/moderado reales,
    paginación de 4 ítems.
  - Flujo: cobros/pagos Gs. 0 (sin vencimientos futuros), cobertura `—`,
    empty honesto de días con movimiento, ventana de 31 días.
  - Sin `$`, `Live`, "en tiempo real", "objetivo", `#FAC-`, bancos ni
    "Insights"; `bodyOverflow=false` a 1440 y 390 px; tablas sin scroll
    interno a 1440.
- Sin push: F1-F8 quedan locales en la rama FE.

### 16.5 Pendiente / deuda declarada

- Endpoints no consumidos por falta de pantalla en el plan:
  `/payables/overdue` y `/payables/urgent` (el listado filtra por
  estado/prioridad), `/payables/aging/summary` (overview y reporte la
  embeben), `/payables/reminders*`, `/payables/statistics/date-range` (solo 4
  períodos estándar) y `/payables/payment-capacity` (la cobertura se deriva
  del cash-flow). No se agregaron métodos muertos.
- `/payables/supplier/{id}` no se consume: la ficha lista sus facturas con el
  endpoint de listado filtrado (mismos campos y paginación real).
- No hay pantalla de registro de pagos a proveedor ni comparación custom de
  períodos: fuera del alcance de F8 (los pagos pertenecen a Compras).
- `overview.total_pending` sigue neteando sobrepagos en el contrato; la UI lo
  compensa con el total del aging y lo documenta. Cambiarlo exige tocar el
  repo y el contrato.
- `searchableRoutes` reconoce solo `/payables/invoices`; los reportes
  financieros (`/finance/*`) siguen pendientes de F9.
- Falta F9 (Reportes Financieros), F10 (Auditoría) y F11 (Pronósticos).

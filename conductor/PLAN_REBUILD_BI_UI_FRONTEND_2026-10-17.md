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
| 12 | Rutas BI en buscador global sin gate | `config/searchableRoutes.js:34-68` (`/receivables/list`, `/payables/invoices`, `/finance/tax-management`, `/finance/legal-books`) | eliminar entradas | F7/F8/F9 **con** `requiredModule: 'bi'` (cierra el gap actual de gate) |
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

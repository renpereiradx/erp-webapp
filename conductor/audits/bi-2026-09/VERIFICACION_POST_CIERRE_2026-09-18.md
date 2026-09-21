# VERIFICACIÓN POST-CIERRE — Auditoría BI 2026-09

**Fecha**: 2026-09-18 · **Qué es**: verificación independiente, contra el código actual (rama `dev` de `erp-webapp` y `main` de `business_management`), de cada compromiso documentado por el plan `PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14` (purgado del conductor raíz, commit `105b7fc`; versión final recuperable con `git show 13cb68f:conductor/PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md`).
**Motivo**: detectar lo que quedó sin hacer para su corrección posterior. Los pendientes se mapean a `conductor/PLAN_ALINEACION_BI_FRONTEND_2026-09-18.md` (raíz) donde corresponde.
**Addendum**: reverificado 2026-09-21 contra `dev` post-PLAN_ALINEACION (F0–F7 mergeados) — ver §5.

---

## 1. Documentos creados a partir del plan de auditoría (inventario y paradero)

| Documento | Ubicación hoy | Estado |
|:----------|:--------------|:-------|
| Plan raíz `PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md` (1022 líneas, avance por fase) | conductor raíz | **Purgado** (`105b7fc`) — recuperar con `git show 13cb68f:conductor/…` |
| Protocolo + fichas de auditoría (47) + `SUMMARY.md` + screenshots (63+) | `erp-webapp/conductor/audits/bi-2026-09/` | ✅ Vivo |
| `PLAN_FASE4_MIGRACION_TSX_BI_2026-09-16.md` (alcance binario + checklist DESIGN por página) | `erp-webapp/conductor/` | **Purgado** (`2e516ea`) — recuperar con `git show 2e516ea^:conductor/…` |
| `AUDIT_REACT_PERFORMANCE_BI_FRONTEND.md` (H1–H7) | `erp-webapp/conductor/` | ✅ Vivo |
| Cierre FASE 5 (tests + H7 + drifts) | sin doc propio — registrado en el plan raíz purgado + commits FE `5ef861c`/`b14b49e` | En historial |
| Sesión post-cierre H1–H5 + retro-i18n | commits FE `7e33f7b`/`4be20be`/`6ebc472` | En historial |
| BE: 18 reportes (`AUDIT_BI_BACKEND_2026-09.md`, `FASE0_BASELINE_EXPLAIN`, `AUDIT_BI_T1_TIMEZONE`, `FASE1_T2…T17_T18`) | `business_management/conductor/` | ✅ Vivos (verificado ls) |

## 2. Compromisos verificados como HECHOS ✅ (evidencia en código actual)

| Compromiso (plan) | Evidencia |
|:------------------|:----------|
| FASE 1 BE completa (T1–T23, gate 5be5ef2) | Commits citados existen: `5be5ef2`, `3e77d05`, `41e708e`, `ce2af93`, `884231b`, `d2d3607`, `251e69b`… + migraciones `20260914184232` (índices), `20260916183127` + `20260916185600` (backfill audit legacy) presentes |
| 3A — 12 métodos de service faltantes (P0-1/P0-2) | `payablesService.ts` (6), `receivablesService.ts` (`getOverview`+aliases), `financialReportsService.ts:73` (`getTaxSummary`) + test de contrato `biServices.p0-methods.service.test.ts` |
| 3B — NA-DB-1 unwrap `.data` | `useDashboardStore.ts:196,255,320` |
| 3B — bancos/insights fabricados fuera (P0-6) | `features/cash-flow/data/` eliminado; 0 refs a Santander/bankPositions |
| 3C — auditoría real (KPIs mock 12.450/42 fuera, paginación, "+12.5%" fuera) | `AuditDashboard.tsx`/`AuditLogs.tsx` migradas; greps en 0 |
| 3D — RBAC: 32 guards + T18 (`RoleGuard` F2VLso → `PermissionGuard audit:read`) | `App.tsx:718-740`: 4× PermissionGuard `audit:read`; 0 RoleGuard |
| 3E — "Nueva Factura" 404 fuera; `/clientes`→`/parties` | 0 refs a `/clientes` y a `/payables/new` |
| 3F — fabricaciones fuera (score 50, 150M, churn 13.9%, "$742k Predictive", chip Sincronizado CxC, "Oct 2023" en vivas) | Greps en 0 en código vivo (docstring `FinancialSummaryDashboard.tsx:47` lo confirma) |
| 3H — mocks de estado inicial fuera + banner T8 | `App.tsx:246-265` escucha `api:partial-data`; `features/accounts-payable/data/` eliminado |
| 3I — 3 rutas huérfanas + componentes eliminados | 0 refs `/bi/inventory/*`, `/finance/profitability`; `StockManagement.jsx`/`ProfitabilityAnalysis.jsx` no existen |
| 3K + cierre ② — paginación server-side stock-levels y demanda | Commits `6dfb20f`/`0f524b6` (historial) |
| FASE 4 — 12 páginas migradas .tsx + drift fixes | Archivos .tsx presentes (auditoría 2026-09-18) |
| FASE 5 — 17 archivos/78 tests + H7 en migradas + drifts TZ/++pp/es-PY | 17 test files presentes; suite 734/734 |
| Post-cierre H2/H3 — selectores atómicos + guard anti-carrera | `useDashboardStore.ts` seq-counters; páginas con `useDashboardStore(s=>…)` |
| Post-cierre H1 — lazy routes | `App.tsx` todas lazy **excepto Dashboard** (ver pendiente 8) |
| Post-cierre retro-i18n | `locales/es/bi.js` + `en` (296 keys) usadas por las migradas |

## 3. NO hechos o parciales ❌⚠️ — lista de corrección posterior

| # | Pendiente | Evidencia actual | Gravedad | Dónde se ataca |
|:--|:----------|:-----------------|:---------|:----------------|
| 1 | **P1-1 quedó a medias: el fallback demo vive en el STORE** — 3H limpió páginas pero no `useDashboardStore` | `useDashboardStore.ts:199,258,329,469` (`DEMO_MODE` + `getDemoDashboardData` en el catch de los 4 fetchers; `Math.random` L270/280) | ⚠️ trampa en prod | PLAN_ALINEACION F5 (D1) |
| 2 | **P1-9 quedó a medias: código muerto con mocks sin eliminar** | `components/business-intelligence/` completo (6 archivos, **0 consumidores**, contiene las fabricaciones `INV-2023-…`/`$12,450` que se creían extintas en `ReceivablesTopDebtors.jsx:9-11`); `services/mocks/receivablesMock.js` y `salesAnalyticsMock.js` (0 consumidores c/u). Los otros 3 mocks (`auditMocks`, `clientMock`, `biForecastingMock`) tienen consumidor (modo demo) | ⚠️ | PLAN_ALINEACION F0 |
| 3 | **H7 quedó a medias: botones muertos sobreviven en páginas no migradas** | `ConsolidatedAlerts.jsx:192,479` (Marcar todo/Silenciar) · `TopProductsOverview.jsx:194` (Exportar) · `PayablesAgingReport.jsx:250` (Nuevo Pago) · `InvoiceDetail.jsx:140` (Registrar Pago) · `TaxManagementDashboard.jsx:199` (Formulario 120) · `Dashboard.jsx:163` (Exportar Informe) · `ReceivablesMasterList.jsx:73,77` (Exportar/Nuevo Cobro) · `OverdueAccounts.jsx:82,89` (stubs `not_implemented`) · `SalesHeatmap` widget "Sucursales Activas" muerto | ⚠️ regla FE-2 | FASE por página (F3–F6, contrato §2.6) |
| 4 | **P2 paginación quedó a medias** | Sin paginar: `CustomerSellerInsights.tsx` (tablas clientes/vendedores), top-productos de `sales-analytics/Dashboard.tsx`, `SaludInventario.jsx`, `PronosticoVentas.jsx`/`PronosticoIngresos.tsx`, `OverdueAccounts.jsx` | ⚠️ regla ≤10 filas | F5/F6 (agregar explícitamente) |
| 5 | **"+12% vs mes anterior" literal sobrevive** (P1 growth literales se limpió solo en Insights) | `ProductsCategories.jsx:146` | ❌ dato falso | F6 |
| 6 | **Datos fabricados no detectados por F2 en `AuditLogDetail`** | `AuditLogDetail.jsx:96` (endpoint `"/api/v1/sales"` hardcodeado), `:181` (correlation-id `f9a2-55d1-42e8-b80c` literal) | ❌ dato falso | F6 |
| 7 | **Donut decorativo fake en PyG** (100% estático, no refleja datos; hex crudos) | `ProfitAndLoss.jsx:196-198` | ❌ | F6 |
| 8 | **H1 quedó a medias: `Dashboard` sigue con import estático** | `App.tsx:28` — recharts viaja en el chunk inicial | ⚠️ perf | F0 (D4) |
| 9 | **Doble montaje `/dashboard/receivables` (dashboard:read) vs `/receivables` (receivables:read)** — señalado en ficha 2B, nunca unificado | `App.tsx:325` vs `:413` | ⚠️ RBAC | F0 (D3) |
| 10 | **Nota de release BC-1 (timezone)** prometida en §7 del plan | No existe release note/changelog | ❌ doc | Tarea suelta (BE/docs) |
| 11 | Retro-i18n solo cubrió las 12 migradas | 19 páginas legacy + InventoryAnalytics sin i18n (deja documentado en FASE 4) | documentado | PLAN_ALINEACION completo |

**Pendientes BE documentados como leaves deliberados** (no son olvidos, se listan para no perderlos): snapshot histórico de `unit_cost` (mejora futura, anotada para FASE 8 del backend); validación TZ en prod + flip `BI_RATE_LIMIT_ENFORCE` (runbooks en los reportes T1/T14); índices en prod con `CREATE INDEX CONCURRENTLY` (runbook en la migración T2); validación de zona como parte de la auditoría A0 de prod (deploy blocker ya registrado en `PLAN_MONOROL…`).

## 4. Conclusión

El plan se ejecutó de forma verificable: FASE 1 (backend) y los fixes P0 de FASE 3 están completos y con evidencia en código; FASE 4/5 y la sesión post-cierre dejaron las 12 páginas migradas con tests. Los incumplimientos se concentran en tres clases: **(a)** dos remedios que quedaron cortos (fallback demo del store, código muerto P1-9), **(b)** todo lo que tocaba páginas legacy excluidas del alcance binario de FASE 4 (botones muertos, paginación, i18n — excluidas de forma documentada, hoy cubiertas por el plan de alineación), y **(c)** dos fabricaciones que la propia FASE 2 no detectó (strings fake de AuditLogDetail, donut de PyG). Todo lo anterior está absorbido por `PLAN_ALINEACION_BI_FRONTEND_2026-09-18.md` (F0/F5/F6) salvo la release note BC-1, que queda como tarea suelta del lado de docs/BE.

## 5. Addendum 2026-09-21 — reverificación post PLAN_ALINEACION (F0–F7 mergeados a `dev`)

Estado de los 11 pendientes de §3 contra `dev` de `erp-webapp` (`5bea50a` + fix `c585f08`) y `dev` de `business_management` (`e044750`). Correcciones aplicadas hoy: **FE `c585f08`** (fabricaciones + mock muerto) y **BE `e044750`** (release note BC-1). Gates: vitest **1013/1013** (134 archivos, +6 tests nuevos), `tsc` 0, `pnpm build`, `pnpm lint:design` — verdes.

### 5.1 Segunda pasada (mismo día): cierre de la deuda restante

Los tres ítems que §5 dejaba como deuda se cerraron contra el nuevo backend T9 (`business_management` `fab1e0e`/`d37a957`) y FE `9d56df6`/`88d5ca0`. Gates: vitest **1024/1024** (+11), `tsc` 0, build, lint:design — verdes; BE 37 paquetes OK + lint/gofmt.

| # | Pendiente (§3) | Estado 2026-09-21 | Evidencia |
|:--|:---------------|:------------------|:----------|
| 1 | Fallback demo del store (P1-1) | ✅ Resuelto (D1/D2) | 0 refs a `DEMO_MODE`/`getDemoDashboardData`/`Math.random` en `useDashboardStore`; loading/error por slice. Los `IS_DEMO_MODE` restantes son de `saleService`/`salePaymentService` (modo demo de ventas, fuera de scope BI) |
| 2 | Código muerto con mocks (P1-9) | ✅ Cerrado hoy, con hallazgo | `components/business-intelligence/` eliminado (F0); `receivablesMock` borrado (711e3cdb). **`salesAnalyticsMock.js` sobrevivía en `dev`**: el commit de borrado `7f43e9b` quedó colgante (ninguna rama lo contiene) pese a que el README raíz lo registraba como absorbido → borrado de verdad en `c585f08` (0 consumidores verificados). Quedan `auditMocks`/`clientMock`/`biForecastingMock` con consumidor real (modo demo) |
| 3 | H7 en páginas legacy | ✅ Resuelto (F3–F6) | En las migradas .tsx los botones muertos fueron eliminados (ConsolidatedAlerts, Dashboard, InvoiceDetail, PayablesAgingReport, TaxManagementDashboard, ReceivablesMasterList, OverdueAccounts, TopProductsOverview, SalesHeatmap) o cableados (`DetailSidebar` Registrar Pago); PronosticoVentas/Ingresos: "Exportar" → "Actualizar" honesto |
| 4 | Paginación P2 a medias | ✅ Cerrada (5.1) | `CustomerSellerInsights` (ambas tablas), `SaludInventario` y `OverdueAccounts` paginan server-side con pager compartido `TablePagination`; `sales-analytics/Dashboard` cumple por cota (top_products LIMIT 5 fijo); PronosticoVentas/Ingresos cumplen por horizonte acotado (`forecast_months` capped a 12, `history_months` a 24 en el BE). BE: `by-seller` + `/forecast/inventory` ganaron T9; el summary de overdue expone totales globales (window aggregates) para que los KPIs no cuenten solo la página |
| 5 | "+12% vs mes anterior" | ✅ Cerrado hoy + hallazgo nuevo | Eliminado de `ProductsCategories` (+ test anti-regresión que afirma su ausencia). **Nueva fabricación misma clase detectada en `AuditUserActivity`**: badges +12%/+5%/-2%, bloque "Tendencia Positiva +15%", "IP: 192.168.1.104" y "hace poco" hardcodeados — eliminados en `c585f08` |
| 6 | Fakes de `AuditLogDetail` | ✅ Resuelto (F6) | endpoint y correlation-id reales con render condicional; el docstring del componente documenta los literales eliminados |
| 7 | Donut decorativo fake PyG | ✅ Resuelto (F6) | eliminado (comentario in situ en `ProfitAndLoss.tsx`) |
| 8 | `Dashboard` eager (H1) | ✅ Resuelto (D4) | `App.tsx:29` lazy; index 875.59 kB (presupuesto 940) |
| 9 | Doble montaje receivables | ✅ Resuelto (D3) | `/dashboard/receivables` y `/receivables` ambos con `PermissionGuard receivables:read` (`App.tsx:327/:419`) |
| 10 | Release note BC-1 | ✅ Cerrado hoy | `business_management/CHANGELOG.md` `[Unreleased]`: entrada BC-1 (semántica `BI_TIMEZONE`/`BI_STORAGE_TIMEZONE`, boundary no destructivo, guard de startup, runbook §4, fixed de audit/turnover) — BE `e044750` |
| 11 | i18n solo en migradas | ✅ Cerrado (5.1) | `ProductsCategories` migrada a `bi.sales.categories.*` en `c585f08`; `SaludInventario` reescrita con i18n completo `bi.forecast.inventory.*`; `AuditUserActivity` migrada full (tokens + i18n `bi.audit.user.*` + lucide + 3 estados, `88d5ca0`) |

**Hallazgo de proceso**: el addendum del cierre registraba "salesAnalyticsMock borrado (`7f43e9b`)" — ese commit existía como objeto pero ninguna rama lo referenciaba (el FF-merge registrado en reflog quedó en `5bea50a`). Lección: verificar con `git branch --contains <hash>` (o `git cat-file -e HEAD:<path>`) que un commit citado como absorbido es alcanzable desde la rama; el README raíz se corrigió en el wrapper.

**Hallazgos nuevos de la segunda pasada (5.1)**: la columna "Progreso de Meta" de vendedores renderizaba `target_progress`, campo que el backend **nunca envió** (`undefined%` en prod, enmascarado por el mock del test); el summary de `/receivables/overdue` reportaba `item_count` de la página (no el global) y no exponía el conteo de alta prioridad, indispensable al paginar — corregido en `d37a957`; los botones "Exportar Reporte" de SaludInventario y PronosticoVentas hacían refetch (H7) → rotulados "Actualizar".

**Tercera pasada (mismo día): deuda menor cerrada** — FE `69b400c`: PronosticoVentas des-minificado, tipado y con test propio; la convención `ui_labels` del BE se eliminó end-to-end (el payload ya no lleva strings de UI y las 4 páginas de bi-forecasting leen i18n directamente — las etiquetas en español servidas por la API rompían el locale `en`; los normalizadores ya no fabrican objetos `ui_labels`). BE `7764a22`: los leaves de prod (A0 dual-roles, índices CONCURRENTLY + `migrate-force`, validación TZ BC-1, flip `BI_RATE_LIMIT_ENFORCE`) quedaron consolidados en un checklist ejecutable único (`business_management/conductor/RUNBOOK_PROD_PENDIENTES_BI_2026-09-21.md`) — su ejecución requiere acceso a prod y se marca en la tabla del propio runbook. Queda deuda menor de formato: ninguna en scope BI.

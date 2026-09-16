# SUMMARY — Auditoría BI 2026-09 (FASE 2 completa)

**Fecha de cierre**: 2026-09-16 · **Alcance**: 49 páginas del sidebar + 2 páginas de detalle (ficha Logs) + 3 rutas huérfanas = **50 páginas auditadas + 3 huérfanas** en 9 bloques + huérfanas.
**Modo**: `pnpm dev:api` (`VITE_USE_DEMO=false`), BE `:5050` con FASE 1 completa (5be5ef2).
**Roles**: admin consolidado (dev-JWT trailadm sin branch = scope real) + vendedor VNDR01 (spot-check por bloque).
**Protocolo**: §3 del plan raíz (screenshots por tramos, trazabilidad card→endpoint contra la API en vivo, afordancias probadas por dispatch, hardcode scan, tablas, redirecciones, estados, DESIGN, AGENTS).

## 1. Matriz página × veredicto

| # | Bloque | Página | Veredicto | Hallazgo principal |
|:--|:--|:--|:--|:--|
| 1 | CxP | `/dashboard/payables` | **FAIL** | P0-1: top-proveedores y calendario muertos como vacío-sin-error; USD/Período decorativos |
| 2 | CxP | `/payables/invoices` | **FAIL** | P0-1: página entera en error; "Nueva Factura" → `/payables/new` **404** |
| 3 | CxP | `/payables/detail/:id` | **FAIL** | P0-1 + leak técnico "is not a function" en la UI |
| 4 | CxP | `/payables/cash-flow` | **FAIL** | API 200→UI en cero (drift total) + bancos/insights fabricados + 7 botones muertos |
| 5 | CxP | `/payables/aging-report` | **FAIL** | Datos reales ✅ pero 3 KPIs "---" y 4 botones decorativos |
| 6 | CxP | `/payables/suppliers/:id/analysis` | **FAIL** | Página EN BLANCO con API 200 (destructuring drift + error nunca renderizado) |
| 7 | CxC | `/receivables` | **FAIL** | P0-2 envenena Promise.all → todo en ceros + curva SVG fabricada + chip "Sincronizado" falso |
| 8 | CxC | `/receivables/list` | **FAIL** | P0-2 → vacío deshonesto; filtros = stubs "no implementada" |
| 9 | CxC | `/receivables/detail/:id` | **FAIL** | 2 métodos inexistentes; error honesto ✅; API 200 verificada |
| 10 | CxC | `/receivables/overdue` | **FAIL** | Puro name-mismatch (`getOverdueAccounts` vs `getOverdue`); es la ruta canónica T5 |
| 11 | CxC | `/receivables/aging-report` | PASS cond. | Datos reales al centavo; "Oct 2023" hardcodeado; gráfico sin fuente |
| 12 | CxC | `/receivables/client-profile/:id` | **FAIL** | Score 50 fallback vs `risk_level: LOW` real; límite 150M literal; barras literales; falsa alerta >90d |
| 13 | Dashboard | `/dashboard` | **FAIL** | **NA-DB-1**: store guarda envelope sin `.data` → todo en Gs. 0 (trends/actividad reales). Fix 1 línea |
| 14 | Dashboard | `/dashboard/kpis` | **FAIL** | Índice de Salud = TODO `turnover*10`; chips candado decorativos; lee bien /kpis anidado |
| 15 | Dashboard | `/dashboard/sales-heatmap` | **FAIL** | **NA-DB-2**: KPIs "$0" en sistema PYG; grid real ✅; selects sin cablear |
| 16 | Dashboard | `/dashboard/alerts` | **FAIL** | **T5 "Gestionar" verificado EN VIVO** ✅; 4 botones sin handler; P0-4 `/clientes` no ejercitable |
| 17 | Dashboard | `/dashboard/top-products` | PASS cond. | Real y coherente; floats crudos; Exportar/Filtros decorativos |
| 18 | Sales Analytics | `/sales-analytics/dashboard` | PASS cond. | Real; "Métodos de Pago UNKNOWN 100%"; margen float crudo; MOCK en catch |
| 19 | Sales Analytics | `/sales-analytics/products-categories` | PASS cond. | Patrón de referencia; floats crudos; "+12%" literal |
| 20 | Sales Analytics | `/sales-analytics/insights` | **FAIL** | P1-3: growth/churn literales (+12%, 13.9% churn vs retención 100%); meta sin fuente |
| 21 | Sales Analytics | `/sales-analytics/trends-velocity` | **FAIL** | Heatmap grid SIN datos; "hora pico 14:00" hardcodeada (P1-4) |
| 22 | Sales Analytics | `/sales-analytics/period-comparison` | **FAIL** | % crudos (-77.0818…%); **delta de margen mal calculado (-5.0pp para +20.3pp)** |
| 23 | Sales Analytics | `/sales-analytics/discounts` | PASS cond. | Única con guard (reports:read) y .tsx; 1 línea incoherente |
| 24 | Pronósticos | `/bi/pronosticos/dashboard` | **FAIL** | Insight "+33521439.14%" = monto $ como % |
| 25 | Pronósticos | `/bi/pronosticos/inventario` | **PASS** | Mejor pág del grupo: forecast por producto real y accionable |
| 26 | Pronósticos | `/bi/pronosticos/ventas` | **PASS** | Historial+proyección reales; stats honestas (confianza 6,86%, R² 0,07) |
| 27 | Pronósticos | `/bi/pronosticos/demanda` | PASS cond. | Real; 13 filas sin paginar; confianza repetida |
| 28 | Pronósticos | `/bi/pronosticos/ingresos` | **FAIL** | 3 escenarios Gs. 0 "Prob. 0%"; bandas T20 no mapeadas; tabla real |
| 29 | Rentabilidad | `/profitability/dashboard` | **FAIL** | Gráfico vacío; texto roto; **profit del módulo ≠ summary global (política de costo 0,7)** |
| 30 | Rentabilidad | `/profitability/products` | **PASS** | Patrón de referencia; 7 SKUs reales |
| 31 | Rentabilidad | `/profitability/customers` | PASS cond. | Pareto 0% placeholder |
| 32 | Rentabilidad | `/profitability/categories` | **FAIL** | KPI "Gs. **NaN**" en el líder |
| 33 | Rentabilidad | `/profitability/trends` | **FAIL** | "+-100%"; pico "---"; gráfico vacío |
| 34 | Rentabilidad | `/profitability/sellers` | **FAIL** | Fan-out T15 del BE infla números; "OBJETIVO: 0%" |
| 35 | Inventario | `/inventory-analytics/dashboard` | **PASS** | La mejor página BI del sistema |
| 36 | Inventario | `/inventory-analytics/turnover-abc` | PASS cond. | Real; 2.839 días (quirk dev) sin nota |
| 37 | Inventario | `/inventory-analytics/stock-levels` | PASS cond. | **20 filas >10 sin paginación server-side** (P2); destino T5 ✅ |
| 38 | Inventario | `/inventory-analytics/risk` | **PASS** | Dead stock real post-T13 |
| 39 | FinReportes | `/dashboard/financial-summary` | **FAIL** | **Caja "$1.2M" = mock Santander; "Pronóstico $742k Predictive BI" fabricado** |
| 40 | FinReportes | `/finance/analytical-cash-flow` | PASS cond. | Real, "Fuente: API" honesto; saldo final ignora entradas |
| 41 | FinReportes | `/finance/tax-management` | **FAIL** | Hook llama `getVat`/`getTaxSummary` inexistentes; IVA legal post-T11 invisible |
| 42 | FinReportes | `/finance/sifen-inutilizacion` | **PASS** | Estados vacíos honestos; .tsx |
| 43 | FinReportes | `/finance/sifen-ops` | **PASS** | "Sin configurar" correcto sin cert; .tsx |
| 44 | FinReportes | `/finance/legal-books` | **PASS** | Patrón referencia intacto post-T11 |
| 45 | FinReportes | `/finance/profit-and-loss` | PASS cond. | Real post-BC-5; sin líneas de gastos operativos |
| 46 | Auditoría | `/auditoria` | **FAIL** | Curva fabricada + donut "100%" con total 0; "+12.5%" (P1-7 verbatim); "0% éxito = Óptimo" |
| 47 | Auditoría | `/auditoria/logs` | **FAIL (grave)** | **KPIs 100% mock (12.450 éxitos/42 errores/188/3.120) junto a tabla vacía; "Página 1 de 30" sin filas** |
| 48 | Auditoría | `/auditoria/logs/:id` | **PASS** | "Log no encontrado." honesto |
| 49 | Auditoría | `/auditoria/usuarios/:id` | **PASS** | Empty honesto; `.tsx` |
| — | Huérfanas | `/bi/inventory/stock-levels` (StockManagement) | **FAIL** | **CRAShea (ErrorBoundary)** + 100% mock → ELIMINAR |
| — | Huérfanas | `/bi/inventory/risk-analysis` (InventoryRisk) | **FAIL** | 100% mock (P1-5) → ELIMINAR |
| — | Huérfanas | `/finance/profitability` (ProfitabilityAnalysis) | PASS cond. | Duplica `/profitability/dashboard` → ELIMINAR |

## 2. Totales

- **PASS**: 10 · **PASS condicional**: 12 · **FAIL**: 28 → **56% de las páginas del módulo BI no son confiables hoy**.
- Por bloque: Inventario 4/4 positivas · Pronósticos y FinReportes mayormente sanas · CxP 0/6 · Auditoría con la fabricación más grave.

## 3. Hallazgos transversales

1. **Clase dominante — métodos de service inexistentes (P0-1/P0-2 ampliados)**: 12 métodos llamados por hooks que no existen en los services (6 payables + 4 receivables + 2 financial-reports). Los endpoints BE existen y responden 200 (FASE 1). Fix mecánico por tabla de nombres.
2. **NA-DB-1**: `useDashboardStore.fetchDashboardData` setea el envelope sin `.data` → Resumen Ejecutivo en ceros. Fix 1 línea, máximo impacto.
3. **NA-DB-2**: símbolo `$` en páginas PYG (heatmap KPIs, insights de pronósticos, resumen financiero).
4. **Fabricaciones activas**: bancos (Itaú/Sudameris vs mock Santander), insights "ahorro 2%", caja $1.2M, pronóstico $742k, curvas SVG con fallback, donut 100%, KPIs de auditoría 12.450/42/188/3.120, score 50, límite 150M, trend Ene-Feb-Mar, "+12.5%", growth literales. (Regla FE-1: sin endpoint no se muestra.)
5. **RBAC FE hueco**: solo 8 de ~49 rutas BI tienen guard (DashboardRoute ×7 + discounts + profitability ×6 + auditoría ×4 por ROL). **Vendedor accede por URL a `/payables/*`, `/receivables/*` y 5 de 6 de sales-analytics** (el BE responde 403 correcto; el toast 403 solo existe en escrituras → fallo silencioso). Los RoleGuard F2VLso de `/auditoria*` siguen sin migrar a `audit:read` (decisión T18 pendiente de ejecutar).
6. **Discrepancia de profit entre módulos** (309.960/56,18% vs 289.260/52,4%): política de costo distinta (fallback 0,7 vs costo real). Requiere decisión de negocio + unificación.
7. **Fan-out T15 (BE)** infla los números de `/profitability/sellers` — backlog BE confirmado en runtime.
8. **Drifts de contrato UI↔API**: cash-flow (`summary.*` vs raíz), supplier analysis (plano vs `{stats,report,invoices}`), revenue scenarios/bandas T20 no leídas.
9. **Métricas absurdas sin redondeo**: "-77.08183888585903%", "56.17659852109613%", "+33521439.14%", "-∞", "NaN", "+-100%".
10. **P2 paginación**: stock-levels (20 filas), demanda (13), insights, top-products sales-analytics; el BE ya pagina (T9) — el FE no consume.
11. **Fallbacks demo/mock son catch-only**: con API sana no disparan (P1-1/P1-2 verificado), pero siguen empaquetados y son una trampa en prod.
12. **Botones decorativos o stubs**: ~30 affordances sin handler (o con toast "Función no implementada todavía"). Criterio FASE 3: cablear o eliminar.

## 4. Prioridades para FASE 3 (fixes)

**Ronda P0 — desbloquear páginas muertas (estimado 2-3 días)**:
1. Completar los 12 métodos faltantes en `payablesService`/`receivablesService`/`financialReportsService` contra endpoints reales (tabla de mapeo en fichas 2A/2B/2H).
2. NA-DB-1: unwrap `.data` en `useDashboardStore`.
3. Remapear `useCashFlow` y `useSupplierAnalysis` a los contratos reales; eliminar fabricaciones.
4. Quitar KPIs mock de AuditLogs + paginación real.
5. "Nueva Factura" → quitar o apuntar a ruta real.
6. Guards `PermissionGuard` en todas las rutas BI sin protección (`payables:read`, `receivables:read`, `analytics:read`, `reports:read`, `audit:read` — migrar los 4 RoleGuard).

**Ronda P1 — honestidad de datos (2-3 días)**: eliminar TODAS las fabricaciones del punto 4 · NA-DB-2 símbolo monetario · redondeos · growth reales o fuera · leak técnico InvoiceDetail · fallback demo fuera de los catch · comparativa de márgenes (pp) · unificación de política de costo (con decisión del usuario).

**Ronda P2 — pulido (2-3 días)**: paginaciones server-side pendientes · decorativos fuera · "Oct 2023" · NaN · bandas T20 en ingresos · eliminar rutas huérfanas + mocks muertos (P1-9).

## 5. Qué funciona (para no romperlo en FASE 3)

Inventario completo (4/4), Salud Inventario + Pronóstico Ventas + Demanda, Aging CxC, Libros Legales, SIFEN ×2, Descuentos, ProductProfitability, Top Products, Alerts (T5 verificado), actividad reciente, KPIs Detallado (contrato anidado), Aging CxP (datos), API completa post-FASE 1.

---

*Evidencia completa: 47 fichas en `pages/` + 63 screenshots en `screenshots/` (commit series FE `2a1cce6` → cierre). Sesión de auditoría re-ejecutable con la receta de `erp-webapp-dev-workflow` (dev-JWT + dev:api).*

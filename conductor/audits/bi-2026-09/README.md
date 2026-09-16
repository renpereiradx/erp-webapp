# Auditoría BI 2026-09 — Fichas por página (FASE 2 del plan raíz)

Estructura de la auditoría página por página del módulo "Inteligencia de Negocios"
(plan raíz: `conductor/PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md` del wrapper).

- `pages/<Grupo>-<Pagina>.md` — ficha por página según el protocolo §3 del plan
  (screenshot, trazabilidad card→endpoint, hardcode scan, tablas >10 filas,
  redirecciones, estados loading/empty/error, checklist DESIGN §10).
- `screenshots/<ruta>.png` — capturas full-page por ruta (modo API).

**Regla de sesión**: auditar siempre con `pnpm dev:api` (`.env.api`, `VITE_USE_DEMO=false`),
backend vivo en `:5050`. FASE 2 arranca solo cuando el gate de FASE 1 (backend) esté verde.

## Progreso FASE 2 (por bloques de riesgo)

| Bloque | Estado | Fichas | Commit |
|:--|:--|:--|:--|
| **2A — CxP (6 páginas)** | ✅ 2026-09-16 | `CxP-*.md` ×6 | FE `2a1cce6` |
| **2B — CxC (6 páginas)** | ✅ 2026-09-16 | `CxC-*.md` ×6 | FE `adc32fa` |
| **2C — Dashboard (5 páginas)** | ✅ 2026-09-16 | `Dashboard-*.md` ×5 | FE `9e6bd6c` |
| **2D — Sales Analytics (6 páginas)** | ✅ 2026-09-16 | `SalesAnalytics-*.md` ×6 | FE `60df285` |
| **2E — Pronósticos (5 páginas)** | ✅ 2026-09-16 | `Pronosticos-*.md` ×5 | FE `b90854a` |
| **2F — Rentabilidad (6 páginas)** | ✅ 2026-09-16 | `Rentabilidad-*.md` ×6 | FE `329fd60` |
| **2G — Inventario (4 páginas)** | ✅ 2026-09-16 | `Inventario-*.md` ×4 | FE `1fca552` |
| **2H — Reportes Financieros (7 páginas)** | ✅ 2026-09-16 | `FinReportes-*.md` ×5 (SIFEN ×2 en una ficha) | FE (este repo) |
| 2B — CxC (6) | ⏳ | | |
| 2C — Dashboard (5) | ⏳ | | |
| 2D — Sales Analytics (6) | ⏳ | | |
| 2E — Pronósticos (5) | ⏳ | | |
| 2F — Rentabilidad (6) | ⏳ | | |
| 2G — Inventario (4) | ⏳ | | |
| 2H — Reportes Financieros (8) | ⏳ | | |
| 2I — Auditoría (4) + rutas huérfanas + `SUMMARY.md` | ⏳ | | |

**Resultado 2A (veredicto por página)**: Dashboard CxP FAIL (P0-1: 2 secciones muertas +
afordancias decorativas) · Lista Maestra FAIL (P0-1: página entera en error; "Nueva Factura"
→ `/payables/new` 404) · Detalle FAIL (P0-1 + leak de mensaje técnico) · Cash Flow FAIL
(P0-6 ampliado: API 200 con datos, UI en cero por drift de contrato + bancos/insights
fabricados + 7 botones muertos) · Aging **FAIL parcial** (datos reales ✅; 3 KPIs "---" por
P0-1 + 4 botones decorativos) · Supplier Analysis FAIL (página en blanco con API sana:
destructuring contra contrato inexistente + error nunca renderizado). Transversal:
**`/payables/*` sin guard de ruta** — vendedor (VNDR01) accede por URL a 5 rutas que el BE
rechaza con 403; solo el dashboard tiene gate (y por `dashboard:read`, no `payables:read`).
Corrección al plan: la página del detalle es `InvoiceDetail.jsx`, no `PayableDetail.jsx`
(stale). RBAC BE ✅: `payables:read` 403 para VNDR01 en todos los endpoints probados.

**Resultado 2B (veredicto por página)**: Resumen FAIL (P0-2 envenena el `Promise.all` → todo
en ceros + curva SVG fabricada + chip "Sincronizado con API" falso + "-∞") · Lista Maestra
FAIL (P0-2 → vacío deshonesto; Exportar/Nuevo Cobro/Aplicar = stubs con toast "Función no
implementada todavía" — **los filtros no aplican**) · Detalle FAIL (2 métodos inexistentes;
error honesto ✅; `GET /receivables/{id}` 200 verificado) · Vencidas FAIL trivial (puro
name-mismatch `getOverdueAccounts` vs `getOverdue` — y es la ruta canónica de las alertas
T5) · Aging **PASS condicional** (datos reales coherentes al centavo; 7 filas; deudas: chip
"Oct 2023" hardcodeado, gráfico 6-meses sin fuente, buckets≠total en algunas filas) · Perfil
Crédito FAIL (base real: saldo/facturas/paginación ✅ — pero score 50 fallback vs `risk_level:
LOW` real, límite 150M literal con "80% utilizado" incoherente, barras literales "Gs. 250M",
falsa alerta >90 días con 0 reales, vencimientos "Nov 12, 2023" imposibles). Transversal 2B:
**P0-2 se amplía a 4 métodos faltantes** (`getMasterList`, `getTransactionDetail`,
`getTransactionHistory`, `getOverdueAccounts`); **doble montaje** `/receivables` (sin guard)
vs `/dashboard/receivables` (DashboardRoute) del mismo componente; vendedor accede por URL a
las rutas del grupo (patrón NA-CXP-2).

**Resultado 2C (veredicto por página)**: Resumen Ejecutivo FAIL P1-trivial (**NA-DB-1: el
store guarda el envelope sin `.data` → todas las cards de summary en Gs. 0 mientras trends/
alerts/activity reales muestran datos** — fix 1 línea, impacto máximo) · KPIs Detallado FAIL
P1 (lee bien el contrato anidado de /kpis; Índice de Salud = TODO `turnover*10`; chips
Región/Depto/Moneda con candado decorativos; 2 cards leen de summary) · Heatmap FAIL P1
(**NA-DB-2: KPIs en "$0" — símbolo dólar en sistema PYG**; grid real con Peak coherente;
selects Sucursal/Categoría sin cablear P1-4) · Alertas FAIL P1 (**"Gestionar" →
/receivables/overdue verificado en vivo = T5 funciona**; 4 botones sin handler; P0-4
/clientes no ejercitable — 0 alertas de esa categoría en dev) · Top Productos PASS
condicional (datos reales coherentes; floats crudos "-63.017946…%"; Exportar/Filtros/more_vert
decorativos). Todo el grupo gated `dashboard:read` ✅. El fallback demo P1-1 del store NO
dispara con API sana (solo en catch).

**Resultado 2D (veredicto por página)**: Dashboard Ejecutivo PASS condicional (datos reales;
payment methods "UNKNOWN 100%" mapping roto; margen float crudo "56.176…%"; growth "+0%";
MOCK_* en catch P1-2) · Insights FAIL P1 (growth/churn literales P1-3 confirmados: +12%/+5.4%/
-2.1%/13.9%/+15% con "Retención 100%" contradictoria; meta sin fuente; tablas reales sin
paginar) · TrendsVelocity FAIL P1 (heatmap grid SIN datos; "hora pico 14:00" hardcodeada P1-4;
"+5%" literal; KPIs coherentes) · Comparativa FAIL P1 (datos reales; % crudos -77.0818…%;
**margen incoherente: 37.7 vs 17.4 mostrado como "-5.0pp" cuando es +20.3pp**) · Productos y
Categorías PASS condicional (patrón de referencia; categorías suman el total exacto; floats
crudos; "+12%" literal) · Descuentos PASS condicional (úNICA con guard reports:read ✅; datos
reales; 1 fila incoherente 100.000→105.690 con "descuento 5.690"). Transversal: 5/6 rutas SIN
guard; MOCK_* presentes en 4 archivos pero con API sana los datos reales reemplazan (catch-only).

**Resultado 2E (veredicto por página)**: Dashboard Pronósticos FAIL P1 (insight
"+33521439.14%" = monto en $ pegado como %; resto real y coherente) · Salud Inventario
**PASS** (mejor pág del grupo: forecast por producto real y accionable) · Pronóstico Ventas
**PASS** (historial+proyección reales, stats honestas post-T20: confianza 6,86%, R² 0,07;
bandas T20 no mostradas) · Demanda PASS condicional (13 filas sin paginar; confianza 75%
repetida) · Ingresos FAIL P1 (3 escenarios Gs. 0 "Prob. 0%" = mapping; bandas Gs. 0 no
mapeadas; tabla mensual real). Transversal: 5 rutas sin guard; mock catch-only en el service;
"₲"/"$"/"Gs." conviven (inconsistencia de símbolo).

**Resultado 2F (veredicto por página)**: Productos **PASS** (patrón de referencia; 7 SKUs
reales) · Clientes PASS condicional (Pareto 0% placeholder) · Categorías FAIL P1 (**KPI
"Líder en Beneficio: Gs. NaN"**) · Dashboard FAIL P1 (gráfico vacío; "Faltan Cobertura…
margen adicional del 0%"; **profit del módulo (309.960/56,18%) ≠ summary global
(289.260/52,4%) = política de costo distinta (fallback 0,7)** — decisión de negocio
pendiente) · Tendencias FAIL P1 ("+-100%", pico "---", gráfico vacío, vigilancia 0%) ·
Vendedores FAIL P1 (ranking real pero inflado por fan-out T15 del BE; "OBJETIVO
CORPORATIVO: 0%"). Grupo 100% gated analytics:read ✅ (el mejor protegido).

**Resultado 2G (veredicto por página)**: Dashboard **PASS** (mejor página BI: donut real, ABC,
alertas con CTAs) · Rotación ABC PASS condicional (2.839 días = dev quirk real, falta nota) ·
Stock Levels PASS condicional (**20 filas >10 sin paginación server-side** — P2 del plan
confirmado; destino de action_url T5 ✅) · Riesgos **PASS** (dead stock real post-T13; menor:
reorden Gs. 0 con 2 SKUs). Único grupo .tsx completo ✅; endpoints resucitados T13/T16
verificados con datos en vivo.

**Resultado 2H (7 páginas en sidebar; el plan decía 8 — conteo stale)**: Resumen Financiero
FAIL P1 (**"Posición de Caja $1.2M" = monto del mock Santander; "Pronóstico $742k
Powered by Predictive BI" fabricado; badge "Sincronizado Hace 4m" falso**) · Gestión IVA
FAIL P0-trivial (**hook llama `getVat`/`getTaxSummary` inexistentes** — el service define
`getVATReport`; API 200 con IVA legal post-T11 invisible para el usuario) · Cash Flow
Analítico PASS cond (real, "Fuente: API" honesto; saldo final incoherente 124.860 ignora
entradas) · PyG PASS cond (real post-BC-5; sin líneas de gastos operativos) · Libros Legales
**PASS** (patrón referencia intacto) · SIFEN Inutilización + Ops **PASS** (estados vacíos
honestos, sin cert = "Sin configurar" correcto). Transversal: 5/7 rutas sin guard.

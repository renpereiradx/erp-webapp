# Dashboard — KPIs y Rendimiento (`/dashboard/kpis`)

**Fecha**: 2026-09-16 · FASE 2C · Rol: admin consolidado (gated `dashboard:read` ✅) · Modo API, BE FASE 1.

**Archivo**: `src/pages/DetailedKPIs.jsx` · **Store**: `useDashboardStore.fetchKPIData` — el código **documenta el drift en un comentario**: "the API returns KPIData[] while the state models DashboardKPIs (contract drift pending BI unification)" (useDashboardStore.ts:185-186).

## 1. Screenshot

- `../screenshots/dashboard/kpis-admin.png`

## 2. Trazabilidad card → endpoint

`GET /dashboard/kpis` real (anidado): `sales_kpis.average_ticket 68.970` ✅ mostrado; `financial_kpis.gross_margin 43,26%` ✅ / `net_margin 42,68%` ✅ / `operating_expense_ratio 0,58%` ✅; `inventory_kpis.turnover_rate 0,0137 → "0,01x"` y `days_of_inventory 2192,78` ✅ **reales** (quirk de dev DB: poco ventas del período vs valuación de inventario — el número es correcto, el dato dev es chico); `customer_kpis.new_customers 0` ✅ real-0; `conversion_rate 0` ✅ real-0.

| Card | Fuente | Runtime |
|:--|:--|:--|
| Ingresos Totales Gs. 0 | **no está en el contrato de /kpis** (vive en summary — NA-DB-1) | ❌ 0 |
| Valor Inventario Gs. 0 | ídem | ❌ 0 (+ badge "⚠ Exceso Stock" decorativo) |
| Clientes Nuevos 0 | `customer_kpis.new_customers` | ✅ 0 real |
| Índice de Salud 0,14% | **TODO** `turnoverRate*10` (P1-8, confirmado en código) | ❌ métrica inventada |
| Total SKUs Activos 0 | no existe en el contrato | ❌ 0 |

## 3. Comprensión de usuario

- "Días de Inventario: 2.192,78 días" sin contexto asusta (≈6 años) — es real pero necesita nota de rango/período.
- "Índice de Salud 0,14%" = fórmula placeholder con nombre oficial — el peor tipo de hardcode (parece KPI seria).
- Chips "Región: Global 🔒 / Depto: Todos 🔒 / Moneda: PYG 🔒" — **filtros bloqueados decorativos** (P1-8 confirmado en vivo).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Select Período | ✅ cableado (refetch) |
| Chips Región/Depto/Moneda | ❌ decorativos con candado |
| "Compartir" / "Exportar Informe" | ❌ sin efecto (no probados en vivo; clase P1-8 — mismo header que otros) |
| "Limpiar filtros" | sin filtros activos que limpiar (decorativo) |
| "Ver Todo" (Alertas) | → `/dashboard/alerts` ✅ (código) |

## 5. Hardcode scan

- Índice de Salud = TODO formula; badge "Exceso Stock" literal; chips de filtros falsos.

## 6. Tabla

- No aplica (cards).

## 7. Redirecciones

- "Ver Todo" → alerts ✅.

## 8. Estados de datos (DESIGN §6.7)

- "Tendencia no disponible" ×3: **estado honesto** ✅ (el endpoint no da trend) — bien manejado.

## 9. DESIGN.md §10

- Cards consistentes; el candado-decorativo es anti-patrón.

## 10. AGENTS.md

- `.jsx` legacy; i18n parcial.

## Veredicto

**FAIL (P1)** — Lo que el contrato trae, se muestra bien (ticket, márgenes, rotación real-dev). Lo que falta: 2 cards leen de summary (NA-DB-1), Índice de Salud inventado, 3 chips falsos, SKUs 0 sin fuente.

**Fixes (FASE 3)**: Ingresos/Valor Inventario ← summary (tras NA-DB-1) o fuera · Índice de Salud: fórmula real o fuera · quitar chips candado y "Limpiar filtros" · badge Exceso Stock ← `stockout_rate` real.

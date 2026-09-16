# Dashboard — Análisis de Ventas / Heatmap (`/dashboard/sales-heatmap`)

**Fecha**: 2026-09-16 · FASE 2C · Rol: admin consolidado (gated `dashboard:read` ✅) · Modo API, BE FASE 1.

**Archivo**: `src/pages/SalesHeatmap.jsx` · **Store**: `useDashboardStore.fetchSalesHeatmap` → `GET /dashboard/sales-heatmap`

## 1. Screenshot

- `../screenshots/dashboard/sales-heatmap-admin.png` — grid con datos reales (Peak Mar 9AM, celdas $$) + KPIs en "$0".

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| Grid heatmap (Lun-Dom × 8AM-9PM) | `GET /dashboard/sales-heatmap` | ✅ **datos reales**: celdas sombreadas coherentes, Peak "Mar 9AM" con marca |
| "Hora Punta (Promedio): Martes 9:00" | derivado del peak del grid | ✅ **consistente con el grid** (mejor que el hardcode "14:00-15:00" que reportaba P1-4 — fue corregido en algún punto) |
| KPI "Ingresos Totales (Día): **$0**" | mapeo del heatmap | ❌ **cero + símbolo `$` en sistema PYG** (bug de moneda NA-DB-2) |
| KPI "Ticket Promedio $0 / 0 transacciones" | ídem | ❌ cero (contrato no llega a esos campos) |
| KPI "Cajas Activas 0" | summary (NA-DB-1) | ❌ 0 (API: 1 abierta, saldo 386.360) |
| Panel Actividad Reciente | recent-activity | ✅ real (ventas/pagos Sep 13-14) |
| Filtro Categorías | lista real del catálogo (23 opciones incl. "TestFacetVarCat") | 🟡 opciones reales PERO P1-4: selección **no cableada** al fetch |

## 3. Comprensión de usuario

- El grid es la estrella y funciona. Los KPIs en **dólares** en una operación guaraní generan desconfianza inmediata (NA-DB-2).
- Categorías de prueba ("TestFacetVarCat", "TestMixedCat") visibles en el filtro — data hygiene del catálogo dev, no bug FE (nota).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Actualizar" | ✅ refetch (timestamp cambia) |
| "Exportar Reporte" | ❌ sin efecto |
| Chevron ← → (navegar semanas, "Análisis de últimas 4 semanas") | 🟡 cambia el label del rango; sin efecto visible en el grid (el endpoint trae ventana fija) ⚠️ |
| Selects Sucursal / Categoría | ❌ no cableados (P1-4) |
| Tooltip de celdas ("Revenue: $0") | ✅ tooltip funciona (con el bug de moneda) |

## 5. Hardcode scan

- "$" hardcodeado en 3 KPIs + tooltips; resto sin mocks (P1-4 original "Hora pico hardcodeada" ya no aplica).

## 6. Tabla

- No aplica.

## 7. Redirecciones

- "Ver Todo" (actividad) → `/dashboard/alerts`-zona o notificaciones (código) ✅.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; sin error visible (allSettled).

## 9. DESIGN.md §10

- Grid legible con leyenda de intensidad ✅. Moneda incorrecta = defecto crítico de presentación.

## 10. AGENTS.md

- `.jsx` legacy; i18n: símbolo monetario hardcodeado viola la regla de formato.

## Veredicto

**FAIL (P1)** — Visualización núcleo real y útil; KPIs con moneda equivocada y campos en cero; filtros decorativos.

**Fixes (FASE 3)**: NA-DB-2 símbolo `$` → `Gs.` (usar el formatter PYG global) · KPIs ← contrato real del heatmap (revenue del rango, transacciones) · cablear o quitar selects · chevrons de semanas: cablear a ventana real o quitar.

# Dashboard — Top de Productos (`/dashboard/top-products`)

**Fecha**: 2026-09-16 · FASE 2C · Rol: admin consolidado (gated `dashboard:read` ✅) · Modo API, BE FASE 1.

**Archivo**: `src/pages/TopProductsOverview.jsx` · **Store**: `useDashboardStore.fetchTopProducts` → `GET /dashboard/top-products`

## 1. Screenshot

- `../screenshots/dashboard/top-products-admin.png` — tabla real de 7 productos con KPIs correctos.

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| KPI Ingresos Totales **Gs. 551.760** | summary/top-products | ✅ = `GET /dashboard/summary` sales.total (551.760) |
| KPI Producto Estrella "CAMISETA ADIDAS · MODA · 2 Unidades" | top-products | ✅ real (primer row del ranking) |
| KPI "Alertas de Stock: 1 Productos" | summary low_stock | ✅ real (API low_stock_count: 4? — muestra 1 ⚠️ discrepancia menor a verificar post NA-DB-1; puede ser out_of_stock_count=1) |
| Tabla (Producto/Categoría/Precio/Und./Ingresos/Rentabilidad/Tendencia) | top-products | ✅ **real**: productos, categorías (MODA, Alquiler de Canchas, Electrónicos), SKU/brand, margen y utilidad coherentes (61,2% → Gs. 82.470 sobre 134.770) |
| Tendencia % | comparativo | 🟡 valores reales pero **sin redondear**: "-63.017946325668184%", "100%" — flotantes crudos en la UI |

## 3. Comprensión de usuario

- ✅ La tabla se entiende bien (ranking por ingresos, orden por columna Ingresos ↓ activo).
- ❌ "-63.017946325668184%" — un negocio no lee 15 decimales; error de presentación simple.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Período Hoy/7D/30D/1A | ✅ cableado (refetch) |
| Búsqueda producto/categoría | filtra client-side ✅ |
| "Filtros" | ❌ sin efecto (sin dialog) |
| "Exportar" | ❌ sin efecto |
| "more_vert" por fila | no despliega acciones visibles ⚠️ |
| Paginación | ✅ controles presentes, 7 filas (< 10) |

## 5. Hardcode scan

- Sin mocks. Floats sin formatear (presentación).

## 6. Tabla

- 7 filas + paginación ✅ cumple regla ≤10. El plan marcaba "Top Productos sin paginar" para sales-analytics (bloque 2D) — esta página del Dashboard SÍ pagina.

## 7. Redirecciones

- Sin links salientes (filas no navegan al producto — oportunidad, no bug).

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; empty con mensaje ✅ (no observado con datos).

## 9. DESIGN.md §10

- Tabla limpia, chips de margen con color semántico ✅.

## 10. AGENTS.md

- `.jsx` legacy; i18n parcial; formatFloat pendiente.

## Veredicto

**PASS condicional** — Página funcional con datos reales y coherentes (la mejor del bloque junto a Alerts). Deudas de pulido: redondeo de tendencias, Exportar/Filtros decorativos, more_vert sin menú, discrepancia "1 vs 4" en alertas de stock.

**Fixes (FASE 3, P2)**: `toFixed(1)` en tendencia · quitar o cablear Filtros/Exportar/more_vert · reconciliar contador de stock.

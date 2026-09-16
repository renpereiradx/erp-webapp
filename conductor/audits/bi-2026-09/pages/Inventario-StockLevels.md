# Inventario — Niveles de Stock (`/inventory-analytics/stock-levels`)

**Fecha**: 2026-09-16 · FASE 2G · Rol: admin consolidado · Modo API, BE FASE 1. `.tsx` ✅

**Archivo**: `src/pages/InventoryAnalytics/StockLevelsReorder.tsx` → `GET /inventory-analytics/stock-levels` + `/reorder` (resucitados T13/T16)

## 1. Screenshot

- `../screenshots/inventory-analytics/stock-levels-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Cards "Necesidad Urgente de Reorden: 3 Productos, Gs. 3.664.000" / "Reorden Sugerida: 2, Gs. 4.445.000" | ✅ reales (con costo estimado) |
| Tabla de stock: **20 filas renderizadas** | ⚠️ **>10 sin paginación server-side** (P2 del plan confirmado: "el servicio no envía limit/page") — el endpoint soporta params |
| Filtros Todos/En Stock/Bajo Stock/Sin Stock + búsqueda | ✅ funcionales (client-side) |
| Ruta destino de las alertas T5 (`action_url` inventario → aquí) | ✅ correcta — la página destino existe y funciona |

## 3-10

- Página accionable (costo unitario, valor total, estado, acción por fila). `.tsx`.

## Veredicto

**PASS condicional** — Contenido real y útil; queda P2 de paginación server-side con el catálogo creciendo.

**Fixes (FASE 3, P2)**: enviar `page/page_size` (o limit) al endpoint + paginador + total.

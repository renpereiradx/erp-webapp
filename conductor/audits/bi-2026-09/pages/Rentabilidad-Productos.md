# Rentabilidad — Productos (`/profitability/products`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · Gated `analytics:read` ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/ProductProfitability.jsx` — **patrón de referencia del plan** (paginación server-side).

## 1. Screenshot

- `../screenshots/profitability/products-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/products` (paginado; 7 SKUs en dev):

| Sección | Runtime |
|:--|:--|
| KPIs SKUs 7 / Margen Promedio 51,08% / Profit Total 274.960 | ✅ reales |
| Tabla por SKU (unidades, ingresos, beneficio, margen, markup, desempeño) | ✅ real — Mouse Protek 98,91%/markup 9.108% (costo ínfimo real, correcto matemáticamente) |
| Búsqueda por SKU/nombre | ✅ client-side + server |
| Chips de crecimiento "0%" en KPIs | 🟡 placeholder (sin comparativo — mostrar n/d) |

## 3-10

- Página sólida, el estándar del grupo. `Exportar` decorativo 🟡. 7 filas paginadas ✅. `.jsx` (migrar en FASE 4).

## Veredicto

**PASS** — Datos reales, paginación correcta (patrón del plan). Menor: chips 0% placeholder, Exportar decorativo.

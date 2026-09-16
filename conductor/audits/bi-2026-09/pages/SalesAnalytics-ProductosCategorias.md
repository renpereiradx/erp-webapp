# Sales Analytics — Productos y Categorías (`/sales-analytics/products-categories`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/ProductsCategories.jsx` — **patrón de referencia del plan (§2.3)**: paginación server-side + filtros.

## 1. Screenshot

- `../screenshots/sales-analytics/products-categories-admin.png`

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| Ventas por Categoría (MODA 192.170 / Alquiler 110.500 / Electrónicos 105.690 / Bebidas 72.000 / Higiene 36.400 / Servicios 35.000) | `getByCategory` | ✅ **reales** — suman 551.760 = total general ✅ |
| Top Performer (CAMISETA ADIDAS, 3 uds, margen 16,69%) | ídem | ✅ |
| Productos Más Vendidos (tabla, 19 filas totales contadas con "Ver todos") | `getByProduct` | ✅ real, paginada |
| Bajo Rendimiento (tabla paralela, crecimiento "0%") | ídem | 🟡 crecimiento plano 0% en todas las filas (sin histórico para calcular — mostraría mejor "n/d") |
| Chips "+12% vs mes anterior" | **literal** (P1-3) | ❌ |
| Porcentajes por categoría crudos: "(34.82854864433812%)" | presentación | ❌ floats sin redondear en TODA la página |

## 3. Comprensión de usuario

- La mejor página del grupo: jerarquía clara, categorías que cuadran con el total, rankings útiles.
- Los floats de 14 decimales en cada fila degradan una página seria.

## 4. Afordancias probadas (runtime)

- Período hoy/semana/mes/año ✅. "Exportar" ❌ sin efecto. "Ver todos"/"Ver Reporte Completo" sin destino observado 🟡.

## 5. Hardcode scan

- "+12%" literal; resto limpio.

## 6. Tabla

- Paginada ✅ (patrón bueno del plan — se mantiene).

## 7. Redirecciones

- "Ver Reporte Completo" sin efecto observado ⚠️.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; tablas con datos reales.

## 9. DESIGN.md §10

- La página mejor acabada del grupo ✅.

## 10. AGENTS.md

- `.jsx` legacy; sin i18n; formato de % pendiente.

## Veredicto

**PASS condicional** — Contenido real, coherente y bien paginado. Pulido: redondeo de %, "+12%" literal, crecimiento 0% plano, botones sin efecto.

**Fixes (FASE 3, P2)**: formatear % · growth real o fuera · crecimiento "n/d" cuando no haya base.

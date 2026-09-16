# CxP — Reporte de Antigüedad (`/payables/aging-report`)

**Fecha**: 2026-09-16 · FASE 2A · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/PayablesAgingReport.jsx` · **Hook**: `usePayables` (`fetchAgingReport` ✅ existe + `fetchAgingSummary` ❌ inexistente) · **Service**: `payablesService.getAgingReport` → `GET /payables/aging/report` ✅; `getAgingSummary` → `GET /payables/aging/summary` (endpoint existe, método FE no — P0-1)

## 1. Screenshot

- `../screenshots/payables/aging-report-admin.png` — distribución y tabla con datos reales; KPIs DPO/% Vencida/Riesgo en "---".

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | ¿Existe? | Runtime |
|:--|:--|:--|:--|:--|
| Distribución Global por Vencimiento (barras + buckets) | `fetchAgingReport` → `getAgingReport` | `GET /payables/aging/report` | ✅ | ✅ **datos reales y consistentes**: 0,02% / 45,27% / 0% / 54,71% — idénticos al overview y al API (Deuda Total Gs. 6.014.250) |
| Tabla "Desglose Analítico por Proveedor" | ídem | ídem | ✅ | ✅ 4 proveedores (BodyTech 3.009.450 / TEST SUPPLIER 2.903.800 / Protek PRO 500.000 / CodeDynamic 1.000) + fila TOTALES que cuadra |
| KPI "DPO (Días Promedio de Pago)" | `fetchAgingSummary` → `getAgingSummary` | `GET /payables/aging/summary` | ❌ método FE inexistente (P0-1) | ❌ "**---**" + mini-gráfico decorativo debajo |
| KPI "% de Deuda Vencida" | ídem | ídem | ❌ | ❌ "---" + badge "ALTO" decorativo (sin número que lo respalde) |
| KPI "Monto en Riesgo Crítico" | ídem | ídem | ❌ | ❌ "---" (el chip "4 PROVEEDORES" sí se computa de la tabla) |
| "Corte al: 16 de septiembre de 2026" | fecha del cliente | — | — | ✅ honesto (hoy) |

Nota de consistencia post-T9: los totales de la tabla son **globales** (page-invariant, `SUM() OVER()` del BE) — verificado: TOTALES = 6.014.250 = Deuda Total Consolidada.

## 3. Comprensión de usuario

- ✅ La visualización principal (distribución + desglose) se entiende sola: buckets con % y montos, riesgo por proveedor (Crítico/Moderado/Mínimo).
- ❌ Tres KPIs en "---" con badge "ALTO" fijo: el usuario ve una alerta de severidad **sin el dato** que la justificaría.
- Buckets alineados a la API (0-30 corriente, 31-60, 61-90, +90) ✅.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Filtrar" | ❌ decorativo (sin dialog, sin efecto) |
| "Excel" | ❌ decorativo (sin descarga) |
| "Imprimir" | ❌ decorativo |
| "Nuevo Pago" | ❌ decorativo (sin navegación a pagos de compras `/pagos-compras`) |
| Búsqueda "Buscar proveedor..." | filtra client-side la tabla ✅ (funcional con 4 filas) |
| Paginación de la tabla | ✅ presente; "Mostrando 4 de 4" |

## 5. Hardcode scan

- Badge "ALTO" del KPI % Deuda Vencida: **literal fijo** independiente del dato.
- Mini-gráfico de barras bajo DPO: decorativo (sin data binding).
- El resto: sin mocks.

## 6. Tabla

- 4 filas reales (< 10) con paginación server-side disponible (el endpoint `/aging/report` quedó paginado con totales globales en T9). ✅ Cumple regla. El FE hoy trae el array completo (getAgingReport sin page params ⚠️ menor — cablear page/page_size cuando crezca).

## 7. Redirecciones

- Breadcrumb → `/dashboard/payables` ✅.
- Sin links en filas (los botones por fila están vacíos/decorativos).

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅ / Error: el hook captura el fallo de `getAgingSummary` silenciosamente (los "---") ⚠️; la tabla ante error de aging/report muestra vacío (no observado — la API responde).
- La página distingue bien datos reales (tabla) de los KPIs muertos.

## 9. DESIGN.md §10

- Mejor página del bloque: jerarquía clara, buckets con chips, tabla con totales. ✅
- KPIs "---" con badges decorativos = affordancia muerta severa. ❌

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n; cálculos de `agingKpis`/`distribution` en `useMemo` dentro del componente → migrar a `domain/` en FASE 4.

## Rol vendedor (spot-check)

- **FE: sin guard** — la página renderiza completa para VNDR01; API → 403 → tabla vacía. NA-CXP-2.

## Veredicto

**FAIL (P0 parcial)** — Núcleo de la página FUNCIONA con datos reales y consistentes (única página "de datos" plenamente operativa del bloque junto a ninguna más). Los 3 KPIs de resumen caen por P0-1 (`getAgingSummary`) y 4 botones de cabecera son decorativos.

**Fixes (FASE 3)**: agregar `getAgingSummary` (GET /payables/aging/summary) para DPO/% vencida/riesgo — o computar DPO del payload existente · badge "ALTO" solo si el dato lo respalda · cablear o quitar Filtrar/Excel/Imprimir/Nuevo Pago.

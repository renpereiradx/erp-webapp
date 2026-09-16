# CxC — Reporte de Antigüedad (`/receivables/aging-report`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/AgingReport.jsx` · **Hook**: `useAgingReport.js` (getSummary/getDetailedAging/getStatistics — **los 3 existen**, aliases de overview/aging) 

## 1. Screenshot

- `../screenshots/receivables/aging-report-admin.png` — página viva con datos reales.

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| KPI Total Cartera | overview | `GET /receivables/overview` | ✅ **Gs. 1.917.772** = API (1.917.771,88 redondeado) |
| KPI Al Día + "% efectividad" | ídem | ídem | ✅ Gs. 616.380 / 80,39% = `aging_summary.current` / `collection_rate` |
| KPI Cartera Vencida | ídem | ídem | ✅ Gs. 1.301.392 = `total_overdue` |
| KPI Mora > 90 Días | aging | ídem | ✅ Gs. 645.950 |
| Tramos de Antigüedad (4 buckets) | aging | ídem | ✅ 32,14 / 18,77 / 15,41 / 33,68 % — cuadran con `aging_summary` (suman 100) |
| Desglose por Cliente (tabla) | detailed aging | `GET /receivables/aging/report` | ✅ clientes reales (RENE PEREIRA 646.722, Oscar Flores 616.380, Erika Maciel 314.600…) — **7 filas < 10** ✅ |
| Facturación vs. Cobranzas (6 meses) | ??? | **ningún endpoint** | ❌ **gráfico vacío** — no hay fuente de datos para la serie mensual |
| Chip "Oct 2023" (cabecera) | literal | — | ❌ **hardcodeado y disabled** (hoy es sep-2026) |
| "Sincronizado con API" | literal | — | ⚠️ mismo chip falso que el Resumen (acá al menos es cierto) |

## 3. Comprensión de usuario

- ✅ Los números de cartera son coherentes entre sí y con la API (única página CxC plenamente confiable).
- ⚠️ Inconsistencia de datos visible: filas cuyo **Saldo Total no cuadra con la suma de sus buckets** (Mario Rossi: 140.000 total, buckets 0+0+0+0) — probablemente facturas PENDING-no-vencidas fuera de los 4 buckets mostrados; necesita una columna "Corriente" correcta o nota.
- ❌ "Facturación vs. Cobranzas" vacío: promete una tendencia que no existe.
- ❌ Chip "Oct 2023": sugiere datos viejos.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Exportar Reporte" | 🟡 stub honesto "Función no implementada todavía" |
| "Detalles" (Tramos) | sin efecto visible ⚠️ |
| "Oct 2023" | disabled (literal) |

## 5. Hardcode scan

- "Oct 2023" literal; chip "Sincronizado con API" literal; gráfico sin fuente.

## 6. Tabla

- 7 filas (< 10 ✅). Sin controles de paginación — el endpoint `/aging/report` quedó **paginado con totales globales** en T9; adoptar page/page_size antes de que crezca la cartera (P2 preventivo).

## 7. Redirecciones

- Breadcrumb Inicio → `/dashboard` ✅, "Cuentas por Cobrar" → `/receivables` ✅.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; con datos ✅. Error no observado (API sana); el hook degrada a vacío si falla.

## 9. DESIGN.md §10

- La mejor página CxC visualmente: KPIs coherentes, dona de tramos, tabla con avatares. ✅
- Gráfico vacío y chip de mes muerto = residuos que restan confianza.

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n; agregaciones en useMemo del componente (migrar a domain/ en FASE 4).

## Rol vendedor (spot-check)

- Sin guard (patrón transversal); API → 403.

## Veredicto

**PASS condicional** — Datos reales, coherentes y bien presentados (única página CxC que funciona de punta a punta). Deudas: chip "Oct 2023", gráfico sin fuente, botón Detalles sin efecto, buckets-vs-total inconsistente en filas, paginación preventiva.

**Fixes (FASE 3, P2)**: quitar/cablear "Oct 2023" (mes real del corte) · gráfico 6-meses: fuente real (statistics/date-range) o fuera · "Detalles" cablear o quitar · paginación server-side preventiva · conciliar buckets vs saldo total.

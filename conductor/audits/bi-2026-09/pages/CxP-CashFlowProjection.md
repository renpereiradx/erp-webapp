# CxP — Proyección de Pagos y Flujo de Caja (`/payables/cash-flow`)

**Fecha**: 2026-09-16 · FASE 2A · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/CashFlowProjection.jsx` · **Hook**: `src/features/cash-flow/hooks/useCashFlow.js` · **Service**: `financialReportsService.getCashFlow` → `GET /payables/cash-flow` (existe ✅)

## 1. Screenshot

- `../screenshots/payables/cash-flow-admin.png` — KPIs en cero, gráfico vacío, insights fabricados, bancos inventados.

## 2. Trazabilidad card → endpoint

La API **sí devuelve datos reales** para `?days=30`: `expected_inflows: 616.380`, `expected_outflows: 1.000`, `net_cash_flow: 615.380`, `projection_days[30]`, `cumulative_flow`. La página muestra TODO en cero por **drift de contrato** en el mapeo (`useCashFlow.js:34-46`):

| Sección | Campo que lee el FE | Campo real de la API | Runtime |
|:--|:--|:--|:--|
| KPI Ratio de Cobertura | `cf.summary.coverage_ratio` | **no existe** (`summary` no viene) | ❌ 0 |
| KPI Flujo Neto Proyectado | `cf.summary.net_cash_flow` | `cf.net_cash_flow` (raíz) | ❌ 0 |
| KPI Total Entradas | `cf.summary.total_inflows` | `cf.expected_inflows` | ❌ 0 |
| KPI Total Salidas | `cf.summary.total_outflows` | `cf.expected_outflows` | ❌ 0 |
| Gráfico Tendencia de Flujo | `cf.daily_projection[].{inflows,outflows,balance}` | `cf.projection_days[].{inflows,outflows,net_flow}` | ❌ vacío |
| Calendario de Pagos Pendientes | `cf.upcoming_obligations[]` | **no existe en el contrato** (endpoints alternativos: `/payables/schedule`) | ❌ vacío |
| Disponibilidad en Bancos | `cf.bank_positions` | no existe | ❌ **fallback fabricado** (abajo) |
| Insights de Tesorería | `cf.insights` | no existe | ❌ **fallback fabricado** (abajo) |

**Conclusión**: la página es un caso P0-6 más grave que el previsto — no solo importa mocks: **incluso con la API respondiendo 200, ningún dato llega a la UI** por nombres de campo que nunca existieron.

## 3. Comprensión de usuario

- ❌ **"Insights de Tesorería"**: "Identificamos potencial de ahorro del 2% en facturas de proveedores críticos…" — texto fabricado presentado como análisis (P0-6/P1). El segundo insight ("Flujo de caja saludable…") es fabricado pero al menos condicional (`net_cash_flow < 0`).
- ❌ **"Disponibilidad en Bancos"**: Itaú Corporativo *8829, Sudameris Operativa *4412, Continental Gs. *0091 — **bancos inexistentes en el sistema**, montos = `total_inflows × {0.4, 0.15, 0.07}` proporciones inventadas (que hoy dan 0 por el drift). El usuario de negocio leería posiciones bancarias falsas.
- KPIs en 0 = parecen "no hay movimiento" cuando en realidad hay Gs. 615.380 proyectados. Engañoso en ambos sentidos.
- Badge "∼ RIESGO" bajo Ratio de Cobertura 0 — condicional sobre un dato roto.

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Switch 30/60/90 Días | ❌ probado "60 Días": sin cambio de datos (siguen ceros; el fetch re-dispara pero el mapping roto siempre pinta 0) |
| "Filtros" | ❌ decorativo |
| "Exportar" | ❌ decorativo |
| "Ver Facturas" (insight) | ❌ decorativo (sin navegación a `/payables/invoices`) |
| "Omitir" (insight) | ❌ decorativo (no oculta el insight) |
| "Ajustar Plan" (insight) | ❌ decorativo |
| "Sincronizar todas las cuentas" (bancos) | ❌ decorativo |

**Ninguna affordance de esta página funciona.**

## 5. Hardcode scan

- `CashFlowProjection.jsx:17` — `import { bankPositions } from '@/features/cash-flow/data/mockData'` (Santander Corporate/BBVA/HSBC con $1.2M) — **import muerto**: la variable local del hook lo sombrea en la línea 144 (por eso se ven Itaú/Sudameris y no Santander). Sigue empaquetando el mock en el bundle. P1-9.
- `useCashFlow.js:59-63` — bancos fabricados con proporciones 40/15/7%.
- `useCashFlow.js:65-84` — insights fabricados (texto fijo "ahorro del 2%").

## 6. Tabla

- Calendario de pagos: vacío hoy; diseñado sin paginación — cuando se cablee a `/payables/schedule` (que ya trae `days`), aplicar regla ≤10 filas.

## 7. Redirecciones

- Breadcrumb Finanzas/Cuentas por Pagar → `/dashboard/payables` ✅.
- Ningún otro link operativo (los insights tendrían que navegar; hoy decorativos).

## 8. Estados de datos (DESIGN §6.7)

- ❌ **No hay estado de error ni vacío**: ante datos ausentes pinta ceros + insights fabricados. El peor patrón del bloque (datos falsos > error honesto).
- Loading: spinner inicial presente ✅.

## 9. DESIGN.md §10

- Estructura visual consistente (KPI cards, gráfico recharts, tarjetas de insight). ✅
- Contenido fabricado = el anti-patrón más grave del sistema (§8 "nada hardcodeado en modo API"). ❌

## 10. AGENTS.md

- Legacy `.jsx` + hook legacy; sin i18n; `parseInt(period.replace('D',''))` — parsing frágil local.
- `console.error` en el catch del hook — error silencioso para el usuario.

## Rol vendedor (spot-check)

- **FE: sin guard** — la página renderiza para VNDR01; API → 403 (y con el mapping roto, ni siquiera se nota). NA-CXP-2.

## Veredicto

**FAIL (P0+P1)** — Candidata a la peor página del bloque: API real 200 con datos, UI 100% en cero por drift de contrato, más bancos e insights fabricados, más 7 affordances muertas. Requiere re-mapeo completo del hook contra el contrato real (`expected_inflows/outflows`, `projection_days`, `/payables/schedule` para el calendario), eliminar mockData import + bancos/insights fabricados (regla FE-1: sin endpoint, no se muestra).

**Fixes (FASE 3, ronda P0)**: remapear `useCashFlow` al contrato real · eliminar import mockData · bancos → o endpoint real o sección fuera · insights → o endpoint real o sección fuera · cablear o eliminar los 7 botones.

# Dashboard — Resumen Ejecutivo (`/dashboard`)

**Fecha**: 2026-09-16 · FASE 2C · Rol: admin consolidado (gated `dashboard:read` — vendedor bloqueado ✅) · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/Dashboard.jsx` · **Store**: `src/store/useDashboardStore.ts` (`fetchDashboardData` con `Promise.allSettled` de 8 servicios + gate por permisos persistidos)

## 1. Screenshot

- `../screenshots/dashboard/dashboard-admin.png` — KPIs en Gs. 0 con chips de crecimiento % reales, curva real, actividad reciente real.

## 2. Trazabilidad card → endpoint

**Causa raíz del bloque (hallazgo nuevo NA-DB-1)**: el store guarda el envelope SIN desenvolver — `set({ summary: summaryData })` donde `summaryData = summaryRes.value` es `{data:{...},metadata,success}` — mientras la página lee `summary?.sales?.total` (Dashboard.jsx:120-130). `summary.sales` = `undefined` → **todos los montos en 0**. Los servicios que SÍ desenvuelven (`trendsRes.value.data`, `activityRes.value.data as any).activities`) muestran datos reales — por eso la mezcla.

| Sección | Fuente | Runtime |
|:--|:--|:--|
| KPI Ventas Totales / Compras / Utilidad Neta / Transacciones | `GET /dashboard/summary` (API real: ventas 551.760, compras 262.500, profit 289.260, 8 ventas) | ❌ **Gs. 0 ×3 y 0** por NA-DB-1 |
| Chips de crecimiento (77,1% / 93,2% / 186,2% / 38,5%) | `GET /dashboard/trends` (desenvuelto bien) | ✅ % reales — **pero sobre montos 0**: semánticamente absurdos |
| Gráfico Ingresos vs Gastos | trends | ✅ curva real (10-14 Sep) |
| Inventario (Valuación 22.881.350 / bajo stock 4) | summary | ❌ Gs. 0 y "0 artículos" por NA-DB-1 |
| Caja Registradora (saldo 386.360, 1 abierta) | summary | ❌ Gs. 0 / 0 por NA-DB-1 |
| Resumen Financiero (CxC 1.917.772 + 80,4% cobrado / CxP 6.414.250) | receivables/payables overview (desenvueltos bien) | 🟡 **% reales (80,4%)** con montos mezclados — CxC monto ✅? no: `receivablesOverview` se setea desenvuelto; el monto Gs. 0 visible = la página lee `receivablesTotal` del summary roto, y el % del overview bueno |
| Alertas y Actividad Reciente | `GET /dashboard/alerts` + `GET /dashboard/recent-activity` | ✅ **reales**: Venta #SALE-1789393146-771 Oscar Flores Gs. 66.780, "13 cuentas vencidas", "1 producto sin stock" |

## 3. Comprensión de usuario

- Un resumen ejecutivo en ceros con "80,4% Cobrado" y actividad real es incoherente; el usuario no puede saber qué creer. La causa es 1 línea (NA-DB-1) — cuando se arregle, TODAS las cards cobran vida (la API está completa y correcta post-FASE 1).
- Badge "● EN VIVO" literal (decorativo).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Período Hoy/7D/30D/1A | ✅ cableado (`setPeriod` → refetch con período) |
| Click en KPI cards | ✅ navegan (`/ventas`, `/compras`…) — buenas affordances |
| "Exportar Reporte" | ❌ sin efecto (P1-8) |
| "Ver Reporte" (Resumen Financiero) | no probado en vivo (header link) — código apunta a `/dashboard/financial-summary` |
| "Ver Todas las Notificaciones" | → `/dashboard/alerts` (código) ✅ |

## 5. Hardcode scan

- "● EN VIVO" literal; fallback demo del store SOLO en error de API (P1-1 existe pero no dispara con API sana — verificado: los datos visibles reales provienen de la API).

## 6. Tabla

- Actividad reciente: lista corta ✅.

## 7. Redirecciones

- KPI cards → rutas reales ✅. Activity items → `/cobros-ventas/:id`, `/pagos-compras/:id`, `/movimientos-caja` (código, rutas existen ✅ — P3 confirmadas a nivel código).

## 8. Estados de datos (DESIGN §6.7)

- Loading skeleton ✅. Sin estado de error visible si un settlement falla (allSettled traga rechazos con `?? []`) ⚠️.

## 9. DESIGN.md §10

- Layout Fluent consistente ✅. Chips de % sobre montos 0 = contenido incoherente.

## 10. AGENTS.md

- `.jsx` legacy + store TS; gate por `hasStoredPermission` antes de llamar BI ✅ (patrón f91f7e3); i18n `t()` usado ✅ (mejor que el resto del bloque).

## Veredicto

**FAIL (P1 — fix trivial con impacto máximo)** — NA-DB-1: unwrap del envelope en `useDashboardStore.fetchDashboardData` (línea ~424, `summary: summaryData` → `summary: summaryData.data`). Con eso, 10+ cards pasan a datos reales de la API FASE 1. Chips % ya reales. Exportar/EN VIVO decorativos.

**Fixes (FASE 3, ronda P0)**: unwrap `.data` del summary (y auditar los demás set del store) · mover chips % a cards con monto coherente · quitar o cablear "Exportar Reporte" · badge EN VIVO honesto.

# CxP — Resumen Ejecutivo (`/dashboard/payables`)

**Fecha**: 2026-09-16 · **Auditor**: FASE 2A (protocolo §3 del plan raíz) · **Roles**: admin consolidado (dev-JWT `trailadm_743ec4f5`, role F2VLso, session_id=0, sin branch) + vendedor (VNDR01 spot-check) · **Modo**: `pnpm dev:api` (`VITE_USE_DEMO=false`), BE `:5050` con FASE 1 completa (5be5ef2).

**Archivo**: `src/pages/PayablesDashboard.jsx` (legacy jsx) · **Hook**: `src/hooks/usePayables.js` · **Service**: `src/services/bi/payablesService.ts`

## 1. Screenshot

- `../screenshots/dashboard/payables-admin.png` (tramo 1: KPIs + aging + calendario)
- `../screenshots/dashboard/payables-admin-2.png` (tramo 2: aging completo + proveedores)

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | ¿Existe? | Runtime |
|:--|:--|:--|:--|:--|
| KPI Total Pendiente / Vencido / Pagos Semana / Tasa | `usePayables.fetchOverview` → `getOverview` | `GET /payables/overview` | ✅ | ✅ Gs. 6.014.250 / 6.413.250 (17 facturas) / 0 / 71,87% — **cuadra 1:1 con la API** |
| Resumen de Antigüedad (Aging) | ídem (mismo payload) | ídem | ✅ | ✅ buckets 0,02% / 45,27% / 0 / 54,71% idénticos a la API |
| Calendario de Pagos | `usePayables.fetchSchedule(30)` → `getSchedule` | `GET /payables/schedule` existe en BE | ❌ **el método no existe en `payablesService.ts`** | ❌ panel **100% vacío**, sin mensaje de error (P0-1) |
| Proveedores con Mayor Deuda | `usePayables.fetchTopSuppliers(10)` → `getTopSuppliers` | `GET /payables/top-suppliers` existe en BE | ❌ método inexistente en FE | ❌ tabla vacía "Mostrando 0 de 0 proveedores" (P0-1) |

**Contrato roto raíz (P0-1)**: `usePayables.js` llama 6 métodos que `payablesService.ts` no define (`getPayables`, `getPayableById`, `getTopSuppliers`, `getSchedule`, `getAgingSummary`, `getStatistics`). El TypeError lo captura el hook → la sección muere en silencio como "vacía", **sin error visible** para las secciones del dashboard.

## 3. Comprensión de usuario

- KPIs claros (moneda Gs., etiqueta "17 facturas", subtítulos de apoyo). ✅
- Aging legible, con % del total y montos. ✅
- "Calendario de Pagos" y "Proveedores con Mayor Deuda" vacíos sin explicación: el usuario no distingue "no hay datos" de "roto". ⚠️
- "Deuda Total Gs. 6 M" — abreviación en el pie del aging vs monto completo arriba; aceptable pero ambiguo a montos mayores. ⚠️ menor

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| Botón "Exportar Informe" | ❌ **decorativo** — sin onClick efectivo: sin toast, sin fetch, sin descarga |
| Botón "Configurar Alertas" | ❌ decorativo (ídem) |
| "Ver Todo" (Calendario de Pagos) | ❌ decorativo |
| Select **Moneda** (PYG/USD) | ❌ cambia el select pero **no refetcha ni convierte** — KPIs siguen "Gs." (P1-8) |
| Select **Período** (Hoy/Semana/Mes/…) | ⚠️ **cableado pero inefectivo**: `refreshData` re-corre en `filters.period`, pero `fetchOverview` (usePayables.js:28) **ignora el parámetro** — llama `getOverview()` sin período. Siempre "mes" |
| "Filtros avanzados" | ❌ decorativo (visible en screenshot, sin handler) |
| Búsqueda (textbox) | no filtra secciones (decorativa) |

## 5. Hardcode scan

- Sin mocks en esta página; los ceros/vacíos vienen de los métodos inexistentes (P0-1), no de datos inventados.
- `handlePageChange` (PayablesDashboard.jsx:60) comenta "we simulate pagination on the 10 items we have" — paginación client-side simulada sobre top-10; hoy ni siquiera llega data.

## 6. Tabla

- Proveedores: diseñada para top-10 (≤10 filas) con paginación client-side simulada. Sin data hoy. Cuando P0-1 se arregle, el endpoint `top-suppliers` ya trae `limit` — usar ese y eliminar la paginación simulada.

## 7. Redirecciones

- Sidebar "Resumen Ejecutivo" → `/dashboard/payables` ✅ (autoreferencia)
- Sin links salientes en el cuerpo (las filas de proveedores tendrían "Acciones" — muertas hoy por falta de data).

## 8. Estados de datos (DESIGN §6.7)

- Loading: spinner inicial ✅ (observado brevemente)
- Empty: "Mostrando 0 de 0 proveedores" ✅ presente pero **deshonesto**: la causa es un error (método inexistente), no ausencia de datos. Debería mostrar ErrorState.
- Error: **ausente** — los fallos de getSchedule/getTopSuppliers no se surfacen en la página.

## 9. DESIGN.md §10 checklist

- Estructura Fluent consistente (KPI cards, panels glass). ✅
- Sin `shadow-fluent-*` obvios mal aplicados; tipografía modular OK.
- Botones primarios ("Exportar Informe") que no hacen nada = anti-patrón de affordancia muerta (§8). ❌

## 10. AGENTS.md

- Legacy `.jsx` — migración FSD/tsx pendiente (FASE 4).
- Strings hardcoded en español en el JSX (sin i18n) — deuda legacy, resolver en migración FASE 4.
- Lógica de transformación en el componente (`transformedKpis` useMemo) — aceptable mientras dure legacy; mover a `domain/` en migración.

## Rol vendedor (spot-check)

- `GET /payables/overview` con JWT VNDR01 → **403** ✅ (payables:read no otorgado a VNDR01).
- FE: `/dashboard/payables` está envuelta en `DashboardRoute` → **"Acceso Restringido (dashboard:read)"** ✅ gate correcto.
- ⚠️ El gate usa `dashboard:read`, no `payables:read` — el BE gatea el subrouter por `payables:read`; el FE usa el permiso del grupo Dashboard. Inconsistencia de catálogo (hoy el vendedor carece de ambos, pero un rol con `dashboard:read` sin `payables:read` vería la página y todos los requests en 403).

## Veredicto

**FAIL (P0)** — KPIs y aging correctos y alineados a la API post-FASE 1, pero 2 secciones muertas por P0-1 (métodos inexistentes), affordancias decorativas (Exportar/Configurar/Ver Todo/Filtros/Moneda), filtro Período cableado-que-no-viaja, y error enmascarado como vacío.

**Fixes (para FASE 3)**: completar `payablesService` (getTopSuppliers/getSchedule contra endpoints reales) · surfacir ErrorState en vez de vacío · cablear `period` en `getOverview(params)` · eliminar o implementar Exportar/Configurar Alertas/Ver Todo/USD/Filtros avanzados.

# CxC — Resumen / Dashboard (`/receivables`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado (dev-JWT trailadm) + vendedor VNDR01 · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/ReceivablesDashboard.jsx` · **Hook**: `src/features/receivables/hooks/useReceivablesDashboard.js` · **Service**: `receivablesService` (getSummary/getStatistics = aliases de `GET /receivables/overview` ✅; `getMasterList` **no existe** — P0-2)

## 1. Screenshot

- `../screenshots/receivables/dashboard-admin.png` — todo en ceros, curva de tendencia fabricada, con 17 facturas reales en la API.

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| 4 KPIs (Total Pendiente/Mora/Tasa/Días Prom.) | `getSummary()` + `getAgingSummary()` + `getStatistics()` | `GET /receivables/overview` | ❌ **Gs. 0 todo** — la causa NO es mapping (`transformSummary` mapea bien `total_pending/total_overdue/collection_rate/average_days_to_collect`) sino que `Promise.all` **muere por `getMasterList` inexistente (P0-2)** y ninguno de los 4 calls pinta |
| Tendencia de Cobranza | `statsRes.data?.collection_trend` | el overview **no tiene** `collection_trend` | ❌ **curva SVG fabricada** con fallbacks `|| 20/40/60/80` (ReceivablesDashboard.jsx:131-141) — dibuja una tendencia inventada sobre "Gs. 0" |
| Labels "-∞" | deltas con base 0 | — | ❌ cuatro "-∞" visibles (división por cero sin guard) |
| Tramos de Antigüedad | `agingRes.data` | `GET /receivables/aging/summary` | ❌ 0% / Gs. 0 ×4 (mismo envenenamiento del Promise.all) |
| Facturas Recientes | `getMasterList(...)` | `GET /receivables` (List paginado, existe) | ❌ método inexistente en el service (P0-2) — tabla "No hay facturas recientes registradas" |

**Chip "Sincronizado con API"**: literal hardcodeado — se muestra aunque nada cargue. Deshonesto.

## 3. Comprensión de usuario

- Un dashboard de cartera **todo en cero** con badge "Sincronizado" invita a creer que no hay deuda — hay Gs. 1.917.772 pendientes (15 de 17 facturas vencidas). Grave para un módulo de cobranzas.
- La curva azul de "tendencia" con datos vacíos = invención visual (peor que vacío).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Actualizar" | re-dispara fetchData → mismo fallo silencioso |
| "Últimos 30 Días" | selector de período; `fetchData` **no toma parámetro** → no viaja a la API |
| "Ver Todas" (Facturas Recientes) | → `/receivables/list` ✅ (ruta existe) |
| "Detalles" (Tramos) | sin navegación observada (sin efecto visible) ⚠️ |

## 5. Hardcode scan

- Chip "Sincronizado con API" literal; badge "Corte: 16/9/2026" (fecha cliente, honesto).
- Fallbacks de path SVG `|| 20/40/60/80` y `maxCollected = ... || [1000000]` — la curva existe aunque no haya datos.
- `-∞` sin guard de base cero.

## 6. Tabla

- Facturas Recientes: diseñada para 5 (pageSize 5) ✅. Inutilizada por P0-2.

## 7. Redirecciones

- "Ver Todas" → `/receivables/list` ✅. Filas → detalle (no verificable sin data; ruta existe).
- ⚠️ **Doble montaje**: el mismo componente vive en `/receivables` (SIN guard, línea 337) y `/dashboard/receivables` (CON DashboardRoute, línea 304). El sidebar enlaza el sin-guard.

## 8. Estados de datos (DESIGN §6.7)

- El hook setea `error: 'Error al cargar los datos del dashboard.'` pero **la página no lo renderiza** — solo ceros. Error invisible.
- Loading skeleton ✅.

## 9. DESIGN.md §10

- Layout limpio y consistente. ❌ contenido fabricado (curva) + chip de estado falso.

## 10. AGENTS.md

- Legacy `.jsx` (hook en features/receivables con FSD parcial); sin i18n; `console.warn` en el catch.

## Rol vendedor (spot-check)

- API overview → 403 esperado (`receivables:read`). **FE: `/receivables` SIN guard** — VNDR01 ve la página completa en ceros (invisible: ya era ceros para admin, el fallo RBAC queda totalmente enmascarado). El montaje alternativo `/dashboard/receivables` SÍ bloquea (dashboard:read).

## Veredicto

**FAIL (P0)** — Envenenamiento en cascada: un solo método faltante (P0-2) tumba TODO el dashboard vía Promise.all, y la página responde mostrando ceros + curva inventada + chip "Sincronizado" falso en vez de un error.

**Fixes (FASE 3)**: `getMasterList` → `GET /receivables` · `Promise.allSettled` o errores por-sección · quitar chip "Sincronizado" o ligarlo a estado real · curva de tendencia: fuente real o sección fuera · guard `-∞` · unificar montaje `/receivables` vs `/dashboard/receivables`.

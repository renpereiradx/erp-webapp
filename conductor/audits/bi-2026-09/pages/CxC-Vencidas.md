# CxC — Cuentas Vencidas (`/receivables/overdue`)

**Fecha**: 2026-09-16 · FASE 2B · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/OverdueAccounts.jsx` · **Hook**: `useOverdueAccounts.js:112` llama `getOverdueAccounts` — **no existe**; el service SÍ define `getOverdue` → `GET /receivables/overdue` (mismo destino, puro name-mismatch).

## 1. Screenshot

- `../screenshots/receivables/overdue-admin.png` — "Error en la carga — Error al cargar las cuentas vencidas." (la API devuelve 15 cuentas vencidas reales).

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | Runtime |
|:--|:--|:--|:--|
| Lista de vencidas | `getOverdueAccounts(...)` | `GET /receivables/overdue` (verificado 200 con datos: RENE PEREIRA 29.000,38…) | ❌ **name-mismatch**: hook llama un método que no existe aunque el service lo define con otro nombre |

## 3. Comprensión de usuario

- Error honesto y claro ✅ (mismo patrón bueno que CxC-Detalle).
- **Ironía**: esta es la ruta canónica de las alertas (T5: `/receivables/overdue` es el único action_url real del BE) — el botón "Ver" de una alerta de negocio aterriza en una página rota.

## 4. Afordancias probadas (runtime)

- "Reintentar" ✅ cableado (mismo fallo hasta el fix). Resto inalcanzable.

## 5. Hardcode scan

- Sin mocks ni literales.

## 6. Tabla

- El plan la marcaba "sin paginar" (P2) — no evaluable hoy; al restaurar con `getOverdue`, aplicar paginación (el endpoint acepta page/page_size, verificado).

## 7. Redirecciones

- Es destino de action_url de alertas del dashboard (T5) — la única ruta canónica viva del catálogo, rota en el destino.

## 8. Estados de datos (DESIGN §6.7)

- Error ✅ honesto. Loading ✅. Empty/contenido no alcanzables.

## 9. DESIGN.md §10

- ErrorState consistente ✅.

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n.

## Rol vendedor (spot-check)

- Sin guard (patrón transversal); API → 403.

## Veredicto

**FAIL (P0, trivial)** — Página entera caída por un nombre de método (`getOverdueAccounts` vs `getOverdue`). Fix de una línea en FASE 3; luego re-auditar paginación/filtros.

**Fixes (FASE 3)**: renombrar la llamada (o agregar alias) → re-auditar la página viva (tabla >10 filas → paginar server-side).

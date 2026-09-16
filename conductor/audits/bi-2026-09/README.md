# Auditoría BI 2026-09 — Fichas por página (FASE 2 del plan raíz)

Estructura de la auditoría página por página del módulo "Inteligencia de Negocios"
(plan raíz: `conductor/PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md` del wrapper).

- `pages/<Grupo>-<Pagina>.md` — ficha por página según el protocolo §3 del plan
  (screenshot, trazabilidad card→endpoint, hardcode scan, tablas >10 filas,
  redirecciones, estados loading/empty/error, checklist DESIGN §10).
- `screenshots/<ruta>.png` — capturas full-page por ruta (modo API).

**Regla de sesión**: auditar siempre con `pnpm dev:api` (`.env.api`, `VITE_USE_DEMO=false`),
backend vivo en `:5050`. FASE 2 arranca solo cuando el gate de FASE 1 (backend) esté verde.

## Progreso FASE 2 (por bloques de riesgo)

| Bloque | Estado | Fichas | Commit |
|:--|:--|:--|:--|
| **2A — CxP (6 páginas)** | ✅ 2026-09-16 | `CxP-*.md` ×6 | FE `2a1cce6` |
| **2B — CxC (6 páginas)** | ✅ 2026-09-16 | `CxC-*.md` ×6 | FE `adc32fa` |
| **2C — Dashboard (5 páginas)** | ✅ 2026-09-16 | `Dashboard-*.md` ×5 | FE (este repo) |
| 2B — CxC (6) | ⏳ | | |
| 2C — Dashboard (5) | ⏳ | | |
| 2D — Sales Analytics (6) | ⏳ | | |
| 2E — Pronósticos (5) | ⏳ | | |
| 2F — Rentabilidad (6) | ⏳ | | |
| 2G — Inventario (4) | ⏳ | | |
| 2H — Reportes Financieros (8) | ⏳ | | |
| 2I — Auditoría (4) + rutas huérfanas + `SUMMARY.md` | ⏳ | | |

**Resultado 2A (veredicto por página)**: Dashboard CxP FAIL (P0-1: 2 secciones muertas +
afordancias decorativas) · Lista Maestra FAIL (P0-1: página entera en error; "Nueva Factura"
→ `/payables/new` 404) · Detalle FAIL (P0-1 + leak de mensaje técnico) · Cash Flow FAIL
(P0-6 ampliado: API 200 con datos, UI en cero por drift de contrato + bancos/insights
fabricados + 7 botones muertos) · Aging **FAIL parcial** (datos reales ✅; 3 KPIs "---" por
P0-1 + 4 botones decorativos) · Supplier Analysis FAIL (página en blanco con API sana:
destructuring contra contrato inexistente + error nunca renderizado). Transversal:
**`/payables/*` sin guard de ruta** — vendedor (VNDR01) accede por URL a 5 rutas que el BE
rechaza con 403; solo el dashboard tiene gate (y por `dashboard:read`, no `payables:read`).
Corrección al plan: la página del detalle es `InvoiceDetail.jsx`, no `PayableDetail.jsx`
(stale). RBAC BE ✅: `payables:read` 403 para VNDR01 en todos los endpoints probados.

**Resultado 2B (veredicto por página)**: Resumen FAIL (P0-2 envenena el `Promise.all` → todo
en ceros + curva SVG fabricada + chip "Sincronizado con API" falso + "-∞") · Lista Maestra
FAIL (P0-2 → vacío deshonesto; Exportar/Nuevo Cobro/Aplicar = stubs con toast "Función no
implementada todavía" — **los filtros no aplican**) · Detalle FAIL (2 métodos inexistentes;
error honesto ✅; `GET /receivables/{id}` 200 verificado) · Vencidas FAIL trivial (puro
name-mismatch `getOverdueAccounts` vs `getOverdue` — y es la ruta canónica de las alertas
T5) · Aging **PASS condicional** (datos reales coherentes al centavo; 7 filas; deudas: chip
"Oct 2023" hardcodeado, gráfico 6-meses sin fuente, buckets≠total en algunas filas) · Perfil
Crédito FAIL (base real: saldo/facturas/paginación ✅ — pero score 50 fallback vs `risk_level:
LOW` real, límite 150M literal con "80% utilizado" incoherente, barras literales "Gs. 250M",
falsa alerta >90 días con 0 reales, vencimientos "Nov 12, 2023" imposibles). Transversal 2B:
**P0-2 se amplía a 4 métodos faltantes** (`getMasterList`, `getTransactionDetail`,
`getTransactionHistory`, `getOverdueAccounts`); **doble montaje** `/receivables` (sin guard)
vs `/dashboard/receivables` (DashboardRoute) del mismo componente; vendedor accede por URL a
las rutas del grupo (patrón NA-CXP-2).

**Resultado 2C (veredicto por página)**: Resumen Ejecutivo FAIL P1-trivial (**NA-DB-1: el
store guarda el envelope sin `.data` → todas las cards de summary en Gs. 0 mientras trends/
alerts/activity reales muestran datos** — fix 1 línea, impacto máximo) · KPIs Detallado FAIL
P1 (lee bien el contrato anidado de /kpis; Índice de Salud = TODO `turnover*10`; chips
Región/Depto/Moneda con candado decorativos; 2 cards leen de summary) · Heatmap FAIL P1
(**NA-DB-2: KPIs en "$0" — símbolo dólar en sistema PYG**; grid real con Peak coherente;
selects Sucursal/Categoría sin cablear P1-4) · Alertas FAIL P1 (**"Gestionar" →
/receivables/overdue verificado en vivo = T5 funciona**; 4 botones sin handler; P0-4
/clientes no ejercitable — 0 alertas de esa categoría en dev) · Top Productos PASS
condicional (datos reales coherentes; floats crudos "-63.017946…%"; Exportar/Filtros/more_vert
decorativos). Todo el grupo gated `dashboard:read` ✅. El fallback demo P1-1 del store NO
dispara con API sana (solo en catch).

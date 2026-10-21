# Registro consolidado de deuda — Rebuild BI UI (F1–F11)

**Fecha:** 2026-10-21 · **Origen:** `PLAN_REBUILD_BI_UI_FRONTEND_2026-10-17.md` §8–§19
(secciones "Pendiente / deuda declarada" de cada fase) + verificación directa en código.
**Estado:** F1–F11 integradas en `dev` y publicadas como **v1.2.0** (2026-10-21).
**Backend:** `dev` con los 5 fixes analytics + el fix de CSV de auditoría, tag `v1.2.0`.

> Este documento **no reescribe** el historial del plan: lo indexa, elimina las deudas ya
> resueltas durante las fases y prioriza lo que queda. Cada ítem tiene ID estable (`BI-Dnn`)
> para citarlo en commits y en el plan.

## 0. Baseline verificado (2026-10-21)

| Gate | Resultado |
|:--|:--|
| `npx tsc --noEmit` | 0 errores |
| `npx vitest --run` | 348 archivos / 2297 tests OK |
| `pnpm lint:design -- --base dev` | OK — "Código nuevo limpio" |
| `go test ./internal/analytics/... ./internal/platform/postgres/...` | OK |
| Anti-invención (`mock`/`Math.random`/`dummy`/claims) en superficie BI | limpio (solo `placeholder` de inputs y `vi.mock` de tests) |
| `.js`/`.jsx` en superficie BI nueva | 0 |
| Smoke final (Playwright, 2026-10-21) | 188/188 checks · 45 hojas BI · 10 subgrupos · SIFEN · buscador · CSV · 390/1440 |

## 1. Resumen por prioridad

| Prioridad | Ítems | Naturaleza |
|:--|:--|:--|
| **P0 — Cierre del hito** | 1 (resuelto) | Release v1.2.0 publicado |
| **P1 — Correcciones de bajo riesgo** | 5 | Bugs/accesibilidad ya desbloqueados; FE/BE acotados |
| **P2 — Veracidad observable** | 4 | Datos parciales y filtros; FE + BE medio |
| **P3 — Contratos del backend** | 11 | Cambios de contrato/decisiones de producto |
| **P4 — Aceptado / fuera de alcance** | 5 | Documentado; no se ejecuta |

Regla de cierre para cualquier ítem que se ejecute: tests colocados en el mismo diff,
i18n es+en si hay copy, `tsc`/`vitest`/`lint:design` (FE) y `go test`/`go vet`
(BE) en verde. Los ítems de UI se verifican además en 390/1440 px.

---

## 2. P0 — Cierre del hito

### BI-D01 · Integrar y publicar F1–F11

- **Estado:** **resuelto 2026-10-21** — release **v1.2.0** en ambos repos.
- **Ejecutado:** smoke final de pack completo (188/188 checks) → merge fast-forward de
  `feature/bi-ui-rebuild` a `dev` → gates → bump FE `package.json` a `1.2.0` → tag
  `v1.2.0` en `dev` de FE y BE → push de `dev` + tags.
- **Evidencia:** `git rev-parse v1.2.0^{commit}` = `dev` en ambos repos; tags visibles en
  `git ls-remote --tags origin`.
- **Smoke:** 45 hojas BI + 10 subgrupos, SIFEN visible, buscador con las 4 rutas, export
  CSV de auditoría (12 columnas), 390/1440 sin overflow, 0 errores de consola/página y
  0 respuestas ≥400. Los 2 404 de `/sifen/config/{PROD,TEST}` son preexistentes de Core
  (pantallas SIFEN fuera del rebuild) y degradan sin romper la página.
- **Pendiente:** `main` (snapshot de release) queda atrás; un fast-forward opcional al
  tag es decisión del owner.

---

## 3. P1 — Correcciones de bajo riesgo

### BI-D02 · CSV de auditoría rompe columnas con comas

- **Estado:** **resuelto 2026-10-21** (ver §7).
- **Evidencia previa:** `internal/platform/postgres/audit_repo.go:1340` (`logsToCSV`
  escribía `Username` y `ErrorMessage` sin quoting; un mensaje con comas corría columnas).
- **Impacto:** export real desde `/auditoria` (`useAuditExport` descarga el CSV del BE).
- **Fix aplicado:** `encoding/csv` (quota comas, comillas y saltos de línea) + test con
  fila maliciosa y parseo de vuelta.

### BI-D03 · Alerta "Presupuestos por vencer" sin "Gestionar" aunque el destino existe

- **Estado:** abierto.
- **Evidencia:** `src/features/bi-dashboard/components/AlertCard.tsx:25-29` (set de rutas
  accionables) vs. `src/App.tsx:654` (`/comercial/presupuestos` existe) y
  `business_management/internal/analytics/alert_routes.go:35-48` (catálogo canónico que
  incluye esa ruta). `src/pages/__tests__/Alerts.page.test.tsx:154-167` fija hoy que **no**
  se enlace.
- **Impacto:** una de cuatro alertas pierde su acción; el contrato BE–FE queda desalineado
  en un elemento.
- **Decisión necesaria:** enlazar (la ruta existe y la página degrada con toast si falta
  `budgets:read`) **o** mantenerla oculta y documentar el gate. Si se enlaza, evaluar
  gatear el link por `budgets:read` (hoy `AlertCard` no consume `useAuth`).
- **Esfuerzo:** S (1 componente + 1 test; gate por permiso: S-M).
- **Disposición:** **decide el owner** (UX/permiso). No se cambió el comportamiento en
  esta pasada.

### BI-D04 · Comentario obsoleto en `AlertCard`

- **Estado:** **resuelto 2026-10-21** (ver §7). El comentario decía que
  `/receivables/overdue` seguía fuera cuando F7 ya la había incorporado al set.

### BI-D05 · Ventana inicial de auditoría fija al montar

- **Estado:** abierto.
- **Evidencia:** `src/domain/audit/filters.ts:39` (`defaultAuditLogFilters(now = new Date())`)
  se evalúa al montar; una pestaña abierta más de un día conserva el rango anterior hasta
  "Limpiar".
- **Impacto:** bajo (usuario puede limpiar/refrescar); molesto en terminales que quedan
  abiertas.
- **Fix propuesto:** recalcular el default al volver a foco/visibilidad **solo si** el
  usuario no tocó el rango (rastrear `dirty`); test del hook.
- **Esfuerzo:** S.
- **Disposición:** hacer después (no bloquea).

### BI-D06 · `searchByName` de clientes/proveedores sin `AbortSignal` (deuda Core)

- **Estado:** abierto.
- **Evidencia:** `src/services/clientService.ts:43` y `src/services/supplierService.ts:60`
  no reciben signal; `src/features/relational-analytics/hooks/useEntitySearch.ts:73-75`
  descarta respuestas viejas en el cliente.
- **Impacto:** bajo (el dropdown ya evita resultados rancios); latencia/requests
  desperdiciados en tipeo rápido.
- **Fix propuesto:** propagar `signal` opcional por `clientService`/`supplierService` y
  `api.ts`, con test de cancelación. Es superficie Core compartida: no exclusiva de BI.
- **Esfuerzo:** S-M.
- **Disposición:** hacer después.

---

## 4. P2 — Veracidad observable

### BI-D07 · Dashboard de pronósticos no distingue fallo parcial de "sin datos"

- **Estado:** abierto.
- **Evidencia:** `internal/platform/postgres/analytics_forecast_repo.go:1362-1421` arma el
  dashboard con `if err == nil` por subconsulta y devuelve `nil` error; el modelo
  `models.ForecastDashboard` (`models/forecast.go:273`) no implementa `partialReporter`.
  El mecanismo genérico existe (`internal/analytics/http.go:153-190`, `PartialErrors()` en
  `models/dashboard.go:27-31`) y F2 ya lo consume con `PartialDataBanner`.
- **Impacto:** una subconsulta rota se muestra como `—`/vacío, indistinguible de "no hay
  datos". F2 ya implementó y probó el banner en `/dashboard`; se reutiliza el patrón.
- **Trabajo:** agregar `partialErrors` + `SetPartialErrors`/`PartialErrors` a
  `ForecastDashboard`, registrar el error por subconsulta en el repo, promover el banner
  en `/bi/pronosticos/dashboard` (mover `PartialDataBanner` a `src/components/ui/` o
  duplicarlo en el feature; un feature no importa de otro) + tests de modelo y página.
- **Esfuerzo:** M.
- **Disposición:** hacer (primera deuda funcional recomendada).

### BI-D08 · Dashboard de rentabilidad no distingue fallo parcial de "sin datos"

- **Estado:** abierto.
- **Evidencia:** `internal/platform/postgres/analytics_profitability_repo.go:984-1052`
  (mismo patrón `if err == nil`: KPIs, comparación, top products/customers/categories,
  trends) y `models/profitability.go:363` sin `PartialErrors()`.
- **Trabajo:** idéntico a BI-D07; conviene resolverlos en el mismo diff para no duplicar
  el banner ni el criterio.
- **Esfuerzo:** M (compartido con BI-D07).
- **Disposición:** hacer junto con BI-D07.

### BI-D09 · SEASONAL fuera de la UI

- **Estado:** abierto.
- **Evidencia:** `src/domain/forecast/constants.ts:38` (`FORECAST_UI_METHODS` sin SEASONAL)
  y `src/domain/forecast/params.ts:83-85` (deep-link degradado a LINEAR). El BE lo soporta
  pero exige ≥ 12 puntos con valores no nulos; la ventana mensual puede producir 6 y
  responder 400.
- **Opciones:** (a) prechequear puntos no nulos del historial ya cargado y ofrecerlo solo
  cuando alcanza, con refetch al elegirlo; (b) relajar el método en el BE (fallback a
  LINEAR con `metadata.partial`); (c) dejarlo fuera y documentarlo.
- **Esfuerzo:** M (a/b), 0 (c).
- **Disposición:** **decide el owner** / hacer después.

### BI-D10 · Filtros de auditoría incompletos

- **Estado:** abierto.
- **Evidencia:** `src/features/audit/components/AuditFilters.tsx:47-60` — categoría y nivel
  ofrecen enum + `LEGACY`; una categoría histórica fuera de esa lista no se puede elegir.
  Acciones y tipos de entidad no son filtrables aunque el endpoint los acepta
  (`/api/v1/audit/categories|actions|entity-types`).
- **Trabajo:** consumir los catálogos del BE y agregar los dos selects (con i18n/labels
  derivados del payload, no del enum) + tests. Los catálogos no incluyen `LEGACY`: decidir
  si se agrega a mano.
- **Esfuerzo:** M.
- **Disposición:** hacer después.

---

## 5. P3 — Contratos del backend / decisiones de producto

> No son bugs de la UI nueva: la UI documenta cada límite en pantalla. Cambiarlos exige
> tocar el BE (contrato) y, en algunos casos, el frontend en el mismo diff.

| ID | Deuda | Evidencia | Disposición |
|:--|:--|:--|:--|
| **BI-D11** | Agregados relacionales #1/#2/#3 no traen `currency`; se formatean como PYG (moneda base). #4 sí la trae por fila. | `src/domain/relational-analytics/normalize.ts:75-84`; plan §11 (F3). | Aceptado; corregir si el BE expone `currency` en esos reportes. |
| **BI-D12** | Inventario pronosticado limitado a 100 productos (`LIMIT 100`); summary/conteos describen ese set, no el catálogo completo. | `internal/platform/postgres/analytics_forecast_repo.go:685` y `:1025`. | Aceptado (copy en pantalla). Cambiar exige BE + paginación del summary. |
| **BI-D13** | Rentabilidad: el costo excluye líneas sin costo registrado (su revenue sí suma) y las unidades sin conversión quedan fuera de `units_sold` → beneficio sobreestimado/unidades subestimadas. | `internal/platform/postgres/analytics_profitability_repo.go` (uso de `sdCost`, `analytics_sql.go:165-170`); plan §14.6. | **Decide el owner**; es política de costos, no UI. |
| **BI-D14** | CxP `overview.total_pending` netea sobrepagos; la UI lo compensa con el total del aging y lo documenta. | `internal/platform/postgres/analytics_payables_repo.go:119`/`:347`; plan §16.2. | Aceptado; cambiar exige repo + contrato. |
| **BI-D15** | Caja inicial del flujo = solo cajas `OPEN` (no incluye cajas cerradas ni bancos). | `internal/platform/postgres/analytics_financial_repo.go:263-285`. | Aceptado; requiere contrato de saldos. |
| **BI-D16** | Filtros SIFEN de libros legales aplican solo al libro de ventas y con rango completo (el endpoint por período no los acepta). | `src/features/financial-reports` (filtros); plan §17.6. | Aceptado. |
| **BI-D17** | Pronósticos: `demand` confianza constante por fila (75/70), `trends` nunca se completa, proyección por categoría de ingresos = copia del growth general. | `internal/platform/postgres/analytics_forecast_repo.go:788`, `:859`, `:1301-1303`. | Aceptado (no se renderiza lo que no es cálculo propio). |
| **BI-D18** | Auditoría: `sessions` y `security_events` de la ficha de usuario nunca se completan en el BE. | `internal/platform/postgres/audit_repo.go:1093` (`GetUserActivityReport` no los popula); modelo en `models/audit.go:370-372`. | Aceptado; requiere repo. |
| **BI-D19** | Inventario: los conteos de estado de stock se superponen por diseño; ABC C incluye productos sin ventas con 0 %. | SQL del BE; plan §13.6. | Aceptado (documentado en UI). |
| **BI-D20** | Pronósticos sin label "(IA)": el BE es estadístico. | Decisión de copy (§19.3). | **Decide el owner**; hoy no se usa. |
| **BI-D21** | Pronósticos y Auditoría no están en `searchableRoutes`; CxC/CxP/IVA/Libros sí. | `src/config/searchableRoutes.js:17-49`. | **Decide el owner** (producto, no deuda técnica). |

---

## 6. P4 — Aceptado / fuera de alcance

| ID | Ítem | Nota |
|:--|:--|:--|
| **BI-D22** | Endpoints no consumidos por falta de pantalla: CxC (`aging/summary`, `collection/reminders`, `high-priority`, `statistics/date-range`), CxP (`overdue`, `urgent`, `reminders*`, `statistics/date-range`, `payment-capacity`, `supplier/{id}`), Finanzas (variantes `date-range`, `profit-margins`, `tax-summary/annual`, `compare-periods`, `/vat/monthly`, `vat-prorrateo/period`), Auditoría (`summary/range`, `trends*`, `dashboard/range`, `users/top`, `entity/.../history`, catálogos). | No se agregaron métodos muertos al FE. Consumirlos exige pantalla nueva. |
| **BI-D23** | Sin comparación custom de períodos, export/impresión, selector de filas o export JSON desde la UI. | Los botones viejos eran decorativos; §5.9. |
| **BI-D24** | Sin registro de pagos a proveedor ni pantalla de movimientos de stock. | Pagos pertenecen a Compras; movimientos a Stock. |
| **BI-D25** | `/profitability/overview` y `/overview/date-range` sin handler/consumo; `OverviewWithComparison` sin handler. | El dashboard consolidado los reemplaza. |
| **BI-D26** | Deuda de calidad fuera de BI: 132 warnings de eslint legacy, 1108 hallazgos `lint:design` legacy, `.js`/`.jsx` y mocks legacy (`data/mockVariants.ts`, `services/mocks/clientMock.js`). | No se tocó: no es superficie del rebuild. |

---

## 7. Ejecutado en esta pasada (2026-10-21)

- **BI-D02** — `logsToCSV` con `encoding/csv` + `audit_repo_csv_test.go` (quoting de
  `username`, `description` y `error_message`; parseo de vuelta 12 columnas). Commit BE
  `1d24cc5`. Los encabezados se mantienen en inglés a propósito: el CSV es un artefacto
  machine-facing y localizarlo ataría el BE al locale de la UI.
- **BI-D04** — comentario de `AlertCard` corregido (F7 ya está en el set; se documenta el
  caso de `/comercial/presupuestos` como decisión pendiente, no como olvido). Commit FE
  `527e0d3`.
- **BI-D01** — smoke final 188/188 → merge ff `feature/bi-ui-rebuild` a `dev` → bump
  `package.json` 1.2.0 → tags `v1.2.0` en FE y BE → push de `dev` + tags. `main` queda
  como snapshot pendiente (decisión del owner).
- Registro consolidado (este documento) + puntero §20 en el plan.

## 8. Ya resuelto durante F1–F11 (no re-trabajar)

- `#FAC-000` fabricado en `domain/payables/dashboard.ts`: eliminado en F1.
- `searchableRoutes` BI: las notas de F3–F6 ("vacío hasta F7/F8/F9") quedaron obsoletas;
  F7/F8/F9 agregaron las 4 entradas con `requiredModule: 'bi'` + permiso real.
- Destinos de `AlertCard`: F5 (stock-levels), F6 (profitability/products) y F7
  (receivables/overdue) ya están; solo falta decidir el cuarto (BI-D03).
- Fallback demo de `biForecastingService`, `biForecastingMock.js`, `mockInventoryAnalytics.ts`
  y `mockInventoryABCData.ts`: eliminados (F1/F5/F11). `biForecastingService` ya no existe
  (F11 lo reemplazó por `forecastService`).
- `useFinancialReports.js` y `loadBiNamespace.js`: eliminados (F1).
- Notas "Falta F9/F10/F11": supersedidas por F9/F10/F11.

## 9. Orden recomendado

1. ~~**Cierre (BI-D01):**~~ **hecho** — v1.2.0 publicado en ambos repos. Queda `main`
   como snapshot opcional.
2. **Honestidad de datos (BI-D07 + BI-D08):** un solo diff BE+FE para los dos dashboards
   parciales; reutiliza el banner ya probado de F2.
3. **Decisiones cortas (BI-D03, BI-D05, BI-D09, BI-D10):** cada una es 1 sesión acotada;
   conviene resolverlas juntas para no abrir/cerrar el feature varias veces.
4. **Contratos (BI-D13 primero):** si el owner confirma que el beneficio sobreestimado es
   inaceptable, el fix de política de costos es el de mayor impacto de negocio del listado.
5. **P4:** no tocar salvo pedido explícito.

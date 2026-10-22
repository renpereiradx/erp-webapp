# Registro consolidado de deuda — Rebuild BI UI (F1–F11)

**Fecha:** 2026-10-21 · **Origen:** `PLAN_REBUILD_BI_UI_FRONTEND_2026-10-17.md` §8–§19
(secciones "Pendiente / deuda declarada" de cada fase) + verificación directa en código.
**Estado:** F1–F11 integradas en `dev` y publicadas como **v1.2.0** (2026-10-21);
cierre de deuda **BI-D03/D05/D07/D08/D09/D10** publicado como **v1.2.1** (2026-10-22).
Últimas 4 decisiones **BI-D06/D13/D20/D21** tomadas por el owner (2026-10-22, ver §3/§5.1):
**registro cerrado al 100%**. No requiere release (cambio de documentación).
**Backend:** `dev` con los 5 fixes analytics + el fix de CSV de auditoría, tag `v1.2.0`.

> Este documento **no reescribe** el historial del plan: lo indexa, elimina las deudas ya
> resueltas durante las fases y prioriza lo que queda. Cada ítem tiene ID estable (`BI-Dnn`)
> para citarlo en commits y en el plan.

## 0. Baseline verificado (2026-10-21)

| Gate | Resultado |
|:--|:--|
| `npx tsc --noEmit` | 0 errores |
| `npx vitest --run` | 350 archivos / 2310 tests OK |
| `pnpm lint:design -- --base dev` | OK — "Código nuevo limpio" |
| `go test ./internal/analytics/... ./internal/platform/postgres/...` | OK |
| Anti-invención (`mock`/`Math.random`/`dummy`/claims) en superficie BI | limpio (solo `placeholder` de inputs y `vi.mock` de tests) |
| `.js`/`.jsx` en superficie BI nueva | 0 |
| Smoke final (Playwright, 2026-10-21) | 188/188 checks · 45 hojas BI · 10 subgrupos · SIFEN · buscador · CSV · 390/1440 |
| Smoke focalizado de cierre (2026-10-21) | 12/12 · filtros acción/entity, export, banners parciales simulados, 390/1440 |

## 1. Resumen por prioridad

| Prioridad | Ítems | Naturaleza |
|:--|:--|:--|
| **P0 — Cierre del hito** | 1 (resuelto) | v1.2.0 + v1.2.1 publicados |
| **P1 — Correcciones de bajo riesgo** | 5 (5 cerrados) | D02/D03/D04/D05 resueltos; D06 cerrado por decisión (2026-10-22) |
| **P2 — Veracidad observable** | 4 (4 cerrados) | D07/D08/D10 resueltos; D09 cerrado por decisión |
| **P3 — Contratos del backend** | 11 | D13/D20/D21 decididos por el owner (2026-10-22, §5.1); resto aceptado |
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

- **Estado:** **resuelto 2026-10-21** — `/comercial/presupuestos` se agregó al set de
  rutas accionables y el test de la bandeja lo espera.
- **Decisión:** enlazar sin gate adicional. La ruta existe y **no tiene guard** en
  `App.tsx` (la entrada del sidebar sí pide `budgets:read`); la página degrada con un
  toast si el usuario no tiene el permiso. Gatear el link habría requerido meter
  `useAuth` en una tarjeta presentacional y en todos sus tests, por un caso que el router
  ya permite por URL.
- **Contrato:** el set FE ahora es espejo de `analytics.AlertActionURLs` (4 destinos).
  Cambiar uno exige el mismo diff en ambos repos.
- **Residual:** si el owner prefiere ocultar la acción a usuarios sin `budgets:read`, el
  cambio es localizado (prop de permiso en `AlertCard` + mock de AuthContext en tests).

### BI-D04 · Comentario obsoleto en `AlertCard`

- **Estado:** **resuelto 2026-10-21** (ver §7). El comentario decía que
  `/receivables/overdue` seguía fuera cuando F7 ya la había incorporado al set.

### BI-D05 · Ventana inicial de auditoría fija al montar

- **Estado:** **resuelto 2026-10-21**.
- **Fix:** `AuditLogsPage` recalcula la ventana de 30 días en `focus` de ventana y
  `visibilitychange` a visible, conservando categoría/acción/entity type/nivel/
  resultado/búsqueda. Un flag `rangeTouched` congela la ventana en cuanto el usuario
  edita Desde/Hasta; "Limpiar" lo resetea.
- **Tests:** dos casos de página con `Date` fakeado (refresca si no se tocó; no pisa un
  rango elegido).
- **Decisión:** no se agregó un `setInterval`; el evento de foco es el momento en que el
  usuario vuelve a mirar la pantalla y no genera refetch con la pestaña en background.

### BI-D06 · `searchByName` de clientes/proveedores sin `AbortSignal` (deuda Core)

- **Estado:** **cerrado por decisión 2026-10-22 — aceptado, no se ejecuta.**
- **Evidencia:** `src/services/clientService.ts:43` y `src/services/supplierService.ts:60`
  no reciben signal; `src/features/relational-analytics/hooks/useEntitySearch.ts:73-75`
  descarta respuestas viejas en el cliente.
- **Por qué se acepta:** el dropdown ya evita resultados rancios por secuencia en el
  cliente — el usuario nunca ve datos viejos. El costo restante es solo eficiencia
  (requests desperdiciados al tipear rápido). `clientService`/`supplierService` son
  superficie Core compartida que preexiste al rebuild: propagar `signal` por `api.ts`
  es riesgo en código compartido sin beneficio visible para el usuario.
- **Reabrir solo si:** se hace una pasada sistemática de cancelación (`AbortSignal`)
  en los servicios Core, fuera del alcance BI.

---

## 4. P2 — Veracidad observable

### BI-D07 · Dashboard de pronósticos no distingue fallo parcial de "sin datos"

- **Estado:** **resuelto 2026-10-21**.
- **BE:** `models.ForecastDashboard` implementa `partialErrors`/`PartialErrors()`;
  `ForecastRepo.Dashboard` registra `sales_forecast|revenue_forecast|
  inventory_forecast|demand_forecast: <error>` y `respondSuccess` lo promueve a
  `metadata.partial/partial_errors` (handler test con dashboard sano y parcial).
- **FE:** `useForecastDashboard` conserva `metadata` en el view-model y
  `/bi/pronosticos/dashboard` muestra el `PartialDataBanner` compartido
  (`components/ui/PartialDataBanner.tsx`, copia en `common.partialData.message` es/en).
- **Tests:** handler BE (2), página FE (banner con partial y ausencia con envelope sano),
  hook/dominio existentes.
- **Decisión:** el banner es genérico y no muestra `partial_errors` crudos (errores SQL);
  la señal es "sección incompleta", no el detalle técnico. El toast global de `App.tsx`
  sigue mostrando el aviso; el banner agrega el contexto de la pantalla.

### BI-D08 · Dashboard de rentabilidad no distingue fallo parcial de "sin datos"

- **Estado:** **resuelto 2026-10-21**.
- **BE:** `models.ProfitabilityDashboard` implementa el mismo contrato;
  `ProfitabilityRepo.DashboardDateRange` registra `kpis|comparison|top_products|
  top_customers|top_categories|trends: <error>`.
- **Honestidad extra:** si falla el overview de KPIs, **no se generan alertas** (antes
  los umbrales disparaban sobre KPIs en cero: "margen bruto bajo: 0.0 %"). El banner de
  parcialidad es la señal.
- **FE:** `ProfitabilityDashboardView` conserva `metadata`; banner en
  `/profitability/dashboard` con testid `profitability-partial-banner`.
- **Tests:** handler BE (1), página FE (2: banner y envelope sano).

### BI-D09 · SEASONAL fuera de la UI

- **Estado:** **cerrado por decisión 2026-10-21** — no se expone.
- **Por qué no (a) prechequeo:** el método se elige antes del fetch; ofrecerlo solo con
  ≥ 12 puntos exige una query sonda con otro método, y un deep-link `method=SEASONAL` no
  puede validarse antes de cargar datos. La disponibilidad quedaría atada a la ventana
  anterior (un cambio de historial puede volver a mandar una selección inválida).
- **Por qué no (b) relajar el BE:** un fallback a LINEAR etiquetado como "estacional"
  presenta como tal un pronóstico que no lo es; contradice la regla anti-invención.
- **Costo de mantenerlo fuera:** el BE sigue soportándolo para consumidores directos; la
  UI nunca promete un método que puede responder 400. Los tests de F11 ya fijan el
  comportamiento (selector sin SEASONAL; deep-link degradado).
- **Reabrir solo si:** aparece un prechequeo barato (p. ej. `/forecast/capacity`) o el BE
  emite `method_available` en el payload.

### BI-D10 · Filtros de auditoría incompletos

- **Estado:** **resuelto 2026-10-22**, incluyendo el residual de valores históricos.
- **BE (contrato nuevo):** `AuditRepository` suma `DistinctAuditCategories`/
  `DistinctAuditEntityTypes` (repo: `SELECT DISTINCT` branch-scoped, whitelist de columna,
  `LIMIT 500` defensivo); `AuditService` los delega. `/api/v1/audit/categories` y
  `/api/v1/audit/entity-types` aceptan `?distinct=true|1` y mergean el vocabulario del
  modelo con los valores reales de `audit_logs`, deduplicando y ordenando; el default sigue
  siendo el catálogo del modelo (compatibilidad). Un fallo del repo responde error, no una
  lista silenciosamente incompleta.
- **FE:** `AuditLogFilters` suma `action` y `entityType`; viajan a `/logs` y al export
  (`filter.action`/`filter.entity_type`, soportados por `models.AuditLogFilter`). Acción
  usa el vocabulario cerrado de `domain/audit/labels.ts` (+ `INSERT` histórico); categorías
  y tipos de entidad se piden con `?distinct=true` (`useAuditCatalogs`, `staleTime` 30 min;
  categorías degradan al vocabulario del modelo y entity types a [] si falla). El grid de
  filtros pasa a 3 columnas (6 campos, 2 filas).
- **Valores históricos verificados en vivo:** `LEGACY` (categoría), `SALE_PAYMENTS` y
  `reserves` (entity types) aparecen con `distinct=true` y son filtrables; sin el param el
  catálogo sigue siendo el del modelo.
- **Tests:** handler BE (4: default, merge, `distinct=1`/`false`, error), dominio
  (params/export/active), servicio (rutas + `distinct`), hook (catálogos y fallback),
  página (filtra por acción/entity type y por valores históricos; export).
- **Etiquetas:** los valores conocidos se traducen; los históricos se muestran con su
  código crudo (nunca una etiqueta inventada).

---

## 5. P3 — Contratos del backend / decisiones de producto

> No son bugs de la UI nueva: la UI documenta cada límite en pantalla. Cambiarlos exige
> tocar el BE (contrato) y, en algunos casos, el frontend en el mismo diff.

| ID | Deuda | Evidencia | Disposición |
|:--|:--|:--|:--|
| **BI-D11** | Agregados relacionales #1/#2/#3 no traen `currency`; se formatean como PYG (moneda base). #4 sí la trae por fila. | `src/domain/relational-analytics/normalize.ts:75-84`; plan §11 (F3). | Aceptado; corregir si el BE expone `currency` en esos reportes. |
| **BI-D12** | Inventario pronosticado limitado a 100 productos (`LIMIT 100`); summary/conteos describen ese set, no el catálogo completo. | `internal/platform/postgres/analytics_forecast_repo.go:685` y `:1025`. | Aceptado (copy en pantalla). Cambiar exige BE + paginación del summary. |
| **BI-D13** | Rentabilidad: el costo excluye líneas sin costo registrado (su revenue sí suma) y las unidades sin conversión quedan fuera de `units_sold` → beneficio sobreestimado/unidades subestimadas. | `internal/platform/postgres/analytics_profitability_repo.go` (uso de `sdCost`, `analytics_sql.go:165-170`); plan §14.6. | **Decidido 2026-10-22**: política ratificada tal como está (§5.1). |
| **BI-D14** | CxP `overview.total_pending` netea sobrepagos; la UI lo compensa con el total del aging y lo documenta. | `internal/platform/postgres/analytics_payables_repo.go:119`/`:347`; plan §16.2. | Aceptado; cambiar exige repo + contrato. |
| **BI-D15** | Caja inicial del flujo = solo cajas `OPEN` (no incluye cajas cerradas ni bancos). | `internal/platform/postgres/analytics_financial_repo.go:263-285`. | Aceptado; requiere contrato de saldos. |
| **BI-D16** | Filtros SIFEN de libros legales aplican solo al libro de ventas y con rango completo (el endpoint por período no los acepta). | `src/features/financial-reports` (filtros); plan §17.6. | Aceptado. |
| **BI-D17** | Pronósticos: `demand` confianza constante por fila (75/70), `trends` nunca se completa, proyección por categoría de ingresos = copia del growth general. | `internal/platform/postgres/analytics_forecast_repo.go:788`, `:859`, `:1301-1303`. | Aceptado (no se renderiza lo que no es cálculo propio). |
| **BI-D18** | Auditoría: `sessions` y `security_events` de la ficha de usuario nunca se completan en el BE. | `internal/platform/postgres/audit_repo.go:1093` (`GetUserActivityReport` no los popula); modelo en `models/audit.go:370-372`. | Aceptado; requiere repo. |
| **BI-D19** | Inventario: los conteos de estado de stock se superponen por diseño; ABC C incluye productos sin ventas con 0 %. | SQL del BE; plan §13.6. | Aceptado (documentado en UI). |
| **BI-D20** | Pronósticos sin label "(IA)": el BE es estadístico. | Decisión de copy (§19.3). | **Decidido 2026-10-22**: confirmado no usar "(IA)", definitivo (§5.1). |
| **BI-D21** | Pronósticos y Auditoría no están en `searchableRoutes`; CxC/CxP/IVA/Libros sí. | `src/config/searchableRoutes.js:17-49`. | **Decidido 2026-10-22**: sin cambios — Auditoría ya es buscable; Pronósticos se mantiene degradado (§5.1). |

### 5.1 Decisiones del owner (2026-10-22) — cierran D13/D20/D21

**BI-D13 — política de costo: ratificada tal como está.**

- El SQL ya la aplica como política unificada desde el cierre ① (`sdCost(alias, "")` en
  las 12 consultas de rentabilidad): las líneas sin costo registrado no suman costo, pero
  su revenue sí → el beneficio puede salir inflado por ese monto; las unidades sin
  conversión quedan fuera de `units_sold`.
- La alternativa aparente ("costo 0 en vez de excluir") es numéricamente idéntica para
  los totales (SUM salta NULL ≡ COALESCE a 0 por fila): no es una opción real.
- Alternativa verdadera descartada por ahora: beneficio solo sobre líneas costeadas +
  "ingreso sin costo" aparte — cambia todos los números principales que el cliente ya ve.
- Control operativo: que los productos tengan costo cargado (se registra con la primera
  compra). La UI ya documenta el límite en pantalla.
- **Reabrible como mejora barata:** KPI de "ingreso sin costo registrado / % del total"
  en el dashboard de rentabilidad, para que el sobreestimo sea visible y no silencioso.

**BI-D20 — label "(IA)": confirmado NO usarlo (definitivo).**

- El BE es estadístico (regresión lineal, media móvil, suavizado), no IA/ML; rotularlo
  "(IA)" promete de más, igual que decir "ERP completo" (posición de producto). La UI ya
  dice "Proyecciones estadísticas del backend" y muestra el método real en cada pantalla.
- Anotado también en el plan (§19.3 y cierre F11): confirmación del owner 2026-10-22.

**BI-D21 — buscador global: sin cambios.**

- Verificado en vivo con test desechable contra `buildSearchableItems` (2026-10-22):
  **Auditoría YA es buscable** (`/auditoria` y `/auditoria/logs` están en el índice — el
  buscador aplana todo el sidebar y "Auditoría" no califica como BI denso en
  `isDegradableBI`); **Pronósticos está indexado pero degradado** (nombres con
  "pronóstico"), igual que el resto de las ~30 hojas de analítica (ventas, compras,
  inventario, rentabilidad, dashboard BI).
- Decisión: **no se agrega nada.** Promover solo Pronósticos sería inconsistente (¿por qué
  sí pronósticos y no rentabilidad?); el palette evita saturarse con módulos densos por
  diseño (`search.ts` §isDegradableBI).
- **Reabrible:** una línea en la whitelist de `isCoreModule` (`src/layouts/main/search.ts`).
- Nota: las 4 entradas BI de `distinctSearchableRoutes` (CxC/CxP/IVA/Libros) hoy son
  no-ops — sus hrefs ya existen en el sidebar y el dedupe por href las salta. Inofensivas;
  limpieza opcional algún día.

---

## 6. P4 — Aceptado / fuera de alcance

| ID | Ítem | Nota |
|:--|:--|:--|
| **BI-D22** | Endpoints no consumidos por falta de pantalla: CxC (`aging/summary`, `collection/reminders`, `high-priority`, `statistics/date-range`), CxP (`overdue`, `urgent`, `reminders*`, `statistics/date-range`, `payment-capacity`, `supplier/{id}`), Finanzas (variantes `date-range`, `profit-margins`, `tax-summary/annual`, `compare-periods`, `/vat/monthly`, `vat-prorrateo/period`), Auditoría (`summary/range`, `trends*`, `dashboard/range`, `users/top`, `entity/.../history`, `/actions` y `/levels`; categorías y entity-types ya se consumen con `distinct=true`). | No se agregaron métodos muertos al FE. Consumirlos exige pantalla nueva. |
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
- **BI-D03** — `/comercial/presupuestos` agregado al set accionable de `AlertCard` y al
  test de la bandeja; el set FE queda espejo de `analytics.AlertActionURLs`.
- **BI-D05** — refresco de la ventana de auditoría en foco/visibilidad si el usuario no
  tocó el rango, con dos page tests.
- **BI-D07/08** — `metadata.partial` en los dashboards de pronósticos y rentabilidad
  (modelos + repos + handlers BE) y banner compartido en ambas pantallas, con tests.
- **BI-D09** — cerrado por decisión: SEASONAL se mantiene fuera de la UI (ver arriba).
- **BI-D10** — filtros de acción y tipo de entidad + export; catálogos BE con
  `?distinct=true` para categorías/entity types históricos (`LEGACY`, `SALE_PAYMENTS`),
  con tests BE/FE.
- Registro consolidado (este documento) + puntero §20 en el plan.
- **Publicación v1.2.1 (2026-10-22):** los 7 commits de cierre se mergearon/pushearon
  en `dev` de ambos repos, con tags `v1.2.1` y fast-forward de `main` al snapshot de
  release. El smoke focalizado de la release anterior (12/12) y el de catálogos
  históricos (8/8) cubren los cambios; no se repitió el smoke completo de 188 checks
  porque el código ya estaba verificado y solo cambió la versión.
- **Cierre de las últimas 4 decisiones (2026-10-22):** BI-D06 aceptado como deuda Core
  (no se ejecuta), BI-D13 política de costo ratificada, BI-D20 confirmado sin "(IA)",
  BI-D21 sin cambios con verificación en vivo del índice de búsqueda (detalles en §3 y
  §5.1). Con esto el registro queda **cerrado al 100%**: cambio de documentación sin
  release.

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

1. ~~**Cierre (BI-D01):**~~ **hecho** — v1.2.0 y v1.2.1 publicados en ambos repos;
   `main` actualizado al snapshot v1.2.1.
2. ~~**Honestidad de datos (BI-D07 + BI-D08):**~~ **hecho** — metadata.partial + banner
   compartido en pronósticos y rentabilidad.
3. ~~**Decisiones cortas (BI-D03, BI-D05, BI-D09, BI-D10):**~~ **hecho** — BI-D03/D05/
   D10 implementados; BI-D09 cerrado por decisión; BI-D06 cerrado por decisión
   (2026-10-22, aceptado como deuda Core).
4. ~~**Contratos (BI-D13 primero):**~~ **decidido 2026-10-22** — BI-D13 política de costo
   ratificada tal como está; BI-D20 sin "(IA)", definitivo; BI-D21 sin cambios (ver §5.1).
   Registro cerrado al 100%.
5. **P4:** no tocar salvo pedido explícito.

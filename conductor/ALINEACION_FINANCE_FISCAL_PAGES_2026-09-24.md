# Alineación páginas fiscales /finance — 2026-09-24

**Alcance:** `/finance/sifen-ops` (FiscalOpsDashboard), `/finance/sifen-inutilizacion`
(SkippedNumbersPage + InutilizeRangeModal), `/finance/legal-books` (LegalBooks).
Contra `DESIGN.md` (Precision Air) + `AGENTS.md` (convenciones FE).

**Gates:** tsc 0 · vitest 1127/1127 (158 files) · build ✓ · `lint:design --base HEAD` ✓
(nuevo limpio). Verificación visual en vivo con dev-JWT admin sobre :5173/:5050
(3 páginas + interacciones: tabs, selects Radix, modal de inutilización).

---

## Qué cambió por archivo

### `src/pages/LegalBooks.tsx` (NUEVO) — `LegalBooks.jsx` ELIMINADO

Migración full a TSX (regla de heavy-touch de AGENTS.md). Lógica de datos intacta
(mismo `useFinancialReports` legacy, draft-vs-applied de filtros SIFEN FE5.1,
refetch por efecto). Cambios de UI:

- `PageHeader` con breadcrumb Reportes · Cumplimiento, subtitle con origen Demo/API.
- Tabs Libro Ventas/Compras → `SegmentedControl` (ui) en `actions` del header.
- Botón "Imprimir Libro" ahora funcional (`window.print()`), único `variant="primary"`.
- **Botón "Export XLS" eliminado** (muerto desde siempre: sin onClick; precedente H7
  de la alineación BI: controles muertos se remueven). La key i18n se conserva.
- **Input deshabilitado fantasma eliminado** (label "RUC"/"Proveedor" con placeholder
  de filtro CDC — resto de un feature nunca terminado).
- Estados §6.7: skeleton a forma final (antes spinner solo), `ErrorState` con retry,
  `EmptyState` en tabla vacía (antes tabla sin filas).
- Tabla canónica `ui/table`: header `text-label-caps` sobre `bg-surface-muted`,
  montos `text-data-tabular font-data-tabular text-right` + `whitespace-nowrap`,
  fechas/CDC/RUC/factura/timbrado `text-data-mono font-data-mono`, hover 150ms.
- Selects nativos → `ui/select` (Radix); inputs → `ui/input` + `ui/label` (htmlFor).
- Cero clases `slate-*` (reemplazo 1:1 por tokens §2), sin shadow-md/lg genéricas.

Deuda anotada (NO tocada): migrar a hooks por recurso de
`features/financial-reports/hooks` — la docstring del feature ya lista LegalBooks
como consumidor pendiente del monolito deprecado; falta `useSalesLedger`/
`usePurchaseLedger` (date-range + filtros + pageSize).

### `src/features/fiscal/pages/FiscalOpsDashboard.tsx`

- `PageHeader` (breadcrumb `nav.sifenFiscalGroup`, acción Actualizar como secondary
  + timestamp `generado_en` en data-mono). Antes: `<h1>` artesanal con chip de icono.
- Loading → skeleton a forma final (franja + 4 KPIs + 2 paneles); error → `ErrorState`.
- KPI cards canónicas (`rounded-md p-lg shadow-whisper`); tono por tokens
  (`text-error/warning/primary/foreground`, fin de rojo/ámbar genéricos).
- Rechazos → tabla `ui/table` con código/cantidad/última ocurrencia en data-mono.
- Alertas y timbrados retokenizados; labels `text-label-caps`; sin `text-[10px]`.

### `src/features/fiscal/pages/SkippedNumbersPage.tsx`

- `PageHeader`; filtros con `ui/select` + `ui/label` (htmlFor); "Consultar saltos"
  único primary de la vista; "Reintentar pendientes" secondary.
- Skeletons en ambos paneles (antes spinners); `EmptyState` (instruction/search y
  vacío) en rangos e historial.
- Rangos en `text-data-mono`; metadatos del historial con valores mono.
- **Fix honestidad §6.7:** el panel de historial mostraba "Sin eventos" cuando el
  endpoint 500eaba (error tragado por el hook). `useSkippedNumbers` ahora expone
  `inutilizacionesError` + `refetchInutilizaciones` y la card renderiza `ErrorState`
  con retry. Key i18n nueva `fiscal.skipped.historyError` (es+en).

### `src/features/fiscal/components/InutilizeRangeModal.tsx`

- Tokens: `bg-slate-50`→`bg-surface-muted`, labels `text-label-caps`,
  errores `text-body-sm-bold text-error`, rango en data-mono.
- `shadow-fluent-64`/`fluent-4` (no existen en tokens) → `shadow-fluent-16` / nada.
- Botones: secundario→`variant="secondary"`, confirmación→`variant="destructive"`
  (antes bg-error artesanal) con `loading={isSubmitting}`; justificativa con
  `Label htmlFor` (a11y §11.1).
- Resumen del rango: gap corregido (labels y valores pegados) y conteo compacto.

### i18n

- `nav.sifenFiscalGroup` agregada en `shell.js` es+en (navigation.ts ya la usaba con
  fallback — bug i18n latente cerrado).
- `fiscal.skipped.historyError` en `fiscal.js` es+en.

---

## Hallazgo fuera de alcance (BACKEND, sin tocar)

**BUG crónico repo↔DB en SIFEN inutilizaciones:** `internal/platform/postgres/
sifen_repo.go` (`inutilizacionColumns`, `CreateInutilizacion`, listing) referencia la
columna `serie`, que `fiscal.inutilizaciones` **nunca tuvo** (d_est, d_pun_exp, …).
Resultado: `GET /sifen/inutilize` (listado del historial) y el INSERT de nuevos
eventos devuelven 500 en toda instancia con este schema — el panel "Inutilizaciones
recientes" nunca pudo mostrar datos. El FE ahora lo muestra como error honesto
(esta alineación), pero el fix real es vertical de backend: migración que agregue
`serie` (o alinee el repo) + smoke del endpoint. Patrón idéntico al drift del
historial de ajustes 2026-09-14 (migración 20260914125728).

## Notas de la sesión

- **Vite reiniciado** (~15:05): tras eliminar `LegalBooks.jsx` el server viejo seguía
  sirviendo el módulo cacheado `LegalBooks.jsx?t=...` y la ruta caía en ErrorBoundary
  (gotcha conocido: restart tras deletes). Relanzado detached `pnpm vite --mode api`
  → log en `/tmp/erp-vite-dev.log`.
- El flujo se verificó con dev-JWT admin (claims exactos, session_id 0) y filas
  sintéticas temporales en dev (config fiscal branch 2 timbrado 11111111 + una
  inutilización 10-12) para ejercitar rangos/modal; **eliminadas al cierre**
  (DELETE verificado, 0 filas restantes). No se ejecutó ninguna inutilización real.

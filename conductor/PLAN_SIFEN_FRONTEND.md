# PLAN — SIFEN Frontend (erp-webapp)

**Fecha:** 2026-08-18
**Alcance:** UI fiscal para SIFEN en `erp-webapp` — espejo del
[PLAN_SIFEN_FACTURACION_ELECTRONICA.md](../../business_management/conductor/PLAN_SIFEN_FACTURACION_ELECTRONICA.md)
(backend, fases S0–S7).
**Estado:** 🔄 En ejecución — FE1 ✅ (`e18b12b`), FE2 ✅ (`07af0b1`), FE3 ✅
(`9857ee0` + backend `9ee383b`), FE4 ✅ (`79cf698`, `a3558e3`, `b0a8a87`,
`e0a0adc`, `9c29444` — 2026-08-20) y FE5 ✅ (2026-08-20, `b73a5fc` +
`9bc18a4` + `571be5c`, backend `e125f1c`/`8685e9b`/`3256751`/`d3a82bb`)
completadas; S6 cerrada.
**Reglas de base:** AGENTS.md global (i18n siempre, Feature-Sliced para features nuevos,
DESIGN.md para UI, pnpm exclusivo, `tsc --noEmit` en 0 errores, tests = baseline sin nuevos fallidos).

---

## 1. Alcance y decisiones

1. **El FE nunca genera ni firma documentos fiscales.** Solo muestra estado, dispara acciones
   vía endpoints del backend y renderiza QR/KuDE recibidos. Los secretos (CSC) jamás llegan al FE.
2. Feature nueva `src/features/fiscal/` con Feature-Sliced (components/hooks/types); lógica pura
   (formato de CDC en grupos de 4, parseo de estados) en `src/domain/fiscal/` sin React.
3. La pantalla fiscal se ancla en el detalle de venta existente (`features/sales`) como panel
   complementario — no se reescribe el flujo de checkout.
4. Toda la UI usa `src/lib/i18n.js` (es-EN) y el Design System Fluent 2 de `DESIGN.md`
   (glass-mica/acrylic para modales, shadow-fluent-*).

## 2. Fases

### FE1 — Domain + tipos (acompaña FASE S1 backend) ✅ (2026-08-19, commit `e18b12b`)
1. `src/domain/fiscal/cdc.ts`: formateo de CDC en grupos de 4 (según KuDE), validación de longitud.
2. `src/domain/fiscal/states.ts`: mapeo de estados SIFEN → label i18n + color/severity
   (EMITIDO, APROBADO, APROBADO_OBS, RECHAZADO, CANCELADO, INUTILIZADO).
3. `src/features/fiscal/types/`: tipos TS del contrato `GET /sale/{id}/fiscal`.
4. Tests unitarios (Vitest) del dominio; `tsc --noEmit` 0 errores.

### FE2 — Gestión de timbrados extendida (acompaña FASE S3 backend) ✅ (2026-08-20, commit `07af0b1`)
1. Extender la gestión de config fiscal por branch existente (hoy en `features/branches`):
   columna serie (AA…ZZ), estado de activación fiscal por branch, vigencia del timbrado con
   warning de vencimiento (< 30 días), próximo número (read-only: lo asigna el backend).
   - Backend necesario (gap): `serie` + `fiscal_enabled` expuestos en el CRUD
     `GET|POST /branches/{id}/fiscal-config` / `PUT /branches/fiscal-config/{id}`
     (commit `12645ea` en business_management) — la migración S1.1 ya tenía la columna
     `serie`, pero el dominio/DTOs/repo de identity no la leían.
   - UI (BranchModal tab fiscal): input de serie normalizado (`AA..ZZ`), select de tipo
     FACTURA/NCE/NDE, vigencia desde/hasta, `next_invoice_number` read-only con formato
     de 7 dígitos (C007), badge de validez (`fiscal/validity.ts`: indefinite/ok/warning
     ≤ 30 días/expired, parse local para evitar el off-by-one UTC en zonas −03:00) y
     switch "Emisión SIFEN" → `PUT /sifen/branch/{id}/fiscal-enabled` (D3).
   - `BusinessManagementAPI.ts`: los endpoints `/sifen/*` se excluyen del header
     `X-Branch-ID` (administración global, igual que `/branches/`).
2. No exponer campos de `sifen_config` sensibles (CSC); solo lecturas de estado (ambiente,
   conectividad opcional en el dashboard de ops). → Cubierto: el FE nunca llama
   `PUT /sifen/config`; la lectura de estado del ambiente se consume en FE5.2.

### FE3 — Panel fiscal de la venta (acompaña FASE S3/S5 backend) ✅ (2026-08-20, commits `9ee383b` BE + `9857ee0` FE)
1. Panel en el detalle de venta: CDC (grupos de 4), timbrado, número, estado SIFEN con color,
   código/mensaje de rechazo legible, protocolo, fechas de firma/proceso.
   - `SaleFiscalPanel` anclado en `pages/SalesOrderDetail.tsx` (Card complementaria, sin
     reescribir el flujo); 404 de `GET /sale/{id}/fiscal` = estado "branch no fiscal" (D3).
2. QR renderizado desde la URL generada por el backend (el FE no calcula el hash).
   - Gap backend: `qr_url` (dCarQR J002) agregado a `SaleFiscalStatus`, extraído del
     `xml_de` firmado vía `sifen.QRURLFromDE`; el FE lo codifica con `qrcode.react`
     (dependencia nueva, peer warning soft con React 19 — componente compatible).
3. Acciones: reenviar (solo si RECHAZADO y dentro de ventana), reimprimir KuDE PDF,
   enviar por email (con contador de reimpresiones visible).
   - Gap backend: `POST /sale/{id}/fiscal/retry` (`EmissionService.RetryEmission`):
     solo EMITIDO/RECHAZADO, ventana 72 h (MT §6.2), mismo CDC (D2); tests unitarios
     con fake store (`retry_emission_test.go`). El botón solo se muestra en esos estados.
   - Reimprimir: `POST /documents/sales/{id}/ticket/render` (devuelve `reprint_count`,
     visible en el panel) + `GET /documents/sales/{id}/comprobante.pdf` (nueva pestaña).
   - Email: `POST /documents/sales/{id}/comprobante/email` (tolera body vacío).
4. Estados de carga/errores con feedback inmediato; skeleton acorde a DESIGN.md.

### FE4 — Cancelación e inutilización (acompaña FASE S4 backend) ✅ (2026-08-20, commits `79cf698` + `a3558e3` + `b0a8a87` + `e0a0adc` + `9c29444`)
1. Modal de cancelación con motivo obligatorio (justificativa SIFEN) y advertencia de plazos
   (48 h FE / 168 h otros) calculada con la fecha de aprobación.
   - **Fix de contrato** (`a3558e3`): `cancelSale` enviaba el motivo como query param;
     el backend lo lee del body JSON (`{"reason": ...}`) → la justificativa se perdía y el
     evento de cancelación SIFEN quedaba sin motivo. Ahora viaja en el body.
   - `CancelSaleModal` (`b0a8a87`): motivo obligatorio (≤ 500 chars), preview de impacto
     del backend, aviso legal con deadline (domain `fiscal/cancellation.ts`: 48 h FE /
     168 h NCE-NDE desde `fecha_proceso`, parse local anti-off-by-one −03:00) y badge
     dentro/fuera de plazo. El 409 del backend (fuera de plazo) se muestra tal cual
     (guía a NCE o trámite administrativo). Reemplaza el modal inline legacy de
     `SalesOrderDetail` (que tenía strings hardcoded).
2. Vista "Saltos de numeración": rangos detectados por el backend con acción de inutilización
   (rango ≤ 1000, justificativa obligatoria).
   - `SkippedNumbersPage` en `/finance/sifen-inutilizacion` (menú Reportes Financieros,
     gate `sifen:read`): selector branch/tipo/timbrado → `GET /sifen/inutilize/skipped`
     → agrupación en rangos consecutivos (domain `fiscal/ranges.ts`) → `InutilizeRangeModal`
     con justificativa obligatoria → `POST /sifen/inutilize`. Historial de eventos
     (`GET /sifen/inutilize`) con badges PENDIENTE/REGISTRADA/RECHAZADA + reintento
     de pendientes (`POST /sifen/inutilize/retry`).
3. Flujo guiado de NCE/NDE para devoluciones parciales (selección de líneas del snapshot original,
   montos con tope del DE referenciado).
   - `EmitNoteModal` desde el panel fiscal (botón "NCE / NDE" solo con FE aprobada,
     MT §11.1.3): tipo NCE/NDE, motivo E401 (1-8, domain `fiscal/notes.ts`), monto
     opcional con tope visible = total de la venta (el backend valida el disponible real:
     total original − notas vivas). `POST /sale/{id}/credit-note|debit-note`.
   - **Nota de alcance:** el backend expone monto total (no líneas del snapshot); la
     selección línea a línea queda documentada como refinable (mismo caso que E701 en S5).

### FE5 — Libros y reportes (acompaña FASE S7 backend) ✅ (2026-08-20, commits FE `b73a5fc` + `9bc18a4` + `571be5c`; BE `e125f1c` + `8685e9b` + `3256751` + `d3a82bb`)
1. `LegalBooks` (libro IVA ventas/compras): columna estado SIFEN + filtros por CDC/timbrado/estado.
   - **Backend (`8685e9b`)**: `GET /financial-reports/sales-ledger[/date-range]` enriquecido con
     `LEFT JOIN LATERAL` a `fiscal.fiscal_documents` (doc_type=1, la FE de la venta) → columnas
     reales `invoice_number` (`est-punto-numero` con LPAD 7), `timbrado`, `cdc`, `fiscal_estado`
     (el query previo devolvía `''` — el libro nunca mostró número/timbrado reales). Filtros
     opcionales `estado` (exacto), `cdc` (ILIKE parcial), `timbrado` (exacto) aplicados también al
     summary (paginación coherente); backward-compatible (sin params = respuesta idéntica).
     Compras: sin estado SIFEN (D-F5.3: no emiten DE; NRE opcional D12) — firma uniforme, filtros
     ignorados.
   - **FE (`b73a5fc`)**: `FiscalStateBadge` nuevo (`features/fiscal/components/`, mapea
     `FISCAL_STATE_META` → Badge con label i18n; fallback UNKNOWN y empty "No fiscal"), columna
     Estado SIFEN + CDC (formateado en grupos de 4 vía `domain/fiscal/cdc.ts`) solo en el tab
     Ventas, filtros con Aplicar/Limpiar (deshabilitados en Compras con nota i18n), migración de
     las strings hardcoded del `LegalBooks.jsx` legacy a `t()` (FE5.3) y `th scope`/`htmlFor` (a11y).
   - **Fix de contrato FE (`b73a5fc`)**: `financialReportsService.getSalesLedgerDateRange` /
     `getPurchaseLedgerDateRange` NO EXISTÍAN — el hook `useFinancialReports` los llamaba →
     TypeError en runtime (el libro por rango estaba roto desde siempre). Se añadieron al service
     con el contrato real del backend (`start_date/end_date/page/page_size` + filtros).
   - **Fix runtime (`d3a82bb`)**: requests al ledger sin `page_size` → `integer divide by zero` en
     `totalPages` (panic 500). `ledgerPagination` sanea (page≥1, pageSize≥50) en los 4 handlers de
     ledger + guard en el repo. Detectado en el smoke real contra :5050.
2. Dashboard de ops fiscal (admin): rechazos por código, pendientes de envío (ventana 72 h),
   extemporáneos, caducidad de timbrados — consumiendo endpoints de métricas del backend.
   - **Backend (`e125f1c`)**: `GET /sifen/metrics/overview?dias=N` (S7.2 adelantado) — puerto nuevo
     `FiscalMetricsReader` en `internal/sifen/port.go` (sin tocar god-interface), `MetricsService`
     con Clock inyectado (clasifica pendiente/extemporáneo contra la ventana de 72 h, MT §6.2;
     APROBADO_OBS = extemporáneo; timbrados por_vencer ≤ 30 días / vencidos), handler + ruta con
     permiso `sifen:read`, wiring en container. Tests unitarios con fake reader
     (`metrics_test.go`). Smoke real contra :5050 OK (shape del contrato verificado).
   - **FE (`9bc18a4`)**: `FiscalOpsDashboard` en `/finance/sifen-ops` (menú Reportes Financieros,
     `permission: 'sifen:read'`, patrón SkippedNumbersPage) — 4 KPI cards + tabla de rechazos por
     código + lista de timbrados por vencer/vencidos; `useFiscalMetrics` (React Query) +
     `fiscalService.getMetricsOverview` + types; estados loading/error/vacío; i18n es/en completo.
3. i18n completo (es/en) y revisión de accesibilidad (patrón existente con axe-core).
   - Keys nuevas: `fiscal.legalBooks.*` (FE5.1) y `fiscal.ops.*` (FE5.2) en `locales/es|en/fiscal.js`
     — sin sintaxis ICU (motor regex `{var}`).
   - A11y: `th scope="col"`, `label htmlFor` en filtros, aria-label en breadcrumb; el resto del
     patrón axe-core corre en el pipeline e2e (`pnpm test:e2e`, requiere servidor).
   - Test nuevo: `FiscalStateBadge.test.tsx` (5 casos: label i18n, UNKNOWN, empty, default).

**Verificación FE5:** `tsc --noEmit` 0 errores · `pnpm test` baseline intacto (17 files / 49
fallidos; total 404 con el test nuevo) · `pnpm build` OK · Go `go test ./internal/analytics/
./internal/sifen/...` OK + `golangci-lint` verde · smoke real contra :5050 (metrics + ledger +
filtros, panic de paginación detectado y corregido).

## 3. Checklist para retomar

1. Verificar fases backend en `_STATUS.md`; el FE acompaña (FE1↔S1, FE2↔S3, FE3↔S3/S5, FE4↔S4, FE5↔S7).
2. `pnpm test` = baseline (49 fallidos preexistentes — comparar conteo, no esperar verde).
3. `tsc --noEmit` 0 errores y `pnpm build` antes de commit.
4. Commits convencionales en inglés; actualizar encabezado de estado de este archivo.

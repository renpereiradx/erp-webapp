# PLAN_PRINTING_OPTIONAL_FRONTEND — impresión de documentos (opcional) en UI

Fecha: 2026-09-04 · Branch: `feat/documents-printing` (worktree) · Backend par:
`business_management` mismo branch (fix `/ticket/print` + docs en su `conductor/`).

## Contexto

El backend tiene el contexto `internal/documents` completo (tickets ESC/POS,
comprobante PDF/KuDE, email, admin de impresoras — ver
`business_management/conductor/PLAN_DOCUMENTS_PRINTING.md`). La auditoría
encontró dos gaps de integración y un gap de UI:

1. **Contrato roto:** `fiscalService.renderTicket()` golpeaba
   `POST .../ticket/render` (devuelve payload ESC/POS base64) pero el panel
   fiscal trataba la respuesta como print outcome (`success`/`reprint_count`,
   que solo devuelve `/ticket/print`): el botón "Reimprimir ticket" NO imprimía
   y el toast de éxito mentía.
2. **Backend:** `/ticket/print` sin `printer_id` paniqueaba (no resolvía la
   impresora default). Fixeado en el repo hermano (404 tipado + `GetDefault`).
3. **UI:** no existía administración de impresoras (los 6 endpoints de
   `/api/v1/printers` sin consumidor).

## Principio rector (pedido explícito)

**La impresión es OPCIONAL.** Ninguna UI exige una impresora configurada:
- Sin `documents:read` la acción de impresión ni se renderiza.
- Con permiso, `printConfigured` (query a `/api/v1/printers?active=true`)
  habilita/deshabilita el botón con hint i18n; nunca se golpea un 404 evitable.
- Sin impresoras registradas, el workspace muestra empty-state con acción.

## Entregas

### feat(printers) — workspace de administración
- `src/features/printers/`: `services/printersService.ts`, `hooks/usePrinters.ts`
  (react-query, patrón maestro-detalle), `components/{PrinterList,PrinterDetailForm}.tsx`,
  `types/`.
- `src/domain/printers/printerForm.ts`: Zod espejando los CHECKs del backend
  (puerto 1-65535, papel 58/80, CP858/850/437, propósito RECEIPT/KITCHEN/BAR).
- `src/pages/PrintersPage.tsx` (estados loading/empty/error según DESIGN §6.7).
- Registro: ruta `/configuracion/impresoras` con `PermissionGuard documents:read`,
  sidebar "Configuración y Sistema", card row en Settings.
- i18n: namespace `printers` en es + en.

### fix(fiscal) — impresión real y opcional
- `fiscalService.printTicket()` → `POST /ticket/print` (contrato
  `TicketPrintResult` = `PrintTicketResponse` del backend). `renderTicket`
  eliminado (endpoint payload queda para impresión client-side futura).
- `useSaleFiscalPanel`: `printConfigured` + `canUseDocuments`; la mutación de
  reimpresión llama al print real y sincroniza `reprint_count` (S6-H7).
- `SaleFiscalPanel`: botón condicionado (oculto sin permiso, deshabilitado con
  hint `fiscal.panel.noPrinter` si no hay RECEIPT activa+default).

### fix(users) — build
- `UsersTable.tsx`: `Checkbox` exige `className` según su JSDoc (tsc); pre-existente
  en HEAD, bloqueaba el gate.

## Auditoría vercel-react-best-practices (SPA — reglas server-* N/A)

- `rerender-no-inline-components`: `Field` y subcomponentes definidos a nivel módulo. ✓
- `rerender-derived-state-no-effect`: `printConfigured`/filtrado derivados en
  render/memo, sin effects; el form se re-inicializa con `key={selectedId}`. ✓
- `bundle-barrel-imports`: imports directos a archivos, sin barrel nuevo. ✓
- `rendering-conditional-render`: ternarios en condicionales de UI. ✓
- `rerender-lazy-state-init`: `useState(() => printer ? … : emptyPrinterForm())`. ✓
- Data fetching: react-query con `staleTime` (dedupe, `client-swr-dedup` equivalente). ✓

## Gates de salida

- `npx tsc --noEmit` 0 errores · `npx vitest --run` 497/497 (17 tests nuevos:
  6 service + 6 hook + 5 print opcional) · `pnpm build` ✓ · `pnpm lint:design` ✓
  ("Código nuevo limpio", rebasado sobre main 97b68d6).

## Pendientes (fuera de alcance)

- Impresión client-side (WebUSB/WebSerial) consumiendo `payload_b64` de
  `/ticket/render` — el endpoint ya está listo.
- KuDE de notas (`/api/v1/documents/notes/{cdc}/kude.pdf`) sin consumidor aún.

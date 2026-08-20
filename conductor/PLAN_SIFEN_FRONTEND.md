# PLAN — SIFEN Frontend (erp-webapp)

**Fecha:** 2026-08-18
**Alcance:** UI fiscal para SIFEN en `erp-webapp` — espejo del
[PLAN_SIFEN_FACTURACION_ELECTRONICA.md](../../business_management/conductor/PLAN_SIFEN_FACTURACION_ELECTRONICA.md)
(backend, fases S0–S7).
**Estado:** 🔄 En ejecución — FE1 ✅ (domain + tipos, commit `e18b12b`) y FE2 ✅
(gestión de timbrados extendida, commit `07af0b1`) completadas; siguiente FE3 (panel fiscal de la venta).
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

### FE3 — Panel fiscal de la venta (acompaña FASE S3/S5 backend)
1. Panel en el detalle de venta: CDC (grupos de 4), timbrado, número, estado SIFEN con color,
   código/mensaje de rechazo legible, protocolo, fechas de firma/proceso.
2. QR renderizado desde la URL generada por el backend (el FE no calcula el hash).
3. Acciones: reenviar (solo si RECHAZADO y dentro de ventana), reimprimir KuDE PDF,
   enviar por email (con contador de reimpresiones visible).
4. Estados de carga/errores con feedback inmediato; skeleton acorde a DESIGN.md.

### FE4 — Cancelación e inutilización (acompaña FASE S4 backend)
1. Modal de cancelación con motivo obligatorio (justificativa SIFEN) y advertencia de plazos
   (48 h FE / 168 h otros) calculada con la fecha de aprobación.
2. Vista "Saltos de numeración": rangos detectados por el backend con acción de inutilización
   (rango ≤ 1000, justificativa obligatoria).
3. Flujo guiado de NCE/NDE para devoluciones parciales (selección de líneas del snapshot original,
   montos con tope del DE referenciado).

### FE5 — Libros y reportes (acompaña FASE S7 backend)
1. `LegalBooks` (libro IVA ventas/compras): columna estado SIFEN + filtros por CDC/timbrado/estado.
2. Dashboard de ops fiscal (admin): rechazos por código, pendientes de envío (ventana 72 h),
   extemporáneos, caducidad de timbrados — consumiendo endpoints de métricas del backend.
3. i18n completo (es/en) y revisión de accesibilidad (patrón existente con axe-core).

## 3. Checklist para retomar

1. Verificar fases backend en `_STATUS.md`; el FE acompaña (FE1↔S1, FE2↔S3, FE3↔S3/S5, FE4↔S4, FE5↔S7).
2. `pnpm test` = baseline (49 fallidos preexistentes — comparar conteo, no esperar verde).
3. `tsc --noEmit` 0 errores y `pnpm build` antes de commit.
4. Commits convencionales en inglés; actualizar encabezado de estado de este archivo.

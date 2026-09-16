# CxP — Detalle de Factura (`/payables/detail/:id`)

**Fecha**: 2026-09-16 · FASE 2A · Rol: admin consolidado · Modo API, BE FASE 1 (5be5ef2).

**Archivo**: `src/pages/InvoiceDetail.jsx` (el plan raíz decía `PayableDetail.jsx` — **stale: ese archivo ya no existe**; el router monta `InvoiceDetail`) · **Hook**: `usePayables.fetchPayableById` · **Service**: `payablesService.getPayableById` **no existe** (P0-1)

## 1. Screenshot

- `../screenshots/payables/detail-2-admin.png` — probado con ID real `2` (Protek PRO, OVERDUE/URGENT, pendiente Gs. 500.000, verificado por API).

## 2. Trazabilidad card → endpoint

| Sección | Consumo | Endpoint BE | ¿Existe? | Runtime |
|:--|:--|:--|:--|:--|
| Página completa (header, montos, pagos, timeline) | `fetchPayableById(id)` → `getPayableById` | `GET /payables/{id}` (ByID, 404 tipado post-T6) | ❌ método inexistente en FE | ❌ **"Error de Carga — payablesService.getPayableById is not a function"** |

La API sí responde para el ID probado (smoke `GET /payables/2` → 200 con `supplier_name`, montos, `days_overdue: 281`, `status: OVERDUE`).

## 3. Comprensión de usuario

- ❌ **Leak técnico en la UI**: el mensaje de error muestra el texto crudo de la excepción JS ("payablesService.getPayableById is not a function"). Rompe la regla de mensajes entendibles (análogo FE del leak `err.Error()` que T6 eliminó en el BE).
- El botón "Reintentar" es correcto como affordance (aunque re-fallará hasta FASE 3).

## 4. Afordancias probadas (runtime)

| Afordancia | Resultado |
|:--|:--|
| "Reintentar" | re-dispara la carga → mismo error ✅ cableado |
| Resto de la página | inalcanzable hasta fix P0-1 — auditar de nuevo en FASE 3 post-fix |

## 5. Hardcode scan

- Sin mocks en la página (el error es de integración, no de fabricación).
- Nota: el hook sí renderiza el `error.message` crudo — origen del leak.

## 6. Tabla

- N/A (página no renderiza tabla hoy; el detalle incluirá tabla de pagos — re-auditar post-fix).

## 7. Redirecciones

- Entrada esperada desde la Lista Maestra (`/payables/detail/:id`) ✅ ruta registrada.
- Botón volver (no visible en error state).

## 8. Estados de datos (DESIGN §6.7)

- Error: ✅ presente, ❌ con mensaje técnico crudo (debe mapear a texto de usuario, p. ej. el `toApiError` del envelope T6 cuando exista contrato).
- Loading/Empty: no alcanzables.

## 9. DESIGN.md §10

- ErrorState centrado consistente visualmente. ✅
- Mensaje técnico = anti-patrón de copy. ❌

## 10. AGENTS.md

- Legacy `.jsx`; sin i18n; lógica en hook (aceptable legacy).

## Rol vendedor (spot-check)

- **FE: sin guard** — `/payables/detail/2` renderiza para VNDR01 (mismo "Error de Carga"); API → 403. NA-CXP-2.

## Veredicto

**FAIL (P0)** — Página muerta por P0-1 con el agravante del leak del mensaje técnico. Corrección trivial en FASE 3 (método `getPayableById` → `GET /payables/{id}`) + sanear el copy del error. **Corrección al plan raíz**: la fila del inventario 1.1 que nombra `PayableDetail.jsx` debe decir `InvoiceDetail.jsx`.

**Fixes (FASE 3)**: `getPayableById` en `payablesService` · mapear errores a mensajes de usuario (envelope `{error:{code,message}}` de T6 ya llega del BE) · re-auditar la página completa tras el fix.

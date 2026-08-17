# PLAN_WALKIN_CHECKOUT — Cobro walk-in de canchas (frontend)

Fecha: 2026-08-14
Estado: ✅ Implementado

## Problema

Cliente walk-in usó una cancha sin reserva y quiere pagar. El operador debía
salir de `/ventas`, ir a `/gestion-agenda`, crear la reserva, confirmarla,
vovler a `/ventas` vía "Facturar Servicio" y recién ahí cobrar (~8 pasos, 2
módulos). El paso `ReservationsStep` del wizard solo listaba reservas
`CONFIRMED` existentes — no permitía crear la reserva desde la venta.

## Solución

El wizard de ventas gana el panel **"Registrar uso de cancha (sin reserva)"**
dentro del paso Reservas (visible siempre que haya cliente seleccionado):

```
/ventas → wizard → cliente → Registrar uso de cancha
  (cancha + fecha + horario + duración → CREATE + CONFIRM → carrito con
   total autoritativo del backend) → Pago → Cobro → Confirmar
```

Una pantalla, ~4 clics. Si el cobro falla o se deja pendiente, la reserva
queda `CONFIRMED` y aparece como cobrable en el próximo checkout del cliente
(refleja que la cancha se usó).

### Cambios

| Archivo | Cambio |
|:--------|:-------|
| `src/domain/reservation/slotAvailability.ts` (nuevo) | Lógica pura: `isSlotBookable`, `getMaxConsecutiveDuration` (portada de `ReservationDashboard`), `getBookableSlots`. Tests en `src/__tests__/reservation-slot-availability.domain.test.ts` (11 casos) |
| `src/features/sales/components/steps/WalkInReservationForm.tsx` (nuevo) | Panel walk-in: select de cancha (`/products/service-courts`), fecha, slots del día (`getSchedulesForProductAndDate`), "Generar horarios" si el día está vacío, duración limitada por consecutivos disponibles, preview de precio estimado. Submit → `onRegisterWalkIn(spec)` |
| `src/features/sales/components/steps/ReservationsStep.tsx` | Renderiza el panel walk-in bajo la lista de reservas confirmadas; recibe `clientId`, `blockedProductIds`, `onRegisterWalkIn` |
| `src/features/sales/components/SaleCheckoutWizard.tsx` | Props nuevas; el paso Reservas aparece si hay reservas **o cliente seleccionado** |
| `src/pages/SalesNew.tsx` | `handleRegisterWalkIn`: `manageReserve(CREATE)` → `manageReserve(CONFIRM)` → CartItem (`reserve_id`, `price = total_amount` autoritativo, `unit: 'hour'`). Reglas: exige cliente, máx. una reserva por venta, una reserva por producto (`blockedProductIds`). **Fix de bug latente**: `buildNewSaleData` extraído de `handleSaveSale` y re-ejecutado en `onConfirmWizard`/`onLeavePendingWizard` — antes, ítems agregados dentro del wizard (reservas) no llegaban al payload del `pos-checkout` porque `pendingSaleData` se armaba al abrir el wizard |
| `src/features/reservations-schedule/ReservationDetail.tsx` | "Facturar Servicio" visible también en `RESERVED` (label "Cobrar ahora") — el backend auto-confirma en el pos-checkout |
| `src/lib/i18n/locales/es/sales.js` | Claves `sales.checkoutWizard.walkIn.*` |

### Contrato HTTP

Sin endpoints nuevos: `POST /reserve/manage` (CREATE/CONFIRM) y
`POST /sale/pos-checkout` existentes. El backend (ver
`business_management/conductor/PLAN_WALKIN_CHECKOUT.md`) auto-confirma
reservas `RESERVED` dentro del pos-checkout, y la UI crea las walk-in ya
confirmadas para cubrir el path "Dejar pendiente".

## Verificación

- `pnpm build` ✅
- `pnpm test`: 213 pasados / 49 fallidos — los 49 fallidos son preexistentes
  en HEAD (mocks desactualizados, verificados con worktree limpio de HEAD:
  49 fallidos / 202 pasados). Mis cambios agregan 11 tests en verde y ninguna
  falla nueva.

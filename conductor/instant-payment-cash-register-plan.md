# Implementation Plan: Añadir Selección de Caja Registradora en Cobro Instantáneo de Ventas

## Objetivo
Permitir a los usuarios seleccionar la caja registradora al momento de registrar el cobro de una venta inmediatamente después de su creación (flujo de cobro instantáneo). Actualmente, esta funcionalidad existe en el modal de cobros posterior (`RegisterSalePaymentModal`), pero falta en el diálogo rápido (`InstantPaymentDialog`) que aparece al confirmar una nueva venta en `SalesNew.tsx`.

## Archivos a Modificar
1.  `src/components/ui/InstantPaymentDialog.tsx`
2.  `src/pages/SalesNew.tsx`

## Pasos de Implementación

### 1. Actualizar `InstantPaymentDialog.tsx`
- **Importar dependencias:** Añadir importación de `cashRegisterService` y las utilidades para calcular los montos de la caja (similar a lo que se usa en `RegisterSalePaymentModal`).
- **Actualizar tipos:** Extender la interfaz `InstantPaymentPayload` para incluir la propiedad opcional `cash_register_id?: string | number | null`.
- **Añadir estado de Caja:**
  - `cashRegisters` para almacenar la lista de cajas.
  - `cashRegisterId` para almacenar el ID de la caja seleccionada.
  - `isCashRegistersLoading` para manejar el estado de carga.
- **Cargar Cajas (Efecto):**
  - Añadir un `useEffect` que se ejecute cuando el diálogo se abre (`open === true`) y es una venta (`isSale === true`).
  - Obtener las cajas disponibles con `cashRegisterService.getCashRegisters()`.
  - Obtener la caja activa con `cashRegisterService.getActiveCashRegister()`.
  - Establecer la caja activa como la seleccionada por defecto. Si no hay, usar un valor para "Sin caja asignada" (ej. `'__none__'`).
- **Actualizar UI:**
  - Justo debajo de la sección de "Método de pago", agregar un selector (`<select>`) nativo (manteniendo el estilo existente en este diálogo) para la "Caja de Cobro".
  - Mostrar un estado de "Cargando cajas..." mientras se hace el fetch.
  - Renderizar las opciones con el nombre de la caja, y una opción inicial de "Sin caja asignada".
- **Actualizar el Payload de Confirmación:**
  - Dentro de la función `handleConfirm`, al llamar a `onConfirmPayment({ ... })` para ventas (`isSale`), agregar la propiedad `cash_register_id: cashRegisterId === '__none__' ? null : cashRegisterId`.

### 2. Actualizar `SalesNew.tsx`
- Ubicar la llamada a `InstantPaymentDialog` y la función `onConfirmPayment` (alrededor de la línea 2138).
- Extraer `data.cash_register_id` en el callback.
- Asegurarse de que al llamar a `salePaymentService.processSalePaymentWithCashRegister(...)`, se envíe también la propiedad `cash_register_id: data.cash_register_id || null`.

## Verificación y Pruebas
1.  Crear una nueva venta en la página de Nueva Venta.
2.  Al momento de confirmarse, se debe abrir el `InstantPaymentDialog`.
3.  Verificar que aparezca el campo "Caja de Cobro" cargando las cajas disponibles.
4.  Si el usuario tiene una caja abierta, debería estar pre-seleccionada.
5.  Confirmar el cobro y validar en el backend (o en el historial de pagos de la venta/caja) que el cobro quedó correctamente vinculado a la caja registradora elegida.
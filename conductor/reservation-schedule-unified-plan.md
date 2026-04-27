# Plan de Implementación: Reserva y Horarios (Guía Unificada)

## 1. Background & Motivation
Sincronizar la gestión de reservas y horarios bajo un esquema unificado que permita la generación dinámica de slots, control de disponibilidad con detección de solapamientos (multi-hora) e integración directa con el Punto de Venta (POS).

## 2. Scope & Impact
- **Impacto Alto:** Dashboard de Gestión de Horarios y Reservas.
- **Impacto Alto:** Integración de Reserva -> Venta.
- **Impacto Medio:** Servicio Unificado de Reservas.
- **Archivos Afectados:**
  - `src/services/reservationUnifiedService.ts`
  - `src/pages/ReservationScheduleDashboard.tsx`
  - `src/pages/SalesNew.tsx`
  - `src/hooks/useReservationSchedule.ts`

## 3. Proposed Solution
- **Backend Sync:** Alinear los servicios con la API v1.0 de reservas/horarios, asegurando soporte para acciones `CREATE`, `UPDATE`, `CONFIRM`, `CANCEL`.
- **Agrupación de Slots:** En el dashboard, los slots que pertenecen a una misma reserva (multi-hora) se mostrarán agrupados visualmente para evitar confusión.
- **Flujo POS:** Añadir un acceso directo desde una reserva confirmada hacia la creación de venta, pasando el `reserve_id` para cumplir con la regla de negocio de trazabilidad obligatoria.

## 4. Implementation Plan

### Fase 1: Servicios y Hooks
- **reservationUnifiedService.ts**: 
  - Añadir `getAvailableSchedules(productId, date, duration)`.
  - Asegurar que `manageReservation` soporte todos los campos del payload `ManageReserveRequest`.
- **useReservationSchedule.ts**:
  - Exponer métodos para navegación y selección extendida.

### Fase 2: Refactorización del Dashboard
- **ReservationScheduleDashboard.tsx**:
  - Implementar lógica de agrupación de slots contiguos con el mismo `reservation_id`.
  - Actualizar visualización de estados según la guía (`RESERVED`, `CONFIRMED`, etc.).
  - Añadir botón "Facturar" en el detalle de reservas confirmadas que redirija a `/ventas/nueva`.

### Fase 3: Integración con Ventas (SalesNew)
- **SalesNew.tsx**:
  - Detectar `reserve_id` en el estado de navegación.
  - Al detectar un `reserve_id`, cargar automáticamente los datos de la reserva y pre-poblar el carrito con el servicio correspondiente.
  - Mantener la validación de "una reserva por producto" al crear la venta.

## 5. Verification
1. **Generación de Horarios:** Verificar que se generen slots según la configuración del producto.
2. **Reserva Multi-hora:** Crear una reserva de 2 horas y verificar que ambos slots aparezcan ocupados por el mismo cliente.
3. **Conversión a Venta:** Confirmar una reserva, hacer clic en "Facturar" y verificar que en el POS aparezca el ítem con su `reserve_id` vinculado.
4. **Validación de Venta:** Completar la venta y verificar en el payload de red que el `reserve_id` viaja en la raíz y en el detalle.

## 6. Migration & Rollback
- No requiere migración de datos. El rollback implica volver a las versiones anteriores de los componentes UI y servicios. El backend soporta los campos de forma opcional para compatibilidad.
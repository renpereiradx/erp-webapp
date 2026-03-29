# Plan de Implementación: Mejoras Finales en SalesNew.tsx

## Objetivo
Resolver problemas de concurrencia en modales de ventas pendientes y reservas, y mejorar la lógica y UI de la edición de precios/descuentos de un producto individual.

## Archivos Clave
- `src/pages/SalesNew.tsx`

## Pasos de Implementación

### 1. Gestión de Colas para Modales
- **Problema:** Si el cliente tiene una venta pendiente y una reserva confirmada al mismo tiempo, la lógica actual abre *ambos* modales de forma solapada (el z-index los superpone).
- **Solución:**
  - En `handleSelectClient`, si se detectan *ambos* (ventas pendientes y reservas), solo se abrirá primero el modal de `showActiveSaleModal`.
  - Las reservas se guardarán en `pendingReservations` pero NO se abrirá `showReservationModal` inmediatamente.
  - Al cerrar o confirmar el modal de Ventas Pendientes (`handleContinueSale` o cancelar "Nueva Venta"), se verificará: `if (pendingReservations.length > 0) setShowReservationModal(true)`.
  - Esto garantiza un flujo secuencial: Primero preguntas si quiere retomar una venta vieja, y luego (sobre esa venta) le preguntas si quiere añadir las reservas pendientes.

### 2. Ampliación del Modal de Edición (Margen, Descuento, Precio Final)
- **Problema:** El modal actual solo permite "Cantidad" y "Descuento". Se solicita poder manipular el *precio de venta final*, el *descuento*, y el *margen* (de ser aplicable según el costo).
- **Solución UI/UX:**
  - **Grid de 3 Columnas:** Cambiar de 2 a 3 entradas superiores para mostrar Precio Base, Precio Final, y % de Descuento (o usar el SegmentedControl de manera más inteligente).
  - Dado que es una venta directa y no una compra, el "margen" suele ser un dato informativo o un descuento desde el precio de lista.
  - Asegurar que al escribir en "Precio Final", el sistema automáticamente calcule y autocomplete el campo "Descuento" (y viceversa). Esto asegura una experiencia fluida.

### 3. Validación de handleContinueSale
- **Problema:** El modal no se cierra si no hay items nuevos, o muestra errores de Toast incorrectos.
- **Solución:** Ajustar la lógica del `return` en `setItems` dentro de `handleContinueSale` para asegurar que `setShowActiveSaleModal(false)` siempre se ejecute al confirmar y dispare el flujo consecutivo (el modal de reservas).

## Pruebas y Verificación
1. Seleccionar un cliente con ventas pendientes y reservas simultáneamente.
2. Confirmar que solo aparece el modal de "Ventas Pendientes".
3. Al elegir "Continuar" o "Nueva Venta", confirmar que el primer modal se cierra y *entonces* aparece el modal de "Reservas".
4. En el modal de editar producto, ingresar un "Precio Final" menor al original, verificar que el campo de "Descuento" se auto-llene.
5. Cambiar el "Descuento" y verificar que el "Precio Final" se recalcule dinámicamente.
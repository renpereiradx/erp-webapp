# Plan de Reintegración: Flujo Completo de Ventas en el Contexto Actual

## Objetivo
Reintroducir y adaptar las funcionalidades clave del flujo de ventas original (gestión de descuentos, ventas pendientes y métodos de pago) al nuevo diseño de la página `SalesNew.tsx`, donde los productos se agregan directamente desde un buscador y el modal se utiliza para la edición de las líneas de la tabla.

## Contexto Actual vs. Anterior
- **Anterior:** El modal se abría al buscar un producto para definir cantidad, precio y descuento *antes* de agregarlo a la tabla. Al seleccionar un cliente, se validaban las ventas pendientes.
- **Actual:** El usuario busca y agrega el producto rápidamente a la tabla. El modal (`isModalOpen`) se invoca haciendo clic en "Editar" sobre una fila existente para modificar sus detalles.

## Pasos de Implementación

### 1. Flujo de Ventas "Pendientes"
1. **Detección al Seleccionar Cliente:** 
   - Modificar la función `handleSelectClient` (que se ejecuta desde el `SearchableDropdown` de clientes) para que, al elegir un cliente, consulte si posee ventas en estado `PENDING`.
2. **Modal de Venta Activa:**
   - Reintegrar el modal que pregunta al usuario si desea "Continuar Venta" o crear una "Nueva Venta".
   - Si elige continuar, se deben cargar los detalles de esa venta en el estado `items` del carrito, marcándolos con la propiedad `isFromPendingSale: true`.
3. **Guardado Adaptado:**
   - Modificar la función de guardado (`handleSaveSale` o equivalente) para verificar si existe un `currentSaleId`.
   - Si existe, filtrar del carrito solo los items nuevos (`!item.isFromPendingSale`) y utilizar el endpoint `addProductsToSale` en lugar de crear una venta desde cero.

### 2. Gestión de Precios y Descuentos (en el Modal de Edición)
Dado que ahora el producto ya está en la tabla, el modal de edición debe incorporar la lógica anterior:
1. **Campos del Modal:**
   - Reintroducir los selectores de **Tipo de Descuento** (Monto Fijo / Porcentaje) y el input de **Valor del Descuento**.
   - Añadir el campo de texto (o selector predictivo) para la **Razón del Descuento**, marcándolo como *obligatorio* si el descuento es mayor a 0.
2. **Lógica de Estado (`originalPrice` vs `price`):**
   - Asegurarse de que el modelo `CartItem` conserve el `price` original. Al guardar los cambios del modal, recalcular el subtotal de la línea basándose en el descuento aplicado y actualizar el carrito.
   - Reintegrar la lista de `PRICE_CHANGE_REASONS` para facilitar la justificación (ej. "Descuento por volumen", "Cliente frecuente").

### 3. Métodos de Pago y Moneda
1. **Configuración por Defecto:**
   - Asegurar que al inicializar o resetear el estado de la vista de ventas, se asignen por defecto Guaraníes (PYG) y Efectivo.
2. **Cobro Instantáneo Post-Creación:**
   - Mantener y verificar el flujo del `InstantPaymentDialog` que debe dispararse automáticamente tras recibir la respuesta exitosa de la creación de la venta (o actualización de productos), permitiendo realizar el cobro (`/sales-payment/process`) o dejarla pendiente.

## Verificación y Pruebas
- [ ] **Búsqueda y Edición:** Agregar un producto rápido desde el buscador, abrir el modal de edición, aplicar un 10% de descuento con justificación y verificar que el total se actualice en la tabla.
- [ ] **Retomar Venta:** Seleccionar un cliente con ventas previas, confirmar la carga de productos con `isFromPendingSale: true`, añadir un producto adicional y guardar para validar que se utiliza el endpoint de adición.
- [ ] **Flujo de Pago:** Crear una venta nueva y confirmar que al final se despliegue correctamente el diálogo de pago rápido con los montos precisos.

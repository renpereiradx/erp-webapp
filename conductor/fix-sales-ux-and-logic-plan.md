# Plan de Corrección: Lógica de Ventas y Descuentos

## Objetivo
Resolver dos problemas críticos en el flujo de nueva venta:
1. El modal de cobro inmediato arroja el mensaje "La venta ya estaba pagada" después de procesar una nueva venta.
2. El precio del producto se vuelve `0` en el backend al aplicar descuentos porcentuales (ej. 30%).

## Archivos Clave
- `src/pages/SalesNew.tsx`

## Cambios Propuestos

### 1. Corrección del Estado de Pago en Venta Nueva
- **Ubicación:** `handleSaveSale` -> bloque `if (!currentSaleId)` -> llamada `createSale(saleData)`.
- **Acción:** No incluir `payment_method_id` en el objeto `saleData` cuando creamos la venta (o enviar un objeto sin él). Dejar que el modal de `InstantPaymentDialog` maneje exclusivamente la asignación del método de pago. Así garantizamos que la venta nazca "Pendiente" y permita el registro natural del cobro con todos sus cálculos (monto recibido, vuelto, etc.).

### 2. Corrección del Precio con Descuentos
- **Ubicación:** `handleSaveSale` -> estructuración de `product_details` (tanto para `addProductsToSale` como para `createSale`).
- **Acción:** Además de enviar `discount_percent` o `discount_amount`, agregar explícitamente los campos `sale_price` (igualándolo a `item.price`) y `price_change_reason` para asegurar que el backend reciba y respete el precio final unitario que el frontend ya calculó exitosamente, previniendo así caídas a valor 0 en el servidor.

## Pruebas de Verificación
1. Procesar una venta nueva con pago en el acto. Se debe abrir el modal y permitir el cobro sin el mensaje de error "ya estaba pagada".
2. Procesar una venta aplicando un 30% de descuento a un producto. Verificar que al crear la venta, el subtotal y el precio del producto sean correctos y distintos de 0.
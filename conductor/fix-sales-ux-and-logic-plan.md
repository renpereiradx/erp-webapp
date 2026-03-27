# Plan de Corrección: UX, Lógica de Totales y Navegación en Ventas

## Objetivo
Resolver las inconsistencias en el cálculo de totales, mejorar la experiencia de usuario (UX) en la búsqueda de productos y corregir errores de navegación y visualización en la página `SalesNew.tsx`.

## Problemas Detectados y Soluciones

### 1. Lógica de Cálculos y Totales
- **Problema**: El componente "Resumen" y la tabla no muestran precios ni totales para productos nuevos.
- **Causa**: El servicio `saleService.calculateLocalTotals` mapea campos (`unit_price`) que no coinciden con la interfaz `CartItem` (`price`).
- **Solución**: Refactorizar `calculateLocalTotals` en `saleService.ts` para que soporte ambas nomenclaturas y maneje correctamente `taxRate` y `discountInput`.

### 2. Mejora UX: Buscador de Productos
- **Visualización**: Rediseñar los ítems del dropdown para resaltar el SKU, Precio (en color de marca) y Stock (con colores de estado: verde para disponible, rojo para agotado).
- **Navegación de "Doble Enter"**: 
  - Al seleccionar un producto en el dropdown con las flechas y presionar Enter, el foco se trasladará al input de cantidad del *ítem resaltado*.
  - Al presionar Enter por segunda vez (desde el input de cantidad), el producto se agregará al carrito y el foco volverá al buscador principal.

### 3. F3 y Layout de Clientes
- **Foco F3**: Corregir la referencia del input de clientes en `SearchableDropdown` para que el atajo F3 funcione globalmente.
- **Desbordamiento de UI**: Eliminar `overflow-hidden` del contenedor de clientes (`article`) para evitar que los resultados del dropdown se corten al expandirse hacia abajo.

### 4. Visibilidad de Métodos de Pago y Moneda
- **Problema**: Los selectores no son visibles o no muestran datos.
- **Solución**: Asegurar que la carga inicial en el `useEffect` de `SalesNew.tsx` esté funcionando y que los componentes `Select` de UI tengan el contraste adecuado.

### 5. Columna de Precio en Reservas
- **Ajuste**: Modificar el mapeo de `pendingReservations` para que `price` represente el valor unitario (costo de reserva) y la tabla lo refleje correctamente, separándolo del total de la línea.

## Pasos de Implementación

### Fase 1: Servicio de Ventas
1. Modificar `src/services/saleService.ts` -> `calculateLocalTotals`.

### Fase 2: Componente SalesNew.tsx (Lógica y Teclado)
1. Implementar la lógica de foco secuencial en el buscador de productos.
2. Corregir el atajo F3 y la referencia del input de clientes.
3. Ajustar el diseño del dropdown de productos con énfasis en datos críticos.

### Fase 3: Layout y Estilos
1. Ajustar el CSS/Tailwind de los contenedores de clientes y selectores de pago.
2. Validar que el componente "Resumen" refleje los cambios en tiempo real mediante el `useMemo` de `saleTotals`.

## Verificación
- [ ] Atajo F3 enfoca el buscador de clientes.
- [ ] Dropdown de clientes no se corta al abrirse.
- [ ] Primer Enter en producto resalta cantidad, segundo Enter agrega al carrito.
- [ ] El resumen de la venta muestra montos reales al agregar productos.
- [ ] Los métodos de pago y moneda son seleccionables y visibles.

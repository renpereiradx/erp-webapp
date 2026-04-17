# Plan de Implementación: Mejoras en Página de Ventas (SalesNew.tsx)

## Objetivo
Actualizar la UI/UX del componente de ventas para alinearlo con el sistema de diseño Fluent 2.0, mejorar la navegabilidad por teclado en modales y ajustar la lógica de agregar productos a ventas pendientes.

## Archivos Clave
- `src/pages/SalesNew.tsx`

## Pasos de Implementación

### 1. Refactorización del Modal de Edición (Cantidad y Descuentos)
- **Modificación de UI:** Aplicar clases de `FLUENT2_COMPONENTS` (sombras `shadow-fluent-8`, bordes redondeados `rounded-xl`, botones con `text-xs font-black uppercase`).
- **Eliminación del Select "Guaraníes":** Reemplazar el Select de tipo de descuento (`amount` | `percent`) por un Toggle/Radio group moderno (o botones segmentados) que sea más intuitivo, eliminando la opción de select que resultaba confusa.
- **Validación de Lógica:** Asegurar que los cambios en el input de descuento actualicen correctamente `modalLineTotal` de forma reactiva y preserven la integridad matemática para el carrito.

### 2. Ajuste del Dropdown de Búsqueda de Productos
- **Ubicación de Cantidad:** Modificar el renderizado del item resaltado (`isHighlighted`). En lugar de mostrar la sección de cantidad debajo (`border-t`), se integrará al lado derecho (`ml-auto`, `flex-row`) del elemento seleccionado.
- **Estilos:** Se mantendrá la funcionalidad del teclado (flechas, Enter, Escape) pero adaptando la interfaz para que el campo numérico y los atajos visuales aparezcan a la derecha del nombre del producto y precio, optimizando el espacio vertical.

### 3. Navegación por Teclado en el Modal de Ventas Pendientes
- **Estado de Navegación:** Añadir un nuevo estado (ej. `activeSaleIndex`) para rastrear el índice seleccionado.
- **Eventos de Teclado:** Implementar un `useEffect` que, cuando `showActiveSaleModal` sea true, escuche las teclas:
  - `ArrowDown` / `ArrowUp`: Para moverse entre las diferentes ventas pendientes.
  - `Enter`: Para disparar `handleContinueSale()` o alternativamente la selección visual.
  - `Escape`: Para cerrar el modal (`setShowActiveSaleModal(false)`).
- **Feedback Visual:** Aplicar estilos condicionales (`bg-primary/5 ring-1 ring-primary`) basados en la navegación por teclado.

### 4. Verificación del Caso de Uso: "Add Product to Sale"
- **Validación Actual:** Verificar y asegurar la funcionalidad existente donde, si `currentSaleId` está presente, el sistema filtra los items del carrito (`!item.isFromPendingSale`) y utiliza `saleService.addProductsToSale(currentSaleId, payload)` para agregar **solo los productos nuevos**.
- **UX de Persistencia:** Garantizar que los productos que ya estaban en la venta pendiente sigan mostrando su badge de "Persistido" y no sean reenviados duplicados al endpoint.

## Pruebas y Verificación
1. Buscar un producto, navegar con flechas, ver el input de cantidad a la derecha, e insertarlo con Enter.
2. Hacer click en editar producto, verificar la nueva UI sin el Select de "Guaraníes" (usando un toggle), aplicar un descuento y confirmar que el precio total de la línea es correcto.
3. Buscar un cliente con ventas pendientes, usar las flechas arriba/abajo para seleccionar la venta y presionar Enter para continuar.
4. Agregar un producto nuevo a la venta pendiente y confirmar la transacción, validando en el network tab que se llame al endpoint `addProductsToSale` únicamente con el producto nuevo.

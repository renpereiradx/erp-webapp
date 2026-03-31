# Plan: Paginación Inteligente, Filtros Robustos y Reactividad en Cobros-Ventas

## Objetivo
Optimizar la página `/cobros-ventas` para manejar 20 items por página localmente, mejorar la inteligencia de los filtros (especialmente fechas y cliente) y garantizar que la interfaz sea reactiva y eficiente en el uso de memoria.

## Key Files & Context
- `src/pages/SalePayment.jsx`: Componente principal UI.
- `src/services/saleService.ts`: Lógica de filtrado y fetching.
- `React Best Practices`: Memoización, gestión de estado y efectos.

## Implementation Steps

### 1. Robustez en el Filtrado por Fechas (`saleService.ts`)
- Mejorar el filtrado local por fechas en `getSalesByClientName` para evitar problemas de zona horaria.
- Comparar fechas extrayendo solo la parte `YYYY-MM-DD` de los strings de fecha.

### 2. Gestión de Paginación Híbrida (Server + Local) en `SalePayment.jsx`
- **Fetching:** Aumentar el `page_size` del servidor a 100 para minimizar latencia en navegación.
- **Visualización:** Implementar un estado `localPage` para mostrar bloques de 20 items.
- **Cálculo de `displaySales`:** Usar `useMemo` para filtrar por `searchTerm` y luego rebanar (`slice`) el array `rawSales` según la página local.
- **Footer Inteligente:** Rediseñar los controles para navegar entre páginas locales (1 de 5) y solicitar la siguiente página del servidor automáticamente si es necesario.

### 3. Unificación e Inteligencia de Filtros
- Asegurar que `selectedClientName` (búsqueda en BD) y `searchTerm` (búsqueda en memoria) trabajen de forma coherente.
- Si el usuario busca por nombre, el sistema debe disparar la búsqueda en el API pero respetar los filtros de fecha y estado seleccionados.

### 4. Reactividad de las Tarjetas
- Asegurar que al registrar un cobro o anular una venta, el caché se limpie y la página actual se refresque, manteniendo la posición del usuario si es posible.
- Verificar que los componentes `SaleRow` y `SaleCard` reciban los datos actualizados tras cada operación.

## Verification & Testing
1. **Filtro de Cliente + Fecha:** Buscar un cliente y filtrar por un rango de fecha específico. Confirmar que los resultados coinciden con ambos criterios.
2. **Paginación Local:** Confirmar que se muestran exactamente 20 items y que al pasar de página local no hay carga de red (hasta llegar al límite de 100).
3. **Persistencia:** Verificar que el `pagesCache` no devuelva datos obsoletos tras una operación exitosa.
4. **Memoria:** Monitorear que el `Map` de caché no crezca indefinidamente (limpiar si excede cierto tamaño o al desmontar).

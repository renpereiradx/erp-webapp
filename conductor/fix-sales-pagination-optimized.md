# Plan: Paginación Inteligente y Optimización de Memoria en Cobros-Ventas

## Objetivo
Optimizar la página `/cobros-ventas` para manejar grandes volúmenes de datos de manera eficiente, reduciendo el consumo de memoria en el cliente y mejorando la velocidad de respuesta mediante el uso de caché, memoización y cancelación de peticiones obsoletas.

## Key Files & Context
- `src/pages/SalePayment.jsx`: Componente principal que requiere la optimización.
- `src/services/salePaymentService.ts`: Servicio que proporciona los datos.
- `React Best Practices`: Aplicación de `useMemo`, `useCallback`, `useRef` para caché y `AbortController`.

## Implementation Steps

### 1. Gestión de Memoria con Caché (Persistent Page Cache)
- Implementar un `useRef` llamado `pagesCache` (un `Map`) para almacenar los resultados de las páginas ya visitadas.
- **Beneficio:** Si el usuario navega a la página 2 y vuelve a la 1, los datos se cargarán instantáneamente desde la memoria sin hacer una nueva petición al servidor.
- El caché se limpiará automáticamente al cambiar los filtros base (Cliente, Estado, Rango de Fechas) para asegurar que los datos sean coherentes.

### 2. Prevención de Race Conditions y Fugas (AbortController)
- Utilizar `AbortController` dentro de `handleLoadSales`.
- **Beneficio:** Si el usuario cambia de página o filtros muy rápido, se cancelarán las peticiones anteriores que aún estén en curso, ahorrando ancho de banda y evitando que resultados antiguos sobrescriban el estado actual si llegan tarde.

### 3. Optimización del Renderizado (Memoización)
- Memoizar los formateadores de moneda y fecha con `useCallback`.
- Utilizar `useMemo` para la lógica de filtrado local (`displaySales`).
- Extraer la fila de la tabla a un componente interno memoizado (si la lista es muy grande) para evitar re-renderizados innecesarios de toda la tabla cuando solo cambia una fila.

### 4. Transformación Eficiente de Datos
- Mantener la lógica de normalización de datos dentro de la función de carga, pero asegurar que solo se procesen los datos una vez antes de guardarlos en el caché.

### 5. Interfaz de Usuario (Feedback)
- Mantener los controles de paginación implementados, asegurando que el estado de carga (`isLoading`) desactive los botones para prevenir clics dobles.

## Verification & Testing
1. **Prueba de Caché:** Navegar por varias páginas y volver atrás. La carga debe ser instantánea y sin el spinner de carga.
2. **Prueba de Filtros:** Cambiar filtros rápidamente y verificar en la consola de red que las peticiones anteriores se marcan como "canceled".
3. **Prueba de Memoria:** Verificar que al limpiar filtros o refrescar, el caché se libera correctamente.
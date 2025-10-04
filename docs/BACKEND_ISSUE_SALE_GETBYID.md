# Backend Issue: Error 500 al consultar venta por ID

## 📋 Descripción del Problema

Al hacer clic en "Ver detalles" en la página de **Pagos de Ventas**, el frontend recibe un error 500 del backend.

## 🔍 Detalles Técnicos

### Request
- **Endpoint:** `GET /sale/SALE-1759353369-669`
- **Base URL:** `http://localhost:5050`
- **Headers:** Authorization con JWT token

### Response
- **Status:** 500 Internal Server Error
- **Error Message:** "Error interno del servidor (500). Contacta al administrador."

### Logs del Frontend
```javascript
XHRGET http://localhost:5050/sale/SALE-1759353369-669
[HTTP/1.1 500 Internal Server Error 2ms]

[telemetry] sale_payment.service.error
Object {
  duration: 1579,
  error: "Error interno del servidor (500). Contacta al administrador.",
  operation: "getSaleById"
}
```

## 🧪 Reproducción

1. Ir a la página **Pagos de Ventas** (`/sale-payment`)
2. Cargar ventas usando los filtros de fecha
3. Hacer clic en el botón "Ver Detalles" de cualquier venta
4. El error ocurre en la llamada a `getSaleById(saleId)`

## ✅ Código Frontend (Correcto)

El frontend está haciendo la llamada correctamente:

### Servicio (salePaymentService.js)
```javascript
async getSaleById(saleId) {
  const result = await apiClient.get(`/sale/${saleId}`);
  return result;
}
```

### Store (useSalePaymentStore.js)
```javascript
getSaleById: async (saleId) => {
  set({ isCurrentSaleLoading: true, currentSaleError: null });

  try {
    const sale = await salePaymentService.getSaleById(saleId);
    set({ currentSale: sale, isCurrentSaleLoading: false });
    return sale;
  } catch (error) {
    console.warn('Error loading sale:', error);
    set({ currentSaleError: error, isCurrentSaleLoading: false });
    throw error;
  }
}
```

### Componente (SalePayment.jsx)
```javascript
const handleViewSaleDetail = async (saleId) => {
  setSelectedSaleId(saleId);
  try {
    await getSaleById(saleId);
    await getPaymentDetails(saleId);
    setSaleDetailDialog(true);
  } catch (error) {
    console.error('Error loading sale details:', error);
  }
};
```

## 🔴 Posibles Causas del Error 500

### 1. Error en el procedimiento almacenado o función del backend
El endpoint `/sale/{id}` podría estar llamando a una función de base de datos que falla con ciertos IDs.

### 2. Datos corruptos o inconsistentes
La venta `SALE-1759353369-669` podría tener:
- Referencias a registros eliminados (cliente, productos, etc.)
- Valores NULL en campos requeridos
- Datos en formato incorrecto

### 3. Problema de permisos o autenticación
El usuario podría no tener permisos para ver ciertos detalles de la venta.

## 🛠️ Investigación Recomendada (Backend)

### 1. Revisar logs del servidor
```bash
# Buscar errores relacionados con el ID de la venta
grep "SALE-1759353369-669" /var/log/backend/*.log
```

### 2. Verificar la venta en la base de datos
```sql
-- Consultar la venta directamente
SELECT * FROM sales.sales_orders WHERE id = 'SALE-1759353369-669';

-- Verificar integridad de datos
SELECT
  s.*,
  c.name as client_name,
  c.state as client_active
FROM sales.sales_orders s
LEFT JOIN clients.clients c ON s.client_id = c.id
WHERE s.id = 'SALE-1759353369-669';

-- Verificar items de la venta
SELECT * FROM sales.sales_order_items WHERE sales_order_id = 'SALE-1759353369-669';

-- Verificar pagos
SELECT * FROM sales.payments WHERE sales_order_id = 'SALE-1759353369-669';
```

### 3. Revisar el endpoint en el backend
```go
// Verificar el handler del endpoint GET /sale/{id}
// Buscar:
// - Manejo de errores
// - Validación de parámetros
// - Llamadas a la base de datos
// - Serialización de la respuesta
```

### 4. Verificar la función de base de datos
```sql
-- Si usa una función PL/pgSQL, verificarla
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%sale%' AND routine_name LIKE '%get%';
```

## 🔧 Soluciones Temporales (Frontend)

### Opción 1: Manejo de error mejorado
Ya implementado con retry automático (2 reintentos):

```javascript
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }

  throw lastError;
};
```

### Opción 2: Mensaje de error más descriptivo
Mostrar al usuario que el problema es del backend:

```javascript
catch (error) {
  if (error.status === 500) {
    announceError('Error al cargar los detalles de la venta. Por favor, contacta al administrador o intenta nuevamente más tarde.');
  } else {
    announceError(error.message);
  }
}
```

## 📝 Notas Adicionales

- El mismo endpoint funciona correctamente en otras partes del sistema (confirmado por el usuario)
- El error ocurre solo para ciertas ventas específicas
- Los reintentos automáticos fallan (3 intentos, todos con error 500)
- El error no es de red ni de autenticación

## ✅ Checklist para el Backend Team

- [ ] Revisar logs del servidor para el timestamp del error
- [ ] Verificar la venta `SALE-1759353369-669` en la base de datos
- [ ] Revisar el código del endpoint `GET /sale/{id}`
- [ ] Verificar funciones/procedimientos almacenados relacionados
- [ ] Agregar logging adicional para debugging
- [ ] Implementar manejo de errores más específico (retornar códigos de error descriptivos en lugar de 500 genérico)
- [ ] Verificar integridad referencial de datos
- [ ] Probar el endpoint con diferentes IDs de venta

## 🔗 Referencias

- Frontend Service: `/src/services/salePaymentService.js:94`
- Frontend Store: `/src/store/useSalePaymentStore.js:95`
- Frontend Component: `/src/pages/SalePayment.jsx:193`
- API Documentation: `/docs/api/SALE_API.md:335`

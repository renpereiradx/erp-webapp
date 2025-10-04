# 🚨 Issue de Backend - Endpoint de Vista Previa de Reversión

## Problema Detectado

El endpoint de vista previa de reversión de ventas está devolviendo **404 Not Found**.

---

## 📍 Detalles del Error

### Request del Frontend
```
GET /sale/orders/TEST_REVERT_003/preview-cancellation
Host: localhost:5050
Authorization: Bearer [token]
```

### Response del Backend
```
HTTP/1.1 404 Not Found
```

### Logs en Consola
```
XHRGET
http://localhost:5050/sale/orders/TEST_REVERT_003/preview-cancellation
[HTTP/1.1 404 Not Found 0ms]

API unavailable, cannot preview sale cancellation for TEST_REVERT_003
```

---

## ✅ Verificación Frontend

### 1. URL Correcta
El frontend está usando la ruta correcta según la documentación:
```javascript
// src/services/saleService.js:540
const response = await api.makeRequest(
  `/sale/orders/${saleId}/preview-cancellation`,
  { method: 'GET' }
);
```

### 2. Formato del Sale ID
- ID enviado: `TEST_REVERT_003`
- Formato: String alfanumérico con guiones bajos
- Encoding: Correcto (no requiere URL encoding)

### 3. Headers Correctos
```javascript
{
  'Authorization': 'Bearer [token]',
  'Content-Type': 'application/json'
}
```

### 4. Reintentos Automáticos
El sistema está reintentando 3 veces según la configuración:
```javascript
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;
```

---

## 📋 Especificación Esperada (REVERT_SALE_API.md)

### Endpoint
```
GET /sale/orders/{sale_id}/preview-cancellation
```

### Path Parameters
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| sale_id | string | ID único de la venta |

### Response Esperada (200 OK)
```json
{
  "success": true,
  "sale": {
    "id": "TEST_REVERT_003",
    "status": "PAID",
    "total_amount": 1625000.00,
    "client_id": "CLI001",
    "sale_date": "2025-09-30T12:00:00"
  },
  "products": [
    {
      "product_id": "PROD001",
      "product_name": "Producto Test",
      "product_type": "PHYSICAL",
      "quantity": 2.00,
      "unit_price": 812500.00,
      "will_restore_stock": true,
      "will_revert_reserve": false,
      "reserve_id": null
    }
  ],
  "reserves": [],
  "payments": [
    {
      "payment_id": 1,
      "amount_received": 1625000.00,
      "payment_date": "2025-09-30T12:05:00",
      "status": "COMPLETED"
    }
  ],
  "summary": {
    "total_products": 1,
    "stock_movements": 1,
    "reserves_to_handle": 0,
    "payments_to_refund": 1,
    "total_refund": 1625000.00
  }
}
```

---

## 🔍 Posibles Causas en Backend

### 1. Ruta No Registrada
El endpoint podría no estar registrado en el router del backend.

**Verificar:**
```python
# backend/routes.py (ejemplo)
@app.route('/sale/orders/<sale_id>/preview-cancellation', methods=['GET'])
def preview_sale_cancellation(sale_id):
    # ...
```

### 2. ID de Venta No Encontrado
El backend podría estar buscando la venta y no encontrarla.

**Verificar:**
- ¿Existe la venta `TEST_REVERT_003` en la base de datos?
- ¿El endpoint busca en la tabla correcta?
- ¿Hay filtros adicionales (user_id, tenant_id, etc.)?

### 3. Typo en la Ruta
Posibles typos a verificar:
```
❌ /sales/orders/{id}/preview-cancellation  (con 's' extra)
❌ /sale/order/{id}/preview-cancellation    (sin 's' en orders)
❌ /sale/orders/{id}/cancel-preview         (orden diferente)
✅ /sale/orders/{id}/preview-cancellation   (correcto)
```

### 4. Método HTTP Incorrecto
Verificar que el backend acepta **GET**, no POST.

### 5. Middleware de Autenticación
Verificar que el token JWT se está validando correctamente antes del 404.

---

## 🧪 Pruebas Recomendadas (Backend)

### Test 1: Verificar Ruta Existe
```bash
# Listar todas las rutas registradas
# Buscar: /sale/orders/<sale_id>/preview-cancellation
```

### Test 2: Probar Directamente con cURL
```bash
curl -X GET "http://localhost:5050/sale/orders/TEST_REVERT_003/preview-cancellation" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test 3: Verificar Venta Existe
```sql
-- Verificar que la venta existe
SELECT * FROM sales
WHERE sale_id = 'TEST_REVERT_003';

-- Verificar estado
SELECT sale_id, status, total_amount
FROM sales
WHERE sale_id = 'TEST_REVERT_003';
```

### Test 4: Logs del Backend
Buscar en los logs del backend:
- ¿Se recibe la petición?
- ¿En qué punto falla?
- ¿Qué error se genera?

---

## ✅ Endpoints Funcionando Correctamente

Para contexto, estos otros endpoints SÍ funcionan:

### 1. Get Sales by Date Range
```
✅ GET /sale/date_range/?start_date=2025-09-30&end_date=2025-09-30&page=1&page_size=50
Response: 200 OK
Data: 21 sales found
```

### 2. Create Sale
```
✅ POST /sale/
Response: 200 OK (según implementación)
```

---

## 🔄 Workaround Temporal (Frontend)

Mientras se corrige el backend, el frontend usa un **fallback demo**:

```javascript
// src/services/saleService.js:553
catch (error) {
  console.warn(`API unavailable, cannot preview sale cancellation for ${saleId}`);

  // Demo fallback
  return {
    success: true,
    sale: {
      id: saleId,
      status: 'PAID',
      total_amount: 1625000.00,
      // ... datos demo
    },
    // ... más datos mock
  };
}
```

**Nota:** Este fallback permite que la UI funcione, pero **NO ejecuta la reversión real**.

---

## 📞 Acción Requerida del Backend

Por favor verificar y corregir:

1. ✅ **Ruta registrada:** Confirmar que `/sale/orders/{sale_id}/preview-cancellation` existe
2. ✅ **Método HTTP:** Debe aceptar **GET**
3. ✅ **Path parameter:** Debe recibir `sale_id` como string
4. ✅ **Búsqueda de venta:** Verificar que la venta existe antes de procesar
5. ✅ **Response format:** Debe seguir la estructura de REVERT_SALE_API.md
6. ✅ **Status codes:**
   - `200 OK` - Vista previa exitosa
   - `404 Not Found` - Venta no encontrada
   - `401 Unauthorized` - Token inválido
   - `403 Forbidden` - Sin permisos

---

## 🔗 Documentación Relacionada

- **Especificación API:** `docs/api/REVERT_SALE_API.md`
- **Implementación Frontend:** `src/services/saleService.js:534-599`
- **Componente UI:** `src/components/SaleReversionModal.jsx`
- **Tests:** `src/__tests__/SaleReversion.test.jsx`

---

## 📊 Información Adicional

### Sale IDs Probados (todos con 404)
- `TEST_REVERT_003`
- `QUICK_TEST_REVERT`
- `TEST_REVERT_004`
- Otros IDs visibles en la interfaz

### Patrón de IDs
Los IDs de venta siguen el patrón:
- Alfanuméricos con guiones bajos
- Ejemplos: `TEST_REVERT_001`, `SALE-1759255877-392`, `QUICK_TEST_REVERT`

### Browser & Environment
- Navegador: Chrome/Firefox (verificado en ambos)
- Frontend URL: `http://localhost:5173`
- Backend URL: `http://localhost:5050`
- Token: JWT válido (auto-login funciona correctamente)

---

## ✍️ Contacto

Frontend Team
- Endpoint implementado según spec
- Listo para pruebas cuando backend esté disponible
- Fallback demo activo para desarrollo continuo

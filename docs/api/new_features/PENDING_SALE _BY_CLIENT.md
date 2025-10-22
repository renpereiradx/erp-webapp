# 🛒 Obtener Ventas Pendientes por Cliente

**Versión:** 1.0
**Fecha:** 19 de Octubre de 2025
**Endpoint Base:** `http://localhost:8080`

---

## 📋 Descripción General

Este endpoint permite obtener todas las ventas en estado **PENDING** para un cliente específico. Es ideal para que el frontend muestre ventas incompletas a las que se pueden agregar más productos usando el endpoint `POST /sale/{id}/products`.

### Características Principales

- ✅ Filtra automáticamente solo ventas en estado PENDING
- ✅ Retorna datos enriquecidos con información de cliente, usuario y productos
- ✅ Incluye detalles completos de cada producto en la venta
- ✅ Calcula subtotales, impuestos y descuentos automáticamente
- ✅ Identifica modificaciones de precio
- ✅ Formato optimizado para frontend

---

## 🌐 Endpoint

```
GET /sale/client_id/{client_id}/pending
```

### Parámetros de URL

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `client_id` | string | Sí | ID del cliente |

### Headers

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## 📤 Respuesta Exitosa (200 OK)

### Estructura de Respuesta

```json
[
  {
    "sale_id": "SALE-1729359600-456",
    "client_id": "CLI001",
    "client_name": "Juan Pérez",
    "sale_date": "2025-10-19 10:30:00",
    "total_amount": 150.00,
    "status": "PENDING",
    "user_id": "USR001",
    "user_name": "María González",
    "payment_method_id": 1,
    "payment_method": "Efectivo",
    "currency_id": 1,
    "currency": "COP",
    "details": [
      {
        "id": 1,
        "order_id": "SALE-1729359600-456",
        "product_id": "PROD_001",
        "product_name": "Producto A",
        "product_type": "PHYSICAL",
        "quantity": 2.0,
        "base_price": 50.00,
        "unit_price": 45.00,
        "discount_amount": 10.00,
        "subtotal": 90.00,
        "tax_amount": 17.10,
        "total_with_tax": 107.10,
        "price_modified": true,
        "reserve_id": 0,
        "tax_rate_id": 1,
        "tax_rate": 19.0
      },
      {
        "id": 2,
        "order_id": "SALE-1729359600-456",
        "product_id": "PROD_002",
        "product_name": "Producto B",
        "product_type": "SERVICE",
        "quantity": 1.0,
        "base_price": 60.00,
        "unit_price": 60.00,
        "discount_amount": 0.00,
        "subtotal": 60.00,
        "tax_amount": 11.40,
        "total_with_tax": 71.40,
        "price_modified": false,
        "reserve_id": 123,
        "tax_rate_id": 1,
        "tax_rate": 19.0
      }
    ],
    "items": 2,
    "subtotal_amount": 150.00,
    "tax_amount": 28.50,
    "discount_amount": 10.00,
    "has_discounts": true,
    "has_price_changes": true
  }
]
```

### Campos de la Respuesta

#### Nivel de Venta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sale_id` | string | ID único de la venta |
| `client_id` | string | ID del cliente |
| `client_name` | string | Nombre completo del cliente |
| `sale_date` | string | Fecha y hora de la venta |
| `total_amount` | float64 | Monto total de la venta |
| `status` | string | Siempre "PENDING" en este endpoint |
| `user_id` | string | ID del usuario que creó la venta |
| `user_name` | string | Nombre del usuario |
| `payment_method_id` | int | ID del método de pago (opcional) |
| `payment_method` | string | Descripción del método de pago |
| `currency_id` | int | ID de la moneda (opcional) |
| `currency` | string | Nombre de la moneda |
| `items` | int | Número total de productos |
| `subtotal_amount` | float64 | Subtotal sin impuestos |
| `tax_amount` | float64 | Total de impuestos |
| `discount_amount` | float64 | Total de descuentos |
| `has_discounts` | bool | Si la venta tiene descuentos |
| `has_price_changes` | bool | Si hubo cambios de precio |

#### Nivel de Detalle (cada producto)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | ID del detalle |
| `order_id` | string | ID de la venta (sale_id) |
| `product_id` | string | ID del producto |
| `product_name` | string | Nombre del producto |
| `product_type` | string | "PHYSICAL" o "SERVICE" |
| `quantity` | float64 | Cantidad (soporta decimales) |
| `base_price` | float64 | Precio base del producto |
| `unit_price` | float64 | Precio unitario final de venta |
| `discount_amount` | float64 | Descuento aplicado al producto |
| `subtotal` | float64 | Cantidad × precio unitario |
| `tax_amount` | float64 | Impuesto calculado |
| `total_with_tax` | float64 | Subtotal + impuesto |
| `price_modified` | bool | Si el precio fue modificado |
| `reserve_id` | int | ID de reserva (si aplica) |
| `tax_rate_id` | int | ID de la tasa de impuesto |
| `tax_rate` | float64 | Porcentaje de impuesto |

---

## 📤 Respuesta Sin Ventas (200 OK)

Si el cliente no tiene ventas pendientes, retorna array vacío:

```json
[]
```

---

## ❌ Errores Posibles

### 400 Bad Request
```json
{
  "error": "client_id is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 500 Internal Server Error
```json
{
  "error": "Error getting pending sales: [detalles del error]"
}
```

---

## 🚀 Ejemplos de Uso

### Ejemplo 1: Obtener Ventas Pendientes

```bash
curl -X GET http://localhost:8080/sale/client_id/CLI001/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
[
  {
    "sale_id": "SALE-123",
    "client_name": "Juan Pérez",
    "total_amount": 250.00,
    "status": "PENDING",
    "items": 3,
    "details": [...]
  },
  {
    "sale_id": "SALE-456",
    "client_name": "Juan Pérez",
    "total_amount": 100.00,
    "status": "PENDING",
    "items": 1,
    "details": [...]
  }
]
```

### Ejemplo 2: Flujo Completo - Ver y Agregar Productos

```bash
# 1. Obtener ventas pendientes del cliente
curl -X GET http://localhost:8080/sale/client_id/CLI001/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response: [{ "sale_id": "SALE-123", ... }]

# 2. Agregar productos a la venta pendiente
curl -X POST http://localhost:8080/sale/SALE-123/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_details": [
      {
        "product_id": "PROD_003",
        "quantity": 1,
        "tax_rate_id": 1
      }
    ]
  }'

# 3. Verificar que se actualizó la venta
curl -X GET http://localhost:8080/sale/client_id/CLI001/pending \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💡 Casos de Uso

### 1. **Mostrar Ventas Incompletas al Cliente**

El frontend puede listar todas las ventas pendientes del cliente para que pueda:
- Ver qué productos ya agregó
- Decidir si agregar más productos
- Continuar con el proceso de pago

### 2. **Agregar Productos a Venta Existente**

```javascript
// Paso 1: Obtener ventas pendientes
const response = await fetch(
  `${API_URL}/sale/client_id/${clientId}/pending`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);
const pendingSales = await response.json();

// Paso 2: Mostrar lista al usuario
if (pendingSales.length > 0) {
  console.log("El cliente tiene ventas pendientes:");
  pendingSales.forEach(sale => {
    console.log(`Venta ${sale.sale_id}: $${sale.total_amount}`);
    console.log(`Productos: ${sale.items}`);
  });

  // Paso 3: Usuario selecciona venta y agrega productos
  const saleId = pendingSales[0].sale_id;
  await addProductsToSale(saleId, newProducts);
}
```

### 3. **Validación Antes de Crear Nueva Venta**

```javascript
// Verificar si el cliente ya tiene ventas pendientes
const pendingSales = await getPendingSales(clientId);

if (pendingSales.length > 0) {
  // Preguntar al usuario si quiere agregar a venta existente
  const useExisting = confirm(
    `El cliente tiene ${pendingSales.length} venta(s) pendiente(s).
    ¿Desea agregar productos a una venta existente?`
  );

  if (useExisting) {
    // Mostrar lista de ventas pendientes
    showPendingSalesDialog(pendingSales);
  } else {
    // Crear nueva venta
    createNewSale();
  }
}
```

---

## 🔗 Endpoints Relacionados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /sale/client_id/{client_id}` | GET | Todas las ventas del cliente (cualquier estado) |
| `GET /sale/{id}` | GET | Obtener venta específica por ID |
| `POST /sale/{id}/products` | POST | Agregar productos a venta existente |
| `GET /sale/{id}/payment-status` | GET | Estado de pagos de una venta |
| `POST /sale/` | POST | Crear nueva venta |

---

## 📊 Diferencias con Otros Endpoints

### vs `GET /sale/client_id/{client_id}`

| Aspecto | `/pending` | Sin `/pending` |
|---------|-----------|----------------|
| **Filtro** | Solo PENDING | Todos los estados |
| **Ordenamiento** | Más reciente primero | Por fecha |
| **Uso** | Para agregar productos | Para historial completo |

### vs `GET /sale/{id}`

| Aspecto | `/pending` (lista) | `/{id}` (individual) |
|---------|-------------------|----------------------|
| **Resultado** | Array de ventas | Objeto único |
| **Filtro** | Por cliente + estado | Por ID específico |
| **Uso** | Ver todas pendientes | Ver detalles de una |

---

## ✅ Buenas Prácticas

1. **Verificar ventas pendientes antes de crear nueva venta**
   - Evita duplicar ventas innecesariamente
   - Mejora la experiencia del usuario

2. **Mostrar información clara al usuario**
   - Indicar cuántas ventas pendientes tiene
   - Mostrar total y cantidad de productos
   - Permitir elegir entre agregar o crear nueva

3. **Manejar array vacío correctamente**
   - No mostrar error si no hay ventas pendientes
   - Es un resultado válido, no un error

4. **Usar datos enriquecidos del endpoint**
   - No necesitas hacer llamadas adicionales
   - Toda la información ya viene incluida

---

## 🔍 Consultas SQL Subyacentes

El endpoint ejecuta internamente:

```sql
SELECT s.id, s.client_id, s.sale_date, s.total_amount, s.status, s.id_user,
       c.name || ' ' || c.last_name AS client_name,
       u.first_name || ' ' || u.last_name AS username,
       s.payment_method_id, pm.description AS payment_method,
       s.currency_id, curr.name AS currency
FROM transactions.sales_orders s
JOIN clients.clients c ON s.client_id = c.id
JOIN users.users u ON s.id_user = u.id
LEFT JOIN payments.payment_methods pm ON s.payment_method_id = pm.id
LEFT JOIN payments.currencies curr ON s.currency_id = curr.id
WHERE s.client_id = $1 AND s.status = 'PENDING'
ORDER BY s.sale_date DESC
```

---

**Última actualización:** 2025-10-19
**Versión:** 1.0

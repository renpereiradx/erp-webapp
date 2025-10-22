# Agregar Productos a una Venta Existente

Esta funcionalidad permite agregar productos adicionales a una venta que ya ha sido creada.

## Endpoint

```
POST /sale/{id}/products
```

## Autenticación

Requiere token JWT válido en el header `Authorization: Bearer {token}`

## Parámetros de URL

- `id` (string, requerido): ID de la venta existente a la cual se agregarán productos

## Request Body

```json
{
  "product_details": [
    {
      "product_id": "PROD_001",
      "quantity": 2.0,
      "tax_rate_id": 1,
      "sale_price": 150.00,
      "price_change_reason": "Precio especial para cliente frecuente",
      "discount_amount": 10.00,
      "discount_reason": "Promoción de temporada",
      "reserve_id": 123
    }
  ],
  "allow_price_modifications": true
}
```

### Campos del Product Detail

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_id` | string | Sí | ID del producto |
| `quantity` | float64 | Sí | Cantidad (soporta decimales) |
| `tax_rate_id` | int | No | ID de la tasa de impuesto |
| `sale_price` | float64 | No | Precio personalizado (requiere `allow_price_modifications: true`) |
| `price_change_reason` | string | Condicional | Requerido si `sale_price` difiere del precio estándar |
| `discount_amount` | float64 | No | Descuento por monto fijo (excluyente con `discount_percent`) |
| `discount_percent` | float64 | No | Descuento por porcentaje (excluyente con `discount_amount`) |
| `discount_reason` | string | Condicional | Requerido si se aplica descuento |
| `reserve_id` | int | No | ID de reserva (solo para productos de tipo SERVICE) |

### Campos del Request Principal

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `product_details` | array | Sí | Lista de productos a agregar (mínimo 1) |
| `allow_price_modifications` | bool | No | Permite precios personalizados (default: false) |

## Response

### Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "sale_id": "SALE-1234567890-123",
  "products_added": 2,
  "previous_total": 500.00,
  "added_amount": 290.00,
  "new_total": 790.00,
  "sale_status": "PENDING",
  "price_modifications_enabled": true,
  "has_price_changes": true,
  "has_discounts": true,
  "message": "Se agregaron 2 productos a la venta con cambios de precio y descuentos"
}
```

### Respuesta con Error (400 Bad Request / 500 Internal Server Error)

```json
{
  "success": false,
  "sale_id": "SALE-1234567890-123",
  "error": "INSUFFICIENT_STOCK: Stock insuficiente para producto PROD_001",
  "error_detail": "P0001",
  "timestamp": "2025-10-19T10:30:00Z"
}
```

## Ejemplos de Uso

### Ejemplo 1: Agregar Productos Simples

```bash
curl -X POST http://localhost:8080/sale/SALE-1234567890-123/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_details": [
      {
        "product_id": "PROD_001",
        "quantity": 2,
        "tax_rate_id": 1
      },
      {
        "product_id": "PROD_002",
        "quantity": 1,
        "tax_rate_id": 1
      }
    ]
  }'
```

### Ejemplo 2: Agregar Productos con Precio Modificado

```bash
curl -X POST http://localhost:8080/sale/SALE-1234567890-123/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_details": [
      {
        "product_id": "PROD_003",
        "quantity": 1,
        "sale_price": 80.00,
        "price_change_reason": "Precio especial por compra al por mayor",
        "tax_rate_id": 1
      }
    ],
    "allow_price_modifications": true
  }'
```

### Ejemplo 3: Agregar Productos con Descuento

```bash
curl -X POST http://localhost:8080/sale/SALE-1234567890-123/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_details": [
      {
        "product_id": "PROD_004",
        "quantity": 3,
        "discount_percent": 15,
        "discount_reason": "Promoción de fin de temporada",
        "tax_rate_id": 1
      }
    ]
  }'
```

### Ejemplo 4: Agregar Servicio con Reserva

```bash
curl -X POST http://localhost:8080/sale/SALE-1234567890-123/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_details": [
      {
        "product_id": "SERVICE_001",
        "quantity": 1,
        "reserve_id": 456,
        "tax_rate_id": 1
      }
    ]
  }'
```

## Validaciones

### La función valida:

1. **Existencia de la venta**: La venta debe existir
2. **Estado de la venta**: No se pueden agregar productos a ventas canceladas
3. **Existencia de productos**: Todos los productos deben existir en la base de datos
4. **Stock disponible**: Para productos físicos, valida que haya stock suficiente
5. **Reservas válidas**: Para servicios con reserva, valida que la reserva esté confirmada
6. **Modificaciones de precio**:
   - Requiere `allow_price_modifications: true`
   - Requiere justificación en `price_change_reason`
7. **Descuentos**:
   - Requiere justificación en `discount_reason`
   - No permite descuentos negativos
   - Permite descuentos de 100% o más (precio final será 0)

## Comportamiento del Sistema

### Actualización Automática

- **Total de la venta**: Se actualiza automáticamente sumando el nuevo monto
- **Stock**: Se reduce automáticamente para productos físicos (mediante trigger)
- **Impuestos**: Se calculan automáticamente según la tasa especificada

### Metadata

La función registra en el metadata de la venta:
- Cambios de precio con justificación
- Descuentos aplicados con razón
- Usuario que realizó las modificaciones
- Timestamp de las modificaciones

### Manejo de Errores

La función utiliza excepciones con códigos específicos:

| Código | Descripción |
|--------|-------------|
| `SALE_CANCELLED` | No se pueden agregar productos a ventas canceladas |
| `STOCK_NOT_FOUND` | El producto no tiene registro de stock |
| `INSUFFICIENT_STOCK` | Stock insuficiente para el producto |
| `INVALID_RESERVATION` | La reserva no es válida |
| `PRICE_MODIFICATION_NOT_ALLOWED` | No se permiten modificaciones de precio |
| `PRICE_CHANGE_REASON_REQUIRED` | Se requiere justificación para cambio de precio |
| `DISCOUNT_REASON_REQUIRED` | Se requiere justificación para descuento |
| `INVALID_DISCOUNT_AMOUNT` | El descuento no puede ser negativo |
| `INVALID_DISCOUNT_PERCENT` | El porcentaje de descuento no puede ser negativo |

## Notas Importantes

1. **Productos físicos vs servicios**:
   - Productos físicos requieren stock disponible
   - Servicios pueden vincularse a reservas

2. **Descuentos**:
   - Se puede aplicar descuento por monto fijo O por porcentaje, no ambos
   - Descuentos de 100% o más son permitidos (precio final = 0)

3. **Precios personalizados**:
   - Deben ser diferentes del precio estándar del producto
   - Requieren justificación obligatoria
   - Se registran en metadata para auditoría

4. **Impuestos**:
   - Se calculan sobre el precio final (después de descuentos)
   - Son opcionales (tax_rate_id puede ser null)

5. **Estado de la venta**:
   - La venta mantiene su estado actual (PENDING, PAID, etc.)
   - El total se actualiza automáticamente

## Función SQL Subyacente

La integración llama a la función PostgreSQL:
```sql
transactions.add_products_to_sale(
    p_sale_id VARCHAR,
    p_product_details JSONB,
    p_allow_price_modifications BOOLEAN
)
```

Esta función maneja toda la lógica de validación, cálculo y actualización de la base de datos.

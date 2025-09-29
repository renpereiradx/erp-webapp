# 💳 Guía de Integración API - Sistema de Pagos de Compras

## 📋 Resumen General

Esta documentación detalla exclusivamente el **sistema de pagos de compras** integrado con órdenes de compra existentes. Incluye procesamiento de pagos parciales/completos, estadísticas financieras y validación de integridad de pagos.

### 🆕 Características del Sistema de Pagos
- ✅ **Pagos parciales y completos**: Soporte para múltiples pagos por orden
- ✅ **Validación automática**: Verificación de montos y saldos pendientes
- ✅ **Trazabilidad completa**: Registro detallado de todas las transacciones
- ✅ **Estadísticas financieras**: Análisis consolidado de pagos por período
- ✅ **Integración con órdenes existentes**: Compatible con cualquier orden de compra

> � **Ver también**: [PURCHASE_ORDERS_API_GUIDE.md](./PURCHASE_ORDERS_API_GUIDE.md) para crear y gestionar órdenes de compra.

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT.**
```
Authorization: Bearer <token>
```

## 🛠 Endpoints Disponibles

### 1. Procesar Pago de Compra

**POST** `/purchase/payment/process`

Procesa un pago total o parcial para una orden de compra existente.

#### Request Body
```json
{
  "purchase_order_id": 12,
  "amount_paid": 150000.00,
  "payment_reference": "PAY-2025-09-001",
  "payment_notes": "First partial payment - 50% advance",
  "cash_register_id": 1
}
```

#### Response (Success)
```json
{
  "success": true,
  "payment_id": 15,
  "purchase_order_id": 12,
  "payment_details": {
    "amount_paid": 150000.00,
    "outstanding_amount": 75000.00,
    "total_paid_so_far": 150000.00,
    "total_order_amount": 225000.00,
    "payment_status": "partial",
    "order_fully_paid": false
  },
  "message": "Payment processed successfully",
  "processed_at": "2025-09-10T18:15:30Z",
  "processed_by": "admin123user"
}
```

#### Response (Error)
```json
{
  "success": false,
  "purchase_order_id": 42,
  "message": "Payment processing failed",
  "error_code": "INVALID_AMOUNT",
  "details": "Payment amount exceeds outstanding balance"
}
```

### 2. Estadísticas de Pagos de Compras

**GET** `/purchase/payment/statistics`

Obtiene estadísticas consolidadas de pagos de compras para análisis financiero.

#### Query Parameters (Opcionales)
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)
- `supplier_id`: ID del proveedor específico

#### Example Request

```bash
GET /purchase/payment/statistics?start_date=2025-08-01&end_date=2025-08-31&supplier_id=1
```

#### Response (Success)
```json
{
  "period": {
    "start_date": "2025-08-01",
    "end_date": "2025-08-31",
    "supplier_id": 1
  },
  "order_statistics": {
    "total_orders": 25,
    "fully_paid_orders": 18,
    "partially_paid_orders": 5,
    "unpaid_orders": 2,
    "payment_completion_rate": 0.72
  },
  "financial_summary": {
    "total_order_amount": 12500.75,
    "total_paid_amount": 9200.50,
    "total_outstanding": 3300.25,
    "payment_percentage": 73.6
  },
  "generated_at": "2025-08-23T20:30:00Z"
}
```

---

## 🆕 Pagos Parciales en Ventas

### Resumen
El sistema permite procesar pagos parciales sobre órdenes de venta, manteniendo el estado actualizado del pago, historial de transacciones y reducción automática de stock.

### Endpoint
**POST** `/payment/process-partial`

#### Request Body
```json
{
  "sales_order_id": "SALE-001",
  "amount_paid": 50000.00,
  "payment_method_id": 1,
  "payment_reference": "REF-001",
  "notes": "Pago parcial del cliente"
}
```

#### Response (Success)
```json
{
  "success": true,
  "sales_order_id": "SALE-001",
  "payment_summary": {
    "total_amount": 100000.00,
    "total_paid": 50000.00,
    "remaining_balance": 50000.00,
    "payment_status": "partial"
  },
  "new_payment": {
    "payment_id": 123,
    "amount_paid": 50000.00,
    "payment_method_id": 1,
    "created_at": "2024-01-01T10:00:00Z"
  },
  "message": "Pago parcial procesado exitosamente",
  "processed_at": "2024-01-01T10:00:00Z"
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "Error message description"
}
```

### Estados de Pago
- `pending`: Pago pendiente (no se ha pagado nada)
- `partial`: Pago parcial (se ha pagado algo pero no el total)
- `completed`: Pago completado (se ha pagado el total)
- `overpaid`: Sobrepago (se ha pagado más del total)

### Flujo de Trabajo
1. **Creación de Venta**: Se crea una venta y automáticamente se reduce el stock.
2. **Pago Parcial**: El cliente puede realizar pagos parciales.
3. **Seguimiento**: El sistema mantiene el estado actualizado del pago.
4. **Historial**: Se mantiene un registro de todos los pagos realizados.

### Validaciones Implementadas
- Sales Order ID es requerido
- Amount Paid debe ser mayor a 0
- JWT Token válido es requerido
- El usuario debe estar autenticado

### Seguridad y Rendimiento
- Autenticación JWT requerida
- Validación de entrada de datos
- Transacciones de base de datos para consistencia
- Logging de operaciones
- Índices en tablas principales
- Manejo eficiente de JSON responses

### Testing
Para probar el endpoint:
```bash
curl -X POST http://localhost:8080/payment/process-partial \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order_id": "SALE-001",
    "amount_paid": 50000.00,
    "payment_method_id": 1,
    "payment_reference": "TEST-001",
    "notes": "Pago de prueba"
  }'
```

---

## 📊 Modelos de Datos Principales

### PaymentDetail

```typescript
interface PaymentDetail {
  amount_paid: number;           // Monto pagado en esta transacción
  outstanding_amount: number;    // Monto pendiente después del pago
  total_paid_so_far: number;    // Total pagado hasta ahora
  total_order_amount: number;   // Monto total de la orden
  payment_status: 'partial' | 'complete' | 'overpaid';
  order_fully_paid: boolean;    // Si la orden está completamente pagada
}
```

### PurchasePaymentSummary

```typescript
interface PurchasePaymentSummary {
  total_paid: number;
  outstanding_amount: number;
  payment_count: number;
  last_payment_date?: string;
  payment_status: 'unpaid' | 'partial' | 'complete' | 'overpaid';
  is_fully_paid: boolean;
}
```

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `VALIDATION_FAILED` | Datos de entrada inválidos |
| `SUPPLIER_NOT_FOUND` | Proveedor no existe |
| `PRODUCT_NOT_FOUND` | Producto no existe |
| `PAYMENT_METHOD_NOT_FOUND` | Método de pago no válido |
| `CURRENCY_NOT_FOUND` | Divisa no válida |
| `INSUFFICIENT_PERMISSIONS` | Usuario sin permisos |
| `INVALID_AMOUNT` | Monto de pago inválido |
| `PURCHASE_ORDER_NOT_FOUND` | Orden de compra no existe |
| `ALREADY_CANCELLED` | Orden ya cancelada |
| `PAYMENT_EXCEEDS_BALANCE` | Pago excede saldo pendiente |

### Estructura de Error Estándar

```json
{
  "success": false,
  "message": "Human readable error message",
  "error_code": "ERROR_CODE",
  "details": "Additional technical details",
  "timestamp": "2025-08-23T20:30:00Z"
}
```

## 🔄 Flujo de Trabajo Recomendado

### 1. Procesar Pagos (múltiples pagos permitidos)

```bash
POST /purchase/complete → {purchase_order_id} (función completa integrada)
POST /purchase/payment/process (parcial)
POST /purchase/payment/process (completar)
```

### 2. Monitoreo y Análisis

```bash
GET /purchase/payment/statistics (periódicamente)
```

## 📋 Notas para el Equipo Frontend

1. **Validación de Campos**: Todos los endpoints incluyen validación del lado del servidor, pero se recomienda validación del lado cliente para mejor UX.

2. **Montos Decimales**: Los campos `quantity` y todos los montos soportan decimales. Usar bibliotecas apropiadas para manejo de precisión decimal.

3. **Estados de Pago**: El sistema maneja estados `partial`, `complete` y `overpaid` automáticamente.

4. **Metadatos Flexibles**: El campo `metadata` acepta cualquier JSON válido para datos adicionales específicos del negocio.

5. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC).

6. **IDs de Productos**: Los product_id son strings para máxima flexibilidad.

7. **Consistencia con Sales**: La API sigue exactamente el mismo patrón que el sistema de ventas para facilitar el desarrollo.

## 🔗 Endpoints Relacionados

- **Proveedores**: `/supplier/*` para obtener información de proveedores
- **Productos**: `/product/*` para validar productos
- **Métodos de Pago**: `/payment-method/*` para opciones de pago
- **Divisas**: `/currency/*` para información de divisas
- **Usuarios**: `/user/*` para información de usuarios

---

**Última actualización**: 23 de Agosto de 2025
**Versión API**: 1.0
**Patrón**: Siguiendo Sales Payment System

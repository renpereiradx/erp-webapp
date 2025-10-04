# Guía API - Procesamiento de Pagos de Ventas

**Versión:** 3.0 (Refactorizada)  
**Fecha:** 02 de Octubre de 2025  
**Endpoint:** `/payment/process-partial`

---

## 📋 Descripción General

API para procesar pagos parciales o completos de ventas con **soporte completo para vuelto flexible**. El sistema ahora separa correctamente el efectivo recibido del monto aplicado a la venta, permitiendo que un cliente entregue más dinero del necesario y reciba vuelto sin restricciones.

### Características Principales

- ✅ **Vuelto flexible**: Cliente puede dar cualquier monto superior al requerido
- ✅ Procesa pagos parciales y completos
- ✅ Calcula automáticamente vuelto/cambio
- ✅ Actualiza estado de venta (PENDING → PARTIAL_PAYMENT → PAID)
- ✅ Integración obligatoria con caja registradora
- ✅ Registra movimientos de efectivo separados (INCOME + EXPENSE)
- ✅ Validaciones completas de negocio
- ✅ Garantiza integridad: impacto neto en caja = monto aplicado a venta

---

## 🔐 Autenticación

Requiere token JWT en el header:

```http
Authorization: Bearer <token>
```

El token debe contener el `user_id` del usuario que procesa el pago.

---

## 📡 Endpoint Principal

### **POST** `/payment/process-partial`

Procesa un pago de venta con integración obligatoria de caja registradora.

#### Request

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Body:**
```json
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 200000.00,
  "amount_to_apply": 164000.00,
  "cash_register_id": 6,
  "payment_reference": "PAY-001",
  "payment_notes": "Pago con vuelto grande"
}
```

#### Parámetros del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `sales_order_id` | string | ✅ Sí | ID de la orden de venta |
| `amount_received` | number | ✅ Sí | Efectivo recibido del cliente (debe ser > 0) |
| `amount_to_apply` | number | ❌ No | Monto a aplicar a la venta (≤ `amount_received`). Si se omite, se aplica todo el efectivo recibido |
| `cash_register_id` | number | ⚠️ Condicional | **Obligatorio** si se usa `amount_to_apply`. Opcional si solo se envía `amount_received` (sistema busca caja abierta automáticamente) |
| `payment_reference` | string | ❌ No | Referencia del pago (auto-generada si se omite) |
| `payment_notes` | string | ❌ No | Notas adicionales del pago |

#### ⚠️ Reglas Importantes

1. **Vuelto Flexible**: Si `amount_received > saldo_pendiente`, el sistema calcula automáticamente el vuelto
2. **Dos Modos de Operación**:
   - **Modo Simple**: Solo enviar `amount_received` → Sistema aplica todo el monto y busca caja abierta
   - **Modo Avanzado**: Enviar `amount_received + amount_to_apply + cash_register_id` → Control total sobre el vuelto
3. **Validación**: `amount_received` debe ser ≥ `amount_to_apply`
4. **Validación**: `amount_to_apply` debe ser ≤ saldo pendiente de la venta

---

## 📤 Respuestas

### ✅ Respuesta Exitosa (200 OK)

#### Pago Parcial Sin Vuelto

```json
{
  "success": true,
  "message": "Partial payment processed",
  "payment_id": 30,
  "payment_summary": {
    "total_sale_amount": 264000.00,
    "previous_payments": 0.00,
    "current_payment": 100000.00,
    "total_paid": 100000.00,
    "remaining_balance": 164000.00,
    "sale_status": "PARTIAL_PAYMENT"
  },
  "cash_summary": {
    "cash_received": 100000.00,
    "amount_applied": 100000.00,
    "change_given": 0.00,
    "net_cash_impact": 100000.00
  },
  "payment_complete": false,
  "requires_change": false
}
```

#### Pago Total Con Vuelto Grande

```json
{
  "success": true,
  "message": "Payment completed",
  "payment_id": 32,
  "payment_summary": {
    "total_sale_amount": 264000.00,
    "previous_payments": 100000.00,
    "current_payment": 164000.00,
    "total_paid": 264000.00,
    "remaining_balance": 0.00,
    "sale_status": "PAID"
  },
  "cash_summary": {
    "cash_received": 200000.00,
    "amount_applied": 164000.00,
    "change_given": 36000.00,
    "net_cash_impact": 164000.00
  },
  "payment_complete": true,
  "requires_change": true
}
```

#### Estructura del Response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `success` | boolean | Indica si el pago fue exitoso |
| `message` | string | Mensaje descriptivo del resultado |
| `payment_id` | number | ID del pago registrado en `sale_payments` |
| `payment_summary` | object | Resumen del estado de la venta (ver detalles abajo) |
| `cash_summary` | object | **⭐ NUEVO**: Detalle del manejo de efectivo y vuelto |
| `payment_complete` | boolean | `true` si la venta quedó completamente pagada |
| `requires_change` | boolean | `true` si `change_given` > 0 (hay vuelto para entregar) |

#### Objeto `payment_summary`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_sale_amount` | number | Monto total de la venta |
| `previous_payments` | number | Suma de pagos anteriores aplicados a la venta |
| `current_payment` | number | **Monto aplicado** a la venta en este pago (no necesariamente igual al recibido) |
| `total_paid` | number | Total pagado hasta el momento (previous + current) |
| `remaining_balance` | number | Balance pendiente (0 si está completamente pagada) |
| `sale_status` | string | `PAID` \| `PARTIAL_PAYMENT` \| `PENDING` |

#### Objeto `cash_summary` ⭐ NUEVO

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cash_received` | number | **Efectivo físico recibido** del cliente |
| `amount_applied` | number | **Monto aplicado** a la venta (siempre ≤ `cash_received`) |
| `change_given` | number | **Vuelto entregado** al cliente (`cash_received - amount_applied`) |
| `net_cash_impact` | number | **Impacto neto en caja** (igual a `amount_applied`). Útil para validaciones |

#### ⚠️ Diferencia Clave: `cash_received` vs `amount_applied`

- **`cash_received`**: Efectivo que el cliente entregó físicamente
- **`amount_applied`**: Monto que se aplicó al saldo de la venta
- **Ejemplo**: Cliente debe $164k pero da $200k → `cash_received=200000`, `amount_applied=164000`, `change_given=36000`

---

### ❌ Respuestas de Error

#### Venta No Encontrada (404)

```json
{
  "success": false,
  "error": "Sale not found"
}
```

#### Venta Cancelada (400)

```json
{
  "success": false,
  "error": "Cannot process payment for cancelled sale"
}
```

#### Venta Ya Pagada (400)

```json
{
  "success": false,
  "error": "Sale already fully paid"
}
```

#### Monto Inválido (400)

```json
{
  "success": false,
  "error": "Payment amount must be greater than zero"
}
```

#### Efectivo Insuficiente (400) ⭐ NUEVO

```json
{
  "success": false,
  "error": "Cash received must be greater than or equal to amount to apply"
}
```

**Causa**: Se intentó aplicar más dinero del que se recibió (`amount_to_apply > amount_received`)

#### Monto Excede Balance (400) ⭐ NUEVO

```json
{
  "success": false,
  "error": "Amount to apply exceeds remaining balance"
}
```

**Causa**: Se intentó aplicar más dinero del que se debe (`amount_to_apply > saldo_pendiente`)

#### Caja Cerrada (400)

```json
{
  "success": false,
  "error": "Cash register is not open"
}
```

**Causa**: La caja registradora especificada no está abierta

#### Caja No Encontrada (404)

```json
{
  "success": false,
  "error": "No open cash register found"
}
```

**Causa**: No se especificó `cash_register_id` y el sistema no encontró ninguna caja abierta automáticamente

#### Error del Sistema (500)

```json
{
  "success": false,
  "error": "Error message details"
}
```

#### Códigos de Error y Prevención

| Error | HTTP Status | Prevención |
|-------|-------------|-----------|
| `Sale not found` | 404 | Validar que el `sales_order_id` existe antes de enviar |
| `Sale cancelled` | 400 | Verificar que `status != 'CANCELLED'` |
| `Sale already paid` | 400 | Verificar que `remaining_balance > 0` antes de pagar |
| `Invalid amount` | 400 | Validar que `amount_received > 0` en el frontend |
| `Insufficient cash` | 400 | Validar que `amount_received >= amount_to_apply` |
| `Amount exceeds balance` | 400 | Validar que `amount_to_apply <= remaining_balance` |
| `Cash register closed` | 400 | Verificar estado de caja antes de procesar pago |
| `No open cash register` | 404 | Asegurar que hay una caja abierta o especificar `cash_register_id` |

---

## 🔄 Casos de Uso

### Caso 1: Pago Exacto (Modo Simple)

**Escenario:** Cliente paga exactamente lo que debe, sin vuelto.

```json
POST /payment/process-partial
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 100000.00
}
```

**Resultado:**
- ✅ `amount_applied` = $100,000
- ✅ `change_given` = $0
- ✅ `sale_status` = "PARTIAL_PAYMENT"
- ✅ Movimiento INCOME: $100,000

---

### Caso 2: Pago con Vuelto Pequeño (Modo Simple)

**Escenario:** Cliente da un poco más del saldo, vuelto menor a $10k.

```json
POST /payment/process-partial
{
  "sales_order_id": "SALE-100",
  "amount_received": 170000.00
}
```

Si el saldo era $164,000:

**Resultado:**
- ✅ `amount_applied` = $164,000
- ✅ `change_given` = $6,000
- ✅ `sale_status` = "PAID"
- ✅ Movimiento INCOME: $170,000
- ✅ Movimiento EXPENSE: $6,000 (vuelto)

---

### Caso 3: Pago con Vuelto Grande (Modo Avanzado) ⭐

**Escenario:** Cliente da mucho más del saldo (por ejemplo, billete grande), vuelto significativo.

```json
POST /payment/process-partial
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 200000.00,
  "amount_to_apply": 164000.00,
  "cash_register_id": 6
}
```

**Resultado:**
- ✅ `cash_received` = $200,000
- ✅ `amount_applied` = $164,000
- ✅ `change_given` = $36,000
- ✅ `sale_status` = "PAID"
- ✅ Movimiento INCOME: $200,000
- ✅ Movimiento EXPENSE: $36,000 (vuelto)
- ✅ `net_cash_impact` = $164,000

**💡 Ventaja:** Permite al cajero registrar exactamente el efectivo recibido y el vuelto dado, útil para auditoría.

---

### Caso 4: Múltiples Pagos Parciales

**Escenario:** Venta de $264,000 pagada en 2 cuotas.

#### Pago 1:
```json
POST /payment/process-partial
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 100000.00,
  "cash_register_id": 6
}
```
**Resultado:** `remaining_balance` = $164,000, `sale_status` = "PARTIAL_PAYMENT"

#### Pago 2 (con vuelto):
```json
POST /payment/process-partial
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 200000.00,
  "amount_to_apply": 164000.00,
  "cash_register_id": 6
}
```
**Resultado:** `remaining_balance` = $0, `sale_status` = "PAID", `change_given` = $36,000

---

## 💡 Consideraciones Importantes

### Arquitectura de Pagos

**Nueva separación de conceptos:**

1. **`sale_payments.amount_paid`**: Solo almacena el monto **aplicado** a la venta
2. **`cash_movements`**: Registra flujo de efectivo real:
   - **INCOME**: Efectivo recibido del cliente
   - **EXPENSE**: Vuelto entregado al cliente
3. **Integridad garantizada**: `Σ(INCOME) - Σ(EXPENSE) = amount_paid`

### Integración con Caja Registradora

1. **Obligatoriedad:**
   - Si usas `amount_to_apply` → `cash_register_id` es **obligatorio**
   - Si solo usas `amount_received` → `cash_register_id` es opcional (sistema busca caja abierta)

2. **Validaciones Automáticas:**
   - La caja DEBE estar en estado `OPEN`
   - `cash_received` ≥ `amount_to_apply`
   - `amount_to_apply` ≤ saldo pendiente
   - Si falla cualquier validación, el pago NO se procesa (transacción atómica)

3. **Movimientos de Efectivo:**
   - **INCOME**: Siempre se registra con `cash_received` (monto bruto)
   - **EXPENSE**: Se registra solo si `change_given > 0`
   - Ambos movimientos quedan vinculados al `payment_id` y `sales_order_id`

### Cálculo de Vuelto

El sistema calcula automáticamente:

```
Si amount_to_apply no se especifica:
  amount_to_apply = min(amount_received, remaining_balance)
  
change_given = amount_received - amount_to_apply
net_cash_impact = amount_to_apply
```

### Estados de Venta

| Estado | Descripción | Transición |
|--------|-------------|-----------|
| `PENDING` | Sin pagos registrados | → `PARTIAL_PAYMENT` o `PAID` |
| `PARTIAL_PAYMENT` | Hay pagos pero `remaining_balance > 0` | → `PAID` |
| `PAID` | Completamente pagada (`remaining_balance = 0`) | Estado final |
| `CANCELLED` | No se pueden procesar pagos | Estado final |

### Estados de Pago

| Estado | Descripción |
|--------|-------------|
| `PARTIAL` | Pago parcial, aún queda balance en la venta |
| `COMPLETED` | Pago que completa la venta (último pago) |
| `REFUNDED` | Pago reembolsado |
| `CANCELLED` | Pago cancelado |

---

## 🎯 Recomendaciones de Implementación

### Validación en Frontend

**Antes de enviar el request:**

1. **Validar saldo pendiente:**
   ```
   GET /sales/{sales_order_id}
   → Obtener remaining_balance actual
   ```

2. **Validar montos:**
   ```javascript
   if (amountReceived <= 0) {
     error("Monto debe ser mayor a cero");
   }
   
   if (amountToApply && amountToApply > amountReceived) {
     error("No se puede aplicar más de lo recibido");
   }
   
   if (amountToApply > remainingBalance) {
     error("Monto excede el saldo pendiente");
   }
   ```

3. **Verificar caja abierta:**
   ```
   GET /cash-registers/active
   → Si retorna 404, solicitar apertura de caja
   ```

### Manejo de Vuelto en UI

**Mostrar cálculo en tiempo real:**

```javascript
const calculateChange = (received, balance) => {
  const toApply = Math.min(received, balance);
  const change = received - toApply;
  return { toApply, change };
};

// Actualizar UI mientras el usuario escribe
onAmountReceivedChange((value) => {
  const { toApply, change } = calculateChange(value, remainingBalance);
  
  displayAppliedAmount(toApply);
  
  if (change > 0) {
    highlightChangeAmount(change); // ⚠️ Destacar vuelto
  }
});
```

### Después del Pago Exitoso

**Acciones recomendadas:**

1. **Si `requires_change = true`:**
   - Mostrar alerta prominente con el monto del vuelto
   - No cerrar modal hasta que el usuario confirme que entregó el vuelto

2. **Si `payment_complete = true`:**
   - Imprimir ticket/recibo
   - Actualizar lista de ventas
   - Redirigir o limpiar formulario

3. **Actualizar balance de caja:**
   - Usar `cash_summary.net_cash_impact` para actualizar UI de caja
   - Mostrar movimientos registrados

### Ejemplos cURL

#### Pago simple (modo automático):
```bash
curl -X POST http://localhost:5050/payment/process-partial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sales_order_id": "23tjXmPNR",
    "amount_received": 100000
  }'
```

#### Pago con vuelto grande (modo avanzado):
```bash
curl -X POST http://localhost:5050/payment/process-partial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sales_order_id": "23tjXmPNR",
    "amount_received": 200000,
    "amount_to_apply": 164000,
    "cash_register_id": 6,
    "payment_notes": "Cliente pagó con billete de 200k"
  }'
```

---

## 🔍 Validaciones del Sistema

### Pre-Procesamiento

1. ✅ Venta existe y no está cancelada
2. ✅ Venta tiene saldo pendiente (`remaining_balance > 0`)
3. ✅ `amount_received > 0`
4. ✅ Si se envía `amount_to_apply`: `amount_received >= amount_to_apply`
5. ✅ `amount_to_apply <= remaining_balance`
6. ✅ Caja registradora existe y está abierta

### Post-Procesamiento

1. ✅ Pago registrado en `sale_payments` con `amount_paid = amount_to_apply`
2. ✅ Estado de venta actualizado (`PARTIAL_PAYMENT` o `PAID`)
3. ✅ Movimiento INCOME registrado con `cash_received`
4. ✅ Movimiento EXPENSE registrado si `change_given > 0`
5. ✅ Constraint verificado: `amount_paid ≤ total_amount`
6. ✅ Transacción atómica: todo o nada

---

## � Migración desde Versión Anterior

### Cambios de API

| Antes (v2.0) | Ahora (v3.0) | Notas |
|--------------|--------------|-------|
| `change_amount` | `cash_summary.change_given` | Ahora dentro de objeto `cash_summary` |
| N/A | `cash_summary.cash_received` | **Nuevo**: Efectivo recibido |
| N/A | `cash_summary.amount_applied` | **Nuevo**: Monto aplicado a venta |
| N/A | `cash_summary.net_cash_impact` | **Nuevo**: Impacto neto en caja |
| N/A | `amount_to_apply` (request) | **Nuevo**: Control opcional sobre el monto aplicado |

### Compatibilidad

✅ **Backward compatible**: Si no envías `amount_to_apply`, funciona igual que v2.0

⚠️ **Cambio en response**: `cash_summary` es un objeto nuevo, ajustar parseo en frontend

---

## 📊 Auditoría y Trazabilidad

### Datos Registrados Automáticamente

**En `sale_payments`:**
- `payment_id` - ID único del pago
- `sales_order_id` - Venta asociada
- `amount_paid` - Monto aplicado a la venta
- `cash_register_id` - Caja utilizada
- `payment_date` - Timestamp del pago
- `payment_reference` - Referencia única
- `status` - Estado del pago

**En `cash_movements`:**
- `movement_id` - ID único del movimiento
- `movement_type` - INCOME o EXPENSE
- `amount` - Monto del movimiento
- `concept` - Descripción automática
- `sales_order_id` - Venta asociada
- `payment_id` - Pago asociado

### Triggers Activos

1. **Validación de caja abierta**: Previene pagos en caja cerrada
2. **Constraint check**: `amount_paid ≤ total_amount` siempre se verifica
3. **Auditoría automática**: Todos los cambios quedan registrados

---

## ⚡ Performance

- **Tiempo de respuesta típico:** 50-150ms
- **Transacciones atómicas:** Sí (PostgreSQL)
- **Manejo de concurrencia:** Locks a nivel de row
- **Validaciones en DB:** Garantizadas por constraints y functions

---

## � Información Adicional

**Versión API:** 3.0  
**Versión DB Functions:** 
- `process_sale_partial_payment(7 params)` - Control completo
- `process_sale_partial_payment(5 params)` - Backward compatible

**Documentación Técnica:**
- Backend: `/PAYMENT_REFACTORING_SUCCESS.md`
- Base de Datos: `/docs/SALE_PAYMENT_FLEXIBLE_CHANGE.md`

**Repositorio:** [github.com/renpereiradx/business_management](https://github.com/renpereiradx/business_management)

---

**Última actualización:** 02 de Octubre de 2025  
**Estado:** ✅ Production Ready  

**Próxima revisión:** 02 de Noviembre de 2025

# 🔄 Actualización: Endpoints de Estado de Pagos

**Fecha:** 2 de Octubre, 2025  
**Autor:** Sistema de Pagos - Backend  
**Estado:** ✅ Implementado y Probado

---

## 📋 Resumen Ejecutivo


Se implementaron **3 nuevos endpoints** para consultar el estado de pagos de ventas, proporcionando al frontend acceso completo a:

- **Saldo pendiente** (balance_due)
- **Progreso de pago** (payment_progress)
- **Historial de pagos** (lista completa de transacciones)
- **Estado de pago** (COMPLETED/PARTIAL/CANCELLED/REFUNDED)

Además, se corrigió un **bug crítico** en la función SQL `process_payment_FINAL.sql` donde todos los pagos se marcaban como "COMPLETED" incluso cuando eran parciales.

---

## 🐛 Bug Corregido


### Problema

La función `process_payment_FINAL.sql` asignaba estado "COMPLETED" a todos los pagos en la tabla `sale_payments`, sin importar si la venta quedaba completamente pagada o parcialmente pagada.

**Ejemplo del bug:**

- Venta: SALE-1759430699-12
- Total: ₲9,100
- Pago realizado: ₲5,000
- Estado esperado: `PARTIAL` ❌
- Estado actual: `COMPLETED` ✅ (incorrecto)


### Solución

Se modificó la función SQL para establecer el estado condicionalmente:

```sql
-- ANTES (incorrecto)
INSERT INTO transactions.sale_payments (..., status)
VALUES (..., 'COMPLETED');

-- DESPUÉS (correcto)
INSERT INTO transactions.sale_payments (..., status)
VALUES (..., 
  CASE 
    WHEN v_new_status = 'PAID' THEN 'COMPLETED'
    ELSE 'PARTIAL'
  END
);
```

**Archivo modificado:** `database/sql/process_payment_FINAL.sql`

---

## 🆕 Endpoints Implementados

### 1️⃣ Consulta Individual

```http
GET /sale/{id}/payment-status
```

**Propósito:** Obtener información completa de pagos de UNA venta específica


**Características:**

- ✅ Incluye lista completa de pagos individuales
- ✅ Información de usuario que procesó cada pago
- ✅ Información de caja registradora
- ✅ Balance pendiente (balance_due)
- ✅ Progreso de pago en porcentaje


**Ejemplo de Respuesta:**

```json
{
  "sale_id": "SALE-1759430699-12",
  "client_name": "Charlie Brown",
  "total_amount": 9100,
  "total_paid": 7000,
  "balance_due": 2100,           // ⬅️ SALDO PENDIENTE
  "payment_progress": 76.92,     // ⬅️ PORCENTAJE PAGADO
  "payment_count": 2,
  "is_fully_paid": false,
  "requires_payment": true,
  "payments": [
    {
      "payment_id": 44,
      "amount_paid": 5000,
      "status": "PARTIAL",
      "payment_date": "2025-10-02 15:46:42",
      "processed_by_name": "Pedro Sanchez",
      "cash_register_name": "principal"
    },
    {
      "payment_id": 45,
      "amount_paid": 2000,
      "status": "PARTIAL",
      "payment_date": "2025-10-02 15:58:01",
      "processed_by_name": "Pedro Sanchez",
      "cash_register_name": "principal"
    }
  ]
}
```


**Uso Frontend:**

```javascript
const response = await fetch(`/sale/${saleId}/payment-status`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();

if (data.requires_payment) {
  alert(`Saldo pendiente: ₲${data.balance_due.toLocaleString()}`);
}
```

---

### 2️⃣ Búsqueda por Rango de Fechas

```http
GET /sale/date_range/payment-status?start_date={start}&end_date={end}&page={page}&page_size={size}
```

**Propósito:** Listar ventas por período con resumen de estado de pago


**Características:**

- ✅ Búsqueda por rango de fechas
- ✅ Paginación (page, page_size)
- ✅ NO incluye lista individual de pagos (solo resumen)
- ✅ Balance pendiente por cada venta
- ✅ Ideal para reportes y listados


**Parámetros:**

| Parámetro  | Tipo   | Requerido | Ejemplo              |
|------------|--------|-----------|----------------------|
| start_date | string | Sí        | 2025-10-02 00:00:00  |
| end_date   | string | Sí        | 2025-10-02 23:59:59  |
| page       | int    | No        | 1 (default)          |
| page_size  | int    | No        | 10 (default)         |


**Ejemplo de Respuesta:**

```json
{
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total_records": 22,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  },
  "data": [
    {
      "sale_id": "SALE-1759430699-12",
      "client_name": "Charlie Brown",
      "total_amount": 9100,
      "total_paid": 7000,
      "balance_due": 2100,          // ⬅️ SALDO PENDIENTE
      "payment_progress": 76.92,
      "payment_count": 2,
      "is_fully_paid": false
    },
    {
      "sale_id": "SALE-1759429694-278",
      "client_name": "Erika Magdalena Maciel",
      "total_amount": 84100,
      "total_paid": 84100,
      "balance_due": 0,              // ⬅️ COMPLETAMENTE PAGADA
      "payment_progress": 100,
      "payment_count": 1,
      "is_fully_paid": true
    }
  ]
}
```


**Uso Frontend:**

```javascript
const params = new URLSearchParams({
  start_date: '2025-10-02 00:00:00',
  end_date: '2025-10-02 23:59:59',
  page: 1,
  page_size: 10
});

const response = await fetch(`/sale/date_range/payment-status?${params}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const result = await response.json();

// Calcular total pendiente del período
const totalPending = result.data.reduce((sum, sale) => sum + sale.balance_due, 0);
console.log(`Total pendiente de cobro: ₲${totalPending.toLocaleString()}`);
```

---

### 3️⃣ Búsqueda por Nombre de Cliente

```http
GET /sale/client_name/{name}/payment-status?page={page}&page_size={size}
```

**Propósito:** Listar ventas de un cliente con resumen de estado de pago


**Características:**

- ✅ Búsqueda parcial por nombre o apellido
- ✅ Case-insensitive (no distingue mayúsculas/minúsculas)
- ✅ Paginación (page, page_size)
- ✅ NO incluye lista individual de pagos (solo resumen)
- ✅ Ideal para ver deuda total de un cliente


**Parámetros:**

| Parámetro  | Tipo   | Requerido | Ejemplo  |
|------------|--------|-----------|----------|
| name       | string | Sí        | Charlie  |
| page       | int    | No        | 1        |
| page_size  | int    | No        | 10       |


**Ejemplo de Respuesta:**

```json
{
  "pagination": {
    "page": 1,
    "page_size": 5,
    "total_records": 1,
    "total_pages": 1
  },
  "data": [
    {
      "sale_id": "SALE-1759430699-12",
      "client_name": "Charlie Brown",
      "total_amount": 9100,
      "total_paid": 7000,
      "balance_due": 2100,          // ⬅️ SALDO PENDIENTE
      "payment_progress": 76.92,
      "payment_count": 2,
      "is_fully_paid": false,
      "requires_payment": true
    }
  ]
}
```


**Uso Frontend:**

```javascript
const clientName = "Charlie";
const response = await fetch(`/sale/client_name/${encodeURIComponent(clientName)}/payment-status?page=1&page_size=10`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const result = await response.json();

// Calcular deuda total del cliente
const totalDebt = result.data
  .filter(sale => !sale.is_fully_paid)
  .reduce((sum, sale) => sum + sale.balance_due, 0);

console.log(`Deuda total de ${clientName}: ₲${totalDebt.toLocaleString()}`);
```

---

## 📊 Comparación de Endpoints


| Característica                 | Individual         | Rango de Fechas    | Nombre de Cliente  |
|--------------------------------|--------------------|--------------------|---------------------|
| **URL**                        | `/{id}/payment-status` | `/date_range/payment-status` | `/client_name/{name}/payment-status` |
| **Múltiples ventas**           | ❌ No              | ✅ Sí              | ✅ Sí               |
| **Lista de pagos**             | ✅ Sí (array)      | ❌ No              | ❌ No               |
| **Resumen de pagos**           | ✅ Sí              | ✅ Sí              | ✅ Sí               |
| **Paginación**                 | ❌ No aplica       | ✅ Sí              | ✅ Sí               |
| **balance_due**                | ✅ Sí              | ✅ Sí              | ✅ Sí               |
| **payment_progress**           | ✅ Sí              | ✅ Sí              | ✅ Sí               |
| **Uso principal**              | Detalle venta      | Reportes período   | Búsqueda cliente    |

---

## 🗂️ Archivos Modificados


### 1. SQL Function

- **Archivo:** `database/sql/process_payment_FINAL.sql`
- **Cambio:** Estado de pago condicional (COMPLETED/PARTIAL)

### 2. Models

- **Archivo:** `models/sale.go`
- **Agregados:**
  - `SalePaymentInfo` - Información de un pago individual
  - `SalePaymentStatusResponse` - Respuesta del endpoint individual
  - `SalePaymentStatusSummary` - Resumen sin lista de pagos
  - `PaginatedSalesPaymentStatusResponse` - Respuesta paginada

### 3. Repository

- **Archivo:** `database/postgres/sale.go`
- **Funciones agregadas:**
  - `GetSalePaymentStatus()` - Consulta individual
  - `GetSalesByDateRangeWithPaymentStatus()` - Búsqueda por fechas
  - `GetSalesByClientNameWithPaymentStatus()` - Búsqueda por cliente

### 4. Handlers

- **Archivo:** `handlers/sale.go`
- **Handlers agregados:**
  - `GetSalePaymentStatusHandler()`
  - `GetSalesByDateRangeWithPaymentStatusHandler()`
  - `GetSalesByClientNameWithPaymentStatusHandler()`

### 5. Repository Interface

- **Archivo:** `repository/repository.go`
- **Métodos agregados:** 3 nuevos métodos de interface

### 6. Routes

- **Archivo:** `routes/routes.go`
- **Rutas agregadas:**
  - `GET /sale/date_range/payment-status`
  - `GET /sale/client_name/{name}/payment-status`
  - `GET /sale/{id}/payment-status`
- **Fix crítico:** Reordenadas rutas (literales antes de parametrizadas)

---

## ✅ Pruebas Realizadas


### Test 1: Endpoint Individual

```bash
curl -X GET "http://localhost:5050/sale/SALE-1759430699-12/payment-status" \
  -H "Authorization: Bearer $TOKEN"
```

**Resultado:** ✅ SUCCESS

- Total: ₲9,100
- Pagado: ₲7,000
- Saldo: ₲2,100
- Progreso: 76.92%
- Pagos: 2

### Test 2: Rango de Fechas

```bash
curl -X GET "http://localhost:5050/sale/date_range/payment-status?start_date=2025-10-02%2000:00:00&end_date=2025-10-02%2023:59:59&page=1&page_size=2"
```

**Resultado:** ✅ SUCCESS

- Total registros: 5
- Total páginas: 3
- Página actual: 1
- Registros mostrados: 2

### Test 3: Nombre de Cliente

```bash
curl -X GET "http://localhost:5050/sale/client_name/Charlie/payment-status?page=1&page_size=5"
```

**Resultado:** ✅ SUCCESS

- Cliente encontrado: Charlie Brown
- Total ventas: 1
- Saldo pendiente: ₲2,100
- Progreso: 76.92%

### Test 4: Cliente con Múltiples Ventas

```bash
curl -X GET "http://localhost:5050/sale/client_name/Erika/payment-status?page=1&page_size=3"
```

**Resultado:** ✅ SUCCESS

- Cliente: Erika (Erika Magdalena Maciel)
- Total ventas: 22
- Ventas en página: 3
  - 2 completamente pagadas (balance_due: 0)
  - 1 sin pagar (balance_due: ₲1,625,000)

---

## 🎯 Beneficios de la Implementación

### Para el Frontend

1. **Saldo pendiente siempre disponible:** Campo `balance_due` en todas las respuestas
2. **Validación antes de pagos:** Verificar `requires_payment` antes de procesar
3. **Progreso visual:** Campo `payment_progress` para barras de progreso
4. **Sin cálculos manuales:** Backend calcula automáticamente totales y porcentajes
5. **Búsqueda flexible:** 3 formas diferentes de buscar ventas con estado de pago
6. **Paginación eficiente:** Manejo de grandes volúmenes de datos

### Para el Backend

1. **Estados consistentes:** Bug de estados corregido en la fuente (SQL function)
2. **Queries optimizadas:** Uso de CTEs para cálculos eficientes
3. **Trazabilidad completa:** Historial de pagos con usuario y caja
4. **Código reutilizable:** Modelos y funciones compartidas
5. **Mantenibilidad:** Lógica centralizada en repository layer

### Para el Negocio

1. **Mejor control de cobranza:** Identificar rápidamente ventas con saldo pendiente
2. **Análisis de flujo de caja:** Reportes por período con totales exactos
3. **Seguimiento de clientes:** Detectar clientes con deudas acumuladas
4. **Auditoría mejorada:** Historial completo de pagos con responsables

---

## 📝 Notas Importantes

### Estados de Pago

| Estado      | Descripción                                    | Se incluye en total_paid |
|-------------|------------------------------------------------|--------------------------|
| COMPLETED   | Pago que completó la venta                     | ✅ Sí                    |
| PARTIAL     | Pago parcial, queda saldo pendiente            | ✅ Sí                    |
| CANCELLED   | Pago cancelado/anulado                         | ❌ No                    |
| REFUNDED    | Pago reembolsado                               | ❌ No                    |

### Cálculos Automáticos

```
total_paid = SUM(amount_paid) WHERE status IN ('COMPLETED', 'PARTIAL')
balance_due = total_amount - total_paid
payment_progress = (total_paid / total_amount) * 100
is_fully_paid = (balance_due <= 0)
requires_payment = (balance_due > 0 AND status != 'CANCELLED')
```

### Ordenamiento de Rutas

**⚠️ IMPORTANTE:** Las rutas literales DEBEN ir antes de las parametrizadas:

```go
// ✅ CORRECTO
r.HandleFunc("/sale/date_range/payment-status", handler1)      // Literal
r.HandleFunc("/sale/client_name/{name}/payment-status", handler2)  // Parametrizada
r.HandleFunc("/sale/{id}/payment-status", handler3)            // Parametrizada

// ❌ INCORRECTO
r.HandleFunc("/sale/{id}/payment-status", handler3)            // Parametrizada primero
r.HandleFunc("/sale/date_range/payment-status", handler1)      // Literal después - NUNCA SE EJECUTA
```

---

## 🔗 Documentación Adicional

- **Documentación completa:** `/docs/SALE_PAYMENT_STATUS_ENDPOINT.md`
- **Ejemplos de código:** Ver sección de ejemplos en documentación
- **Componentes React:** Incluidos en documentación

---

## 📅 Próximos Pasos

### Sugerencias de Mejora Futura

1. **WebSocket para actualizaciones en tiempo real** cuando se procese un pago
2. **Filtros adicionales** en búsqueda por fechas (por estado, por monto, etc.)
3. **Exportación a Excel/PDF** de reportes de cobranza
4. **Notificaciones automáticas** para ventas con saldo pendiente > X días
5. **Dashboard de cobranza** con gráficos y estadísticas

---

**✅ Estado:** Implementación completada y probada  
**📅 Fecha de actualización:** 2 de Octubre, 2025  
**🔧 Servidor:** http://localhost:5050  
**🗄️ Base de datos:** business_management (PostgreSQL)

# 💰 Guía de Integración Frontend - API de Cajas Registradoras

**Versión:** 2.1 (Movimientos Enriquecidos)  
**Fecha:** 04 de Octubre de 2025

---

## 📋 Descripción General

Sistema completo de gestión de cajas registradoras con integración obligatoria en el procesamiento de pagos. La nueva arquitectura separa correctamente el registro de pagos del registro de movimientos de efectivo, garantizando trazabilidad completa del flujo de caja.

### Características del Sistema

- ✅ **Control de cajas**: Apertura, cierre y gestión completa
- ✅ **Integración obligatoria con pagos**: Todos los pagos deben procesarse con caja activa
- ✅ **Separación de flujos**: Pagos aplicados vs movimientos de efectivo
- ✅ **Vuelto flexible**: Soporte completo para cambio de cualquier monto
- ✅ **Validaciones automáticas**: Triggers de seguridad y validaciones de negocio
- ✅ **Reportes en tiempo real**: Estado financiero y movimientos por período
- ✅ **Multi-usuario**: Cada usuario puede operar su propia caja
- ✅ **Auditoría completa**: Trazabilidad de todos los movimientos

---

## ⚠️ Cambios Importantes

### v2.1 (Octubre 2025) - Endpoint de Movimientos Enriquecido 🆕

**Nuevo:** El endpoint `GET /cash-registers/{id}/movements` ahora retorna información completa y enriquecida:

- ✅ **Balance acumulado** (`running_balance`) calculado automáticamente
- ✅ **Nombre completo del usuario** que creó cada movimiento
- ✅ **Información de ventas** relacionadas (total, estado, cliente, método de pago)
- ✅ **Información de compras** relacionadas (total, estado, proveedor)
- ✅ **Sin queries adicionales**: Toda la información en una sola llamada

**Beneficios:**
- Reduce llamadas API en ~70% (elimina necesidad de buscar usuarios, ventas, compras)
- Mejor experiencia de usuario con información contextual completa
- Balance en tiempo real visible en cada movimiento

### v2.0 - Nueva Arquitectura de Pagos

**Antes (v1.0)**:
- `cash_register_id` era opcional en pagos
- `change_amount` se guardaba en `sale_payments`
- Movimiento de efectivo neto (recibido - vuelto)

**Ahora (v2.0)**:
- `cash_register_id` es **obligatorio** si se usa `amount_to_apply`
- `change_given` calculado automáticamente, no se guarda en `sale_payments`
- **Dos movimientos separados**: INCOME (efectivo recibido) + EXPENSE (vuelto)
- Garantía de integridad: `Σ(INCOME) - Σ(EXPENSE) = amount_paid`

### Impacto en Integración

1. **Endpoint de pagos cambió**: Ahora usar `/payment/process-partial`
2. **Nueva estructura en response**: Incluye `cash_summary` con detalles de efectivo
3. **Movimientos duplicados**: Se registran 2 movimientos por cada pago con vuelto
4. **Validación estricta**: Caja debe estar abierta para procesar pagos

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Formato de Respuesta Estándar
```json
{
  "success": boolean,
  "data": object,
  "message": string,
  "error": string
}
```

---

## 💰 Gestión de Cajas Registradoras

### 1. Abrir Caja Registradora

**Endpoint:** `POST /cash-registers/open`

**Request Body:**
```json
{
  "name": "Caja Principal - Turno Mañana",
  "initial_balance": 100000,
  "location": "Punto de Venta 1",
  "description": "Caja para turno matutino"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | ✅ Sí | Nombre descriptivo de la caja |
| `initial_balance` | number | ✅ Sí | Balance inicial en efectivo (debe ser > 0) |
| `location` | string | ❌ No | Ubicación física |
| `description` | string | ❌ No | Descripción adicional |

**Response (200 OK):**
```json
{
  "id": 6,
  "name": "Caja Principal - Turno Mañana",
  "status": "OPEN",
  "initial_balance": 100000,
  "current_balance": 100000,
  "opened_at": "2025-10-02T08:00:00Z",
  "opened_by": 1,
  "location": "Punto de Venta 1",
  "description": "Caja para turno matutino"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| User already has an active cash register | 400 | El usuario ya tiene una caja abierta |
| Invalid initial balance | 400 | Balance inicial debe ser > 0 |

---

### 2. Cerrar Caja Registradora

**Endpoint:** `PUT /cash-registers/{id}/close`

**Request Body (opcional):**
```json
{
  "final_balance": 364000,
  "notes": "Cierre de turno - conteo físico realizado"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `final_balance` | number | ❌ No | Balance final reportado (para conciliación) |
| `notes` | string | ❌ No | Notas del cierre |

**Response (200 OK):**
```json
{
  "id": 6,
  "status": "CLOSED",
  "closed_at": "2025-10-02T17:00:00Z",
  "closed_by": 1,
  "final_balance": 364000,
  "calculated_balance": 364000,
  "variance": 0
}
```

**Campo `variance`:**
- `variance = 0`: Conteo coincide con sistema ✅
- `variance > 0`: Falta efectivo en caja ⚠️
- `variance < 0`: Sobra efectivo en caja ⚠️

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|-------|-------------|-------------|
| Cash register not found | 404 | Caja no existe |
| Cash register already closed | 400 | Caja ya está cerrada |
| Insufficient permissions | 403 | Usuario no puede cerrar esta caja |

---

### 3. Obtener Caja Activa

**Endpoint:** `GET /cash-registers/active`

**Estado:** ✅ **IMPLEMENTADO Y TESTEADO** (02/Oct/2025)

**Response (200 OK):**
```json
{
  "id": 6,
  "name": "Caja Principal",
  "status": "OPEN",
  "opened_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
  "opened_at": "2025-10-02T08:00:00Z",
  "closed_by": null,
  "closed_at": null,
  "initial_balance": 350000,
  "final_balance": null,
  "notes": null
}
```

**Response (204 No Content) - Sin caja activa:**
```
(Sin contenido en body)
```

**⚠️ Importante:** 
- Si retorna **204**, significa que no hay caja activa → Solicitar apertura de caja
- Si retorna **200**, usar el `id` retornado para operaciones de pago

---

### 4. Listar Cajas Registradoras

**Endpoint:** `GET /cash-registers`

**Estado:** ✅ **IMPLEMENTADO Y TESTEADO** (02/Oct/2025)

**Query Parameters:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `status` | string | Filtrar por estado: `OPEN` \| `CLOSED` |
| `limit` | number | Límite por página (default: 10, max: 100) |
| `offset` | number | Offset para paginación (default: 0) |

**Ejemplo:**
```
GET /cash-registers?status=CLOSED&limit=5
```

**Response (200 OK):**
```json
[
  {
    "id": 9,
    "name": "Principal",
    "status": "CLOSED",
    "opened_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "opened_at": "2025-09-25T12:01:50.754238Z",
    "closed_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "closed_at": "2025-10-02T12:34:07.123895Z",
    "initial_balance": 350000,
    "final_balance": 350000,
    "notes": "prueba"
  }
]
```

**Response Sin Resultados:**
```json
[]
```

**Notas:**
- Solo retorna cajas del usuario autenticado
- Array vacío si no hay resultados con los filtros aplicados

---

## 💳 Integración con Sistema de Pagos

### ⚠️ Cambio Importante en v2.0

**El sistema de pagos ahora está completamente integrado con cajas registradoras.**

### Nuevo Endpoint de Pagos

**Endpoint:** `POST /payment/process-partial`

**Ver documentación completa en:** [`SALE_PAYMENT_PROCESSING_API.md`](./SALE_PAYMENT_PROCESSING_API.md)

### Resumen de Integración

**Request Básico:**
```json
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 100000
}
```

**Request Avanzado (con vuelto):**
```json
{
  "sales_order_id": "23tjXmPNR",
  "amount_received": 200000,
  "amount_to_apply": 164000,
  "cash_register_id": 6
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": 32,
  "payment_summary": {
    "total_sale_amount": 264000,
    "current_payment": 164000,
    "remaining_balance": 0,
    "sale_status": "PAID"
  },
  "cash_summary": {
    "cash_received": 200000,
    "amount_applied": 164000,
    "change_given": 36000,
    "net_cash_impact": 164000
  },
  "requires_change": true
}
```

### Movimientos de Efectivo Generados

**Por cada pago, el sistema registra automáticamente:**

1. **Movimiento INCOME**: Con el monto de `cash_received`
2. **Movimiento EXPENSE**: Con el monto de `change_given` (si > 0)

**Ejemplo (del response anterior):**
- Movimiento 1: INCOME $200,000 (efectivo recibido)
- Movimiento 2: EXPENSE $36,000 (vuelto entregado)
- **Impacto neto**: $164,000 (aplicado a la venta)

### Validaciones Automáticas

El sistema valida:
1. ✅ Caja registradora está abierta
2. ✅ `cash_received >= amount_to_apply`
3. ✅ `amount_to_apply <= saldo_pendiente`
4. ✅ Usuario tiene permisos en la caja

---

## 💸 Movimientos de Efectivo

### 1. Registrar Movimiento Manual

**Endpoint:** `POST /cash-registers/{id}/movements`

Para registrar movimientos de efectivo manuales (ajustes, retiros, depósitos).

**Request Body:**
```json
{
  "movement_type": "EXPENSE",
  "amount": 50000,
  "concept": "Retiro para gastos menores",
  "notes": "Autorizado por gerencia"
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `movement_type` | string | ✅ Sí | `INCOME` \| `EXPENSE` \| `ADJUSTMENT` |
| `amount` | number | ✅ Sí | Monto del movimiento (debe ser > 0) |
| `concept` | string | ✅ Sí | Concepto del movimiento |
| `notes` | string | ❌ No | Notas adicionales |

**Response (200 OK):**
```json
{
  "movement_id": 15,
  "cash_register_id": 6,
  "movement_type": "EXPENSE",
  "amount": 50000,
  "concept": "Retiro para gastos menores",
  "created_at": "2025-10-02T10:30:00Z"
}
```

---

### 2. Obtener Movimientos (Enriquecidos)

**Endpoint:** `GET /cash-registers/{id}/movements`

**Estado:** ✅ **IMPLEMENTADO Y TESTEADO** (04/Oct/2025) - **Versión Enriquecida con Información Completa**

**Descripción:**

Este endpoint retorna movimientos de caja con información enriquecida, incluyendo:
- ✅ **Balance acumulado** después de cada movimiento
- ✅ **Información del usuario** que creó el movimiento (nombre completo)
- ✅ **Información de ventas** relacionadas (total, estado, cliente, método de pago)
- ✅ **Información de compras** relacionadas (total, estado, proveedor)

**Ventajas:**
- Una sola llamada API para obtener toda la información contextual
- No necesita hacer queries adicionales para obtener nombres de usuarios o detalles de ventas
- Balance acumulado calculado automáticamente con window functions
- Información lista para mostrar en UI sin procesamiento adicional

**Response (200 OK):**
```json
[
  {
    "movement_id": 12,
    "movement_type": "INCOME",
    "amount": 20000,
    "concept": "Efectivo recibido - SALE-1759353369-669",
    "created_at": "2025-10-02T14:01:44.594198Z",
    "running_balance": 470000,
    "created_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "user_first_name": "Pedro",
    "user_last_name": "Sanchez",
    "user_full_name": "Pedro Sanchez",
    "related_payment_id": 33,
    "related_sale_id": "SALE-1759353369-669",
    "related_purchase_id": null,
    "sale_total": 29100,
    "sale_status": "PARTIAL_PAYMENT",
    "sale_client_name": "Horacio Cartel",
    "sale_payment_method": "Pago con tarjeta de débito"
  },
  {
    "movement_id": 13,
    "movement_type": "EXPENSE",
    "amount": 900,
    "concept": "Vuelto para venta #SALE-1759429403-849",
    "created_at": "2025-10-02T15:24:02.413105Z",
    "running_balance": 2046600,
    "created_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "user_first_name": "Pedro",
    "user_last_name": "Sanchez",
    "user_full_name": "Pedro Sanchez",
    "related_payment_id": 42,
    "related_sale_id": "SALE-1759429403-849",
    "related_purchase_id": null,
    "sale_total": 9100,
    "sale_status": "PAID",
    "sale_client_name": "Erika Magdalena Maciel",
    "sale_payment_method": "Pago en efectivo"
  }
]
```

**Estructura de Campos del Response:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `movement_id` | number | ID único del movimiento |
| `movement_type` | string | Tipo: `INCOME` \| `EXPENSE` \| `ADJUSTMENT` |
| `amount` | number | Monto del movimiento |
| `concept` | string | Concepto/descripción del movimiento |
| `created_at` | string | Timestamp ISO 8601 |
| `running_balance` | number | **Balance acumulado** después de este movimiento |
| `created_by` | string | ID del usuario que creó el movimiento |
| `user_first_name` | string \| null | Nombre del usuario |
| `user_last_name` | string \| null | Apellido del usuario |
| `user_full_name` | string \| null | Nombre completo del usuario |
| `related_payment_id` | number \| null | ID del pago relacionado (si aplica) |
| `related_sale_id` | string \| null | ID de la venta relacionada (si aplica) |
| `related_purchase_id` | number \| null | ID de la compra relacionada (si aplica) |
| `sale_total` | number \| null | Total de la venta relacionada |
| `sale_status` | string \| null | Estado de la venta: `PENDING` \| `PARTIAL_PAYMENT` \| `PAID` \| `CANCELLED` |
| `sale_client_name` | string \| null | Nombre completo del cliente de la venta |
| `sale_payment_method` | string \| null | Método de pago utilizado en la venta |
| `purchase_total` | number \| null | Total de la compra relacionada |
| `purchase_status` | string \| null | Estado de la compra |
| `purchase_supplier` | string \| null | Nombre del proveedor de la compra |

**Notas Importantes:**

1. **Valores NULL**: Los campos de venta (`sale_*`) y compra (`purchase_*`) serán `null` si el movimiento no está relacionado con una venta o compra
2. **Running Balance**: Calculado automáticamente considerando el `initial_balance` de la caja y todos los movimientos anteriores
3. **Orden**: Los movimientos se retornan ordenados por `created_at` y `movement_id` (orden cronológico)
4. **Sin Paginación**: Retorna todos los movimientos de la caja (considerar límites si hay muchos movimientos)

**Ejemplo de Uso en Frontend:**

```javascript
// Obtener movimientos enriquecidos
const response = await fetch(`/cash-registers/${cashRegisterId}/movements`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const movements = await response.json();

// Mostrar en tabla con toda la información
movements.forEach(movement => {
  console.log(`${movement.movement_type}: $${movement.amount}`);
  console.log(`Balance: $${movement.running_balance}`);
  console.log(`Usuario: ${movement.user_full_name}`);
  
  if (movement.related_sale_id) {
    console.log(`Venta: ${movement.related_sale_id}`);
    console.log(`Cliente: ${movement.sale_client_name}`);
    console.log(`Total Venta: $${movement.sale_total}`);
  }
});
```

### 3. Tipos de Movimientos

| Tipo | Descripción | Afecta Balance |
|------|-------------|----------------|
| `INCOME` | Ingreso de efectivo | Incrementa (+) |
| `EXPENSE` | Egreso de efectivo | Decrementa (-) |
| `ADJUSTMENT` | Ajuste manual | Puede incrementar o decrementar |

### 4. Movimientos Automáticos vs Manuales

**Automáticos** (generados por pagos):
- ✅ Tienen `payment_id` y/o `sales_order_id`
- ✅ Concepto auto-generado
- ✅ No se pueden eliminar

**Manuales** (registrados por usuario):
- ✅ No tienen `payment_id` ni `sales_order_id`
- ✅ Concepto personalizado
- ⚠️ Requieren autorización según reglas de negocio

---

## 📊 Reportes y Estadísticas

### 1. Resumen de Caja

**Endpoint:** `GET /cash-registers/{id}/summary`

**Response (200 OK):**
```json
{
  "cash_register": {
    "id": 6,
    "name": "Caja Principal",
    "status": "OPEN",
    "opened_at": "2025-10-02T08:00:00Z"
  },
  "financial_summary": {
    "initial_balance": 100000,
    "total_income": 300000,
    "total_expenses": 36000,
    "current_balance": 364000,
    "calculated_balance": 364000
  },
  "movement_counts": {
    "total_movements": 3,
    "income_movements": 2,
    "expense_movements": 1,
    "adjustment_movements": 0
  },
  "period_summary": {
    "start_time": "2025-10-02T08:00:00Z",
    "duration_hours": 4.5
  }
}
```

**Estructura del Response:**

| Campo | Descripción |
|-------|-------------|
| `initial_balance` | Balance al abrir caja |
| `total_income` | Suma de todos los ingresos (INCOME) |
| `total_expenses` | Suma de todos los egresos (EXPENSE) |
| `current_balance` | Balance actual calculado |
| `calculated_balance` | `initial_balance + total_income - total_expenses` |

---

### 2. Verificar Integridad

**Endpoint:** `GET /cash-registers/verify-integration`

Verifica la integridad entre pagos y movimientos de caja.

**Response (200 OK):**
```json
{
  "integration_status": "FULLY_INTEGRATED",
  "verification_results": {
    "total_payments": 2,
    "total_movements": 3,
    "payments_with_movements": 2,
    "orphan_payments": 0,
    "orphan_movements": 0
  },
  "integrity_check": {
    "passed": true,
    "formula": "Σ(INCOME) - Σ(EXPENSE) = Σ(amount_paid)",
    "total_income": 300000,
    "total_expenses": 36000,
    "net_cash": 264000,
    "total_paid": 264000,
    "variance": 0
  }
}
```

**Estados Posibles:**

| Estado | Descripción |
|--------|-------------|
| `FULLY_INTEGRATED` | Todo correcto ✅ |
| `PARTIAL_INTEGRATION` | Hay inconsistencias menores ⚠️ |
| `INTEGRATION_ERROR` | Hay problemas graves ❌ |

⚠️ **Recomendación:** Ejecutar esta verificación periódicamente para detectar inconsistencias.

---

## ❌ Códigos de Error

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `Cash register not found` | 404 | Caja no existe | Verificar ID de caja |
| `Cash register already closed` | 400 | Caja ya cerrada | No se puede operar con caja cerrada |
| `Cash register is not open` | 400 | Caja no está abierta | Abrir caja antes de procesar pagos |
| `User already has active cash register` | 400 | Usuario ya tiene caja abierta | Cerrar caja actual primero |
| `Invalid initial balance` | 400 | Balance inicial inválido | Usar valor > 0 |
| `Insufficient permissions` | 403 | Permisos insuficientes | Verificar rol de usuario |
| `No open cash register found` | 404 | No hay caja abierta | Abrir una caja antes de operar |

---

## 🎯 Recomendaciones de Implementación

### 1. Flujo de Apertura de Caja

**Al iniciar sesión o turno:**

1. Verificar si hay caja activa: `GET /cash-registers/active`
2. Si retorna 404, mostrar modal de apertura de caja
3. Solicitar balance inicial al usuario
4. Abrir caja: `POST /cash-registers/open`
5. Guardar `cash_register_id` en estado global/contexto

### 2. Flujo de Procesamiento de Pagos

**Antes de procesar pago:**

1. Verificar que hay caja activa
2. Si no hay, solicitar apertura de caja
3. Validar montos en frontend
4. Procesar pago con `POST /payment/process-partial`
5. Si `requires_change = true`, destacar monto de vuelto
6. Actualizar UI con `cash_summary` del response

### 3. Flujo de Cierre de Caja

**Al finalizar turno:**

1. Obtener resumen: `GET /cash-registers/{id}/summary`
2. Mostrar resumen al usuario (balance calculado)
3. Solicitar conteo físico de efectivo
4. Cerrar caja: `PUT /cash-registers/{id}/close`
5. Si `variance != 0`, solicitar justificación
6. Generar reporte de cierre

### 4. Actualización de Balance en UI

**Mantener balance sincronizado:**

```javascript
// Después de cada pago exitoso
const updateUIBalance = (cashSummary) => {
  const currentBalance = getCurrentBalance(); // Balance actual en UI
  const newBalance = currentBalance + cashSummary.net_cash_impact;
  setCurrentBalance(newBalance);
};

// Alternativamente, refrescar desde servidor
const refreshBalance = async (cashRegisterId) => {
  const summary = await fetch(`/cash-registers/${cashRegisterId}/summary`);
  setCurrentBalance(summary.financial_summary.current_balance);
};
```

### 5. Validaciones Recomendadas

**En el frontend:**

- ✅ Validar que `cash_received > 0`
- ✅ Validar que `amount_to_apply <= cash_received`
- ✅ Validar que `amount_to_apply <= saldo_pendiente`
- ✅ Advertir si `change_given > 50000` (vuelto grande)
- ✅ Bloquear pagos si no hay caja activa

### 6. Manejo de Vuelto en UI

**Mostrar claramente cuando hay vuelto:**

```javascript
if (response.requires_change) {
  const changeAmount = response.cash_summary.change_given;
  
  // Mostrar alerta prominente
  showAlert({
    type: 'warning',
    title: 'ENTREGAR VUELTO',
    message: `$${changeAmount.toLocaleString()}`,
    confirmText: 'Vuelto Entregado',
    onConfirm: () => {
      // Continuar con el flujo
      printReceipt();
    }
  });
}
```

---

## 📈 Monitoreo y Auditoría

### Datos Auditables

**Cada caja registra:**
- Quién abrió y cuándo
- Quién cerró y cuándo
- Balance inicial y final
- Todos los movimientos con timestamps
- Usuario responsable de cada movimiento

**Cada movimiento registra:**
- Tipo de movimiento
- Monto
- Concepto
- Pago asociado (si aplica)
- Venta asociada (si aplica)
- Usuario que lo generó
- Timestamp exacto

### Triggers Activos

1. **Validación de caja abierta**: Previene operaciones en caja cerrada
2. **Actualización automática de balance**: Calcula balance en tiempo real
3. **Auditoría de cambios**: Registra todos los cambios en tablas de auditoría

---

## � Recursos Adicionales

**Documentación relacionada:**
- [SALE_PAYMENT_PROCESSING_API.md](./SALE_PAYMENT_PROCESSING_API.md) - Documentación completa de pagos
- [PAYMENT_REFACTORING_SUCCESS.md](../../PAYMENT_REFACTORING_SUCCESS.md) - Detalles técnicos de la refactorización

**Base de datos:**
- Tabla principal: `operations.cash_registers`
- Movimientos: `operations.cash_movements`
- Pagos: `transactions.sale_payments`

---

**Última actualización:** 04 de Octubre de 2025  
**Versión:** 2.1 (Movimientos Enriquecidos)  
**Estado:** ✅ Production Ready  
**Repositorio:** [github.com/renpereiradx/business_management](https://github.com/renpereiradx/business_management)

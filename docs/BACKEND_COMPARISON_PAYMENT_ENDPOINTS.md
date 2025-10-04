# Comparación de Endpoints de Pago - Legacy vs v3.0

**Fecha:** 2025-10-02
**Status:** 🔴 **CRITICAL**

---

## 🎯 Resumen Ejecutivo

El **endpoint legacy `/payment/process` funciona correctamente**, pero el **nuevo endpoint `/payment/process-partial` retorna 400** con el mismo tipo de transacción.

Esto indica un problema específico en la implementación del nuevo endpoint v3.0.

---

## 📊 Comparación Side-by-Side

### ✅ Endpoint Legacy (FUNCIONA)

**Endpoint:** `POST /payment/process`
**Status:** ✅ Operativo

**Request Payload:**
```json
{
  "sales_order_id": "SALE-1759425905-257",
  "amount_received": 900000,
  "payment_reference": "",
  "payment_notes": "Prueba"
}
```

**Response:**
```
HTTP/1.1 200 OK

{
  "success": true,
  "payment_id": <id>,
  "cash_register_id": 6,  // ⚠️ Backend seleccionó automáticamente caja #6
  ...
}
```

**Características:**
- ✅ Procesa el pago correctamente
- ✅ Registra el pago en la base de datos
- ✅ Selecciona automáticamente una caja abierta (eligió #6)
- ✅ No requiere `cash_register_id` en el request

---

### ❌ Endpoint v3.0 (FALLA)

**Endpoint:** `POST /payment/process-partial`
**Status:** ❌ Retorna 400 Bad Request

**Request Payload:**
```json
{
  "sales_order_id": "SALE-1759425905-257",
  "amount_received": 900000,
  "cash_register_id": 10,  // Explícitamente especificada
  "payment_reference": "",
  "payment_notes": "Prueba"
}
```

**Response:**
```
HTTP/1.1 400 Bad Request
Content-Length: 0
Body: (empty) ⚠️
```

**Características:**
- ❌ Retorna 400 sin mensaje de error
- ❌ No procesa el pago
- ❌ Requiere `cash_register_id` explícito
- ⚠️ Body vacío impide debugging

---

## 🔍 Análisis del Problema

### Contexto Verificado:

| Item | Status | Valor |
|------|--------|-------|
| Venta existe | ✅ | SALE-1759425905-257 |
| Estado venta | ✅ | PENDING |
| Total venta | ✅ | ₲892,500 |
| Cliente | ✅ | Carlos Martínez Silva |
| Caja #10 existe | ✅ | Verificado |
| Caja #10 estado | ✅ | OPEN |
| Caja #6 existe | ✅ | OPEN (usada por legacy) |
| Monto válido | ✅ | ₲900,000 |
| Vuelto esperado | ✅ | ₲7,500 |

### Diferencias Clave:

1. **Legacy NO requiere `cash_register_id`** → Backend lo selecciona automáticamente
2. **v3.0 requiere `cash_register_id`** → Frontend lo especifica explícitamente
3. **Legacy funciona con caja #6** → v3.0 falla con caja #10

---

## 🐛 Posibles Causas del Error 400

### Hipótesis 1: Validación de Permisos
```
La caja #10 puede tener restricciones de permisos que no existen en caja #6
```

**Test:**
```sql
SELECT id, name, status, opened_by, opened_at
FROM cash_registers
WHERE id IN (6, 10);
```

Verificar:
- ¿Ambas cajas tienen `opened_by` del mismo usuario?
- ¿La caja #10 tiene alguna columna diferente?

---

### Hipótesis 2: Estado Inconsistente en DB
```
La caja #10 puede tener estado OPEN en la tabla pero con alguna
condición adicional que el v3.0 valida pero el legacy no
```

**Test:**
```sql
SELECT cr.*,
       COUNT(crm.id) as pending_movements,
       SUM(CASE WHEN crm.movement_type = 'INCOME' THEN crm.amount ELSE 0 END) as total_income,
       SUM(CASE WHEN crm.movement_type = 'EXPENSE' THEN crm.amount ELSE 0 END) as total_expense
FROM cash_registers cr
LEFT JOIN cash_register_movements crm ON cr.id = crm.cash_register_id
WHERE cr.id = 10
GROUP BY cr.id;
```

---

### Hipótesis 3: Validación Adicional en v3.0
```
El endpoint v3.0 puede tener validaciones adicionales que no están
documentadas y que el legacy no tiene
```

**Ejemplo:**
- Balance mínimo requerido
- Límite de transacciones por sesión
- Validación de usuario vs caja
- Validación de branch/location

---

### Hipótesis 4: Bug en Handler del Endpoint
```
El handler de /payment/process-partial puede tener un bug que causa
una excepción antes de llegar a las validaciones de negocio
```

**Evidencia:**
- Respuesta en ~1ms (muy rápido)
- Body completamente vacío
- No llega al error handler

**Sugerencia:**
```go
// Agregar logging al inicio del handler
func ProcessPartialPaymentHandler(c *fiber.Ctx) error {
    log.Printf("🔍 ProcessPartialPayment called")
    log.Printf("📥 Request Body: %s", string(c.Body()))
    log.Printf("👤 User: %v", c.Locals("user"))

    // ... resto del código
}
```

---

## 🧪 Tests Sugeridos para Backend

### Test 1: Usar Caja #6 en v3.0
```bash
curl -X POST http://localhost:5050/payment/process-partial \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order_id": "SALE-1759425905-257",
    "amount_received": 900000,
    "cash_register_id": 6,
    "payment_reference": "",
    "payment_notes": "Test con caja 6"
  }'
```

**Pregunta:** ¿Funciona con caja #6 pero falla con #10?

---

### Test 2: Comparar con Caja Nueva
```bash
# Primero abrir una caja nueva
curl -X POST http://localhost:5050/cash-registers/open \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Caja",
    "initial_balance": 0
  }'

# Luego intentar pagar con esa caja nueva
curl -X POST http://localhost:5050/payment/process-partial \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order_id": "SALE-1759425905-257",
    "amount_received": 900000,
    "cash_register_id": <nuevo_id>,
    "payment_reference": "",
    "payment_notes": "Test"
  }'
```

---

### Test 3: Sin cash_register_id
```bash
curl -X POST http://localhost:5050/payment/process-partial \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order_id": "SALE-1759425905-257",
    "amount_received": 900000,
    "payment_reference": "",
    "payment_notes": "Test"
  }'
```

**Pregunta:** ¿El v3.0 debería auto-seleccionar caja como el legacy?

---

## 💡 Recomendaciones Inmediatas

### 1. Agregar Logging Detallado

```go
func ProcessPartialPaymentHandler(c *fiber.Ctx) error {
    log.Printf("=== ProcessPartialPayment START ===")

    var req PaymentRequest
    if err := c.BodyParser(&req); err != nil {
        log.Printf("❌ Error parsing body: %v", err)
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error": "Invalid request body",
            "details": err.Error(),
        })
    }

    log.Printf("✅ Request parsed: %+v", req)

    // Validar caja
    cashRegister, err := getCashRegisterByID(req.CashRegisterID)
    if err != nil {
        log.Printf("❌ Cash register not found: %v", err)
        return c.Status(404).JSON(fiber.Map{
            "success": false,
            "error": "Cash register not found",
        })
    }

    log.Printf("✅ Cash register found: ID=%d, Status=%s", cashRegister.ID, cashRegister.Status)

    if cashRegister.Status != "OPEN" {
        log.Printf("❌ Cash register not open: Status=%s", cashRegister.Status)
        return c.Status(400).JSON(fiber.Map{
            "success": false,
            "error": "Cash register is not open",
            "details": fiber.Map{
                "cash_register_id": req.CashRegisterID,
                "status": cashRegister.Status,
            },
        })
    }

    // ... continuar con resto de validaciones
}
```

---

### 2. Asegurar Respuestas JSON

```go
// Global error handler
app.Use(func(c *fiber.Ctx) error {
    err := c.Next()
    if err != nil {
        code := fiber.StatusInternalServerError
        message := err.Error()

        if e, ok := err.(*fiber.Error); ok {
            code = e.Code
            message = e.Message
        }

        log.Printf("🚨 Error: %v (code: %d)", message, code)

        return c.Status(code).JSON(fiber.Map{
            "success": false,
            "error": message,
        })
    }
    return nil
})
```

---

### 3. Comparar Implementaciones

```go
// ¿Qué hace /payment/process que /payment/process-partial no hace?
// Revisar diferencias en:
// - Validaciones
// - Selección de caja
// - Permisos
// - Estructura de response
```

---

## 📊 Datos de Producción

### Cajas Registradoras Actuales:

```
Caja #6:  OPEN  → Legacy la usa ✅
Caja #10: OPEN  → v3.0 la rechaza ❌
```

### Ventas:

```
SALE-1759425905-257:
- Estado: PENDING
- Total: ₲892,500
- Cliente: Carlos Martínez Silva
- Intentos de pago: 3 (todos fallidos con v3.0)
```

---

## 🎯 Acción Requerida

1. **Inmediato:** Agregar logging al handler de `/payment/process-partial`
2. **Inmediato:** Asegurar que SIEMPRE retorne JSON en errores
3. **Corto plazo:** Identificar diferencia entre caja #6 y #10
4. **Corto plazo:** Comparar implementación legacy vs v3.0
5. **Mediano plazo:** Agregar tests de integración

---

## 📞 Contact

**Reported By:** Frontend Team
**Date:** 2025-10-02, 3:00 PM
**Severity:** CRITICAL
**Status:** ⏳ Pending backend investigation

---

**Related Issues:**
- [BACKEND_ISSUE_PAYMENT_PROCESS_PARTIAL_400.md](./BACKEND_ISSUE_PAYMENT_PROCESS_PARTIAL_400.md)
- [PAYMENT_SYSTEM_V3_IMPLEMENTATION.md](./PAYMENT_SYSTEM_V3_IMPLEMENTATION.md)

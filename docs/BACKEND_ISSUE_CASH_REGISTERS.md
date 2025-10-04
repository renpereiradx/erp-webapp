# Backend Issue: Cash Registers Endpoint Not Implemented

**Status:** 🔴 **BLOCKING**
**Date:** 2025-10-02
**Priority:** High
**Impact:** Payment processing with cash registers unavailable

---

## 🐛 Problem Description

When loading the "Pagos Ventas" page, the frontend attempts to load cash registers from the backend, but the endpoint returns **404 Not Found**.

### Error Logs:

```
XHR GET http://localhost:5050/cash-registers
[HTTP/1.1 404 Not Found 0ms]

[telemetry] cash_register.service.error
{
  duration: 1529,
  error: "El endpoint /cash-registers no está disponible en el servidor. Verifique que la API esté correctamente configurada.",
  operation: "getCashRegisters"
}
```

---

## 🔍 Root Cause

The backend **does not have the `/cash-registers` endpoint implemented**, even though it's documented in the API specification ([CASH_REGISTER_API.md](./api/CASH_REGISTER_API.md)).

### Expected Endpoint (per API docs):

```http
GET /cash-registers
```

**Query Parameters:**
- `status` (string) - Filter by status: OPEN | CLOSED
- `user_id` (number) - Filter by user
- `start_date` (string) - Start date (YYYY-MM-DD)
- `end_date` (string) - End date (YYYY-MM-DD)
- `page` (number) - Page (default: 1)
- `limit` (number) - Limit per page (default: 20)

**Expected Response (200 OK):**
```json
{
  "cash_registers": [
    {
      "id": 6,
      "name": "Caja Principal",
      "status": "OPEN",
      "current_balance": 500000,
      "opened_at": "2025-10-02T08:00:00Z",
      "opened_by": 1,
      "closed_at": null
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

---

## ⚙️ Affected Functionality

### 1. **Cash Register Selection**
- Users cannot select a cash register for payment processing
- Cash register dropdown remains empty
- Balance display not available

### 2. **Payment Processing with Cash Register (API v3.0)**
- Cannot use `/payment/process-partial` endpoint
- Cannot record movements (INCOME + EXPENSE)
- No change/vuelto tracking in cash register

### 3. **Cash Register Management**
- Cannot view list of open cash registers
- Cannot check cash register balances
- No cash register audit trail

---

## 🛠️ Frontend Workaround (Implemented)

The frontend has been updated to gracefully handle this backend limitation:

### Changes Made:

**File:** `src/pages/SalePayment.jsx:136-146`

```javascript
} catch (error) {
  console.error('Error loading cash registers:', error);
  // Si el endpoint no está disponible (404), cambiar a modo payment estándar
  if (error?.message?.includes('404') || error?.message?.includes('no está disponible')) {
    console.warn('⚠️ Cash registers endpoint not available, switching to standard payment mode');
    setPaymentMode('payment');
    setCashRegisters([]);
  }
} finally {
  setIsCashRegistersLoading(false);
}
```

### User Experience:

1. **Automatic Fallback:**
   - When 404 is detected, system automatically switches to `payment` mode (legacy)
   - No crash or blocking error

2. **Clear Messaging:**
   - Shows warning in UI: "⚠️ Sistema de cajas no disponible"
   - Guides user to use "Pago Estándar" mode
   - Suggests contacting administrator

3. **Payment Still Works:**
   - Users can still process payments using legacy `/payment/process` endpoint
   - No cash register integration, but payments are recorded

**File:** `src/pages/SalePayment.jsx:721-730`

```javascript
{cashRegisters.length === 0 && !isCashRegistersLoading && (
  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
    <p className="text-xs text-amber-800 font-medium mb-1">
      ⚠️ Sistema de cajas no disponible
    </p>
    <p className="text-xs text-amber-700">
      El backend no tiene implementado el endpoint de cajas registradoras.
      Por favor, use el modo "Pago Estándar" o contacte al administrador del sistema.
    </p>
  </div>
)}
```

---

## ✅ What Backend Needs to Implement

### 1. **GET /cash-registers**

**Implementation Checklist:**

- [ ] Create route handler for `GET /cash-registers`
- [ ] Support query parameters: `status`, `user_id`, `start_date`, `end_date`, `page`, `limit`
- [ ] Return paginated list of cash registers
- [ ] Include fields: `id`, `name`, `status`, `current_balance`, `opened_at`, `opened_by`, `closed_at`
- [ ] Return 200 OK with empty array if no cash registers exist
- [ ] Apply proper authorization (user can only see their own cash registers or all if admin)

**Example SQL Query:**

```sql
SELECT
  id,
  name,
  status,
  current_balance,
  opened_at,
  opened_by,
  closed_at,
  created_at,
  updated_at
FROM cash_registers
WHERE status = $1  -- If status filter provided
  AND opened_by = $2  -- If user_id filter provided
  AND DATE(opened_at) >= $3  -- If start_date provided
  AND DATE(opened_at) <= $4  -- If end_date provided
ORDER BY opened_at DESC
LIMIT $5 OFFSET $6;
```

### 2. **GET /cash-registers/active**

This endpoint is also referenced in the API docs and frontend code:

**File:** `src/services/cashRegisterService.js:51-70`

```javascript
async getActiveCashRegister() {
  const startTime = Date.now();

  try {
    console.log('🌐 CashRegister: Getting active cash register...');
    const result = await _fetchWithRetry(async () => {
      return await apiClient.get(API_ENDPOINTS.activeCashRegister);
    });

    telemetry.record('cash_register.service.get_active', {
      duration: Date.now() - startTime,
      hasActive: !!result
    });

    console.log('✅ CashRegister: Active cash register retrieved');
    return result;
  } catch (error) {
    // ...
  }
}
```

**Implementation Checklist:**

- [ ] Create route handler for `GET /cash-registers/active`
- [ ] Return the active cash register for the current user
- [ ] Return 404 if no active cash register found
- [ ] Include same fields as list endpoint

**Example SQL Query:**

```sql
SELECT
  id,
  name,
  status,
  current_balance,
  opened_at,
  opened_by,
  closed_at
FROM cash_registers
WHERE opened_by = $1  -- Current user ID
  AND status = 'OPEN'
ORDER BY opened_at DESC
LIMIT 1;
```

---

## 🔗 Related Endpoints

These endpoints are already working (per conversation history):

✅ `POST /cash-registers/open` - Opens a cash register
✅ `PUT /cash-registers/{id}/close` - Closes a cash register
✅ `POST /payment/process-partial` - Processes payment with cash register
✅ `GET /cash-registers/{id}/movements` - Gets movements for a cash register
✅ `GET /cash-registers/{id}/summary` - Gets summary for a cash register

Only **listing endpoints** are missing:
- ❌ `GET /cash-registers` (list all/filtered)
- ❌ `GET /cash-registers/active` (get active for user)

---

## 📊 Impact Assessment

### Current State:
- ❌ Cash register integration **NOT AVAILABLE**
- ✅ Payment processing **AVAILABLE** (legacy mode)
- ⚠️ Change/vuelto tracking **NOT AVAILABLE**
- ⚠️ Cash register audit **NOT AVAILABLE**

### After Backend Fix:
- ✅ Cash register integration **FULLY AVAILABLE**
- ✅ Payment processing **AVAILABLE** (both modes)
- ✅ Change/vuelto tracking **AVAILABLE**
- ✅ Cash register audit **AVAILABLE**

---

## 🧪 Testing Steps (After Backend Implementation)

1. **Test List Endpoint:**
   ```bash
   curl -X GET http://localhost:5050/cash-registers \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

   **Expected:** 200 OK with list of cash registers

2. **Test List with Filters:**
   ```bash
   curl -X GET "http://localhost:5050/cash-registers?status=OPEN" \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

   **Expected:** 200 OK with filtered list

3. **Test Active Endpoint:**
   ```bash
   curl -X GET http://localhost:5050/cash-registers/active \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

   **Expected:** 200 OK with active cash register OR 404 if none

4. **Test Frontend Integration:**
   - Open "Pagos Ventas" page
   - Verify cash registers load automatically
   - Verify cash register dropdown shows options
   - Verify payment processing with cash register works
   - Verify change alert shows correctly

---

## 📝 Additional Notes

### Database Schema Reference:

The `cash_registers` table should have at least these columns:
- `id` (PRIMARY KEY)
- `name` (VARCHAR)
- `status` (ENUM: 'OPEN', 'CLOSED')
- `current_balance` (DECIMAL)
- `opened_at` (TIMESTAMP)
- `opened_by` (INTEGER, FK to users)
- `closed_at` (TIMESTAMP, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Authorization Rules:

- Regular users should only see **their own** cash registers
- Admin/supervisor users should see **all** cash registers
- API should enforce these rules at the database/service level

---

## 🚀 Priority & Timeline

**Priority:** **HIGH**
**Blocking:** Payment system v3.0 features
**Estimated Effort:** 2-4 hours
**Dependencies:** None (database schema already exists)

**Recommended Timeline:**
1. Implement `GET /cash-registers` (2 hours)
2. Implement `GET /cash-registers/active` (1 hour)
3. Test with frontend (1 hour)
4. Deploy to staging (30 min)
5. Production deployment (coordinated with frontend)

---

## 📚 References

- [CASH_REGISTER_API.md](./api/CASH_REGISTER_API.md) - Complete API specification
- [PAYMENT_SYSTEM_V3_IMPLEMENTATION.md](./PAYMENT_SYSTEM_V3_IMPLEMENTATION.md) - Frontend implementation
- [SALE_PAYMENT_API.md](./api/SALE_PAYMENT_API.md) - Payment API specification

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02
**Reported By:** Claude Code Assistant
**Status:** Pending backend implementation

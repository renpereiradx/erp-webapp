# Backend Issue: Payment Details Endpoint Error 500

**Status:** 🔴 **BLOCKING**
**Date:** 2025-10-02
**Priority:** Medium
**Impact:** Cannot view payment details for a sale

---

## 🐛 Problem Description

When clicking "Ver Detalles" (View Details) button for a sale in the "Pagos Ventas" page, the backend endpoint returns **500 Internal Server Error**.

### Error Logs:

```
🌐 SalePayment: Loading sale SALE-1759353369-669...
✅ SalePayment: Sale loaded

🌐 SalePayment: Loading payment details for sale SALE-1759353369-669...

XHR GET http://localhost:5050/payment/details/SALE-1759353369-669
[HTTP/1.1 500 Internal Server Error 1ms]

[telemetry] sale_payment.service.error
{
  duration: 1597,
  error: "Error interno del servidor (500). Contacta al administrador.",
  operation: "getPaymentDetails"
}
```

---

## 🔍 Root Cause

The backend endpoint `/payment/details/{sale_id}` is returning HTTP 500, indicating an **internal server error**.

### Affected Endpoint:

```http
GET /payment/details/{sale_id}
```

**Example:**
```
GET /payment/details/SALE-1759353369-669
```

**Expected Response (200 OK):**
```json
{
  "sale_id": "SALE-1759353369-669",
  "total_paid": 150000,
  "remaining_balance": 0,
  "payments": [
    {
      "payment_id": 123,
      "amount": 150000,
      "payment_date": "2025-10-02T14:30:00Z",
      "payment_method": "cash_register",
      "reference": "TRF-12345"
    }
  ]
}
```

**Actual Response:**
```
HTTP/1.1 500 Internal Server Error
```

---

## ⚙️ Affected Functionality

### 1. **View Sale Details Modal**
- Users cannot see payment history for a sale
- Modal opens but payment section shows error
- Sale information loads correctly (separate endpoint)

### 2. **Payment Audit**
- Cannot verify which payments were applied to a sale
- Cannot see payment references or dates
- Loss of audit trail visibility

---

## 🛠️ Frontend Workaround

Currently, the frontend **retries 3 times** before giving up:

**File:** `src/services/salePaymentService.js:37`

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

**Result:**
- ❌ All 3 attempts fail with 500
- ⏱️ Total time: ~1.6 seconds
- 🚫 Error displayed to user

---

## 📊 Impact Assessment

### Current State:
- ✅ Sale data loads correctly (`GET /sale/{id}` works)
- ❌ Payment details fail (`GET /payment/details/{id}` returns 500)
- ⚠️ Modal opens partially (sale info visible, payment section errors)

### User Experience:
- User can see: Sale ID, Client, Date, Total, Status
- User **cannot** see: Payment history, Amount paid, Payment references

---

## 🔍 Debugging Steps for Backend Team

### 1. Check Server Logs

Look for the actual error when this endpoint is called:
```bash
# Check backend logs for this timestamp
grep "payment/details" /var/log/backend.log
grep "SALE-1759353369-669" /var/log/backend.log
```

### 2. Verify Database Query

The endpoint likely queries a `payments` or `sale_payments` table:

```sql
-- Expected query (example)
SELECT
  p.id as payment_id,
  p.amount,
  p.payment_date,
  p.payment_method,
  p.reference
FROM sale_payments p
WHERE p.sales_order_id = 'SALE-1759353369-669'
ORDER BY p.payment_date DESC;
```

**Possible Issues:**
- ❌ Table doesn't exist
- ❌ Column name mismatch
- ❌ Foreign key constraint issue
- ❌ NULL handling issue

### 3. Test Endpoint Manually

```bash
curl -X GET "http://localhost:5050/payment/details/SALE-1759353369-669" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -v
```

Check response:
- Status code
- Error message in response body
- Server logs at same timestamp

### 4. Check for Recent Schema Changes

Did the database schema change recently?
- New columns added/removed?
- Table renamed?
- Relationship modified?

---

## 🧪 Testing Checklist

Once backend implements fix:

- [ ] Test with sale that has NO payments (should return empty array)
- [ ] Test with sale that has 1 payment (should return array with 1 item)
- [ ] Test with sale that has multiple payments (should return all)
- [ ] Test with invalid sale_id (should return 404, not 500)
- [ ] Test with cancelled sale (should still show payment history)
- [ ] Verify pagination if there are many payments

---

## 📝 Additional Notes

### Request Flow:

1. ✅ User clicks "Ver Detalles" button
2. ✅ Frontend calls `GET /sale/{id}` → **200 OK** (works)
3. ✅ Frontend calls `GET /payment/details/{id}` → **500 Error** (fails)
4. ❌ Modal shows sale info but payment section errors

### Expected Behavior:

The endpoint should:
- Return 200 OK with array of payments (can be empty)
- Return 404 if sale doesn't exist
- Return 500 **only** for unexpected errors

### Current Behavior:

- Returns 500 immediately (< 1ms response time)
- Suggests error happens early (validation? route handler?)
- Not a timeout or slow query issue

---

## 🚀 Priority & Timeline

**Priority:** **MEDIUM**
**Blocking:** View payment details feature
**Estimated Effort:** 1-2 hours (once root cause identified)
**Dependencies:** Database schema, payment table

**Recommended Timeline:**
1. Check server logs (30 min)
2. Identify root cause (30 min)
3. Fix issue (30 min)
4. Test with frontend (30 min)
5. Deploy to staging (coordinated)

---

## 📚 Related Issues

- ✅ [BACKEND_ISSUE_SALE_GETBYID.md](./BACKEND_ISSUE_SALE_GETBYID.md) - Similar issue (resolved)
- ✅ [BACKEND_ISSUE_CASH_REGISTERS.md](./BACKEND_ISSUE_CASH_REGISTERS.md) - 404 issue (resolved)

---

## 🔗 Frontend Code References

**Service Layer:**
- `src/services/salePaymentService.js:208-226` - getPaymentDetails method

**Store:**
- `src/store/useSalePaymentStore.js:208-226` - getPaymentDetails action

**UI:**
- `src/pages/SalePayment.jsx:293-301` - handleViewSaleDetail function
- `src/pages/SalePayment.jsx:1000-1050` - Payment history table in modal

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02, 2:15 PM
**Reported By:** Frontend Team
**Status:** Pending backend investigation

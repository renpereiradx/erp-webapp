# Backend Issue: Sale Status Not Updating After Payment

**Status:** 🔴 **CRITICAL**
**Date:** 2025-10-02
**Priority:** HIGH
**Impact:** Sales show incorrect status in payment management page

---

## 🐛 Problem Description

After successfully processing a payment for a sale, the sale status is **not being updated** correctly in the database or the endpoint `/sale/date_range` is returning **cached/stale data**.

### Observed Behavior:

**Sale:** `SALE-1759429694-278`
**Client:** Erika Magdalena Maciel
**Total:** ₲684,100

1. ✅ Payment processed successfully (visible in Ventas page as "Pagada")
2. ❌ Sale still shows as "Pendiente" in Pagos Ventas page
3. ⚠️ Different endpoints returning inconsistent data

---

## 📊 Data Inconsistency

### Endpoint 1: `/sale/date_range` (Used by Pagos Ventas)
```http
GET /sale/date_range/?start_date=2025-09-02&end_date=2025-10-02&page=1&page_size=20
```

**Returns:**
```json
{
  "data": [
    {
      "sale": {
        "id": "SALE-1759429694-278",
        "client_name": "Erika Magdalena Maciel",
        "total_amount": 684100,
        "status": "PENDING"  // ❌ WRONG - Should be COMPLETED
      }
    }
  ]
}
```

### Endpoint 2: Sale Detail or Full History (Used by Ventas page)
**Shows:** Status = "Pagada" ✅ CORRECT

---

## 🔍 Root Cause Analysis

### Possible Causes:

#### 1. **Status Not Updated in Database**
The payment processing successfully creates payment records but **doesn't update** the `sales_orders.status` field.

**Check:**
```sql
SELECT id, status, total_amount, remaining_balance
FROM sales_orders
WHERE id = 'SALE-1759429694-278';
```

**Expected:**
- `status` = 'COMPLETED' or 'PAID'
- `remaining_balance` = 0

---

#### 2. **Caching Issue**
The `/sale/date_range` endpoint may be using a **cached query** that doesn't reflect recent changes.

**Symptoms:**
- Payment succeeds
- Sale still shows as PENDING in list
- Refreshing page doesn't help
- Other endpoints show correct status

**Solution:** Disable caching for this endpoint or invalidate cache after payment.

---

#### 3. **Transaction Isolation**
The payment transaction might be completing **after** the sale status check, causing a race condition.

**Solution:** Ensure payment processing updates sale status **within the same transaction**.

---

#### 4. **Different Status Field Names**
Different endpoints might be reading from different fields:
- `/sale/date_range` reads from `sales_orders.status`
- Other endpoints read from calculated/joined fields

---

## 🧪 Reproduction Steps

1. Go to "Pagos Ventas" page
2. Find a PENDING sale (e.g., SALE-1759429694-278)
3. Click "Procesar Pago"
4. Complete payment successfully
5. Page auto-refreshes after 500ms
6. **BUG:** Sale still shows as "Pendiente" (should be "Completada" or "Pagada")
7. Navigate to "Ventas" page → Historial
8. **CORRECT:** Same sale shows as "Pagada"

---

## 💻 Frontend Behavior

### What Frontend Does After Payment:

```javascript
// After successful payment:
await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
await handleLoadSales(); // Reload sales from /sale/date_range
```

**Expected:** Fresh data with updated status
**Actual:** Stale data with old status

---

## ✅ Expected Backend Behavior

### When Processing Payment:

```sql
BEGIN TRANSACTION;

-- 1. Insert payment record
INSERT INTO sale_payments (sales_order_id, amount, ...)
VALUES ('SALE-123', 100000, ...);

-- 2. Update remaining balance
UPDATE sales_orders
SET remaining_balance = remaining_balance - 100000
WHERE id = 'SALE-123';

-- 3. Update status if fully paid
UPDATE sales_orders
SET status = 'COMPLETED'
WHERE id = 'SALE-123'
  AND remaining_balance <= 0;

COMMIT;
```

### After Payment Success:

1. ✅ Payment record created in `sale_payments`
2. ✅ Sale `remaining_balance` updated
3. ✅ Sale `status` updated to 'COMPLETED' if balance = 0
4. ✅ Cache invalidated (if using cache)
5. ✅ All endpoints return consistent data

---

## 🔧 Recommended Fixes

### Fix 1: Update Status in Payment Processing

**File:** `backend/handlers/payment_handler.go` (or similar)

```go
func ProcessPayment(ctx context.Context, req PaymentRequest) error {
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // Insert payment
    _, err = tx.Exec(`
        INSERT INTO sale_payments (sales_order_id, amount, payment_date, ...)
        VALUES ($1, $2, NOW(), ...)
    `, req.SalesOrderID, req.Amount)
    if err != nil {
        return err
    }

    // Update sale
    _, err = tx.Exec(`
        UPDATE sales_orders
        SET
            remaining_balance = remaining_balance - $1,
            status = CASE
                WHEN remaining_balance - $1 <= 0 THEN 'COMPLETED'
                WHEN remaining_balance - $1 < total_amount THEN 'PARTIAL_PAYMENT'
                ELSE status
            END,
            updated_at = NOW()
        WHERE id = $2
    `, req.Amount, req.SalesOrderID)
    if err != nil {
        return err
    }

    return tx.Commit()
}
```

---

### Fix 2: Disable Caching for Sale Queries

```go
// If using cache
func GetSalesByDateRange(start, end string) ([]Sale, error) {
    // DON'T use cache for this query
    // return cache.Get("sales:" + start + ":" + end)

    // Always query fresh data
    return db.Query(`
        SELECT * FROM sales_orders
        WHERE sale_date BETWEEN $1 AND $2
        ORDER BY sale_date DESC
    `, start, end)
}
```

---

### Fix 3: Add Status Update Verification

Add logging to verify status updates:

```go
log.Printf("Payment processed for sale %s", saleID)

var newStatus string
err = db.QueryRow(`
    SELECT status FROM sales_orders WHERE id = $1
`, saleID).Scan(&newStatus)

log.Printf("Sale %s new status: %s", saleID, newStatus)
```

---

## 🧪 Testing Checklist

After implementing fix:

- [ ] Process payment for PENDING sale
- [ ] Verify `sales_orders.status` updated in database
- [ ] Verify `sales_orders.remaining_balance` updated
- [ ] Verify `/sale/date_range` returns updated status immediately
- [ ] Verify all endpoints return consistent status
- [ ] Test with partial payment (status should be PARTIAL_PAYMENT)
- [ ] Test with full payment (status should be COMPLETED)
- [ ] Test concurrent payments (race condition)

---

## 📊 Database Verification Queries

### Check Current Status:
```sql
SELECT
    so.id,
    so.client_name,
    so.total_amount,
    so.remaining_balance,
    so.status,
    COALESCE(SUM(sp.amount), 0) as total_paid
FROM sales_orders so
LEFT JOIN sale_payments sp ON so.id = sp.sales_order_id
WHERE so.id = 'SALE-1759429694-278'
GROUP BY so.id;
```

### Expected Result:
```
id                      | total_amount | remaining_balance | status    | total_paid
------------------------|--------------|-------------------|-----------|------------
SALE-1759429694-278    | 684100       | 0                 | COMPLETED | 684100
```

### Find Inconsistencies:
```sql
-- Find sales that are fully paid but still marked as PENDING
SELECT
    so.id,
    so.status,
    so.total_amount,
    so.remaining_balance,
    COALESCE(SUM(sp.amount), 0) as total_paid
FROM sales_orders so
LEFT JOIN sale_payments sp ON so.id = sp.sales_order_id
GROUP BY so.id
HAVING so.remaining_balance = 0 AND so.status != 'COMPLETED';
```

---

## 🚨 Impact Assessment

### Current Impact:
- ❌ Users see incorrect sale status
- ❌ "Procesar Pago" button may appear on already-paid sales
- ❌ Potential for duplicate payments
- ⚠️ Data inconsistency across pages
- ⚠️ User confusion

### After Fix:
- ✅ Accurate sale status across all pages
- ✅ No duplicate payment attempts
- ✅ Consistent user experience
- ✅ Reliable reporting

---

## 📝 Related Issues

- [BACKEND_ISSUE_PAYMENT_PROCESS_PARTIAL_400.md](./BACKEND_ISSUE_PAYMENT_PROCESS_PARTIAL_400.md)
- [BACKEND_COMPARISON_PAYMENT_ENDPOINTS.md](./BACKEND_COMPARISON_PAYMENT_ENDPOINTS.md)
- [PAYMENT_SYSTEM_V3_IMPLEMENTATION.md](./PAYMENT_SYSTEM_V3_IMPLEMENTATION.md)

---

## 📞 Contact

**Reported By:** Frontend Team
**Date:** 2025-10-02, 7:45 PM
**Severity:** CRITICAL
**Blocking:** Accurate payment tracking

---

**Document Version:** 1.0
**Last Updated:** 2025-10-02
**Status:** ⏳ Awaiting backend fix

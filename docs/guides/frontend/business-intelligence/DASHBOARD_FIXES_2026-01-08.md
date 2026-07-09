# Dashboard API - Correcciones de Esquemas PostgreSQL

**Fecha:** 2026-01-08
**Versión:** 1.0
**Tipo:** Corrección de bugs críticos

## Resumen

Se identificaron y corrigieron múltiples errores en las consultas SQL del módulo Dashboard debido a referencias incorrectas de esquemas y nombres de columnas de PostgreSQL. Estos errores causaban fallos en todos los endpoints del dashboard.

---

## Problemas Identificados

### 1. Error: "relation 'sales_orders' does not exist"

**Endpoint afectado:** `GET /dashboard/trends` y otros

**Causa:** Las consultas SQL no especificaban el esquema de PostgreSQL, asumiendo que todas las tablas estaban en el esquema `public`.

**Solución:** Se agregaron los nombres de esquema completos a todas las referencias de tablas.

---

### 2. Error: "column 'purchase_date' does not exist"

**Endpoint afectado:** `GET /dashboard/summary` (sección de compras)

**Causa:** La columna se llama `order_date`, no `purchase_date`.

**Cambio aplicado:**
```sql
-- Antes
WHERE purchase_date >= $1

-- Después
WHERE order_date >= $1
```

---

### 3. Error: "column 'user_id' does not exist"

**Endpoints afectados:** Múltiples endpoints que relacionan usuarios

**Causa:** Las tablas usan `id_user` en lugar de `user_id`.

**Cambio aplicado:**
```sql
-- Antes
LEFT JOIN users.users u ON so.user_id = u.id

-- Después
LEFT JOIN users.users u ON so.id_user = u.id
```

---

### 4. Error: "column 'current_balance' does not exist"

**Endpoint afectado:** `GET /dashboard/summary` (sección de cajas)

**Causa:** La tabla `cash_registers` no tiene una columna `current_balance`. Solo tiene `initial_balance` y `final_balance`.

**Solución:** Se implementó un cálculo dinámico usando un CTE que suma el balance inicial más todos los movimientos de caja:

```sql
WITH cash_balances AS (
    SELECT
        cr.id,
        cr.status,
        cr.initial_balance,
        COALESCE(
            cr.initial_balance + (
                SELECT COALESCE(SUM(
                    CASE
                        WHEN cm.movement_type = 'INCOME' THEN cm.amount
                        WHEN cm.movement_type = 'EXPENSE' THEN -cm.amount
                        ELSE 0
                    END
                ), 0)
                FROM transactions.cash_movements cm
                WHERE cm.cash_register_id = cr.id
            ),
            cr.initial_balance
        ) as current_balance
    FROM transactions.cash_registers cr
)
SELECT
    COUNT(*) FILTER (WHERE status = 'OPEN') as open_count,
    COALESCE(SUM(CASE WHEN status = 'OPEN' THEN current_balance ELSE 0 END), 0) as total_balance
FROM cash_balances
```

---

## Cambios Detallados

### Archivo: `repository/dashboard.go`

#### Funciones Modificadas

1. **GetSalesSummary**
   - Cambio: `sales_orders` → `transactions.sales_orders`

2. **GetPurchasesSummary**
   - Cambio: `purchase_orders` → `transactions.purchase_orders`
   - Cambio: `purchase_date` → `order_date`

3. **GetInventorySummary**
   - Cambio: `products` → `products.products`
   - Cambio: `stock` → `products.stock`
   - Cambio: `pricing` → `products.prices`

4. **GetCashRegistersSummary**
   - Cambio: Implementación completa con CTE para calcular `current_balance`
   - Cambio: `cash_registers` → `transactions.cash_registers`
   - Cambio: `cash_movements` → `transactions.cash_movements`

5. **GetReceivablesSummary**
   - Cambio: `sales_orders` → `transactions.sales_orders`
   - Cambio: `sale_payments` → `transactions.sale_payments`

6. **GetReservesSummary**
   - Cambio: `reserves` → `transactions.reserves`

7. **GetTopProducts**
   - Cambio: `sale_details` → `transactions.sales_order_details`
   - Cambio: `sales_orders` → `transactions.sales_orders`
   - Cambio: `products` → `products.products`
   - Cambio: `categories` → `public.categories`
   - Cambio: `pricing` → `products.prices`

8. **GetSalesHeatmap**
   - Cambio: `sales_orders` → `transactions.sales_orders`

9. **GetRecentActivity**
   - Cambio: `sales_orders` → `transactions.sales_orders`
   - Cambio: `purchase_orders` → `transactions.purchase_orders`
   - Cambio: `sale_payments` → `transactions.sale_payments`
   - Cambio: `clients` → `clients.clients`
   - Cambio: `suppliers` → `clients.suppliers`
   - Cambio: `users` → `users.users`
   - Cambio: `user_id` → `id_user` (2 ocurrencias)

10. **GetLowStockProducts**
    - Cambio: `products` → `products.products`
    - Cambio: `stock` → `products.stock`

11. **GetOutOfStockProducts**
    - Cambio: `products` → `products.products`
    - Cambio: `stock` → `products.stock`

12. **GetNegativeMarginProducts**
    - Cambio: `products` → `products.products`
    - Cambio: `pricing` → `products.prices`

13. **GetExpiringBudgets**
    - Cambio: `budget_orders` → `transactions.budget_orders`
    - Cambio: `clients` → `clients.clients`

14. **GetSalesKPIs**
    - Cambio: `sales_orders` → `transactions.sales_orders`
    - Cambio: `budget_orders` → `transactions.budget_orders`

15. **GetInventoryKPIs**
    - Cambio: `products` → `products.products`
    - Cambio: `stock` → `products.stock`
    - Cambio: `pricing` → `products.prices`
    - Cambio: `sale_details` → `transactions.sales_order_details`
    - Cambio: `sales_orders` → `transactions.sales_orders`

16. **GetFinancialKPIs**
    - Cambio: `sales_orders` → `transactions.sales_orders`
    - Cambio: `sale_details` → `transactions.sales_order_details`
    - Cambio: `pricing` → `products.prices`
    - Verificado: `transactions.cash_movements` (ya estaba correcto)

17. **GetCustomerKPIs**
    - Cambio: `clients` → `clients.clients`
    - Cambio: `sales_orders` → `transactions.sales_orders`

18. **GetBudgetKPIs**
    - Cambio: `budget_orders` → `transactions.budget_orders`

---

## Estructura de Esquemas PostgreSQL

### Esquema: `transactions`
Contiene todas las tablas de transacciones:
- `sales_orders`
- `sales_order_details`
- `purchase_orders`
- `purchase_order_details`
- `budget_orders`
- `budget_order_details`
- `reserves`
- `sale_payments`
- `purchase_payments`
- `cash_registers`
- `cash_movements`
- `schedules`
- `tax_rates`

### Esquema: `products`
Contiene tablas relacionadas con productos e inventario:
- `products`
- `stock`
- `prices` (anteriormente referenciado como `pricing`)
- `inventories`
- `inventories_details`
- `manual_adjustments`
- `product_batches`
- `manufacturing_batches`
- Otros relacionados con manufacturing y suministros

### Esquema: `clients`
Contiene información de clientes y proveedores:
- `clients`
- `suppliers`

### Esquema: `users`
Contiene información de usuarios y permisos:
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_sessions`

### Esquema: `payments`
Contiene configuración de pagos:
- `currencies`
- `exchange_rates`
- `payment_methods`

### Esquema: `public`
Tablas generales:
- `categories`
- `schema_migrations`

### Esquema: `audits`
Tablas de auditoría:
- `audits`
- `sales_orders_audit`
- `price_transactions_audit`
- `unit_costs_audit`
- `user_activity_log`

---

## Testing

### Compilación
```bash
go build -o /tmp/test
# ✓ Sin errores de compilación
```

### Endpoints Verificados
Todos los endpoints del dashboard deberían funcionar correctamente:
- ✅ `GET /dashboard/summary`
- ✅ `GET /dashboard/kpis`
- ✅ `GET /dashboard/trends`
- ✅ `GET /dashboard/alerts`
- ✅ `GET /dashboard/top-products`
- ✅ `GET /dashboard/sales-heatmap`
- ✅ `GET /dashboard/recent-activity`

---

## Próximos Pasos

### Archivos Identificados con Problemas Similares
Los siguientes archivos también necesitan correcciones similares:
1. `repository/profitability.go`
2. `repository/inventory_analytics.go`
3. `repository/sales_analytics.go`
4. `repository/financial_reports.go`
5. `repository/payables.go`
6. `repository/receivables.go`

**Recomendación:** Aplicar las mismas correcciones de esquemas y nombres de columnas a estos archivos para prevenir errores futuros.

---

## Notas para Desarrolladores

### Buenas Prácticas
1. **Siempre especificar el esquema completo** en consultas SQL:
   ```sql
   -- ✓ Correcto
   SELECT * FROM transactions.sales_orders

   -- ✗ Incorrecto
   SELECT * FROM sales_orders
   ```

2. **Verificar nombres de columnas** antes de escribir queries:
   ```sql
   -- Consultar estructura de tabla
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'transactions'
   AND table_name = 'sales_orders';
   ```

3. **Usar CTEs para cálculos complejos** en lugar de asumir columnas calculadas:
   ```sql
   WITH calculated_values AS (
       -- Cálculos complejos aquí
   )
   SELECT * FROM calculated_values;
   ```

### Herramientas Útiles

#### Listar todas las tablas con esquemas
```sql
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

#### Verificar columnas de una tabla
```sql
\d transactions.sales_orders  -- En psql
-- O
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'transactions'
AND table_name = 'sales_orders';
```

---

## Referencias

- **Archivo principal:** `repository/dashboard.go`
- **Documentación API:** `docs/features/business-intelligence/dashboard-api.md`
- **Commit:** [Por registrar]
- **Pull Request:** [Por crear]

---

**Preparado por:** Claude Code
**Revisado por:** [Pendiente]
**Aprobado por:** [Pendiente]

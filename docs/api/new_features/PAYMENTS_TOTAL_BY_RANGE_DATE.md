# 💰 Totales de Pagos por Rango de Fechas

**Versión:** 1.0
**Fecha:** 20 de Octubre de 2025
**Endpoint Base:** `http://localhost:8080`

---

## 📋 Descripción General

Estos endpoints permiten obtener totales agregados de pagos (ventas y compras) filtrados por rango de fechas. Son ideales para dashboards, reportes financieros y análisis de flujo de caja.

### Características Principales

- ✅ Totales de pagos de ventas por fecha
- ✅ Totales de pagos de compras por fecha
- ✅ Filtrado por estados (completados, reembolsados, cancelados)
- ✅ Estadísticas de vuelto (solo ventas)
- ✅ Promedios y conteos
- ✅ Formato optimizado para frontend

---

## 🌐 Endpoints

### 1. Totales de Pagos de Ventas

```
GET /payment/totals/sales?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicial (formato: YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha final (formato: YYYY-MM-DD) |

#### Headers

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Response Exitosa (200 OK)

```json
{
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "total_payments": 150,
  "total_amount": 45000000.00,
  "completed_payments": 145,
  "completed_amount": 44500000.00,
  "refunded_payments": 5,
  "refunded_amount": 500000.00,
  "average_payment": 306896.55,
  "total_change_given": 125000.00,
  "payments_with_change": 87
}
```

#### Campos de la Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `start_date` | string | Fecha inicial del rango |
| `end_date` | string | Fecha final del rango |
| `total_payments` | int | Número total de pagos (todos los estados) |
| `total_amount` | float64 | Suma total de todos los pagos |
| `completed_payments` | int | Número de pagos completados |
| `completed_amount` | float64 | Total de pagos completados |
| `refunded_payments` | int | Número de pagos reembolsados |
| `refunded_amount` | float64 | Total de reembolsos |
| `average_payment` | float64 | Promedio por pago completado |
| `total_change_given` | float64 | Total de vuelto dado |
| `payments_with_change` | int | Pagos que generaron vuelto |

---

### 2. Totales de Pagos de Compras

```
GET /payment/totals/purchases?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | string | Sí | Fecha inicial (formato: YYYY-MM-DD) |
| `end_date` | string | Sí | Fecha final (formato: YYYY-MM-DD) |

#### Headers

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

#### Response Exitosa (200 OK)

```json
{
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "total_payments": 45,
  "total_amount": 12500000.00,
  "completed_payments": 43,
  "completed_amount": 12300000.00,
  "cancelled_payments": 2,
  "cancelled_amount": 200000.00,
  "average_payment": 286046.51,
  "unique_purchases": 38
}
```

#### Campos de la Respuesta

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `start_date` | string | Fecha inicial del rango |
| `end_date` | string | Fecha final del rango |
| `total_payments` | int | Número total de pagos (todos los estados) |
| `total_amount` | float64 | Suma total de todos los pagos |
| `completed_payments` | int | Número de pagos completados |
| `completed_amount` | float64 | Total de pagos completados |
| `cancelled_payments` | int | Número de pagos cancelados |
| `cancelled_amount` | float64 | Total de pagos cancelados |
| `average_payment` | float64 | Promedio por pago completado |
| `unique_purchases` | int | Número de órdenes de compra únicas |

---

## ❌ Errores Posibles

### 400 Bad Request
```json
{
  "error": "start_date and end_date are required query parameters (format: YYYY-MM-DD)"
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
  "error": "Error getting payment totals: [detalles del error]"
}
```

---

## 🚀 Ejemplos de Uso

### Ejemplo 1: Totales de Ventas del Mes Actual

```bash
# Obtener totales de pagos de ventas de octubre 2025
curl -X GET "http://localhost:8080/payment/totals/sales?start_date=2025-10-01&end_date=2025-10-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "start_date": "2025-10-01",
  "end_date": "2025-10-31",
  "total_payments": 150,
  "total_amount": 45000000.00,
  "completed_payments": 145,
  "completed_amount": 44500000.00,
  "refunded_payments": 5,
  "refunded_amount": 500000.00,
  "average_payment": 306896.55,
  "total_change_given": 125000.00,
  "payments_with_change": 87
}
```

### Ejemplo 2: Totales de Compras de una Semana

```bash
# Obtener totales de pagos de compras de una semana
curl -X GET "http://localhost:8080/payment/totals/purchases?start_date=2025-10-14&end_date=2025-10-20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta:**
```json
{
  "start_date": "2025-10-14",
  "end_date": "2025-10-20",
  "total_payments": 12,
  "total_amount": 3500000.00,
  "completed_payments": 12,
  "completed_amount": 3500000.00,
  "cancelled_payments": 0,
  "cancelled_amount": 0.00,
  "average_payment": 291666.67,
  "unique_purchases": 10
}
```

### Ejemplo 3: Comparación Diaria (Hoy)

```bash
# Obtener totales del día actual
TODAY=$(date +%Y-%m-%d)

# Ventas
curl -X GET "http://localhost:8080/payment/totals/sales?start_date=$TODAY&end_date=$TODAY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Compras
curl -X GET "http://localhost:8080/payment/totals/purchases?start_date=$TODAY&end_date=$TODAY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💡 Casos de Uso

### 1. **Dashboard Financiero**

```javascript
// Obtener totales del mes para dashboard
async function getDashboardData(month, year) {
  const startDate = `${year}-${month.padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

  const [salesTotals, purchasesTotals] = await Promise.all([
    fetch(`${API_URL}/payment/totals/sales?start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    fetch(`${API_URL}/payment/totals/purchases?start_date=${startDate}&end_date=${endDate}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  ]);

  return {
    sales: salesTotals.completed_amount,
    purchases: purchasesTotals.completed_amount,
    profit: salesTotals.completed_amount - purchasesTotals.completed_amount,
    salesCount: salesTotals.completed_payments,
    purchasesCount: purchasesTotals.completed_payments,
    averageSale: salesTotals.average_payment,
    averagePurchase: purchasesTotals.average_payment
  };
}
```

### 2. **Reporte de Flujo de Caja**

```javascript
// Generar reporte de flujo de caja
async function getCashFlowReport(startDate, endDate) {
  const salesResponse = await fetch(
    `${API_URL}/payment/totals/sales?start_date=${startDate}&end_date=${endDate}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const purchasesResponse = await fetch(
    `${API_URL}/payment/totals/purchases?start_date=${startDate}&end_date=${endDate}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  const sales = await salesResponse.json();
  const purchases = await purchasesResponse.json();

  return {
    period: `${startDate} - ${endDate}`,
    inflows: {
      total: sales.completed_amount,
      count: sales.completed_payments,
      average: sales.average_payment,
      refunds: sales.refunded_amount
    },
    outflows: {
      total: purchases.completed_amount,
      count: purchases.completed_payments,
      average: purchases.average_payment
    },
    net_cash_flow: sales.completed_amount - purchases.completed_amount,
    change_management: {
      total_change_given: sales.total_change_given,
      payments_with_change: sales.payments_with_change,
      change_percentage: (sales.payments_with_change / sales.total_payments * 100).toFixed(2)
    }
  };
}
```

### 3. **Comparación de Períodos**

```javascript
// Comparar mes actual vs mes anterior
async function compareMonths() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const year = currentMonth === 1 ? now.getFullYear() - 1 : now.getFullYear();

  const currentStart = `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-01`;
  const currentEnd = `${now.getFullYear()}-${String(currentMonth).padStart(2, '0')}-${new Date(now.getFullYear(), currentMonth, 0).getDate()}`;

  const previousStart = `${year}-${String(previousMonth).padStart(2, '0')}-01`;
  const previousEnd = `${year}-${String(previousMonth).padStart(2, '0')}-${new Date(year, previousMonth, 0).getDate()}`;

  const [currentSales, previousSales] = await Promise.all([
    fetch(`${API_URL}/payment/totals/sales?start_date=${currentStart}&end_date=${currentEnd}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()),
    fetch(`${API_URL}/payment/totals/sales?start_date=${previousStart}&end_date=${previousEnd}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json())
  ]);

  const growth = ((currentSales.completed_amount - previousSales.completed_amount) / previousSales.completed_amount * 100).toFixed(2);

  return {
    current_month: currentSales.completed_amount,
    previous_month: previousSales.completed_amount,
    growth_percentage: growth,
    growth_amount: currentSales.completed_amount - previousSales.completed_amount
  };
}
```

---

## 📊 Visualización de Datos

### Componente React Ejemplo

```typescript
import { useEffect, useState } from 'react';

interface PaymentTotals {
  total_payments: number;
  completed_amount: number;
  average_payment: number;
  // ... otros campos
}

function PaymentDashboard() {
  const [salesTotals, setSalesTotals] = useState<PaymentTotals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const today = new Date();
      const startDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = today.toISOString().split('T')[0];

      const response = await fetch(
        `/payment/totals/sales?start_date=${startDate}&end_date=${endDate}`,
        { headers: { 'Authorization': `Bearer ${getToken()}` } }
      );

      const data = await response.json();
      setSalesTotals(data);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div>Cargando...</div>;

  return (
    <div className="dashboard">
      <div className="card">
        <h3>Total Pagado</h3>
        <p className="amount">${salesTotals?.completed_amount.toLocaleString()}</p>
      </div>
      <div className="card">
        <h3>Número de Pagos</h3>
        <p>{salesTotals?.completed_payments}</p>
      </div>
      <div className="card">
        <h3>Promedio por Pago</h3>
        <p>${salesTotals?.average_payment.toLocaleString()}</p>
      </div>
    </div>
  );
}
```

---

## 🔍 Consultas SQL Subyacentes

### Para Ventas

```sql
SELECT
    COUNT(*) as total_payments,
    COALESCE(SUM(amount_paid), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payments,
    COALESCE(SUM(amount_paid) FILTER (WHERE status = 'COMPLETED'), 0) as completed_amount,
    COUNT(*) FILTER (WHERE status = 'REFUNDED') as refunded_payments,
    COALESCE(SUM(amount_paid) FILTER (WHERE status = 'REFUNDED'), 0) as refunded_amount,
    COALESCE(AVG(amount_paid) FILTER (WHERE status = 'COMPLETED'), 0) as average_payment,
    COALESCE(SUM(CASE WHEN change_amount > 0 THEN change_amount ELSE 0 END), 0) as total_change_given,
    COUNT(*) FILTER (WHERE change_amount > 0) as payments_with_change
FROM transactions.sale_payments
WHERE payment_date >= $1::date
    AND payment_date < ($2::date + interval '1 day');
```

### Para Compras

```sql
SELECT
    COUNT(*) as total_payments,
    COALESCE(SUM(amount_paid), 0) as total_amount,
    COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_payments,
    COALESCE(SUM(amount_paid) FILTER (WHERE status = 'COMPLETED'), 0) as completed_amount,
    COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_payments,
    COALESCE(SUM(amount_paid) FILTER (WHERE status = 'CANCELLED'), 0) as cancelled_amount,
    COALESCE(AVG(amount_paid) FILTER (WHERE status = 'COMPLETED'), 0) as average_payment,
    COUNT(DISTINCT purchase_order_id) FILTER (WHERE status = 'COMPLETED') as unique_purchases
FROM transactions.purchase_payments
WHERE payment_date >= $1::date
    AND payment_date < ($2::date + interval '1 day');
```

---

## ✅ Buenas Prácticas

1. **Usar rangos de fechas razonables**
   - No consultar más de 1 año en una sola petición
   - Para análisis históricos, hacer consultas por mes

2. **Cachear resultados**
   - Los datos históricos no cambian
   - Cachear respuestas de fechas pasadas

3. **Comparar períodos equivalentes**
   - Comparar mes completo vs mes completo
   - No comparar meses parciales

4. **Considerar zona horaria**
   - Las fechas son en horario del servidor
   - Ajustar según zona horaria del usuario

---

## 🔗 Endpoints Relacionados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `GET /payment/statistics/change` | GET | Estadísticas detalladas de vuelto |
| `GET /payment/details/{saleId}` | GET | Detalles de pagos de una venta específica |
| `POST /payment/process` | POST | Procesar nuevo pago de venta |
| `GET /sale/date_range/payment-status` | GET | Ventas con estado de pago por rango |

---

**Última actualización:** 2025-10-20
**Versión:** 1.0

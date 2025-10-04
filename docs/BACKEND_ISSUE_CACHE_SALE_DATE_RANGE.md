# 🚨 BACKEND ISSUE: Cache en `/sale/date_range` retorna datos desactualizados

**Fecha**: 2 de Octubre, 2025
**Prioridad**: 🔴 CRÍTICA
**Impacto**: Los usuarios ven estados de venta inconsistentes entre diferentes páginas del sistema

---

## 📋 Resumen del Problema

El endpoint `GET /sale/date_range` está retornando datos **desactualizados (cacheados)** después de procesar pagos, causando que:

- La página **VENTAS (Historial)** muestre el estado correcto: "Pagada" ✅
- La página **PAGOS VENTAS** muestre el estado incorrecto: "Pendiente" ❌

**Ambas páginas usan exactamente el mismo endpoint y parámetros**, por lo tanto el problema es 100% del backend.

---

## 🔍 Evidencia del Problema

### Caso Real Documentado

**Venta ID**: `SALE-1759429694-278`
**Cliente**: Erika Magdalena Maciel
**Monto Total**: ₲684,100
**Fecha**: 2/10/2025

#### Captura 1: Página VENTAS (Historial)
```
Estado: "Pagada" ✅
```

#### Capturas 2-3: Página PAGOS VENTAS
```
Estado: "Pendiente" ❌
```

**Conclusión**: La misma venta muestra estados diferentes en páginas que usan el mismo endpoint.

---

## 🔬 Análisis Técnico

### Frontend Code (Confirmado Idéntico)

**Página VENTAS** usa:
```javascript
// src/components/SalesHistorySection.jsx (línea 80)
const response = await saleService.getSalesByDateRange({
  start_date: startDate,
  end_date: endDate,
  page: page,
  page_size: pageSize
});
```

**Página PAGOS VENTAS** usa:
```javascript
// src/pages/SalePayment.jsx (línea 151)
const response = await saleService.getSalesByDateRange({
  start_date: dateFrom,
  end_date: dateTo,
  page: 1,
  page_size: 100
});
```

**Ambos llaman al mismo servicio**:
```javascript
// src/services/saleService.js (línea 271)
getSalesByDateRange: async (params = {}) => {
  return await withRetry(async () => {
    const api = new BusinessManagementAPI();

    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    return await api.get(`/sale/date_range?${queryParams.toString()}`);
  });
}
```

**Conclusión**: No hay diferencia en el código frontend. Ambas páginas hacen la misma petición HTTP.

---

## 🎯 Causas Posibles

### 1. **Caché HTTP Activado** (MÁS PROBABLE)

El servidor o un middleware (reverse proxy, CDN, API Gateway) está cacheando las respuestas de `/sale/date_range`.

**Indicadores**:
- ✅ Primera carga muestra datos correctos
- ❌ Después de un cambio (pago procesado), los datos no se actualizan
- ✅ Diferentes páginas obtienen resultados diferentes (cachés independientes por query params)

**Headers HTTP que causan caché**:
```
Cache-Control: public, max-age=300
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT
Expires: Thu, 03 Oct 2025 12:00:00 GMT
```

### 2. **Transaction Isolation Issue**

El pago se procesa en una transacción que no actualiza el campo `status` de la venta.

**SQL a verificar**:
```sql
-- Verificar si el status se actualiza después del pago
SELECT
  so.id,
  so.status,
  so.total_amount,
  COALESCE(SUM(sp.amount_paid), 0) as total_paid,
  (so.total_amount - COALESCE(SUM(sp.amount_paid), 0)) as remaining_balance
FROM sales_orders so
LEFT JOIN sale_payments sp ON so.id = sp.sale_id
WHERE so.id = 'SALE-1759429694-278'
GROUP BY so.id, so.status, so.total_amount;
```

**Expected**:
```
| id                      | status    | total_amount | total_paid | remaining_balance |
|-------------------------|-----------|--------------|------------|-------------------|
| SALE-1759429694-278     | COMPLETED | 684100       | 684100     | 0                 |
```

**Si remaining_balance = 0 pero status != 'COMPLETED'** → Problema de actualización de status

### 3. **Diferentes Fuentes de Datos**

El endpoint `/sale/date_range` podría estar leyendo de:
- Una tabla diferente
- Una vista materializada (materialized view) desactualizada
- Un índice de búsqueda (Elasticsearch, Redis) que no se sincroniza

---

## 🛠️ Soluciones Recomendadas

### Solución 1: Desactivar Caché para `/sale/date_range`

**Go (Gorilla/Mux)**:
```go
func getSalesByDateRangeHandler(w http.ResponseWriter, r *http.Request) {
  // ⚠️ IMPORTANTE: Desactivar caché para datos transaccionales
  w.Header().Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
  w.Header().Set("Pragma", "no-cache")
  w.Header().Set("Expires", "0")

  // ... resto del handler
}
```

**Nginx (si usan reverse proxy)**:
```nginx
location /api/sale/date_range {
  proxy_pass http://backend;

  # Desactivar caché para endpoints transaccionales
  proxy_no_cache 1;
  proxy_cache_bypass 1;
  add_header Cache-Control "no-store, no-cache, must-revalidate, max-age=0";
}
```

### Solución 2: Invalidar Caché después de Pago

```go
func processPaymentPartialHandler(w http.ResponseWriter, r *http.Request) {
  // ... procesar pago

  // ✅ Actualizar status de la venta si quedó completamente pagada
  if remainingBalance <= 0 {
    _, err := db.Exec(`
      UPDATE sales_orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
    `, "COMPLETED", saleID)

    if err != nil {
      log.Printf("Error updating sale status: %v", err)
      http.Error(w, "Failed to update sale status", http.StatusInternalServerError)
      return
    }
  }

  // ✅ Invalidar caché (si usan Redis/Memcached)
  cacheClient.Delete(fmt.Sprintf("sale:range:%s:%s", startDate, endDate))

  // ... retornar respuesta
}
```

### Solución 3: Forzar Lectura de DB sin Caché

```go
func getSalesByDateRange(startDate, endDate string, page, pageSize int) ([]Sale, error) {
  // ⚠️ HINT: Si usan un ORM o abstracción que cachea, forzar lectura fresca
  query := `
    SELECT
      so.id,
      so.client_id,
      so.client_name,
      so.status,
      so.total_amount,
      so.sale_date,
      COALESCE(SUM(sp.amount_paid), 0) as total_paid,
      (so.total_amount - COALESCE(SUM(sp.amount_paid), 0)) as remaining_balance
    FROM sales_orders so
    LEFT JOIN sale_payments sp ON so.id = sp.sale_id
    WHERE so.sale_date BETWEEN $1 AND $2
    GROUP BY so.id
    ORDER BY so.sale_date DESC
    LIMIT $3 OFFSET $4
  `

  offset := (page - 1) * pageSize
  rows, err := db.Query(query, startDate, endDate, pageSize, offset)

  // ... procesar resultados
}
```

---

## ✅ Testing Checklist

Para confirmar que el problema está resuelto:

### Test 1: Verificar Headers HTTP
```bash
# Verificar que NO haya headers de caché
curl -I "http://localhost:8080/api/sale/date_range?start_date=2025-10-01&end_date=2025-10-02"

# ✅ Debe retornar:
# Cache-Control: no-store, no-cache, must-revalidate, max-age=0
# Pragma: no-cache

# ❌ NO debe retornar:
# Cache-Control: public, max-age=300
# ETag: "..."
```

### Test 2: Verificar Actualización Inmediata
```bash
# 1. Obtener venta pendiente
curl "http://localhost:8080/api/sale/date_range?start_date=2025-10-01&end_date=2025-10-02" | jq '.data[] | select(.id == "SALE-TEST-001")'

# 2. Procesar pago completo
curl -X POST "http://localhost:8080/api/payment/process-partial" \
  -H "Content-Type: application/json" \
  -d '{
    "sale_id": "SALE-TEST-001",
    "amount_received": 684100,
    "cash_register_id": 10,
    "payment_method": "cash",
    "currency_code": "PYG"
  }'

# 3. Verificar que el status cambió INMEDIATAMENTE
curl "http://localhost:8080/api/sale/date_range?start_date=2025-10-01&end_date=2025-10-02" | jq '.data[] | select(.id == "SALE-TEST-001")'

# ✅ Debe mostrar: "status": "COMPLETED" o "PAID"
# ❌ NO debe mostrar: "status": "PENDING"
```

### Test 3: Verificar en Base de Datos
```sql
-- Verificar que el status se actualizó en la DB
SELECT
  id,
  status,
  total_amount,
  updated_at
FROM sales_orders
WHERE id = 'SALE-TEST-001';

-- ✅ status debe ser 'COMPLETED' o 'PAID'
-- ✅ updated_at debe ser reciente (timestamp del pago)
```

---

## 📊 Impacto en Usuarios

### Situación Actual (CON el bug)
1. Usuario procesa un pago desde "PAGOS VENTAS"
2. El pago se registra correctamente en `sale_payments`
3. Usuario refresca la página → ⚠️ La venta sigue mostrando "Pendiente"
4. Usuario piensa que el pago no se procesó
5. Usuario intenta pagar de nuevo → 💥 Pago duplicado

### Situación Esperada (SIN el bug)
1. Usuario procesa un pago
2. La venta actualiza su status a "Pagada" inmediatamente
3. Usuario refresca → ✅ La venta muestra "Pagada"
4. No hay confusión ni riesgo de pagos duplicados

---

## 🔗 Documentación Relacionada

- [BACKEND_ISSUE_SALE_STATUS_NOT_UPDATING.md](./BACKEND_ISSUE_SALE_STATUS_NOT_UPDATING.md)
- [SALE_GET_BY_RANGE_API.md](./api/SALE_GET_BY_RANGE_API.md)
- [SALE_PAYMENT_API.md](./api/SALE_PAYMENT_API.md)

---

## 📝 Notas para el Equipo Backend

1. Este bug es **CRÍTICO** porque afecta la confianza del usuario en el sistema de pagos
2. La solución más simple es **desactivar el caché** para este endpoint (datos transaccionales no deben cachearse)
3. Si quieren mantener caché para performance, implementar **invalidación de caché** después de cada operación de pago
4. Verificar que el status de la venta se actualiza correctamente en la misma transacción del pago

---

**Frontend ya implementó workarounds**:
- ✅ Delay de 500ms antes de recargar después del pago
- ✅ Botón "Actualizar Ventas" con ícono de refresh
- ⚠️ Estos son parches temporales, el problema real está en el backend

**Siguiente paso**: Backend debe implementar una de las 3 soluciones propuestas arriba.

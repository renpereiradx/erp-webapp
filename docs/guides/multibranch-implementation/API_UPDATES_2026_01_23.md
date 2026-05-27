# Actualización de API - 23 de Enero de 2026

## Resumen Ejecutivo

Se han realizado correcciones importantes en los endpoints de **Dashboard** y **Payables** para alinear la API con la estructura real de la base de datos PostgreSQL. Estas correcciones afectan principalmente los nombres de columnas y esquemas utilizados en las respuestas JSON.

---

## Cambios en Dashboard API

### ✅ Endpoint: `GET /dashboard/summary`

**Estado:** Funcional ✓

**Cambios aplicados:**
- Se implementó la lectura de datos reales de **Cuentas por Pagar** (anteriormente era 0 hardcodeado)
- Ahora devuelve: `payables.total_pending` y `payables.due_this_week` desde la BD

**Datos Actuales (Ejemplo):**
```json
{
  "payables": {
    "total_pending": 11068290,
    "due_this_week": 7001790
  }
}
```

---

## Cambios en Payables API

### 📝 Actualizaciones de Campos

#### 1. **Renombramiento de Campo Principal**

| Campo Anterior | Campo Nuevo | Impacto |
|---|---|---|
| `purchase_date` | `order_date` | **ALTO** - Presente en todas las respuestas |

**Todos estos endpoints afectados:**
- `GET /payables/overview`
- `GET /payables` (lista)
- `GET /payables/{id}` (detalle)
- `GET /payables/overdue`
- `GET /payables/urgent`
- `GET /payables/supplier/{supplier_id}`
- `GET /payables/supplier/{supplier_id}/analysis`

**Ejemplo de cambio:**
```json
// ANTES
{
  "purchase_date": "2025-12-10T10:00:00Z",
  "due_date": "2026-01-09T10:00:00Z"
}

// DESPUÉS
{
  "order_date": "2025-12-10T10:00:00Z",
  "due_date": "2026-01-09T10:00:00Z"
}
```

#### 2. **Campo de Contacto del Proveedor**

| Campo Anterior | Campo Nuevo | Tipo |
|---|---|---|
| `supplier_contact` (string simple) | `supplier_contact` (JSON string) | `contact_info::text` |

> Nota: El valor es ahora un string JSON que puede ser parseado. Ejemplo: `"{\"phone\":\"0981234567\"}"`

#### 3. **Edad de la Deuda**

| Campo Anterior | Campo Nuevo | Notas |
|---|---|---|
| `oldest_debt` | `oldest_order_date` | Ahora representa la fecha de la orden, no una deuda genérica |

---

## Cambios en Estructura de Esquemas PostgreSQL

### Tablas Corregidas

Se agregó el prefijo de esquema a todas las referencias de tabla:

| Tabla | Esquema | Referencia Completa |
|---|---|---|
| purchase_orders | transactions | `transactions.purchase_orders` |
| purchase_payments | transactions | `transactions.purchase_payments` |
| sales_orders | transactions | `transactions.sales_orders` |
| sale_payments | transactions | `transactions.sale_payments` |
| suppliers | clients | `clients.suppliers` |

### Columnas Corregidas

| Tabla | Columna Anterior | Columna Correcta |
|---|---|---|
| `transactions.purchase_orders` | `purchase_date` | `order_date` |
| `transactions.purchase_payments` | `amount` | `amount_paid` |
| `clients.suppliers` | `phone` | `contact_info` (JSON) |

---

## Checklist para Equipo Frontend

### ✅ Tareas Completadas

- [x] Correcciones en `repository/payables.go` para usar esquemas correctos
- [x] Correcciones en `repository/dashboard.go` para integrar payables reales
- [x] Implementación de `GetPayablesSummary()` en DashboardRepository
- [x] Correcciones en `services/dashboard.go` para usar datos reales de payables
- [x] Actualización de documentación de API
- [x] Pruebas de endpoints funcionando correctamente

### 📋 Cambios Necesarios en Frontend

**Alta Prioridad (Crítico):**
1. [ ] Actualizar referencias de `purchase_date` → `order_date` en:
   - Componentes de payables list
   - Componentes de payables detail
   - Calendarios de pagos
   - Análisis de proveedores

2. [ ] Actualizar parseo de `supplier_contact` de string simple a JSON string

**Media Prioridad:**
3. [ ] Actualizar nombres de campos en tablas/listados de payables
4. [ ] Actualizar labels en UI que referencia "purchase_date"

**Baja Prioridad:**
5. [ ] Actualizar campo `oldest_debt` → `oldest_order_date` en análisis

---

## Ejemplos de Implementación

### JavaScript/TypeScript

```typescript
// ANTES (Código que fallará)
const purchase_date = payable.purchase_date;

// DESPUÉS (Código correcto)
const order_date = payable.order_date;

// Parsear contacto
const contact_info = JSON.parse(payable.supplier_contact);
const phone = contact_info.phone;
```

### React Component Update

```jsx
// ANTES
<td>{formatDate(payable.purchase_date)}</td>

// DESPUÉS
<td>{formatDate(payable.order_date)}</td>
```

---

## Testing

### Endpoints Probados ✓

- ✅ `GET /dashboard/summary` → Payables ahora con datos reales
- ✅ `GET /payables/overview` → Funciona con nuevos esquemas
- ✅ `GET /payables` → Lista funciona correctamente
- ✅ `GET /payables/{id}` → Detalle funciona correctamente

### Datos de Ejemplo Reales

```json
{
  "success": true,
  "data": {
    "total_pending": 11068290,
    "total_overdue": 0,
    "total_count": 9,
    "overdue_count": 0,
    "due_this_week": 7001790,
    "due_this_month": 11068290,
    "average_days_to_pay": 0,
    "payment_rate": 0,
    "currency": "PYG"
  }
}
```

---

## Notas Importantes

1. **Backward Compatibility:** Estos cambios **NO son backward compatible**. Frontend debe actualizar referencias de campos.

2. **Migración Gradual:** Se recomienda actualizar en este orden:
   - Importar campos (buscar-reemplazar de `purchase_date` → `order_date`)
   - Testar payables list y detail
   - Testar dashboard con payables reales
   - Validar cálculos de fechas

3. **Base de Datos:** La estructura de la BD está correcta desde el inicio. Estos cambios solo actualizan las consultas a reflejar la realidad.

4. **Documentación:** Se actualizaron:
   - `docs/features/business-intelligence/dashboard-api.md`
   - `docs/features/business-intelligence/payables-api.md`

---

## Contacto

Para preguntas o problemas con la integración de estos cambios, consultar con el equipo de backend.

**Fecha de Aplicación:** 2026-01-23
**Versión de API:** v1
**Ambiente:** Development/Production

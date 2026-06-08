# Guia de Integracion Frontend - API de Transacciones de Precio v1.0

> **Disclaimer:** Esta guia contiene ejemplos JSON y TypeScript/JavaScript para ilustracion de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definicion de campos** como fuente de verdad.

## Indice

1. [Configuracion General](#configuracion-general)
2. [Introduccion al Sistema](#introduccion-al-sistema)
3. [API de Transacciones](#api-de-transacciones)
4. [API de Consultas y Reportes](#api-de-consultas-y-reportes)
5. [Tipos de Transacciones](#tipos-de-transacciones)
6. [Validaciones y Consistencia](#validaciones-y-consistencia)
7. [Codigos de Error](#codigos-de-error)
8. [Ejemplos de Integracion](#ejemplos-de-integracion)

## Nuevo en v1.0 - Septiembre 2025

- **Sistema completo de auditoria** de precios con PostgreSQL
- **8 tipos de transacciones** (ajustes manuales, mercado, costos, promociones, etc.)
- **Validacion automatica de consistencia** de precios
- **Reportes de variacion** con analisis de volatilidad
- **Historial completo** de cambios de precio por producto
- **Metadatos enriquecidos** en formato JSON
- **Integracion completa** con sistema de usuarios y productos
- **API REST robusta** con 7 endpoints especializados
- **Independiente de stock_transactions** - arquitectura separada

---

## Configuracion General

### Base URL
http://localhost:5050

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md).

### Formato de Respuesta Estandar
`{ success: bool, data?, message?, error?, pagination? }`

### Formato de Fechas
- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params: `YYYY-MM-DD`

### Paginacion Estandar
`{ page, page_size, total_items, total_pages, has_next, has_prev }`

### Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restriccion: sucursal debe estar en `allowed_branches`

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Introduccion al Sistema

El **Sistema de Transacciones de Precio** proporciona un control completo y auditable de todos los cambios de precio en el inventario. Cada transaccion queda registrada de manera inmutable con trazabilidad completa y analisis de tendencias.

### Caracteristicas Principales

- **Auditoria Completa**: Cada cambio de precio y costo queda registrado permanentemente
- **Dual Price Type**: Soporta `selling_price` (precio de venta) y `cost_price` (costo)
- **Validacion Automatica**: El sistema valida consistencia entre precios y transacciones
- **Tipos Flexibles**: 8 tipos diferentes de transacciones de precio
- **Metadatos Ricos**: Informacion adicional para analisis de mercado
- **Reportes Inteligentes**: Analisis automatico de variacion y volatilidad
- **Integracion Total**: Conectado con productos, usuarios y precios actuales
- **Arquitectura Independiente**: Sistema separado de stock_transactions

> **Nuevo 2026-05-25:** `price_type='cost_price'` registra costos en `price_transactions` via
> `register_cost_transaction()`. `unit_costs` ahora almacena solo el estado actual (1 fila por producto+unidad);
> el historial completo de costos vive en `price_transactions`.
> Los endpoints de costo estan en `/cost-transactions`. Ver [COST_PRICING_API_GUIDE.md](./COST_PRICING_API_GUIDE.md).

### Flujo Tipico de Uso

1. **Registrar Transacciones** -> Cambios de precio con contexto
2. **Registrar Costos** -> Cambios de costo via `/cost-transactions` o compras
3. **Consultar Historial** -> Ver evolucion de precios por producto
4. **Validar Consistencia** -> Verificar integridad precio-transacciones
5. **Generar Reportes** -> Analisis de variacion y tendencias de precio

---

## API de Transacciones

### 1. Registrar Nueva Transaccion de Precio

**Endpoint:** `POST /price-transactions`

**Descripcion:** Registra un nuevo cambio de precio con actualizacion automatica de la tabla de precios.

#### Request Body

```typescript
interface PriceTransactionRequest {
  product_id: string        // ID del producto (requerido)
  transaction_type: string  // Tipo de transaccion (requerido)
  new_price: number         // Nuevo precio (requerido, > 0)
  unit?: string             // Unidad de medida (opcional: "unit", "kg", "l", etc.)
  price_type: string        // `SELLING_PRICE` o `COST` (requerido)
  effective_date?: string   // Fecha efectiva (opcional, default: now)
  reference_type?: string   // Tipo de referencia (opcional)
  reference_id?: string     // ID de referencia (opcional)
  reason?: string           // Motivo del cambio (opcional)
  currency_id?: string      // ID de moneda (opcional, default: USD)
  exchange_rate?: number    // Tipo de cambio (opcional, default: 1.0)
  cost_factor?: number      // Factor de costo (opcional)
  margin_percent?: number   // Porcentaje de margen (opcional)
  metadata?: Record<string, any> // Metadatos adicionales (opcional)
}
```

> **price_type**: `SELLING_PRICE` → registro en `unit_prices` + auditoria en `price_transactions`.
> `COST` → delega a `register_cost_transaction()` con `price_type='cost_price'` en la DB
> y actualiza `unit_costs` (estado actual unico por producto+unidad).
> Para costos, prefiera los endpoints de `/cost-transactions`.

#### Ejemplo - Ajuste Manual de Precio

```typescript
const manualAdjustmentData = {
  product_id: 'GA4w4YlYpVP1LNji17o9FKbp8Dg',
  transaction_type: 'MANUAL_ADJUSTMENT',
  new_price: 25.99,
  effective_date: '2025-09-04T10:00:00Z',
  reference_type: 'manual_adjustment',
  reference_id: 'ADJ456',
  reason: 'Aumento de precio por analisis de mercado',
  cost_factor: 0.65,
  margin_percent: 35.0,
  metadata: {
    market_analysis: {
      competitor_avg_price: 27.5,
      demand_level: 'high',
      season: 'peak',
    },
    approval: {
      approved_by: 'manager_001',
      approval_date: '2025-09-04T09:30:00Z',
    },
  },
}

const response = await fetch('/price-transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(manualAdjustmentData),
})
```

#### Ejemplo - Actualizacion de Mercado

```typescript
const marketUpdateData = {
  product_id: 'GA4w4YlYpVP1LNji17o9FKbp8Dg',
  transaction_type: 'MARKET_UPDATE',
  new_price: 18.5,
  reference_type: 'market_update',
  reference_id: 'MKT789',
  reason: 'Actualizacion basada en analisis de mercado competitivo',
  metadata: {
    competitor_analysis: {
      avg_price: 19.25,
      our_position: 'competitive',
      market_trend: 'stable',
    },
    data_sources: ['competitor_a', 'competitor_b', 'market_research'],
  },
}
```

#### Ejemplo - Precio Promocional

```typescript
const promotionData = {
  product_id: 'PROD003',
  transaction_type: 'PROMOTION',
  new_price: 12.99,
  effective_date: '2025-02-01T00:00:00Z',
  reference_type: 'promotion',
  reference_id: 'PROMO2025FEB',
  reason: 'Promocion de San Valentin - 20% descuento',
  metadata: {
    promotion_type: 'percentage_discount',
    discount_percent: 20,
    original_price: 16.24,
    start_date: '2025-02-01T00:00:00Z',
    end_date: '2025-02-14T23:59:59Z',
    campaign: 'valentine_special',
  },
}
```

#### Response

```typescript
interface PriceTransactionResponse {
  transaction_id: number
  product_id: string
  old_price: number
  new_price: number
  price_change: number
  message: string
  metadata?: Record<string, any>
}
```

### 2. Obtener Tipos de Transacciones

**Endpoint:** `GET /price-transactions/types`

**Descripcion:** Obtiene los tipos de transacciones de precio disponibles con sus descripciones.

#### Response

```typescript
{
  "transaction_types": [
    "MANUAL_ADJUSTMENT",
    "MARKET_UPDATE",
    "COST_UPDATE",
    "SUPPLIER_CHANGE",
    "PROMOTION",
    "CURRENCY_ADJUSTMENT",
    "INITIAL_PRICE",
    "BULK_UPDATE"
  ],
  "total_types": 8,
  "description": {
    "MANUAL_ADJUSTMENT": "Manual price adjustments by users",
    "MARKET_UPDATE": "Price updates based on market conditions",
    "COST_UPDATE": "Price changes due to cost variations",
    "SUPPLIER_CHANGE": "Price adjustments from supplier changes",
    "PROMOTION": "Promotional price changes",
    "CURRENCY_ADJUSTMENT": "Price adjustments due to currency fluctuations",
    "INITIAL_PRICE": "Initial price setting for new products",
    "BULK_UPDATE": "Bulk price updates across multiple products"
  }
}
```

#### Ejemplo de Uso

```typescript
const getPriceTransactionTypes = async () => {
  const response = await fetch('/price-transactions/types', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await response.json()

  const options = data.transaction_types.map(type => ({
    value: type,
    label: data.description[type],
  }))

  return options
}
```

---

## API de Consultas y Reportes

### 1. Historial de Precios por Producto

**Endpoint:** `GET /price-transactions/product/{product_id}/history`

**Parametros:**

- `product_id` (path): ID del producto
- `limit` (query): Limite de resultados (default: 50)
- `offset` (query): Offset para paginacion (default: 0)

#### Ejemplo

```typescript
const getProductPriceHistory = async (
  productId: string,
  page = 0,
  limit = 20,
) => {
  const offset = page * limit
  const response = await fetch(
    `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  const data = await response.json()

  return {
    product_id: data.product_id,
    history: data.history,
    pagination: {
      limit: data.limit,
      offset: data.offset,
      count: data.count,
    },
  }
}
```

#### Response

```typescript
interface PriceTransactionHistory {
  transaction_id: number
  product_id: string
  product_name: string
  transaction_type: string
  old_price: number
  new_price: number
  price_change: number
  price_change_percent?: number
  effective_date: string
  reference_type?: string
  reference_id?: string
  user_id: string
  user_name: string
  transaction_date: string
  reason?: string
  metadata?: Record<string, any>
  currency_id: string
  exchange_rate: number
  cost_factor?: number
  margin_percent?: number
}
```

### 2. Validar Consistencia de Precios

**Endpoint:** `GET /price-transactions/validate-consistency`

**Parametros:**

- `product_id` (query, opcional): ID del producto especifico

#### Ejemplo - Validar Todos los Precios

```typescript
const validateAllPrices = async () => {
  const response = await fetch('/price-transactions/validate-consistency', {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await response.json()

  const inconsistencies = data.reports.filter(
    report => report.consistency_status !== 'CONSISTENT',
  )

  return {
    validation_timestamp: data.validation_timestamp,
    total: data.total_products,
    inconsistent: inconsistencies.length,
    consistency_rate:
      ((data.total_products - inconsistencies.length) / data.total_products) *
      100,
    reports: inconsistencies,
  }
}
```

#### Ejemplo - Validar Producto Especifico

```typescript
const validateProductPrice = async (productId: string) => {
  const response = await fetch(
    `/price-transactions/validate-consistency?product_id=${productId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  return await response.json()
}
```

#### Response

```typescript
interface PriceConsistencyReport {
  product_id: string
  product_name: string
  current_price: number
  last_transaction_price: number
  price_difference: number
  last_transaction_id?: number
  last_transaction_date?: string
  consistency_status:
    | 'CONSISTENT'
    | 'INCONSISTENT'
    | 'NO_PRICE_DATA'
    | 'MISSING_CURRENT_PRICE'
    | 'NO_PRICE_TRANSACTIONS'
  recommendations: string[]
}
```

### 3. Reporte de Variacion de Precios

**Endpoint:** `GET /price-transactions/variance-report`

**Parametros:**

- `date_from` (query, opcional): Fecha inicio (YYYY-MM-DD)
- `date_to` (query, opcional): Fecha fin (YYYY-MM-DD)
- `transaction_type` (query, opcional): Filtrar por tipo especifico
- `limit` (query, opcional): Limite de resultados (default: 100)
- `offset` (query, opcional): Offset para paginacion (default: 0)

#### Ejemplo

```typescript
const getPriceVarianceReport = async (
  dateFrom?: string,
  dateTo?: string,
  transactionType?: string,
  page = 0,
  limit = 50,
) => {
  const params = new URLSearchParams()
  const offset = page * limit

  if (dateFrom) params.append('date_from', dateFrom)
  if (dateTo) params.append('date_to', dateTo)
  if (transactionType) params.append('transaction_type', transactionType)
  params.append('limit', limit.toString())
  params.append('offset', offset.toString())

  const response = await fetch(
    `/price-transactions/variance-report?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  const data = await response.json()

  return {
    ...data,
    summary: {
      total_products: data.total_products,
      avg_volatility:
        data.reports.reduce((sum, r) => sum + (r.price_volatility || 0), 0) /
        data.reports.length,
      products_with_changes: data.reports.filter(r => r.transaction_count > 0)
        .length,
    },
  }
}
```

#### Response

```typescript
interface PriceVarianceReport {
  product_id: string
  product_name: string
  transaction_count: number
  price_at_start?: number
  price_at_end?: number
  total_price_change?: number
  total_change_percent?: number
  avg_price?: number
  min_price?: number
  max_price?: number
  price_volatility?: number
  last_transaction_date?: string
  last_transaction_type?: string
  last_change_reason?: string
}
```

### 4. Transacciones por Rango de Fechas

**Endpoint:** `GET /price-transactions/by-date`

**Parametros:**

- `start_date` (query, requerido): Fecha inicio (YYYY-MM-DD)
- `end_date` (query, requerido): Fecha fin (YYYY-MM-DD)
- `transaction_type` (query, opcional): Filtrar por tipo
- `limit` (query, opcional): Limite de resultados (default: 100)
- `offset` (query, opcional): Offset para paginacion (default: 0)

#### Ejemplo

```typescript
const getPriceTransactionsByDate = async (
  startDate: string,
  endDate: string,
  transactionType?: string,
  page = 0,
  limit = 50,
) => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: limit.toString(),
    offset: (page * limit).toString(),
  })

  if (transactionType) {
    params.append('transaction_type', transactionType)
  }

  const response = await fetch(`/price-transactions/by-date?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  return await response.json()
}

// Ejemplo para ultimos 30 dias
const getLast30DaysPriceChanges = async () => {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  return await getPriceTransactionsByDate(startDate, endDate)
}
```

### 5. Obtener Transaccion por ID

**Endpoint:** `GET /price-transactions/{id}`

#### Ejemplo

```typescript
const getPriceTransactionById = async (transactionId: number) => {
  const response = await fetch(`/price-transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Transaccion de precio no encontrada')
    }
    throw new Error('Error al obtener transaccion de precio')
  }

  return await response.json()
}
```

---

## Tipos de Transacciones

### 1. MANUAL_ADJUSTMENT - Ajustes Manuales

**Descripcion:** Ajustes manuales de precio realizados por usuarios autorizados
**Uso Tipico:** Correcciones, ajustes estrategicos
**Campos Recomendados:**

- `reason`: Motivo detallado del ajuste
- `reference_type`: "manual_adjustment"
- `metadata`: approval, market_analysis, cost_analysis

### 2. MARKET_UPDATE - Actualizaciones de Mercado

**Descripcion:** Cambios de precio basados en condiciones del mercado
**Uso Tipico:** Seguimiento competencia, demanda
**Campos Recomendados:**

- `reference_type`: "market_update"
- `metadata`: competitor_analysis, market_trend, data_sources

### 3. COST_UPDATE - Actualizacion de Costos

**Descripcion:** Cambios de precio debido a variaciones en costos
**Uso Tipico:** Inflacion, costos de materiales
**Campos Recomendados:**

- `cost_factor`: Factor de costo actualizado
- `metadata`: cost_increase_percent, supplier_notice

### 4. SUPPLIER_CHANGE - Cambio de Proveedor

**Descripcion:** Ajustes de precio por cambios de proveedor
**Uso Tipico:** Nuevos proveedores, negociaciones
**Campos Recomendados:**

- `reference_type`: "supplier_change"
- `metadata`: old_supplier, new_supplier, cost_reduction

### 5. PROMOTION - Promociones

**Descripcion:** Cambios de precio promocionales temporales
**Uso Tipico:** Ofertas, descuentos estacionales
**Campos Recomendados:**

- `reference_type`: "promotion"
- `metadata`: promotion_type, discount_percent, campaign

### 6. CURRENCY_ADJUSTMENT - Ajuste Cambiario

**Descripcion:** Ajustes de precio por fluctuaciones de moneda
**Uso Tipico:** Productos importados, mercados internacionales
**Campos Recomendados:**

- `exchange_rate`: Nuevo tipo de cambio
- `metadata`: previous_exchange_rate, currency_change_percent

### 7. INITIAL_PRICE - Precio Inicial

**Descripcion:** Establecimiento de precio inicial para productos nuevos
**Uso Tipico:** Lanzamiento de productos
**Campos Recomendados:**

- `reference_type`: "initial_price"
- `metadata`: pricing_strategy, market_research

### 8. BULK_UPDATE - Actualizacion Masiva

**Descripcion:** Actualizaciones masivas de precios en multiples productos
**Uso Tipico:** Ajustes por categoria, inflacion general
**Campos Recomendados:**

- `reference_type`: "bulk_update"
- `metadata`: update_criteria, affected_categories

---

## Validaciones y Consistencia

### Validaciones Automaticas

1. **Producto Existente**: Verifica que el product_id exista
2. **Usuario Autenticado**: Valida que el usuario tenga permisos
3. **Tipo Valido**: Confirma que transaction_type sea valido
4. **Precio Positivo**: new_price debe ser mayor que 0
5. **Moneda Valida**: Verifica que currency_id sea valida

### Estados de Consistencia

```typescript
const interpretConsistencyStatus = (status: string) => {
  const statusMap = {
    CONSISTENT: {
      level: 'success',
      message: 'Precio consistente con transacciones',
      action: 'none',
    },
    INCONSISTENT: {
      level: 'error',
      message: 'Precio actual no coincide con ultima transaccion',
      action: 'Sincronizar precio o revisar transacciones',
    },
    NO_PRICE_DATA: {
      level: 'warning',
      message: 'No hay datos de precio',
      action: 'Establecer precio inicial',
    },
    MISSING_CURRENT_PRICE: {
      level: 'warning',
      message: 'Precio actual no encontrado',
      action: 'Actualizar tabla de precios',
    },
    NO_PRICE_TRANSACTIONS: {
      level: 'info',
      message: 'No hay transacciones de precio registradas',
      action: 'Crear transaccion inicial',
    },
  }

  return (
    statusMap[status] || {
      level: 'unknown',
      message: 'Estado desconocido',
      action: 'Revisar manualmente',
    }
  )
}
```

---

## Codigos de Error

### Errores de Validacion (400)

```typescript
{
  "error": "product_id es requerido",
  "code": "VALIDATION_ERROR"
}

{
  "error": "Tipo de transaccion invalido: INVALID_TYPE",
  "code": "INVALID_TRANSACTION_TYPE"
}

{
  "error": "new_price debe ser mayor que 0",
  "code": "INVALID_PRICE"
}

{
  "error": "Datos de entrada invalidos",
  "code": "INVALID_REQUEST_BODY"
}
```

### Errores de Autorizacion (401)

```typescript
{
  "error": "Usuario no autenticado",
  "code": "UNAUTHORIZED"
}

{
  "error": "Token invalido o expirado",
  "code": "INVALID_TOKEN"
}
```

### Errores de Recursos (404)

```typescript
{
  "error": "Producto no encontrado",
  "code": "PRODUCT_NOT_FOUND"
}

{
  "error": "Transaccion de precio no encontrada",
  "code": "PRICE_TRANSACTION_NOT_FOUND"
}

{
  "error": "Usuario no encontrado",
  "code": "USER_NOT_FOUND"
}
```

### Errores de Negocio (422)

```typescript
{
  "error": "Precio no puede ser negativo o cero",
  "code": "INVALID_PRICE_VALUE"
}

{
  "error": "Fecha efectiva no puede ser en el futuro",
  "code": "INVALID_EFFECTIVE_DATE"
}
```

### Errores del Servidor (500)

```typescript
{
  "error": "Error interno del servidor",
  "code": "INTERNAL_ERROR"
}

{
  "error": "Error de base de datos",
  "code": "DATABASE_ERROR"
}
```

---

## Ejemplos de Integracion

### Componente React - Registro de Transacciones de Precio

```typescript
import React, { useState, useEffect } from 'react'

interface PriceTransactionFormProps {
  productId: string
  currentPrice?: number
  onSuccess?: (transaction: PriceTransactionResponse) => void
}

const PriceTransactionForm: React.FC<PriceTransactionFormProps> = ({
  productId,
  currentPrice,
  onSuccess
}) => {
  const [transactionTypes, setTransactionTypes] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    transaction_type: '',
    new_price: currentPrice || 0,
    reason: '',
    reference_id: '',
    cost_factor: '',
    margin_percent: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTransactionTypes = async () => {
      try {
        const response = await fetch('/price-transactions/types', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
        const data = await response.json()
        setTransactionTypes(data.description)
      } catch (err) {
        console.error('Error loading transaction types:', err)
      }
    }

    loadTransactionTypes()
  }, [])

  const calculatePriceChange = () => {
    if (!currentPrice || !formData.new_price) return null
    const change = formData.new_price - currentPrice
    const percent = (change / currentPrice) * 100
    return { change, percent }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const requestData = {
        product_id: productId,
        transaction_type: formData.transaction_type,
        new_price: Number(formData.new_price),
        reason: formData.reason || undefined,
        reference_id: formData.reference_id || undefined,
        cost_factor: formData.cost_factor ? Number(formData.cost_factor) : undefined,
        margin_percent: formData.margin_percent ? Number(formData.margin_percent) : undefined,
        metadata: {
          form_submission: true,
          timestamp: new Date().toISOString(),
          previous_price: currentPrice
        }
      }

      const response = await fetch('/price-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al registrar transaccion de precio')
      }

      const transaction = await response.json()

      setFormData({
        transaction_type: '',
        new_price: 0,
        reason: '',
        reference_id: '',
        cost_factor: '',
        margin_percent: ''
      })

      onSuccess?.(transaction)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const priceChange = calculatePriceChange()

  return (
    <form onSubmit={handleSubmit} className="price-transaction-form">
      <h3>Registrar Cambio de Precio</h3>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {currentPrice && (
        <div className="current-price-info">
          <strong>Precio Actual:</strong> ${currentPrice.toFixed(2)}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="transaction_type">Tipo de Transaccion:</label>
        <select
          id="transaction_type"
          value={formData.transaction_type}
          onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
          required
        >
          <option value="">Seleccionar tipo...</option>
          {Object.entries(transactionTypes).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="new_price">Nuevo Precio:</label>
        <input
          type="number"
          id="new_price"
          value={formData.new_price}
          onChange={(e) => setFormData({ ...formData, new_price: Number(e.target.value) })}
          step="0.01"
          min="0.01"
          required
        />
        {priceChange && (
          <div className={`price-change-indicator ${priceChange.change >= 0 ? 'positive' : 'negative'}`}>
            {priceChange.change >= 0 ? '+' : ''}${priceChange.change.toFixed(2)}
            ({priceChange.percent.toFixed(2)}%)
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="reason">Motivo del Cambio:</label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
          placeholder="Describe el motivo del cambio de precio..."
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="cost_factor">Factor de Costo (%):</label>
          <input
            type="number"
            id="cost_factor"
            value={formData.cost_factor}
            onChange={(e) => setFormData({ ...formData, cost_factor: e.target.value })}
            step="0.01"
            min="0"
            max="1"
            placeholder="0.65"
          />
        </div>

        <div className="form-group">
          <label htmlFor="margin_percent">Margen (%):</label>
          <input
            type="number"
            id="margin_percent"
            value={formData.margin_percent}
            onChange={(e) => setFormData({ ...formData, margin_percent: e.target.value })}
            step="0.1"
            min="0"
            placeholder="35.0"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="reference_id">ID de Referencia (opcional):</label>
        <input
          type="text"
          id="reference_id"
          value={formData.reference_id}
          onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
          placeholder="ADJ-001, MKT-001, PROMO-001, etc."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar Cambio de Precio'}
      </button>
    </form>
  )
}

export default PriceTransactionForm
```

### Componente React - Historial de Precios

```typescript
import React, { useState, useEffect } from 'react'

interface PriceHistoryProps {
  productId: string
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ productId }) => {
  const [history, setHistory] = useState<PriceTransactionHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const limit = 20

  const loadHistory = async (pageNum = 0, append = false) => {
    try {
      setLoading(true)
      const offset = pageNum * limit
      const response = await fetch(
        `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      )

      const data = await response.json()

      if (append) {
        setHistory(prev => [...prev, ...data.history])
      } else {
        setHistory(data.history)
      }

      setHasMore(data.history.length === limit)
      setPage(pageNum)

    } catch (error) {
      console.error('Error loading price history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [productId])

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHistory(page + 1, true)
    }
  }

  const formatTransactionType = (type: string) => {
    const types = {
      'MANUAL_ADJUSTMENT': 'Ajuste Manual',
      'MARKET_UPDATE': 'Actualizacion de Mercado',
      'COST_UPDATE': 'Actualizacion de Costos',
      'SUPPLIER_CHANGE': 'Cambio de Proveedor',
      'PROMOTION': 'Promocion',
      'CURRENCY_ADJUSTMENT': 'Ajuste Cambiario',
      'INITIAL_PRICE': 'Precio Inicial',
      'BULK_UPDATE': 'Actualizacion Masiva'
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPriceChange = (change: number, percent?: number) => {
    const sign = change >= 0 ? '+' : ''
    const percentText = percent ? ` (${sign}${percent.toFixed(2)}%)` : ''

    return `${sign}$${change.toFixed(2)}${percentText}`
  }

  if (history.length === 0 && !loading) {
    return <p>No hay cambios de precio registrados para este producto.</p>
  }

  return (
    <div className="price-history">
      <h3>Historial de Precios</h3>

      <div className="history-list">
        {history.map((transaction) => (
          <div key={transaction.transaction_id} className="history-item">
            <div className="transaction-header">
              <span className="transaction-type">
                {formatTransactionType(transaction.transaction_type)}
              </span>
              <span className="transaction-date">
                {formatDate(transaction.transaction_date)}
              </span>
            </div>

            <div className="price-details">
              <div className="price-change-info">
                <div className="price-flow">
                  <span className="old-price">${transaction.old_price.toFixed(2)}</span>
                  <span className="arrow">-></span>
                  <span className="new-price">${transaction.new_price.toFixed(2)}</span>
                </div>
                <div className="change-amount">
                  {formatPriceChange(transaction.price_change, transaction.price_change_percent)}
                </div>
              </div>

              {transaction.reason && (
                <div className="reason">
                  <strong>Motivo:</strong> {transaction.reason}
                </div>
              )}

              {transaction.reference_id && (
                <div className="reference">
                  <strong>Referencia:</strong> {transaction.reference_id}
                </div>
              )}

              {transaction.user_name && (
                <div className="user">
                  <strong>Usuario:</strong> {transaction.user_name}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button onClick={loadMore} disabled={loading} className="load-more-btn">
          {loading ? 'Cargando...' : 'Cargar mas'}
        </button>
      )}
    </div>
  )
}

export default PriceHistory
```

### Componente React - Validacion de Consistencia de Precios

```typescript
import React, { useState } from 'react'

interface PriceConsistencyCheckProps {
  productId?: string
}

const PriceConsistencyCheck: React.FC<PriceConsistencyCheckProps> = ({ productId }) => {
  const [reports, setReports] = useState<PriceConsistencyReport[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<{
    total: number
    inconsistent: number
    consistency_rate: number
  } | null>(null)

  const runConsistencyCheck = async () => {
    setLoading(true)
    try {
      const url = productId
        ? `/price-transactions/validate-consistency?product_id=${productId}`
        : '/price-transactions/validate-consistency'

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })

      const data = await response.json()
      const reportArray = Array.isArray(data.reports) ? data.reports : [data]
      setReports(reportArray)

      const inconsistent = reportArray.filter(r => r.consistency_status !== 'CONSISTENT')
      setSummary({
        total: reportArray.length,
        inconsistent: inconsistent.length,
        consistency_rate: ((reportArray.length - inconsistent.length) / reportArray.length) * 100
      })

    } catch (error) {
      console.error('Error checking price consistency:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      'CONSISTENT': 'OK',
      'INCONSISTENT': 'XX',
      'NO_PRICE_DATA': '--',
      'MISSING_CURRENT_PRICE': '??',
      'NO_PRICE_TRANSACTIONS': '..'
    }
    return icons[status] || '?'
  }

  return (
    <div className="price-consistency-check">
      <div className="check-header">
        <h3>Validacion de Consistencia de Precios</h3>
        <button onClick={runConsistencyCheck} disabled={loading}>
          {loading ? 'Validando...' : 'Ejecutar Validacion'}
        </button>
      </div>

      {summary && (
        <div className="consistency-summary">
          <div className="summary-item">
            <span>Total de Productos:</span>
            <span>{summary.total}</span>
          </div>
          <div className="summary-item">
            <span>Inconsistentes:</span>
            <span>{summary.inconsistent}</span>
          </div>
          <div className="summary-item">
            <span>Tasa de Consistencia:</span>
            <span>{summary.consistency_rate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {reports.length > 0 && (
        <div className="consistency-reports">
          {reports.map((report) => (
            <div key={report.product_id} className="consistency-report">
              <div className="report-header">
                <span className="status-icon">
                  {getStatusIcon(report.consistency_status)}
                </span>
                <span className="product-name">{report.product_name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PriceConsistencyCheck
```

### Hook Personalizado para Price Transactions

```typescript
import { useState, useCallback } from 'react'

interface UsePriceTransactionsResult {
  registerTransaction: (
    data: PriceTransactionRequest,
  ) => Promise<PriceTransactionResponse>
  getProductHistory: (
    productId: string,
    page?: number,
    limit?: number,
  ) => Promise<any>
  validateConsistency: (productId?: string) => Promise<PriceConsistencyReport[]>
  getVarianceReport: (
    dateFrom?: string,
    dateTo?: string,
    transactionType?: string,
  ) => Promise<any>
  getTransactionTypes: () => Promise<any>
  loading: boolean
  error: string | null
}

export const usePriceTransactions = (): UsePriceTransactionsResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const makeRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = localStorage.getItem('token')
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        )
      }

      return response.json()
    },
    [],
  )

  const registerTransaction = useCallback(
    async (
      data: PriceTransactionRequest,
    ): Promise<PriceTransactionResponse> => {
      setLoading(true)
      setError(null)
      try {
        const result = await makeRequest('/price-transactions', {
          method: 'POST',
          body: JSON.stringify(data),
        })
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const getProductHistory = useCallback(
    async (productId: string, page = 0, limit = 20) => {
      setLoading(true)
      setError(null)
      try {
        const offset = page * limit
        const result = await makeRequest(
          `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`,
        )
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const validateConsistency = useCallback(
    async (productId?: string): Promise<PriceConsistencyReport[]> => {
      setLoading(true)
      setError(null)
      try {
        const url = productId
          ? `/price-transactions/validate-consistency?product_id=${productId}`
          : '/price-transactions/validate-consistency'
        const result = await makeRequest(url)
        return result.reports || [result]
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const getVarianceReport = useCallback(
    async (dateFrom?: string, dateTo?: string, transactionType?: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (dateFrom) params.append('date_from', dateFrom)
        if (dateTo) params.append('date_to', dateTo)
        if (transactionType) params.append('transaction_type', transactionType)

        const url = `/price-transactions/variance-report?${params.toString()}`
        const result = await makeRequest(url)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [makeRequest],
  )

  const getTransactionTypes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await makeRequest('/price-transactions/types')
      return result
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [makeRequest])

  return {
    registerTransaction,
    getProductHistory,
    validateConsistency,
    getVarianceReport,
    getTransactionTypes,
    loading,
    error,
  }
}
```

### Componente Dashboard de Precios

```typescript
import React, { useState, useEffect } from 'react'

const PriceManagementDashboard: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    recentChanges: 0,
    avgVolatility: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      setDashboardData({
        totalProducts: 100,
        recentChanges: 25,
        avgVolatility: 3.5
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  const handleTransactionSuccess = (transaction: PriceTransactionResponse) => {
    console.log('Price transaction registered:', transaction)
    setCurrentPrice(transaction.new_price)
    loadDashboardData()
  }

  return (
    <div className="price-management-dashboard">
      <h1>Gestion de Precios</h1>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Productos Totales</h3>
          <span className="stat-value">{dashboardData.totalProducts}</span>
        </div>
        <div className="stat-card">
          <h3>Cambios Recientes (30d)</h3>
          <span className="stat-value">{dashboardData.recentChanges}</span>
        </div>
        <div className="stat-card">
          <h3>Volatilidad Promedio</h3>
          <span className="stat-value">{dashboardData.avgVolatility.toFixed(2)}%</span>
        </div>
      </div>

      <div className="management-sections">
        <section className="register-section">
          {selectedProductId && (
            <p>Producto seleccionado: {selectedProductId}</p>
          )}
        </section>
      </div>
    </div>
  )
}

export default PriceManagementDashboard
```

---

## Notas Adicionales

### Mejores Practicas

1. **Siempre incluir contexto** en reason y metadata para auditoria
2. **Validar consistencia** regularmente, especialmente despues de cambios masivos
3. **Usar tipos especificos** de transacciones para mejor clasificacion
4. **Implementar aprobaciones** para cambios significativos de precio
5. **Monitorear volatilidad** para detectar anomalias

### Consideraciones de Rendimiento

- Las consultas de historial soportan paginacion para grandes volumenes
- Los reportes de variacion pueden ser costosos para muchos productos
- Considerar cache para tipos de transacciones y datos frecuentes
- Usar indices en fechas y product_id para optimizar consultas

### Seguridad

- Todas las operaciones requieren autenticacion JWT
- Validar permisos para cambios de precio segun roles de usuario
- Auditar todos los accesos a reportes de precio
- Proteger metadatos sensibles (costos, margenes)

### Integracion con Otros Sistemas

- **Manual Adjustments**: Integracion automatica mediante funcion especializada
- **Products.Prices**: Actualizacion automatica del precio actual
- **Stock Transactions**: Sistemas independientes sin interferencias
- **Reporting**: Datos disponibles para analisis de BI

---

**Version:** 1.0
**Mantenido por:** Equipo de Desarrollo

---

_Ultima actualizacion: 2026-05-19_

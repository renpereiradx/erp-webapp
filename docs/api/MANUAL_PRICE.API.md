# 💰 Guía de Integración Frontend - API de Transacciones de Precio v1.0

## 📋 Índice
1. [Configuración General](#configuración-general)
2. [Introducción al Sistema](#introducción-al-sistema)
3. [API de Transacciones](#api-de-transacciones)
4. [API de Consultas y Reportes](#api-de-consultas-y-reportes)
5. [Tipos de Transacciones](#tipos-de-transacciones)
6. [Validaciones y Consistencia](#validaciones-y-consistencia)
7. [Códigos de Error](#códigos-de-error)
8. [Ejemplos de Integración](#ejemplos-de-integración)

## 🆕 **Nuevo en v1.0 - Septiembre 2025**
- ✅ **Sistema completo de auditoría** de precios con PostgreSQL
- ✅ **8 tipos de transacciones** (ajustes manuales, mercado, costos, promociones, etc.)
- ✅ **Validación automática de consistencia** de precios
- ✅ **Reportes de variación** con análisis de volatilidad
- ✅ **Historial completo** de cambios de precio por producto
- ✅ **Metadatos enriquecidos** en formato JSON
- ✅ **Integración completa** con sistema de usuarios y productos
- ✅ **API REST robusta** con 7 endpoints especializados
- ✅ **Independiente de stock_transactions** - arquitectura separada

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```typescript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <jwt_token>"
}
```

### Formato de Respuesta Estándar
```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
}
```

---

## 🏗️ Introducción al Sistema

El **Sistema de Transacciones de Precio** proporciona un control completo y auditable de todos los cambios de precio en el inventario. Cada transacción queda registrada de manera inmutable con trazabilidad completa y análisis de tendencias.

### Características Principales

- **Auditoría Completa**: Cada cambio de precio queda registrado permanentemente
- **Validación Automática**: El sistema valida consistencia entre precios y transacciones
- **Tipos Flexibles**: 8 tipos diferentes de transacciones de precio
- **Metadatos Ricos**: Información adicional para análisis de mercado
- **Reportes Inteligentes**: Análisis automático de variación y volatilidad
- **Integración Total**: Conectado con productos, usuarios y precios actuales
- **Arquitectura Independiente**: Sistema separado de stock_transactions

### Flujo Típico de Uso

1. **Registrar Transacciones** → Cambios de precio con contexto
2. **Consultar Historial** → Ver evolución de precios por producto
3. **Validar Consistencia** → Verificar integridad precio-transacciones
4. **Generar Reportes** → Análisis de variación y tendencias de precio

---

## 💰 API de Transacciones

### 1. Registrar Nueva Transacción de Precio

**Endpoint:** `POST /price-transactions`

**Descripción:** Registra un nuevo cambio de precio con actualización automática de la tabla de precios.

#### Request Body
```typescript
interface PriceTransactionRequest {
  product_id: string;           // ID del producto (requerido)
  transaction_type: string;     // Tipo de transacción (requerido)
  new_price: number;           // Nuevo precio (requerido, > 0)
  effective_date?: string;     // Fecha efectiva (opcional, default: now)
  reference_type?: string;     // Tipo de referencia (opcional)
  reference_id?: string;       // ID de referencia (opcional)
  reason?: string;             // Motivo del cambio (opcional)
  currency_id?: string;        // ID de moneda (opcional, default: USD)
  exchange_rate?: number;      // Tipo de cambio (opcional, default: 1.0)
  cost_factor?: number;        // Factor de costo (opcional)
  margin_percent?: number;     // Porcentaje de margen (opcional)
  metadata?: Record<string, any>; // Metadatos adicionales (opcional)
}
```

#### Ejemplo - Ajuste Manual de Precio
```typescript
const manualAdjustmentData = {
  product_id: "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  transaction_type: "MANUAL_ADJUSTMENT",
  new_price: 25.99,
  effective_date: "2025-09-04T10:00:00Z",
  reference_type: "manual_adjustment",
  reference_id: "ADJ456",
  reason: "Aumento de precio por análisis de mercado",
  cost_factor: 0.65,
  margin_percent: 35.0,
  metadata: {
    market_analysis: {
      competitor_avg_price: 27.50,
      demand_level: "high",
      season: "peak"
    },
    approval: {
      approved_by: "manager_001",
      approval_date: "2025-09-04T09:30:00Z"
    }
  }
};

const response = await fetch('/price-transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(manualAdjustmentData)
});
```

#### Ejemplo - Actualización de Mercado
```typescript
const marketUpdateData = {
  product_id: "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  transaction_type: "MARKET_UPDATE",
  new_price: 18.50,
  reference_type: "market_update",
  reference_id: "MKT789",
  reason: "Actualización basada en análisis de mercado competitivo",
  metadata: {
    competitor_analysis: {
      avg_price: 19.25,
      our_position: "competitive",
      market_trend: "stable"
    },
    data_sources: ["competitor_a", "competitor_b", "market_research"]
  }
};
```

#### Ejemplo - Precio Promocional
```typescript
const promotionData = {
  product_id: "PROD003",
  transaction_type: "PROMOTION",
  new_price: 12.99,
  effective_date: "2025-02-01T00:00:00Z",
  reference_type: "promotion",
  reference_id: "PROMO2025FEB",
  reason: "Promoción de San Valentín - 20% descuento",
  metadata: {
    promotion_type: "percentage_discount",
    discount_percent: 20,
    original_price: 16.24,
    start_date: "2025-02-01T00:00:00Z",
    end_date: "2025-02-14T23:59:59Z",
    campaign: "valentine_special"
  }
};
```

#### Response
```typescript
interface PriceTransactionResponse {
  transaction_id: number;
  product_id: string;
  old_price: number;
  new_price: number;
  price_change: number;
  message: string;
  metadata?: Record<string, any>;
}
```

### 2. Obtener Tipos de Transacciones

**Endpoint:** `GET /price-transactions/types`

**Descripción:** Obtiene los tipos de transacciones de precio disponibles con sus descripciones.

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
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  // Crear dropdown para el frontend
  const options = data.transaction_types.map(type => ({
    value: type,
    label: data.description[type]
  }));
  
  return options;
};
```

---

## 📊 API de Consultas y Reportes

### 1. Historial de Precios por Producto

**Endpoint:** `GET /price-transactions/product/{product_id}/history`

**Parámetros:**
- `product_id` (path): ID del producto
- `limit` (query): Límite de resultados (default: 50)
- `offset` (query): Offset para paginación (default: 0)

#### Ejemplo
```typescript
const getProductPriceHistory = async (productId: string, page = 0, limit = 20) => {
  const offset = page * limit;
  const response = await fetch(
    `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  return {
    product_id: data.product_id,
    history: data.history,
    pagination: {
      limit: data.limit,
      offset: data.offset,
      count: data.count
    }
  };
};
```

#### Response
```typescript
interface PriceTransactionHistory {
  transaction_id: number;
  product_id: string;
  product_name: string;
  transaction_type: string;
  old_price: number;
  new_price: number;
  price_change: number;
  price_change_percent?: number;
  effective_date: string;
  reference_type?: string;
  reference_id?: string;
  user_id: string;
  user_name: string;
  transaction_date: string;
  reason?: string;
  metadata?: Record<string, any>;
  currency_id: string;
  exchange_rate: number;
  cost_factor?: number;
  margin_percent?: number;
}
```

### 2. Validar Consistencia de Precios

**Endpoint:** `GET /price-transactions/validate-consistency`

**Parámetros:**
- `product_id` (query, opcional): ID del producto específico

#### Ejemplo - Validar Todos los Precios
```typescript
const validateAllPrices = async () => {
  const response = await fetch('/price-transactions/validate-consistency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  // Filtrar productos con inconsistencias
  const inconsistencies = data.reports.filter(report => 
    report.consistency_status !== 'CONSISTENT'
  );
  
  return {
    validation_timestamp: data.validation_timestamp,
    total: data.total_products,
    inconsistent: inconsistencies.length,
    consistency_rate: ((data.total_products - inconsistencies.length) / data.total_products) * 100,
    reports: inconsistencies
  };
};
```

#### Ejemplo - Validar Producto Específico
```typescript
const validateProductPrice = async (productId: string) => {
  const response = await fetch(
    `/price-transactions/validate-consistency?product_id=${productId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return await response.json();
};
```

#### Response
```typescript
interface PriceConsistencyReport {
  product_id: string;
  product_name: string;
  current_price: number;
  last_transaction_price: number;
  price_difference: number;
  last_transaction_id?: number;
  last_transaction_date?: string;
  consistency_status: 'CONSISTENT' | 'INCONSISTENT' | 'NO_PRICE_DATA' | 'MISSING_CURRENT_PRICE' | 'NO_PRICE_TRANSACTIONS';
  recommendations: string[];
}
```

### 3. Reporte de Variación de Precios

**Endpoint:** `GET /price-transactions/variance-report`

**Parámetros:**
- `date_from` (query, opcional): Fecha inicio (YYYY-MM-DD)
- `date_to` (query, opcional): Fecha fin (YYYY-MM-DD)
- `transaction_type` (query, opcional): Filtrar por tipo específico
- `limit` (query, opcional): Límite de resultados (default: 100)
- `offset` (query, opcional): Offset para paginación (default: 0)

#### Ejemplo
```typescript
const getPriceVarianceReport = async (
  dateFrom?: string, 
  dateTo?: string,
  transactionType?: string,
  page = 0,
  limit = 50
) => {
  const params = new URLSearchParams();
  const offset = page * limit;
  
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  if (transactionType) params.append('transaction_type', transactionType);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  
  const response = await fetch(
    `/price-transactions/variance-report?${params.toString()}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const data = await response.json();
  
  return {
    ...data,
    summary: {
      total_products: data.total_products,
      avg_volatility: data.reports.reduce((sum, r) => 
        sum + (r.price_volatility || 0), 0) / data.reports.length,
      products_with_changes: data.reports.filter(r => r.transaction_count > 0).length
    }
  };
};
```

#### Response
```typescript
interface PriceVarianceReport {
  product_id: string;
  product_name: string;
  transaction_count: number;
  price_at_start?: number;
  price_at_end?: number;
  total_price_change?: number;
  total_change_percent?: number;
  avg_price?: number;
  min_price?: number;
  max_price?: number;
  price_volatility?: number;
  last_transaction_date?: string;
  last_transaction_type?: string;
  last_change_reason?: string;
}
```

### 4. Transacciones por Rango de Fechas

**Endpoint:** `GET /price-transactions/by-date`

**Parámetros:**
- `start_date` (query, requerido): Fecha inicio (YYYY-MM-DD)
- `end_date` (query, requerido): Fecha fin (YYYY-MM-DD)
- `transaction_type` (query, opcional): Filtrar por tipo
- `limit` (query, opcional): Límite de resultados (default: 100)
- `offset` (query, opcional): Offset para paginación (default: 0)

#### Ejemplo
```typescript
const getPriceTransactionsByDate = async (
  startDate: string,
  endDate: string,
  transactionType?: string,
  page = 0,
  limit = 50
) => {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    limit: limit.toString(),
    offset: (page * limit).toString()
  });
  
  if (transactionType) {
    params.append('transaction_type', transactionType);
  }
  
  const response = await fetch(`/price-transactions/by-date?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};

// Ejemplo para últimos 30 días
const getLast30DaysPriceChanges = async () => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  return await getPriceTransactionsByDate(startDate, endDate);
};
```

### 5. Obtener Transacción por ID

**Endpoint:** `GET /price-transactions/{id}`

#### Ejemplo
```typescript
const getPriceTransactionById = async (transactionId: number) => {
  const response = await fetch(`/price-transactions/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Transacción de precio no encontrada');
    }
    throw new Error('Error al obtener transacción de precio');
  }
  
  return await response.json();
};
```

---

## 🏷️ Tipos de Transacciones

### 1. MANUAL_ADJUSTMENT - Ajustes Manuales
**Descripción:** Ajustes manuales de precio realizados por usuarios autorizados  
**Uso Típico:** Correcciones, ajustes estratégicos  
**Campos Recomendados:**
- `reason`: Motivo detallado del ajuste
- `reference_type`: "manual_adjustment"
- `metadata`: approval, market_analysis, cost_analysis

### 2. MARKET_UPDATE - Actualizaciones de Mercado
**Descripción:** Cambios de precio basados en condiciones del mercado  
**Uso Típico:** Seguimiento competencia, demanda  
**Campos Recomendados:**
- `reference_type`: "market_update"
- `metadata`: competitor_analysis, market_trend, data_sources

### 3. COST_UPDATE - Actualización de Costos
**Descripción:** Cambios de precio debido a variaciones en costos  
**Uso Típico:** Inflación, costos de materiales  
**Campos Recomendados:**
- `cost_factor`: Factor de costo actualizado
- `metadata`: cost_increase_percent, supplier_notice

### 4. SUPPLIER_CHANGE - Cambio de Proveedor
**Descripción:** Ajustes de precio por cambios de proveedor  
**Uso Típico:** Nuevos proveedores, negociaciones  
**Campos Recomendados:**
- `reference_type`: "supplier_change"
- `metadata`: old_supplier, new_supplier, cost_reduction

### 5. PROMOTION - Promociones
**Descripción:** Cambios de precio promocionales temporales  
**Uso Típico:** Ofertas, descuentos estacionales  
**Campos Recomendados:**
- `reference_type`: "promotion"
- `metadata`: promotion_type, discount_percent, campaign

### 6. CURRENCY_ADJUSTMENT - Ajuste Cambiario
**Descripción:** Ajustes de precio por fluctuaciones de moneda  
**Uso Típico:** Productos importados, mercados internacionales  
**Campos Recomendados:**
- `exchange_rate`: Nuevo tipo de cambio
- `metadata`: previous_exchange_rate, currency_change_percent

### 7. INITIAL_PRICE - Precio Inicial
**Descripción:** Establecimiento de precio inicial para productos nuevos  
**Uso Típico:** Lanzamiento de productos  
**Campos Recomendados:**
- `reference_type`: "initial_price"
- `metadata`: pricing_strategy, market_research

### 8. BULK_UPDATE - Actualización Masiva
**Descripción:** Actualizaciones masivas de precios en múltiples productos  
**Uso Típico:** Ajustes por categoría, inflación general  
**Campos Recomendados:**
- `reference_type`: "bulk_update"
- `metadata`: update_criteria, affected_categories

---

## ✅ Validaciones y Consistencia

### Validaciones Automáticas

1. **Producto Existente**: Verifica que el product_id exista
2. **Usuario Autenticado**: Valida que el usuario tenga permisos
3. **Tipo Válido**: Confirma que transaction_type sea válido
4. **Precio Positivo**: new_price debe ser mayor que 0
5. **Moneda Válida**: Verifica que currency_id sea válida

### Estados de Consistencia

```typescript
const interpretConsistencyStatus = (status: string) => {
  const statusMap = {
    'CONSISTENT': {
      level: 'success',
      message: 'Precio consistente con transacciones',
      action: 'none'
    },
    'INCONSISTENT': {
      level: 'error',
      message: 'Precio actual no coincide con última transacción',
      action: 'Sincronizar precio o revisar transacciones'
    },
    'NO_PRICE_DATA': {
      level: 'warning',
      message: 'No hay datos de precio',
      action: 'Establecer precio inicial'
    },
    'MISSING_CURRENT_PRICE': {
      level: 'warning',
      message: 'Precio actual no encontrado',
      action: 'Actualizar tabla de precios'
    },
    'NO_PRICE_TRANSACTIONS': {
      level: 'info',
      message: 'No hay transacciones de precio registradas',
      action: 'Crear transacción inicial'
    }
  };
  
  return statusMap[status] || {
    level: 'unknown',
    message: 'Estado desconocido',
    action: 'Revisar manualmente'
  };
};
```

---

## ❌ Códigos de Error

### Errores de Validación (400)
```typescript
{
  "error": "product_id es requerido",
  "code": "VALIDATION_ERROR"
}

{
  "error": "Tipo de transacción inválido: INVALID_TYPE",
  "code": "INVALID_TRANSACTION_TYPE"
}

{
  "error": "new_price debe ser mayor que 0",
  "code": "INVALID_PRICE"
}

{
  "error": "Datos de entrada inválidos",
  "code": "INVALID_REQUEST_BODY"
}
```

### Errores de Autorización (401)
```typescript
{
  "error": "Usuario no autenticado",
  "code": "UNAUTHORIZED"
}

{
  "error": "Token inválido o expirado",
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
  "error": "Transacción de precio no encontrada",
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

## 🚀 Ejemplos de Integración

### Componente React - Registro de Transacciones de Precio

```typescript
import React, { useState, useEffect } from 'react';

interface PriceTransactionFormProps {
  productId: string;
  currentPrice?: number;
  onSuccess?: (transaction: PriceTransactionResponse) => void;
}

const PriceTransactionForm: React.FC<PriceTransactionFormProps> = ({ 
  productId, 
  currentPrice,
  onSuccess 
}) => {
  const [transactionTypes, setTransactionTypes] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    transaction_type: '',
    new_price: currentPrice || 0,
    reason: '',
    reference_id: '',
    cost_factor: '',
    margin_percent: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tipos de transacciones al montar
  useEffect(() => {
    const loadTransactionTypes = async () => {
      try {
        const response = await fetch('/price-transactions/types', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setTransactionTypes(data.description);
      } catch (err) {
        console.error('Error loading transaction types:', err);
      }
    };

    loadTransactionTypes();
  }, []);

  const calculatePriceChange = () => {
    if (!currentPrice || !formData.new_price) return null;
    const change = formData.new_price - currentPrice;
    const percent = (change / currentPrice) * 100;
    return { change, percent };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      };

      const response = await fetch('/price-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar transacción de precio');
      }

      const transaction = await response.json();
      
      // Reset form
      setFormData({
        transaction_type: '',
        new_price: 0,
        reason: '',
        reference_id: '',
        cost_factor: '',
        margin_percent: ''
      });

      onSuccess?.(transaction);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const priceChange = calculatePriceChange();

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
        <label htmlFor="transaction_type">Tipo de Transacción:</label>
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
  );
};

export default PriceTransactionForm;
```

### Componente React - Historial de Precios

```typescript
import React, { useState, useEffect } from 'react';

interface PriceHistoryProps {
  productId: string;
}

const PriceHistory: React.FC<PriceHistoryProps> = ({ productId }) => {
  const [history, setHistory] = useState<PriceTransactionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const loadHistory = async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      const offset = pageNum * limit;
      const response = await fetch(
        `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const data = await response.json();
      
      if (append) {
        setHistory(prev => [...prev, ...data.history]);
      } else {
        setHistory(data.history);
      }
      
      setHasMore(data.history.length === limit);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Error loading price history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [productId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadHistory(page + 1, true);
    }
  };

  const formatTransactionType = (type: string) => {
    const types = {
      'MANUAL_ADJUSTMENT': '🔧 Ajuste Manual',
      'MARKET_UPDATE': '📊 Actualización de Mercado',
      'COST_UPDATE': '💰 Actualización de Costos',
      'SUPPLIER_CHANGE': '🏭 Cambio de Proveedor',
      'PROMOTION': '🎉 Promoción',
      'CURRENCY_ADJUSTMENT': '💱 Ajuste Cambiario',
      'INITIAL_PRICE': '🎯 Precio Inicial',
      'BULK_UPDATE': '📦 Actualización Masiva'
    };
    return types[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPriceChange = (change: number, percent?: number) => {
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'green' : 'red';
    const percentText = percent ? ` (${sign}${percent.toFixed(2)}%)` : '';
    
    return (
      <span style={{ color }}>
        {sign}${change.toFixed(2)}{percentText}
      </span>
    );
  };

  return (
    <div className="price-history">
      <h3>Historial de Precios</h3>
      
      {history.length === 0 && !loading ? (
        <p>No hay cambios de precio registrados para este producto.</p>
      ) : (
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
                    <span className="arrow">→</span>
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

                <div className="additional-info">
                  {transaction.cost_factor && (
                    <span className="cost-factor">
                      Costo: {(transaction.cost_factor * 100).toFixed(1)}%
                    </span>
                  )}
                  {transaction.margin_percent && (
                    <span className="margin">
                      Margen: {transaction.margin_percent.toFixed(1)}%
                    </span>
                  )}
                  <span className="currency">
                    {transaction.currency_id}
                  </span>
                </div>
                
                {transaction.user_name && (
                  <div className="user">
                    <strong>Usuario:</strong> {transaction.user_name}
                  </div>
                )}

                {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                  <details className="metadata">
                    <summary>Información adicional</summary>
                    <pre>{JSON.stringify(transaction.metadata, null, 2)}</pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading} className="load-more-btn">
          {loading ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
};

export default PriceHistory;
```

### Componente React - Validación de Consistencia de Precios

```typescript
import React, { useState } from 'react';

interface PriceConsistencyCheckProps {
  productId?: string;
}

const PriceConsistencyCheck: React.FC<PriceConsistencyCheckProps> = ({ productId }) => {
  const [reports, setReports] = useState<PriceConsistencyReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    inconsistent: number;
    consistency_rate: number;
  } | null>(null);

  const runConsistencyCheck = async () => {
    setLoading(true);
    try {
      const url = productId 
        ? `/price-transactions/validate-consistency?product_id=${productId}`
        : '/price-transactions/validate-consistency';
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      const reportArray = Array.isArray(data.reports) ? data.reports : [data];
      setReports(reportArray);
      
      // Calculate summary
      const inconsistent = reportArray.filter(r => r.consistency_status !== 'CONSISTENT');
      setSummary({
        total: reportArray.length,
        inconsistent: inconsistent.length,
        consistency_rate: ((reportArray.length - inconsistent.length) / reportArray.length) * 100
      });
      
    } catch (error) {
      console.error('Error checking price consistency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'CONSISTENT': '✅',
      'INCONSISTENT': '❌',
      'NO_PRICE_DATA': '⚠️',
      'MISSING_CURRENT_PRICE': '🔍',
      'NO_PRICE_TRANSACTIONS': '📝'
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'CONSISTENT': 'green',
      'INCONSISTENT': 'red',
      'NO_PRICE_DATA': 'orange',
      'MISSING_CURRENT_PRICE': 'orange',
      'NO_PRICE_TRANSACTIONS': 'blue'
    };
    return colors[status] || 'gray';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'CONSISTENT': 'Consistente',
      'INCONSISTENT': 'Inconsistente',
      'NO_PRICE_DATA': 'Sin datos de precio',
      'MISSING_CURRENT_PRICE': 'Precio actual faltante',
      'NO_PRICE_TRANSACTIONS': 'Sin transacciones de precio'
    };
    return labels[status] || status;
  };

  return (
    <div className="price-consistency-check">
      <div className="check-header">
        <h3>Validación de Consistencia de Precios</h3>
        <button onClick={runConsistencyCheck} disabled={loading}>
          {loading ? 'Validando...' : 'Ejecutar Validación'}
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
            <span style={{ color: summary.inconsistent > 0 ? 'red' : 'green' }}>
              {summary.inconsistent}
            </span>
          </div>
          <div className="summary-item">
            <span>Tasa de Consistencia:</span>
            <span style={{ color: summary.consistency_rate === 100 ? 'green' : 'orange' }}>
              {summary.consistency_rate.toFixed(1)}%
            </span>
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
                <span 
                  className="consistency-status"
                  style={{ color: getStatusColor(report.consistency_status) }}
                >
                  {getStatusLabel(report.consistency_status)}
                </span>
              </div>
              
              <div className="report-details">
                <div className="price-comparison">
                  <div>
                    <strong>Precio Actual:</strong> ${report.current_price.toFixed(2)}
                  </div>
                  <div>
                    <strong>Última Transacción:</strong> ${report.last_transaction_price.toFixed(2)}
                  </div>
                  {report.consistency_status === 'INCONSISTENT' && (
                    <div className="difference">
                      <strong>Diferencia:</strong> 
                      <span style={{ color: 'red' }}>
                        ${Math.abs(report.price_difference).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                
                {report.last_transaction_date && (
                  <div className="last-transaction">
                    <strong>Última Transacción:</strong> {' '}
                    {new Date(report.last_transaction_date).toLocaleDateString('es-ES')}
                  </div>
                )}
                
                {report.recommendations.length > 0 && (
                  <div className="recommendations">
                    <strong>Recomendaciones:</strong>
                    <ul>
                      {report.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PriceConsistencyCheck;
```

### Hook Personalizado para Price Transactions

```typescript
import { useState, useCallback } from 'react';

interface UsePriceTransactionsResult {
  registerTransaction: (data: PriceTransactionRequest) => Promise<PriceTransactionResponse>;
  getProductHistory: (productId: string, page?: number, limit?: number) => Promise<any>;
  validateConsistency: (productId?: string) => Promise<PriceConsistencyReport[]>;
  getVarianceReport: (dateFrom?: string, dateTo?: string, transactionType?: string) => Promise<any>;
  getTransactionTypes: () => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const usePriceTransactions = (): UsePriceTransactionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  const registerTransaction = useCallback(async (data: PriceTransactionRequest): Promise<PriceTransactionResponse> => {
    setLoading(true);
    setError(null);
    try {
      const result = await makeRequest('/price-transactions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getProductHistory = useCallback(async (
    productId: string, 
    page = 0, 
    limit = 20
  ) => {
    setLoading(true);
    setError(null);
    try {
      const offset = page * limit;
      const result = await makeRequest(
        `/price-transactions/product/${productId}/history?limit=${limit}&offset=${offset}`
      );
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const validateConsistency = useCallback(async (productId?: string): Promise<PriceConsistencyReport[]> => {
    setLoading(true);
    setError(null);
    try {
      const url = productId 
        ? `/price-transactions/validate-consistency?product_id=${productId}`
        : '/price-transactions/validate-consistency';
      const result = await makeRequest(url);
      return result.reports || [result];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getVarianceReport = useCallback(async (
    dateFrom?: string, 
    dateTo?: string, 
    transactionType?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (transactionType) params.append('transaction_type', transactionType);
      
      const url = `/price-transactions/variance-report?${params.toString()}`;
      const result = await makeRequest(url);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getTransactionTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await makeRequest('/price-transactions/types');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  return {
    registerTransaction,
    getProductHistory,
    validateConsistency,
    getVarianceReport,
    getTransactionTypes,
    loading,
    error,
  };
};
```

### Componente Dashboard de Precios

```typescript
import React, { useState, useEffect } from 'react';
import { usePriceTransactions } from './hooks/usePriceTransactions';
import PriceTransactionForm from './components/PriceTransactionForm';
import PriceHistory from './components/PriceHistory';
import PriceConsistencyCheck from './components/PriceConsistencyCheck';

const PriceManagementDashboard: React.FC = () => {
  const { getVarianceReport, error } = usePriceTransactions();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    recentChanges: 0,
    avgVolatility: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Obtener datos de últimos 30 días
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const varianceReport = await getVarianceReport(startDate, endDate);
      
      setDashboardData({
        totalProducts: varianceReport.total_products,
        recentChanges: varianceReport.reports.filter(r => r.transaction_count > 0).length,
        avgVolatility: varianceReport.summary?.avg_volatility || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleTransactionSuccess = (transaction: PriceTransactionResponse) => {
    console.log('Price transaction registered:', transaction);
    setCurrentPrice(transaction.new_price);
    loadDashboardData(); // Refresh dashboard
  };

  return (
    <div className="price-management-dashboard">
      <h1>Gestión de Precios</h1>
      
      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}
      
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

      <div className="product-selector">
        <label htmlFor="product-select">Seleccionar Producto:</label>
        <select
          id="product-select"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">Seleccionar producto...</option>
          {/* Aquí irían los productos cargados dinámicamente */}
        </select>
      </div>
      
      <div className="management-sections">
        <section className="register-section">
          {selectedProductId && (
            <PriceTransactionForm
              productId={selectedProductId}
              currentPrice={currentPrice}
              onSuccess={handleTransactionSuccess}
            />
          )}
        </section>
        
        <section className="history-section">
          {selectedProductId && (
            <PriceHistory productId={selectedProductId} />
          )}
        </section>
        
        <section className="consistency-section">
          <PriceConsistencyCheck productId={selectedProductId} />
        </section>
      </div>
    </div>
  );
};

export default PriceManagementDashboard;
```

---

## 📝 Notas Adicionales

### Mejores Prácticas

1. **Siempre incluir contexto** en reason y metadata para auditoría
2. **Validar consistencia** regularmente, especialmente después de cambios masivos
3. **Usar tipos específicos** de transacciones para mejor clasificación
4. **Implementar aprobaciones** para cambios significativos de precio
5. **Monitorear volatilidad** para detectar anomalías

### Consideraciones de Rendimiento

- Las consultas de historial soportan paginación para grandes volúmenes
- Los reportes de variación pueden ser costosos para muchos productos
- Considerar cache para tipos de transacciones y datos frecuentes
- Usar índices en fechas y product_id para optimizar consultas

### Seguridad

- Todas las operaciones requieren autenticación JWT
- Validar permisos para cambios de precio según roles de usuario
- Auditar todos los accesos a reportes de precio
- Proteger metadatos sensibles (costos, márgenes)

### Integración con Otros Sistemas

- **Manual Adjustments**: Integración automática mediante función especializada
- **Products.Prices**: Actualización automática del precio actual
- **Stock Transactions**: Sistemas independientes sin interferencias
- **Reporting**: Datos disponibles para análisis de BI

---

**Versión:** 1.0  
**Fecha:** Septiembre 2025  
**Mantenido por:** Equipo de Desarrollo

# 📦 Guía de Integración Frontend - API de Transacciones de Stock v1.0

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
- ✅ **Sistema completo de auditoría** de stock con PostgreSQL
- ✅ **7 tipos de transacciones** (compras, ventas, ajustes, inventarios, etc.)
- ✅ **Validación automática de consistencia** de inventarios
- ✅ **Reportes de discrepancias** con análisis inteligente
- ✅ **Historial completo** de movimientos por producto
- ✅ **Metadatos flexibles** en formato JSON
- ✅ **Integración completa** con sistema de usuarios y productos
- ✅ **API REST robusta** con 8 endpoints especializados

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

El **Sistema de Transacciones de Stock** proporciona un control completo y auditable de todos los movimientos de inventario. Cada transacción queda registrada de manera inmutable con trazabilidad completa.

### Características Principales

- **Auditoría Completa**: Cada movimiento queda registrado permanentemente
- **Validación Automática**: El sistema valida consistencia en tiempo real
- **Tipos Flexibles**: 7 tipos diferentes de transacciones
- **Metadatos Ricos**: Información adicional en formato JSON
- **Reportes Inteligentes**: Análisis automático de discrepancias
- **Integración Total**: Conectado con productos, usuarios y stock

### Flujo Típico de Uso

1. **Registrar Transacciones** → Movimientos de entrada/salida
2. **Consultar Historial** → Ver movimientos por producto
3. **Validar Consistencia** → Verificar integridad del stock
4. **Generar Reportes** → Análisis de discrepancias y tendencias

---

## 📦 API de Transacciones

### 1. Registrar Nueva Transacción

**Endpoint:** `POST /stock-transactions`

**Descripción:** Registra un nuevo movimiento de stock con actualización automática del inventario.

#### Request Body
```typescript
interface StockTransactionRequest {
  product_id: string;           // ID del producto (requerido)
  transaction_type: string;     // Tipo de transacción (requerido)
  quantity_change: number;      // Cambio en cantidad (requerido, != 0)
  unit_price?: number;          // Precio unitario (opcional)
  reference_type?: string;      // Tipo de referencia (opcional)
  reference_id?: string;        // ID de referencia (opcional)
  reason?: string;              // Motivo de la transacción (opcional)
  metadata?: Record<string, any>; // Metadatos adicionales (opcional)
}
```

#### Ejemplo - Registrar Compra
```typescript
const purchaseData = {
  product_id: "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  transaction_type: "PURCHASE",
  quantity_change: 50,
  unit_price: 2.50,
  reference_type: "purchase_order",
  reference_id: "PO-001",
  reason: "Compra semanal de cebollas",
  metadata: {
    supplier: "Verduras S.A.",
    purchase_order: "PO-001",
    quality_grade: "A",
    expiry_date: "2025-12-31"
  }
};

const response = await fetch('/stock-transactions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(purchaseData)
});
```

#### Ejemplo - Registrar Venta
```typescript
const saleData = {
  product_id: "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  transaction_type: "SALE",
  quantity_change: -10,  // Negativo para salida
  unit_price: 3.00,
  reference_type: "sale_order",
  reference_id: "SO-001",
  reason: "Venta al cliente",
  metadata: {
    client: "Restaurante El Buen Sabor",
    sale_order: "SO-001",
    delivery_date: "2025-09-03"
  }
};
```

#### Ejemplo - Ajuste Manual
```typescript
const adjustmentData = {
  product_id: "jHXM6VBrmbd8lL5g90q1XWlnAjf",
  transaction_type: "ADJUSTMENT",
  quantity_change: -2,
  reason: "Productos dañados por mal almacenamiento",
  metadata: {
    adjustment_type: "loss",
    reason_code: "DAMAGED",
    inspector: "Juan Pérez",
    damage_description: "Deterioro por humedad"
  }
};
```

#### Response
```typescript
interface StockTransaction {
  id: number;
  product_id: string;
  transaction_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  unit_price?: number;
  total_value?: number;
  reference_type?: string;
  reference_id?: string;
  user_id: string;
  transaction_date: string;
  reason?: string;
  metadata?: Record<string, any>;
}
```

### 2. Obtener Tipos de Transacciones

**Endpoint:** `GET /stock-transactions/types`

**Descripción:** Obtiene los tipos de transacciones disponibles con sus descripciones.

#### Response
```typescript
{
  "PURCHASE": "Compra",
  "SALE": "Venta",
  "ADJUSTMENT": "Ajuste Manual",
  "INVENTORY": "Inventario Físico",
  "INITIAL": "Stock Inicial",
  "LOSS": "Pérdida",
  "FOUND": "Hallazgo"
}
```

#### Ejemplo de Uso
```typescript
const getTransactionTypes = async () => {
  const response = await fetch('/stock-transactions/types', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const types = await response.json();
  
  // Crear dropdown para el frontend
  const options = Object.entries(types).map(([key, value]) => ({
    value: key,
    label: value
  }));
  
  return options;
};
```

---

## 📊 API de Consultas y Reportes

### 1. Historial de Transacciones por Producto

**Endpoint:** `GET /stock-transactions/product/{product_id}`

**Parámetros:**
- `product_id` (path): ID del producto
- `limit` (query): Límite de resultados (default: 50)
- `offset` (query): Offset para paginación (default: 0)

#### Ejemplo
```typescript
const getProductHistory = async (productId: string, page = 0, limit = 20) => {
  const offset = page * limit;
  const response = await fetch(
    `/stock-transactions/product/${productId}?limit=${limit}&offset=${offset}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return await response.json();
};
```

#### Response
```typescript
interface StockTransactionHistory extends StockTransaction {
  product_name?: string;
  user_name?: string;
}
```

### 2. Validar Consistencia de Stock

**Endpoint:** `GET /stock-transactions/validate-consistency`

**Parámetros:**
- `product_id` (query, opcional): ID del producto específico

#### Ejemplo - Validar Todo el Stock
```typescript
const validateAllStock = async () => {
  const response = await fetch('/stock-transactions/validate-consistency', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const reports = await response.json();
  
  // Filtrar productos con inconsistencias
  const inconsistencies = reports.filter(report => !report.is_consistent);
  
  return {
    total: reports.length,
    inconsistent: inconsistencies.length,
    consistency_rate: ((reports.length - inconsistencies.length) / reports.length) * 100,
    reports: inconsistencies
  };
};
```

#### Ejemplo - Validar Producto Específico
```typescript
const validateProductStock = async (productId: string) => {
  const response = await fetch(
    `/stock-transactions/validate-consistency?product_id=${productId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return await response.json();
};
```

#### Response
```typescript
interface StockConsistencyReport {
  product_id: string;
  product_name: string;
  current_stock: number;
  calculated_stock: number;
  difference: number;
  is_consistent: boolean;
  total_purchases: number;
  total_sales: number;
  total_adjustments: number;
  total_inventories: number;
  recommendation: string;
}
```

### 3. Reporte de Discrepancias de Inventario

**Endpoint:** `GET /stock-transactions/discrepancy-report`

**Parámetros:**
- `date_from` (query, opcional): Fecha inicio (YYYY-MM-DD)
- `date_to` (query, opcional): Fecha fin (YYYY-MM-DD)

#### Ejemplo
```typescript
const getDiscrepancyReport = async (dateFrom?: string, dateTo?: string) => {
  let url = '/stock-transactions/discrepancy-report';
  const params = new URLSearchParams();
  
  if (dateFrom) params.append('date_from', dateFrom);
  if (dateTo) params.append('date_to', dateTo);
  
  if (params.toString()) {
    url += `?${params.toString()}`;
  }
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const reports = await response.json();
  
  return {
    reports,
    summary: {
      total_products: reports.length,
      needs_attention: reports.filter(r => r.needs_attention).length,
      total_variance: reports.reduce((sum, r) => sum + r.total_variance, 0)
    }
  };
};
```

#### Response
```typescript
interface InventoryDiscrepancyReport {
  product_id: string;
  product_name: string;
  category_name: string;
  discrepancies_count: number;
  total_variance: number;
  avg_variance: number;
  max_variance: number;
  last_inventory_date?: string;
  needs_attention: boolean;
}
```

### 4. Resumen de Movimientos

**Endpoint:** `GET /stock-transactions/movement-summary`

**Parámetros:**
- `start_date` (query, requerido): Fecha inicio (YYYY-MM-DD)
- `end_date` (query, requerido): Fecha fin (YYYY-MM-DD)
- `product_id` (query, opcional): ID del producto específico

#### Ejemplo
```typescript
const getMovementSummary = async (startDate: string, endDate: string, productId?: string) => {
  let url = `/stock-transactions/movement-summary?start_date=${startDate}&end_date=${endDate}`;
  
  if (productId) {
    url += `&product_id=${productId}`;
  }
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};

// Ejemplo para últimos 30 días
const getLast30DaysSummary = async () => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0];
  
  return await getMovementSummary(startDate, endDate);
};
```

#### Response
```typescript
interface StockMovementSummary {
  period: string;
  product_id: string;
  product_name: string;
  initial_stock: number;
  final_stock: number;
  total_purchases: number;
  total_sales: number;
  total_adjustments: number;
  total_inventories: number;
  net_change: number;
  transaction_count: number;
}
```

### 5. Transacciones por Rango de Fechas

**Endpoint:** `GET /stock-transactions/by-date`

**Parámetros:**
- `start_date` (query, requerido): Fecha inicio (YYYY-MM-DD)
- `end_date` (query, requerido): Fecha fin (YYYY-MM-DD)
- `transaction_type` (query, opcional): Filtrar por tipo
- `limit` (query, opcional): Límite de resultados (default: 100)
- `offset` (query, opcional): Offset para paginación (default: 0)

#### Ejemplo
```typescript
const getTransactionsByDate = async (
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
  
  const response = await fetch(`/stock-transactions/by-date?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
};
```

### 6. Obtener Transacción por ID

**Endpoint:** `GET /stock-transactions/{id}`

#### Ejemplo
```typescript
const getTransactionById = async (transactionId: number) => {
  const response = await fetch(`/stock-transactions/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Transacción no encontrada');
    }
    throw new Error('Error al obtener transacción');
  }
  
  return await response.json();
};
```

---

## 🏷️ Tipos de Transacciones

### 1. PURCHASE - Compras
**Descripción:** Registro de compras de mercancía  
**Quantity Change:** Positivo (+)  
**Campos Recomendados:**
- `unit_price`: Precio de compra
- `reference_type`: "purchase_order"
- `reference_id`: Número de orden de compra
- `metadata`: Supplier, quality_grade, expiry_date

### 2. SALE - Ventas
**Descripción:** Registro de ventas de productos  
**Quantity Change:** Negativo (-)  
**Campos Recomendados:**
- `unit_price`: Precio de venta
- `reference_type`: "sale_order"
- `reference_id`: Número de orden de venta
- `metadata`: client, delivery_date, payment_method

### 3. ADJUSTMENT - Ajustes Manuales
**Descripción:** Correcciones manuales de inventario  
**Quantity Change:** Positivo o Negativo  
**Campos Recomendados:**
- `reference_type`: "manual_adjustment"
- `reason`: Motivo detallado del ajuste
- `metadata`: adjustment_type, reason_code, inspector

### 4. INVENTORY - Inventario Físico
**Descripción:** Ajustes basados en conteos físicos  
**Quantity Change:** Diferencia encontrada  
**Campos Recomendados:**
- `reference_type`: "inventory_check"
- `reason`: Resultado del inventario
- `metadata`: physical_count, system_count, counter

### 5. INITIAL - Stock Inicial
**Descripción:** Registro de stock inicial del sistema  
**Quantity Change:** Positivo (+)  
**Campos Recomendados:**
- `reference_type`: "initial_stock"
- `metadata`: import_date, source_system

### 6. LOSS - Pérdidas
**Descripción:** Pérdidas de producto por diversos motivos  
**Quantity Change:** Negativo (-)  
**Campos Recomendados:**
- `reference_type`: "loss_report"
- `reason`: Causa de la pérdida
- `metadata`: loss_type, responsible_party

### 7. FOUND - Hallazgos
**Descripción:** Productos encontrados no registrados  
**Quantity Change:** Positivo (+)  
**Campos Recomendados:**
- `reference_type`: "found_items"
- `reason`: Circunstancias del hallazgo
- `metadata`: found_location, finder

---

## ✅ Validaciones y Consistencia

### Validaciones Automáticas

1. **Producto Existente**: Verifica que el product_id exista
2. **Usuario Autenticado**: Valida que el usuario tenga permisos
3. **Tipo Válido**: Confirma que transaction_type sea válido
4. **Cantidad No Cero**: quantity_change debe ser diferente de 0
5. **Stock Suficiente**: Para salidas, verifica stock disponible

### Recomendaciones de Consistencia

```typescript
const interpretConsistencyReport = (report: StockConsistencyReport) => {
  if (report.is_consistent) {
    return {
      status: 'success',
      message: 'Stock consistente',
      action: 'none'
    };
  }
  
  if (report.difference > 0) {
    return {
      status: 'warning',
      message: `Stock actual mayor en ${report.difference} unidades`,
      action: 'Revisar transacciones faltantes o registrar ajuste'
    };
  } else {
    return {
      status: 'error',
      message: `Stock actual menor en ${Math.abs(report.difference)} unidades`,
      action: 'Revisar transacciones erróneas o registrar inventario'
    };
  }
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
  "error": "quantity_change no puede ser cero",
  "code": "INVALID_QUANTITY"
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
  "error": "Transacción no encontrada",
  "code": "TRANSACTION_NOT_FOUND"
}
```

### Errores de Negocio (422)
```typescript
{
  "error": "Stock insuficiente para la venta",
  "code": "INSUFFICIENT_STOCK"
}

{
  "error": "No se puede eliminar stock inicial",
  "code": "CANNOT_REMOVE_INITIAL_STOCK"
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

### Componente React - Registro de Transacciones

```typescript
import React, { useState, useEffect } from 'react';

interface TransactionFormProps {
  productId: string;
  onSuccess?: (transaction: StockTransaction) => void;
}

const StockTransactionForm: React.FC<TransactionFormProps> = ({ 
  productId, 
  onSuccess 
}) => {
  const [transactionTypes, setTransactionTypes] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    transaction_type: '',
    quantity_change: 0,
    unit_price: '',
    reason: '',
    reference_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar tipos de transacciones al montar
  useEffect(() => {
    const loadTransactionTypes = async () => {
      try {
        const response = await fetch('/stock-transactions/types', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const types = await response.json();
        setTransactionTypes(types);
      } catch (err) {
        console.error('Error loading transaction types:', err);
      }
    };

    loadTransactionTypes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const requestData = {
        product_id: productId,
        transaction_type: formData.transaction_type,
        quantity_change: Number(formData.quantity_change),
        unit_price: formData.unit_price ? Number(formData.unit_price) : undefined,
        reason: formData.reason || undefined,
        reference_id: formData.reference_id || undefined,
        metadata: {
          form_submission: true,
          timestamp: new Date().toISOString()
        }
      };

      const response = await fetch('/stock-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar transacción');
      }

      const transaction = await response.json();
      
      // Reset form
      setFormData({
        transaction_type: '',
        quantity_change: 0,
        unit_price: '',
        reason: '',
        reference_id: ''
      });

      onSuccess?.(transaction);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stock-transaction-form">
      <h3>Registrar Transacción de Stock</h3>
      
      {error && (
        <div className="error-message">
          {error}
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
        <label htmlFor="quantity_change">
          Cambio en Cantidad:
          <small>(Positivo para entrada, negativo para salida)</small>
        </label>
        <input
          type="number"
          id="quantity_change"
          value={formData.quantity_change}
          onChange={(e) => setFormData({ ...formData, quantity_change: Number(e.target.value) })}
          step="0.01"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="unit_price">Precio Unitario (opcional):</label>
        <input
          type="number"
          id="unit_price"
          value={formData.unit_price}
          onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
          step="0.01"
          min="0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="reason">Motivo:</label>
        <textarea
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor="reference_id">ID de Referencia (opcional):</label>
        <input
          type="text"
          id="reference_id"
          value={formData.reference_id}
          onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
          placeholder="PO-001, SO-001, ADJ-001, etc."
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Registrando...' : 'Registrar Transacción'}
      </button>
    </form>
  );
};

export default StockTransactionForm;
```

### Componente React - Historial de Transacciones

```typescript
import React, { useState, useEffect } from 'react';

interface TransactionHistoryProps {
  productId: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ productId }) => {
  const [transactions, setTransactions] = useState<StockTransactionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 20;

  const loadTransactions = async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      const offset = pageNum * limit;
      const response = await fetch(
        `/stock-transactions/product/${productId}?limit=${limit}&offset=${offset}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      const data = await response.json();
      
      if (append) {
        setTransactions(prev => [...prev, ...data]);
      } else {
        setTransactions(data);
      }
      
      setHasMore(data.length === limit);
      setPage(pageNum);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [productId]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadTransactions(page + 1, true);
    }
  };

  const formatTransactionType = (type: string) => {
    const types = {
      'PURCHASE': '📦 Compra',
      'SALE': '💰 Venta',
      'ADJUSTMENT': '🔧 Ajuste',
      'INVENTORY': '📊 Inventario',
      'INITIAL': '🎯 Inicial',
      'LOSS': '❌ Pérdida',
      'FOUND': '✅ Hallazgo'
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

  return (
    <div className="transaction-history">
      <h3>Historial de Transacciones</h3>
      
      {transactions.length === 0 && !loading ? (
        <p>No hay transacciones registradas para este producto.</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-header">
                <span className="transaction-type">
                  {formatTransactionType(transaction.transaction_type)}
                </span>
                <span className="transaction-date">
                  {formatDate(transaction.transaction_date)}
                </span>
              </div>
              
              <div className="transaction-details">
                <div className="quantity-info">
                  <span className={`quantity-change ${transaction.quantity_change > 0 ? 'positive' : 'negative'}`}>
                    {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                  </span>
                  <span className="stock-levels">
                    {transaction.quantity_before} → {transaction.quantity_after}
                  </span>
                </div>
                
                {transaction.unit_price && (
                  <div className="price-info">
                    <span>Precio: ${transaction.unit_price}</span>
                    {transaction.total_value && (
                      <span>Total: ${transaction.total_value}</span>
                    )}
                  </div>
                )}
                
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
      )}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading} className="load-more-btn">
          {loading ? 'Cargando...' : 'Cargar más'}
        </button>
      )}
    </div>
  );
};

export default TransactionHistory;
```

### Componente React - Validación de Consistencia

```typescript
import React, { useState } from 'react';

interface ConsistencyCheckProps {
  productId?: string;
}

const StockConsistencyCheck: React.FC<ConsistencyCheckProps> = ({ productId }) => {
  const [reports, setReports] = useState<StockConsistencyReport[]>([]);
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
        ? `/stock-transactions/validate-consistency?product_id=${productId}`
        : '/stock-transactions/validate-consistency';
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      setReports(Array.isArray(data) ? data : [data]);
      
      // Calculate summary
      const inconsistent = data.filter((r: StockConsistencyReport) => !r.is_consistent);
      setSummary({
        total: data.length,
        inconsistent: inconsistent.length,
        consistency_rate: ((data.length - inconsistent.length) / data.length) * 100
      });
      
    } catch (error) {
      console.error('Error checking consistency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (isConsistent: boolean) => {
    return isConsistent ? '✅' : '❌';
  };

  const getStatusColor = (isConsistent: boolean) => {
    return isConsistent ? 'green' : 'red';
  };

  return (
    <div className="consistency-check">
      <div className="check-header">
        <h3>Validación de Consistencia de Stock</h3>
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
                  {getStatusIcon(report.is_consistent)}
                </span>
                <span className="product-name">{report.product_name}</span>
                <span 
                  className="consistency-status"
                  style={{ color: getStatusColor(report.is_consistent) }}
                >
                  {report.is_consistent ? 'Consistente' : 'Inconsistente'}
                </span>
              </div>
              
              <div className="report-details">
                <div className="stock-comparison">
                  <div>
                    <strong>Stock Actual:</strong> {report.current_stock}
                  </div>
                  <div>
                    <strong>Stock Calculado:</strong> {report.calculated_stock}
                  </div>
                  {!report.is_consistent && (
                    <div className="difference">
                      <strong>Diferencia:</strong> 
                      <span style={{ color: 'red' }}>
                        {report.difference > 0 ? '+' : ''}{report.difference}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="transaction-summary">
                  <div>Compras: {report.total_purchases}</div>
                  <div>Ventas: {report.total_sales}</div>
                  <div>Ajustes: {report.total_adjustments}</div>
                  <div>Inventarios: {report.total_inventories}</div>
                </div>
                
                {!report.is_consistent && (
                  <div className="recommendation">
                    <strong>Recomendación:</strong> {report.recommendation}
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

export default StockConsistencyCheck;
```

### Hook Personalizado para Stock Transactions

```typescript
import { useState, useCallback } from 'react';

interface UseStockTransactionsResult {
  registerTransaction: (data: StockTransactionRequest) => Promise<StockTransaction>;
  getProductHistory: (productId: string, page?: number, limit?: number) => Promise<StockTransactionHistory[]>;
  validateConsistency: (productId?: string) => Promise<StockConsistencyReport[]>;
  getMovementSummary: (startDate: string, endDate: string, productId?: string) => Promise<StockMovementSummary[]>;
  loading: boolean;
  error: string | null;
}

export const useStockTransactions = (): UseStockTransactionsResult => {
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

  const registerTransaction = useCallback(async (data: StockTransactionRequest): Promise<StockTransaction> => {
    setLoading(true);
    setError(null);
    try {
      const result = await makeRequest('/stock-transactions', {
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
  ): Promise<StockTransactionHistory[]> => {
    setLoading(true);
    setError(null);
    try {
      const offset = page * limit;
      const result = await makeRequest(
        `/stock-transactions/product/${productId}?limit=${limit}&offset=${offset}`
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

  const validateConsistency = useCallback(async (productId?: string): Promise<StockConsistencyReport[]> => {
    setLoading(true);
    setError(null);
    try {
      const url = productId 
        ? `/stock-transactions/validate-consistency?product_id=${productId}`
        : '/stock-transactions/validate-consistency';
      const result = await makeRequest(url);
      return Array.isArray(result) ? result : [result];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getMovementSummary = useCallback(async (
    startDate: string, 
    endDate: string, 
    productId?: string
  ): Promise<StockMovementSummary[]> => {
    setLoading(true);
    setError(null);
    try {
      let url = `/stock-transactions/movement-summary?start_date=${startDate}&end_date=${endDate}`;
      if (productId) {
        url += `&product_id=${productId}`;
      }
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

  return {
    registerTransaction,
    getProductHistory,
    validateConsistency,
    getMovementSummary,
    loading,
    error,
  };
};
```

### Ejemplo de Uso Completo

```typescript
import React from 'react';
import { useStockTransactions } from './hooks/useStockTransactions';
import StockTransactionForm from './components/StockTransactionForm';
import TransactionHistory from './components/TransactionHistory';
import StockConsistencyCheck from './components/StockConsistencyCheck';

const StockManagementPage: React.FC = () => {
  const { registerTransaction, error } = useStockTransactions();
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const handleTransactionSuccess = (transaction: StockTransaction) => {
    console.log('Transaction registered successfully:', transaction);
    // Refresh other components or show success message
  };

  return (
    <div className="stock-management-page">
      <h1>Gestión de Stock</h1>
      
      {error && (
        <div className="error-banner">
          Error: {error}
        </div>
      )}
      
      <div className="management-sections">
        <section className="register-section">
          <StockTransactionForm
            productId={selectedProductId}
            onSuccess={handleTransactionSuccess}
          />
        </section>
        
        <section className="history-section">
          {selectedProductId && (
            <TransactionHistory productId={selectedProductId} />
          )}
        </section>
        
        <section className="consistency-section">
          <StockConsistencyCheck productId={selectedProductId} />
        </section>
      </div>
    </div>
  );
};

export default StockManagementPage;
```

---

## 📝 Notas Adicionales

### Mejores Prácticas

1. **Siempre validar consistencia** después de operaciones masivas
2. **Usar metadatos** para información contextual rica
3. **Implementar retry logic** para operaciones críticas
4. **Cachear tipos de transacciones** para mejor performance
5. **Mostrar confirmaciones** antes de transacciones grandes

### Consideraciones de Rendimiento

- Las consultas de historial soportan paginación
- Los reportes pueden ser costosos para grandes volúmenes
- Considerar implementar cache para validaciones frecuentes
- Usar indices en fechas para consultas por rango

### Seguridad

- Todas las operaciones requieren autenticación
- Los tokens JWT deben renovarse regularmente
- Validar permisos antes de mostrar funcionalidades
- Auditar accesos a reportes sensibles

---

**Versión:** 1.0  
**Fecha:** Septiembre 2025  
**Mantenido por:** Equipo de Desarrollo

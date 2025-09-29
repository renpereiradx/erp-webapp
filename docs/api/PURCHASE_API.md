# 📦 Guía de Integración API - Sistema de Compras Mejorado

## 🎯 Descripción General

Esta guía cubre la implementación del **sistema de compras mejorado** que integra la nueva arquitectura de costos y precios separados. El sistema permite crear órdenes de compra con auto-actualización inteligente de precios, trazabilidad completa y análisis detallado de impacto financiero.

### 🚀 Nuevas Funcionalidades

- ✅ **Separación de costos y precios**: `unit_costs` vs `unit_prices`
- ✅ **Auto-pricing inteligente**: Cálculo automático con protección de precios
- ✅ **Múltiples unidades**: Soporte para diferentes unidades del mismo producto
- ✅ **Trazabilidad completa**: Metadatos enriquecidos y auditoría
- ✅ **Análisis detallado**: Impacto en costos, precios y márgenes
- ✅ **Validación de integridad**: Verificación automática de consistencia
- 🔄 **FUNCIÓN ORIGINAL RESTAURADA**: Comportamiento correcto confirmado

---

## ✅ **ACLARACIÓN: Sistema Original Era CORRECTO**

### 📋 Análisis Confirmado

**Conclusión después del análisis**: La función `transactions.process_complete_purchase_order` original estaba **funcionando correctamente**. El IVA en el sistema es informativo y los precios de proveedores ya incluyen IVA.

### 🇵🇾 Contexto Paraguay - Precios con IVA Incluido

En Paraguay, cuando un proveedor vende productos a un negocio:
- **El precio cotizado YA incluye IVA** (10% en la mayoría de casos)
- El comprador paga ese precio total
- El IVA se registra solo para efectos fiscales y contables
- **NO se debe aplicar IVA adicional** en el precio de venta

### 🔧 Comportamiento Correcto Confirmado

#### **Fórmula CORRECTA (Original)**
```sql
-- CORRECTO - Solo aplica margen sobre precio que ya incluye IVA
v_calculated_selling_price := v_unit_price * (1 + v_profit_pct / 100.0);
```

#### **¿Por qué es correcto?**
```
Ejemplo Real:
- Proveedor cotiza: ₲7,000 (precio final con IVA incluido)
- Aplicamos margen 30%: ₲7,000 × 1.30 = ₲9,100 ✅
- Resultado: Precio justo sin doble imposición
```

### 💰 Evidencia de Datos Reales

| Producto | Precio Compra | Precio Venta | Cálculo | Interpretación |
|----------|---------------|--------------|---------|----------------|
| **UPgW9Pyzg7F6MPqr14s2jvr1IY5** | ₲7,000 | ₲9,100 | ₲7,000 × 1.30 | ✅ **CORRECTO** |
| **Análisis** | Ya incluye IVA | Solo margen aplicado | Sin doble IVA | Funcionamiento ideal |

### 🚫 Por Qué la "Corrección" era Incorrecta

Si hubiéramos aplicado la "corrección":
```sql
-- INCORRECTO - Habría causado doble aplicación de IVA
v_calculated_selling_price := v_unit_price * (1 + v_profit_pct / 100.0) * (1 + v_tax_rate / 100.0);

-- Resultado erróneo:
-- ₲7,000 × 1.30 × 1.10 = ₲10,010 ❌
-- Esto sería cobrar IVA sobre IVA = sobreprécio del 10%
```

### 🎯 Función del IVA en el Sistema

El `tax_rate_id` y `tax_rate` en el sistema sirven para:
- ✅ **Registro fiscal**: Documentar qué tasa de IVA aplicó el proveedor
- ✅ **Trazabilidad**: Auditoría y reportes contables
- ✅ **Cumplimiento**: Información para declaraciones de impuestos
- ❌ **NO para cálculo**: El precio ya está completo

### 🔍 Verificación en Metadatos

Las nuevas órdenes incluyen documentación clara:

```json
{
  "system_version": "complete_v1.2_original_restored",
  "pricing_policy": "supplier_prices_include_iva",
  "price_includes_iva": true,
  "base_cost_includes_iva": true,
  "no_additional_iva_applied": true,
  "price_formula": "7000.00 * (1 + 30.00/100) = 9100.00"
}
```

### 🏆 Conclusión Final

- ✅ **Sistema original**: Funcionamiento correcto confirmado
- ✅ **Precios justos**: Sin doble imposición de IVA
- ✅ **Conformidad fiscal**: IVA registrado correctamente para reportes
- ✅ **Competitividad**: Precios finales apropiados para el mercado paraguayo

**La función original no tenía ningún bug - estaba implementada correctamente según las prácticas comerciales paraguayas.**

---

## � **ENDPOINTS RECOMENDADOS PARA USO EN PRODUCCIÓN**

### ✅ **Endpoints Mejorados con Parsing Completo de Metadata**

Después de las mejoras implementadas, se recomienda utilizar los siguientes endpoints que incluyen **parsing completo del campo `metadata`** de los detalles de compra:

#### 1. **Consultar Compras por ID de Proveedor (MEJORADO)**

```http
GET /purchase/supplier_id/{supplier_id}
Authorization: Bearer {token}
```

**🎯 Información Adicional Proporcionada:**

- ✅ **Unit**: Unidad del producto (`"kg"`, `"unit"`, `"box"`, etc.)
- ✅ **Tax Rate**: Tasa de impuesto aplicada
- ✅ **Profit Pct**: Porcentaje de ganancia del producto
- ✅ **Line Total**: Total calculado por línea
- ✅ **Sale Price**: Precio de venta calculado dinámicamente
- ✅ **Metadata Completo**: JSON completo para análisis adicional

**📊 Ejemplo de Respuesta Mejorada:**

```json
{
  "purchase": {
    "id": 123,
    "supplier_id": 10,
    "supplier_name": "Proveedor ABC",
    "supplier_status": true, // <--- NUEVO
    "total_amount": 10000.00,
    "status": "COMPLETED"
  },
  "details": [
    {
      "id": 456,
      "product_name": "Banana Premium",
      "quantity": 50.0,
      "unit_price": 7000.00,
      "unit": "kg",
      "tax_rate": 10.0,
      "profit_pct": 30.0,
      "line_total": 350000.00,
      "sale_price": 9100.00,
      "metadata": {
        "unit": "kg",
        "tax_rate": 10,
        "line_total": 350000,
        "profit_pct": 30
      }
    }
  ]
}
```

#### 2. **Consultar Compras por Nombre de Proveedor (MEJORADO)**

```http
GET /purchase/supplier_name/{supplier_name}
Authorization: Bearer {token}
```

**🎯 Información Adicional Proporcionada:**

- ✅ **Unit**: Unidad del producto
- ✅ **Tax Rate**: Tasa de impuesto aplicada
- ✅ **Profit Pct**: Porcentaje de ganancia del producto
- ✅ **Line Total**: Total calculado por línea
- ✅ **Sale Price**: Precio de venta calculado dinámicamente
- ✅ **Metadata Completo**: JSON completo para análisis adicional

#### 3. **Consultar Compras por Rango de Fechas (MEJORADO)**

```http
GET /purchase/date_range/?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&page={1}&page_size={50}
Authorization: Bearer {token}
```

**🎯 Información Adicional Proporcionada:**

- ✅ **Unit**: Unidad del producto
- ✅ **Tax Rate**: Tasa de impuesto aplicada
- ✅ **Profit Pct**: Porcentaje de ganancia del producto
- ✅ **Line Total**: Total calculado por línea
- ✅ **Sale Price**: Precio de venta calculado dinámicamente
- ✅ **Metadata Completo**: JSON completo para análisis adicional

### 🔧 **Cálculo Mejorado de Precios de Venta**

Los endpoints mejorados ahora calculan el precio de venta de manera inteligente:

```typescript
// Cálculo dinámico basado en metadata
if (item.ProfitPct > 0) {
  item.SalePrice = item.UnitPrice * (1 + item.ProfitPct/100);
} else {
  item.SalePrice = item.UnitPrice * 1.3; // valor por defecto 30%
}
```

**Ejemplo Real:**

- **Precio de Compra**: ₲7,000 (ya incluye IVA)
- **Profit Pct del Metadata**: 30%
- **Precio de Venta Calculado**: ₲7,000 × (1 + 30/100) = ₲9,100 ✅

### 📋 **Campos Nuevos Disponibles**

| Campo            | Tipo      | Descripción                       | Origen         |
|------------------|-----------|-----------------------------------|----------------|
| `unit`           | `string`  | Unidad del producto               | Metadata JSON  |
| `tax_rate`       | `float64` | Tasa de impuesto                  | Metadata JSON  |
| `profit_pct`     | `float64` | % de ganancia                     | Metadata JSON  |
| `line_total`     | `float64` | Total por línea                   | Metadata JSON  |
| `sale_price`     | `float64` | Precio venta calculado            | Cálculo dinámico |
| `metadata`       | `json.RawMessage` | JSON completo               | Base de datos  |
| `supplier_status`| `boolean` | Estado del proveedor (activo/inactivo) | DB (suppliers) |

### ⚠️ **Importante: Usar Endpoints Mejorados**

**ANTES (Sin metadata parsing):**

```json
{
  "details": [
    {
      "product_name": "Banana Premium",
      "quantity": 50.0,
      "unit_price": 7000.00,
      "sale_price": 9100.00  // hardcoded 30%
    }
  ]
}
```

**AHORA (Con metadata parsing completo):**

```json
{
  "details": [
    {
      "product_name": "Banana Premium",
      "quantity": 50.0,
      "unit_price": 7000.00,
      "unit": "kg",
      "tax_rate": 10.0,
      "profit_pct": 30.0,
      "line_total": 350000.00,
      "sale_price": 9100.00,  // calculado dinámicamente
      "metadata": {
        "unit": "kg",
        "tax_rate": 10,
        "line_total": 350000,
        "profit_pct": 30
      }
    }
  ]
}
```

### 🎯 **Recomendaciones de Implementación**

1. **Migrar a Endpoints Mejorados**: Reemplazar llamadas a endpoints antiguos
2. **Utilizar Campos Nuevos**: Aprovechar `unit`, `tax_rate`, `profit_pct` para cálculos
3. **Validar Metadata**: Verificar que el campo `metadata` contenga información válida
4. **Manejar Valores por Defecto**: Implementar lógica para casos donde metadata esté vacío

### 🔄 **Compatibilidad con Versiones Anteriores**

Los endpoints mejorados mantienen compatibilidad con versiones anteriores:

- ✅ Campos existentes siguen disponibles
- ✅ Estructura de respuesta similar
- ✅ Solo se agregan campos nuevos opcionales
- ✅ No breaking changes en la API

---

## �📊 Modelos de Datos TypeScript

### 🛒 Orden de Compra Mejorada

```typescript
interface PurchaseOrderRequest {
  supplier_id: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  order_details: PurchaseOrderDetail[];
  payment_method_id?: number;    // Opcional: ID del método de pago
  currency_id?: number;          // Opcional: ID de la moneda
  auto_update_prices?: boolean;  // Default: true
  default_profit_margin?: number; // Default: 30.0
  metadata?: Record<string, any>; // Opcional: datos adicionales
}

interface PurchaseOrderDetail {
  product_id: string;
  quantity: number;
  unit_price: number;
  unit?: string;          // Default: 'unit'
  profit_pct?: number;    // Para cálculo de precio sugerido
  tax_rate_id?: number;   // Opcional
}

interface PurchaseOrderResponse {
  success: boolean;
  purchase_order_id?: number;
  total_amount?: number;
  items_processed?: number;
  cost_entries_created?: number;
  prices_updated?: number;
  validation_issues?: ValidationIssue[];
  message?: string;
}
```

### 🔧 Campos Opcionales Disponibles

#### **En `PurchaseOrderRequest`:**

| Campo | Tipo | Descripción | Valor por Defecto |
|-------|------|-------------|-------------------|
| `payment_method_id` | `number` | ID del método de pago preferido | `null` |
| `currency_id` | `number` | ID de la moneda para la orden | `null` |
| `auto_update_prices` | `boolean` | Si actualizar precios automáticamente | `true` |
| `default_profit_margin` | `number` | Margen de ganancia por defecto (%) | `30.0` |
| `metadata` | `object` | Datos adicionales personalizados | `{}` |

#### **En `PurchaseOrderDetail`:**

| Campo | Tipo | Descripción | Valor por Defecto |
|-------|------|-------------|-------------------|
| `unit` | `string` | Unidad de medida del producto | `"unit"` |
| `profit_pct` | `number` | Porcentaje de ganancia específico | Sistema calcula |
| `tax_rate_id` | `number` | ID de la tasa de impuesto | `null` |

**💡 Ejemplo con todos los campos opcionales:**

```json
{
  "supplier_id": 13,
  "status": "PENDING",
  "payment_method_id": 1,
  "currency_id": 2,
  "auto_update_prices": false,
  "default_profit_margin": 25.0,
  "metadata": {
    "purchase_notes": "Pedido urgente",
    "delivery_date": "2025-09-25",
    "contact_person": "María González"
  },
  "order_details": [
    {
      "product_id": "PROD_001",
      "quantity": 10.0,
      "unit_price": 1500.0,
      "unit": "kg",
      "profit_pct": 30.0,
      "tax_rate_id": 1
    }
  ]
}
```

### 📊 Análisis Detallado

```typescript
interface PurchaseOrderAnalysis {
  order_info: {
    po_id: number;
    supplier_id: number;
    status: string;
    total_amount: number;
    order_date: string;
    created_by: string;
    metadata: {
      auto_update_prices: boolean;
      default_profit_margin: number;
      system_version: string;
      total_items: number;
    };
  };
  
  order_items: PurchaseOrderItem[];
  
  cost_analysis: {
    total_cost_entries: number;
    avg_cost_per_unit: number;
    total_quantity_purchased: number;
    cost_variance: number;
  };
  
  pricing_impact: {
    prices_updated: number;
    avg_selling_price: number;
    avg_margin_percent: number;
  };
}

interface PurchaseOrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  unit: string;
  line_total: number;
  tax_rate: number;
  profit_pct: number;
}
```

### 🔍 Validación de Integridad

```typescript
interface IntegrityValidation {
  validation_passed: boolean;
  issues_found: ValidationIssue[];
  recommendations: Recommendation[];
}

interface ValidationIssue {
  type: 'MISSING_ORDER' | 'MISSING_COST_ENTRIES' | 'MISSING_PRICE_UPDATES';
  severity: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  count?: number;
}

interface Recommendation {
  action: string;
  description: string;
}
```

### 💰 Costos y Precios

```typescript
interface UnitCost {
  id: number;
  product_id: string;
  unit: string;
  cost_per_unit: number;
  supplier_id: number;
  purchase_order_id: number;
  purchase_date: string;
  quantity_purchased: number;
  created_by: string;
  metadata: {
    source: string;
    tax_rate?: number;
    tax_rate_id?: number;
    suggested_profit_pct: number;
    total_cost_with_tax: number;
  };
}

interface UnitPrice {
  id: number;
  id_product: string;
  unit: string;
  price_per_unit: number;
  effective_date: string;
  metadata?: {
    source?: string;
    po_id?: number;
    cost_entry_id?: number;
    base_cost?: number;
    applied_margin_pct?: number;
    auto_generated?: boolean;
    price_protected?: boolean;
  };
}
```

---

## 🔗 Endpoints de la API

### 1. 🛒 **Crear Orden de Compra Mejorada**

```http
POST /purchase/complete
Content-Type: application/json
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "supplier_id": 13,
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PROD_BANANA_001",
      "quantity": 50.0,
      "unit_price": 2500.00,
      "unit": "kg",
      "profit_pct": 35.0,
      "tax_rate_id": null
    },
    {
      "product_id": "FL8K0xxRzjX0VAND78u842kzKcM",
      "quantity": 20.0,
      "unit_price": 5000.00,
      "unit": "unit",
      "profit_pct": 40.0
    }
  ],
  "payment_method_id": 1,
  "currency_id": 2,
  "auto_update_prices": true,
  "default_profit_margin": 30.0,
  "metadata": {
    "purchase_notes": "Compra urgente",
    "supplier_contact": "juan@proveedor.com",
    "delivery_instructions": "Entregar en almacén principal"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "purchase_order_id": 12,
  "total_amount": 225000.00,
  "items_processed": 2,
  "cost_entries_created": 2,
  "prices_updated": 1,
  "message": "Purchase order created successfully"
}
```

---

## 📋 Códigos de Respuesta

### ✅ Éxito
- **200 OK** - Operación exitosa
- **201 Created** - Orden de compra creada

### ⚠️ Errores del Cliente
- **400 Bad Request** - Datos inválidos en la orden
- **401 Unauthorized** - Token inválido o faltante
- **403 Forbidden** - Sin permisos para crear órdenes
- **404 Not Found** - Orden de compra no encontrada
- **409 Conflict** - Conflicto en los datos (ej: producto inexistente)

### 🚨 Errores del Servidor
- **500 Internal Server Error** - Error en el procedimiento de base de datos
- **503 Service Unavailable** - Base de datos no disponible

### 🔍 Errores Específicos

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PRODUCT_ID",
    "message": "Product PROD_INVALID_001 does not exist",
    "details": {
      "invalid_products": ["PROD_INVALID_001"],
      "field": "order_details[0].product_id"
    }
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "SUPPLIER_INACTIVE",
    "message": "Proveedor \"Proveedor XYZ\" (ID: 15) está inactivo. Active el proveedor antes de crear órdenes de compra.",
    "details": {
      "supplier_id": 15,
      "supplier_name": "Proveedor XYZ",
      "supplier_active": false,
      "error_code": "SUPPLIER_INACTIVE"
    }
  }
}
```

```json
{
  "success": false,
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "Quantity must be greater than 0 for product PROD_BANANA_001",
    "details": {
      "field": "order_details[0].quantity",
      "value": -5.0,
      "constraint": "quantity > 0"
    }
  }
}
```

---

## 🚨 Solución de Problemas Comunes

### ⚠️ Error 401/400 - Proveedor Inactivo

**Síntoma:**
```javascript
XHRPOST http://localhost:5050/purchase/complete
[HTTP/1.1 401 Unauthorized 0ms]

⚠️ 401 Unauthorized - Intentando auto-login...
✓ Auto-login exitoso, reintentando request...

XHRPOST http://localhost:5050/purchase/complete
[HTTP/1.1 400 Bad Request 0ms]

Error: ApiError: Error de autenticación. El sistema no pudo autenticarse automáticamente.
```

**Causa Principal:**
El proveedor especificado en `supplier_id` está **inactivo** en la base de datos.

**Verificación:**
```sql
SELECT id, name, state FROM clients.suppliers WHERE id = {supplier_id};
```

**Solución 1: Activar el proveedor**
```sql
UPDATE clients.suppliers 
SET state = true 
WHERE id = {supplier_id};
```

**Solución 2: Usar un proveedor activo**
```sql
-- Buscar proveedores activos disponibles
SELECT id, name, state 
FROM clients.suppliers 
WHERE state = true 
ORDER BY name;
```

**Respuesta de Error Mejorada:**
```json
{
  "success": false,
  "message": "Proveedor \"Proveedor XYZ\" (ID: 15) está inactivo. Active el proveedor antes de crear órdenes de compra.",
  "details": {
    "supplier_id": 15,
    "supplier_name": "Proveedor XYZ",
    "supplier_active": false,
    "error_code": "SUPPLIER_INACTIVE"
  }
}
```

### 🔧 Validaciones Implementadas

La función `transactions.process_complete_purchase_order` ahora incluye:

1. **Validación de proveedor activo** ✅
2. **Validación de productos activos** ✅  
3. **Validación de cantidades positivas** ✅
4. **Validación de precios positivos** ✅
5. **Transacciones atómicas con rollback automático** ✅

### ✅ Verificación de la Solución

**Paso 1: Verificar que el proveedor esté activo**
```sql
SELECT id, name, state FROM clients.suppliers WHERE id = 10;
-- Resultado esperado: state = true
```

**Paso 2: Probar la creación de orden con proveedor activo**
```json
{
  "supplier_id": 10,
  "status": "PENDING",
  "order_details": [
    {
      "product_id": "nnvkW6UNR",
      "quantity": 5,
      "unit_price": 2500.00,
      "unit": "unit",
      "profit_pct": 35.0
    }
  ],
  "auto_update_prices": true,
  "default_profit_margin": 30
}
```

**Respuesta Exitosa Esperada:**
```json
{
  "success": true,
  "purchase_order_id": 123,
  "total_amount": 12500.00,
  "items_processed": 1,
  "cost_entries_created": 1,
  "prices_updated": 1,
  "stock_updated": 1,
  "message": "Orden de compra procesada exitosamente - Proveedor: Proveedor XYZ 101"
}
```

---

## ⚡ Validaciones y Restricciones

### 🔒 Validaciones de Negocio

#### Orden de Compra
```typescript
interface PurchaseOrderValidation {
  supplier_id: number;        // Debe existir y estar activo
  status: string;            // Solo: 'PENDING', 'COMPLETED', 'CANCELLED'
  order_details: {
    min_items: 1;            // Mínimo 1 producto
    max_items: 100;          // Máximo 100 productos por orden
  };
}
```

#### Detalles de Productos
```typescript
interface ProductDetailValidation {
  product_id: string;        // Debe existir en products.products
  quantity: number;          // > 0, máximo 999,999.99
  unit_price: number;        // > 0, máximo 999,999.99
  unit: string;             // Máximo 20 caracteres
  profit_pct: number;       // 0-1000%, default 30%
}
```

#### Lógica de Auto-Pricing
```typescript
interface AutoPricingLogic {
  price_protection: boolean;     // No reduce precios existentes
  margin_calculation: string;    // cost * (1 + margin/100)
  unit_validation: boolean;      // Valida unidades por producto
  fallback_margin: number;       // 30% si no se especifica
}
```

### 🛡️ Restricciones de Seguridad

- **Rate Limiting**: Máximo 60 órdenes por hora por usuario
- **Tamaño máximo**: 2MB por request (aproximadamente 500 productos)
- **Timeout**: 30 segundos para procesamiento completo
- **Rollback automático**: Si falla cualquier paso, se revierte toda la transacción

---

## 🔐 Autenticación y Permisos

### 🔑 Headers Requeridos
```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
X-User-ID: {user_id}  // Opcional, se extrae del token
```

### 👥 Permisos Necesarios
```json
{
  "required_permissions": [
    "purchase_orders:create",
    "purchase_orders:read",
    "products:read",
    "suppliers:read"
  ],
  "optional_permissions": [
    "prices:auto_update"      // Para auto-pricing
  ]
}
```

### 🔓 Login y Obtención de Token

Para obtener un token JWT válido, usa el endpoint `/login`:

```http
POST /login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "testuser@example.com",
  "password": "test123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role_id": "JZkiQB"
}
```

**⚠️ Notas Importantes:**
- El endpoint espera `email` y `password`, NO `username`
- El token tiene expiración (verifica el campo `exp` en el payload JWT)
- Si el token expira, obtén uno nuevo haciendo login nuevamente
- **Solución al error 401/400**: La causa más común es un **proveedor inactivo**. Verifique que el `supplier_id` esté activo en la base de datos antes de crear órdenes de compra

---

## 🧪 Ejemplos de Implementación

### 🔄 Hook de React para Crear Orden

```typescript
import { useState } from 'react';

interface UsePurchaseOrderReturn {
  createOrder: (data: PurchaseOrderRequest) => Promise<PurchaseOrderResponse>;
  loading: boolean;
  error: string | null;
}

export const usePurchaseOrder = (): UsePurchaseOrderReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (data: PurchaseOrderRequest): Promise<PurchaseOrderResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/purchase/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create purchase order');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrder,
    loading,
    error,
  };
};
```

};

### � Formulario de Creación de Orden### 📝 Formulario de Creación de Orden

```typescript
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';

interface PurchaseOrderFormData extends PurchaseOrderRequest {}

export const PurchaseOrderForm: React.FC = () => {
  const { register, control, handleSubmit, formState: { errors } } = useForm<PurchaseOrderFormData>({
    defaultValues: {
      order_details: [{ product_id: '', quantity: 1, unit_price: 0, unit: 'unit', profit_pct: 30 }],
      auto_update_prices: true,
      default_profit_margin: 30.0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'order_details',
  });

  const { createOrder, loading, error } = usePurchaseOrder();
  const [createdOrder, setCreatedOrder] = useState<PurchaseOrderResponse | null>(null);

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const result = await createOrder(data);
      setCreatedOrder(result);
    } catch (err) {
      // Error handled by hook
    }
  };

  if (createdOrder) {
    return (
      <div className="success-message">
        <h2>✅ Order Created Successfully!</h2>
        <p>Order ID: #{createdOrder.purchase_order_id}</p>
        <p>Total: ${createdOrder.total_amount?.toLocaleString()}</p>
        <p>Items Processed: {createdOrder.items_processed}</p>
        <p>Cost Entries: {createdOrder.cost_entries_created}</p>
        <p>Prices Updated: {createdOrder.prices_updated}</p>
        <button onClick={() => setCreatedOrder(null)}>Create Another Order</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="purchase-order-form">
      <h2>Create Purchase Order</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Supplier Selection */}
      <div className="form-group">
        <label>Supplier ID:</label>
        <input
          type="number"
          {...register('supplier_id', { required: 'Supplier is required', min: 1 })}
        />
        {errors.supplier_id && <span className="error">{errors.supplier_id.message}</span>}
      </div>

      {/* Status */}
      <div className="form-group">
        <label>Status:</label>
        <select {...register('status', { required: 'Status is required' })}>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {errors.status && <span className="error">{errors.status.message}</span>}
      </div>

      {/* Auto-pricing Options */}
      <div className="form-group">
        <label>
          <input type="checkbox" {...register('auto_update_prices')} />
          Auto-update prices
        </label>
      </div>

      <div className="form-group">
        <label>Default Profit Margin (%):</label>
        <input
          type="number"
          step="0.1"
          {...register('default_profit_margin', { min: 0, max: 1000 })}
        />
      </div>

      {/* Order Items */}
      <div className="order-items">
        <h3>Order Items</h3>
        {fields.map((field, index) => (
          <div key={field.id} className="order-item">
            <div className="form-row">
              <div className="form-group">
                <label>Product ID:</label>
                <input
                  {...register(`order_details.${index}.product_id`, { 
                    required: 'Product ID is required' 
                  })}
                />
              </div>

              <div className="form-group">
                <label>Quantity:</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`order_details.${index}.quantity`, { 
                    required: 'Quantity is required', 
                    min: 0.01 
                  })}
                />
              </div>

              <div className="form-group">
                <label>Unit Price:</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`order_details.${index}.unit_price`, { 
                    required: 'Unit price is required', 
                    min: 0.01 
                  })}
                />
              </div>

              <div className="form-group">
                <label>Unit:</label>
                <input
                  {...register(`order_details.${index}.unit`)}
                  placeholder="unit, kg, box, etc."
                />
              </div>

              <div className="form-group">
                <label>Profit %:</label>
                <input
                  type="number"
                  step="0.1"
                  {...register(`order_details.${index}.profit_pct`, { 
                    min: 0, 
                    max: 1000 
                  })}
                />
              </div>

              <button 
                type="button" 
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="remove-button"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ 
            product_id: '', 
            quantity: 1, 
            unit_price: 0, 
            unit: 'unit', 
            profit_pct: 30 
          })}
          className="add-button"
        >
          Add Item
        </button>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? 'Creating Order...' : 'Create Purchase Order'}
      </button>
    </form>
  );
};
```

---

## 📝 Notas Técnicas

### 🔄 Diferencias con Sistema Anterior

| Aspecto | Sistema Anterior | Sistema Mejorado |
|---------|-----------------|------------------|
| **Costos** | `products.prices.purchase_price` | `products.unit_costs` (por transacción) |
| **Precios** | Mismo campo mezclado | `products.unit_prices` (separado) |
| **Unidades** | Limitado | Múltiples unidades por producto |
| **Trazabilidad** | Básica | Completa con metadatos |
| **Auto-pricing** | No disponible | Inteligente con protección |
| **Validación** | Manual | Automática con reportes |

### ⚡ Optimizaciones de Performance

- **Transacciones atómicas**: Todo o nada, sin estados inconsistentes
- **Índices optimizados**: Consultas rápidas en `unit_costs` y `unit_prices`
- **Consultas LATERAL**: Análisis eficiente de datos relacionados
- **Metadatos JSONB**: Búsquedas indexadas en metadatos

### 🛡️ Consideraciones de Seguridad

- **Validación de entrada**: Todos los datos son validados antes del procesamiento
- **Protección de precios**: No permite reducciones accidentales
- **Auditoría completa**: Todos los cambios son trazables
- **Rollback automático**: Garantiza consistencia en caso de errores

### 🔧 Configuración Recomendada

```json
{
  "purchase_order_defaults": {
    "auto_update_prices": true,
    "default_profit_margin": 30.0,
    "max_items_per_order": 100,
    "timeout_seconds": 30
  },
  "validation_settings": {
    "enable_product_validation": true,
    "enable_unit_validation": true,
    "enable_supplier_validation": true,
    "strict_mode": false
  },
  "pricing_protection": {
    "prevent_price_reduction": true,
    "allow_manual_override": true,
    "require_approval_for_reduction": true
  }
}
```

---

## 🎯 Casos de Uso Comunes

### 1. **Orden de Compra Simple**
- Un proveedor, múltiples productos
- Auto-pricing habilitado
- Productos con diferentes unidades

### 2. **Orden de Inventario Masivo**
- Gran cantidad de productos
- Márgenes específicos por producto
- Validación de integridad post-creación

### 3. **Reabastecimiento Programado**
- Órdenes regulares con mismos productos
- Análisis de variación de costos
- Ajuste automático de precios de venta

### 4. **Análisis de Impacto**
- Evaluar cambios en costos
- Analizar márgenes por proveedor
- Optimizar pricing strategy

---

## 🚫 **NUEVO: Sistema de Cancelación de Órdenes de Compra**

### 📋 Descripción General

El sistema ahora incluye funcionalidad completa para **cancelar órdenes de compra** con reversión automática de stock, cancelación de pagos y auditoría completa. Incluye dos nuevos endpoints especializados.

### 🎯 Funcionalidades de Cancelación

- ✅ **Vista previa de cancelación**: Analiza impacto sin realizar cambios
- ✅ **Cancelación completa**: Revierte stock, cancela pagos, actualiza estados
- ✅ **Auditoría detallada**: Registra todas las operaciones para seguimiento
- ✅ **Validaciones de seguridad**: Previene cancelaciones incorrectas
- ✅ **Cancelación forzada**: Para casos excepcionales con supervisión

---

## 🔍 **Vista Previa de Cancelación de Orden**

```http
GET /purchase/{id}/preview-cancellation
Authorization: Bearer {token}
```

### 📋 Descripción

Analiza el impacto de cancelar una orden de compra **sin realizar cambios reales**. Proporciona un análisis detallado de stock, pagos, y recomendaciones antes de proceder con la cancelación definitiva.

### 📊 Parámetros de URL

- `{id}`: ID de la orden de compra a analizar (number)

### 📤 Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "generated_at": "2025-09-22T15:29:57.762549-03:00",
  "purchase_info": {
    "purchase_order_id": 42,
    "supplier_id": 11,
    "supplier_name": "Proveedor ABC",
    "current_status": "PENDING",
    "total_amount": 14000.00,
    "order_date": "2025-09-19T15:15:11.238171Z",
    "created_by": "2prrJIgRvgaFVbuu49ua9QJVu8n",
    "created_by_name": "Usuario Sistema"
  },
  "stock_impact": [
    {
      "product_id": "Zyf1OBCNg",
      "product_name": "Shampoo Sedal Rizos Perfectos 500 ML",
      "quantity_to_revert": 1.0,
      "current_stock": 3.0,
      "stock_after_cancellation": 2.0,
      "sufficient_stock": true,
      "unit_price": 14000.00,
      "line_total": 14000.00
    }
  ],
  "payment_impact": [],
  "impact_analysis": {
    "total_items": 1,
    "products_with_insufficient_stock": 0,
    "requires_stock_adjustment": true,
    "requires_payment_reversal": false,
    "total_paid_amount": 0.00,
    "payments_to_cancel": 0,
    "requires_force_cancel": false
  },
  "can_be_cancelled": true,
  "cancellation_issues": [],
  "warnings": [],
  "recommendations": [
    "La orden puede cancelarse de forma segura sin problemas de stock.",
    "No hay pagos asociados que requieran reversión."
  ],
  "general_recommendations": {
    "notify_supplier": true,
    "backup_recommended": false,
    "estimated_complexity": "LOW",
    "requires_approval": false
  }
}
```

### 📋 Modelo TypeScript de Request/Response

```typescript
interface PreviewCancellationRequest {
  purchase_order_id: number;
}

interface PreviewCancellationResponse {
  success: boolean;
  generated_at: string;
  purchase_info: {
    purchase_order_id: number;
    supplier_id: number;
    supplier_name: string;
    current_status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    total_amount: number;
    order_date: string;
    created_by: string;
    created_by_name: string;
  };
  stock_impact: StockImpactItem[];
  payment_impact: PaymentImpactItem[];
  impact_analysis: {
    total_items: number;
    products_with_insufficient_stock: number;
    requires_stock_adjustment: boolean;
    requires_payment_reversal: boolean;
    total_paid_amount: number;
    payments_to_cancel: number;
    requires_force_cancel: boolean;
  };
  can_be_cancelled: boolean;
  cancellation_issues: string[];
  warnings: string[];
  recommendations: string[];
  general_recommendations: {
    notify_supplier: boolean;
    backup_recommended: boolean;
    estimated_complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    requires_approval: boolean;
  };
}

interface StockImpactItem {
  product_id: string;
  product_name: string;
  quantity_to_revert: number;
  current_stock: number;
  stock_after_cancellation: number;
  sufficient_stock: boolean;
  unit_price: number;
  line_total: number;
}

interface PaymentImpactItem {
  payment_id: number;
  amount_paid: number;
  payment_method: string;
  payment_date: string;
  status: string;
  can_be_cancelled: boolean;
}
```

---

## 🚫 **Cancelación de Orden de Compra**

```http
POST /purchase/cancel
Content-Type: application/json
Authorization: Bearer {token}
```

### 📋 Descripción

Cancela definitivamente una orden de compra, realizando todas las operaciones de reversión necesarias: stock, pagos, y actualizaciones de estado. **Esta operación es irreversible**.

### 📊 Request Body

```json
{
  "purchase_order_id": 38,
  "user_id": "2prrJIgRvgaFVbuu49ua9QJVu8n",
  "cancellation_reason": "Cliente canceló pedido",
  "force_cancel": false
}
```

### 📋 Parámetros del Request

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `purchase_order_id` | `number` | ✅ | ID de la orden a cancelar |
| `user_id` | `string` | ✅ | ID del usuario que realiza la cancelación |
| `cancellation_reason` | `string` | ❌ | Motivo de la cancelación (recomendado) |
| `force_cancel` | `boolean` | ❌ | Forzar cancelación aunque haya stock insuficiente (default: false) |

### 📤 Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Purchase order cancelled successfully",
  "cancelled_order_id": 38,
  "cancellation_details": {
    "items_reverted": 1,
    "stock_items_updated": 1,
    "payments_cancelled": 0,
    "cancelled_at": "2025-09-22T15:29:21.577672Z",
    "cancelled_by": "2prrJIgRvgaFVbuu49ua9QJVu8n",
    "force_cancel_used": false
  }
}
```

### ⚠️ Respuesta de Error (400 Bad Request)

```json
{
  "success": false,
  "error": "PURCHASE_ORDER_ALREADY_CANCELLED",
  "message": "La orden de compra 38 ya está cancelada",
  "details": {
    "purchase_order_id": 38,
    "current_status": "CANCELLED"
  }
}
```

```json
{
  "success": false,
  "error": "INSUFFICIENT_STOCK",
  "message": "No se puede cancelar la orden. Stock insuficiente en productos: Producto ABC (necesita: 5, disponible: 2). Use force_cancel=true para forzar cancelación",
  "details": {
    "insufficient_stock_products": [
      "Producto ABC (necesita: 5, disponible: 2)"
    ],
    "requires_force_cancel": true
  }
}
```

### 📋 Modelo TypeScript de Request/Response

```typescript
interface CancelPurchaseOrderRequest {
  purchase_order_id: number;
  user_id: string;
  cancellation_reason?: string;
  force_cancel?: boolean;
}

interface CancelPurchaseOrderResponse {
  success: boolean;
  message: string;
  cancelled_order_id?: number;
  cancellation_details?: {
    items_reverted: number;
    stock_items_updated: number;
    payments_cancelled: number;
    cancelled_at: string;
    cancelled_by: string;
    force_cancel_used: boolean;
  };
  error?: string;
  details?: {
    purchase_order_id?: number;
    current_status?: string;
    insufficient_stock_products?: string[];
    requires_force_cancel?: boolean;
  };
}
```

---

## 🔄 **Hooks de React para Cancelación**

### Hook para Vista Previa de Cancelación

```typescript
import { useState } from 'react';

interface UseCancellationPreviewReturn {
  previewCancellation: (orderId: number) => Promise<PreviewCancellationResponse>;
  loading: boolean;
  error: string | null;
  previewData: PreviewCancellationResponse | null;
}

export const useCancellationPreview = (): UseCancellationPreviewReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewCancellationResponse | null>(null);

  const previewCancellation = async (orderId: number): Promise<PreviewCancellationResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/purchase/${orderId}/preview-cancellation`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to preview cancellation');
      }

      const data = await response.json();
      setPreviewData(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    previewCancellation,
    loading,
    error,
    previewData,
  };
};
```

### Hook para Cancelación de Orden

```typescript
import { useState } from 'react';

interface UsePurchaseOrderCancellationReturn {
  cancelOrder: (request: CancelPurchaseOrderRequest) => Promise<CancelPurchaseOrderResponse>;
  loading: boolean;
  error: string | null;
}

export const usePurchaseOrderCancellation = (): UsePurchaseOrderCancellationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelOrder = async (request: CancelPurchaseOrderRequest): Promise<CancelPurchaseOrderResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/purchase/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel purchase order');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    cancelOrder,
    loading,
    error,
  };
};
```

---

## 📱 **Componente de React para Cancelación**

```typescript
import React, { useState } from 'react';
import { useCancellationPreview, usePurchaseOrderCancellation } from './hooks';

interface PurchaseOrderCancellationProps {
  orderId: number;
  onCancellationComplete?: (result: CancelPurchaseOrderResponse) => void;
  onCancel?: () => void;
}

export const PurchaseOrderCancellation: React.FC<PurchaseOrderCancellationProps> = ({
  orderId,
  onCancellationComplete,
  onCancel,
}) => {
  const { previewCancellation, loading: previewLoading, previewData } = useCancellationPreview();
  const { cancelOrder, loading: cancelLoading } = usePurchaseOrderCancellation();
  
  const [step, setStep] = useState<'preview' | 'confirm' | 'completed'>('preview');
  const [cancellationReason, setCancellationReason] = useState('');
  const [forceCancel, setForceCancel] = useState(false);
  const [result, setResult] = useState<CancelPurchaseOrderResponse | null>(null);

  const handlePreview = async () => {
    try {
      await previewCancellation(orderId);
      setStep('confirm');
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  const handleConfirmCancellation = async () => {
    if (!previewData) return;

    try {
      const response = await cancelOrder({
        purchase_order_id: orderId,
        user_id: getCurrentUserId(), // Implementar función para obtener user ID
        cancellation_reason: cancellationReason || 'No reason provided',
        force_cancel: forceCancel,
      });

      setResult(response);
      setStep('completed');
      onCancellationComplete?.(response);
    } catch (error) {
      console.error('Cancellation failed:', error);
    }
  };

  if (step === 'preview') {
    return (
      <div className="cancellation-preview">
        <h3>Cancelar Orden de Compra #{orderId}</h3>
        <p>¿Está seguro que desea cancelar esta orden? Esta acción analizará el impacto antes de proceder.</p>
        
        <div className="action-buttons">
          <button onClick={handlePreview} disabled={previewLoading}>
            {previewLoading ? 'Analizando...' : 'Analizar Impacto'}
          </button>
          <button onClick={onCancel} className="cancel-button">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm' && previewData) {
    return (
      <div className="cancellation-confirm">
        <h3>Confirmar Cancelación - Orden #{orderId}</h3>
        
        {/* Información de la orden */}
        <div className="order-info">
          <h4>Información de la Orden</h4>
          <p><strong>Proveedor:</strong> {previewData.purchase_info.supplier_name}</p>
          <p><strong>Estado Actual:</strong> {previewData.purchase_info.current_status}</p>
          <p><strong>Total:</strong> ${previewData.purchase_info.total_amount.toLocaleString()}</p>
          <p><strong>Fecha:</strong> {new Date(previewData.purchase_info.order_date).toLocaleDateString()}</p>
        </div>

        {/* Impacto en Stock */}
        {previewData.stock_impact.length > 0 && (
          <div className="stock-impact">
            <h4>Impacto en Stock</h4>
            {previewData.stock_impact.map((item) => (
              <div key={item.product_id} className={`stock-item ${!item.sufficient_stock ? 'insufficient' : ''}`}>
                <p><strong>{item.product_name}</strong></p>
                <p>Cantidad a revertir: {item.quantity_to_revert}</p>
                <p>Stock actual: {item.current_stock}</p>
                <p>Stock después: {item.stock_after_cancellation}</p>
                {!item.sufficient_stock && (
                  <p className="warning">⚠️ Stock insuficiente</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Análisis de Impacto */}
        <div className="impact-analysis">
          <h4>Análisis de Impacto</h4>
          <p>Total de items: {previewData.impact_analysis.total_items}</p>
          <p>Productos con stock insuficiente: {previewData.impact_analysis.products_with_insufficient_stock}</p>
          {previewData.impact_analysis.requires_payment_reversal && (
            <p>Pagos a cancelar: {previewData.impact_analysis.payments_to_cancel}</p>
          )}
        </div>

        {/* Recomendaciones */}
        {previewData.recommendations.length > 0 && (
          <div className="recommendations">
            <h4>Recomendaciones</h4>
            <ul>
              {previewData.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {previewData.warnings.length > 0 && (
          <div className="warnings">
            <h4>⚠️ Advertencias</h4>
            <ul>
              {previewData.warnings.map((warning, index) => (
                <li key={index} className="warning">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Formulario de confirmación */}
        <div className="confirmation-form">
          <h4>Detalles de Cancelación</h4>
          
          <div className="form-group">
            <label>Motivo de cancelación:</label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ingrese el motivo de la cancelación..."
              rows={3}
            />
          </div>

          {previewData.impact_analysis.requires_force_cancel && (
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={forceCancel}
                  onChange={(e) => setForceCancel(e.target.checked)}
                />
                Forzar cancelación (stock insuficiente detectado)
              </label>
            </div>
          )}

          <div className="action-buttons">
            <button 
              onClick={handleConfirmCancellation} 
              disabled={cancelLoading || (!previewData.can_be_cancelled && !forceCancel)}
              className="confirm-button"
            >
              {cancelLoading ? 'Cancelando...' : 'Confirmar Cancelación'}
            </button>
            <button onClick={() => setStep('preview')} className="back-button">
              Volver
            </button>
            <button onClick={onCancel} className="cancel-button">
              Cancelar Proceso
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'completed' && result) {
    return (
      <div className="cancellation-completed">
        <h3>✅ Cancelación Completada</h3>
        
        {result.success ? (
          <div className="success-details">
            <p>La orden #{result.cancelled_order_id} ha sido cancelada exitosamente.</p>
            
            <div className="cancellation-summary">
              <h4>Resumen de Cancelación</h4>
              <p>Items revertidos: {result.cancellation_details?.items_reverted}</p>
              <p>Stock actualizado: {result.cancellation_details?.stock_items_updated} productos</p>
              <p>Pagos cancelados: {result.cancellation_details?.payments_cancelled}</p>
              <p>Fecha: {result.cancellation_details?.cancelled_at && new Date(result.cancellation_details.cancelled_at).toLocaleString()}</p>
              {result.cancellation_details?.force_cancel_used && (
                <p className="warning">⚠️ Cancelación forzada utilizada</p>
              )}
            </div>
          </div>
        ) : (
          <div className="error-details">
            <p className="error">❌ Error durante la cancelación</p>
            <p>{result.message}</p>
          </div>
        )}

        <button onClick={onCancel} className="close-button">
          Cerrar
        </button>
      </div>
    );
  }

  return null;
};
```

---

## 🎯 **Casos de Uso de Cancelación**

### 1. **Cancelación Simple (Sin Pagos, Stock Suficiente)**
- Orden en estado PENDING
- Sin pagos realizados
- Stock suficiente para reversión
- **Resultado**: Cancelación directa sin complicaciones

### 2. **Cancelación con Stock Insuficiente**
- Productos ya vendidos después de la compra
- Stock actual menor al comprado
- **Opciones**: 
  - Rechazar cancelación
  - Usar `force_cancel: true` para permitir stock negativo

### 3. **Cancelación con Pagos Asociados**
- Orden con pagos parciales o completos
- **Resultado**: Automáticamente marca pagos como CANCELLED
- **Nota**: No revierte transacciones bancarias, solo actualiza estado

### 4. **Cancelación de Orden Completada**
- Orden en estado COMPLETED
- **Requiere**: `force_cancel: true`
- **Recomendación**: Solo para casos excepcionales

---

## ⚠️ **Consideraciones Importantes**

### 🔒 Seguridad
- **Permisos necesarios**: `purchase_orders:cancel`, `stock:adjust`, `payments:cancel`
- **Auditoría completa**: Todas las operaciones quedan registradas
- **Irreversible**: La cancelación no se puede deshacer

### 📊 Impacto en Datos
- **Stock**: Se resta la cantidad comprada (puede generar stock negativo con force_cancel)
- **Pagos**: Se marcan como CANCELLED (no se revierten automáticamente)
- **Precios**: Los precios generados se marcan como obsoletos
- **Costos**: Los costos se marcan como obsoletos pero permanecen para auditoría

### 💡 Mejores Prácticas
1. **Siempre usar vista previa** antes de cancelar
2. **Documentar motivo** de cancelación
3. **Notificar al proveedor** cuando corresponda
4. **Revisar impacto** en stock antes de confirmar
5. **Considerar timing** - evitar cancelar órdenes muy antiguas

---

**Última actualización**: 22 de Septiembre de 2025  
**Versión del sistema**: Complete v1.4_CANCELLATION_SYSTEM  
**Compatibilidad**: Backend Go v2.2+, PostgreSQL 12+

**🚀 NUEVA FUNCIONALIDAD EN ESTA VERSIÓN:**
- ✅ **SISTEMA DE CANCELACIÓN**: Vista previa y cancelación completa de órdenes
- ✅ **Endpoints nuevos**: `/purchase/{id}/preview-cancellation` y `/purchase/cancel/{id}`
- ✅ **Reversión automática**: Stock, pagos y estados actualizados automáticamente
- ✅ **Auditoría completa**: Trazabilidad total de operaciones de cancelación
- ✅ **Componentes React**: Hooks y componentes listos para usar

---

## 🔍 **Obtener Orden de Compra por ID con Validación de Proveedor**

```http
GET /purchase/{id}/supplier/{supplier_name}
Authorization: Bearer {token}
```

### 📋 Descripción

Obtiene una orden de compra específica por su ID, incluyendo todos sus detalles/items, pero con **validación adicional del nombre del proveedor**. Este endpoint garantiza que la orden pertenece al proveedor especificado, proporcionando una capa extra de seguridad y consistencia.

### 🎯 Caso de Uso

Útil cuando necesitas:
- Obtener detalles completos de una orden específica
- Verificar que la orden pertenece a un proveedor determinado
- Evitar acceso a datos de otros proveedores
- Mostrar información detallada en interfaces de gestión

### 📊 Parámetros de URL

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `id` | `number` | ✅ | ID único de la orden de compra |
| `supplier_name` | `string` | ✅ | Nombre exacto del proveedor (URL-encoded) |

### 🔐 Headers Requeridos

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 📤 Respuesta Exitosa (200 OK)

```json
{
  "purchase": {
    "id": 3,
    "order_date": "2025-05-22T22:01:47.933701Z",
    "total_amount": 22245370,
    "status": "COMPLETED",
    "supplier_id": 12,
    "supplier_name": "Suministros Varios 55",
    "supplier_status": true, // <--- NUEVO
    "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "user_name": "Pedro Sanchez"
  },
  "details": [
    {
      "id": 21,
      "purchase_id": 3,
      "product_id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
      "product_name": "Onion - Dried",
      "quantity": 7,
      "unit_price": 320000,
      "subtotal": 2240000,
      "exp_date": "2028-06-25T00:00:00Z",
      "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
      "user_name": "Pedro Sanchez"
    },
    {
      "id": 12,
      "purchase_id": 3,
      "product_id": "xPwS6OPbcEZ0ZJlX93y2D6ukaKa",
      "product_name": "Pie Filling - Apple",
      "quantity": 15,
      "unit_price": 75500,
      "subtotal": 1132500,
      "exp_date": "2027-11-10T00:00:00Z",
      "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
      "user_name": "Pedro Sanchez"
    }
    // ... más items
  ]
}
```

### 📋 Modelo TypeScript de Respuesta

```typescript
interface PurchaseOrderWithValidation {
  purchase: PurchaseOrderHeader;
  details: PurchaseOrderItem[];
}

interface PurchaseOrderHeader {
  id: number;
  order_date: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  supplier_id: number;
  supplier_name: string;
  supplier_status: boolean; // <--- NUEVO
  user_id: string;
  user_name: string;
}

interface PurchaseOrderItem {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  exp_date: string;
  user_id: string;
  user_name: string;
}
```

### ⚠️ Códigos de Error

#### 400 Bad Request
```json
{
  "error": "Invalid purchase ID"
}
```

#### 404 Not Found - Proveedor Incorrecto
```json
{
  "error": "Purchase order 19 does not belong to supplier 'Proveedor Incorrecto'"
}
```

#### 500 Internal Server Error - Orden No Existe
```json
{
  "error": "sql: no rows in result set"
}
```

### 🧪 Ejemplos de Uso

#### ✅ Ejemplo 1: Orden Válida
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     "http://localhost:5050/purchase/3/supplier/Suministros%20Varios%2055"
```

#### ❌ Ejemplo 2: Proveedor Incorrecto
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     "http://localhost:5050/purchase/3/supplier/Proveedor%20Incorrecto"
# Respuesta: Purchase order 3 does not belong to supplier 'Proveedor Incorrecto'
```

#### ❌ Ejemplo 3: Orden Inexistente
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     "http://localhost:5050/purchase/999/supplier/Suministros%20Varios%2055"
# Respuesta: sql: no rows in result set
```

### 🔄 Hook de React para Obtener Orden

```typescript
import { useState, useEffect } from 'react';

interface UsePurchaseOrderDetailsReturn {
  order: PurchaseOrderWithValidation | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePurchaseOrderDetails = (
  orderId: number | null, 
  supplierName: string | null
): UsePurchaseOrderDetailsReturn => {
  const [order, setOrder] = useState<PurchaseOrderWithValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderId || !supplierName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/purchase/${orderId}/supplier/${encodeURIComponent(supplierName)}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setOrder(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId, supplierName]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
};
```

### 📱 Componente de React para Mostrar Orden

```typescript
import React from 'react';
import { usePurchaseOrderDetails } from './hooks/usePurchaseOrderDetails';

interface PurchaseOrderDetailsProps {
  orderId: number;
  supplierName: string;
}

export const PurchaseOrderDetails: React.FC<PurchaseOrderDetailsProps> = ({
  orderId,
  supplierName,
}) => {
  const { order, loading, error, refetch } = usePurchaseOrderDetails(orderId, supplierName);

  if (loading) {
    return <div className="loading">Loading purchase order details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading purchase order</h3>
        <p>{error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!order) {
    return <div className="no-data">No purchase order found</div>;
  }

  return (
    <div className="purchase-order-details">
      <div className="order-header">
        <h2>Purchase Order #{order.purchase.id}</h2>
        <div className="order-meta">
          <span className="supplier">Supplier: {order.purchase.supplier_name}</span>
          <span className="status" data-status={order.purchase.status}>
            {order.purchase.status}
          </span>
          <span className="date">
            {new Date(order.purchase.order_date).toLocaleDateString()}
          </span>
          <span className="total">
            Total: ${order.purchase.total_amount.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="order-items">
        <h3>Order Items ({order.details.length})</h3>
        <div className="items-table">
          <div className="table-header">
            <span>Product</span>
            <span>Quantity</span>
            <span>Unit Price</span>
            <span>Subtotal</span>
            <span>Expiration</span>
          </div>
          {order.details.map((item) => (
            <div key={item.id} className="table-row">
              <span className="product-name">{item.product_name}</span>
              <span className="quantity">{item.quantity}</span>
              <span className="unit-price">${item.unit_price.toLocaleString()}</span>
              <span className="subtotal">${item.subtotal.toLocaleString()}</span>
              <span className="exp-date">
                {new Date(item.exp_date).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="order-footer">
        <p>Created by: {order.purchase.user_name}</p>
        <button onClick={refetch} className="refresh-button">
          Refresh
        </button>
      </div>
    </div>
  );
};
```

### 🔒 Consideraciones de Seguridad

- **Validación estricta**: El nombre del proveedor debe coincidir exactamente
- **Autenticación requerida**: Solo usuarios autenticados pueden acceder
- **No expone datos sensibles**: Solo información de la orden específica
- **Rate limiting**: Aplicable según configuración general del sistema

### 📊 Comparación con Endpoints Similares

| Endpoint | Validación | Respuesta |
|----------|------------|-----------|
| `GET /purchase/{id}` | Ninguna | Orden completa |
| `GET /purchase/supplier_name/{name}` | Ninguna | Múltiples órdenes |
| `GET /purchase/{id}/supplier/{name}` | ✅ Proveedor | Una orden validada |

---

## 🔍 **Consultar Compras por Nombre de Proveedor**

```http
GET /purchase/supplier_name/{name}
Authorization: Bearer {token}
```

### 📋 Descripción

Obtiene todas las órdenes de compra asociadas a un proveedor específico por su nombre, incluyendo datos **enriquecidos** como nombres de productos, información del proveedor, y detalles completos de cada orden. Este endpoint es útil para análisis de compras por proveedor y reportes históricos.

### 🎯 Caso de Uso

Útil cuando necesitas:

- Analizar todas las compras de un proveedor específico
- Generar reportes de compras por proveedor
- Verificar historial de transacciones con un proveedor
- Análisis de costos y precios por proveedor

### 📊 Parámetros de URL

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `name` | `string` | ✅ | Nombre del proveedor (URL-encoded) |

### 🔐 Headers Requeridos

```http
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

### 📤 Respuesta Exitosa (200 OK)

```json
{
  "purchase": {
    "id": 123,
    "supplier_id": 10,
    "supplier_name": "Proveedor ABC",
    "supplier_status": true, // <--- NUEVO
    "total_amount": 10000.00,
    "status": "COMPLETED"
  },
  "details": [
    {
      "id": 456,
      "product_name": "Banana Premium",
      "quantity": 50.0,
      "unit_price": 7000.00,
      "unit": "kg",
      "tax_rate": 10.0,
      "profit_pct": 30.0,
      "line_total": 350000.00,
      "sale_price": 9100.00,
      "metadata": {
        "unit": "kg",
        "tax_rate": 10,
        "line_total": 350000,
        "profit_pct": 30
      }
    }
  ]
}
```

### 📋 Modelo TypeScript de Respuesta

```typescript
interface PurchaseOrderEnriched[] {
  purchase: PurchaseOrderHeader;
  details: PurchaseOrderItem[];
}

interface PurchaseOrderHeader {
  id: number;
  order_date: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  supplier_id: number;
  supplier_name: string;
  supplier_status: boolean; // <--- NUEVO
  user_id: string;
  user_name: string;
}

interface PurchaseOrderItem {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  exp_date: string;
  user_id: string;
  user_name: string;
}
```

### ⚠️ Códigos de Error

#### 400 Bad Request
```json
{
  "error": "Missing supplier_name parameter"
}
```

#### 500 Internal Server Error
```json
{
  "error": "sql: no rows in result set"
}
```

### 🧪 Ejemplos de Uso

#### ✅ Ejemplo 1: Proveedor Existente
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     "http://localhost:5050/purchase/supplier_name/Suministros%20Varios%2055"
```

#### ❌ Ejemplo 2: Proveedor Inexistente
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
     "http://localhost:5050/purchase/supplier_name/Proveedor%20Inexistente"
# Respuesta: []
```

### 🔄 Hook de React para Obtener Compras por Proveedor

```typescript
import { useState, useEffect } from 'react';

interface UseSupplierPurchasesReturn {
  purchases: PurchaseOrderEnriched[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSupplierPurchases = (
  supplierName: string | null
): UseSupplierPurchasesReturn => {
  const [purchases, setPurchases] = useState<PurchaseOrderEnriched[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    if (!supplierName) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/purchase/supplier_name/${encodeURIComponent(supplierName)}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [supplierName]);

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
  };
};
```

### 📊 Comparación con Endpoints Similares

| Endpoint | Datos | Alcance |
|----------|-------|---------|
| `GET /purchase/supplier_name/{name}` | ✅ Enriquecidos | Múltiples órdenes |
| `GET /purchase/{id}/supplier/{name}` | ✅ Enriquecidos | Una orden validada |
| `GET /purchase/supplier_id/{id}` | ✅ Enriquecidos | Múltiples órdenes |

---

## 📅 **Consultar Compras por Rango de Fechas**

```http
GET /purchase/date_range/?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}&page={1}&page_size={50}
Authorization: Bearer {token}
```

### 📋 Descripción

Obtiene todas las órdenes de compra dentro de un rango de fechas específico, incluyendo datos **enriquecidos** completos. Este endpoint permite análisis temporales, reportes históricos y seguimiento de compras por períodos.

### 🎯 Caso de Uso

Útil cuando necesitas:
- Análisis de compras por período (diario, semanal, mensual)
- Generar reportes financieros por fecha
- Seguimiento de tendencias de compra
- Auditoría histórica de transacciones

### 📊 Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `start_date` | `string` | ✅ | Fecha inicial (formato: YYYY-MM-DD) |
| `end_date` | `string` | ✅ | Fecha final (formato: YYYY-MM-DD) |
| `page` | `number` | ✅ | Número de página (mínimo: 1) |
| `page_size` | `number` | ✅ | Tamaño de página (mínimo: 1, máximo: 1000) |

### 🔐 Headers Requeridos

```http
Authorization: Bearer {jwt_token}
```

### 📤 Respuesta Exitosa (200 OK)

```json
{
  "purchase": {
    "id": 123,
    "supplier_id": 10,
    "supplier_name": "Proveedor ABC",
    "supplier_status": true, // <--- NUEVO
    "total_amount": 10000.00,
    "status": "COMPLETED"
  },
  "details": [
    {
      "id": 456,
      "product_name": "Banana Premium",
      "quantity": 50.0,
      "unit_price": 7000.00,
      "unit": "kg",
      "tax_rate": 10.0,
      "profit_pct": 30.0,
      "line_total": 350000.00,
      "sale_price": 9100.00,
      "metadata": {
        "unit": "kg",
        "tax_rate": 10,
        "line_total": 350000,
        "profit_pct": 30
      }
    }
  ]
}
```

### 📋 Modelo TypeScript de Respuesta

```typescript
interface PurchaseOrderEnriched[] {
  purchase: PurchaseOrderHeader;
  details: PurchaseOrderItem[];
}

interface PurchaseOrderHeader {
  id: number;
  order_date: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  supplier_id: number;
  supplier_name: string;
  supplier_status: boolean; // <--- NUEVO
  user_id: string;
  user_name: string;
}

interface PurchaseOrderItem {
  id: number;
  purchase_id: number;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  exp_date: string;
  user_id: string;
  user_name: string;
}
```

### ⚠️ Códigos de Error

#### 400 Bad Request
```json
{
  "error": "Page must be greater than 0"
}
```

#### 401 Unauthorized
```json
{
  "error": "Token inválido"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Database connection error"
}
```

### 🧪 Ejemplos de Uso

#### ✅ Ejemplo 1: Rango de Fechas Válido
```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  "http://localhost:5050/purchase/date_range/?start_date=2025-01-01&end_date=2025-12-31&page=1&page_size=50"
```

#### ❌ Ejemplo 2: Página Inválida
```bash
curl -X GET \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  "http://localhost:5050/purchase/date_range/?start_date=2025-01-01&end_date=2025-12-31&page=0&page_size=50"
# Respuesta: Page must be greater than 0
```

### 🔄 Hook de React para Obtener Compras por Fecha

```typescript
import { useState, useEffect } from 'react';

interface DateRangeParams {
  startDate: string;
  endDate: string;
  page: number;
  pageSize: number;
}

interface UseDateRangePurchasesReturn {
  purchases: PurchaseOrderEnriched[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useDateRangePurchases = (
  params: DateRangeParams | null
): UseDateRangePurchasesReturn => {
  const [purchases, setPurchases] = useState<PurchaseOrderEnriched[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchases = async () => {
    if (!params) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        start_date: params.startDate,
        end_date: params.endDate,
        page: params.page.toString(),
        page_size: params.pageSize.toString(),
      });

      const response = await fetch(`/purchase/date_range/?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPurchases(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [params?.startDate, params?.endDate, params?.page, params?.pageSize]);

  return {
    purchases,
    loading,
    error,
    refetch: fetchPurchases,
  };
};
```

### 📊 Comparación con Endpoints Similares

| Endpoint | Método | Datos | Paginación |
|----------|--------|-------|------------|
| `GET /purchase/date_range/` | GET | ✅ Enriquecidos | ✅ Query params |
| `GET /stock-transactions/by-date` | GET | ✅ Básicos | ✅ Query params |
| `GET /price-transactions/by-date` | GET | ✅ Básicos | ✅ Query params |

---

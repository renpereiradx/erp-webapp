# 🛒 Guía Frontend: Ventas con Reservas y Descuentos

## 📅 **Actualizado:** 26 de Septiembre, 2025
## 🎯 **Propósito:** Guía completa para manejar ventas con reservas y descuentos desde el frontend

---

## 🌐 **ENDPOINT PRINCIPAL**

```
POST /sales/orders
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
```

---

## 📋 **ESTRUCTURA DE DATOS REQUERIDA**

### **Modelo Base: SaleRequest**
```typescript
interface SaleRequest {
  sale_id?: string;                    // Opcional - se genera automáticamente si no se proporciona
  client_id: string;                   // OBLIGATORIO - ID del cliente
  reserve_id?: number;                 // Opcional - ID de reserva si aplica
  product_details: ProductDetail[];    // OBLIGATORIO - Lista de productos
  payment_method_id?: number;          // Opcional - Método de pago
  currency_id?: number;                // Opcional - Moneda
  allow_price_modifications: boolean;  // OBLIGATORIO - Permite modificaciones de precio
}
```

### **Modelo Producto: ProductDetail**
```typescript
interface ProductDetail {
  product_id: string;           // OBLIGATORIO - ID del producto
  quantity: number;             // OBLIGATORIO - Cantidad (>0)
  tax_rate_id?: number;         // Opcional - ID de tasa de impuesto
  
  // MODIFICACIÓN DE PRECIOS (requiere allow_price_modifications = true)
  sale_price?: number;          // Precio modificado
  price_change_reason?: string; // Razón del cambio (OBLIGATORIO si sale_price está presente)
  
  // DESCUENTOS (NUEVO)
  discount_amount?: number;     // Descuento en valor absoluto
  discount_percent?: number;    // Descuento en porcentaje (0-100)
  discount_reason?: string;     // Razón del descuento (OBLIGATORIO si hay descuento)
}
```

---

## 🎯 **CASOS DE USO Y EJEMPLOS**

### **1. Venta Simple (Sin reservas, sin descuentos)**
```json
{
  "client_id": "CLIENT_001",
  "product_details": [
    {
      "product_id": "PROD_001",
      "quantity": 2
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": false
}
```

### **2. Venta con Reserva (Productos tipo SERVICE)**
```json
{
  "client_id": "CLIENT_001",
  "reserve_id": 123,
  "product_details": [
    {
      "product_id": "CANCHA_01",
      "quantity": 1
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": false
}
```

### **3. Venta con Descuentos por Monto Fijo**
```json
{
  "client_id": "CLIENT_001",
  "product_details": [
    {
      "product_id": "SERVICE_001",
      "quantity": 1,
      "discount_amount": 15000,
      "discount_reason": "Cliente frecuente - descuento especial"
    },
    {
      "product_id": "SERVICE_002", 
      "quantity": 1,
      "discount_amount": 10000,
      "discount_reason": "Promoción de temporada baja"
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": true
}
```

### **4. Venta con Descuentos por Porcentaje**
```json
{
  "client_id": "CLIENT_001",
  "product_details": [
    {
      "product_id": "SERVICE_001",
      "quantity": 1,
      "discount_percent": 20.0,
      "discount_reason": "Descuento del 20% por combo familiar"
    },
    {
      "product_id": "SERVICE_002",
      "quantity": 1, 
      "discount_percent": 15.0,
      "discount_reason": "Descuento del 15% por cliente VIP"
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": true
}
```

### **5. Venta Completa (Reserva + Descuentos + Precios Modificados)**
```json
{
  "sale_id": "CUSTOM_SALE_001",
  "client_id": "CLIENT_001",
  "reserve_id": 456,
  "product_details": [
    {
      "product_id": "CANCHA_01",
      "quantity": 1,
      "sale_price": 55000,
      "price_change_reason": "Precio negociado por reserva múltiple",
      "discount_percent": 10.0,
      "discount_reason": "Descuento adicional por pago anticipado"
    },
    {
      "product_id": "EQUIPAMIENTO_01",
      "quantity": 2,
      "discount_amount": 5000,
      "discount_reason": "Descuento por alquiler conjunto"
    }
  ],
  "payment_method_id": 1,
  "currency_id": 1,
  "allow_price_modifications": true
}
```

---

## 🔄 **MANEJO DE RESERVAS**

### **Flujo de Reservas:**
1. **Cliente crea una reserva** → Estado `CONFIRMED`
2. **Frontend incluye `reserve_id`** en la venta
3. **Sistema valida automáticamente:**
   - Reserva existe y está confirmada
   - Pertenece al cliente correcto
   - Producto de la reserva se agrega automáticamente

### **Consideraciones importantes:**
- ✅ Solo reservas con estado `CONFIRMED` son válidas
- ✅ El producto de la reserva se agrega automáticamente a la venta
- ✅ El precio se toma del monto de la reserva automáticamente
- ⚠️ Puedes agregar descuentos adicionales al producto de reserva

### **Validación de Reservas:**
```typescript
// Antes de crear la venta, verificar estado de reserva
const validateReserve = async (reserveId: number, clientId: string) => {
  const response = await fetch(`/reserves/${reserveId}`);
  const reserve = await response.json();
  
  if (reserve.status !== 'CONFIRMED') {
    throw new Error('La reserva debe estar confirmada');
  }
  
  if (reserve.client_id !== clientId) {
    throw new Error('La reserva no pertenece al cliente');
  }
  
  return reserve;
};
```

---

## 💰 **MANEJO DE DESCUENTOS**

### **Tipos de Descuentos Soportados:**

#### **1. Descuento por Monto Fijo (`discount_amount`)**
```typescript
const productWithFixedDiscount = {
  product_id: "PROD_001",
  quantity: 1,
  discount_amount: 10000,  // Descuento fijo de 10,000
  discount_reason: "Promoción especial del mes"
};
```

#### **2. Descuento por Porcentaje (`discount_percent`)**
```typescript
const productWithPercentDiscount = {
  product_id: "PROD_001", 
  quantity: 1,
  discount_percent: 15.0,  // 15% de descuento
  discount_reason: "Cliente VIP - descuento del 15%"
};
```

### **Validaciones de Descuentos:**

#### **Frontend Validations (Antes de enviar)**
```typescript
const validateDiscount = (product: ProductDetail, originalPrice: number) => {
  // 1. Si hay descuento, debe haber razón
  if ((product.discount_amount || product.discount_percent) && !product.discount_reason) {
    throw new Error('Se requiere justificación para el descuento');
  }

  // 2. Validar descuento por monto
  if (product.discount_amount) {
    if (product.discount_amount < 0) {
      throw new Error('El descuento no puede ser negativo');
    }
    if (product.discount_amount > originalPrice) {
      throw new Error('El descuento no puede ser mayor al precio original');
    }
  }

  // 3. Validar descuento por porcentaje
  if (product.discount_percent) {
    if (product.discount_percent < 0 || product.discount_percent > 100) {
      throw new Error('El porcentaje debe estar entre 0 y 100');
    }
  }

  // 4. No se pueden combinar ambos tipos de descuento
  if (product.discount_amount && product.discount_percent) {
    throw new Error('No se puede usar descuento fijo y porcentaje simultáneamente');
  }
};
```

### **Cálculo de Precios con Descuentos (Frontend Preview)**
```typescript
const calculateFinalPrice = (originalPrice: number, product: ProductDetail) => {
  let finalPrice = originalPrice;
  
  // Aplicar modificación de precio si existe
  if (product.sale_price) {
    finalPrice = product.sale_price;
  }
  
  // Aplicar descuento
  if (product.discount_amount) {
    finalPrice -= product.discount_amount;
  } else if (product.discount_percent) {
    const discountAmount = finalPrice * (product.discount_percent / 100);
    finalPrice -= discountAmount;
  }
  
  return Math.max(0, finalPrice); // No puede ser negativo
};
```

---

## 📤 **RESPUESTA DEL SERVIDOR**

### **Estructura de Respuesta Exitosa:**
```typescript
interface SaleResponse {
  success: true;
  sale_id: string;
  total_amount: number;
  items_processed: number;
  price_modifications_enabled: boolean;
  has_price_changes: boolean;
  has_discounts: boolean;              // NUEVO
  reserve_processed: boolean;
  reserve_id?: number;
  message: string;
  validation_summary: {
    price_modifications_allowed: boolean;
    price_changes_detected: boolean;
    discounts_applied: boolean;        // NUEVO
    reserve_integration: "enabled" | "disabled";
  };
}
```

### **Ejemplos de Mensajes de Respuesta:**
- ✅ `"Venta procesada exitosamente con reserva y descuentos aplicados"`
- ✅ `"Venta procesada exitosamente con descuentos aplicados"`
- ✅ `"Venta procesada y pagada exitosamente"`

---

## ⚠️ **MANEJO DE ERRORES**

### **Errores Comunes y Soluciones:**

#### **1. Errores de Descuentos**
```json
{
  "error": "DISCOUNT_REASON_REQUIRED: Se requiere justificación para aplicar descuento al producto CANCHA_01"
}
```
**Solución:** Agregar `discount_reason` al producto.

#### **2. Errores de Reservas**
```json
{
  "error": "INVALID_RESERVATION: Reserva 123 no válida para producto CANCHA_01"
}
```
**Solución:** Verificar que la reserva esté confirmada y pertenezca al cliente.

#### **3. Errores de Validación**
```json
{
  "error": "EXCESSIVE_DISCOUNT_AMOUNT: El descuento (15000) no puede ser mayor al precio (10000)"
}
```
**Solución:** Ajustar el monto del descuento.

---

## 🎨 **COMPONENTES FRONTEND RECOMENDADOS**

### **1. Componente de Descuentos**
```typescript
interface DiscountComponentProps {
  originalPrice: number;
  onDiscountChange: (discount: DiscountData) => void;
}

interface DiscountData {
  type: 'amount' | 'percent' | 'none';
  value: number;
  reason: string;
}

const DiscountComponent: React.FC<DiscountComponentProps> = ({ 
  originalPrice, 
  onDiscountChange 
}) => {
  const [discountType, setDiscountType] = useState<'amount' | 'percent' | 'none'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>('');
  
  const calculateFinalPrice = () => {
    if (discountType === 'amount') {
      return Math.max(0, originalPrice - discountValue);
    } else if (discountType === 'percent') {
      return originalPrice * (1 - discountValue / 100);
    }
    return originalPrice;
  };
  
  return (
    <div className="discount-component">
      <div>
        <label>Tipo de descuento:</label>
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
          <option value="none">Sin descuento</option>
          <option value="amount">Monto fijo</option>
          <option value="percent">Porcentaje</option>
        </select>
      </div>
      
      {discountType !== 'none' && (
        <>
          <div>
            <label>Valor del descuento:</label>
            <input 
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              min="0"
              max={discountType === 'percent' ? 100 : originalPrice}
            />
            {discountType === 'percent' && <span>%</span>}
          </div>
          
          <div>
            <label>Razón del descuento:</label>
            <textarea 
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="Explique por qué se aplica este descuento..."
              required
            />
          </div>
          
          <div className="price-preview">
            Precio original: ${originalPrice.toLocaleString()}
            <br />
            Precio final: ${calculateFinalPrice().toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};
```

### **2. Hook para Manejo de Ventas**
```typescript
const useSaleWithDiscounts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createSale = async (saleData: SaleRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      // Validar datos antes de enviar
      validateSaleData(saleData);
      
      const response = await fetch('/sales/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(saleData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating sale');
      }
      
      const result = await response.json();
      return result;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { createSale, loading, error };
};
```

---

## 🔍 **DEBUGGING Y TESTING**

### **Comandos de Testing:**
```bash
# Venta simple
curl -X POST http://localhost:5050/sales/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat test_token.txt)" \
  -d '{
    "client_id": "CLIENT_001",
    "product_details": [{"product_id": "CANCHA-01", "quantity": 1}],
    "allow_price_modifications": false
  }'

# Venta con descuento
curl -X POST http://localhost:5050/sales/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(cat test_token.txt)" \
  -d '{
    "client_id": "CLIENT_001",
    "product_details": [{
      "product_id": "CANCHA-01",
      "quantity": 1,
      "discount_percent": 15.0,
      "discount_reason": "Descuento de prueba"
    }],
    "allow_price_modifications": true
  }'
```

---

## 📊 **METADATA Y AUDITORÍA**

El sistema automáticamente registra en metadata:
- ✅ **Cambios de precio:** Original vs modificado con justificación
- ✅ **Descuentos aplicados:** Tipo, monto, razón, usuario y timestamp
- ✅ **Información de reservas:** Detalles completos de la reserva procesada

Esta información está disponible para reportes y auditorías posteriores.

---

## 🚀 **FLUJO COMPLETO RECOMENDADO**

1. **Seleccionar cliente** → Validar existe
2. **Agregar productos** → Obtener precios originales
3. **Configurar reserva** (si aplica) → Validar estado confirmado
4. **Aplicar descuentos** → Validar rangos y justificaciones
5. **Preview de totales** → Mostrar cálculo final al usuario
6. **Confirmar venta** → Enviar request completo
7. **Procesar respuesta** → Mostrar resultado o errores
8. **Actualizar inventario local** → Refrescar datos si es necesario

---

**🎯 Con esta implementación, el frontend tiene control total sobre reservas, descuentos y modificaciones de precio, con validaciones robustas y manejo completo de errores.**

**Última actualización:** 26 de Septiembre, 2025  
**Versión:** 2.0 - Con soporte completo para descuentos
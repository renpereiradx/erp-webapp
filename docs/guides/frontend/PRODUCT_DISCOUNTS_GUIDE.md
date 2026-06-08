# 🏷️ Guía de Descuentos por Producto - Frontend

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## 📋 **Resumen**

Esta guía explica cómo implementar descuentos por producto en el frontend usando el sistema de modificación de precios existente.

---

## 🎯 **Cómo Funcionan los Descuentos**

Los descuentos se implementan usando el campo `sale_price` en lugar del precio original del producto:

```typescript
interface ProductSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;      // Precio original del producto
  sale_price?: number;     // Precio con descuento aplicado
  price_change_reason?: string; // Justificación del descuento
  unit?: string;
  tax_rate_id?: number;
}
```

---

## 💰 **Tipos de Descuentos Soportados**

### 1. **Descuento Porcentual**
```typescript
// Ejemplo: 15% de descuento
const originalPrice = 10000;
const discountPercentage = 15;
const discountedPrice = originalPrice * (1 - discountPercentage / 100);

const item = {
  product_id: "PROD001",
  quantity: 2,
  unit_price: originalPrice,
  sale_price: discountedPrice, // 8500
  price_change_reason: "Descuento 15% - Promoción cliente frecuente"
};
```

### 2. **Descuento de Monto Fijo**
```typescript
// Ejemplo: 2000 de descuento
const originalPrice = 10000;
const discountAmount = 2000;
const discountedPrice = originalPrice - discountAmount;

const item = {
  product_id: "PROD001",
  quantity: 1,
  unit_price: originalPrice,
  sale_price: discountedPrice, // 8000
  price_change_reason: "Descuento de ₲2,000 - Producto con defecto menor"
};
```

### 3. **Precio Especial**
```typescript
// Ejemplo: Precio especial para mayoristas
const originalPrice = 10000;
const wholesalePrice = 7500;

const item = {
  product_id: "PROD001",
  quantity: 50,
  unit_price: originalPrice,
  sale_price: wholesalePrice, // 7500
  price_change_reason: "Precio mayorista - Compra mayor a 50 unidades"
};
```

---

## 🖥️ **Implementación en Frontend**

### **Componente de Línea de Producto con Descuento**

```typescript
interface ProductLineProps {
  product: Product;
  onQuantityChange: (quantity: number) => void;
  onDiscountApply: (discountType: 'percentage' | 'fixed', value: number, reason: string) => void;
}

const ProductLineComponent: React.FC<ProductLineProps> = ({ 
  product, 
  onQuantityChange, 
  onDiscountApply 
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');

  const originalPrice = product.unit_price;
  const [finalPrice, setFinalPrice] = useState(originalPrice);

  const calculateDiscount = () => {
    let newPrice = originalPrice;
    
    if (discountType === 'percentage') {
      newPrice = originalPrice * (1 - discountValue / 100);
    } else {
      newPrice = originalPrice - discountValue;
    }
    
    return Math.max(newPrice, 0); // No permitir precios negativos
  };

  const applyDiscount = () => {
    const discountedPrice = calculateDiscount();
    setFinalPrice(discountedPrice);
    onDiscountApply(discountType, discountValue, discountReason);
    setShowDiscountModal(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG'
    }).format(price);
  };

  return (
    <div className="product-line">
      <div className="product-info">
        <h4>{product.name}</h4>
        <div className="price-info">
          <span className={finalPrice !== originalPrice ? 'original-price crossed' : 'current-price'}>
            {formatPrice(originalPrice)}
          </span>
          {finalPrice !== originalPrice && (
            <span className="discounted-price">
              {formatPrice(finalPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="quantity-controls">
        <input
          type="number"
          min="0.1"
          step="0.1"
          value={quantity}
          onChange={(e) => {
            const newQuantity = parseFloat(e.target.value);
            setQuantity(newQuantity);
            onQuantityChange(newQuantity);
          }}
        />
      </div>

      <div className="discount-controls">
        <button 
          onClick={() => setShowDiscountModal(true)}
          className="discount-btn"
        >
          🏷️ Aplicar Descuento
        </button>
        
        {finalPrice !== originalPrice && (
          <div className="discount-indicator">
            <span className="discount-label">Descuento aplicado</span>
            <span className="savings">
              Ahorro: {formatPrice(originalPrice - finalPrice)}
            </span>
          </div>
        )}
      </div>

      <div className="line-total">
        <strong>{formatPrice(finalPrice * quantity)}</strong>
      </div>

      {/* Modal de Descuento */}
      {showDiscountModal && (
        <div className="discount-modal">
          <div className="modal-content">
            <h3>Aplicar Descuento</h3>
            
            <div className="discount-type">
              <label>
                <input
                  type="radio"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                />
                Porcentaje (%)
              </label>
              <label>
                <input
                  type="radio"
                  value="fixed"
                  checked={discountType === 'fixed'}
                  onChange={(e) => setDiscountType(e.target.value as 'fixed')}
                />
                Monto Fijo (₲)
              </label>
            </div>

            <div className="discount-value">
              <input
                type="number"
                min="0"
                max={discountType === 'percentage' ? 100 : originalPrice}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder={discountType === 'percentage' ? '15' : '2000'}
              />
              <span>{discountType === 'percentage' ? '%' : '₲'}</span>
            </div>

            <div className="discount-reason">
              <textarea
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="Justificación del descuento (requerido)"
                required
              />
            </div>

            <div className="price-preview">
              <div>Precio original: {formatPrice(originalPrice)}</div>
              <div>Precio con descuento: {formatPrice(calculateDiscount())}</div>
              <div>Ahorro: {formatPrice(originalPrice - calculateDiscount())}</div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowDiscountModal(false)}>
                Cancelar
              </button>
              <button 
                onClick={applyDiscount}
                disabled={!discountReason.trim() || discountValue <= 0}
              >
                Aplicar Descuento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## 📤 **Construcción del Request de Venta**

```typescript
const buildSaleRequest = (cartItems: CartItem[], clientId: string) => {
  const items = cartItems.map(item => {
    const saleItem: any = {
      product_id: item.product_id,
      quantity: item.quantity,
      tax_rate_id: item.tax_rate_id
    };

    // Solo incluir sale_price si hay descuento
    if (item.has_discount) {
      saleItem.sale_price = item.discounted_price;
      saleItem.price_change_reason = item.discount_reason;
    }

    return saleItem;
  });

  return {
    client_id: clientId,
    payment_method_id: 1,
    currency_id: 1,
    allow_price_modifications: true, // IMPORTANTE: Habilitar modificaciones
    product_details: items
  };
};
```

---

## 🎨 **Estilos CSS Recomendados**

```css
.product-line {
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
  gap: 16px;
}

.price-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.original-price.crossed {
  text-decoration: line-through;
  color: #888;
  font-size: 0.9em;
}

.discounted-price {
  color: #e74c3c;
  font-weight: bold;
  font-size: 1.1em;
}

.discount-indicator {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.8em;
}

.discount-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.discount-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 90vw;
}

.price-preview {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 4px;
  margin: 16px 0;
}

.savings {
  color: #28a745;
  font-weight: bold;
}
```

---

## ⚡ **Hook Personalizado para Descuentos**

```typescript
interface UseDiscountProps {
  originalPrice: number;
  onDiscountChange: (finalPrice: number, reason: string) => void;
}

const useDiscount = ({ originalPrice, onDiscountChange }: UseDiscountProps) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [isActive, setIsActive] = useState(false);

  const calculateFinalPrice = useCallback(() => {
    if (!isActive || discountValue <= 0) return originalPrice;
    
    if (discountType === 'percentage') {
      return originalPrice * (1 - discountValue / 100);
    } else {
      return Math.max(originalPrice - discountValue, 0);
    }
  }, [originalPrice, discountType, discountValue, isActive]);

  const applyDiscount = useCallback(() => {
    if (!discountReason.trim()) {
      throw new Error('La justificación del descuento es obligatoria');
    }
    
    const finalPrice = calculateFinalPrice();
    setIsActive(true);
    onDiscountChange(finalPrice, discountReason);
  }, [calculateFinalPrice, discountReason, onDiscountChange]);

  const removeDiscount = useCallback(() => {
    setIsActive(false);
    setDiscountValue(0);
    setDiscountReason('');
    onDiscountChange(originalPrice, '');
  }, [originalPrice, onDiscountChange]);

  const getSavings = useCallback(() => {
    return originalPrice - calculateFinalPrice();
  }, [originalPrice, calculateFinalPrice]);

  const getSavingsPercentage = useCallback(() => {
    const savings = getSavings();
    return (savings / originalPrice) * 100;
  }, [getSavings, originalPrice]);

  return {
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    discountReason,
    setDiscountReason,
    isActive,
    finalPrice: calculateFinalPrice(),
    applyDiscount,
    removeDiscount,
    savings: getSavings(),
    savingsPercentage: getSavingsPercentage(),
    isValidDiscount: discountReason.trim().length > 0 && discountValue > 0
  };
};

// Uso del hook
const ProductLine = ({ product }) => {
  const discount = useDiscount({
    originalPrice: product.unit_price,
    onDiscountChange: (finalPrice, reason) => {
      // Actualizar el estado del carrito
      updateCartItem(product.id, { 
        sale_price: finalPrice,
        price_change_reason: reason,
        has_discount: finalPrice !== product.unit_price
      });
    }
  });

  return (
    <div>
      {/* Componente de línea de producto */}
      <DiscountControls discount={discount} />
    </div>
  );
};
```

---

## 🔄 **Integración con el Carrito de Compras**

```typescript
interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  original_price: number;
  sale_price?: number;
  price_change_reason?: string;
  has_discount: boolean;
  unit?: string;
  tax_rate_id?: number;
}

const useShoppingCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number = 1) => {
    const cartItem: CartItem = {
      product_id: product.id,
      product_name: product.name,
      quantity,
      original_price: product.unit_price,
      has_discount: false,
      tax_rate_id: product.tax_rate_id
    };
    
    setItems(prev => [...prev, cartItem]);
  };

  const applyDiscount = (productId: string, salePrice: number, reason: string) => {
    setItems(prev => prev.map(item => 
      item.product_id === productId
        ? {
            ...item,
            sale_price: salePrice,
            price_change_reason: reason,
            has_discount: salePrice !== item.original_price
          }
        : item
    ));
  };

  const removeDiscount = (productId: string) => {
    setItems(prev => prev.map(item => 
      item.product_id === productId
        ? {
            ...item,
            sale_price: undefined,
            price_change_reason: undefined,
            has_discount: false
          }
        : item
    ));
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const price = item.sale_price || item.original_price;
      return total + (price * item.quantity);
    }, 0);
  };

  const getTotalSavings = () => {
    return items.reduce((savings, item) => {
      if (item.has_discount) {
        const itemSavings = (item.original_price - item.sale_price!) * item.quantity;
        return savings + itemSavings;
      }
      return savings;
    }, 0);
  };

  return {
    items,
    addItem,
    applyDiscount,
    removeDiscount,
    total: getTotal(),
    totalSavings: getTotalSavings(),
    itemsWithDiscount: items.filter(item => item.has_discount).length
  };
};
```

---

## 📋 **Validaciones Requeridas**

### **1. Validaciones de Frontend**
```typescript
const validateDiscount = (originalPrice: number, discountValue: number, discountType: 'percentage' | 'fixed', reason: string) => {
  const errors: string[] = [];

  // Validar justificación
  if (!reason.trim()) {
    errors.push('La justificación del descuento es obligatoria');
  }

  // Validar valor del descuento
  if (discountValue <= 0) {
    errors.push('El valor del descuento debe ser mayor a 0');
  }

  // Validaciones específicas por tipo
  if (discountType === 'percentage') {
    if (discountValue > 100) {
      errors.push('El descuento porcentual no puede ser mayor al 100%');
    }
  } else {
    if (discountValue >= originalPrice) {
      errors.push('El descuento fijo no puede ser mayor o igual al precio original');
    }
  }

  return errors;
};
```

### **2. Validaciones de Backend**
El backend validará automáticamente:
- ✅ `allow_price_modifications` debe estar en `true`
- ✅ `price_change_reason` es obligatorio cuando `sale_price` difiere del precio original
- ✅ `sale_price` debe ser mayor a 0

---

## 🎯 **Casos de Uso Comunes**

### **1. Descuento por Volumen**
```typescript
const applyVolumeDiscount = (quantity: number, originalPrice: number) => {
  let discountPercentage = 0;
  let reason = '';

  if (quantity >= 100) {
    discountPercentage = 15;
    reason = 'Descuento por volumen - Compra mayor a 100 unidades (15%)';
  } else if (quantity >= 50) {
    discountPercentage = 10;
    reason = 'Descuento por volumen - Compra mayor a 50 unidades (10%)';
  } else if (quantity >= 20) {
    discountPercentage = 5;
    reason = 'Descuento por volumen - Compra mayor a 20 unidades (5%)';
  }

  return {
    discountPercentage,
    finalPrice: originalPrice * (1 - discountPercentage / 100),
    reason
  };
};
```

### **2. Descuento por Cliente Frecuente**
```typescript
const applyLoyaltyDiscount = (clientType: 'regular' | 'premium' | 'vip', originalPrice: number) => {
  const discounts = {
    regular: { percentage: 5, reason: 'Descuento cliente frecuente (5%)' },
    premium: { percentage: 10, reason: 'Descuento cliente premium (10%)' },
    vip: { percentage: 15, reason: 'Descuento cliente VIP (15%)' }
  };

  const discount = discounts[clientType];
  return {
    finalPrice: originalPrice * (1 - discount.percentage / 100),
    reason: discount.reason
  };
};
```

### **3. Descuento por Productos Próximos a Vencer**
```typescript
const applyExpirationDiscount = (daysToExpiration: number, originalPrice: number) => {
  let discountPercentage = 0;
  let reason = '';

  if (daysToExpiration <= 1) {
    discountPercentage = 50;
    reason = 'Descuento por vencimiento - Producto vence hoy (50%)';
  } else if (daysToExpiration <= 3) {
    discountPercentage = 30;
    reason = 'Descuento por vencimiento - Producto vence en 3 días (30%)';
  } else if (daysToExpiration <= 7) {
    discountPercentage = 15;
    reason = 'Descuento por vencimiento - Producto vence en una semana (15%)';
  }

  return {
    discountPercentage,
    finalPrice: originalPrice * (1 - discountPercentage / 100),
    reason
  };
};
```

---

## 🚀 **Ejemplo Completo de Integración**

```typescript
// Componente completo de venta con descuentos
const SalesInterface = () => {
  const cart = useShoppingCart();
  const [client, setClient] = useState<Client | null>(null);

  const processOrder = async () => {
    if (!client) {
      alert('Seleccione un cliente');
      return;
    }

    const request = {
      client_id: client.id,
      payment_method_id: 1,
      currency_id: 1,
      allow_price_modifications: true,
      product_details: cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        tax_rate_id: item.tax_rate_id,
        ...(item.has_discount && {
          sale_price: item.sale_price,
          price_change_reason: item.price_change_reason
        })
      }))
    };

    try {
      const response = await fetch('/api/sales/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Venta creada exitosamente. Total: ${formatPrice(result.total_amount)}`);
        // Limpiar carrito
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error al procesar la venta');
    }
  };

  return (
    <div className="sales-interface">
      <ClientSelector onClientSelect={setClient} />
      
      <div className="cart-items">
        {cart.items.map(item => (
          <ProductLineWithDiscount
            key={item.product_id}
            item={item}
            onDiscountApply={(salePrice, reason) => 
              cart.applyDiscount(item.product_id, salePrice, reason)
            }
            onDiscountRemove={() => cart.removeDiscount(item.product_id)}
          />
        ))}
      </div>

      <div className="cart-summary">
        <div>Subtotal: {formatPrice(cart.total + cart.totalSavings)}</div>
        {cart.totalSavings > 0 && (
          <div className="savings">Descuentos: -{formatPrice(cart.totalSavings)}</div>
        )}
        <div className="total">Total: {formatPrice(cart.total)}</div>
        
        <button onClick={processOrder} disabled={cart.items.length === 0}>
          Procesar Venta
        </button>
      </div>
    </div>
  );
};
```

---

## ✅ **Checklist de Implementación**

### **Frontend:**
- [ ] Implementar componente de línea de producto con opción de descuento
- [ ] Crear modal/formulario para aplicar descuentos
- [ ] Validar justificaciones antes de enviar
- [ ] Mostrar precios originales tachados y precios con descuento
- [ ] Calcular y mostrar ahorros totales
- [ ] Incluir `allow_price_modifications: true` en todos los requests

### **UX/UI:**
- [ ] Indicadores visuales claros para productos con descuento
- [ ] Colores diferenciados para precios originales vs con descuento
- [ ] Animaciones suaves para cambios de precio
- [ ] Confirmación antes de aplicar descuentos grandes

### **Validaciones:**
- [ ] Justificación obligatoria para todos los descuentos
- [ ] Limitar descuentos máximos (ej: no más del 50%)
- [ ] Validar permisos del usuario para aplicar descuentos
- [ ] Confirmar descuentos superiores a cierto umbral

---

**¡El sistema está listo para manejar descuentos por producto!** Solo necesitas implementar la interfaz de usuario siguiendo esta guía y usar el sistema de modificación de precios existente.
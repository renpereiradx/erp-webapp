# 📝 RESUMEN EJECUTIVO: Frontend - Ventas con Reservas y Descuentos

## 🎯 ENDPOINT PRINCIPAL
```
POST /sales/orders
Authorization: Bearer {JWT_TOKEN}
```

## 📋 ESTRUCTURA DE DATOS

### Request Base:
```json
{
  "client_id": "CLIENT_001",                    // OBLIGATORIO
  "reserve_id": 123,                           // OPCIONAL - Para servicios
  "product_details": [...],                    // OBLIGATORIO
  "payment_method_id": 1,                      // OPCIONAL
  "currency_id": 1,                            // OPCIONAL  
  "allow_price_modifications": true            // OBLIGATORIO
}
```

### Producto con Descuentos:
```json
{
  "product_id": "SERVICE_001",                 // OBLIGATORIO
  "quantity": 1,                               // OBLIGATORIO
  
  // DESCUENTOS (Elegir UNO)
  "discount_amount": 15000,                    // Monto fijo
  "discount_percent": 20.0,                    // Porcentaje (0-100)
  "discount_reason": "Cliente frecuente",      // OBLIGATORIO si hay descuento
  
  // MODIFICACIÓN DE PRECIO
  "sale_price": 45000,                         // Precio personalizado
  "price_change_reason": "Precio negociado"    // OBLIGATORIO si sale_price
}
```

## 🔄 MANEJO DE RESERVAS

### Reservas Automáticas:
- ✅ Solo reservas con estado `CONFIRMED`
- ✅ El producto de reserva se agrega automáticamente
- ✅ Precio tomado del monto de reserva
- ✅ Puedes aplicar descuentos adicionales

### Ejemplo Reserva + Descuento:
```json
{
  "client_id": "CLIENT_001",
  "reserve_id": 456,
  "product_details": [
    {
      "product_id": "CANCHA_01",      // Se agrega automáticamente por la reserva
      "quantity": 1,
      "discount_percent": 15.0,
      "discount_reason": "Promoción especial"
    }
  ],
  "allow_price_modifications": true
}
```

## 💰 TIPOS DE DESCUENTOS

### 1. Descuento por Monto Fijo:
```json
{
  "discount_amount": 10000,
  "discount_reason": "Descuento de temporada"
}
```

### 2. Descuento por Porcentaje:
```json
{
  "discount_percent": 15.0,
  "discount_reason": "Cliente VIP"
}
```

## ⚠️ VALIDACIONES CRÍTICAS

### Frontend debe validar ANTES de enviar:
1. **Descuento requiere justificación** - `discount_reason` obligatorio
2. **Solo un tipo de descuento** - No mezclar amount y percent
3. **Rangos válidos:**
   - `discount_amount`: >= 0 y <= precio_original
   - `discount_percent`: 0-100
4. **Reservas confirmadas** - Estado `CONFIRMED` únicamente

### Validación TypeScript:
```typescript
const validateProduct = (product: ProductDetail, originalPrice: number) => {
  // 1. Descuento requiere razón
  if ((product.discount_amount || product.discount_percent) && !product.discount_reason) {
    throw new Error('Razón de descuento requerida');
  }
  
  // 2. Validar rangos
  if (product.discount_amount && product.discount_amount > originalPrice) {
    throw new Error('Descuento excede el precio');
  }
  
  if (product.discount_percent && (product.discount_percent < 0 || product.discount_percent > 100)) {
    throw new Error('Porcentaje debe estar entre 0-100');
  }
};
```

## 📤 RESPUESTA DEL SERVIDOR

### Exitosa:
```json
{
  "success": true,
  "sale_id": "SALE_123",
  "total_amount": 85000,
  "has_discounts": true,           // NUEVO
  "reserve_processed": true,
  "message": "Venta procesada exitosamente con reserva y descuentos aplicados"
}
```

### Error:
```json
{
  "error": "DISCOUNT_REASON_REQUIRED: Se requiere justificación para aplicar descuento al producto CANCHA_01"
}
```

## 🎯 CASOS DE USO PRINCIPALES

### Caso 1: Venta Simple
```json
{
  "client_id": "CLIENT_001",
  "product_details": [{"product_id": "PROD_001", "quantity": 1}],
  "allow_price_modifications": false
}
```

### Caso 2: Reserva con Descuento
```json
{
  "client_id": "CLIENT_001",
  "reserve_id": 123,
  "product_details": [{
    "product_id": "CANCHA_01",
    "quantity": 1,
    "discount_percent": 20.0,
    "discount_reason": "Promoción fin de semana"
  }],
  "allow_price_modifications": true
}
```

### Caso 3: Múltiples Servicios con Descuentos
```json
{
  "client_id": "CLIENT_001",
  "product_details": [
    {
      "product_id": "SERVICE_001",
      "quantity": 1,
      "discount_amount": 10000,
      "discount_reason": "Descuento por combo"
    },
    {
      "product_id": "SERVICE_002", 
      "quantity": 1,
      "discount_percent": 15.0,
      "discount_reason": "Cliente frecuente"
    }
  ],
  "allow_price_modifications": true
}
```

## 🔧 IMPLEMENTACIÓN FRONTEND

### Hook Recomendado:
```typescript
const useSaleWithDiscounts = () => {
  const createSale = async (saleData: SaleRequest) => {
    // Validar datos
    validateSaleData(saleData);
    
    // Enviar request
    const response = await fetch('/sales/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(saleData)
    });
    
    return await response.json();
  };
  
  return { createSale };
};
```

### Componente de Descuento:
```typescript
const DiscountComponent = ({ originalPrice, onChange }) => {
  const [type, setType] = useState('none');
  const [value, setValue] = useState(0);
  const [reason, setReason] = useState('');
  
  const finalPrice = calculateFinalPrice(originalPrice, type, value);
  
  return (
    <div>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="none">Sin descuento</option>
        <option value="amount">Monto fijo</option>
        <option value="percent">Porcentaje</option>
      </select>
      
      {type !== 'none' && (
        <>
          <input 
            type="number" 
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
          />
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Razón del descuento..."
          />
          <div>Precio final: ${finalPrice.toLocaleString()}</div>
        </>
      )}
    </div>
  );
};
```

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Antes de enviar la venta:
- [ ] Cliente seleccionado y validado
- [ ] Productos agregados con cantidades
- [ ] Si hay reserva: verificar estado `CONFIRMED`
- [ ] Si hay descuentos: validar rangos y justificaciones
- [ ] Preview de totales mostrado al usuario
- [ ] Token JWT válido en headers

### Después de la respuesta:
- [ ] Manejar respuesta exitosa
- [ ] Mostrar errores específicos al usuario
- [ ] Actualizar inventario local si es necesario
- [ ] Registrar transacción para auditoría

---

**🎯 RESULTADO: Sistema completo de ventas con soporte nativo para reservas y descuentos flexibles con validación robusta.**
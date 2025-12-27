# Guía de Integración Frontend - Precios en Compras

**Versión:** 1.0
**Fecha:** 26 de Diciembre de 2025

---

## Resumen

Esta guía explica cómo el frontend debe manejar los precios de venta al registrar compras, incluyendo el nuevo soporte para **precio explícito**.

---

## 1. Modos de Precio

El sistema soporta dos modos de definición de precio de venta:

| Modo | Descripción | Cuándo usar |
|------|-------------|-------------|
| **Margen automático** | Backend calcula: `costo × (1 + margen%)` | Usuario define solo el margen |
| **Precio explícito** | Backend usa el precio enviado directamente | Usuario define el precio final |

---

## 2. Estructura del Request

### 2.1 Campo Nuevo: `explicit_sale_price`

```typescript
interface PurchaseOrderDetail {
  product_id: string;
  quantity: number;
  unit_price: number;        // Costo de compra
  unit: string;
  profit_pct?: number;       // Margen porcentual (opcional si hay explicit)
  explicit_sale_price?: number;  // NUEVO: Precio de venta explícito
  tax_rate_id?: number;
}
```

### 2.2 Reglas de Prioridad

```
SI explicit_sale_price está presente:
    → Backend usa ese precio (redondeado)
    → profit_pct es ignorado para cálculo (solo informativo)
SINO:
    → Backend calcula: ROUND(costo × (1 + profit_pct/100))
```

---

## 3. Ejemplos de Uso

### 3.1 Modo "Margen Automático"

Usuario selecciona margen de 25%:

```json
{
  "product_id": "ABC123",
  "quantity": 5,
  "unit_price": 56850,
  "unit": "unit",
  "profit_pct": 25.0
}
```

**Resultado:** Backend calcula `ROUND(56850 × 1.25) = 71063`

### 3.2 Modo "Precio Explícito"

Usuario quiere precio de venta = 90,000:

```json
{
  "product_id": "Cc2y5JnvR",
  "quantity": 5,
  "unit_price": 56850,
  "unit": "unit",
  "profit_pct": 58.31,
  "explicit_sale_price": 90000
}
```

**Resultado:** Backend usa `90000` directamente (no recalcula)

---

## 4. Validaciones Frontend

### 4.1 Precios Deben Ser Enteros (PYG)

```typescript
function validateAndRoundPrice(price: number): number {
  const rounded = Math.round(price);

  if (price !== rounded) {
    console.warn(`Precio ${price} redondeado a ${rounded}`);
    // Opcional: mostrar notificación al usuario
  }

  return rounded;
}
```

### 4.2 Lógica de Construcción

```typescript
function buildOrderDetail(item: CartItem): PurchaseOrderDetail {
  const detail: PurchaseOrderDetail = {
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.costPrice,
    unit: item.unit,
  };

  if (item.pricingMode === 'explicit') {
    // Usuario definió precio de venta explícito
    detail.explicit_sale_price = validateAndRoundPrice(item.salePrice);
    // profit_pct es opcional pero útil para mostrar en UI
    detail.profit_pct = calculateMargin(item.costPrice, detail.explicit_sale_price);
  } else {
    // Modo margen: solo enviar el porcentaje
    detail.profit_pct = item.profitMargin;
    // NO enviar explicit_sale_price
  }

  return detail;
}

function calculateMargin(cost: number, salePrice: number): number {
  if (cost === 0) return 0;
  return Math.round(((salePrice - cost) / cost) * 100 * 100) / 100; // 2 decimales
}
```

---

## 5. UI/UX Recomendado

### 5.1 Selector de Modo

```
┌─────────────────────────────────────────────────────────┐
│  Definir precio de venta                                │
│                                                         │
│  ○ Calcular desde margen                                │
│     Margen: [____25____] %                              │
│     Precio calculado: 71,063 Gs.                        │
│                                                         │
│  ● Precio explícito                                     │
│     Precio de venta: [__90,000__] Gs.                   │
│     Margen resultante: 58.31%                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Indicador de Redondeo

Cuando el usuario ingresa un precio con decimales:

```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ El precio 89,999.50 se redondeará a 90,000 Gs.     │
│     (Los precios en guaraníes deben ser enteros)        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Manejo de Respuestas

### 6.1 Respuesta Exitosa

```json
{
  "success": true,
  "purchase_order_id": 15,
  "prices_updated": 3,
  "details": {
    "items": [
      {
        "product_id": "Cc2y5JnvR",
        "cost": 56850,
        "final_price": 90000,
        "margin_percent": 58.31,
        "price_source": "explicit"
      }
    ]
  }
}
```

### 6.2 Campos de Interés

| Campo | Descripción |
|-------|-------------|
| `final_price` | Precio final almacenado (siempre entero) |
| `margin_percent` | Margen real calculado |
| `price_source` | `"explicit"` o `"calculated"` |

---

## 7. Errores Comunes

### Error 1: Precio con decimales no enteros

```json
// ❌ Incorrecto
{ "explicit_sale_price": 89999.24 }

// ✓ Correcto (frontend debe redondear antes de enviar)
{ "explicit_sale_price": 90000 }
```

### Error 2: Enviar ambos sin explicit_sale_price

```json
// ⚠️ profit_pct será usado para calcular
{
  "profit_pct": 25.0
  // Sin explicit_sale_price → calcula desde margen
}
```

### Error 3: Margen inconsistente con precio explícito

```json
// ⚠️ Esto está bien - el backend ignora profit_pct cuando hay explicit
{
  "profit_pct": 10.0,
  "explicit_sale_price": 90000
  // Backend usa 90000, ignora el 10%
}
```

---

## 8. Resumen de Cambios

### Antes (problema)

```javascript
// Frontend calculaba margen desde precio
const margin = ((salePrice - cost) / cost) * 100;  // 58.3069...
const roundedMargin = Math.round(margin * 100) / 100;  // 58.31

// Backend recalculaba precio
const recalculatedPrice = cost * (1 + roundedMargin / 100);  // 89999.24 ❌
```

### Después (solución)

```javascript
// Frontend envía precio explícito directamente
const detail = {
  unit_price: cost,
  explicit_sale_price: Math.round(salePrice),  // 90000 ✓
  profit_pct: margin  // Solo para referencia
};
```

---

## 9. Checklist de Implementación

- [ ] Agregar campo `explicit_sale_price` al modelo de detalle
- [ ] Implementar selector de modo (margen vs explícito)
- [ ] Validar y redondear precios a enteros
- [ ] Enviar `explicit_sale_price` cuando usuario define precio
- [ ] Mostrar advertencia si precio tiene decimales
- [ ] Actualizar formulario de compra con nuevo campo

---

## 10. Contacto

Para dudas sobre la integración, contactar al equipo backend.

---

**Última actualización:** 26 de Diciembre de 2025
**Versión:** 1.0

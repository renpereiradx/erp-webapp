# Guía de Integración Frontend - Pricing en Compras (actual)

**Versión:** 1.1
**Fecha:** 22 de Marzo de 2026
**Estado:** Vigente con la API actual

---

## Resumen

Esta guía define el flujo actual para calcular precio de venta desde compras y cómo cargar datos de producto en frontend.

Principio clave:

- El frontend muestra preview.
- El backend calcula y persiste (fuente de verdad).

---

## 1. Endpoints que debe usar frontend

Para cargar producto en pantallas de compra/venta:

- `GET /products/{id}/purchase` (flujo de compra)
- `GET /products/{id}/sale` (flujo de venta)
- `GET /products/{id}/info` (detalle general)
- `GET /products/info/barcode/{barcode}`
- `GET /products/info/search/{name}`

Para registrar compra completa:

- `POST /purchase/complete`

---

## 2. Payload soportado hoy en `POST /purchase/complete`

```typescript
interface ProcessCompletePurchaseOrderDetail {
  product_id: string;
  quantity: number;          // > 0
  unit_price: number;        // costo de compra > 0
  unit?: string;             // default backend: "unit"
  profit_pct?: number;       // modo margen automatico
  explicit_sale_price?: number; // modo precio explicito (prioridad)
  tax_rate_id?: number;      // override opcional de IVA
}
```

Campos a nivel request:

- `supplier_id`, `status`, `order_details`
- opcionales: `payment_method_id`, `currency_id`, `auto_update_prices`, `default_profit_margin`, `metadata`

---

## 3. Reglas de cálculo de precio (implementación actual)

### 3.1 Modo precio explícito

Si viene `explicit_sale_price`:

- backend usa ese valor como precio de venta final
- `profit_pct` queda solo como dato de referencia UI

### 3.2 Modo margen automático

Si no viene `explicit_sale_price`:

- backend calcula `sale_price = ROUND(unit_price * (1 + profit_pct/100))`
- si no viene `profit_pct`, usa `default_profit_margin` o default del sistema

### 3.3 Quién calcula el margen

- frontend puede calcular margen para mostrar
- backend recalcula y persiste margen/precio final

---

## 4. IVA en compras (actual)

### 4.1 Resolución de tasa

Si no se envía `tax_rate_id`, backend resuelve por jerarquía fiscal (producto/clasificación/categoría/default).

### 4.2 Cálculo fiscal

La API actual discrimina y guarda desglose fiscal por línea en detalles de compra:

- `unit_price_with_tax`
- `unit_price_without_tax`
- `tax_amount`
- `total_line_with_tax`
- `applied_tax_rate`
- `tax_resolution_source`

### 4.3 Dónde ver el desglose

Consultar `GET /purchase/{id}` o endpoints enriquecidos de compra para ver el detalle por ítem.

---

## 5. Ejemplos de request

### 5.1 Margen automático

```json
{
  "supplier_id": 13,
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "PROD_BANANA_001",
      "quantity": 50,
      "unit_price": 2500,
      "unit": "kg",
      "profit_pct": 35
    }
  ],
  "auto_update_prices": true,
  "default_profit_margin": 30
}
```

### 5.2 Precio explícito

```json
{
  "supplier_id": 13,
  "status": "COMPLETED",
  "order_details": [
    {
      "product_id": "FL8K0xxRzjX0VAND78u842kzKcM",
      "quantity": 20,
      "unit_price": 5000,
      "unit": "unit",
      "explicit_sale_price": 9000,
      "tax_rate_id": 5
    }
  ]
}
```

---

## 6. Respuesta y warnings

`POST /purchase/complete` devuelve, entre otros:

- `success`
- `purchase_order_id`
- `total_amount`
- `items_processed`
- `cost_entries_created`
- `prices_updated`
- `message`
- `warnings` (cuando aplica, por ejemplo discrepancias fiscales)

---

## 7. Recomendaciones frontend

1. Redondear montos para PYG en UI antes de enviar.
2. Usar `explicit_sale_price` solo cuando usuario fija precio final manual.
3. No confiar en cálculo local para persistencia; usar siempre respuesta backend.
4. Mostrar en UI la tasa y fuente fiscal (`applied_tax_rate`, `tax_resolution_source`) al confirmar compra.
5. Para nuevos desarrollos, usar exclusivamente rutas `info`, `sale`, `purchase`.

---

## 8. Checklist de implementación

- [ ] Soportar selector de modo: margen vs explícito
- [ ] Enviar `explicit_sale_price` solo en modo explícito
- [ ] Enviar `profit_pct` en modo margen
- [ ] Consumir `GET /products/{id}/purchase` para precarga de formulario
- [ ] Mostrar desglose fiscal de backend al confirmar
- [ ] Manejar `warnings` en respuesta de compra

---

## 9. Referencias

- `docs/guides/frontend/PURCHASE_ORDERS_API_GUIDE.md`
- `docs/guides/frontend/PRODUCT_API_GUIDE.md`
- `docs/guides/frontend/SALES_API_GUIDE.md`

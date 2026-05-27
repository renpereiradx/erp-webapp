# Guía de API de Balanzas y Pesaje para Frontend

**Versión:** 1.0.0  
**Fecha:** 27 de Mayo de 2026  
**Endpoint Base:** `http://localhost:5050`

## Permisos del Módulo

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET | `products:read` |
| POST / PUT / DELETE | `products:write` |

---

## Pesaje y Etiquetas

### POST /scale/weigh-item
**Descripción:** Pesa un producto de medida variable y devuelve información completa para generar etiqueta. Valida que el producto tenga `is_variable_measure=true`. Calcula subtotal, IVA y puede generar barcode si el producto tiene `scale_code`.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| weight | float | Sí | Peso/cantidad medida (> 0) |
| unit | string | No | Unidad de medida. Default: `base_unit` del producto |
| branch_id | int | No | ID de sucursal |

#### Response 200 — WeighItemResponse
| Campo | Tipo | Descripción |
|-------|------|-------------|
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| scale_code | string | Código de balanza (vacío si no tiene) |
| quantity | decimal | Cantidad pesada |
| unit | string | Unidad de medida |
| price_per_unit | decimal | Precio por unidad |
| subtotal | decimal | Subtotal sin IVA |
| subtotal_with_tax | decimal | Subtotal con IVA |
| tax_amount | decimal | Monto del IVA |
| tax_rate | decimal | Tasa de IVA (%) |
| tax_code | string | Código de la tasa (IVA10, IVA5, EXENTO) |
| barcode | string | Barcode EAN-13 generado (vacío si no tiene scale_code) |
| label_data | object\|null | Datos de etiqueta para impresión |

#### Ejemplo
```json
{
  "product_id": "TOM_KG",
  "product_name": "Tomate por Kg",
  "scale_code": "0001",
  "quantity": "1.97",
  "unit": "kg",
  "price_per_unit": "12500",
  "subtotal": "22386.36",
  "subtotal_with_tax": "24625",
  "tax_amount": "2238.64",
  "tax_rate": "10",
  "tax_code": "IVA10",
  "barcode": "2000010024625",
  "label_data": null
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `product_id` vacío, `weight` <= 0, producto no es de medida variable, o producto no encontrado |
| 401 | Token ausente o inválido |
| 403 | `branch_id` fuera de `allowed_branches` |
| 500 | Error interno |

---

### POST /scale/generate-label
**Descripción:** Genera datos de etiqueta para impresión de balanza (nombre, peso, precio, fecha). No incluye barcode — usar `/barcode/generate` para eso.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| product_id | string | Sí | ID del producto |
| weight | float | Sí | Peso/cantidad |
| total_price | decimal | Sí | Precio total |
| format_id | int | Sí | ID del formato de etiqueta |

#### Response 200 — LabelData
| Campo | Tipo | Descripción |
|-------|------|-------------|
| product_name | string | Nombre del producto |
| weight | decimal | Peso/cantidad |
| unit | string | Unidad de medida |
| price_per_unit | decimal | Precio por unidad (0 si no disponible) |
| total_price | decimal | Precio total |
| barcode | string | Vacío (se genera aparte con /barcode/generate) |
| date | string | Fecha actual (YYYY-MM-DD) |
| template | string | Plantilla ZPL/ESC-POS del formato |

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `product_id` vacío, `total_price` inválido, o producto/formato no encontrado |
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

### GET /scale/catalog
**Descripción:** Obtiene el catálogo completo de productos de medida variable para sincronizar con balanzas electrónicas.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| X-Branch-ID | Condicional | Si no se envía `?branch_id` |

#### Response 200
| Campo | Tipo | Descripción |
|-------|------|-------------|
| count | int | Cantidad de items |
| data | array | Lista de `ScaleCatalogItem` |

**ScaleCatalogItem:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| scale_code | string | Código de balanza (vacío si no tiene) |
| product_id | string | ID del producto |
| product_name | string | Nombre del producto |
| price_per_unit | decimal | Precio por unidad actual |
| unit | string | Unidad del precio |
| base_unit | string | Unidad base del producto |
| is_variable_measure | bool | Siempre `true` |

#### Errores
| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

## CRUD Balanzas

### GET /scales
Lista todas las balanzas configuradas. Filtrable por sucursal vía `?branch_id`.

#### Response 200
```json
{
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "Balanza Caja 1",
      "location": "Caja Principal",
      "ip_address": "192.168.1.50",
      "port": 9100,
      "protocol": "TCP",
      "model": "Dibal D-700",
      "branch_id": 1,
      "is_connected": false,
      "is_active": true,
      "label_format_id": 1,
      "last_sync_at": null,
      "sync_status": "PENDING",
      "created_at": "2026-05-27T10:00:00Z",
      "updated_at": "2026-05-27T10:00:00Z"
    }
  ]
}
```

### POST /scales
Crea una nueva balanza.

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre descriptivo |
| location | string | No | Ubicación física |
| ip_address | string | No | Dirección IP |
| port | int | No | Puerto (default: 9100) |
| protocol | string | No | `TCP`, `RS232`, `USB` (default: `TCP`) |
| model | string | No | Modelo de balanza |
| branch_id | int | No | Sucursal. Default: sucursal activa del token |
| is_active | bool | No | Default: `true` |
| label_format_id | int | No | ID del formato de etiqueta |

### GET /scales/{id}
Obtiene una balanza por ID.

### PUT /scales/{id}
Actualiza una balanza existente. Mismos campos que POST.

### DELETE /scales/{id}
Elimina una balanza.

---

## CRUD Formatos de Etiqueta

### GET /label-formats
Lista todos los formatos de etiqueta configurados.

#### Response 200
```json
{
  "count": 1,
  "data": [
    {
      "id": 1,
      "name": "EAN-13 Precio Variable (Default)",
      "barcode_type": "EAN13_VARIABLE_PRICE",
      "prefix": "20",
      "scale_code_digits": 4,
      "value_digits": 5,
      "label_width_mm": 58,
      "label_height_mm": 40,
      "includes_product_name": true,
      "includes_weight": true,
      "includes_unit_price": true,
      "includes_total_price": true,
      "includes_date": true,
      "template": "",
      "created_at": "2026-05-27T10:00:00Z",
      "updated_at": "2026-05-27T10:00:00Z"
    }
  ]
}
```

### POST /label-formats
Crea un nuevo formato de etiqueta.

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre descriptivo |
| barcode_type | string | No | `EAN13_VARIABLE_PRICE`, `EAN13_VARIABLE_WEIGHT`, `CODE128` |
| prefix | string | No | Prefijo EAN-13 de 2 dígitos (default: `20`) |
| scale_code_digits | int | No | Dígitos del código de balanza (default: 4) |
| value_digits | int | No | Dígitos del valor (default: 5) |
| label_width_mm | int | No | Ancho en mm |
| label_height_mm | int | No | Alto en mm |
| includes_product_name | bool | No | Incluir nombre del producto |
| includes_weight | bool | No | Incluir peso |
| includes_unit_price | bool | No | Incluir precio unitario |
| includes_total_price | bool | No | Incluir precio total |
| includes_date | bool | No | Incluir fecha |
| template | string | No | Plantilla ZPL o ESC/POS |

### GET /label-formats/{id}
Obtiene un formato por ID.

### PUT /label-formats/{id}
Actualiza un formato existente.

### DELETE /label-formats/{id}
Elimina un formato de etiqueta.

---

## Barcodes Soportados

| Tipo | Prefijo | Descripción |
|------|---------|-------------|
| `EAN13_VARIABLE_PRICE` | 20-29 | Precio total embebido. El valor es el precio en guaraníes (sin IVA). |
| `EAN13_VARIABLE_WEIGHT` | 20-29 | Peso embebido. El valor es el peso (ej: 197 para 1.97 kg). |
| `STANDARD` | Cualquier otro | Barcode estándar de producto (buscado en `products.barcode`). |

---

## Flujo Típico de Pesaje en POS

```
1. Balanza pesa el producto (hardware externo)
2. POST /scale/weigh-item  → obtiene precio, IVA, barcode
3. Balanza imprime etiqueta con barcode (hardware externo)
4. Cajera escanea etiqueta en caja:
   POST /sales/scan  → decodifica barcode, obtiene producto + precio
5. Frontend agrega el producto a la venta actual
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/scale/weigh-item` | Pesar producto |
| POST | `/scale/generate-label` | Generar datos de etiqueta |
| GET | `/scale/catalog` | Catálogo de productos de medida variable |
| GET | `/scales` | Listar balanzas |
| POST | `/scales` | Crear balanza |
| GET | `/scales/{id}` | Obtener balanza |
| PUT | `/scales/{id}` | Actualizar balanza |
| DELETE | `/scales/{id}` | Eliminar balanza |
| GET | `/label-formats` | Listar formatos de etiqueta |
| POST | `/label-formats` | Crear formato |
| GET | `/label-formats/{id}` | Obtener formato |
| PUT | `/label-formats/{id}` | Actualizar formato |
| DELETE | `/label-formats/{id}` | Eliminar formato |

---

*Última actualización: 2026-05-27 — Fase 4 Milestone B: endpoints de balanzas, pesaje y formatos.*

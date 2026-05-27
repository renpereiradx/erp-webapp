# API de Conversiones de Unidad

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 1.0.0
**Fecha:** 26 de Mayo de 2026
**Endpoint Base:** `http://localhost:5050`

## Permisos del Módulo

> **Nota:** Los endpoints de conversiones de unidad están protegidos por middleware de permisos del módulo de productos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET | `products:read` |
| POST / DELETE | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.

## Historial de Cambios

### v1.0.0 - 26 de Mayo de 2026
- **NUEVO**: API de conversiones de unidad creada como parte de FASE 1 del plan de productos de medida variable.
- **NUEVO**: Endpoints para listar, crear/actualizar y eliminar factores de conversión entre unidades.

---

## Descripción General

Las conversiones de unidad permiten al sistema convertir cantidades entre diferentes unidades de medida (kg ↔ g, L ↔ ml, m² ↔ sqft, etc.). Los factores de conversión se almacenan en la tabla `products.unit_conversions` y son extensibles vía API sin necesidad de migraciones de base de datos.

### Casos de Uso

- **Productos de medida variable:** Un producto con `base_unit='kg'` puede tener precio en 'g'. El sistema usa la conversión para calcular el precio correcto.
- **Flexibilidad:** Los administradores pueden agregar nuevos factores de conversión según necesidades del negocio.
- **Conversión automática:** La función SQL `products.convert_units(quantity, from_unit, to_unit)` usa estos factores.

---

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Estructuras de Datos

### UnitConversion

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `from_unit` | string | Unidad de origen (ej: `kg`, `g`, `l`) |
| `to_unit` | string | Unidad de destino (ej: `g`, `kg`, `ml`) |
| `factor` | string | Factor de conversión como decimal (ej: "1000", "0.001") |
| `created_at` | string | Fecha de creacion (ISO 8601) |
| `updated_at` | string | Fecha de ultima actualizacion (ISO 8601) |

> **Nota:** El campo `factor` es `string` porque usa `decimal.Decimal` en Go para evitar errores de redondeo.

### Ejemplo de Conversión

Si `from_unit='kg'`, `to_unit='g'`, `factor='1000'`:
- `convert_units(2.5, 'kg', 'g')` = 2.5 × 1000 = 2500 g

Si no existe el factor directo, el sistema intenta el inverso:
- Si existe `kg → g` con factor 1000, entonces `g → kg` usa factor 1/1000 = 0.001

---

## Endpoints

### 1. Listar Conversiones

**`GET /unit-conversions`**

Retorna todos los factores de conversión registrados.

**Response (200 OK):**
```json
{
  "count": 24,
  "data": [
    {
      "from_unit": "kg",
      "to_unit": "g",
      "factor": "1000",
      "created_at": "2026-05-26T10:00:00-03:00",
      "updated_at": "2026-05-26T10:00:00-03:00"
    },
    {
      "from_unit": "kg",
      "to_unit": "lb",
      "factor": "2.20462",
      "created_at": "2026-05-26T10:00:00-03:00",
      "updated_at": "2026-05-26T10:00:00-03:00"
    }
  ]
}
```

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 401 | Token JWT invalido o ausente |
| 403 | Sin permiso `products:read` |
| 500 | Error interno |

---

### 2. Crear o Actualizar Conversión

**`POST /unit-conversions`**

Crea un nuevo factor de conversión o actualiza uno existente (UPSERT por `from_unit` + `to_unit`).

**Request Body:**
```json
{
  "from_unit": "kg",
  "to_unit": "oz",
  "factor": "35.274"
}
```

**Parametros:**

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `from_unit` | string | Si | Unidad de origen (se normaliza a minúsculas) |
| `to_unit` | string | Si | Unidad de destino (se normaliza a minúsculas) |
| `factor` | string | Si | Factor de conversión (debe ser > 0) |

**Validaciones:**
- `from_unit` y `to_unit` no pueden estar vacíos
- `from_unit` y `to_unit` deben ser diferentes
- `factor` debe ser mayor que cero

**Response (201 Created):**
```json
{
  "from_unit": "kg",
  "to_unit": "oz",
  "factor": "35.274",
  "created_at": "2026-05-26T15:30:00-03:00",
  "updated_at": "2026-05-26T15:30:00-03:00"
}
```

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 400 | Datos invalidos, factor <= 0, from_unit = to_unit |
| 401 | Token JWT invalido o ausente |
| 403 | Sin permiso `products:write` |
| 500 | Error interno |

---

### 3. Eliminar Conversión

**`DELETE /unit-conversions/{from_unit}/{to_unit}`**

Elimina un factor de conversión específico.

**Ejemplo:**
```
DELETE /unit-conversions/kg/oz
```

**Response (200 OK):**
```json
{
  "message": "Unit conversion deleted successfully"
}
```

**Errores:**

| HTTP Status | Descripcion |
|-------------|-------------|
| 400 | Conversion no encontrada |
| 401 | Token JWT invalido o ausente |
| 403 | Sin permiso `products:write` |
| 500 | Error interno |

---

## Unidades Soportadas

El sistema soporta las siguientes unidades (definidas en CHECK constraints de la base de datos):

### Básicas
| Unidad | Descripcion |
|--------|-------------|
| `unit` | Unidad individual |
| `pair` | Par |
| `set` | Conjunto/Set |

### Peso
| Unidad | Descripcion |
|--------|-------------|
| `kg` | Kilogramo |
| `g` | Gramo |
| `lb` | Libra |
| `oz` | Onza |
| `ton` | Tonelada |

### Volumen
| Unidad | Descripcion |
|--------|-------------|
| `l` | Litro |
| `ml` | Mililitro |
| `gal` | Galón |

### Empaque
| Unidad | Descripcion |
|--------|-------------|
| `box` | Caja |
| `pack` | Paquete |
| `bag` | Bolsa |
| `case` | Cajón/Cartón |
| `dozen` | Docena |
| `bundle` | Atado |

### Longitud/Área
| Unidad | Descripcion |
|--------|-------------|
| `meter` | Metro |
| `cm` | Centímetro |
| `sqm` | Metro cuadrado |
| `sqft` | Pie cuadrado |
| `roll` | Rollo |

### Servicios
| Unidad | Descripcion |
|--------|-------------|
| `hour` | Hora |
| `day` | Día |
| `month` | Mes |

### Especiales Supermercado
| Unidad | Descripcion |
|--------|-------------|
| `tray` | Bandeja |
| `bottle` | Botella |
| `can` | Lata |
| `jar` | Frasco |
| `carton` | Tetrapack |
| `stick` | Barra |
| `slice` | Rodaja/Rebanada |
| `portion` | Porción |

---

## Factores de Conversión Pre-cargados

El sistema incluye los siguientes factores de conversión por defecto:

| From | To | Factor | Descripción |
|------|-----|--------|-------------|
| `kg` | `g` | 1000 | 1 kg = 1000 g |
| `kg` | `lb` | 2.20462 | 1 kg ≈ 2.2 lb |
| `kg` | `oz` | 35.274 | 1 kg ≈ 35.27 oz |
| `kg` | `ton` | 0.001 | 1 kg = 0.001 ton |
| `g` | `kg` | 0.001 | 1 g = 0.001 kg |
| `lb` | `kg` | 0.453592 | 1 lb ≈ 0.45 kg |
| `oz` | `kg` | 0.0283495 | 1 oz ≈ 0.028 kg |
| `ton` | `kg` | 1000 | 1 ton = 1000 kg |
| `l` | `ml` | 1000 | 1 L = 1000 ml |
| `l` | `gal` | 0.264172 | 1 L ≈ 0.26 gal |
| `ml` | `l` | 0.001 | 1 ml = 0.001 L |
| `gal` | `l` | 3.78541 | 1 gal ≈ 3.79 L |
| `meter` | `cm` | 100 | 1 m = 100 cm |
| `cm` | `meter` | 0.01 | 1 cm = 0.01 m |
| `sqm` | `sqft` | 10.7639 | 1 m² ≈ 10.76 sqft |
| `sqft` | `sqm` | 0.092903 | 1 sqft ≈ 0.093 m² |
| `pair` | `unit` | 2 | 1 par = 2 unidades |
| `dozen` | `unit` | 12 | 1 docena = 12 unidades |
| `unit` | `pair` | 0.5 | 1 unidad = 0.5 par |
| `unit` | `dozen` | 0.08333333 | 1 unidad ≈ 0.083 docena |
| `day` | `hour` | 24 | 1 día = 24 horas |
| `month` | `hour` | 720 | 1 mes = 720 horas |
| `hour` | `day` | 0.04166667 | 1 hora ≈ 0.042 días |
| `hour` | `month` | 0.00138889 | 1 hora ≈ 0.001 meses |

---

## Consideraciones

1. **Precisión:** Los factores usan `NUMERIC(20,8)` en la base de datos para evitar errores de redondeo en conversiones encadenadas.

2. **Factor inverso automático:** Si no existe un factor directo (ej: `g → lb`), el sistema intenta calcular el inverso automáticamente (1 / factor de `lb → g`).

3. **No todas las conversiones son posibles:** Solo se pueden convertir unidades de la misma familia (peso ↔ peso, volumen ↔ volumen). Intentar convertir `kg → l` resultará en error.

4. **Extensibilidad:** Los administradores pueden agregar nuevos factores de conversión según necesidades del negocio sin requerir migraciones de base de datos.

5. **Uso en productos:** Los productos con `is_variable_measure=true` usan estas conversiones cuando tienen precios en unidades diferentes a su `base_unit`.

---

## Ejemplo de Uso en Frontend

### Escenario: Producto de medida variable

Un producto "Tomate por Kg" tiene:
- `base_unit: "kg"`
- `is_variable_measure: true`
- Precio en `unit_prices`: `{unit: "kg", price_per_unit: 12500}`

Si el cajero ingresa 500g:
1. Frontend envía: `{quantity: 500, unit: "g"}`
2. Backend convierte: `convert_units(500, 'g', 'kg')` = 0.5 kg
3. Calcula precio: 0.5 × 12500 = Gs. 6.250

### Obtener lista de conversiones para UI

```typescript
interface UnitConversion {
  from_unit: string;
  to_unit: string;
  factor: string;
  created_at: string;
  updated_at: string;
}

async function getUnitConversions(): Promise<UnitConversion[]> {
  const response = await fetch('/unit-conversions', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  return data.data;
}
```

---

## Códigos de Error Comunes

| HTTP Status | Descripcion | Solucion |
|-------------|-------------|----------|
| 400 | Datos invalidos o validacion fallida | Verificar el body y los campos requeridos |
| 401 | Token JWT invalido o ausente | Verificar que se envia el header Authorization |
| 403 | Sin permiso para la operacion | Verificar permisos del usuario |
| 500 | Error interno del servidor | Reportar al equipo de backend |

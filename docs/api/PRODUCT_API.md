# Guía de API de Productos para Desarrolladores Frontend

**Versión**: 2.0.0 - Sistema Financiero Enriquecido  
**Fecha**: 9 de Septiembre, 2025  
**Estado**: ✅ Completamente actualizado con sistema financiero enriquecido  

Esta guía proporciona documentación completa de todos los endpoints de productos disponibles para integración con aplicaciones frontend, incluyendo los nuevos endpoints financieramente enriquecidos que combinan información de precios, costos, stock y salud financiera.

## Base URL
```
http://localhost:5050
```

## Autenticación
Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <jwt_token>
```

---

## ¿Qué son los Productos Financieramente Enriquecidos? 🆕

Los **Productos Financieramente Enriquecidos** (`ProductFinancialEnriched`) son la evolución más avanzada del sistema de productos. Contienen información financiera completa incluyendo:

- **Datos básicos**: ID, nombre, estado, categoría, tipo
- **Información de precios**: Array completo de precios por unidad (`unit_prices`)
- **Resumen de costos**: Información agregada de costos por unidad (`unit_costs_summary`) incluyendo:
  - Último costo de compra
  - Costo promedio ponderado de los últimos 6 meses
  - Fecha de última compra
  - Número total de compras
  - Porcentaje de variación de costos
- **Información de stock**: Cantidad actual, fechas de actualización
- **Descripción**: Descripción actual del producto
- **Salud financiera**: Indicadores de estado financiero (`financial_health`)
- **Campos calculados**: Mejor margen por unidad, validaciones financieras

### Nuevos Endpoints Financieramente Enriquecidos:
- `GET /products/financial/{id}` - **🆕 NUEVO**: Producto con información financiera completa
- `GET /products/financial/barcode/{barcode}` - **🆕 NUEVO**: Búsqueda financiera por código de barras  
- `GET /products/financial/name/{name}` - **🆕 NUEVO**: Búsqueda financiera por nombre con score de coincidencia

---

## ¿Qué son los Productos Enriquecidos?

Los **Productos Enriquecidos** (`ProductEnriched`) contienen información completa del producto incluyendo:
- **Datos básicos**: ID, nombre, estado, categoría, tipo
- **Información de stock**: Cantidad actual, fechas de actualización, usuario que modificó
- **Información de precios**: Precios generales y precios por unidades específicas
- **Descripción**: Descripción actual del producto
- **Campos calculados**: Estado del stock, precio formateado, validaciones

Esta estructura es ideal para mostrar productos en interfaces de usuario donde necesitas toda la información de una sola vez.

### Endpoints que devuelven Productos Enriquecidos:
- `GET /products/{id}` - **ACTUALIZADO**: Información unificada de precios y costos
- `GET /products/name/{name}` - **ACTUALIZADO**: Búsqueda enriquecida con nuevo sistema de precios  
- `GET /products/barcode/{barcode}` - **NUEVO**: Producto enriquecido por código de barras
- `GET /products/{page}/{pageSize}` - Listado paginado enriquecido
- `GET /products/enriched/all` - Todos los productos enriquecidos

---

## 🆕 Endpoints Financieramente Enriquecidos

Estos nuevos endpoints proporcionan información financiera completa combinando precios de venta, costos de compra, análisis de márgenes y salud financiera del producto.

### 1. Obtener Producto Financieramente Enriquecido por ID
**GET** `/products/financial/{id}`

Obtiene información financiera completa de un producto específico.

**Response (200):**
```json
{
  "product_id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
  "product_name": "Onion - Dried",
  "barcode": null,
  "state": true,
  "category_id": 1,
  "product_type": "PHYSICAL",
  "unit_prices": [
    {
      "id": 18,
      "product_id": "GA4w4YlYpVP1LNji17o9FKbp8Dg",
      "unit": "unit",
      "price_per_unit": 24.05,
      "effective_date": "2025-05-26T17:39:41.446265Z"
    }
  ],
  "unit_costs_summary": [
    {
      "unit": "unit",
      "last_cost": 18.50,
      "last_purchase_date": "2025-09-04T13:08:47.529294Z",
      "weighted_avg_cost_6m": 18.50,
      "total_purchases": 1,
      "cost_variance_percent": 0.0
    }
  ],
  "stock_quantity": 50.0,
  "stock_updated_at": "2025-09-08T09:59:02.860103Z",
  "stock_updated_by": "user123",
  "description": "Cebolla deshidratada premium",
  "description_updated_at": "2025-09-01T10:00:00Z",
  "category_name": "Vegetables",
  "category": {
    "id": 1,
    "name": "Vegetables"
  },
  "financial_health": {
    "has_prices": true,
    "has_costs": true,
    "has_stock": true,
    "price_count": 1,
    "cost_units_count": 1,
    "last_updated": "2025-09-08T09:59:02.860103Z"
  },
  "stock_status": "in_stock",
  "has_valid_stock": true,
  "has_valid_prices": true,
  "has_valid_costs": true,
  "best_margin_unit": "unit",
  "best_margin_percent": 23.06
}
```

**Campos específicos del endpoint financiero:**

- **`unit_costs_summary`**: Array con información de costos por unidad
  - `last_cost`: Último costo de compra registrado
  - `last_purchase_date`: Fecha de la última compra
  - `weighted_avg_cost_6m`: Promedio ponderado de los últimos 6 meses
  - `total_purchases`: Número total de compras registradas
  - `cost_variance_percent`: Porcentaje de variación entre el costo más bajo y más alto

- **`financial_health`**: Indicadores de salud financiera
  - `has_prices`: Si el producto tiene precios configurados
  - `has_costs`: Si el producto tiene costos registrados
  - `has_stock`: Si el producto tiene stock disponible
  - `price_count`: Número de precios por unidad configurados
  - `cost_units_count`: Número de unidades con costos registrados
  - `last_updated`: Fecha de última actualización de datos

- **`best_margin_unit`**: Unidad con el mejor margen de ganancia
- **`best_margin_percent`**: Porcentaje del mejor margen encontrado

**Response (404):**
```json
{
  "error": "Product not found"
}
```

---

### 2. Obtener Producto Financieramente Enriquecido por Código de Barras
**GET** `/products/financial/barcode/{barcode}`

Busca un producto por código de barras con información financiera completa.

**Parámetros de ruta:**
- `barcode` (string): El código de barras del producto

**Response (200):**
```json
{
  "product_id": "EKrR80U3aw50tStb21c3kkfhezP",
  "product_name": "Coffee - Decafenated",
  "barcode": "7891234567892",
  "state": true,
  "category_id": 2,
  "product_type": "PHYSICAL",
  "unit_prices": [],
  "unit_costs_summary": [],
  "stock_quantity": null,
  "stock_updated_at": null,
  "stock_updated_by": null,
  "description": null,
  "description_updated_at": null,
  "category_name": "Beverages",
  "financial_health": {
    "has_prices": false,
    "has_costs": false,
    "has_stock": false,
    "price_count": 0,
    "cost_units_count": 0,
    "last_updated": "1900-01-01T00:00:00Z"
  },
  "stock_status": "out_of_stock",
  "has_valid_stock": false,
  "has_valid_prices": false,
  "has_valid_costs": false,
  "best_margin_unit": null,
  "best_margin_percent": null
}
```

**Casos de uso:**
- Escáner de código de barras en puntos de venta
- Verificación rápida de información financiera
- Análisis de márgenes por producto escaneado

---

### 3. Buscar Productos Financieramente Enriquecidos por Nombre
**GET** `/products/financial/name/{name}?limit=10`

Busca productos por nombre con información financiera completa y score de coincidencia.

**Parámetros de ruta:**
- `name` (string): Término de búsqueda (búsqueda parcial)

**Query Parameters:**
- `limit` (int, opcional): Número máximo de resultados (default: 50)

**Response (200):**
```json
[
  {
    "product_id": "EKrR80U3aw50tStb21c3kkfhezP",
    "product_name": "Coffee - Decafenated",
    "barcode": "7891234567892",
    "state": true,
    "category_id": 2,
    "product_type": "PHYSICAL",
    "unit_prices": [],
    "unit_costs_summary": [],
    "stock_quantity": null,
    "stock_updated_at": null,
    "stock_updated_by": null,
    "description": null,
    "description_updated_at": null,
    "category_name": "Beverages",
    "financial_health": {
      "has_prices": false,
      "has_costs": false,
      "has_stock": false,
      "price_count": 0,
      "cost_units_count": 0,
      "last_updated": "1900-01-01T00:00:00Z"
    },
    "stock_status": "out_of_stock",
    "has_valid_stock": false,
    "has_valid_prices": false,
    "has_valid_costs": false,
    "best_margin_unit": null,
    "best_margin_percent": null,
    "match_score": 0.8
  }
]
```

**Campo específico:**
- **`match_score`**: Puntuación de coincidencia (0.0 - 1.0)
  - `1.0`: Coincidencia exacta en el nombre
  - `0.8`: Nombre empieza con el término de búsqueda
  - `0.6`: Nombre contiene el término de búsqueda
  - `0.4`: Descripción contiene el término de búsqueda
  - `0.2`: Coincidencia genérica

**Casos de uso:**
- Búsqueda avanzada con análisis financiero
- Comparación de márgenes entre productos similares
- Análisis de rentabilidad por categoría de productos

---

## 📏 Unidades de Medida Estándar

El sistema utiliza **31 unidades de medida estandarizadas** con validación a nivel de base de datos mediante CHECK constraints. Todas las unidades están en **minúsculas** e **inglés**.

### Endpoint de Unidades Disponibles

#### Obtener Lista de Unidades
**GET** `/products/units`

Obtiene todas las unidades disponibles organizadas por categoría.

**Response (200):**
```json
{
  "success": true,
  "total": 31,
  "units": [
    {
      "value": "unit",
      "label": "Unidad individual",
      "category": "basic",
      "allow_decimals": false,
      "input_type": "integer",
      "step": 1,
      "min": 1,
      "examples": ["1", "2", "10"]
    },
    {
      "value": "kg",
      "label": "Kilogramo",
      "category": "weight",
      "allow_decimals": true,
      "input_type": "decimal",
      "step": 0.01,
      "min": 0.01,
      "examples": ["0.5", "1.25", "2.75"]
    }
  ]
}
```

### Categorías y Reglas de Validación

#### 📦 Básicas (Sin Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `unit` | Unidad individual | ❌ No | integer | 1 | 1, 2, 10, 50 |
| `pair` | Par | ❌ No | integer | 1 | 1, 2, 5 |
| `set` | Conjunto/Set | ❌ No | integer | 1 | 1, 2, 3 |

#### ⚖️ Peso (Con Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `kg` | Kilogramo | ✅ Sí | decimal | 0.01 | 0.5, 1.25, 2.75 |
| `g` | Gramo | ✅ Sí | decimal | 0.1 | 10.5, 250.0 |
| `lb` | Libra | ✅ Sí | decimal | 0.01 | 0.5, 1.5, 2.25 |
| `oz` | Onza | ✅ Sí | decimal | 0.1 | 8.5, 16.0 |
| `ton` | Tonelada | ✅ Sí | decimal | 0.001 | 0.5, 1.0, 2.5 |

#### 🧪 Volumen (Con Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `l` | Litro | ✅ Sí | decimal | 0.01 | 0.5, 1.0, 1.5 |
| `ml` | Mililitro | ✅ Sí | decimal | 1 | 250.0, 500.0 |
| `gal` | Galón | ✅ Sí | decimal | 0.1 | 1.0, 2.5, 5.0 |

#### 📦 Empaque (Sin Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `box` | Caja | ❌ No | integer | 1 | 1, 5, 10 |
| `pack` | Paquete | ❌ No | integer | 1 | 1, 2, 6 |
| `bag` | Bolsa | ❌ No | integer | 1 | 1, 2, 5 |
| `case` | Cajón/Cartón | ❌ No | integer | 1 | 1, 2, 3 |
| `dozen` | Docena | ❌ No | integer | 1 | 1, 2, 5 |
| `bundle` | Atado | ❌ No | integer | 1 | 1, 2, 3 |

#### 📏 Longitud/Área (Con Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `meter` | Metro | ✅ Sí | decimal | 0.01 | 1.5, 2.75, 10.0 |
| `cm` | Centímetro | ✅ Sí | decimal | 0.1 | 10.5, 25.0, 50.5 |
| `sqm` | Metro cuadrado | ✅ Sí | decimal | 0.01 | 1.5, 2.25, 10.0 |
| `roll` | Rollo | ❌ No | integer | 1 | 1, 2, 5 |

#### ⏰ Servicios (Sin Decimales para hour/day, Con Decimales para month)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `hour` | Hora | ❌ No | integer | 1 | 1, 2, 3, 8 |
| `day` | Día | ❌ No | integer | 1 | 1, 7, 15, 30 |
| `month` | Mes | ✅ Sí | decimal | 0.5 | 1.0, 1.5, 6.0 |

#### 🏪 Especiales Supermercado (Sin Decimales)
| Unidad | Descripción | Decimales | Tipo Input | Step | Ejemplos |
|--------|-------------|-----------|------------|------|----------|
| `tray` | Bandeja | ❌ No | integer | 1 | 1, 2, 5 |
| `bottle` | Botella | ❌ No | integer | 1 | 1, 6, 12 |
| `can` | Lata | ❌ No | integer | 1 | 1, 6, 12, 24 |
| `jar` | Frasco | ❌ No | integer | 1 | 1, 2, 6 |
| `carton` | Tetrapack | ❌ No | integer | 1 | 1, 6, 12 |
| `stick` | Barra | ❌ No | integer | 1 | 1, 2, 5 |
| `slice` | Rodaja/Rebanada | ❌ No | integer | 1 | 1, 5, 10 |
| `portion` | Porción | ❌ No | integer | 1 | 1, 2, 5 |

### Reglas de Validación Frontend

#### ✅ Unidades CON Decimales (10 unidades)
```javascript
const DECIMAL_UNITS = ['kg', 'g', 'lb', 'oz', 'ton', 'l', 'ml', 'gal', 'meter', 'cm', 'sqm', 'month'];

// Configuración de input
{
  type: "number",
  step: "0.01", // o "0.1" o "0.001" según la unidad
  min: "0.01",
  pattern: "[0-9]+([.][0-9]{1,2})?",
  placeholder: "1.5"
}
```

**Ejemplos de valores válidos:**
- `0.5`, `1.25`, `2.75`, `10.0`, `15.33`

**Validación JavaScript:**
```javascript
function validateDecimalUnit(value, unit) {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return false;
  
  // Permitir hasta 2 decimales para la mayoría
  const decimals = (value.split('.')[1] || '').length;
  if (unit === 'g' || unit === 'ml') return decimals <= 1;
  if (unit === 'ton') return decimals <= 3;
  return decimals <= 2;
}
```

#### ❌ Unidades SIN Decimales (21 unidades)
```javascript
const INTEGER_UNITS = [
  'unit', 'pair', 'set',           // Básicas
  'box', 'pack', 'bag', 'case',    // Empaque
  'dozen', 'bundle', 'roll',       // Empaque y longitud
  'hour', 'day',                   // Servicios
  'tray', 'bottle', 'can', 'jar',  // Supermercado
  'carton', 'stick', 'slice', 'portion'
];

// Configuración de input
{
  type: "number",
  step: "1",
  min: "1",
  pattern: "[0-9]+",
  placeholder: "1"
}
```

**Ejemplos de valores válidos:**
- `1`, `2`, `5`, `10`, `50`, `100`

**Validación JavaScript:**
```javascript
function validateIntegerUnit(value) {
  const num = parseInt(value, 10);
  return num > 0 && Number.isInteger(num);
}
```

### Implementación Frontend Recomendada

#### React/TypeScript - Componente de Input con Validación
```typescript
interface UnitConfig {
  value: string;
  label: string;
  category: string;
  allow_decimals: boolean;
  input_type: 'integer' | 'decimal';
  step: number;
  min: number;
  examples: string[];
}

const UNIT_CONFIGS: Record<string, UnitConfig> = {
  // Básicas (sin decimales)
  unit: { value: 'unit', label: 'Unidad', category: 'basic', allow_decimals: false, input_type: 'integer', step: 1, min: 1, examples: ['1', '2', '10'] },
  pair: { value: 'pair', label: 'Par', category: 'basic', allow_decimals: false, input_type: 'integer', step: 1, min: 1, examples: ['1', '2', '5'] },
  
  // Peso (con decimales)
  kg: { value: 'kg', label: 'Kilogramo', category: 'weight', allow_decimals: true, input_type: 'decimal', step: 0.01, min: 0.01, examples: ['0.5', '1.25', '2.75'] },
  g: { value: 'g', label: 'Gramo', category: 'weight', allow_decimals: true, input_type: 'decimal', step: 0.1, min: 0.1, examples: ['10.5', '250.0'] },
  
  // ... (incluir todas las 31 unidades)
};

const QuantityInput: React.FC<{ unit: string; value: number; onChange: (value: number) => void }> = ({ unit, value, onChange }) => {
  const config = UNIT_CONFIGS[unit] || UNIT_CONFIGS.unit;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numValue = config.allow_decimals ? parseFloat(inputValue) : parseInt(inputValue, 10);
    
    if (!isNaN(numValue) && numValue >= config.min) {
      onChange(numValue);
    }
  };
  
  return (
    <div className="quantity-input">
      <label>Cantidad ({config.label})</label>
      <input
        type="number"
        value={value}
        onChange={handleChange}
        step={config.step}
        min={config.min}
        placeholder={config.examples[0]}
        aria-describedby={`unit-help-${unit}`}
      />
      <small id={`unit-help-${unit}`}>
        {config.allow_decimals 
          ? `Decimales permitidos (ej: ${config.examples.join(', ')})` 
          : `Solo números enteros (ej: ${config.examples.join(', ')})`}
      </small>
    </div>
  );
};
```

#### Vue.js - Directiva de Validación
```javascript
// unitValidation.js
export const unitValidation = {
  mounted(el, binding) {
    const unit = binding.value;
    const config = UNIT_CONFIGS[unit] || UNIT_CONFIGS.unit;
    
    el.setAttribute('type', 'number');
    el.setAttribute('step', config.step.toString());
    el.setAttribute('min', config.min.toString());
    
    if (!config.allow_decimals) {
      el.setAttribute('pattern', '[0-9]+');
    }
    
    el.addEventListener('input', (e) => {
      const value = e.target.value;
      const isValid = config.allow_decimals 
        ? /^\d+(\.\d{1,2})?$/.test(value)
        : /^\d+$/.test(value);
      
      el.classList.toggle('invalid', !isValid);
    });
  }
};

// Uso en componente
<input v-unit-validation="selectedUnit" v-model="quantity" />
```

#### Validación de Formulario Completa
```javascript
function validateQuantityForUnit(quantity, unit) {
  const config = UNIT_CONFIGS[unit];
  
  if (!config) {
    return { valid: false, error: 'Unidad no válida' };
  }
  
  const num = parseFloat(quantity);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Debe ingresar un número' };
  }
  
  if (num < config.min) {
    return { valid: false, error: `El mínimo es ${config.min}` };
  }
  
  if (!config.allow_decimals && !Number.isInteger(num)) {
    return { valid: false, error: `${config.label} no permite decimales. Use números enteros.` };
  }
  
  if (config.allow_decimals) {
    const decimals = (quantity.toString().split('.')[1] || '').length;
    const maxDecimals = config.step < 0.01 ? 3 : (config.step < 0.1 ? 2 : 1);
    
    if (decimals > maxDecimals) {
      return { valid: false, error: `Máximo ${maxDecimals} decimales para ${config.label}` };
    }
  }
  
  return { valid: true, error: null };
}
```

### Ejemplo de Selector de Unidades con Validación Dinámica
```jsx
const UnitQuantitySelector = () => {
  const [selectedUnit, setSelectedUnit] = useState('unit');
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState(null);
  
  const handleQuantityChange = (value) => {
    setQuantity(value);
    const validation = validateQuantityForUnit(value, selectedUnit);
    setError(validation.error);
  };
  
  const config = UNIT_CONFIGS[selectedUnit];
  
  return (
    <div className="unit-quantity-form">
      <div className="form-group">
        <label>Unidad de Medida</label>
        <select 
          value={selectedUnit} 
          onChange={(e) => {
            setSelectedUnit(e.target.value);
            setQuantity(UNIT_CONFIGS[e.target.value].min.toString());
          }}
        >
          <optgroup label="Básicas">
            <option value="unit">Unidad individual</option>
            <option value="pair">Par</option>
            <option value="set">Conjunto/Set</option>
          </optgroup>
          <optgroup label="Peso">
            <option value="kg">Kilogramo (kg)</option>
            <option value="g">Gramo (g)</option>
            <option value="lb">Libra (lb)</option>
            <option value="oz">Onza (oz)</option>
            <option value="ton">Tonelada (ton)</option>
          </optgroup>
          <optgroup label="Volumen">
            <option value="l">Litro (l)</option>
            <option value="ml">Mililitro (ml)</option>
            <option value="gal">Galón (gal)</option>
          </optgroup>
          <optgroup label="Empaque">
            <option value="box">Caja</option>
            <option value="pack">Paquete</option>
            <option value="bag">Bolsa</option>
            <option value="case">Cajón/Cartón</option>
            <option value="dozen">Docena</option>
            <option value="bundle">Atado</option>
          </optgroup>
          <optgroup label="Longitud/Área">
            <option value="meter">Metro (m)</option>
            <option value="cm">Centímetro (cm)</option>
            <option value="sqm">Metro cuadrado (m²)</option>
            <option value="roll">Rollo</option>
          </optgroup>
          <optgroup label="Servicios">
            <option value="hour">Hora</option>
            <option value="day">Día</option>
            <option value="month">Mes</option>
          </optgroup>
          <optgroup label="Supermercado">
            <option value="tray">Bandeja</option>
            <option value="bottle">Botella</option>
            <option value="can">Lata</option>
            <option value="jar">Frasco</option>
            <option value="carton">Tetrapack</option>
            <option value="stick">Barra</option>
            <option value="slice">Rodaja/Rebanada</option>
            <option value="portion">Porción</option>
          </optgroup>
        </select>
      </div>
      
      <div className="form-group">
        <label>Cantidad</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          step={config.step}
          min={config.min}
          className={error ? 'error' : ''}
        />
        {error && <span className="error-message">{error}</span>}
        <small className="help-text">
          {config.allow_decimals 
            ? `✅ Decimales permitidos (ej: ${config.examples.join(', ')})` 
            : `❌ Solo enteros (ej: ${config.examples.join(', ')})`}
        </small>
      </div>
    </div>
  );
};
```

### Resumen de Validaciones por Categoría

| Categoría | Unidades | Decimales | Input Type | Casos de Uso |
|-----------|----------|-----------|------------|--------------|
| **Básicas** | unit, pair, set | ❌ No | integer | Productos individuales |
| **Peso** | kg, g, lb, oz, ton | ✅ Sí | decimal | Productos a granel |
| **Volumen** | l, ml, gal | ✅ Sí | decimal | Líquidos |
| **Empaque** | box, pack, bag, case, dozen, bundle | ❌ No | integer | Productos empaquetados |
| **Longitud/Área** | meter, cm, sqm (con decimales), roll (sin) | Mixto | mixto | Mediciones |
| **Servicios** | hour, day (sin decimales), month (con) | Mixto | mixto | Alquiler/Suscripciones |
| **Supermercado** | tray, bottle, can, jar, carton, stick, slice, portion | ❌ No | integer | Productos de supermercado |

---

## Endpoints de Productos

#### 5. Create Product
`POST /products`

Crea un nuevo producto.

**Request Body:**
```json
{
  "name": "Producto Nuevo",
  "barcode": "7891234567890",
  "category_id": 1,
  "product_type": "PHYSICAL",
  "purchase_price": 15000.00
}
```

**Campos:**
- `name` (string, requerido): Nombre del producto
- `barcode` (string, opcional): Código de barras del producto (máximo 50 caracteres)
- `category_id` (int, requerido): ID de la categoría
- `product_type` (string, opcional): Tipo de producto ("PHYSICAL" o "SERVICE"). Por defecto: "PHYSICAL"
- `purchase_price` (float, requerido): Precio de compra del producto

**Response (200):**
```json
{
  "message": "Product and description added successfully"
}
```

**Response (400):**
```json
{
  "error": "Description is required"
}
```

---

#### 1. Get Product by ID - **ACTUALIZADO**
`GET /products/{id}`

**🆕 NUEVO**: Ahora devuelve información unificada de precios y costos usando el nuevo sistema de `products.unit_prices` y `products.unit_costs`.

**Parámetros de consulta opcionales:**
- `unit` (string): Unidad específica para obtener información de precios

**Response (200) - Información unificada de precios:**
```json
{
  "product_id": "PRODUCT-001",
  "product_name": "Arroz Premium",
  "unit": "kg",
  "current_cost": 8500.00,
  "weighted_avg_cost": 8350.00,
  "selling_price": 12000.00,
  "margin_amount": 3500.00,
  "margin_percent": 41.18,
  "cost_source": "unit_costs",
  "price_source": "unit_prices"
}
```

**Ejemplo de uso:**
```bash
GET /products/PRODUCT-001?unit=kg
```

#### 2. Get Product by Barcode - **🆕 RECIÉN ACTUALIZADO**
`GET /products/barcode/{barcode}`

**⚠️ CAMBIO IMPORTANTE**: Este endpoint ahora devuelve un **producto enriquecido** en lugar de un producto básico, consistente con el nuevo sistema de precios.

**Parámetros de ruta:**
- `barcode` (string): El código de barras del producto

**Response (200) - Producto enriquecido:**
```json
{
  "id": "PRODUCT-001",
  "name": "Arroz Premium",
  "barcode": "1234567890123",
  "state": true,
  "purchase_price": 8500.00,
  "stock_quantity": 150.0,
  "stock_status": "in_stock",
  "price_formatted": "PYG 12,000",
  "has_valid_price": true,
  "has_valid_stock": true,
  "has_unit_pricing": true,
  "unit_prices": [
    {
      "unit": "kg",
      "price_per_unit": 12000.00,
      "effective_date": "2025-09-01T00:00:00Z"
    },
    {
      "unit": "caja",
      "price_per_unit": 240000.00,
      "effective_date": "2025-09-01T00:00:00Z"
    }
  ],
  "category": {
    "id": 1,
    "name": "Granos"
  },
  "product_type": "PHYSICAL"
}
```

**Response (404):**
```json
{
  "error": "Producto no encontrado"
}
```

**Valores de `stock_status`:**
- `"out_of_stock"`: Sin stock (cantidad <= 0)
- `"low_stock"`: Stock bajo (cantidad <= 5)
- `"medium_stock"`: Stock medio (cantidad <= 20)
- `"in_stock"`: En stock (cantidad > 20)

**Response (404):**
```json
{
  "error": "Product not found"
}
```

---

### 3. Buscar Productos Enriquecidos por Nombre
**GET** `/products/name/{name}`

Busca productos enriquecidos por nombre (búsqueda parcial). Devuelve productos con información completa de stock, precios y descripción.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "barcode": "7891234567890",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "category_id": 1,
    "category_name": "Electrónicos",
    "product_type": "PHYSICAL",
    "user_id": "user123",
    "purchase_price": 15000.00,
    "price_id": 1,
    "price_updated_at": "2024-01-15T10:30:00Z",
    "price_updated_by": "user123",
    "unit_prices": [
      {
        "id": 1,
        "product_id": "abc123",
        "unit": "unidad",
        "price_per_unit": 15000.00,
        "effective_date": "2024-01-15T10:30:00Z"
      }
    ],
    "has_unit_pricing": true,
    "stock_quantity": 25.5,
    "stock_id": 1,
    "stock_updated_at": "2024-01-15T10:30:00Z",
    "stock_updated_by": "user123",
    "description": "Descripción completa del producto",
    "description_id": 1,
    "stock_status": "in_stock",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 4. Obtener Productos Enriquecidos Paginados
**GET** `/products/{page}/{pageSize}`

Obtiene productos enriquecidos con paginación. Devuelve productos con información completa de stock, precios y descripción.

**Parámetros de URL:**
- `page` (int): Número de página (empezando desde 1)
- `pageSize` (int): Cantidad de elementos por página

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto 1",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "category_id": 1,
    "category_name": "Electrónicos",
    "product_type": "PHYSICAL",
    "user_id": "user123",
    "purchase_price": 15000.00,
    "price_id": 1,
    "price_updated_at": "2024-01-15T10:30:00Z",
    "price_updated_by": "user123",
    "unit_prices": [],
    "has_unit_pricing": false,
    "stock_quantity": 25.5,
    "stock_id": 1,
    "stock_updated_at": "2024-01-15T10:30:00Z",
    "stock_updated_by": "user123",
    "description": "Descripción del producto",
    "description_id": 1,
    "stock_status": "in_stock",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 5. Obtener Todos los Productos Enriquecidos (Sin Paginación)
**GET** `/products/enriched/all`

Obtiene **todos** los productos enriquecidos sin paginación. Útil para componentes como selectores o cuando necesitas la lista completa.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "product_type": "PHYSICAL",
    "stock_quantity": 25.5,
    "stock_status": "in_stock",
    "purchase_price": 15000.00,
    "unit_prices": [],
    "has_unit_pricing": false,
    "description": "Descripción del producto",
    "price_formatted": "PYG 15000",
    "has_valid_stock": true,
    "has_valid_price": true
  }
]
```

---

### 6. Obtener Productos de Servicios de Canchas (Enriquecidos)
**GET** `/products/enriched/service-courts`

Obtiene productos de tipo **SERVICE** específicamente de categorías relacionadas con canchas deportivas. Incluye información completa de stock, precios y descripción optimizada para servicios de reserva.

**Filtros aplicados automáticamente:**
- `product_type = 'SERVICE'`
- `state = true` (solo productos activos)
- Categorías: "Alquiler de Canchas", "Sports", o cualquier categoría que contenga "cancha", "court", "field"
- Nombres de productos que contengan "cancha" o "court"

**Response (200):**
```json
[
  {
    "id": "BT_Cancha_1_xyz123abc",
    "name": "Cancha de Beach Tennis 1",
    "state": true,
    "category": {
      "id": 3,
      "name": "Alquiler de Canchas"
    },
    "category_id": 3,
    "category_name": "Alquiler de Canchas",
    "product_type": "SERVICE",
    "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "purchase_price": 70000.00,
    "price_id": 77,
    "price_updated_at": "2025-06-09T14:52:07Z",
    "price_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "unit_prices": [],
    "has_unit_pricing": false,
    "stock_quantity": null,
    "stock_id": null,
    "stock_updated_at": null,
    "stock_updated_by": null,
    "description": null,
    "description_id": null,
    "stock_status": "no_stock_tracking",
    "price_formatted": "PYG 70000/hora",
    "has_valid_stock": false,
    "has_valid_price": true
  }
]
```

**Estados de `stock_status` para servicios:**
- `"no_stock_tracking"`: Servicio sin control de stock
- `"unavailable"`: Servicio temporalmente no disponible
- `"limited_availability"`: Disponibilidad limitada
- `"available"`: Servicio disponible

**Características especiales para servicios:**
- `price_formatted`: Muestra formato "PYG XXXX/hora" para servicios
- `has_valid_stock`: `false` para servicios sin control de inventario
- `stock_quantity`: Puede ser `null` para servicios

---

### 7. Obtener Productos por Categoría
**GET** `/products/by-category?categories=1,2,3`

Obtiene productos filtrados por categorías específicas con información de precios.

**Query Parameters:**
- `categories` (string, requerido): IDs de categorías separadas por comas

**Response (200):**
```json
{
  "data": [
    {
      "product_id": "abc123",
      "product_name": "Producto Ejemplo",
      "category_name": "Electrónicos",
      "price": 15000.00,
      "unit": "unidad",
      "price_source": "unit_price",
      "has_unit_pricing": true
    }
  ],
  "count": 1
}
```

---

### 8. Actualizar Producto
**PUT** `/products/{id}`

Actualiza un producto existente junto con su descripción.

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "state": true,
  "id_category": 2,
  "product_type": "SERVICE",
  "description": "Nueva descripción"
}
```

**Response (200):**
```json
{
  "message": "Product and description updated successfully"
}
```

---

### 9. Eliminar Producto
**DELETE** `/products/{id}`

Elimina un producto (eliminación lógica).

**Response (200):**
```json
{
  "message": "Product and description deleted successfully"
}
```

---

### 7. Actualizar Producto
**PUT** `/products/{id}`

Actualiza un producto existente junto con su descripción.

**Request Body:**
```json
{
  "name": "Nombre Actualizado",
  "state": true,
  "id_category": 2,
  "product_type": "SERVICE",
  "description": "Nueva descripción"
}
```

**Response (200):**
```json
{
  "message": "Product and description updated successfully"
}
```

---

### 8. Eliminar Producto
**DELETE** `/products/{id}`

Elimina un producto (eliminación lógica).

**Response (200):**
```json
{
  "message": "Product and description deleted successfully"
}
```

---

## Endpoints de Inventario y Ajustes

### 10. Crear Inventario
**POST** `/inventory`

Crea un nuevo inventario físico con múltiples productos.

**Request Body:**
```json
{
  "check_date": "2025-09-01T10:00:00Z",
  "details": [
    {
      "id_product": "abc123",
      "quantity_checked": 25.5
    },
    {
      "id_product": "def456", 
      "quantity_checked": 10.0
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "inventory_id": 18,
  "message": "Inventory created successfully",
  "products_processed": 2
}
```

---

### 15. Obtener Detalles Completos del Producto
**GET** `/products/{id}/details`

Obtiene información completa del producto incluyendo stock y precios históricos.

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "product_type": "PHYSICAL",
  "price": 15000.00,
  "stock_quantity": 25.5,
  "description": "Descripción completa"
}
```

---

### 16. Buscar Detalles de Productos por Nombre
**GET** `/products/search/details/{name}`

Busca productos por nombre y devuelve información detallada.

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Producto Ejemplo",
    "state": true,
    "category": {
      "id": 1,
      "name": "Electrónicos"
    },
    "product_type": "PHYSICAL",
    "price": 15000.00,
    "stock_quantity": 25.5,
    "description": "Descripción completa"
  }
]
```

---

### 17. Obtener Producto con Descripción
**GET** `/products/{id}/with-description`

Obtiene un producto específico con su descripción en formato optimizado.

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Producto Ejemplo",
  "state": true,
  "category": {
    "id": 1,
    "name": "Electrónicos"
  },
  "product_type": "PHYSICAL",
  "description": "Descripción del producto",
  "effective_date": "2024-01-15T10:30:00Z",
  "user_id": "user123"
}
```

---

## Endpoints de Precios de Productos

### 18. Obtener Precio del Producto
**GET** `/products/{id}/price?unit=unidad`

Obtiene información de precios específica para un producto.

**Query Parameters:**
- `unit` (string, opcional): Unidad específica para obtener el precio

**Response (200):**
```json
{
  "data": {
    "product_id": "abc123",
    "product_name": "Producto Ejemplo",
    "category_name": "Electrónicos",
    "price": 15000.00,
    "unit": "unidad",
    "price_source": "unit_price",
    "has_unit_pricing": true
  }
}
```

---

### 19. Obtener Unidades del Producto
**GET** `/products/{id}/units`

Obtiene todas las unidades de medida disponibles para un producto con sus precios.

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "product_id": "abc123",
      "unit": "unidad",
      "price_per_unit": 15000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "product_id": "abc123",
      "unit": "docena",
      "price_per_unit": 150000.00,
      "effective_date": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### 20. Crear Precio por Unidad
**POST** `/products/{id}/units`

Crea un nuevo precio por unidad para un producto.

**Request Body:**
```json
{
  "unit": "docena",
  "price_per_unit": 150000.00
}
```

**Response (200):**
```json
{
  "message": "Unit price created successfully",
  "data": {
    "product_id": "abc123",
    "unit": "docena",
    "price_per_unit": 150000.00,
    "effective_date": "2024-01-15T10:30:00Z"
  }
}
```

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200    | Operación exitosa |
| 400    | Solicitud inválida |
| 401    | No autorizado (token JWT inválido) |
| 404    | Recurso no encontrado |
| 500    | Error interno del servidor |

---

## Cuándo Usar Cada Endpoint

### 🆕 Productos Financieramente Enriquecidos (Recomendado para Análisis Financiero)
Usa estos endpoints cuando necesites análisis financiero completo:
- **Análisis de rentabilidad**: `/products/financial/{id}` - Para analizar márgenes y costos
- **Punto de venta avanzado**: `/products/financial/barcode/{barcode}` - Verificación financiera por código de barras
- **Búsqueda con análisis**: `/products/financial/name/{name}` - Comparación financiera entre productos
- **Reportes financieros**: Cualquier endpoint financiero para dashboards de administración
- **Gestión de precios**: Análisis de costos vs precios para optimización de márgenes

### Productos Enriquecidos (Recomendado para UI General)
Usa estos endpoints cuando necesites mostrar productos en la interfaz con toda la información:
- **Catálogo de productos**: `/products/enriched/all` o `/products/{page}/{pageSize}`
- **Búsqueda de productos**: `/products/name/{name}`
- **Detalles de producto**: `/products/{id}`
- **Inventario/Stock**: Cualquier endpoint enriquecido incluye información de stock

### Productos de Servicios de Canchas
- **Listado de canchas**: `/products/enriched/service-courts` - Específico para mostrar canchas deportivas disponibles
- **Sistemas de reservas**: Ideal para integración con el sistema de reservas
- **Precios por hora**: Formato optimizado para servicios de alquiler
- **Disponibilidad de servicios**: Información de estado específica para servicios

### Productos con Información Específica
- **Precios por categoría**: `/products/by-category?categories=1,2,3`
- **Precios específicos**: `/products/{id}/price`
- **Unidades disponibles**: `/products/{id}/units`
- **Solo descripción**: `/products/{id}/with-description`

---

## Ejemplos de Uso con JavaScript/TypeScript

### 🆕 Endpoints Financieramente Enriquecidos

#### Obtener producto con información financiera completa
```typescript
const getProductFinancialEnriched = async (productId: string) => {
  try {
    const response = await fetch(`/api/products/financial/${productId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const product = await response.json();
    
    // Procesar información financiera
    return {
      ...product,
      // Campos calculados útiles para UI
      profitMargins: product.unit_costs_summary.map(cost => {
        const price = product.unit_prices.find(p => p.unit === cost.unit);
        if (price) {
          const margin = ((price.price_per_unit - cost.last_cost) / price.price_per_unit) * 100;
          return {
            unit: cost.unit,
            cost: cost.last_cost,
            price: price.price_per_unit,
            margin: margin.toFixed(2),
            marginAmount: price.price_per_unit - cost.last_cost
          };
        }
        return null;
      }).filter(Boolean),
      
      // Indicadores de salud financiera
      isFinanciallyHealthy: product.financial_health.has_prices && 
                           product.financial_health.has_costs && 
                           product.financial_health.has_stock,
      
      // Estado de inventario con contexto financiero
      inventoryValue: product.stock_quantity ? 
        product.unit_costs_summary.reduce((total, cost) => 
          total + (cost.last_cost * (product.stock_quantity || 0)), 0
        ) : 0,
        
      // Recomendaciones
      needsPriceUpdate: product.financial_health.price_count === 0,
      needsCostUpdate: product.financial_health.cost_units_count === 0,
      lowMarginWarning: product.best_margin_percent !== null && product.best_margin_percent < 20
    };
  } catch (error) {
    console.error('Error fetching financial enriched product:', error);
    throw error;
  }
};

// Ejemplo de uso en componente React
const ProductFinancialDashboard = ({ productId }: { productId: string }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadProduct = async () => {
      try {
        const productData = await getProductFinancialEnriched(productId);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProduct();
  }, [productId]);
  
  if (loading) return <div>Cargando información financiera...</div>;
  if (!product) return <div>Producto no encontrado</div>;
  
  return (
    <div className="product-financial-dashboard">
      <h2>{product.product_name}</h2>
      
      {/* Indicadores de salud financiera */}
      <div className="financial-health">
        <span className={`status ${product.isFinanciallyHealthy ? 'healthy' : 'warning'}`}>
          {product.isFinanciallyHealthy ? '✅ Saludable' : '⚠️ Requiere atención'}
        </span>
      </div>
      
      {/* Márgenes de ganancia */}
      <div className="profit-margins">
        <h3>Márgenes por Unidad</h3>
        {product.profitMargins.map(margin => (
          <div key={margin.unit} className="margin-item">
            <span>{margin.unit}</span>
            <span>Costo: ${margin.cost}</span>
            <span>Precio: ${margin.price}</span>
            <span className={`margin ${margin.margin < 20 ? 'low' : 'good'}`}>
              Margen: {margin.margin}%
            </span>
          </div>
        ))}
      </div>
      
      {/* Valor de inventario */}
      <div className="inventory-value">
        <h3>Valor de Inventario</h3>
        <p>Cantidad: {product.stock_quantity}</p>
        <p>Valor Total: ${product.inventoryValue.toFixed(2)}</p>
      </div>
      
      {/* Alertas y recomendaciones */}
      <div className="recommendations">
        {product.needsPriceUpdate && (
          <div className="alert warning">⚠️ Este producto no tiene precios configurados</div>
        )}
        {product.needsCostUpdate && (
          <div className="alert warning">⚠️ Este producto no tiene costos registrados</div>
        )}
        {product.lowMarginWarning && (
          <div className="alert danger">🚨 Margen bajo ({product.best_margin_percent}%)</div>
        )}
      </div>
    </div>
  );
};
```

#### Buscar producto por código de barras con información financiera
```typescript
const searchProductByBarcodeFinancial = async (barcode: string) => {
  try {
    const response = await fetch(`/api/products/financial/barcode/${encodeURIComponent(barcode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Producto no encontrado
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const product = await response.json();
    
    // Análisis inmediato para punto de venta
    return {
      ...product,
      // Verificaciones para venta
      canSell: product.financial_health.has_prices && product.has_valid_stock,
      sellPrice: product.unit_prices.length > 0 ? product.unit_prices[0].price_per_unit : null,
      costPrice: product.unit_costs_summary.length > 0 ? product.unit_costs_summary[0].last_cost : null,
      
      // Alertas inmediatas
      alerts: [
        ...(!product.financial_health.has_prices ? ['Sin precio configurado'] : []),
        ...(!product.has_valid_stock ? ['Sin stock disponible'] : []),
        ...(!product.financial_health.has_costs ? ['Sin costo registrado'] : []),
        ...(product.stock_status === 'low_stock' ? ['Stock bajo'] : [])
      ]
    };
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};

// Ejemplo de uso en escáner de punto de venta
const handleBarcodeScanned = async (scannedBarcode: string) => {
  try {
    const product = await searchProductByBarcodeFinancial(scannedBarcode);
    
    if (!product) {
      alert('Producto no encontrado con código de barras: ' + scannedBarcode);
      return;
    }
    
    // Mostrar alertas si las hay
    if (product.alerts.length > 0) {
      console.warn('Alertas del producto:', product.alerts);
    }
    
    // Verificar si se puede vender
    if (product.canSell) {
      // Agregar al carrito o continuar con venta
      addToCart(product);
    } else {
      alert(`No se puede vender este producto: ${product.alerts.join(', ')}`);
    }
    
  } catch (error) {
    console.error('Error al escanear código de barras:', error);
    alert('Error al buscar el producto');
  }
};
```

#### Buscar productos por nombre con análisis financiero
```typescript
const searchProductsFinancialByName = async (searchTerm: string, limit: number = 10) => {
  try {
    const response = await fetch(`/api/products/financial/name/${encodeURIComponent(searchTerm)}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    
    // Procesar productos con análisis financiero
    return products
      .sort((a, b) => b.match_score - a.match_score) // Ordenar por relevancia
      .map(product => ({
        ...product,
        // Análisis de rentabilidad
        profitabilityScore: calculateProfitabilityScore(product),
        
        // Recomendaciones de precio
        priceRecommendation: getPriceRecommendation(product),
        
        // Estado financiero resumido
        financialStatus: getFinancialStatus(product),
        
        // Valor de búsqueda
        searchRelevance: getSearchRelevance(product.match_score)
      }));
      
  } catch (error) {
    console.error('Error searching products financially by name:', error);
    throw error;
  }
};

// Funciones auxiliares para análisis
const calculateProfitabilityScore = (product) => {
  if (!product.best_margin_percent) return 0;
  
  // Puntuación basada en margen, stock y ventas
  const marginScore = Math.min(product.best_margin_percent / 50 * 100, 100);
  const stockScore = product.has_valid_stock ? 100 : 0;
  const priceScore = product.financial_health.has_prices ? 100 : 0;
  
  return Math.round((marginScore + stockScore + priceScore) / 3);
};

const getPriceRecommendation = (product) => {
  if (!product.financial_health.has_costs) return 'Registrar costos primero';
  if (!product.financial_health.has_prices) return 'Configurar precios';
  if (product.best_margin_percent < 20) return 'Considerar incremento de precio';
  if (product.best_margin_percent > 60) return 'Precio competitivo';
  return 'Precio adecuado';
};

const getFinancialStatus = (product) => {
  const { financial_health } = product;
  
  if (financial_health.has_prices && financial_health.has_costs && financial_health.has_stock) {
    return { status: 'complete', label: '✅ Completo', color: 'green' };
  } else if (financial_health.has_prices && financial_health.has_costs) {
    return { status: 'partial', label: '⚠️ Sin stock', color: 'orange' };
  } else if (financial_health.has_prices || financial_health.has_costs) {
    return { status: 'incomplete', label: '⚠️ Incompleto', color: 'orange' };
  } else {
    return { status: 'empty', label: '❌ Sin datos', color: 'red' };
  }
};

const getSearchRelevance = (score) => {
  if (score >= 0.9) return 'Muy relevante';
  if (score >= 0.7) return 'Relevante';
  if (score >= 0.5) return 'Parcialmente relevante';
  return 'Poco relevante';
};

// Ejemplo de uso en componente de búsqueda
const ProductFinancialSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const results = await searchProductsFinancialByName(searchTerm, 20);
      setProducts(results);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="product-financial-search">
      <div className="search-input">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar productos con análisis financiero..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>
      
      <div className="search-results">
        {products.map(product => (
          <div key={product.product_id} className="product-financial-card">
            <div className="product-header">
              <h3>{product.product_name}</h3>
              <span className={`status ${product.financialStatus.status}`}>
                {product.financialStatus.label}
              </span>
            </div>
            
            <div className="financial-summary">
              <div>Rentabilidad: {product.profitabilityScore}/100</div>
              <div>Margen: {product.best_margin_percent?.toFixed(1) || 'N/A'}%</div>
              <div>Stock: {product.stock_quantity || 'Sin stock'}</div>
            </div>
            
            <div className="recommendations">
              <small>{product.priceRecommendation}</small>
            </div>
            
            <div className="search-meta">
              <small>Relevancia: {product.searchRelevance} ({product.match_score.toFixed(2)})</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Obtener productos de servicios de canchas
```typescript
const getServiceCourts = async () => {
  try {
    const response = await fetch('/api/products/enriched/service-courts', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const courts = await response.json();
    
    // Procesar específicamente para servicios de canchas
    return courts.map(court => ({
      ...court,
      // Campos útiles para UI de reservas
      isAvailable: court.stock_status !== 'unavailable',
      hourlyRate: court.purchase_price || 0,
      displayName: `${court.name} - ${court.category_name}`,
      priceDisplay: court.price_formatted || 'Precio no disponible',
      // Para integración con sistema de reservas
      reservationEnabled: court.has_valid_price && court.state,
      categoryType: court.category_name || 'Sin categoría'
    }));
  } catch (error) {
    console.error('Error fetching service courts:', error);
    throw error;
  }
};

// Ejemplo de uso en un selector de canchas
const CourtSelector = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsData = await getServiceCourts();
        setCourts(courtsData.filter(court => court.isAvailable));
      } catch (error) {
        console.error('Error loading courts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourts();
  }, []);
  
  if (loading) return <div>Cargando canchas...</div>;
  
  return (
    <select>
      <option value="">Seleccionar cancha</option>
      {courts.map(court => (
        <option key={court.id} value={court.id}>
          {court.displayName} - {court.priceDisplay}
        </option>
      ))}
    </select>
  );
};
```

### Obtener todos los productos enriquecidos
```typescript
const getProducts = async () => {
  try {
    const response = await fetch('/api/products/enriched/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
```

### Crear un producto
```typescript
const createProduct = async (productData: {
  name: string;
  barcode?: string;
  category_id: number;
  product_type?: 'PHYSICAL' | 'SERVICE';
  purchase_price: number;
}) => {
  try {
    const response = await fetch('/api/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};
```

### Buscar productos enriquecidos por nombre
```typescript
const searchEnrichedProducts = async (searchTerm: string) => {
  try {
    const response = await fetch(`/api/products/name/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    // Los productos ya incluyen stock, precios, descripción, etc.
    return products.map(product => ({
      ...product,
      // Ejemplo: agregar lógica personalizada basada en campos calculados
      canSell: product.has_valid_stock && product.has_valid_price,
      displayPrice: product.price_formatted || 'Sin precio'
    }));
  } catch (error) {
    console.error('Error searching enriched products:', error);
    throw error;
  }
};
```

### Obtener productos enriquecidos con paginación
```typescript
const getEnrichedProductsPaginated = async (page: number, pageSize: number) => {
  try {
    const response = await fetch(`/api/products/${page}/${pageSize}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const products = await response.json();
    return products.map(product => ({
      ...product,
      // Agregar campos útiles para la UI
      isLowStock: product.stock_status === 'low_stock',
      isOutOfStock: product.stock_status === 'out_of_stock',
      hasDescription: !!product.description,
      categoryDisplayName: product.category?.name || 'Sin categoría'
    }));
  } catch (error) {
    console.error('Error fetching paginated enriched products:', error);
    throw error;
  }
};
```

### Buscar productos por categoría
```typescript
const getProductsByCategory = async (categoryIds: number[]) => {
  try {
    const categoriesParam = categoryIds.join(',');
    const response = await fetch(`/api/products/by-category?categories=${categoriesParam}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};
```

### Buscar producto por código de barras
```typescript
const getProductByBarcode = async (barcode: string) => {
  try {
    const response = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // Producto no encontrado
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const product = await response.json();
    return product;
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    throw error;
  }
};

// Ejemplo de uso en un escáner de código de barras
const handleBarcodeScanned = async (scannedBarcode: string) => {
  try {
    const product = await getProductByBarcode(scannedBarcode);
    if (product) {
      console.log('Producto encontrado:', product);
      // Agregar al carrito, mostrar detalles, etc.
    } else {
      console.log('Producto no encontrado con ese código de barras');
      // Mostrar mensaje al usuario
    }
  } catch (error) {
    console.error('Error al buscar producto:', error);
  }
};
```

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido.

2. **🆕 Endpoints Financieramente Enriquecidos**: 
   - Proporcionan análisis financiero completo con márgenes de ganancia
   - Incluyen información de costos históricos y promedios ponderados
   - Calculan automáticamente la salud financiera del producto
   - Ideales para reportes administrativos y análisis de rentabilidad

3. **Productos Enriquecidos**: La mayoría de endpoints devuelven `ProductEnriched` con información completa (stock, precios, descripción).

4. **Tipos de Producto**: Solo se permiten "PHYSICAL" y "SERVICE".

5. **Stock Decimal**: El sistema soporta cantidades decimales para stock (campo `stock_quantity` es `float64`).

6. **Precios por Unidad**: Los productos pueden tener múltiples precios según la unidad de medida en el array `unit_prices`.

7. **Campos Calculados**: Los productos enriquecidos incluyen campos como `stock_status`, `price_formatted`, `has_valid_stock`.

8. **Código de Barras**: El campo `barcode` es opcional, único (si se proporciona), y tiene un máximo de 50 caracteres. Se puede buscar productos específicamente por código de barras.

9. **Eliminación Lógica**: Los productos eliminados no se borran físicamente de la base de datos.

10. **Paginación vs Sin Paginación**: 
    - Use `/products/{page}/{pageSize}` para listas grandes con paginación
    - Use `/products/enriched/all` para obtener todos los productos de una vez (selectores, etc.)

11. **🆕 Análisis Financiero**: 
    - Los endpoints financieros incluyen cálculo automático de márgenes
    - Proporcionan alertas de salud financiera
    - Incluyen costos promedio ponderados y análisis de variación
    - Ideales para optimización de precios y análisis de rentabilidad

12. **Optimización**: Los endpoints enriquecidos y financieros hacen múltiples consultas internamente, son ideales para UI pero considera el rendimiento.

### Estructura de Respuestas por Tipo
- **ProductFinancialEnriched**: 🆕 Información financiera completa con análisis de costos, márgenes y salud financiera
- **ProductEnriched**: Información completa, ideal para mostrar en UI
- **ProductWithPricing**: Solo información de precios por categoría  
- **ProductDetails**: Información básica con precios y stock
- **ProductWithDescription**: Solo producto con su descripción

### Diferencias entre Endpoints Enriquecidos:
- **Financieramente Enriquecidos** (`/products/financial/*`): 
  - ✅ Información de costos y márgenes
  - ✅ Análisis de salud financiera
  - ✅ Cálculo automático de rentabilidad
  - ✅ Histórico de costos y promedios
  - 🎯 **Uso**: Administración, reportes, análisis financiero

- **Enriquecidos Regulares** (`/products/*`): 
  - ✅ Información básica completa
  - ✅ Stock y precios de venta
  - ✅ Descripción y categoría
  - ❌ Sin análisis de costos
  - 🎯 **Uso**: Catálogo, ventas, UI general

Esta documentación cubre todos los endpoints relacionados con productos incluyendo los productos enriquecidos. Para dudas adicionales, consulte el código fuente en `/handlers/product.go` y `/models/product.go`.
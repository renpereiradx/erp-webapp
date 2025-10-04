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

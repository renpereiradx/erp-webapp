# Guía Práctica: Categorías, Variantes, Atributos y Tags

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración. Para el modelado de datos, use las tablas de definición de campos en las guías de referencia.

**Versión:** 2.0.0
**Fecha:** 22 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Esta guía cubre flujos prácticos para integrar los cuatro pilares del catálogo de productos: **categorías jerárquicas**, **variantes de producto**, **atributos dinámicos** y **etiquetas (tags)**. Complementa las guías de referencia:

- [CATEGORY_IVA_API_GUIDE.md](./CATEGORY_IVA_API_GUIDE.md) — referencia de categorías y jerarquía
- [VARIANT_API_GUIDE.md](./VARIANT_API_GUIDE.md) — referencia de endpoints de variantes
- [BRAND_ATTRIBUTE_TAG_API_GUIDE.md](./BRAND_ATTRIBUTE_TAG_API_GUIDE.md) — referencia de marcas, atributos y tags
- [PRODUCT_API_GUIDE.md](./PRODUCT_API_GUIDE.md) — referencia de productos

---

## Arquitectura Conceptual: Cómo se Relacionan los Cuatro Pilares

```
┌─────────────────────────────────────────────────────────────────┐
│  CATEGORÍAS (jerarquía con parent_id)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Electrónicos (id=18)                                     │  │
│  │  ├─ TV (id=22, parent_id=18)                             │  │
│  │  │   ├── definición atributo: pulgadas (NUMBER,  │  │
│  │  │   │        is_variant_attribute=true)                  │  │
│  │  │   ├── definición atributo: tasa_refresco (LIST, │  │
│  │  │   │        is_variant_attribute=false)                 │  │
│  │  │   └── tag: "Smart TV" (category_id=22, exclusivo)    │  │
│  │  └─ Audio (id=23, parent_id=18)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  PRODUCTOS                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Samsung QLED 55" (PROD_A, id_category=22)                │  │
│  │  ├─ VARIANTES: {pulgadas:"55"}, {pulgadas:"65"}         │  │
│  │  │    (c/u con SKU, barcode, stock, precio propios)      │  │
│  │  ├─ ATTR PROD: tasa_refresco=120, marca=Samsung          │  │
│  │  └─ TAGS: Smart TV (heredado por estar en TV)            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Jerarquía de Herencia

| Nivel | Qué define | Se hereda a... | Ejemplo |
|-------|-----------|----------------|---------|
| **Categoría raíz** | Tags globales (`category_id=null`), atributos globales | TODAS las subcategorías y productos | tag "Oferta" visible en toda la tienda |
| **Subcategoría** | Atributos específicos, tags exclusivos | Sus productos (y sub-subcategorías) | atributo `pulgadas` solo en TV |
| **Producto** | Tags asignados, atributos de producto | Sus variantes (para stock/precio) | tag "Nuevo" en Samsung QLED |
| **Variante** | `variant_attributes` (color, talla, pulgadas) | Su propia fila de stock y precio | variante pulgadas=55 con stock=10 |

### Cuadro Resumen: ¿Qué se Define Dónde?

| | Categoría | Atributo | Tag | Variante |
|---|---|---|---|---|
| **¿Jerarquía?** | Sí (`parent_id`) | Sí (hereda vía CTE de categorías) | Sí (`category_id`: global o exclusivo) | No (siempre bajo un producto) |
| **¿Parte stock?** | No | Si `is_variant_attribute=true` → se busca en variantes | No | **Sí** — cada variante es un SKU independiente |
| **¿Filtrable?** | Sí (búsqueda incluye subcategorías) | Sí (`is_filterable=true`) | Sí (`tag_slugs` en búsqueda) | Sí (vía `is_variant_attribute`) |
| **¿Visible en facetas?** | No directamente | Sí (facetas de atributo) | Sí (faceta de tag) | Sí (vía `is_variant_attribute`) |
| **Ejemplo** | Electrónicos > TV > OLED | `pulgadas`, `color`, `material` | "Oferta", "Smart TV", "4K" | TV 55" Negro, TV 65" Negro |

---

## ¿Cuándo usar cada sistema?

Antes éramos dos: `variant_attributes` vs `product_attributes`. Ahora con categorías y tags, el panorama completo es:

Una fuente común de confusión: ¿esto va en `variant_attributes`, `product_attributes`, como tag, o como categoría?

### Los 4 Pilares de Decisión

| Pregunta | Respuesta | Usar |
|----------|-----------|------|
| ¿Este concepto tiene jerarquía (padre → hijos) y quiero que los hijos hereden atributos? | Sí → es una **categoría** | `POST /category/` con `parent_id` |
| ¿Este dato parte el inventario en SKUs independientes (cada combinación tiene su propio stock y precio)? | Sí → es un **atributo de variante** | `variant_attributes` (JSONB en `product_variants`) |
| ¿Este dato describe el producto pero NO afecta el stock (aplica por igual a todas las variantes)? | Sí → es un **atributo de producto** | `product_attributes` (EAV tipado) |
| ¿Es una etiqueta transversal o de marketing que quiero usar para agrupar/filtrar productos? | Sí → es un **tag** | `POST /api/v1/tags` + asignar a producto |

### Comparativa Detallada

| | Categoría | `variant_attributes` | `product_attributes` | Tag |
|---|---|---|---|---|
| **Propósito** | Organizar productos en jerarquía con herencia | Dividir inventario en SKUs independientes | Describir el producto sin afectar stock | Etiquetar para agrupación y marketing |
| **¿Crea stock separado?** | No | Sí — cada combinación tiene su propia fila | No | No |
| **Ejemplos** | Electrónicos > TV, Ropa > Calzado | talle, color, voltaje, RAM, pulgadas | material, origen, garantía_meses, tasa_refresco | "Oferta", "Nuevo", "Smart TV", "4K" |
| **¿Herencia?** | Sí — atributos y tags de categoría padre bajan a hijos | No | Sí — hereda definiciones de la categoría | Sí — tags globales (`category_id=null`) aplican a todos |
| **¿Scope?** | Jerarquía completa con `parent_id` | Siempre bajo un producto padre | Siempre bajo un producto | Global (`category_id=null`) o exclusivo de categoría |
| **Endpoint** | `POST /category/`, `GET /category/tree` | `POST /products/{id}/variants` | `PUT /products/{id}/attributes/{attrId}` | `POST /api/v1/tags`, `POST /products/{id}/tags/{tagId}` |
| **Búsqueda** | `category_id` incluye subcategorías automáticamente | ✅ con `is_variant_attribute=true` | ✅ con `is_filterable=true` | ✅ `tag_slugs` en search/advanced |

**Regla práctica — árbol de decisión:**
1. ¿Es una clasificación jerárquica donde los hijos heredan propiedades? → **Categoría** (`parent_id`)
2. ¿Cambia el stock o el precio según el valor? → **`variant_attributes`** (con `is_variant_attribute=true`)
3. ¿Describe el producto pero no afecta stock/precio por valor? → **`product_attributes`**
4. ¿Es una etiqueta de agrupación transversal (ofertas, novedades, colecciones)? → **Tag**

**Ejemplo concreto — TV Samsung QLED 55":**
```
# PASO 0: Configurar jerarquía de categorías
POST /category/  { name: "Electrónicos" }
POST /category/  { name: "TV", parent_id: 18 }

# PASO 1: Definir atributos EN LA CATEGORÍA TV (id=22)
POST /attributes/definitions  { category_id: 22, code: "pulgadas", data_type: "NUMBER",
    is_variant_attribute: true, is_filterable: true }
POST /attributes/definitions  { category_id: 22, code: "tasa_refresco", data_type: "LIST",
    options: ["60","120","144"], is_variant_attribute: false, is_filterable: true }

# PASO 2: Crear producto en la categoría TV
POST /products  { name: "Samsung QLED", id_category: 22 }

# PASO 3: Crear variantes (parten stock) — SOLO pulgadas
POST /products/TV_001/variants  { variant_attributes: {"pulgadas":55}, initial_stock:10 }
POST /products/TV_001/variants  { variant_attributes: {"pulgadas":65}, initial_stock:5 }

# PASO 4: Atributo de producto (no parte stock) — tasa_refresco
PUT /products/TV_001/attributes/TASA_REFRESCO_ID  { value_text: "120" }

# PASO 5: Tags — "Smart TV" exclusivo de la categoría TV, "Oferta" global
POST /api/v1/tags  { name: "Smart TV", category_id: 22 }
POST /api/v1/tags  { name: "Oferta" }   # category_id=null → global
POST /products/TV_001/tags/1   # Asignar "Oferta"
POST /products/TV_001/tags/2   # Asignar "Smart TV"

# RESULTADO: Al buscar en Electrónicos (id=18), aparecen TVs (subcategoría incluida).
# Filtrar por pulgadas=55 encuentra TV_001 porque is_variant_attribute=true busca en variantes.
# Filtrar por tasa_refresco=120 encuentra TV_001 (atributo de producto).
# Filtrar por tag_slugs=["smart-tv"] encuentra solo productos en categoría TV.
```

---

## Flujo 0: Gestionar Jerarquía de Categorías

Este es el primer paso antes de crear productos. Las categorías definen la estructura del catálogo y son el ancla para atributos, tags y herencia.

### 0.1 Visualizar el árbol de categorías

```http
GET /category/tree
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 18,
    "name": "Electrónicos",
    "parent_id": null,
    "children": [
      {
        "id": 22,
        "name": "TV",
        "parent_id": 18,
        "children": []
      },
      {
        "id": 23,
        "name": "Audio",
        "parent_id": 18,
        "children": [
          {
            "id": 25,
            "name": "Parlantes",
            "parent_id": 23,
            "children": []
          }
        ]
      }
    ]
  }
]
```

**Uso en frontend:**
```javascript
// Sidebar de navegación con subcategorías expandibles
async function loadCategoryNav() {
  const tree = await api.get('/category/tree');
  return buildNavTree(tree, 0);

  function buildNavTree(nodes, depth) {
    return nodes.map(cat => ({
      id: cat.id,
      label: cat.name,
      children: cat.children.length > 0 ? buildNavTree(cat.children, depth + 1) : undefined
    }));
  }
}
```

### 0.2 Crear subcategoría

```http
POST /category/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "TV",
  "description": "Televisores y pantallas",
  "parent_id": 18
}
```

**Response (201 Created):**
```json
{ "message": "Categoría creada exitosamente" }
```

| `parent_id` | Comportamiento |
|-------------|---------------|
| `null` o ausente | Categoría raíz (nivel 0) |
| ID de categoría existente | Subcategoría — hereda atributos del padre |
| `0` (solo en PUT update) | Quitar padre, volver raíz |

### 0.3 Validaciones de jerarquía

Al asignar `parent_id`, el backend valida automáticamente:

| Validación | Error (400) |
|-----------|-------------|
| El padre debe existir | "La categoría padre no existe" |
| No puede ser su propio padre | "Una categoría no puede ser su propia padre" |
| No puede crear ciclos (A→B→A) | "Esta relación crearía un ciclo en la jerarquía de categorías" |

**Ejemplo de ciclo rechazado:**
```http
# Electrónicos (id=18) > TV (id=22, parent_id=18)
PUT /category/18
{ "parent_id": 22 }
# → 400: "Esta relación crearía un ciclo en la jerarquía de categorías"
```

### 0.4 UI para mover categorías en el árbol

```javascript
async function moveCategory(categoryId, newParentId) {
  try {
    await api.put(`/category/${categoryId}`, {
      parent_id: newParentId === null ? 0 : newParentId
    });
    // Refrescar árbol
    await loadCategoryNav();
  } catch (err) {
    if (err.status === 400) {
      // Mostrar mensaje: "No se puede mover aquí — crearía un ciclo"
      showError(err.message);
    }
  }
}
```

### 0.5 Lista plana vs árbol: cuándo usar cada uno

| Endpoint | Formato | Usar para |
|----------|---------|-----------|
| `GET /category/` | Lista plana `[{id, name, parent_id}]` | Dropdowns, selectores simples, formularios |
| `GET /category/tree` | Árbol anidado `[{id, name, children}]` | Sidebar de navegación, breadcrumbs, menú jerárquico |

**Performance:** Ambos endpoints solo retornan categorías activas. Si necesita TODAS (incluyendo inactivas), use `GET /category/` y filtre en el frontend (el endpoint tree solo devuelve activas).

---

## Flujo 1: Setup Completo — Electrónicos > TV

### Escenario

Montar el catálogo completo para una tienda de electrónica: crear la categoría "TV", definir atributos, crear un producto con variantes por pulgadas, y etiquetarlo.

### Paso 1: Verificar/crear la categoría padre

```http
GET /category/tree
Authorization: Bearer <token>
```

Si "Electrónicos" no existe:

```http
POST /category/
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Electrónicos" }
```

### Paso 2: Crear subcategoría "TV"

```http
POST /category/
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "TV", "description": "Televisores", "parent_id": 18 }
```

### Paso 3: Definir atributos en la categoría TV

```http
POST /api/v1/attributes/definitions
{
  "category_id": 22,
  "name": "Pulgadas",
  "code": "pulgadas",
  "data_type": "NUMBER",
  "is_filterable": true,
  "is_variant_attribute": true,
  "is_visible": true,
  "display_order": 1,
  "unit_suffix": "\""
}

POST /api/v1/attributes/definitions
{
  "category_id": 22,
  "name": "Tasa de Refresco",
  "code": "tasa_refresco",
  "data_type": "LIST",
  "is_filterable": true,
  "is_variant_attribute": false,
  "is_visible": true,
  "display_order": 2,
  "options": ["60", "120", "144"]
}
```

| Atributo | ¿Parte stock? | Estrategia |
|----------|--------------|-----------|
| `pulgadas` | Sí — cada tamaño es un SKU diferente | `is_variant_attribute: true` — se busca en variantes |
| `tasa_refresco` | No — mismo modelo puede tener 120Hz, es una propiedad | `is_variant_attribute: false` — se busca en product_attributes |

### Paso 4: Crear tags (global + exclusivo)

```http
POST /api/v1/tags
{ "name": "Oferta", "slug": "oferta", "color": "#FF5733" }

POST /api/v1/tags
{ "name": "Smart TV", "slug": "smart-tv", "color": "#33AFFF", "category_id": 22 }
```

**Efecto del scope:**
- Tag "Oferta" (`category_id=null`) → se puede asignar a cualquier producto
- Tag "Smart TV" (`category_id=22`) → solo se puede asignar a productos en la categoría TV
- Si se intenta asignar "Smart TV" a un producto de Audio → 400: "el tag pertenece a la categoría TV"

### Paso 5: Crear producto

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Samsung QLED",
  "id_unit": "UN",
  "id_category": 22,
  "brand_id": 1,
  "price_includes_tax": true
}
```

**Response:** `{ "id": "TV_SAMSUNG_QLED", ... }`

### Paso 6: Crear variantes (pulgadas=55, pulgadas=65)

```http
POST /products/TV_SAMSUNG_QLED/variants
{
  "variant_attributes": {"pulgadas": 55},
  "initial_stock": 10,
  "initial_price": 3500000,
  "stock_branch_id": 1
}

POST /products/TV_SAMSUNG_QLED/variants
{
  "variant_attributes": {"pulgadas": 65},
  "initial_stock": 5,
  "initial_price": 5200000,
  "stock_branch_id": 1
}
```

### Paso 7: Asignar atributo de producto (tasa_refresco)

```http
# Primero obtener el ID de la definición de tasa_refresco
GET /api/v1/attributes/definitions?code=tasa_refresco&category_id=22
# → { "id": 42, ... }

PUT /products/TV_SAMSUNG_QLED/attributes/42
{ "value_text": "120" }
```

### Paso 8: Asignar tags al producto

```http
POST /products/TV_SAMSUNG_QLED/tags/1   # "Oferta" (global)
POST /products/TV_SAMSUNG_QLED/tags/2   # "Smart TV" (exclusivo TV)
```

### Resultado final

```
Electrónicos (id=18)
  └─ TV (id=22, parent_id=18)
       └─ Samsung QLED (TV_SAMSUNG_QLED, id_category=22)
            ├─ Variante 55" — stock=10, precio=3.500.000
            ├─ Variante 65" — stock=5,  precio=5.200.000
            ├─ Atributo: tasa_refresco=120
            └─ Tags: Oferta (global), Smart TV (exclusivo TV)
```

Al buscar:
- `category_id=18` → encuentra Samsung QLED (TV es subcategoría de Electrónicos)
- `attributes: {pulgadas: [55]}` → encuentra el producto (busca en variantes)
- `attributes: {tasa_refresco: ["120"]}` → encuentra el producto (busca en product_attributes)
- `tag_slugs: ["smart-tv"]` → encuentra solo productos en categoría TV

---

## Flujo 2: UI de Selector de Variantes

### 2.1 Obtener datos iniciales

```http
# Obtener producto con atributos aplicables
GET /api/v1/products/PROD_001/applicable-attributes

# Obtener variantes existentes
GET /api/v1/products/PROD_001/variants

# Obtener stock por sucursal para cada variante
GET /api/v1/variants/VAR_001/stock?branch_id=1
```

### 2.2 Construir UI de selección

La UI típica tiene dos patrones:

#### Patrón A: Selectores independientes (color + talla)

```
┌─────────────────────────────────────────────────┐
│ Camisa Polo                                     │
│                                                  │
│ Color:  [Rojo ▾]    Talla:  [M ▾]               │
│                                                  │
│ Variante: Rojo / M — Stock: 50 unid             │
│ Precio: Gs. 85.000                               │
│                        [Agregar al carrito]       │
└─────────────────────────────────────────────────┘
```

**Lógica para filtrar disponibilidad:**

```javascript
// 1. Cargar todas las variantes del producto
const variants = await api.get(`/products/${productId}/variants`);

// 2. Extraer opciones únicas por atributo
const colors = [...new Set(variants.map(v => v.variant_attributes.color))];
const tallas = [...new Set(variants.map(v => v.variant_attributes.talla))];

// 3. Al seleccionar "Rojo", filtrar tallas disponibles
const tallasDisponibles = variants
  .filter(v => v.variant_attributes.color === "Rojo" && v.is_active);

// 4. Al seleccionar ambas, obtener la variante exacta
const selectedVariant = variants.find(v =>
  v.variant_attributes.color === "Rojo" &&
  v.variant_attributes.talla === "M"
);

// 5. Consultar stock de la variante seleccionada
const stock = await api.get(`/variants/${selectedVariant.id}/stock?branch_id=1`);
```

#### Patrón B: Tabla/matriz de variantes

|     | S   | M   | L   | XL  |
|-----|-----|-----|-----|-----|
| Rojo | 50 | 30 | 20 | 0  |
| Azul | 40 | 25 | 15 | 10 |
| Negro | 35 | 20 | 0  | 5  |

**Implementación:**

```javascript
const variantMatrix = {};
for (const v of variants) {
  const color = v.variant_attributes.color;
  const talla = v.variant_attributes.talla;
  if (!variantMatrix[color]) variantMatrix[color] = {};
  variantMatrix[color][talla] = v;
}

// Consultar stock por lote (batch)
const stockMap = {};
for (const [color, tallas] of Object.entries(variantMatrix)) {
  for (const [talla, variant] of Object.entries(tallas)) {
    stockMap[variant.id] = await api.get(`/variants/${variant.id}/stock?branch_id=1`);
  }
}
```

### 2.3 Validaciones del frontend

| Regla | Dónde validar |
|-------|--------------|
| `variant_attributes` no puede estar vacío | En el formulario de creación |
| Atributo `LIST` debe ser uno de los `options` definidos | Select/combobox restringido |
| `barcode` debe ser único entre productos y variantes | El backend devuelve 409 si duplicado |
| `initial_stock` requiere `stock_branch_id` y viceversa | Ambos campos obligatorios juntos |
| Producto con variantes activas requiere `variant_id` en ventas | Validar antes de enviar al POS |

---

## Flujo 3: Barcode Scanning con Variantes

### 3.1 Escaneo en POS

```javascript
async function scanBarcode(barcode) {
  const result = await api.post('/api/v1/barcode/scan', { barcode });

  if (result.variant_id) {
    // El barcode pertenece a una variante
    return {
      product_id: result.parent_product_id || result.id,
      variant_id: result.variant_id,
      name: result.variant_name || result.name,
      attributes: result.variant_attributes
    };
  } else {
    // El barcode pertenece al producto padre
    // Si tiene variantes activas, la UI debe mostrar selector
    return {
      product_id: result.id,
      variant_id: null,
      name: result.name,
      has_variants: result.has_variants
    };
  }
}
```

### 3.2 Responder a `has_variants`

Cuando el barcode es del producto padre y `has_variants === true`, el backend no puede determinar qué variante vender. La UI debe:

1. Mostrar selector de variantes con stock disponible
2. El usuario elige color/talla
3. Enviar `variant_id` en `product_details` del POST de venta

### 3.3 Detección de Variantes en Búsqueda de Productos

> **Actualizado (2026-07-02):** Los endpoints de búsqueda ahora retornan `has_variant` y `variant_count` directamente. Ya no es necesario hacer una segunda llamada para determinar si un producto tiene variantes.

Los siguientes endpoints de búsqueda incluyen los campos `has_variant` (boolean) y `variant_count` (integer):

| Endpoint | Retorna | Incluye variantes |
|----------|---------|-------------------|
| `GET /products/search/{name}` | `[]ProductEnriched` | `has_variant`, `variant_count` |
| `POST /products/search/advanced` | `[]SearchResultProduct` | `has_variant`, `variant_count` |
| `GET /products/{id}/purchase` | `ProductOperationInfoResponse` | `has_variant`, `variant_count`, `variants[]` |
| `GET /products/{id}/sale` | `ProductOperationInfoResponse` | `has_variant`, `variant_count`, `variants[]` |

#### Ejemplo de respuesta de búsqueda

```json
{
  "id": "PROD_001",
  "name": "Camisa Polo",
  "has_variant": true,
  "variant_count": 6,
  "stock_quantity": 45,
  "current_price": 150000
}
```

#### Flujo recomendado para el frontend

```javascript
// 1. Buscar productos
const products = await api.get('/products/search/camisa');

// 2. Al seleccionar un producto, verificar has_variant
const selected = products.find(p => p.id === 'PROD_001');

if (selected.has_variant) {
  // 3a. Si tiene variantes, fetch-ear las variantes
  const { variants } = await api.get(`/products/${selected.id}/variants`);
  // Mostrar selector de variantes
} else {
  // 3b. Producto simple, agregar directo al carrito
}
```

#### Endpoints de operación (compra/venta)

Los endpoints `GET /products/{id}/purchase` y `GET /products/{id}/sale` ahora incluyen las variantes activas directamente en la respuesta:

```json
{
  "product_id": "PROD_001",
  "product_name": "Camisa Polo",
  "has_variant": true,
  "variant_count": 6,
  "variants": [
    {
      "id": "VAR_001",
      "sku": "POL-ROJ-M",
      "variant_name": "Camisa Polo - color: rojo / talla: M",
      "variant_attributes": {"color": "rojo", "talla": "M"},
      "is_active": true
    }
  ],
  "unit_prices": [...],
  "stock_quantity": 45
}
```

Esto permite al frontend mostrar las variantes sin una llamada adicional al seleccionar un producto para compra o venta.

---

## Flujo 4: Búsqueda con Categorías, Tags y Atributos

### 4.1 Búsqueda avanzada (todo combinado)

```http
POST /products/search/advanced
{
  "search": "samsung",
  "category_id": 18,
  "tag_slugs": ["smart-tv"],
  "brand_ids": [1],
  "attributes": {
    "pulgadas": [55],
    "tasa_refresco": ["120"]
  },
  "in_stock_only": true,
  "price_min": "2000000",
  "price_max": "6000000",
  "sort_by": "price_asc",
  "page": 1,
  "page_size": 20,
  "branch_id": 1
}
```

**Comportamiento de `category_id`:**
- `category_id=18` (Electrónicos) → encuentra productos en Electrónicos **Y** en TV, Audio, Parlantes y cualquier subcategoría
- `category_id=22` (TV) → solo productos en TV
- `category_ids=[18, 5]` → productos en Electrónicos (incluyendo subcategorías) **O** en Ropa (incluyendo subcategorías)

**Comportamiento de `attributes`:**
- `is_variant_attribute=true` → busca en `variant_attributes` (JSONB de variantes) **O** `product_attributes` (fallback)
- `is_variant_attribute=false` → busca solo en `product_attributes` (EAV)
```

### 4.2 Renderizar tags en card de producto

```javascript
function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <span>{product.brand_name}</span>

      {/* Tags con color + icono */}
      {product.tags.map(tag => (
        <span
          key={tag.id}
          style={{ backgroundColor: tag.color || '#ccc' }}
          className="tag-badge"
        >
          {tag.icon && <Icon name={tag.icon} />}
          {tag.name}
        </span>
      ))}

      {/* Atributos */}
      {product.attributes.map(attr => (
        <span key={attr.attribute_id}>
          {attr.attribute_name}: {attr.value_text || attr.value_number}
          {attr.unit_suffix}
        </span>
      ))}

      <span>Gs. {product.current_price?.toLocaleString()}</span>
      <span>Stock: {product.stock_quantity}</span>
    </div>
  );
}
```

### 4.3 Facetas para filtros

```http
GET /products/search/facets?category_id=22&branch_id=1
```

La respuesta incluye facetas de:
- **Marca** (`code: "brand"`) — lista de marcas con conteo
- **Tags** (`code: "tag"`) — tags disponibles con conteo
- **Atributos filtrables** (ej: `code: "pulgadas"`) — opciones con conteo. Si `is_variant_attribute=true`, incluye valores de variantes Y product_attributes
- **Rango de precios** (`code: "price"`) — min/max

**Sidebar de filtros con árbol de categorías:**
```javascript
async function buildFilterSidebar() {
  // 1. Cargar árbol de categorías para el menú de navegación
  const categoryTree = await api.get('/category/tree');

  // 2. Cargar facetas para la categoría seleccionada
  const facets = await api.get(`/products/search/facets?category_id=${selectedCategoryId}`);

  // 3. Renderizar sidebar combinado:
  //    - Árbol de categorías (colapsable, con children)
  //    - Filtros de marca (de facets.brands)
  //    - Filtros de tags (de facets.tags)
  //    - Filtros de atributos (de facets dinámicos, ej: facets.pulgadas)
  //    - Rango de precios (de facets.price)
}
```

---

## Flujo 5: Tags en Listados (sin N+1)

Los endpoints de listado de productos (`GET /api/v1/products` y `GET /api/v1/products/search/advanced`) retornan tags inline en cada producto. **No haga requests adicionales por cada producto.**

```json
{
  "id": "PROD_001",
  "name": "Camisa Polo",
  "tags": [
    {"id": 1, "name": "Nuevo", "slug": "nuevo", "color": "#FF5733"},
    {"id": 2, "name": "Oferta", "slug": "oferta", "color": "#00FF00"}
  ]
}
```

Solo use `GET /api/v1/products/{id}/tags` cuando necesite los tags de UN producto individual (ficha de detalle) y el producto no venga de un listado ya enriquecido.

---

## Flujo 6: Asignar Tags Masivamente

Para asignar un tag a múltiples productos (ej: marcar todos los productos de una categoría como "Oferta"):

```javascript
async function assignTagToCategory(categoryId, tagId) {
  // 1. Buscar todos los productos de la categoría
  const result = await api.post('/api/v1/products/search/advanced', {
    category_id: categoryId,
    page_size: 100
  });

  // 2. Asignar tag a cada producto (paralelo con límite)
  const batchSize = 5;
  for (let i = 0; i < result.data.length; i += batchSize) {
    const batch = result.data.slice(i, i + batchSize);
    await Promise.all(batch.map(p =>
      api.post(`/api/v1/products/${p.id}/tags/${tagId}`)
    ));
  }
}
```

---

## Flujo 7: Tags Globales vs Exclusivos por Categoría

### 7.1 Scope de tags

Los tags tienen un campo `category_id` que define su alcance:

| `category_id` | Scope | Ejemplo | Se puede asignar a |
|--------------|-------|---------|-------------------|
| `null` | **Global** — visible en todas las categorías | "Oferta", "Nuevo", "Destacado" | Cualquier producto |
| ID de categoría | **Exclusivo** — solo para productos de esa categoría | "Smart TV" (solo TV), "4K" (solo TV) | Solo productos cuyo `id_category` coincida |

### 7.2 Crear tag exclusivo

```http
POST /api/v1/tags
{
  "name": "4K UHD",
  "slug": "4k-uhd",
  "color": "#9B59B6",
  "category_id": 22
}
```

### 7.3 Validación al asignar

```http
# Producto en categoría TV (id_category=22), tag "4K UHD" (category_id=22) → OK
POST /products/TV_SAMSUNG_QLED/tags/3
# → 200

# Producto en categoría Audio (id_category=23), tag "4K UHD" (category_id=22) → ERROR
POST /products/PARLANTE_BLUETOOTH/tags/3
# → 400: "El tag '4K UHD' pertenece a la categoría TV y no puede asignarse a este producto"
```

### 7.4 Cambiar tag de exclusivo a global

```http
PUT /api/v1/tags/3
{ "category_id": 0 }
# category_id=0 → el tag pasa a ser global y puede asignarse a cualquier producto
```

### 7.5 UI para gestión de tags

```javascript
// Dropdown de tags disponibles: filtrar por categoría del producto
async function getAvailableTags(productCategoryId) {
  const allTags = await api.get('/api/v1/tags');

  return allTags.filter(tag =>
    tag.category_id === null ||           // tags globales
    tag.category_id === productCategoryId  // tags de esta categoría
  );
}
```

---

## Timing de Cache y Refresh

### Cómo funciona

| Acción | Refresco de catálogo | Tiempo |
|--------|---------------------|--------|
| Crear/editar/eliminar variante | Trigger PostgreSQL → `pg_notify('catalog_change')` → worker refresca `mv_product_catalog` | ~2-3 segundos |
| Asignar/quitar tag de producto | Trigger en `product_tags` → `pg_notify` → refresh | ~2-3 segundos |
| Editar/eliminar tag | Trigger en `tags` → `pg_notify` → refresh | ~2-3 segundos |
| Cambio de stock/precio | Trigger en `stock`/`unit_prices` → `pg_notify` → refresh | ~2-3 segundos |
| Crear/editar categoría | Trigger en `categories` → `pg_notify` → refresh (afecta productos en la categoría y subcategorías) | ~2-3 segundos |
| Cambiar `parent_id` de categoría | Mismo trigger — todos los productos del subárbol afectado se refrescan | ~2-3 segundos |

### Implicaciones para el frontend

- **Después de mutar** (crear variante, asignar tag), los listados pueden mostrar datos stale por 2-3 segundos
- **Estrategia optimista:** actualizar la UI localmente tras la mutación exitosa, sin esperar el refresh
- **Estrategia conservadora:** mostrar spinner/toast "Actualizando catálogo..." y recargar después de 3s
- Para operaciones críticas (POS, inventario), use los endpoints de stock/precio individuales que consultan las tablas fuente directamente

---

## Errores Comunes y Soluciones

| Escenario | Error | Solución |
|-----------|-------|----------|
| Crear variante sin definir atributos en la categoría | 400 "attribute validation failed" | Crear `attribute_definitions` primero. Las definiciones se crean **una vez por categoría**, no por producto |
| Crear subcategoría con padre inexistente | 400 "La categoría padre no existe" | Verificar que el `parent_id` corresponde a una categoría activa: `GET /category/{id}` |
| Mover categoría creando un ciclo | 400 "Esta relación crearía un ciclo" | Verificar que el nuevo padre no sea descendiente de la categoría que se mueve |
| Mover categoría a sí misma | 400 "Una categoría no puede ser su propia padre" | `parent_id` no puede ser igual al `id` de la categoría |
| Asignar tag exclusivo a producto de otra categoría | 400 "El tag pertenece a la categoría X" | El tag solo aplica a productos de la categoría definida en `tag.category_id`. Usar tags globales (`category_id=null`) para etiquetas transversales |
| Confundir `variant_attributes` con `product_attributes` | Datos mal ubicados, stock incorrecto | Si parte el inventario → `variant_attributes` con `is_variant_attribute=true`. Si es descriptivo → `product_attributes` |
| `variant_attributes` usa un valor no listado en `options` | 400 "value 'X' is not in allowed options" | Usar solo valores de la lista de opciones del atributo LIST |
| SKU duplicado | 409 "sku already exists" | Dejar que el sistema auto-genere el SKU o usar un valor único |
| Barcode duplicado | 409 "barcode already in use" | Usar barcode único, o dejar el campo vacío |
| Producto sin variantes → se intenta vender con `variant_id` | 400 "variant_id not applicable" | Enviar sin `variant_id` para productos sin variantes |
| Producto con variantes → se vende sin `variant_id` | El backend permite compra genérica (distribución a variantes) | Válido para compras; para ventas, requerir `variant_id` en frontend |
| Tag "no encontrado" al eliminar | 400 "tag N not found" | Verificar que el tag existe con `GET /api/v1/tags/{id}` |
| `initial_stock` sin `stock_branch_id` | 400 "must be provided together" | Ambos campos son requeridos juntos |
| Filtrar por atributo de variante sin resultados | El atributo no tiene `is_variant_attribute=true` | Verificar la definición: `GET /attributes/definitions/{id}` y confirmar el flag |
| El árbol de categorías no muestra una categoría | La categoría está inactiva (`is_active=false`) | `GET /category/tree` solo muestra activas. Usar `GET /category/{id}` para ver inactivas |

---

## Resumen de Endpoints Usados

### Categorías

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/category/` | GET | Lista plana de categorías activas |
| `/category/tree` | GET | Árbol jerárquico anidado (sidebar) |
| `/category/` | POST | Crear categoría (con `parent_id` opcional) |
| `/category/{id}` | GET | Obtener categoría por ID |
| `/category/{id}` | PUT | Actualizar categoría (mover en el árbol) |
| `/category/{id}` | DELETE | Soft-delete (marcar inactiva) |

### Atributos y Plantillas

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/products/{id}/applicable-attributes` | GET | Atributos que aplican a un producto (herencia categoría) |
| `/api/v1/attributes/definitions` | GET / POST | Listar/crear definiciones de atributos |
| `/api/v1/attributes/definitions/{id}` | GET / PUT / DELETE | CRUD de definición |
| `/api/v1/attributes/templates` | GET | Plantillas predefinidas (ROPA, ELECTRONICA, etc.) |
| `/api/v1/attributes/templates/{id}/apply` | POST | Aplicar plantilla a categoría |

### Variantes

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/products/{id}/variants` | GET | Listar variantes del producto |
| `/products/{id}/variants` | POST | Crear nueva variante |
| `/api/v1/variants/{id}` | GET / PUT / DELETE | CRUD de variante individual |
| `/api/v1/variants/{id}/stock?branch_id=X` | GET | Stock de una variante específica |
| `/products/{id}/total-stock` | GET | Stock total (suma de variantes) |

### Tags

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/api/v1/tags` | GET / POST | Listar/crear tags |
| `/api/v1/tags/{id}` | GET / PUT / DELETE | CRUD de tag individual |
| `/products/{id}/tags` | GET | Tags de un producto individual |
| `/products/{id}/tags/{tagId}` | POST / DELETE | Asignar/quitar tag de producto |

### Búsqueda

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/products/search/advanced` | POST | Búsqueda con filtros de categoría, tags y atributos |
| `/products/search/facets` | GET | Facetas para construir UI de filtros |

---

**Última actualización:** 22 de Junio de 2026
**Versión:** 2.0.0
**Estado:** ✅ Production Ready

---

## Historial de Cambios

### v2.0.0 - Junio 2026
- **REESCRITURA**: Guía renombrada a "Categorías, Variantes, Atributos y Tags" — ahora cubre los 4 pilares del catálogo.
- **NUEVO**: Sección "Arquitectura Conceptual" con diagrama de jerarquía y tabla de herencia.
- **NUEVO**: "Los 4 Pilares de Decisión" — preguntas para elegir entre categoría, variante, atributo, tag.
- **NUEVO**: Flujo 0 — Gestión de jerarquía de categorías (`GET /category/tree`, mover, validaciones de ciclo).
- **NUEVO**: Flujo 1 — Setup completo Electrónicos > TV con los 4 pilares integrados (8 pasos).
- **NUEVO**: Flujo 7 — Tags globales vs exclusivos por categoría (scope, validación al asignar, UI de filtrado).
- **ACTUALIZADO**: Flujo 4 — Búsqueda avanzada ahora documenta `category_id` con subcategorías automáticas.
- **ACTUALIZADO**: Flujo 4.3 — Sidebar de filtros incluye árbol de categorías + facetas.
- **ACTUALIZADO**: Tabla de errores — +6 escenarios nuevos (ciclos, tag scope, categorías inactivas, `is_variant_attribute`).
- **ACTUALIZADO**: Tabla de endpoints — reorganizada por módulo (Categorías, Atributos, Variantes, Tags, Búsqueda).

### v1.0.0 - Junio 2026
- Versión inicial: variantes, atributos y tags.

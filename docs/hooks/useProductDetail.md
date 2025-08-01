# Hook useProductDetail - Ejemplos de Uso

## Descripción
Hook personalizado para gestionar los detalles de un producto individual, con soporte para datos enriquecidos y actualizaciones.

## Importación
```javascript
import { useProductDetail, useProduct } from '@/hooks/useProductDetail';
```

## Uso Básico

### 1. Obtener un producto con datos enriquecidos
```javascript
import { useProduct } from '@/hooks/useProductDetail';

function ProductDetailPage({ productId }) {
  const { product, loading, error } = useProduct(productId, true);

  if (loading) return <div>Cargando producto...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!product) return <div>Producto no encontrado</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Precio: {product.price_formatted}</p>
      <p>Stock: {product.stock_quantity} ({product.stock_status})</p>
      <p>Descripción: {product.description}</p>
    </div>
  );
}
```

### 2. Control manual de carga
```javascript
import { useProductDetail } from '@/hooks/useProductDetail';

function ProductManager() {
  const { 
    product, 
    loading, 
    error, 
    loadProduct, 
    refreshProduct,
    updateProduct 
  } = useProductDetail(null, { autoLoad: false });

  const handleLoadProduct = async (id) => {
    try {
      await loadProduct(id);
    } catch (err) {
      console.error('Error al cargar producto:', err);
    }
  };

  const handleRefresh = () => {
    refreshProduct();
  };

  return (
    <div>
      <button onClick={() => handleLoadProduct('PROD_001')}>
        Cargar Producto
      </button>
      
      {product && (
        <div>
          <h2>{product.name}</h2>
          <button onClick={handleRefresh}>
            Actualizar
          </button>
        </div>
      )}
    </div>
  );
}
```

### 3. Con callbacks personalizados
```javascript
import { useProductDetail } from '@/hooks/useProductDetail';

function ProductWithCallbacks({ productId }) {
  const { product, loading, error } = useProductDetail(productId, {
    enriched: true,
    onSuccess: (productData) => {
      console.log('Producto cargado:', productData.name);
    },
    onError: (error) => {
      console.error('Error al cargar:', error.message);
    }
  });

  // ... resto del componente
}
```

## API del Hook

### useProductDetail(productId, options)
**Parámetros:**
- `productId` (string): ID del producto a cargar
- `options` (object):
  - `enriched` (boolean): Si obtener datos enriquecidos (default: true)
  - `autoLoad` (boolean): Si cargar automáticamente al montar (default: true)
  - `onSuccess` (function): Callback ejecutado al cargar exitosamente
  - `onError` (function): Callback ejecutado en caso de error

**Retorna:**
- `product`: Datos del producto
- `loading`: Estado de carga
- `error`: Mensaje de error (si existe)
- `loadProduct(id)`: Función para cargar un producto específico
- `refreshProduct()`: Función para recargar el producto actual
- `updateProduct(updates)`: Función para actualizar el producto
- `setProduct`: Setter para actualizaciones locales
- `setError`: Setter para limpiar errores

### useProduct(productId, enriched)
Hook simplificado que solo obtiene un producto.

**Parámetros:**
- `productId` (string): ID del producto
- `enriched` (boolean): Si obtener datos enriquecidos (default: true)

**Retorna:**
- `product`: Datos del producto
- `loading`: Estado de carga
- `error`: Mensaje de error

## Datos Enriquecidos

Cuando se usa `enriched: true`, el producto incluye:

### Información de Precios
- `price_formatted`: Precio formateado
- `has_unit_pricing`: Si tiene precios por unidad
- `has_valid_price`: Si el precio es válido
- `price_updated_at`: Última actualización de precio
- `unit_prices[]`: Array de precios por unidad

### Información de Stock
- `stock_quantity`: Cantidad actual
- `stock_status`: Estado del stock (in_stock, medium_stock, low_stock, out_of_stock)
- `has_valid_stock`: Si el stock es válido
- `stock_updated_at`: Última actualización de stock

### Información General
- `description`: Descripción del producto
- `category`: Información completa de la categoría
- `_enriched`: Marca que indica que es un producto enriquecido
- `_source`: Fuente de los datos enriquecidos

## Ejemplo de Respuesta Enriquecida

```json
{
  "id": "PROD_BANANA_001",
  "name": "Banana",
  "state": true,
  "category": {
    "id": 48,
    "name": "Frutas",
    "description": ""
  },
  "category_id": 48,
  "category_name": "Frutas",
  "product_type": "PHYSICAL",
  "user_id": "2prrJIgRvgaFVbuu49ua9QJVu8n",
  "purchase_price": 25,
  "price_id": 104,
  "price_updated_at": "2025-07-28T20:15:25.479113Z",
  "price_updated_by": "2prrJIgRvgaFVbuu49ua9QJVu8n",
  "unit_prices": [
    {
      "id": 9,
      "product_id": "PROD_BANANA_001",
      "unit": "caja",
      "price_per_unit": 380,
      "effective_date": "2025-07-28T20:15:06.956831Z"
    }
  ],
  "has_unit_pricing": true,
  "stock_quantity": 92.4,
  "stock_id": 144,
  "stock_updated_at": "2025-07-28T20:15:58.527885Z",
  "stock_updated_by": "2prrJIgRvgaFVbuu49ua9QJVu8n",
  "description": null,
  "description_id": null,
  "stock_status": "in_stock",
  "price_formatted": "PYG 25",
  "has_valid_stock": true,
  "has_valid_price": true
}
```

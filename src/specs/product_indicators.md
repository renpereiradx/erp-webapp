# Mejoras para Indicadores de Producto

## Observaciones

Se obtienen exitosamente los datos desde la API. Por ejemplo, al abrir el modal activado por el botón **Ver**, se muestra un `div` con el debug de la estructura del producto. Ejemplo de la estructura visible en el modal:

```json
{
    "id": "bcYdWdKNR",
    "name": "Puma MB.01",
    "state": true,
    "is_active": true,
    "category_id": 5,
    "category_name": "Shoes",
    "product_type": "PHYSICAL",
    "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "price": 1250000,
    "purchase_price": 1250000,
    "price_id": 52,
    "price_updated_at": "2025-06-03T14:33:52.613475Z",
    "price_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "price_formatted": "$1250000.00",
    "has_valid_price": true,
    "has_unit_pricing": false,
    "stock_quantity": 12,
    "stock_id": 108,
    "stock_updated_at": "2025-06-03T14:33:52.613475Z",
    "stock_updated_by": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
    "stock_status": "medium_stock",
    "has_valid_stock": true,
    "description": "Lorem ipsun new generated.",
    "description_id": 8,
    "category": {
        "id": 5,
        "name": "Shoes",
        "description": ""
    },
    "_enriched": true,
    "_source": "backend_enriched"
}
```

En el listado de productos, no se muestra el stock. En el modal, los tabs (Información, Stock, Precios, Descripción) están bien organizados, mostrando la información correspondiente y permitiendo editar cada sección.

### Problema Detectado

Al abrir el modal de un producto, se genera el siguiente error en la consola:

```
BusinessManagementAPI.js:89  GET http://localhost:5050/products/bcYdWdKNR/details 404 (Not Found)
```

Este error ocurre porque se realiza una segunda llamada a la API para obtener los detalles del producto, lo cual es innecesario, ya que los datos ya están disponibles en el estado del componente. 

### Solución Propuesta

- Eliminar la llamada a la API que intenta obtener los detalles del producto al abrir el modal.
- Utilizar los datos ya disponibles en el estado del componente.

---

## Mejoras en los Labels de los Indicadores

- Mejorar la apariencia visual de los labels.

---

## Tab de Descripción

- Todo se muestra correctamente, incluyendo la descripción del producto y la opción para editarla.
- Endpoint para editar: `http://localhost:5050/product_description/8` (donde `8` es el ID de la descripción del producto).
    - **Headers**:
        - `Authorization: <token>`

---

## Tab de Precios

- No se muestran los indicadores de precios obtenidos en el listado de productos.
- Mejorar la ubicación del botón **Configurar**.

---

## Tab de Stock

- No se muestran los indicadores de stock obtenidos en el listado de productos.
- Mejorar la ubicación del botón **Configurar**.

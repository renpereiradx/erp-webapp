## Contexto de la Funcionalidad de Compras

Este documento detalla el modelo de datos y el procedimiento para registrar órdenes de compra en el sistema ERP, proporcionando el contexto necesario para la automatización y validación de procesos relacionados.

### Entidades Principales

#### purchase_orders
| Columna         | Tipo                  | Descripción                                      |
|-----------------|----------------------|--------------------------------------------------|
| id              | integer (PK)         | Identificador único de la orden                   |
| supplier_id     | integer (FK)         | Proveedor asociado                               |
| order_date      | timestamp            | Fecha de la orden                                |
| total_amount    | numeric(10,2)        | Monto total de la orden                          |
| status          | varchar(20)          | Estado: PENDING, COMPLETED, CANCELLED            |
| id_user         | varchar(27) (FK)     | Usuario responsable                              |

#### purchase_order_details
| Columna             | Tipo                  | Descripción                                      |
|---------------------|----------------------|--------------------------------------------------|
| id                  | integer (PK)         | Identificador único del detalle                  |
| purchase_order_id   | integer (FK)         | Orden de compra asociada                         |
| product_id          | varchar(27) (FK)     | Producto incluido                                |
| quantity            | numeric(10,2)        | Cantidad solicitada                              |
| unit_price          | numeric(10,2)        | Precio unitario                                  |
| exp_date            | timestamp            | Fecha de expiración del producto                 |
| id_user             | varchar(27) (FK)     | Usuario que registró el detalle                  |
| tax_rate_id         | integer (FK)         | Tasa de impuesto aplicada                        |

### Procedimiento para Registrar una Orden de Compra

El procedimiento almacenado `transactions.register_purchase_order` es fundamental para el registro de órdenes de compra. Realiza las siguientes acciones:

1. Valida el estado de la orden.
2. Calcula el monto total considerando la tasa de impuesto de cada producto.
3. Inserta la orden principal en `purchase_orders`.
4. Inserta los detalles en `purchase_order_details`.
5. Actualiza el stock y los precios de los productos.

**Parámetros esperados:**
- `p_supplier_id`: ID del proveedor.
- `p_id_user`: Usuario responsable.
- `p_status`: Estado de la orden.
- `p_order_details`: Detalles de la orden en formato JSONB.

La lógica de impuestos utiliza el campo `tax_rate_id` para obtener la tasa vigente desde la tabla `tax_rates`. Si no se encuentra una tasa válida, se asume 0%.

### Ejemplo de Estructura de Solicitud

```go
type PurchaseRequest struct {
    SupplierID    int             `json:"supplier_id"`
    Status        string          `json:"status"`
    PurchaseItems json.RawMessage `json:"purchase_items"`
}
```

`PurchaseItems` es un array JSON con los detalles de cada producto, incluyendo `product_id`, `quantity`, `unit_price`, `tax_rate_id`, y opcionalmente `profit_pct`.

---

### Endpoint

El endpoint para registrar una orden de compra es:

```
POST localhost:5050/purchase/
```

### HTTP Headers

Los headers HTTP necesarios para realizar la solicitud son:

```
Authorization: <token>
```

Este contexto facilita la generación de prompts para automatizar la creación de órdenes de compra, validar datos y extender la funcionalidad del sistema ERP, manteniendo el procedimiento como parte central del flujo.

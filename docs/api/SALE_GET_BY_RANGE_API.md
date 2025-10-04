# Resumen para Equipo Frontend - Endpoint de Ventas por Rango de Fechas

## Endpoint Actualizado

- **Ruta:** `GET /sale/date_range/`
- **Método:** `GET`
- **Autenticación:** JWT requerido

### Request Body

```json
{
    "start_date": "2025-09-01",
    "end_date": "2025-09-30",
    "page": 1,
    "page_size": 50
}
```

**Notas sobre fechas:**
- Si `start_date` tiene formato `YYYY-MM-DD`, se le agrega automáticamente `00:00:00`
- Si `end_date` tiene formato `YYYY-MM-DD`, se le agrega automáticamente `23:59:59`
- También pueden enviar fechas completas con hora: `"2025-09-01 14:30:00"`

---

## Parámetros

| Campo      | Tipo   | Requerido | Descripción                                         | Default |
|------------|--------|-----------|-----------------------------------------------------|---------|
| start_date | string | ✅ Sí      | Fecha de inicio (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)  | -       |
| end_date   | string | ✅ Sí      | Fecha de fin (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)     | -       |
| page       | int    | ❌ No      | Número de página (mínimo 1)                         | 1       |
| page_size  | int    | ❌ No      | Registros por página (máximo 100)                   | 50      |

**Notas:**
- Si `page < 1`, se usa automáticamente `page = 1`
- Si `page_size < 1` o `page_size > 100`, se usa automáticamente `page_size = 50`
- Las fechas en formato `YYYY-MM-DD` se convierten automáticamente:
    - `start_date`: Se agrega `00:00:00`
    - `end_date`: Se agrega `23:59:59`

---

## Response Structure (Con Paginación)

```json
{
    "data": [
        {
            "sale": {
                "sale_id": "TEST_REVERT_001",
                "client_id": "lol0w4wHR",
                "client_name": "Juan Pérez",
                "sale_date": "2025-09-30 15:53:21",
                "total_amount": 2925000.00,
                "status": "PENDING",
                "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
                "user_name": "Carlos Rodriguez",
                "payment_method_id": 1,
                "payment_method": "Efectivo",
                "currency_id": 1,
                "currency": "Peso Chileno",
                "metadata": {
                    "discounts": [
                        {
                            "product_id": "bcYdWdKNR",
                            "product_name": "Puma MB.01",
                            "original_price": 1625000.00,
                            "discount_amount": 162500.00,
                            "discount_percent": 10.00,
                            "final_price": 1462500.00,
                            "discount_type": "fixed_amount",
                            "reason": "Descuento por cliente frecuente",
                            "savings": 162500.00,
                            "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
                            "timestamp": "2025-09-30T15:53:21.29709-03:00"
                        }
                    ]
                }
            },
            "details": [
                {
                    "id": 118,
                    "product_id": "bcYdWdKNR",
                    "product_name": "Puma MB.01",
                    "product_type": "PHYSICAL",
                    "quantity": 2.00,
                    "base_price": 1625000.00,
                    "unit_price": 1462500.00,
                    "discount_amount": 325000.00,
                    "subtotal": 2925000.00,
                    "tax_amount": 0.00,
                    "total_with_tax": 2925000.00,
                    "price_modified": true
                }
            ]
        }
    ],
    "pagination": {
        "page": 1,
        "page_size": 50,
        "total_records": 237,
        "total_pages": 5,
        "has_next": true,
        "has_previous": false
    }
}
```

### Campos de Paginación

| Campo                  | Tipo   | Descripción                                         |
|------------------------|--------|-----------------------------------------------------|
| pagination.page        | int    | Página actual                                       |
| pagination.page_size   | int    | Registros por página                                |
| pagination.total_records | int  | Total de registros encontrados en el rango de fechas|
| pagination.total_pages | int    | Total de páginas disponibles                        |
| pagination.has_next    | bool   | `true` si existe página siguiente                   |
| pagination.has_previous| bool   | `true` si existe página anterior                    |

---

## Campos Importantes

### A Nivel de Venta (`sale`)

| Campo      | Tipo   | Descripción                                                                 |
|------------|--------|------------------------------------------------------------------------------|
| sale_id    | string | ID único de la venta                                                         |
| status     | string | `PENDING`, `PAID`, o `CANCELLED`                                             |
| total_amount | float | Total final de la venta                                                      |
| metadata   | object | **NUEVO:** Contiene descuentos, cambios de precio, y detalles de reservas     |
| metadata.discounts | array | Lista de todos los descuentos aplicados con detalles completos         |
| metadata.price_changes | array | Cambios de precio manuales (si aplica)                             |
| metadata.reserve_details | object | Información de reserva (si la venta incluye una reserva)         |

### A Nivel de Detalle (`details`)

| Campo           | Tipo   | Descripción                                                                                           |
|-----------------|--------|------------------------------------------------------------------------------------------------------|
| product_type    | string | **NUEVO:** `PHYSICAL` o `SERVICE`                                                                    |
| base_price      | float  | **NUEVO:** Precio original del producto                                                              |
| unit_price      | float  | Precio final por unidad (después de descuentos)                                                      |
| discount_amount | float  | **NUEVO:** Monto total de descuento aplicado (`base_price × quantity - unit_price × quantity`)       |
| subtotal        | float  | **NUEVO:** `unit_price × quantity`                                                                   |
| tax_amount      | float  | **NUEVO:** Monto de impuesto calculado                                                               |
| total_with_tax  | float  | **NUEVO:** Subtotal + impuesto                                                                       |
| price_modified  | bool   | **NUEVO:** `true` si el precio fue modificado respecto al precio base                                |
| reserve_id      | int    | ID de reserva (si aplica, 0 si no hay reserva)                                                       |

---

## Casos de Uso

### 1. Mostrar Descuentos en UI

```js
const sale = response.data[0];
const hasDiscounts = sale.sale.metadata?.discounts?.length > 0;

if (hasDiscounts) {
    sale.sale.metadata.discounts.forEach(discount => {
        console.log(`Descuento en ${discount.product_name}: $${discount.discount_amount}`);
        console.log(`Razón: ${discount.reason}`);
    });
}
```

### 2. Identificar Productos de Servicio

```js
const physicalProducts = sale.details.filter(d => d.product_type === 'PHYSICAL');
const serviceProducts = sale.details.filter(d => d.product_type === 'SERVICE');

// Mostrar icono diferente según tipo
const icon = detail.product_type === 'SERVICE' ? '🛠️' : '📦';
```

### 3. Calcular Ahorros Totales

```js
const totalSavings = sale.details.reduce((sum, detail) => {
    return sum + detail.discount_amount;
}, 0);

console.log(`Ahorro total: $${totalSavings}`);
```

### 4. Mostrar Badge de "Precio Modificado"

```jsx
{detail.price_modified && (
    <Badge color="warning">Precio Modificado</Badge>
)}
```

### 5. Validar Ventas con Descuentos Extremos

```js
const extremeDiscounts = sale.details.filter(detail => {
    const discountPercent = (detail.discount_amount / (detail.base_price * detail.quantity)) * 100;
    return discountPercent >= 100;
});

if (extremeDiscounts.length > 0) {
    // Mostrar alerta o justificación obligatoria
    console.log('Descuento extremo detectado - revisar justificación en metadata');
}
```

---

## Ejemplo de Integración React

```jsx
function SalesList({ startDate, endDate }) {
    const [sales, setSales] = useState([]);

    useEffect(() => {
        fetch('/sale/date_range/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate,
                page: 1,
                page_size: 50
            })
        })
        .then(res => res.json())
        .then(data => setSales(data.data));
    }, [startDate, endDate]);

    return (
        <div>
            {sales.map(saleData => (
                <SaleCard key={saleData.sale.sale_id}>
                    <h3>Venta: {saleData.sale.sale_id}</h3>
                    <p>Cliente: {saleData.sale.client_name}</p>
                    <p>Total: ${saleData.sale.total_amount}</p>
                    
                    {/* Mostrar descuentos */}
                    {saleData.sale.metadata?.discounts?.map((discount, idx) => (
                        <DiscountBadge key={idx}>
                            {discount.product_name}: -${discount.discount_amount}
                            <span>({discount.discount_percent}%)</span>
                        </DiscountBadge>
                    ))}

                    {/* Detalles de productos */}
                    {saleData.details.map(detail => (
                        <ProductRow key={detail.id}>
                            <span>{detail.product_name}</span>
                            <span>{detail.product_type === 'SERVICE' ? '🛠️' : '📦'}</span>
                            <span>
                                {detail.price_modified && '⚠️ '}
                                ${detail.unit_price}
                            </span>
                            {detail.discount_amount > 0 && (
                                <span className="savings">
                                    Ahorro: ${detail.discount_amount}
                                </span>
                            )}
                        </ProductRow>
                    ))}
                </SaleCard>
            ))}
        </div>
    );
}
```

---

## Cambios Importantes vs Versión Anterior

- ✅ **AGREGADO:** Campo `metadata` en nivel de venta con información completa de descuentos
- ✅ **AGREGADO:** Campo `product_type` para distinguir `PHYSICAL` vs `SERVICE`
- ✅ **AGREGADO:** Campo `discount_amount` calculado automáticamente
- ✅ **AGREGADO:** Campos `base_price`, `subtotal`, `tax_amount`, `total_with_tax`
- ✅ **AGREGADO:** Campo `price_modified` para detectar modificaciones de precio
- ✅ **MEJORADO:** Los descuentos >= 100% (precio final = 0) son soportados correctamente

---

## Estados de Venta

| Estado    | Descripción                                         |
|-----------|-----------------------------------------------------|
| PENDING   | Venta creada, pago pendiente (estado por defecto)   |
| PAID      | Venta pagada completamente                          |
| CANCELLED | Venta cancelada/revertida                           |

---

## Notas para Frontend

- `metadata` puede ser `null` o vacío - Siempre validar con `?.` antes de acceder
- `base_price` puede ser `0` - Ocurre si el producto no tiene precio en la tabla prices, usar `metadata.discounts[].original_price` como fallback
- Descuentos extremos (100%+) - El sistema los permite, mostrar justificación obligatoria desde `metadata.discounts[].reason`
- Productos `SERVICE` - No tienen stock físico, mostrar UI diferente
- `reserve_id` - Si `reserve_id > 0`, la venta incluye una reserva confirmada

---

## Endpoint de Creación de Venta

- **Ruta actualizada:** `POST /sale/` (ya no usar `/sales/orders`)

---

## Resumen de Paginación - Endpoint de Ventas por Rango de Fechas

### Endpoint Actualizado con Paginación

- **Ruta:** `GET /sale/date_range/`
- **Método:** `GET`
- **Autenticación:** JWT requerido

#### Request Body

```json
{
    "start_date": "2025-09-01",
    "end_date": "2025-09-30",
    "page": 1,
    "page_size": 50
}
```

#### Parámetros

| Campo      | Tipo   | Requerido | Descripción                                         | Default |
|------------|--------|-----------|-----------------------------------------------------|---------|
| start_date | string | ✅ Sí      | Fecha de inicio (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)  | -       |
| end_date   | string | ✅ Sí      | Fecha de fin (YYYY-MM-DD o YYYY-MM-DD HH:MM:SS)     | -       |
| page       | int    | ❌ No      | Número de página (mínimo 1)                         | 1       |
| page_size  | int    | ❌ No      | Registros por página (máximo 100)                   | 50      |

**Notas:**
- Si `page < 1`, se usa automáticamente `page = 1`
- Si `page_size < 1` o `page_size > 100`, se usa automáticamente `page_size = 50`
- Las fechas en formato `YYYY-MM-DD` se convierten automáticamente:
    - `start_date`: Se agrega `00:00:00`
    - `end_date`: Se agrega `23:59:59`

---

### Response Structure (NUEVA CON PAGINACIÓN)

```json
{
    "data": [
        {
            "sale": { ... },
            "details": [ ... ]
        }
    ],
    "pagination": {
        "page": 1,
        "page_size": 50,
        "total_records": 237,
        "total_pages": 5,
        "has_next": true,
        "has_previous": false
    }
}
```

---

### Ejemplo de Uso en React/JavaScript

#### 1. Hook Personalizado para Paginación

```js
import { useState, useEffect } from 'react';

function useSalesPagination(startDate, endDate, initialPage = 1, initialPageSize = 50) {
    const [sales, setSales] = useState([]);
    const [pagination, setPagination] = useState({
        page: initialPage,
        page_size: initialPageSize,
        total_records: 0,
        total_pages: 0,
        has_next: false,
        has_previous: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchSales = async (page, pageSize) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/sale/date_range/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start_date: startDate,
                    end_date: endDate,
                    page: page,
                    page_size: pageSize
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setSales(data.data);
            setPagination(data.pagination);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching sales:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (startDate && endDate) {
            fetchSales(pagination.page, pagination.page_size);
        }
    }, [startDate, endDate, pagination.page, pagination.page_size]);

    const goToPage = (page) => {
        setPagination(prev => ({ ...prev, page }));
    };

    const nextPage = () => {
        if (pagination.has_next) {
            goToPage(pagination.page + 1);
        }
    };

    const previousPage = () => {
        if (pagination.has_previous) {
            goToPage(pagination.page - 1);
        }
    };

    const changePageSize = (newPageSize) => {
        setPagination(prev => ({ 
            ...prev, 
            page_size: newPageSize,
            page: 1 // Reset a primera página
        }));
    };

    return {
        sales,
        pagination,
        loading,
        error,
        goToPage,
        nextPage,
        previousPage,
        changePageSize
    };
}
```

#### 2. Componente de Lista de Ventas con Paginación

```jsx
function SalesListPaginated() {
    const [startDate, setStartDate] = useState('2025-09-01');
    const [endDate, setEndDate] = useState('2025-09-30');

    const {
        sales,
        pagination,
        loading,
        error,
        nextPage,
        previousPage,
        goToPage,
        changePageSize
    } = useSalesPagination(startDate, endDate);

    if (loading) return <div>Cargando ventas...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="sales-container">
            {/* Filtros de fecha */}
            <div className="date-filters">
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                />
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>

            {/* Información de paginación */}
            <div className="pagination-info">
                <p>
                    Mostrando {sales.length} de {pagination.total_records} ventas
                    (Página {pagination.page} de {pagination.total_pages})
                </p>
                
                {/* Selector de tamaño de página */}
                <select 
                    value={pagination.page_size}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                </select>
            </div>

            {/* Lista de ventas */}
            <div className="sales-list">
                {sales.map(saleData => (
                    <SaleCard key={saleData.sale.sale_id} data={saleData} />
                ))}
            </div>

            {/* Controles de paginación */}
            <div className="pagination-controls">
                <button 
                    onClick={previousPage} 
                    disabled={!pagination.has_previous}
                >
                    ← Anterior
                </button>

                {/* Números de página */}
                <div className="page-numbers">
                    {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={pageNum === pagination.page ? 'active' : ''}
                        >
                            {pageNum}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={nextPage} 
                    disabled={!pagination.has_next}
                >
                    Siguiente →
                </button>
            </div>
        </div>
    );
}
```

#### 3. Componente de Paginación Reutilizable

```jsx
function Pagination({ pagination, onPageChange }) {
    const { page, total_pages, has_next, has_previous } = pagination;

    // Generar array de números de página a mostrar
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        let start = Math.max(1, page - 2);
        let end = Math.min(total_pages, start + maxVisible - 1);
        
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return pages;
    };

    return (
        <div className="pagination">
            <button 
                onClick={() => onPageChange(1)} 
                disabled={!has_previous}
            >
                ‹‹ Primera
            </button>

            <button 
                onClick={() => onPageChange(page - 1)} 
                disabled={!has_previous}
            >
                ‹ Anterior
            </button>

            {getPageNumbers().map(pageNum => (
                <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={pageNum === page ? 'active' : ''}
                >
                    {pageNum}
                </button>
            ))}

            <button 
                onClick={() => onPageChange(page + 1)} 
                disabled={!has_next}
            >
                Siguiente ›
            </button>

            <button 
                onClick={() => onPageChange(total_pages)} 
                disabled={!has_next}
            >
                Última ››
            </button>
        </div>
    );
}
```

---

## Casos de Uso de Paginación

### 1. Mostrar Total de Resultados

```js
const totalResults = response.pagination.total_records;
console.log(`Se encontraron ${totalResults} ventas en el rango de fechas`);
```

### 2. Calcular Rango de Registros Mostrados

```js
const { page, page_size, total_records } = response.pagination;
const startRecord = (page - 1) * page_size + 1;
const endRecord = Math.min(page * page_size, total_records);

console.log(`Mostrando registros ${startRecord} al ${endRecord} de ${total_records}`);
// Output: "Mostrando registros 1 al 50 de 237"
```

### 3. Deshabilitar Botones de Navegación

```jsx
<button disabled={!pagination.has_previous}>Anterior</button>
<button disabled={!pagination.has_next}>Siguiente</button>
```

### 4. Indicador de Progreso

```jsx
const progress = (pagination.page / pagination.total_pages) * 100;

<div className="progress-bar">
    <div 
        className="progress-fill" 
        style={{ width: `${progress}%` }}
    />
</div>
```

---

## Validaciones Importantes

- ✅ Página mínima: Si `page < 1`, el backend usa automáticamente `page = 1`
- ✅ Tamaño máximo: Si `page_size > 100`, el backend usa `page_size = 50`
- ✅ Fechas requeridas: `start_date` y `end_date` son obligatorios (error 400 si faltan)
- ✅ Respuesta vacía: Si no hay resultados, `data = []` y `total_records = 0`

---

## Cambios vs Versión Anterior

| Antes                                    | Ahora                                                        |
|-------------------------------------------|--------------------------------------------------------------|
| Retorna array directo `[{sale, details}]` | Retorna objeto `{data: [...], pagination: {...}}`            |
| Sin información de total de registros     | Incluye `total_records` y `total_pages`                      |
| Sin indicadores de navegación             | Incluye `has_next` y `has_previous`                          |
| Paginación manual                        | Paginación calculada automáticamente                         |

---

## Notas para Frontend

- Siempre acceder a `response.data` para obtener las ventas (ya no es un array directo)
- Usar `pagination.total_records` para mostrar totales al usuario
- Validar `has_next` y `has_previous` antes de habilitar botones de navegación
- Resetear a página 1 cuando cambien las fechas o el tamaño de página
- Page size máximo es 100 - valores mayores se resetean automáticamente a 50

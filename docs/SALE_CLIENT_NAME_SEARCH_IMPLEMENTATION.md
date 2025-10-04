# Implementación: Búsqueda de Ventas por Nombre de Cliente

## Descripción General

Implementación completa del endpoint `GET /sale/client_name/{name}` para buscar ventas por nombre de cliente con paginación.

## Endpoint Implementado

```
GET /sale/client_name/{name}
```

### Características

- **Búsqueda parcial case-insensitive** en `client_name` y `last_name`
- **URL encoding** automático para caracteres especiales
- **Debouncing de 500ms** en la UI para evitar búsquedas excesivas
- **Paginación completa** con controles para cambiar página y tamaño
- **Mock fallback** para desarrollo offline

## Archivos Modificados

### 1. `/src/services/saleService.js`

#### Nuevo Método: `getSalesByClientName`

```javascript
getSalesByClientName: async (clientName, params = {}) => {
  const api = new BusinessManagementAPI();

  // Validar parámetros
  const page = Math.max(1, parseInt(params.page || 1));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.page_size || 50)));

  if (!clientName || clientName.trim() === '') {
    throw new Error('client name is required');
  }

  // Construir query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  // Codificar el nombre del cliente para caracteres especiales
  const encodedName = encodeURIComponent(clientName.trim());

  // GET con nombre en la ruta y paginación en query params
  const response = await api.makeRequest(
    `/sale/client_name/${encodedName}?${queryParams.toString()}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  return {
    success: true,
    data: response?.data || [],
    pagination: response?.pagination || {
      page, page_size: pageSize,
      total_records: 0, total_pages: 0,
      has_next: false, has_previous: false
    }
  };
}
```

**Líneas:** 369-454

### 2. `/src/components/SalesHistorySection.jsx`

#### Estados Añadidos

```javascript
const [clientNameSearch, setClientNameSearch] = useState('');
const [debouncedClientName, setDebouncedClientName] = useState('');
```

**Líneas:** 31-32

#### Hook de Debouncing

```javascript
// Debounce para búsqueda por nombre de cliente
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedClientName(clientNameSearch);
  }, 500);

  return () => clearTimeout(timer);
}, [clientNameSearch]);

// Cargar ventas cuando cambia el nombre debounced
useEffect(() => {
  if (debouncedClientName.trim()) {
    loadSalesByClientName(debouncedClientName);
  }
}, [debouncedClientName]);
```

**Líneas:** 39-53

#### Nueva Función: `loadSalesByClientName`

```javascript
const loadSalesByClientName = async (clientName, page = 1, pageSize = 50) => {
  if (!clientName.trim()) return;

  setLoading(true);
  setError(null);

  try {
    const response = await saleService.getSalesByClientName(clientName, {
      page: page,
      page_size: pageSize
    });

    if (response.success && response.data) {
      setSales(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
      announceSuccess(
        'Búsqueda',
        `${response.pagination?.total_records || 0} ventas encontradas para "${clientName}"`
      );
    }
  } catch (err) {
    console.error('Error loading sales by client name:', err);
    setError('Error al buscar ventas por nombre de cliente');
  } finally {
    setLoading(false);
  }
};
```

**Líneas:** 125-152

#### UI de Búsqueda

```javascript
{/* Barra de búsqueda por nombre de cliente */}
<div className="mb-4">
  <div className="relative">
    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
    <Input
      type="text"
      value={clientNameSearch}
      onChange={(e) => setClientNameSearch(e.target.value)}
      placeholder="Buscar ventas por nombre de cliente..."
      className="pl-10"
    />
    {clientNameSearch && (
      <button
        onClick={() => {
          setClientNameSearch('');
          loadSales();
        }}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <XCircle className="w-4 h-4" />
      </button>
    )}
  </div>
  {debouncedClientName && (
    <div className="mt-2 text-xs text-gray-500">
      Buscando ventas de "{debouncedClientName}"...
    </div>
  )}
</div>
```

**Líneas:** 267-295

## Flujo de Funcionamiento

### 1. Usuario Escribe en el Campo de Búsqueda

```
User types "Juan" → clientNameSearch = "Juan"
                   ↓
                   500ms delay (debounce)
                   ↓
            debouncedClientName = "Juan"
                   ↓
            loadSalesByClientName("Juan")
                   ↓
        GET /sale/client_name/Juan?page=1&page_size=50
```

### 2. Paginación con Búsqueda Activa

Si hay una búsqueda activa (`debouncedClientName` no vacío), todos los controles de paginación usan `loadSalesByClientName` en lugar de `loadSales`:

```javascript
// Ejemplo: Botón "Siguiente"
onClick={() => {
  if (debouncedClientName) {
    loadSalesByClientName(debouncedClientName, pagination.page + 1, pagination.page_size);
  } else {
    loadSales(dateRange, pagination.page + 1, pagination.page_size);
  }
}}
```

### 3. Limpiar Búsqueda

El botón X limpia la búsqueda y vuelve a cargar la vista por defecto (último mes):

```javascript
onClick={() => {
  setClientNameSearch('');
  loadSales();
}}
```

## Ejemplos de Uso

### Búsqueda Simple

```javascript
const response = await saleService.getSalesByClientName('María');
// GET /sale/client_name/Mar%C3%ADa?page=1&page_size=50
```

### Búsqueda con Caracteres Especiales

```javascript
const response = await saleService.getSalesByClientName('José & María');
// GET /sale/client_name/Jos%C3%A9%20%26%20Mar%C3%ADa?page=1&page_size=50
```

### Búsqueda con Paginación Custom

```javascript
const response = await saleService.getSalesByClientName('García', {
  page: 2,
  page_size: 25
});
// GET /sale/client_name/Garc%C3%ADa?page=2&page_size=25
```

## Respuesta del Endpoint

```json
{
  "data": [
    {
      "sale": {
        "sale_id": "SALE001",
        "client_id": "CLI123",
        "client_name": "María García",
        "sale_date": "2025-09-30T14:30:00Z",
        "total_amount": 1500000,
        "status": "PAID",
        "user_id": "USR001",
        "user_name": "Vendedor Demo",
        "payment_method_id": 1,
        "payment_method": "Efectivo",
        "currency_id": 1,
        "currency": "Guaraní Paraguayo",
        "metadata": {
          "discounts": [],
          "price_changes": [],
          "reserve_details": null
        }
      },
      "details": [
        {
          "product_id": "PROD001",
          "quantity": 2,
          "unit_price": 750000
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total_records": 15,
    "total_pages": 1,
    "has_next": false,
    "has_previous": false
  }
}
```

## Validaciones Implementadas

### Frontend

1. **Nombre vacío**: No ejecuta búsqueda si el campo está vacío después del debounce
2. **Trim automático**: Elimina espacios al inicio y final del nombre
3. **URL encoding**: Usa `encodeURIComponent` para caracteres especiales
4. **Paginación**: Limita page_size entre 1 y 100, page mínimo 1

### Mock Fallback

El sistema incluye fallback a datos mock para desarrollo offline:

```javascript
// Filtrar mock data por nombre de cliente (case-insensitive partial search)
const searchLower = clientName.toLowerCase();
const filteredData = result.data.filter(saleData => {
  const sale = saleData.sale || saleData;
  const name = sale.client_name || '';
  return name.toLowerCase().includes(searchLower);
});
```

## Telemetría

Se registran las siguientes métricas:

- `sales_fetched_by_client_name`: Número de ventas encontradas
- `sales_client_name_mock_fallback`: Cuántas veces se usó mock data
- `get_sales_by_client_name_duration`: Tiempo de respuesta

## Características UX

1. **Debouncing de 500ms**: Evita búsquedas mientras el usuario escribe
2. **Indicador visual**: Muestra "Buscando ventas de '{nombre}'..." durante la búsqueda
3. **Botón de limpiar**: X en el campo para resetear la búsqueda fácilmente
4. **Anuncio de resultados**: Mensaje con cantidad de resultados encontrados
5. **Búsqueda local deshabilitada**: Cuando hay búsqueda por nombre activa, se oculta el campo de búsqueda local

## Integración con Otros Filtros

- **Filtros de fecha**: Se limpian al usar búsqueda por nombre
- **Búsqueda local**: Solo visible cuando NO hay búsqueda por nombre activa
- **Botón "Hoy"**: Limpia la búsqueda por nombre al activarse

## Compatibilidad Backend

El endpoint debe implementar:

- **Ruta**: `GET /sale/client_name/{name}`
- **Búsqueda**: Case-insensitive, partial match en `client_name` y `last_name`
- **Autenticación**: JWT token en header Authorization
- **Paginación**: Query params `page` y `page_size`
- **Auto-login**: Retry automático en caso de 401

## Testing

Para probar la implementación:

1. Abrir la página de Ventas → pestaña "Historial de Ventas"
2. Escribir un nombre en el campo "Buscar ventas por nombre de cliente..."
3. Esperar 500ms (debounce)
4. Verificar la búsqueda en Network tab del navegador
5. Comprobar paginación con búsqueda activa

## Status

✅ **Completado** - Endpoint implementado y probado con build exitoso

## Próximos Pasos

- ⏳ **Backend Team**: Implementar endpoint `GET /sale/client_name/{name}`
- ⏳ **Backend Team**: Resolver 404 en `/sale/orders/{id}/preview-cancellation`

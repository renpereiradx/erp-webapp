# Plan de Integración: Página de Ventas con API Real

## 📋 Resumen Ejecutivo

La página actual `SalesNew.jsx` (700+ líneas) usa datos mock hardcodeados. Este plan describe cómo migrarla para usar los servicios y stores existentes que ya están alineados con `docs/api/SALE_API.md`.

## 🎯 Alcance del Proyecto

### Componentes Afectados
- **Archivo Principal**: `src/pages/SalesNew.jsx`
- **Servicios Disponibles**:
  - `saleService.js` - Creación de ventas según SALE_API.md
  - `salePaymentService.js` - Procesamiento de pagos
- **Stores Disponibles**:
  - `useSaleStore` - Estado global de ventas
  - `useProductStore` - Catálogo de productos
  - `useClientStore` - Gestión de clientes

### Datos Mock a Eliminar
```javascript
// Estos datos hardcodeados serán eliminados:
- PRODUCT_CATALOG (línea 14-19)
- INITIAL_ITEMS (línea 21-46)
- CLIENTS (línea 48-67)
- PAYMENT_METHODS (línea 69-74) - Se obtendrán de API
- CURRENCIES (línea 76-81) - Se obtendrán de API
- SALE_HISTORY (línea 83-108) - Se obtendrá vía saleService
```

## 🏗️ Arquitectura Propuesta

### Tab 1: Nueva Venta

#### Estado Local Simplificado
```javascript
// Mantener solo estado UI local
const [activeTab, setActiveTab] = useState('new-sale')
const [search Term, setSearchTerm] = useState('')
const [generalDiscount, setGeneralDiscount] = useState(0)
const [isModalOpen, setIsModalOpen] = useState(false)

// Estado de formulario de producto
const [modalProductId, setModalProductId] = useState(null)
const [modalQuantity, setModalQuantity] = useState(1)
const [modalDiscount, setModalDiscount] = useState(0)
```

#### Integración con Stores
```javascript
// Usar stores de Zustand para datos
const { products, fetchProducts } = useProductStore()
const { clients, fetchClients } = useClientStore()
const { createSale, loading, error } = useSaleStore()

// Estado temporal de venta en construcción
const [cart Items, setCartItems] = useState([])
const [selectedClientId, setSelectedClientId] = useState(null)
const [paymentMethodId, setPaymentMethodId] = useState(1)
const [currencyId, setCurrencyId] = useState(1)
```

#### Flujo de Creación de Venta
1. Usuario construye carrito (`cartItems`)
2. Al confirmar, se llama a `createSale()` con estructura según SALE_API.md:
   ```javascript
   const saleData = {
     client_id: selectedClientId,
     allow_price_modifications: true, // Si hay descuentos/cambios
     product_details: cartItems.map(item => ({
       product_id: item.product_id,
       quantity: item.quantity,
       discount_percent: item.discount_percent || undefined,
       discount_reason: item.discount_reason || undefined
     })),
     payment_method_id: paymentMethodId,
     currency_id: currencyId
   }
   ```
3. Backend devuelve `sale_id`
4. **IMPORTANTE**: No procesar pago aquí - solo crear la venta
5. Redirigir a módulo de pagos con `sale_id` para procesamiento

### Tab 2: Historial de Ventas

#### Reemplazar SALE_HISTORY Mock
```javascript
// Antes (mock):
const filteredHistory = useMemo(() =>
  SALE_HISTORY.filter(...), [historySearch, dateFrom, dateTo]
)

// Después (API):
const { sales, fetchSalesByDateRange, loading } = useSaleStore()

useEffect(() => {
  if (dateFrom && dateTo) {
    fetchSalesByDateRange({ start_date: dateFrom, end_date: dateTo })
  }
}, [dateFrom, dateTo])
```

## 📝 Cambios Detallados por Sección

### 1. Selector de Productos (Modal)
**Antes**:
```javascript
const modalProduct = PRODUCT_CATALOG.find(item => item.id === modalProductId)
```

**Después**:
```javascript
const { products } = useProductStore()
const modalProduct = products.find(item => item.id === modalProductId)

// Cargar productos al montar
useEffect(() => {
  fetchProducts({ page: 1, pageSize: 100 })
}, [])
```

### 2. Información del Cliente
**Antes**:
```javascript
const activeClient = CLIENTS.find(client => client.id === selectedClientId)
```

**Después**:
```javascript
const { clients, fetchClients } = useClientStore()
const activeClient = clients.find(c => c.id === selectedClientId)

useEffect(() => {
  fetchClients({ page: 1, pageSize: 100 })
}, [])
```

### 3. Cálculo de Totales
**Mantener** la lógica de cálculo local actual:
- Subtotal
- Descuentos por línea
- Descuento general
- Impuestos (IVA 16%)
- Total

**NOTA**: Estos son solo para preview en UI. El backend calculará los montos finales.

### 4. Guardar Venta
**Antes**: No había guardado real

**Después**:
```javascript
const handleSaveSale = async () => {
  const { createSale } = useSaleStore.getState()

  try {
    const response = await createSale({
      client_id: selectedClientId,
      allow_price_modifications: cartItems.some(i => i.discount),
      product_details: cartItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        // Solo incluir descuentos si existen
        ...(item.discount_percent && {
          discount_percent: item.discount_percent,
          discount_reason: item.discount_reason || 'Descuento aplicado'
        })
      })),
      payment_method_id: paymentMethodId,
      currency_id: currencyId
    })

    if (response.success) {
      // Mostrar toast de éxito
      toast.success(`Venta creada: ${response.sale_id}`)

      // Limpiar carrito
      setCartItems([])

      // OPCIÓN A: Mantener en tab de ventas
      // OPCIÓN B: Redirigir a módulo de pagos
      // navigate(`/pagos/procesar/${response.sale_id}`)
    }
  } catch (error) {
    toast.error(error.message)
  }
}
```

### 5. Historial de Ventas (Tab 2)
**Antes**:
```javascript
const filteredHistory = useMemo(() =>
  SALE_HISTORY.filter(entry => {
    const matchesTerm = !historySearch ||
      entry.client.toLowerCase().includes(historySearch.toLowerCase())
    const matchesFrom = !dateFrom || entry.date >= dateFrom
    const matchesTo = !dateTo || entry.date <= dateTo
    return matchesTerm && matchesFrom && matchesTo
  }), [historySearch, dateFrom, dateTo]
)
```

**Después**:
```javascript
const { sales, fetchSalesByDateRange, loading } = useSaleStore()

// Efecto para cargar ventas por rango de fechas
useEffect(() => {
  if (dateFrom && dateTo) {
    fetchSalesByDateRange({
      start_date: dateFrom,
      end_date: dateTo,
      page: 1,
      page_size: 50
    })
  }
}, [dateFrom, dateTo])

// Filtrado local por término de búsqueda (opcional)
const filteredSales = useMemo(() =>
  sales.filter(sale => {
    if (!historySearch) return true
    return sale.client_name?.toLowerCase().includes(historySearch.toLowerCase()) ||
           sale.sale_id?.toLowerCase().includes(historySearch.toLowerCase())
  }), [sales, historySearch]
)
```

## 🚨 Consideraciones Importantes

### Separación de Responsabilidades
- **Página de Ventas**: Solo crear órdenes de venta
- **Módulo de Pagos**: Procesar pagos para ventas existentes (separado)

Según `SALE_API.md`:
1. `POST /sales/orders` - Crear venta (esta página)
2. `POST /payment/process-partial` - Procesar pago (módulo de pagos, diferente)

### Validaciones Frontend
Según documentación, validar antes de enviar:
1. ✅ Cliente seleccionado
2. ✅ Al menos un producto en carrito
3. ✅ Si hay descuentos, incluir `discount_reason`
4. ✅ Si hay cambio de precio, incluir `price_change_reason`
5. ✅ `allow_price_modifications: true` si hay descuentos o cambios

### Manejo de Errores
```javascript
// Errores posibles según SALE_API.md:
- DISCOUNT_REASON_REQUIRED (400)
- PRICE_CHANGE_REASON_REQUIRED (400)
- EXCESSIVE_DISCOUNT_AMOUNT (400)
- INSUFFICIENT_STOCK (409)
- INVALID_RESERVATION (400)

// Mostrar mensajes claros al usuario
```

## 📋 Checklist de Implementación

### Fase 1: Setup Inicial
- [ ] Importar stores (useProductStore, useClientStore, useSaleStore)
- [ ] Reemplazar `PRODUCT_CATALOG` por `products` del store
- [ ] Reemplazar `CLIENTS` por `clients` del store
- [ ] Agregar `useEffect` para cargar datos iniciales

### Fase 2: Tab "Nueva Venta"
- [ ] Adaptar selector de productos para usar `products` del store
- [ ] Adaptar información de cliente para usar `clients` del store
- [ ] Mantener lógica de cálculo de totales (UI preview)
- [ ] Implementar función `handleSaveSale` con `createSale()`
- [ ] Agregar validaciones según SALE_API.md
- [ ] Agregar manejo de errores con toasts

### Fase 3: Tab "Historial"
- [ ] Reemplazar `SALE_HISTORY` por `sales` del store
- [ ] Agregar controles de fecha (from/to)
- [ ] Implementar `fetchSalesByDateRange` al cambiar fechas
- [ ] Mantener filtrado local por término de búsqueda
- [ ] Actualizar tabla para mostrar campos de API real

### Fase 4: Limpieza Final
- [ ] Eliminar todas las constantes mock (PRODUCT_CATALOG, CLIENTS, etc.)
- [ ] Eliminar `INITIAL_ITEMS` - carrito inicia vacío
- [ ] Revisar imports no utilizados
- [ ] Actualizar propTypes si existen
- [ ] Probar flujo completo: cargar productos → agregar a carrito → guardar venta

## 🔍 Testing Manual

1. **Cargar productos**: Verificar que se carguen desde API
2. **Cargar clientes**: Verificar que se carguen desde API
3. **Agregar producto al carrito**: Funciona con modal
4. **Calcular totales**: Preview correcto en UI
5. **Guardar venta**: Se crea en backend y devuelve `sale_id`
6. **Ver historial**: Se cargan ventas por rango de fechas
7. **Manejo de errores**: Toasts claros para errores de API

## ⚠️ Decisión Pendiente del Usuario

**PREGUNTA CRÍTICA**:
¿Quieres que esta página también maneje el procesamiento de pagos (POST /payment/process-partial), o prefieres mantener eso separado en un módulo de pagos dedicado?

**OPCIÓN A**: Solo crear ventas (recomendado según arquitectura actual)
- Esta página termina en "Venta creada: SALE_XYZ"
- Usuario va a módulo de pagos para procesar pago

**OPCIÓN B**: Flujo completo en una página
- Agregar modal de pago después de crear venta
- Llamar a `salePaymentService.processPayment()` con el `sale_id`
- Más complejo pero más seamless para el usuario

## 📊 Estimación de Esfuerzo

- **Fase 1 (Setup)**: 30 minutos
- **Fase 2 (Nueva Venta)**: 1-2 horas
- **Fase 3 (Historial)**: 45 minutos
- **Fase 4 (Limpieza)**: 30 minutos
- **Testing**: 45 minutos

**Total Estimado**: 3.5-4.5 horas

## 🎯 Resultado Final

Una página de ventas completamente funcional que:
- ✅ Carga productos y clientes desde API
- ✅ Permite construir carritos de venta
- ✅ Crea órdenes de venta en backend según SALE_API.md
- ✅ Muestra historial de ventas con filtros por fecha
- ✅ Maneja errores apropiadamente
- ✅ Sin datos mock hardcodeados

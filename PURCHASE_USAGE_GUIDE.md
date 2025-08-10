# 📚 Guía de Uso - Módulo de Compras Mejorado

## 🚀 Inicio Rápido

### Navegación Principal
Accede al módulo de compras desde el menú principal. La página se abre por defecto en el **Dashboard** que muestra:

- 📊 Métricas clave de compras
- 📈 Tendencias y análisis
- 🏆 Top proveedores
- ⚠️ Acciones críticas pendientes

### Flujo Básico de Trabajo

#### 1. **Crear Nueva Orden de Compra**
```javascript
// Navegar a la pestaña "Nueva Compra"
1. Seleccionar proveedor (búsqueda con autocompletado)
2. Agregar productos con configuración avanzada:
   - Cantidad
   - Precio unitario
   - Fecha de vencimiento (opcional)
   - Tasa de impuesto (automática o manual)
3. Configurar términos de entrega y pago
4. Revisar resumen con cálculos automáticos
5. Crear orden de compra
```

#### 2. **Gestionar Órdenes Existentes**
```javascript
// Navegar a la pestaña "Lista de Compras"
1. Filtrar por estado, proveedor, fecha
2. Buscar órdenes específicas
3. Realizar acciones en lote:
   - Confirmar múltiples órdenes
   - Exportar reportes
   - Cancelar órdenes
```

## 🛠️ Ejemplos de Integración

### Hook de Lógica de Compras
```jsx
import { usePurchaseLogic } from '@/hooks/usePurchaseLogic';

const MyPurchaseComponent = () => {
  const {
    // Estado
    purchaseItems,
    selectedSupplier,
    validations,
    
    // Cálculos automáticos
    subtotal,
    tax,
    total,
    
    // Acciones
    addPurchaseItem,
    createPurchase,
    clearPurchase
  } = usePurchaseLogic();

  // Agregar producto con configuración completa
  const handleAddProduct = (product) => {
    addPurchaseItem(product, 5, 25.50); // cantidad: 5, precio: $25.50
  };

  return (
    <div>
      <p>Subtotal: ${subtotal}</p>
      <p>Impuestos: ${tax}</p>
      <p>Total: ${total}</p>
      
      {validations.canProceed && (
        <button onClick={createPurchase}>
          Crear Orden de Compra
        </button>
      )}
    </div>
  );
};
```

### Hook de Gestión de Órdenes
```jsx
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';

const OrdersManager = () => {
  const {
    orders,
    loading,
    orderStatistics,
    searchOrders,
    cancelOrder,
    updateOrderStatus,
    exportOrdersData
  } = usePurchaseOrders();

  // Buscar órdenes
  const handleSearch = (term) => {
    searchOrders(term, 'supplier');
  };

  // Confirmar orden
  const handleConfirmOrder = async (orderId) => {
    try {
      await updateOrderStatus(orderId, 'CONFIRMED', 'Orden confirmada automáticamente');
      console.log('Orden confirmada exitosamente');
    } catch (error) {
      console.error('Error al confirmar orden:', error);
    }
  };

  return (
    <div>
      <h2>Órdenes de Compra ({orderStatistics.total})</h2>
      
      {orders.map(order => (
        <div key={order.id}>
          <span>Orden #{order.id} - {order.supplier_name}</span>
          <button onClick={() => handleConfirmOrder(order.id)}>
            Confirmar
          </button>
        </div>
      ))}
    </div>
  );
};
```

### Servicio de Compras
```javascript
import purchaseService from '@/services/purchaseService';

// Crear orden de compra
const createPurchaseOrder = async () => {
  const purchaseData = {
    supplierId: 123,
    status: 'PENDING',
    items: [
      {
        productId: 'PROD_001',
        quantity: 10,
        unitPrice: 25.50,
        expDate: '2024-12-31',
        taxRateId: 1
      }
    ]
  };

  try {
    const result = await purchaseService.createPurchase(purchaseData);
    if (result.success) {
      console.log('Orden creada:', result.data);
      console.log('ID de orden:', result.purchaseOrderId);
    } else {
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('Error de red:', error);
  }
};

// Obtener tasas de impuestos
const loadTaxRates = async () => {
  const result = await purchaseService.getTaxRates();
  if (result.success) {
    console.log('Tasas disponibles:', result.data);
  }
};

// Buscar órdenes
const searchPurchases = async (searchTerm) => {
  const result = await purchaseService.searchPurchases(searchTerm, 'supplier');
  if (result.success) {
    console.log('Órdenes encontradas:', result.data);
  }
};
```

## 🎨 Componentes Principales

### Selector de Productos Mejorado
```jsx
import EnhancedPurchaseProductSelector from '@/components/EnhancedPurchaseProductSelector';

<EnhancedPurchaseProductSelector
  onProductAdd={(product, quantity, price) => {
    console.log('Producto agregado:', { product, quantity, price });
  }}
  supplierId={selectedSupplier?.id}
  theme={theme}
/>
```

### Lista de Órdenes
```jsx
import PurchaseOrdersList from '@/components/PurchaseOrdersList';

<PurchaseOrdersList 
  theme={theme}
  onOrderSelect={(order) => console.log('Orden seleccionada:', order)}
/>
```

### Dashboard de Compras
```jsx
import PurchasesDashboard from '@/components/PurchasesDashboard';

<PurchasesDashboard 
  className="custom-dashboard-styles"
/>
```

## 📊 Estructura de Datos

### Orden de Compra
```typescript
interface PurchaseOrder {
  id: number;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  total_amount: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  expected_delivery?: string;
  notes?: string;
}
```

### Item de Compra
```typescript
interface PurchaseItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  exp_date?: string;
  tax_rate_id?: number;
  profit_pct?: number;
}
```

### Tasa de Impuesto
```typescript
interface TaxRate {
  id: number;
  rate: number;    // 0.16 para 16%
  name: string;    // "IVA 16%"
}
```

## 🔧 Configuración de Constantes

### Estados de Compra
```javascript
import { PURCHASE_STATES, PURCHASE_STATE_LABELS } from '@/constants/purchaseData';

// Usar estados
const orderStatus = PURCHASE_STATES.PENDING;
const statusLabel = PURCHASE_STATE_LABELS[orderStatus]; // "Pendiente"
```

### Tasas de Impuestos
```javascript
import { TAX_RATES } from '@/constants/purchaseData';

// Tasas disponibles
const ivaTax = TAX_RATES.IVA_16;     // { id: 1, rate: 0.16, name: 'IVA 16%' }
const noTax = TAX_RATES.DEFAULT;     // { id: null, rate: 0, name: 'Sin impuesto' }
```

## 🎯 Casos de Uso Comunes

### 1. Validar Orden Antes de Enviar
```javascript
const { validations } = usePurchaseLogic();

if (validations.canProceed) {
  // La orden está lista para enviar
  await createPurchase();
} else {
  // Mostrar errores de validación
  if (!validations.hasSupplier) console.log('Falta seleccionar proveedor');
  if (!validations.hasItems) console.log('Falta agregar productos');
  if (!validations.hasValidItems) console.log('Revisar cantidades y precios');
}
```

### 2. Calcular Total con Impuestos
```javascript
const calculateOrderTotal = (items) => {
  let subtotal = 0;
  let totalTax = 0;

  items.forEach(item => {
    const itemSubtotal = item.quantity * item.unitPrice;
    subtotal += itemSubtotal;

    // Obtener tasa de impuesto
    const taxRate = TAX_RATES[item.taxRateId];
    if (taxRate) {
      totalTax += itemSubtotal * taxRate.rate;
    }
  });

  return {
    subtotal: subtotal.toFixed(2),
    tax: totalTax.toFixed(2),
    total: (subtotal + totalTax).toFixed(2)
  };
};
```

### 3. Filtrar Órdenes por Criterios
```javascript
const { setFilters } = usePurchaseOrders();

// Filtrar por estado pendiente
setFilters(prev => ({
  ...prev,
  status: 'PENDING'
}));

// Filtrar por rango de fechas
const startDate = '2024-01-01';
const endDate = '2024-12-31';
filterByDateRange(startDate, endDate);

// Búsqueda por término
setFilters(prev => ({
  ...prev,
  searchTerm: 'Distribuidora Médica'
}));
```

### 4. Exportar Datos a CSV
```javascript
const { exportOrdersData } = usePurchaseOrders();

const handleExport = () => {
  const data = exportOrdersData();
  const csvContent = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\\n');
  
  // Descargar archivo
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ordenes_compra.csv';
  a.click();
};
```

## 🚨 Manejo de Errores

### Errores de API
```javascript
try {
  const result = await purchaseService.createPurchase(data);
  if (!result.success) {
    // Error controlado de la API
    console.error('Error de negocio:', result.error);
    showNotification(result.error, 'error');
  }
} catch (error) {
  // Error de red o no controlado
  console.error('Error técnico:', error);
  showNotification('Error de conexión', 'error');
}
```

### Validaciones del Cliente
```javascript
const validatePurchaseData = (data) => {
  const errors = [];
  
  if (!data.supplierId) errors.push('Proveedor requerido');
  if (!data.items?.length) errors.push('Al menos un producto requerido');
  
  data.items?.forEach((item, index) => {
    if (item.quantity <= 0) errors.push(`Cantidad inválida en item ${index + 1}`);
    if (item.unitPrice <= 0) errors.push(`Precio inválido en item ${index + 1}`);
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## 📱 Responsive Design

Los componentes están optimizados para diferentes tamaños de pantalla:

```css
/* Mobile: stack verticalmente */
@media (max-width: 768px) {
  .purchase-grid {
    grid-template-columns: 1fr;
  }
}

/* Tablet: 2 columnas */
@media (min-width: 769px) and (max-width: 1024px) {
  .purchase-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Desktop: layout completo */
@media (min-width: 1025px) {
  .purchase-grid {
    grid-template-columns: 2fr 1fr;
  }
}
```

## 🎉 Conclusión

El módulo de compras mejorado proporciona una experiencia completa y profesional para la gestión de órdenes de compra. Con sus componentes modulares, hooks especializados y servicios robustos, está preparado para manejar las necesidades de cualquier organización.

**¡Explora todas las funcionalidades y aprovecha al máximo las mejoras implementadas!**

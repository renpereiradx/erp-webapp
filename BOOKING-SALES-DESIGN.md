# 📋 Documentación del Sistema de Reservas y Ventas

## 🎯 Resumen del Diseño

Se ha implementado un **sistema unificado de reservas y ventas** con un diseño minimalista y compacto, utilizando el estilo **Neo-Brutalista** ya establecido en el proyecto ERP. La solución integra ambas funcionalidades en una sola página, optimizando la experiencia del usuario.

## 🎨 Características del Diseño

### **Estilo Visual**
- **Neo-Brutalismo**: Bordes gruesos (4px), sombras pronunciadas, colores vibrantes
- **Tipografía**: Fuentes en mayúsculas, negritas, alta legibilidad
- **Esquema de Colores**: 
  - Azul (`brutalist-blue`) para reservas
  - Verde (`brutalist-green`) para ventas
  - Lima (`brutalist-lime`) para información destacada
  - Otros colores para badges y estados

### **Layout Responsivo**
- **Desktop**: Layouts de 2-3 columnas según la sección
- **Mobile**: Diseño adaptable con columnas apiladas
- **Componentes compactos**: Optimizados para espacios reducidos

## 🏗️ Arquitectura de Componentes

### **Página Principal: `BookingSales.jsx`**
- **Navegación por Tabs**: Alternancia entre Reservas y Ventas
- **Estado unificado**: Gestión de cliente compartida entre ambas funciones
- **Datos simulados**: Para demostración de funcionalidades

### **Componentes Especializados**

#### **1. CalendarReservation.jsx**
```
🔧 Funcionalidades:
- Calendario mensual interactivo
- Selector de horarios disponibles (9 AM - 6 PM, cada 30 min)
- Visualización de reservas existentes
- Indicadores de disponibilidad
- Navegación entre meses
```

#### **2. SaleItemsManager.jsx**
```
🔧 Funcionalidades:
- Gestión de productos en la venta
- Control de cantidades con botones +/-
- Validación de stock disponible
- Cálculo automático de totales (subtotal, IVA, total)
- Alertas de stock insuficiente
```

## 📊 Estructura de Datos

### **Reservas (ReserveRequest)**
```javascript
{
  action: "create",           // create, update, cancel
  reserve_id: number,         // ID de la reserva
  product_id: string,         // ID del servicio
  client_id: string,          // ID del cliente
  start_time: string,         // ISO timestamp
  duration: number            // Duración en minutos
}
```

### **Ventas (SaleRequest)**
```javascript
{
  client_id: string,          // ID del cliente
  details: JSON.stringify({   // Detalles de la venta
    items: [...],             // Array de productos
    subtotal: number,         // Subtotal sin impuestos
    tax: number,              // IVA (16%)
    total: number,            // Total final
    timestamp: string         // Fecha de creación
  })
}
```

## 🎛️ Funcionalidades Implementadas

### **Módulo de Reservas**
- ✅ Selección de cliente y servicio
- ✅ Calendario visual con disponibilidad
- ✅ Selector de horarios inteligente
- ✅ Configuración de duración personalizada
- ✅ Validación de campos obligatorios
- ✅ Vista de reservas existentes en el calendario

### **Módulo de Ventas**
- ✅ Selección de cliente
- ✅ Gestión de carrito de productos
- ✅ Control de cantidades
- ✅ Cálculo automático de totales
- ✅ Validación de stock
- ✅ Vista previa del cliente seleccionado

### **Funcionalidades Compartidas**
- ✅ Base de datos de clientes unificada
- ✅ Interfaz de navegación por tabs
- ✅ Reseteo automático de formularios
- ✅ Retroalimentación visual (alerts)
- ✅ Indicadores de estado en tiempo real

## 🔧 Servicios y Estado

### **Servicios API**
- **`reservationService.js`**: CRUD completo para reservas
- **`saleService.js`**: CRUD completo para ventas
- **Métodos avanzados**: Estadísticas, búsquedas, validaciones

### **State Management (Zustand)**
- **`useReservationStore.js`**: Estado global de reservas
- **`useSaleStore.js`**: Estado global de ventas
- **Funciones incluidas**: Filtros, paginación, cálculos, selectores

## 📱 Experiencia de Usuario

### **Flujo de Reservas**
1. Usuario selecciona tab "Reservas"
2. Elige cliente de la lista desplegable
3. Selecciona servicio (duración se ajusta automáticamente)
4. Utiliza calendario visual para elegir fecha
5. Selecciona horario disponible
6. Ajusta duración si es necesario
7. Confirma reserva con validación completa

### **Flujo de Ventas**
1. Usuario selecciona tab "Ventas"
2. Elige cliente en panel lateral
3. Agrega productos usando el selector
4. Ajusta cantidades con controles +/-
5. Ve cálculos en tiempo real (subtotal, IVA, total)
6. Recibe alertas de stock insuficiente
7. Finaliza venta con resumen completo

## 🚀 Escalabilidad

### **Diseño Modular**
- Componentes reutilizables e independientes
- Fácil adición de nuevos campos o funcionalidades
- Separación clara de responsabilidades

### **Extensibilidad Futura**
- **Reservas**: Recordatorios, cancelaciones, reprogramación
- **Ventas**: Descuentos, múltiples métodos de pago, facturas
- **Integración**: Reservas como parte de ventas (servicios + productos)

### **Adaptabilidad**
- Configuración de horarios personalizable
- Tipos de servicios expandibles
- Categorías de productos flexibles
- Reglas de negocio configurables

## 🎯 Objetivos Cumplidos

✅ **Minimalismo**: Interfaz limpia sin elementos innecesarios  
✅ **Compacto**: Uso eficiente del espacio de pantalla  
✅ **Usabilidad**: Flujos intuitivos y retroalimentación clara  
✅ **Escalabilidad**: Arquitectura preparada para crecimiento  
✅ **Responsivo**: Adaptable a diferentes dispositivos  
✅ **Neo-Brutalista**: Consistente con el diseño existente  
✅ **Integración**: Funcionalidades unificadas en una página  

## 💡 Innovaciones del Diseño

### **Calendario Inteligente**
- Muestra reservas existentes como badges
- Diferencia entre días pasados, presentes y futuros
- Horarios no disponibles se muestran deshabilitados

### **Gestor de Productos Avanzado**
- Validación de stock en tiempo real
- Alertas visuales para productos con stock bajo
- Cálculos automáticos con impuestos incluidos

### **Estado Compartido**
- Cliente seleccionado persiste entre tabs
- Totales visibles en el header de la página
- Transiciones suaves entre funcionalidades

Este diseño logra el objetivo de crear una interfaz minimalista y eficiente que permite gestionar tanto reservas como ventas de manera integrada, manteniendo la usabilidad y escalabilidad como prioridades principales.

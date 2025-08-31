# Sistema Modular de Mock Data - ERP WebApp

## ✅ Estado Actual

El sistema de mock data ha sido completamente modularizado y mejorado, eliminando todos los valores hardcodeados y proporcionando un fallback robusto para todas las funcionalidades.

## 📁 Arquitectura del Sistema

### Estructura Modular
```
src/config/mockData/
├── index.js           # Configuración central y servicios
├── products.js        # Datos mock de productos (físicos y servicios)
├── sales.js          # Datos mock de ventas y pagos
├── reservations.js   # Datos mock de reservas de servicios
├── schedules.js      # Datos mock de horarios y disponibilidad
└── test.js           # Tests del sistema modular
```

### Características Implementadas

#### ✅ **Sistema Configurable**
- Sin valores hardcodeados
- Datos generados por factories configurables
- Configuración por ambiente (development/production)
- Control granular de delays y comportamientos

#### ✅ **Fallback Robusto**
- Todos los servicios intentan API real primero
- Fallback automático a mock data si API falla
- Logging detallado del modo utilizado
- Telemetría completa de uso

#### ✅ **Datos Realistas**
- **Productos**: Laptops, mouse, café, servicios médicos, canchas, salas
- **Ventas**: Transacciones con items, pagos, métodos diversos
- **Reservas**: Servicios reservables con horarios reales
- **Horarios**: Disponibilidad generada automáticamente

## 🔧 Servicios Actualizados

### ProductService
- Mock data para productos físicos y servicios
- Filtrado por categoría, tipo, reservable
- Búsqueda por nombre, descripción, SKU
- Paginación completa

### SaleService (API Unificada)
- Implementa SALE_API.md completamente
- Endpoint `/sale/` principal
- Preview de cancelaciones
- Procesamiento de pagos con cambio
- Fallback a mock data modular

### ReservationService
- Implementa RESERVES_API.md
- Separado completamente de Sales y Schedules
- Manejo de servicios reservables
- Estados: RESERVED, confirmed, cancelled

### ScheduleService
- Implementa SCHEDULE_API.md
- Generación automática de horarios
- Disponibilidad por producto y fecha
- Administración de slots de tiempo

## 🎯 Configuración

### Variables de Control
```javascript
// src/config/mockData/index.js
export const MOCK_CONFIG = {
  enabled: true,           // Master switch
  useRealAPI: false,       // Toggle API real
  simulateNetworkDelay: true,
  defaultDelayMs: 500,
  globalSeed: 1000,        // Datos consistentes
  
  development: {
    enabled: true,
    verbose: true,         // Logging detallado
    generateOnStart: true
  }
}
```

### Generadores de Datos
```javascript
// Ejemplo: Generar 10 productos de servicio
const services = generateMockData('products', {
  type: 'service',
  count: 10,
  categories: ['medical', 'sports', 'business']
});
```

## 🧪 Testing

### Manual Testing
```javascript
// Abrir consola del navegador y ejecutar:
import { testMockDataSystem } from '/src/config/mockData/test.js';
await testMockDataSystem();
```

### URL Testing
Agregar `?test-mock` a la URL para ejecutar tests automáticos.

## 🔄 Funcionalidades por Página

### ✅ Productos
- Listado con paginación
- Filtros por tipo (físico/servicio)
- Productos reservables identificados
- Búsqueda funcional

### ✅ Ventas
- API unificada (con y sin reservas)
- Procesamiento de pagos
- Cálculo automático de cambio
- Preview de cancelaciones

### ✅ Reservas
- Calendario integrado
- Selección de servicios reservables
- Estados de reserva
- Gestión de horarios disponibles

### ✅ Horarios (Schedules)
- Vista administrativa
- Generación de horarios
- Control de disponibilidad
- Filtros por producto/fecha

## 🚀 Próximos Pasos

### Pendientes Menores
1. ✅ Desacoplar completamente Sales y Reservations
2. ✅ Implementar API unificada de ventas
3. ✅ Sistema modular de mock data
4. 🔄 Testing completo de todas las páginas
5. ⏳ Optimización de stores para mock data
6. ⏳ Implementación completa de RESERVES_API.md

### Beneficios Conseguidos
- **Sin dependencias de API**: Todas las páginas funcionan offline
- **Datos realistas**: Información coherente y útil para testing
- **Configurabilidad**: Fácil ajuste de comportamientos
- **Escalabilidad**: Sistema extensible para nuevos dominios
- **Debugging**: Logging detallado del flujo de datos
- **Performance**: Delays simulados configurables

## 🎉 Conclusión

El sistema ERP WebApp ahora cuenta con:
- **Mock data completamente modular** sin valores hardcodeados
- **Fallback robusto** para todas las funcionalidades
- **APIs desacopladas** siguiendo las especificaciones
- **Funcionalidad completa offline** para desarrollo y testing

¡Todas las páginas (productos, clientes, proveedores, ventas, reservas, horarios) están listas para probarse con datos mock realistas! 🎯
# Schedule Management Integration Plan

## 🎯 Objetivo
Integrar la gestión completa de horarios (Schedule API) dentro del sistema de reservas existente, extendiendo las funcionalidades actuales sin crear sistemas separados.

## 📋 Estado Actual vs Objetivo

### ✅ **Ya Implementado en Reservas**
- `useReservationStore` con funciones básicas de schedules
- `reservationService.js` con algunos endpoints de horarios
- Cache de horarios disponibles (TTL 180s)
- Componentes de calendario con visualización de disponibilidad
- Mock system para desarrollo sin backend

### 🎯 **Funcionalidades a Integrar**
- Gestión completa de horarios (crear, actualizar disponibilidad)
- Generación automática de horarios (diarios, por fecha, próximos N días)
- Vista administrativa para gestionar horarios por producto
- Alineación completa con SCHEDULE_API.md

## 🏗️ Arquitectura de Integración

### **Archivos a Modificar/Extender**
```
src/
├── services/
│   └── reservationService.js          ✅ EXTENDER - Nuevos endpoints schedules
├── store/
│   └── useReservationStore.js         ✅ EXTENDER - Actions de gestión horarios
├── hooks/
│   └── useReservationCache.js         ✅ EXTENDER - Cache específico schedules
├── components/reservations/
│   ├── ScheduleManagement.jsx         🆕 NUEVO - Panel admin horarios
│   ├── ScheduleGenerator.jsx          🆕 NUEVO - Generador automático
│   └── AvailableSlotPicker.jsx        ✅ MEJORAR - Integrar nueva API
└── pages/
    └── Reservations.jsx               ✅ EXTENDER - Tab gestión horarios
```

### **Nuevos Endpoints a Integrar**
```javascript
// Alineación completa con SCHEDULE_API.md
- GET /schedules/{id}
- GET /schedules/product/{productId}/date/{date}/available
- GET /schedules/date-range
- GET /schedules/product/{productId}
- PUT /schedules/{id}/availability
- POST /schedules/generate/daily
- POST /schedules/generate/date  
- POST /schedules/generate/next-days
```

## 📈 Plan de Implementación Wave 4.5

### **Fase 1: Service Layer Extension** (0.5 días)
1. **Extender reservationService.js**
   - Añadir todos los endpoints de SCHEDULE_API.md
   - Mantener patrón withFallback para mock
   - Integrar con mockReservationsAPI.js

2. **Extender mockReservationsAPI.js**
   - Mock completo para todos los endpoints de schedules
   - Generación automática de horarios simulados
   - Persistencia en localStorage para desarrollo

### **Fase 2: Store & Cache Enhancement** (0.5 días)
1. **useReservationStore.js**
   - Actions para gestión completa de horarios
   - State management para schedule generation
   - Integración con telemetría existente

2. **useReservationCache.js**
   - Cache específico para schedules por endpoint
   - TTL diferenciado por tipo de consulta
   - Invalidación inteligente post-generación

### **Fase 3: UI Components** (1 día)
1. **ScheduleManagement.jsx** (Admin panel)
   - Vista tabla de horarios por producto/fecha
   - Acciones: cambiar disponibilidad, generar horarios
   - Filtros: producto, rango fechas, disponibilidad

2. **ScheduleGenerator.jsx** (Generación automática)
   - Formulario para generar horarios diarios
   - Selector de fechas específicas o próximos N días
   - Preview de horarios a generar

3. **Integración en Reservations.jsx**
   - Nuevo tab "Gestión de Horarios"
   - Acceso admin/privilegiado
   - Navegación fluida entre reservas y horarios

## 🎨 UX/UI Integration

### **Tab Structure en Reservations.jsx**
```jsx
const tabs = [
  { id: 'list', label: 'Reservas', icon: Calendar },
  { id: 'create', label: 'Nueva Reserva', icon: Plus },
  { id: 'schedules', label: 'Gestión Horarios', icon: Clock, adminOnly: true }
];
```

### **ScheduleManagement Component Layout**
```
┌─────────────────────────────────────────┐
│ 🔧 Gestión de Horarios                  │
├─────────────────────────────────────────┤
│ [Producto ▼] [Fecha inicio] [Fecha fin] │
│ [🔄 Generar Horarios] [📊 Ver Stats]   │
├─────────────────────────────────────────┤
│ ┌─ Horarios Existentes ─────────────────┐ │
│ │ 📅 2024-08-22 | 🏓 Cancha 1        │ │
│ │ ⏰ 09:00-09:30 ✅ [Toggle]          │ │
│ │ ⏰ 09:30-10:00 ❌ [Toggle]          │ │
│ │ ⏰ 10:00-10:30 ✅ [Toggle]          │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### **New Service Methods**
```javascript
// reservationService.js - Nuevos métodos
class ReservationService {
  // Schedule Management
  async getScheduleById(id) { /* GET /schedules/{id} */ }
  async getSchedulesByDateRange(startDate, endDate, options) { /* GET /schedules/date-range */ }
  async updateScheduleAvailability(id, isAvailable) { /* PUT /schedules/{id}/availability */ }
  
  // Schedule Generation
  async generateDailySchedules() { /* POST /schedules/generate/daily */ }
  async generateSchedulesForDate(targetDate) { /* POST /schedules/generate/date */ }
  async generateSchedulesForNextDays(days) { /* POST /schedules/generate/next-days */ }
}
```

### **New Store Actions**
```javascript
// useReservationStore.js - Nuevas acciones
const useReservationStore = create((set, get) => ({
  // Schedule Management State
  scheduleManagement: {
    selectedProduct: null,
    dateRange: { start: null, end: null },
    generatingSchedules: false,
    lastGeneration: null
  },
  
  // Schedule Management Actions
  setScheduleProduct: (product) => { /* Update selected product */ },
  setScheduleDateRange: (range) => { /* Update date range */ },
  generateSchedules: async (type, params) => { /* Generate schedules */ },
  toggleScheduleAvailability: async (id, isAvailable) => { /* Toggle availability */ },
  
  // Admin Utilities
  getScheduleStats: () => { /* Calculate schedule statistics */ },
  bulkUpdateAvailability: async (scheduleIds, isAvailable) => { /* Bulk update */ }
}));
```

## 📊 Integration Benefits

### **Immediate Benefits**
- ✅ **Unified Experience**: Una sola página para reservas y horarios
- ✅ **Shared Infrastructure**: Cache, telemetría, offline ya implementados
- ✅ **Consistent UX**: Mismo design system y patrones
- ✅ **Reduced Complexity**: Un solo store, un solo service layer

### **Long-term Benefits**
- 🚀 **Wave 5-6 Ready**: Offline y testing se aplican a ambos
- 🔄 **Sync Simplicity**: Reservas y horarios siempre consistentes
- 📈 **Scalability**: Un sistema robusto vs dos sistemas separados
- 🛠️ **Maintainability**: Menos código duplicado, un solo patrón

## 🎯 Success Metrics

### **Implementation Success**
- [ ] Todos los endpoints de SCHEDULE_API.md integrados
- [ ] Mock system completo para desarrollo independiente
- [ ] UI administrativa funcional para gestión horarios
- [ ] Cache y telemetría extendidos sin duplicación
- [ ] Tests de integración entre reservas y horarios

### **UX Success**  
- [ ] Navegación fluida entre reservas y gestión horarios
- [ ] Generación automática de horarios sin interrumpir UX
- [ ] Vista administrativa clara y eficiente
- [ ] Consistencia visual con resto del sistema

## 🕐 Timeline

| Fase | Duración | Entregables |
|------|----------|-------------|
| **Fase 1** | 0.5 días | Service layer completo + Mock system |
| **Fase 2** | 0.5 días | Store actions + Cache enhancement |
| **Fase 3** | 1 día | UI components + Integration |
| **Total** | **2 días** | **Schedule management completamente integrado** |

## 🔄 Next Steps Post-Integration

Después de completar Wave 4.5, el sistema estará listo para:
- **Wave 5**: Offline support para schedules incluido automáticamente
- **Wave 6**: Testing de gestión de horarios junto con reservas
- **Wave 7**: Métricas unificadas de reservas y disponibilidad de horarios

---

**Conclusión**: La integración dentro del sistema de reservas es la estrategia óptima para mantener cohesión, reutilizar infraestructura y proporcionar una experiencia unificada al usuario.

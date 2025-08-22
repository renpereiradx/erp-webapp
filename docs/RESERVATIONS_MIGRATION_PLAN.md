# Feature Reservations - Estado Actual & Plan de Migración

Fecha: 2025-08-22  
Responsable: Frontend  
Contexto: Separación de reservas desde BookingSales hacia página independiente

## 1. Resumen Ejecutivo
Las **Reservas** actualmente están integradas en la página `BookingSales.jsx` junto con ventas, utilizando un store Zustand funcional (`useReservationStore.js`) y un hook de lógica (`useReservationLogic.js`). La funcionalidad básica está implementada pero requiere separación, hardening y alineación con patrones establecidos en el proyecto (Suppliers/Products). El objetivo es crear una página independiente `Reservations.jsx` con nivel "Production Hardened" completo.

## 2. Estado Actual Implementado
| Área | Estado | Detalles |
|------|--------|----------|
| **UI/UX** | Integrada en BookingSales | Tabs, calendario, selección horarios, validaciones básicas |
| **Store (Zustand)** | Funcional básico | CRUD completo, filtros, paginación, estadísticas |
| **Servicio API** | Completo | Todos los endpoints principales implementados |
| **Hook de lógica** | Funcional | Validaciones, cálculos, gestión estado local |
| **Componentes** | Específicos | CalendarReservation, ClientSelector integrados |
| **Estados** | Ad-hoc | Loading states dispersos, sin DataState pattern |
| **i18n** | Parcial | Algunas cadenas, no exhaustivo |
| **Testing** | Ausente | Sin tests específicos |
| **Telemetría** | Ausente | Sin eventos de tracking |
| **Resiliencia** | Básica | Sin retry, circuit breaker, ni cache |
| **Offline** | No | Sin soporte offline |

## 3. Análisis de Componentes Actuales

### 3.1 Página Principal (`BookingSales.jsx`)
```jsx
// Estado actual - INTEGRADO con ventas
const BookingSales = () => {
  const [activeTab, setActiveTab] = useState('reservas');
  const reservationLogic = useReservationLogic();
  const salesLogic = useSalesLogic();
  
  // Lógica mezclada entre reservas y ventas
  // Componentes compartidos: ClientSelector
  // Estados independientes pero en misma página
}
```

**Plan de migración:**
- Extraer toda la lógica de `activeTab === 'reservas'` 
- Crear `Reservations.jsx` independiente
- Mantener `BookingSales.jsx` solo para ventas
- Preservar componentes compartidos (ClientSelector)

### 3.2 Store (`useReservationStore.js`)
```javascript
// Estado actual - FUNCIONAL pero sin hardening
const useReservationStore = create((set, get) => ({
  // Estado completo implementado
  reservations: [],
  currentReservation: null,
  availableSlots: [],
  loading: false,
  error: null,
  
  // Acciones CRUD completas
  fetchReservations, createReservation, updateReservation,
  cancelReservation, confirmReservation, completeReservation,
  
  // Sin: retry logic, circuit breaker, cache, telemetría
}));
```

**Plan de hardening:**
- Integrar helpers de resiliencia (`reliability`, `circuit`, `cache`, `offline`)
- Añadir telemetría completa (`feature.reservations.*`)
- Implementar normalización defensiva de payloads
- Cache TTL para páginas y horarios disponibles

### 3.3 Hook de Lógica (`useReservationLogic.js`)
```javascript
// Estado actual - FUNCIONAL para validaciones y cálculos
export const useReservationLogic = () => ({
  // Validaciones completas
  validations: { hasDate, hasTime, hasService, hasClient, canProceed },
  
  // Utilidades de horarios
  generateTimeSlots, loadAvailableSlots, calculateEndTime,
  
  // Preparación de datos
  prepareReservationData,
  
  // Sin: integración con store centralizado, telemetría
});
```

**Plan de refactoring:**
- Migrar lógica de negocio al store centralizado
- Mantener hook solo para estado local UI (selectedDate, selectedTime)
- Integrar con cache de horarios disponibles
- Añadir telemetría en acciones clave

### 3.4 Servicio API (`reservationService.js`)
```javascript
// Estado actual - COMPLETO pero desalineado con backend spec
export const reservationService = {
  // Endpoints implementados pero con estructura diferente a RESERVE_API.md
  getReservations, createReservation, updateReservation,
  cancelReservation, getAvailableSlots, getSchedules,
  
  // Sin: manejo JWT headers, validación response types
};
```

**Plan de alineación:**
- Refactorizar para usar endpoint `/reserve/manage` con action body
- Implementar headers JWT (`Authorization: Bearer <token>`)
- Añadir validación de response types según `RESERVE_API.md`
- Manejar códigos de error específicos (400, 401, 404, 500)

## 4. Componentes para Migrar/Crear

### 4.1 Componentes Existentes a Migrar
- `CalendarReservation` → Mover a `/components/reservations/`
- `ClientSelector` → Mantener compartido en `/components/`
- Lógica de tabs → Eliminar (no necesaria en página dedicada)

### 4.2 Componentes Nuevos a Crear
- `ReservationCard` → Lista de reservas con estados visuales
- `ReservationModal` → Crear/editar reserva
- `DeleteReservationModal` → Confirmación cancelación
- `AvailableSlotPicker` → Selección horarios con calendario
- `ReservationFilters` → Filtros avanzados (cliente, producto, fecha, estado)
- `ReservationStats` → Dashboard métricas básicas
- `ReservationDetailsPanel` → Vista detallada de reserva

## 5. Estructura Objetivo de Archivos

```
src/
├── pages/
│   ├── Reservations.jsx (NUEVO - página principal)
│   └── BookingSales.jsx (EXISTENTE - solo ventas)
├── components/
│   ├── reservations/ (NUEVO)
│   │   ├── ReservationCard.jsx
│   │   ├── ReservationModal.jsx
│   │   ├── DeleteReservationModal.jsx
│   │   ├── AvailableSlotPicker.jsx
│   │   ├── ReservationFilters.jsx
│   │   ├── ReservationStats.jsx
│   │   └── ReservationDetailsPanel.jsx
│   ├── CalendarReservation.jsx (MIGRADO)
│   └── ClientSelector.jsx (COMPARTIDO)
├── store/
│   └── useReservationStore.js (HARDENED)
├── services/
│   └── reservationService.js (REFACTORED)
├── hooks/
│   └── useReservationLogic.js (SIMPLIFIED)
└── constants/
    └── reservationConstants.js (NUEVO)
```

## 6. Plan de Migración por Fases

### Fase 1: Preparación (Día 1)
1. **Audit completo** de dependencias entre reservas/ventas en `BookingSales.jsx`
2. **Backup** de funcionalidad actual
3. **Crear esqueleto** `Reservations.jsx` con estructura base
4. **Setup routing** `/reservations` en router principal
5. **Crear directorio** `/components/reservations/`

### Fase 2: Separación Core (Días 2-3)
1. **Migrar componente** `CalendarReservation`
2. **Extraer lógica** de reservas desde `BookingSales.jsx`
3. **Crear componentes** base (ReservationCard, ReservationModal)
4. **Implementar DataState** pattern para estados unificados
5. **Testing básico** página independiente funcional

### Fase 3: Hardening Store (Días 4-5)
1. **Integrar helpers** resiliencia (`_withRetry`, circuit breaker)
2. **Añadir cache TTL** para páginas y horarios
3. **Implementar telemetría** `feature.reservations.*`
4. **Normalización defensiva** payloads API
5. **Testing** store con nuevas funcionalidades

### Fase 4: API Alignment (Días 6-7)
1. **Refactorizar servicio** para usar `/reserve/manage` endpoint
2. **Implementar JWT headers** en todas las llamadas
3. **Validar response types** según `RESERVE_API.md`
4. **Error handling** específico por código respuesta
5. **Testing** integración API completa

### Fase 5: UX & Polish (Días 8-9)
1. **i18n completo** extracción cadenas `reservations.*`
2. **Accesibilidad** focus management, live regions
3. **Componentes restantes** (filtros, stats, detalles)
4. **Offline básico** snapshot + banner
5. **Testing E2E** flujo completo

## 7. Consideraciones Técnicas

### 7.1 Dependencias Compartidas
- `ClientSelector` → Mantener compartido, usado por ventas también
- `PageHeader` → Reutilizar patrón establecido
- `DataState` → Aplicar consistentemente para loading/empty/error
- Helpers de store → Usar mismos helpers que Suppliers/Products

### 7.2 Estado Compartido
- **Clientes**: Pueden ser compartidos entre reservas y ventas
- **Productos**: Filtros de productos pueden ser compartidos
- **Autenticación**: Tokens JWT compartidos
- **Tema**: Sistema de temas global aplicable

### 7.3 Performance
- **Cache independence**: Reservas y ventas tendrán cache independiente
- **Prefetch**: Horarios disponibles pueden ser prefetcheados
- **Debounce**: Búsquedas de cliente/producto con debounce compartido

## 8. Testing Strategy

### 8.1 Tests de Migración
- **Regression tests**: BookingSales sigue funcionando sin reservas
- **Feature parity**: Nueva página tiene misma funcionalidad
- **Data integrity**: Estados de reservas se preservan

### 8.2 Tests Nuevos
- **Unit**: Store actions, helpers, utils
- **Integration**: Componentes con store
- **E2E**: Flujo crear → confirmar → completar reserva
- **A11y**: Navegación teclado, screen readers

## 9. Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Tiempo de migración** | ≤ 9 días hábiles | Seguimiento manual |
| **Regresiones** | 0 bugs en BookingSales | Tests automatizados |
| **Performance** | ≤ 2s carga inicial | Lighthouse |
| **Cobertura tests** | ≥85% nuevos componentes | Coverage report |
| **Errores producción** | 0 en primera semana | Monitoring |
| **Adopción usuarios** | Transición suave | Analytics/feedback |

## 10. Rollback Plan

### Señales de Rollback
- Errores críticos en producción > 5% usuarios
- Performance degradation > 50% tiempo carga
- Pérdida funcionalidad crítica confirmada

### Proceso de Rollback
1. **Revert commits** de separación manteniendo BookingSales original
2. **Restaurar routing** a página unificada
3. **Comunicar** a stakeholders con timeline de fix
4. **Post-mortem** para identificar causas raíz

## 11. Recursos Necesarios

### Desarrollo
- **1 desarrollador frontend** tiempo completo 9 días
- **Acceso backend** para testing API alignment
- **Tokens JWT válidos** para desarrollo

### Testing
- **Datos de prueba** reservas existentes
- **Ambiente staging** para testing completo
- **Usuarios beta** para feedback UX

### Documentación
- **Update** documentación técnica post-migración
- **Guía usuario** para nueva interfaz si hay cambios significativos

---

**Próximo paso**: Ejecutar Fase 1 (Preparación) iniciando con audit completo de `BookingSales.jsx`.

Última actualización: 2025-08-22

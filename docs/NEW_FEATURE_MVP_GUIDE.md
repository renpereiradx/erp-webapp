# 🚀 Guía MVP - Desarrollo Rápido de Features

Fecha: 2025-08-23
Responsable: Equipo Frontend
**Objetivo**: Entregar funcionalidad navegable en **1-3 días** con ruta incremental clara

## 🎯 Filosofía MVP

> **"Funcional básico primero, perfección después"**

- ⚡ **Velocidad > Perfección**: MVP navegable antes que hardening completo
- 🔄 **Iterativo**: Fases MVP → Hardening → Optimización
- 🎯 **Pragmático**: Evitar premature optimization
- 📊 **Data-driven**: Optimizar solo con métricas que lo justifiquen

## 📋 Fases de Implementación

| Fase | Tiempo | Objetivo | Criterio de Salida |
|------|--------|----------|-------------------|
| **MVP** | 1-3 días | Funcionalidad básica navegable | ✅ Listado + acción primaria funcionando |
| **Hardening** | 1-2 días | Robustez + UX + accesibilidad | ✅ Errores claros, i18n, a11y básica |
| **Optimización** | Opcional | Performance + métricas avanzadas | ✅ Solo si detectado en métricas |

## ✅ Checklist MVP (Obligatorio - Día 1-3)

### 🏗️ Estructura Base
```
src/features/<feature>/
   components/
      <Feature>MainView.jsx        # Componente principal
      <Feature>Card.jsx           # Item individual
   hooks/
      use<Feature>Data.js         # Hook de datos
   services/
      <feature>Api.js             # Servicio API
   __tests__/
      <feature>.smoke.test.jsx    # Test render básico
      <feature>.service.test.js   # Test servicio
```

### 🔌 Integración API
- [ ] **Fetch básico** con wrapper `_fetchWithRetry` (máx 2 reintentos + backoff simple)
- [ ] **Manejo respuesta**: Admitir `{data}`, `{results}` o array directo
- [ ] **Error simple**: Mensaje genérico + botón "Reintentar"
- [ ] **Loading state**: Spinner o skeleton básico

### 🎨 UI/UX Mínimo
- [ ] **Listado funcional**: Mostrar datos principales (título, estado, fecha)
- [ ] **Acción primaria**: Crear/Editar/Activar según necesidad
- [ ] **Estados básicos**: Loading, Error, Empty (sin datos)
- [ ] **Responsive**: Mobile-first, funciona en 320px+

### 🌍 i18n Básico
- [ ] **Cadenas extraídas**: Sin hardcodes en JSX
- [ ] **Claves estándar**: `<feature>.title`, `<feature>.error.generic`, `<feature>.action.primary`
- [ ] **Labels internos**: Cards (DOCUMENTO:, TOTAL:, etc.) también en i18n

### ♿ Accesibilidad Mínima
- [ ] **Roles básicos**: `role="button"` en acciones, `role="list"` en listados
- [ ] **Labels inputs**: Todos los inputs con label asociado
- [ ] **Focus visible**: Botón principal focusable con Tab
- [ ] **Alt texts**: Imágenes con alt descriptivo

### 📊 Telemetría Básica
- [ ] **Evento load**: `feature.<feature>.load` con duración
- [ ] **Evento error**: `feature.<feature>.error` con mensaje
- [ ] **Evento acción**: `feature.<feature>.action.primary`

### 🧪 Testing Mínimo
- [ ] **Smoke test**: Renderiza sin crash
- [ ] **Service test**: Fetch básico + manejo error
- [ ] **Build pasa**: Linter + TypeScript sin errores

### 📱 Estados UI Recomendados
```jsx
// Usar DataState para consistency
<DataState 
  variant="loading"          // loading|empty|error
  skeletonVariant="list"     // list|productGrid|card
/>
```

## ⚠️ MVP - Qué NO Hacer

❌ **Optimizaciones prematuras**
- No virtualización "por si acaso"
- No normalización byId si <200 items
- No cache complejo sin datos de uso

❌ **Features complejas**
- No bulk operations en MVP
- No inline editing avanzado
- No métricas detalladas

❌ **Perfeccionismo**
- No todos los edge cases
- No animaciones elaboradas
- No micro-optimizaciones

## 🔄 Decisiones Rápidas

| Pregunta | Si SÍ → | Si NO → |
|----------|---------|---------|
| ¿Lista >300 items potenciales? | Planificar virtualización en Hardening | Mantener listado simple |
| ¿Fetch repetido mismo payload? | Nota para cache en Hardening | Seguir sin cache |
| ¿Errores frecuentes esperados? | Añadir manejo específico | Mantener mensaje genérico |
| ¿Edición frecuente esperada? | Modal/formulario dedicado | Modo solo lectura OK |
| ¿Feature crítica negocio? | Considerar enfoque Hardened | Continuar MVP |

## 📦 Templates de Código MVP

### Hook de Datos Básico
```javascript
// use<Feature>Data.js
import { useState, useEffect } from 'react';
import { <feature>Api } from '../services/<feature>Api';
import { telemetry } from '@/utils/telemetry';

export const use<Feature>Data = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      const result = await <feature>Api.getAll();
      setData(result);
      telemetry.record('feature.<feature>.load', { 
        duration: Date.now() - startTime,
        count: result.length 
      });
    } catch (err) {
      setError(err.message);
      telemetry.record('feature.<feature>.error', { 
        error: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { data, loading, error, reload: loadData };
};
```

### Servicio API Básico
```javascript
// <feature>Api.js
import { _fetchWithRetry } from '@/utils/api-helpers';

const BASE_URL = '/api/<feature>';

export const <feature>Api = {
  async getAll() {
    return _fetchWithRetry(`${BASE_URL}`, {
      method: 'GET',
      retries: 2,
      baseDelay: 300
    });
  },

  async create(data) {
    return _fetchWithRetry(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      retries: 1
    });
  }
};
```

### Componente Principal MVP
```jsx
// <Feature>MainView.jsx
import React from 'react';
import { use<Feature>Data } from '../hooks/use<Feature>Data';
import { useI18n } from '@/lib/i18n';
import { DataState } from '@/components/ui/DataState';
import { Button } from '@/components/ui/Button';
import { <Feature>Card } from './<Feature>Card';

export const <Feature>MainView = () => {
  const { t } = useI18n();
  const { data, loading, error, reload } = use<Feature>Data();

  if (loading) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return (
      <DataState 
        variant="error" 
        message={error}
        onRetry={reload}
      />
    );
  }

  if (data.length === 0) {
    return (
      <DataState 
        variant="empty" 
        message={t('<feature>.empty.message')}
        action={
          <Button onClick={() => {/* crear nuevo */}}>
            {t('<feature>.action.create')}
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {t('<feature>.title')}
        </h1>
        <Button onClick={() => {/* crear nuevo */}}>
          {t('<feature>.action.create')}
        </Button>
      </div>
      
      <div className="grid gap-4">
        {data.map(item => (
          <Feature>Card 
            key={item.id} 
            data={item}
            onAction={() => {/* acción principal */}}
          />
        ))}
      </div>
    </div>
  );
};
```

## 📚 Recursos Rápidos

1. **DataState Components**: `src/components/ui/DataState.jsx`
2. **API Helpers**: `src/utils/api-helpers.js`
3. **i18n System**: `src/lib/i18n.js`
4. **Telemetry**: `src/utils/telemetry.js`
5. **UI Components**: `src/components/ui/`

## 🎯 Criterios de Éxito MVP

✅ **Usuario puede navegar la feature sin crashes**  
✅ **Acción primaria funciona (crear/editar/activar)**  
✅ **Errores se muestran claramente con opción retry**  
✅ **Loading states son evidentes**  
✅ **Build y tests pasan**  
✅ **Móvil funciona básicamente**  

## 🔄 Siguientes Pasos

Una vez completado MVP:
1. **Validar con usuarios** → Feedback directo
2. **Medir uso real** → Datos de telemetría
3. **Decidir Hardening** → Solo si se valida utilidad
4. **Documentar decisiones** → Qué se dejó para después y por qué

---

> **Recuerda**: El objetivo es entregar valor rápido, no código perfecto. 
> La perfección viene después si los datos lo justifican.

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

### 🏗️ Arquitectura y Tecnologías Obligatorias

**📋 Stack Tecnológico Definido:**
- **Estado Global**: Zustand con devtools middleware
- **API Client**: BusinessManagementAPI (instancia `apiClient`)
- **UI Components**: Radix UI + Tailwind + shadcn/ui existentes
- **Routing**: React Router DOM 
- **Testing**: Vitest + Testing Library
- **Telemetría**: `@/utils/telemetry` (sistema simple existente)
- **i18n**: `@/lib/i18n` (sistema custom existente)
- **Temas**: React Context enterprise-grade (`ThemeContext.jsx` + `useThemeStyles.js`)
- **Demo Data**: Sistema offline-first para desarrollo (`/config/demoData.js`)

### 🎨 Sistema de Temas (Patrón Oficial - Actualizado)
El sistema de temas se maneja a través de React Context para simplicidad y compatibilidad con React 19.

**Componentes Clave:**
- **`ThemeContext.jsx`**: Context de React que es la única fuente de verdad para el tema. Maneja el estado, la persistencia en `localStorage` y la aplicación automática de clases CSS al DOM.
- **`/config/themes.js`**: Configuración centralizada de todos los temas disponibles con validación robusta.
- **`useThemeStyles.js`**: Hook optimizado para acceder a estilos específicos del tema actual.

**Uso en Componentes:**
1.  **Para leer o cambiar el tema**: Importar y usar el hook `useTheme`.
    ```jsx
    import { useTheme } from '@/contexts/ThemeContext';
    
    const ThemeSwitcher = () => {
      const { theme, setTheme, availableThemes } = useTheme();

      return (
        <select value={theme} onChange={(e) => setTheme(e.target.value)}>
          {availableThemes.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      );
    }
    ```
2.  **Para estilos específicos**: El hook `useThemeStyles` proporciona funciones optimizadas.
    ```jsx
    import { useThemeStyles } from '@/hooks/useThemeStyles';
    
    const MyComponent = () => {
      const { styles, isNeoBrutalism, isDark } = useThemeStyles();
      
      return (
        <div className={styles.card()}>
          <h2 className={styles.header('h2')}>Título</h2>
          <button className={styles.button('primary')}>Acción</button>
        </div>
      );
    }
    ```

**Importante**: 
- **Inicialización automática**: El tema se aplica automáticamente al cargar la aplicación
- **Validación robusta**: Los temas inválidos se detectan y se aplica un fallback seguro  
- **Performance optimizada**: Los estilos se memorizan para evitar recálculos innecesarios
- **TypeScript ready**: Soporte completo de tipos para mejor DX

**⚠️ IMPORTANTE: Products usa patrón HARDENED, NO es MVP**

### 🗂️ Estructura MVP Simplificada (NO seguir Products)
```
src/store/
   use<Feature>Store.js         # Zustand store simple

src/services/
   <feature>Service.js          # Servicio API directo

src/pages/
   <Feature>.jsx               # Página principal MVP

src/components/
   <Feature>Modal.jsx          # Modal CRUD (opcional)

src/__tests__/
   <feature>.store.test.js     # Test store básico
   <feature>.page.test.jsx     # Test página básica
```

### 🔌 Integración API + Demo Data
- [ ] **Demo Mode**: Configuración offline-first con `DEMO_CONFIG_<FEATURE>` en `/config/demoData.js`
- [ ] **Fetch básico** con wrapper `_fetchWithRetry` (máx 2 reintentos + backoff simple)
- [ ] **Manejo respuesta**: Admitir `{data}`, `{results}` o array directo
- [ ] **Fallback automático**: Si API falla y demo habilitado, usar datos demo sin error
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

## 📦 Templates de Código MVP (Arquitectura Definida)

### 🗃️ Zustand Store MVP (Patrón Oficial)
```javascript
// src/store/use<Feature>Store.js
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { <feature>Service } from '@/services/<feature>Service';
import { telemetry } from '@/utils/telemetry';

const use<Feature>Store = create(
  devtools(
    (set, get) => ({
      // Estado simple (NO normalizar en MVP)
      <feature>s: [],
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      
      clear<Feature>s: () => set({ <feature>s: [], error: null }),

      // Cargar datos
      fetch<Feature>s: async () => {
        set({ loading: true, error: null });
        const startTime = Date.now();
        
        try {
          const result = await <feature>Service.getAll();
          
          // Manejar diferentes formatos de respuesta
          let data = [];
          if (result.success !== false) {
            const raw = result.data || result;
            data = Array.isArray(raw) ? raw : 
                   Array.isArray(raw?.data) ? raw.data :
                   Array.isArray(raw?.results) ? raw.results : [];
          }
          
          set({ <feature>s: data, loading: false });
          
          telemetry.record('feature.<feature>.load', { 
            duration: Date.now() - startTime,
            count: data.length 
          });
          
        } catch (error) {
          set({ error: error.message || 'Error al cargar', loading: false });
          telemetry.record('feature.<feature>.error', { 
            error: error.message 
          });
        }
      },

      // Crear
      create<Feature>: async (data) => {
        try {
          const result = await <feature>Service.create(data);
          if (result.success !== false) {
            // Recargar lista después de crear
            get().fetch<Feature>s();
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al crear' });
          return { success: false, error: error.message };
        }
      },

      // Actualizar
      update<Feature>: async (id, data) => {
        try {
          const result = await <feature>Service.update(id, data);
          if (result.success !== false) {
            // Recargar lista después de actualizar
            get().fetch<Feature>s();
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al actualizar' });
          return { success: false, error: error.message };
        }
      },

      // Eliminar
      delete<Feature>: async (id) => {
        try {
          const result = await <feature>Service.delete(id);
          if (result.success !== false) {
            // Actualizar estado local
            const <feature>s = get().<feature>s.filter(item => item.id !== id);
            set({ <feature>s });
          }
          return { success: true };
        } catch (error) {
          set({ error: error.message || 'Error al eliminar' });
          return { success: false, error: error.message };
        }
      }
    }),
    {
      name: '<feature>-store', // Para DevTools
    }
  )
);

export default use<Feature>Store;
```

### 🌐 Servicio API MVP con Demo Data (BusinessManagementAPI)
```javascript
// src/services/<feature>Service.js
import { apiClient } from '@/services/api';
import { telemetry } from '@/utils/telemetry';
import { 
  DEMO_CONFIG_<FEATURE>,
  getDemo<Feature>s,
  createDemo<Feature>,
  updateDemo<Feature>,
  deleteDemo<Feature>
} from '@/config/demoData';

const API_PREFIX = '/<feature>s'; // Ajustar según API

// Helper con retry simple (máx 2 reintentos)
const _fetchWithRetry = async (requestFn, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        // Backoff simple: 500ms * intento
        const backoffMs = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }
    }
  }
  
  throw lastError;
};

export const <feature>Service = {
  async getAll(params = {}) {
    const startTime = Date.now();
    
    try {
      // Si demo está habilitado, usar datos demo
      if (DEMO_CONFIG_<FEATURE>.enabled && !DEMO_CONFIG_<FEATURE>.useRealAPI) {
        console.log('🔄 <Feature>: Loading demo data...');
        const result = await getDemo<Feature>s(params);
        console.log('✅ <Feature>: Demo data loaded');
        return result;
      }
      
      // Si demo deshabilitado, usar API real
      console.log('🌐 <Feature>: Loading from API...');
      const result = await _fetchWithRetry(async () => {
        return await apiClient.get(API_PREFIX, { params });
      });
      
      telemetry.record('<feature>.service.load', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      // Si falla API y demo está habilitado como fallback
      if (DEMO_CONFIG_<FEATURE>.enabled) {
        console.log('🔄 <Feature>: Falling back to demo data...');
        const result = await getDemo<Feature>s(params);
        console.log('✅ <Feature>: Demo fallback loaded');
        return result;
      }
      
      telemetry.record('<feature>.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'getAll'
      });
      throw error;
    }
  },

  async create(data) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.post(API_PREFIX, data);
      });
      
      telemetry.record('<feature>.service.create', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('<feature>.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'create'
      });
      throw error;
    }
  },

  async update(id, data) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.put(`${API_PREFIX}/${id}`, data);
      });
      
      telemetry.record('<feature>.service.update', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('<feature>.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'update'
      });
      throw error;
    }
  },

  async delete(id) {
    const startTime = Date.now();
    
    try {
      const result = await _fetchWithRetry(async () => {
        return await apiClient.delete(`${API_PREFIX}/${id}`);
      });
      
      telemetry.record('<feature>.service.delete', {
        duration: Date.now() - startTime
      });
      
      return result;
    } catch (error) {
      telemetry.record('<feature>.service.error', {
        duration: Date.now() - startTime,
        error: error.message,
        operation: 'delete'
      });
      throw error;
    }
  }
};
```

### 📄 Componente de Página MVP (Patrón Oficial - Con Temas)
```jsx
// src/pages/<Feature>.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import use<Feature>Store from '@/store/use<Feature>Store';

const <Feature>Page = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const {
    <feature>s,
    loading,
    error,
    fetch<Feature>s,
    create<Feature>,
    update<Feature>,
    delete<Feature>,
    clearError
  } = use<Feature>Store();
  
  // Estados locales para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    // otros campos según feature
  });
  
  // Cargar datos al montar
  useEffect(() => {
    fetch<Feature>s();
  }, [fetch<Feature>s]);
  
  // Filtrar localmente (MVP simple)
  const filteredItems = <feature>s.filter(item => 
    (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handlers
  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '' }); // resetear form
    setShowModal(true);
  };
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ name: item.name }); // cargar form
    setShowModal(true);
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    
    let result;
    if (editingItem) {
      result = await update<Feature>(editingItem.id, formData);
    } else {
      result = await create<Feature>(formData);
    }
    
    if (result.success) {
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '' });
    }
    // Error se maneja automáticamente en el store
  };
  
  const handleDelete = async (item) => {
    if (window.confirm(`¿Eliminar ${item.name}?`)) {
      await delete<Feature>(item.id);
    }
  };
  
  // Estados de UI
  if (loading && <feature>s.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }
  
  if (error) {
    return (
      <DataState 
        variant="error" 
        title={t('<feature>.error.title', 'Error')}
        message={error}
        onRetry={() => {
          clearError();
          fetch<Feature>s();
        }}
      />
    );
  }
  
  if (!loading && <feature>s.length === 0) {
    return (
      <DataState
        variant="empty"
        title={t('<feature>.empty.title', 'Sin datos')}
        message={t('<feature>.empty.message', 'No hay elementos')}
        actionLabel={t('<feature>.action.create', 'Crear')}
        onAction={handleCreate}
      />
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header con acción primaria */}
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>
          {t('<feature>.title', '<Feature>s')}
        </h1>
        <Button onClick={handleCreate} className={styles.button('primary')}>
          <Plus className="w-4 h-4 mr-2" />
          {t('<feature>.action.create', 'Nuevo')}
        </Button>
      </div>
      
      {/* Búsqueda local */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('<feature>.search.placeholder', 'Buscar...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${styles.input()}`}
        />
      </div>
      
      {/* Listado */}
      <div className="grid gap-4">
        {filteredItems.map(item => (
          <div 
            key={item.id} 
            className={styles.card('p-4')}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="font-black text-lg">{item.name}</h3>
                {/* Mostrar otros campos según feature */}
                <div className="space-y-1 text-sm">
                  {/* Campos específicos del feature */}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleEdit(item)}
                  className="border-2 border-black"
                  title={t('action.edit', 'Editar')}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDelete(item)}
                  className="border-2 border-black hover:bg-red-100"
                  title={t('action.delete', 'Eliminar')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal Simple (inline para MVP) */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className={styles.container('max-w-md w-full mx-4')}>
            <h2 className={styles.header('h2')}>
              {editingItem ? 
                t('<feature>.modal.edit', 'EDITAR') : 
                t('<feature>.modal.create', 'CREAR')
              }
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={styles.label()}>
                  {t('field.name', 'NOMBRE')}
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={styles.input()}
                  required
                />
              </div>
              
              {/* Otros campos según feature */}
              
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className={`flex-1 ${styles.button('primary')}`}
                >
                  {loading ? 
                    t('action.saving', 'Guardando...') : 
                    (editingItem ? t('action.update', 'Actualizar') : t('action.create', 'Crear'))
                  }
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowModal(false)}
                  className={`flex-1 ${styles.button('secondary')}`}
                >
                  {t('action.cancel', 'Cancelar')}
                </Button>
              </div>
            </form>
            
            {error && (
              <p className="text-red-600 text-sm mt-2 font-bold">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default <Feature>Page;
```

### 🧪 Tests MVP (Patrón Oficial)
```javascript
// src/__tests__/<feature>.store.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import use<Feature>Store from '../store/use<Feature>Store';
import { <feature>Service } from '../services/<feature>Service';

vi.mock('../services/<feature>Service');

describe('<Feature> Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    use<Feature>Store.getState().clear<Feature>s();
  });

  it('should fetch <feature>s successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    <feature>Service.getAll.mockResolvedValue({ data: mockData });
    
    await use<Feature>Store.getState().fetch<Feature>s();
    
    const state = use<Feature>Store.getState();
    expect(state.<feature>s).toEqual(mockData);
    expect(state.loading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('should handle fetch error', async () => {
    <feature>Service.getAll.mockRejectedValue(new Error('Network error'));
    
    await use<Feature>Store.getState().fetch<Feature>s();
    
    const state = use<Feature>Store.getState();
    expect(state.<feature>s).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBe('Network error');
  });
});
```

```jsx
// src/__tests__/<feature>.page.test.jsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import <Feature>Page from '../pages/<Feature>';

vi.mock('../store/use<Feature>Store', () => ({
  default: () => ({
    <feature>s: [],
    loading: false,
    error: null,
    fetch<Feature>s: vi.fn(),
    create<Feature>: vi.fn(),
    update<Feature>: vi.fn(),
    delete<Feature>: vi.fn(),
    clearError: vi.fn()
  })
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key
  })
}));

describe('<Feature>Page', () => {
  it('should render empty state when no data', () => {
    render(<<Feature>Page />);
    
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByText('Crear')).toBeInTheDocument();
  });
});
```

### 🌍 Convenciones i18n MVP

**Claves estándar obligatorias:**
```javascript
// src/lib/i18n.js - Agregar a DICTIONARY.es
{
  // Títulos y acciones básicas
  '<feature>.title': 'Título Feature',
  '<feature>.action.create': 'Crear <Feature>',
  
  // Estados
  '<feature>.empty.title': 'Sin <feature>s',
  '<feature>.empty.message': 'No hay <feature>s registrados',
  '<feature>.error.title': 'Error al cargar',
  '<feature>.error.generic': 'Error al procesar. Intente nuevamente.',
  
  // Modales
  '<feature>.modal.create': 'CREAR <FEATURE>',
  '<feature>.modal.edit': 'EDITAR <FEATURE>',
  
  // Búsqueda
  '<feature>.search.placeholder': 'Buscar <feature>s...',
}
```

## ⚡ Reglas Obligatorias MVP

### 🚫 NO Usar Patrones Hardened
- ❌ NO usar `/src/features/` (es Hardened, no MVP)
- ❌ NO normalizar datos (`byId`, `entities`)  
- ❌ NO implementar cache complejo
- ❌ NO circuit breakers en MVP
- ❌ NO virtualización prematura
- ❌ NO bulk operations complejas

### ✅ SÍ Usar Patrones MVP Simples
- ✅ Zustand stores directos en `/src/store/`
- ✅ Arrays simples para datos
- ✅ BusinessManagementAPI client
- ✅ Componentes UI existentes (shadcn/ui)
- ✅ Estados básicos: loading, error, empty
- ✅ Telemetría simple
- ✅ i18n básico

### 📋 Checklist Final Antes de PR
- [ ] Build pasa (`npm run build`)
- [ ] Tests pasan (`npm test`)
- [ ] Linter pasa (`npm run lint`)
- [ ] Store sigue patrón MVP (NO hardened)
- [ ] Servicios usan `apiClient` correctamente  
- [ ] i18n strings agregadas a `src/lib/i18n.js`
- [ ] Telemetría básica implementada
- [ ] DataState usado para loading/error/empty

## 📚 Recursos Rápidos

1. **Stores MVP Existentes**: `src/store/useClientStore.js`, `src/store/useSupplierStore.js`, `src/store/useDashboardStore.js`
2. **API Client**: `src/services/api.js` (BusinessManagementAPI)
3. **UI Components**: `src/components/ui/` (shadcn/ui + customs)
4. **DataState**: `src/components/ui/DataState.jsx`
5. **i18n System**: `src/lib/i18n.js`
6. **Telemetría**: `src/utils/telemetry.js`
7. **Theme System**: `src/contexts/ThemeContext.jsx` + `src/hooks/useThemeStyles.js`
8. **Demo Data**: `src/config/demoData.js` (offline-first development)
9. **Theme Config**: `src/config/themes.js` (centralized theme definitions)

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

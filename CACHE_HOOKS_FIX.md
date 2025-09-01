# Guía para resolver problemas de cache con React 19

## Problema
Cuando haces "empty cache and hard reload" la aplicación funciona perfectamente, pero al refrescar normalmente aparecen errores de "invalid hooks".

## Causa
Este problema ocurre porque:
1. React Day Picker v9.x tiene incompatibilidades con React 19
2. El cache de Vite Y del navegador almacenan versiones conflictivas de las dependencias
3. Los hooks de React se confunden entre diferentes versiones
4. Hot Module Replacement (HMR) puede mantener estado obsoleto

## Solución implementada - VERSIÓN 2.0

### 1. Versión correcta de react-day-picker
- ✅ Cambiado de `react-day-picker@9.9.0` a `react-day-picker@8.10.1`
- Esta versión es compatible con React 19

### 2. Configuración agresiva de Vite
- ✅ HMR DESHABILITADO para forzar recargas completas
- ✅ Fast Refresh DESHABILITADO para prevenir conflictos de hooks
- ✅ Headers de cache invalidation añadidos
- ✅ Cache busting con timestamp automático

### 3. Detección automática de errores
- ✅ Script de detección automática de errores de hooks
- ✅ Recarga automática cuando se detectan errores de hooks
- ✅ Herramientas de depuración en consola del navegador

### 4. Scripts de desarrollo mejorados
- `pnpm run dev:clean` - Inicia con cache de Vite limpio
- `pnpm run dev:nuclear` - ⚡ OPCIÓN NUCLEAR: Limpia TODO y reinstala
- `pnpm run clean` - Limpia todos los caches manualmente
- `pnpm run reset` - Resetea node_modules completamente

## Comandos para resolución

### 🚀 Para desarrollo normal:
```bash
pnpm run dev:nuclear
```

### 🧹 Si aparecen errores de hooks:
```bash
# Opción 1: Nuclear (recomendado)
pnpm run dev:nuclear

# Opción 2: Manual
pnpm run clean
pnpm run dev:clean
```

### 🔧 Si persisten los problemas:
```bash
# Reset completo
pnpm run reset
pnpm run dev:nuclear
```

## Herramientas de depuración en el navegador

En la consola del navegador tienes disponibles:

```javascript
// Limpiar todo el cache del navegador y recargar
clearBrowserCache()

// Ver información de depuración
console.log('Versión React:', React?.version)
```

## Configuraciones implementadas

### vite.config.js
- `hmr: false` - Deshabilitado para forzar recargas completas
- `fastRefresh: false` - Deshabilitado para prevenir conflictos de hooks
- `cache-control headers` - Invalidación forzada de cache
- `__CACHE_BUST__` - Timestamp para invalidar cache automáticamente

### index.html
- Meta tags de invalidación de cache
- Script de depuración automático

### main.jsx
- Detección automática de errores de hooks
- Recarga automática en caso de errores

### public/debug-hooks.js
- Herramientas de depuración en consola
- Limpieza automática de cache del navegador

## Prevención

1. **SIEMPRE usar `pnpm run dev:nuclear`** como comando principal
2. **NO usar `pnpm dev` normal** hasta que esté completamente resuelto
3. Si aparecen errores de hooks:
   - Ejecutar `clearBrowserCache()` en consola del navegador
   - O usar Ctrl+Shift+R (recarga forzada)
   - O `pnpm run dev:nuclear`
4. Mantener react-day-picker en versión 8.10.1

## Verificación rápida

```bash
# Verifica que todo esté bien configurado
bash verify-setup.sh

# Si todo está OK, inicia con:
pnpm run dev:nuclear
```

## En caso de emergencia 🚨

Si NADA funciona, ejecuta estos comandos en orden:

```bash
# 1. Reset completo
rm -rf node_modules
rm -rf pnpm-lock.yaml
rm -rf dist
rm -rf .vite

# 2. Reinstalar desde cero
pnpm install

# 3. Iniciar nuclear
pnpm run dev:nuclear
```

## Notas técnicas

- HMR deshabilitado temporalmente hasta resolver conflictos
- Fast Refresh deshabilitado por problemas de hooks
- Cache invalidation agresiva implementada
- Detección automática de errores con recarga automática

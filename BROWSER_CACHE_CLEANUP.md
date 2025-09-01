# 🧹 Limpieza de Cache Específica para la Aplicación

## 📑 **Bookmarklet (Método más rápido)**

Copia este código y créalo como un marcador en tu navegador:

```javascript
javascript:(function(){
  console.log('🧹 Limpiando cache SOLO de esta aplicación...');
  
  // Limpiar storage específico de este dominio
  localStorage.clear();
  sessionStorage.clear();
  
  // Limpiar cache API
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Headers para prevenir cache en próxima carga
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Cache-Control';
  meta.content = 'no-cache, no-store, must-revalidate';
  document.head.appendChild(meta);
  
  // Recarga con cache bypass
  window.location.href = window.location.href + '?cache_bust=' + Date.now();
})();
```

**Cómo usarlo:**
1. Crea un nuevo marcador en tu navegador
2. Pega el código JavaScript completo como URL
3. Haz clic en el marcador cuando tengas problemas de cache

## 🛠️ **Comandos en Consola del Navegador**

Abre DevTools (F12) y ejecuta:

```javascript
// Limpieza específica de módulos React
clearModuleCache()

// Limpieza general de la aplicación
clearBrowserCache()

// Verificar que cache está limpio
console.log('LocalStorage keys:', Object.keys(localStorage))
console.log('SessionStorage keys:', Object.keys(sessionStorage))
```

## 🎯 **DevTools - Método Visual**

### **Chrome/Edge:**
1. F12 → **Application** tab
2. **Storage** en el panel izquierdo
3. **Clear storage**
4. Verificar que solo esté seleccionado tu dominio
5. **Clear site data**

### **Firefox:**
1. F12 → **Storage** tab
2. Expandir cada categoría (Local Storage, Session Storage, Cache, etc.)
3. Clic derecho en tu dominio → **Delete All**

## ⚡ **Atajos de Teclado por Navegador**

- **Chrome:** `Ctrl+Shift+R` (hard reload)
- **Firefox:** `Ctrl+F5` o `Ctrl+Shift+R`
- **Edge:** `Ctrl+Shift+R`
- **Safari:** `Cmd+Shift+R`

## 🔧 **Para Desarrollo**

### **Si usas VSCode:**
Añade esta extensión para limpiar cache automáticamente:
- **Nombre:** Browser Preview o Live Server
- **Configuración:** Auto-refresh on save

### **URLs de bypass automático:**
La aplicación ahora genera URLs únicas automáticamente:
- `http://localhost:5173/?v=1725289234-abc123`
- Esto previene cache del navegador automáticamente

## 🚨 **En caso de emergencia**

Si NADA funciona, usa este comando nuclear:

```javascript
// ÚLTIMO RECURSO - Limpia TODO de este dominio
(function(){
  localStorage.clear();
  sessionStorage.clear();
  
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => indexedDB.deleteDatabase(db.name));
    });
  }
  
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  
  // Forzar recarga con bypass total
  window.location.replace(window.location.href.split('?')[0] + '?nocache=' + Date.now() + Math.random());
})();
```

## 💡 **Consejos**

1. **Usa el bookmarklet** - Es la forma más rápida
2. **DevTools Application tab** - Para verificar qué se limpió
3. **`clearModuleCache()`** - Específico para errores de React
4. **Ctrl+Shift+R** - Para recargas rápidas sin cache

**✅ Todos estos métodos afectan SOLO tu aplicación, no otros sitios web.**

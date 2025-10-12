# 🔧 Fix: Authorization Header Missing en POST Requests

## 📋 Problema Identificado

El frontend estaba enviando requests POST sin el header `Authorization`, resultando en errores 401 Unauthorized:

```console
📡 Making API request: 
Object { 
  url: "http://localhost:5050/sale/", 
  method: "POST", 
  hasAuthToken: false, 
  authHeaderPreview: "undefined...",
  ...
}

❌ Error 401 Unauthorized: Authorization header missing
```

## 🎯 Causa Raíz

**El problema principal era el ORDER OF HEADER MERGING en `makeRequest()`**:

```javascript
// En makeRequest():
const config = {
  headers: {
    ...this.defaultHeaders,        // 1. Content-Type: application/json
    ...authHeaders,                 // 2. Authorization: Bearer xxx
    ...fetchOptions.headers,        // 3. Content-Type: application/json ← SOBRESCRIBE TODO
  }
}
```

Cuando `saleService.js` pasaba:
```javascript
api.makeRequest('/sale/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // ← Esto sobrescribía authHeaders
  },
  body: JSON.stringify(data)
})
```

El objeto `fetchOptions.headers` con solo `Content-Type` **reemplazaba completamente** el merge anterior, eliminando el `Authorization` header.

### Problemas Secundarios

1. **Token no se actualizaba**: `getAuthHeaders()` se llamaba una vez, pero no se actualizaba en cada request
2. **Reintentos sin token fresco**: `withRetry` reintentaba requests sin obtener un token actualizado del localStorage
3. **Falta de validación**: No había verificación de que el token existiera antes de hacer requests

## ✅ Solución Implementada

### 1. **saleService.js** - Eliminar Headers Explícitos Redundantes

**La solución principal**: NO pasar `headers: { 'Content-Type': 'application/json' }` explícitamente, ya que `defaultHeaders` ya lo incluye.

```javascript
// ❌ ANTES (INCORRECTO - sobrescribe Authorization)
const response = await api.makeRequest('/sale/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // ← Elimina Authorization
  },
  body: JSON.stringify(requestData)
})

// ✅ DESPUÉS (CORRECTO - usa defaultHeaders + authHeaders)
const response = await api.makeRequest('/sale/', {
  method: 'POST',
  body: JSON.stringify(requestData)
  // NO especificar headers - se agregan automáticamente
})
```

Archivos corregidos:
- `saleService.js` línea ~708 (createSale)
- `saleService.js` línea ~340 (getSalesByDateRange)  
- `saleService.js` línea ~504 (getSalesByClientName)
- `saleService.js` línea ~840 (revertSale)

### 2. **BusinessManagementAPI.js** - Token Fresco en Cada Request

#### Cambios en `getAuthHeaders()`:
```javascript
getAuthHeaders() {
  // 🔧 FIX: Obtener token FRESCO en cada llamada
  // No cachear el token - siempre leer del localStorage
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    console.warn('⚠️ No auth token found in localStorage');
    return {};
  }
  
  return { Authorization: `Bearer ${token}` }
}
```

#### Cambios en `makeRequest()`:
```javascript
async makeRequest(endpoint, options = {}) {
  const url = `${this.baseUrl}${endpoint}`

  // 🔧 FIX: Obtener token FRESCO en cada request
  // skipAuth permite omitir autenticación para endpoints públicos
  const authHeaders = options.skipAuth ? {} : this.getAuthHeaders()

  // Remover skipAuth de options antes de pasarlo a fetch
  const { skipAuth, ...fetchOptions } = options

  const config = {
    signal: controller.signal,
    headers: {
      ...this.defaultHeaders,
      ...authHeaders,
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  }
  
  // Log detallado para debugging
  console.log('📡 Making API request:', {
    url,
    method: options.method || 'GET',
    skipAuth: !!options.skipAuth,
    hasAuthToken: !!config.headers.Authorization,
    authHeaderPreview: config.headers.Authorization?.substring(0, 60) + '...',
  })
  
  // ... resto del código
}
```

#### Cambios en `login()` y `signup()`:
```javascript
async login(email, password) {
  // 🔧 skipAuth: true para evitar enviar Authorization header en login
  const response = await this.makeRequest('/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  })
  
  if (response.token) {
    localStorage.setItem('authToken', response.token)
  }
  
  return response
}
```

### 2. **saleService.js** - Reintentos sin Token Expirado

#### Cambios en `withRetry()`:
```javascript
const withRetry = async (fn, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      // ✅ El token se obtiene DENTRO de fn() en cada iteración
      // BusinessManagementAPI.makeRequest ya lo obtiene fresco en cada llamada
      return await fn();
    } catch (error) {
      // No reintentar en errores 401 - significa que el token está mal/expirado
      if (error.code === 'UNAUTHORIZED' || error.message?.includes('Sesión expirada')) {
        console.error('🚫 Token inválido detectado, no se reintentará');
        throw error; // Lanzar inmediatamente, no reintentar
      }
      
      // Para otros errores, reintentar con backoff exponencial
      if (i === attempts - 1) throw error;
      
      const delay = RETRY_DELAY * Math.pow(2, i);
      console.log(`🔄 Reintento ${i + 1}/${attempts} en ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

## 🧪 Validación

### Antes del Fix:
```
📡 Making API request: { hasAuthToken: false, authHeaderPreview: "undefined..." }
❌ Error 401 Unauthorized: Authorization header missing
```

### Después del Fix:
```
📡 Making API request: { hasAuthToken: true, authHeaderPreview: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaC..." }
✅ Sale created successfully
```

## 📝 Puntos Clave

1. ✅ **Token siempre fresco**: Se obtiene del localStorage en cada request
2. ✅ **No reintentar 401**: Si el token es inválido, no se reintenta (evita loops infinitos)
3. ✅ **Endpoints públicos**: Login/signup usan `skipAuth: true` para no enviar Authorization
4. ✅ **Logs detallados**: Se puede verificar en consola si el token se está enviando correctamente

## 🔍 Debugging

Para verificar que el token se está enviando correctamente:

1. Abrir DevTools → Console
2. Buscar logs: `📡 Making API request`
3. Verificar:
   - `hasAuthToken: true` ✅
   - `authHeaderPreview` muestra el inicio del token ✅
   - `actualHeaders` incluye `Authorization: "Bearer ..."` ✅

## 📚 Referencias

- **Sugerencia Backend**: El token debe obtenerse DENTRO de cada reintento, no fuera del loop
- **SALE_API.md**: Documentación del endpoint POST /sale/
- **SALE_WITH_DISCOUNT_API.md**: Estructura del payload de creación de ventas

## ✅ Resultado

El problema ha sido resuelto. Todos los requests autenticados ahora incluyen el header `Authorization` correctamente, y el backend procesa las solicitudes exitosamente.

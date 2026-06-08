# Guía de Integración: Sistema de Setup Inicial

## Resumen

Esta guía explica cómo integrar el **endpoint de setup inicial** en el frontend para facilitar la puesta en marcha del sistema cuando no existe ningún usuario administrador.

El sistema implementa un enfoque seguro de "one-shot": el endpoint solo funciona cuando la base de datos está completamente vacía (sin usuarios), y después de su primer uso se bloquea permanentemente.

---

## Flujo de Usuario Recomendado

```
1. Usuario abre la app por primera vez
   ↓
2. Frontend llama GET /setup/status
   ↓
3. Si needs_setup === true → Mostrar pantalla de "Bienvenida / Configuración Inicial"
   ↓
4. Usuario completa formulario con datos del admin + setup_key
   ↓
5. Frontend llama POST /setup/initialize
   ↓
6. Backend crea admin y retorna token JWT
   ↓
7. Frontend almacena token y redirige al dashboard
```

---

## API Endpoints

### 1. Verificar Estado del Sistema

```http
GET /setup/status
```

**Headers:** Ninguno (endpoint público)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "needs_setup": true
}
```

**Cuando ya está inicializado:**
```json
{
  "success": true,
  "needs_setup": false
}
```

### 2. Inicializar el Sistema

```http
POST /setup/initialize
Content-Type: application/json
```

**Body:**
```json
{
  "setup_key": "tu-clave-secreta-del-env",
  "first_name": "Nombre",
  "last_name": "Apellido",
  "email": "admin@empresa.com",
  "username": "admin",
  "password": "SecurePass123!",
  "phone": "+595999123456"
}
```

> **Nota:** `phone` es opcional. Todos los demás campos son obligatorios.

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role_id": "F2VLso",
  "role_name": "ADMIN",
  "message": "Sistema inicializado correctamente. Bienvenido, Nombre!",
  "user_id": "abc123"
}
```

---

## Manejo de Errores

| Código HTTP | Código de Error | Significado | Acción del Frontend |
|-------------|----------------|-------------|---------------------|
| `400` | `INVALID_JSON` | JSON malformado | Mostrar error de validación |
| `400` | `MISSING_FIELDS` | Faltan campos requeridos | Resaltar campos faltantes |
| `400` | `INVALID_EMAIL` | Email con formato incorrecto | Resaltar campo email |
| `400` | `INVALID_PASSWORD` | Contraseña menor a 6 caracteres | Mostrar requisitos de contraseña |
| `401` | `INVALID_SETUP_KEY` | Clave de setup incorrecta | Pedir al usuario que verifique la clave |
| `410` | `SETUP_COMPLETED` | Sistema ya inicializado | Redirigir a login |
| `429` | `RATE_LIMIT_EXCEEDED` | Demasiados intentos (3/hora) | Mostrar "Intenta más tarde" |
| `503` | `SETUP_NOT_CONFIGURED` | `SETUP_SECRET_KEY` no configurada | Contactar al administrador del servidor |

**Ejemplo de respuesta de error:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SETUP_KEY",
    "message": "Clave de setup inválida"
  }
}
```

---

## Implementación en React/Vue (Ejemplo)

### Hook/Composable de Setup

```typescript
// Composable Vue 3
import { ref } from 'vue'

const API_BASE = import.meta.env.VITE_API_URL

export function useSystemSetup() {
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function checkSetupStatus(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/setup/status`)
      const data = await res.json()
      return data.needs_setup === true
    } catch {
      // Si falla, asumimos que no necesita setup (modo seguro)
      return false
    }
  }

  async function initializeSystem(payload: {
    setup_key: string
    first_name: string
    last_name: string
    email: string
    username: string
    password: string
    phone?: string
  }) {
    isLoading.value = true
    error.value = null

    try {
      const res = await fetch(`${API_BASE}/setup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Error desconocido')
      }

      // Guardar token
      localStorage.setItem('token', data.token)
      localStorage.setItem('role_id', data.role_id)

      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading,
    error,
    checkSetupStatus,
    initializeSystem
  }
}
```

### Componente de Setup Inicial

```vue
<!-- SetupWizard.vue -->
<template>
  <div v-if="needsSetup" class="setup-wizard">
    <h1>Configuración Inicial del Sistema</h1>
    <p>Bienvenido. Como primer paso, crea tu cuenta de administrador.</p>

    <form @submit.prevent="handleSubmit">
      <input v-model="form.setup_key" type="text" placeholder="Clave de Setup" required />
      <input v-model="form.first_name" type="text" placeholder="Nombre" required />
      <input v-model="form.last_name" type="text" placeholder="Apellido" required />
      <input v-model="form.email" type="email" placeholder="Email" required />
      <input v-model="form.username" type="text" placeholder="Usuario" required />
      <input v-model="form.password" type="password" placeholder="Contraseña" required minlength="6" />
      <input v-model="form.phone" type="tel" placeholder="Teléfono (opcional)" />

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Configurando...' : 'Inicializar Sistema' }}
      </button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
  </div>

  <div v-else>
    <!-- Redirigir a login -->
    <LoginView />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSystemSetup } from './composables/useSystemSetup'

const router = useRouter()
const { checkSetupStatus, initializeSystem, isLoading, error } = useSystemSetup()

const needsSetup = ref(false)
const form = ref({
  setup_key: '',
  first_name: '',
  last_name: '',
  email: '',
  username: '',
  password: '',
  phone: ''
})

onMounted(async () => {
  needsSetup.value = await checkSetupStatus()
})

async function handleSubmit() {
  try {
    await initializeSystem(form.value)
    router.push('/dashboard')
  } catch {
    // Error ya está en `error` del composable
  }
}
</script>
```

---

## Consideraciones de Seguridad

### Para Desarrolladores Frontend

1. **No hardcodear la `setup_key`** en el código del frontend
   - La clave debe ser ingresada por el usuario o configurada en variables de entorno del servidor
   - El frontend solo la envía como input del usuario

2. **Manejo del token**
   - El token retornado por `/setup/initialize` es idéntico al de login
   - Usar el mismo mecanismo de almacenamiento (localStorage, cookies, etc.)
   - Implementar refresh token igual que para login normal

3. **Rate limiting**
   - El backend limita a 3 intentos por hora por IP
   - El frontend debe manejar el error `429` y mostrar un mensaje apropiado

4. **Una sola vez**
   - Después del setup exitoso, el endpoint retorna `410 Gone`
   - El frontend debe redirigir a login en ese caso

### Para DevOps/Deploy

1. **Generar `SETUP_SECRET_KEY` antes del primer deploy:**
   ```bash
   SETUP_SECRET_KEY=$(openssl rand -base64 32)
   echo "SETUP_SECRET_KEY=$SETUP_SECRET_KEY" >> .env.production
   ```

2. **Comunicar la clave al primer administrador** de forma segura (no por email, usar un canal seguro)

3. **Después del setup inicial**, considerar:
   - Rotar la `SETUP_SECRET_KEY`
   - O eliminarla del environment si no se usará más

---

## Preguntas Frecuentes

**Q: ¿Qué pasa si olvido la `SETUP_SECRET_KEY`?**
A: No podrás usar el endpoint de setup. Deberás usar el script CLI `go run cmd/create_initial_admin/main.go` directamente en el servidor, o configurar la clave en el `.env` y reiniciar.

**Q: ¿El endpoint de setup funciona en producción?**
A: Sí, pero solo si no hay usuarios en la base de datos. Una vez que existe el primer admin, el endpoint se bloquea permanentemente.

**Q: ¿Puedo usar el endpoint de setup para crear más admins después?**
A: No. El endpoint es "one-shot". Después del primer uso, debes usar `POST /api/v1/users` con un token de admin existente.

**Q: ¿El rate limiting afecta a otros endpoints?**
A: No. El rate limiting de `/setup/initialize` es independiente (3 intentos/hora por IP) y no afecta a login ni a otros endpoints.

---

## Referencias

- [Guía de Bootstrap Backend](../backend/BOOTSTRAP_ADMIN_USER.md) — Documentación del backend
- [API de Autenticación](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) — Integración de JWT
- [API de Usuarios](./API_DOCUMENTATION_TEMPLATE.md) — Creación de usuarios post-setup

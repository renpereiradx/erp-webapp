# 📋 Guía de Integración Frontend - Usuarios y Sesiones

## 📑 Índice
- [Visión General](#visión-general)
- [Autenticación y Flujo General](#autenticación-y-flujo-general)
- [Modelos de Datos](#modelos-de-datos)
- [Endpoints de Usuarios](#endpoints-de-usuarios)
- [Endpoints de Sesiones](#endpoints-de-sesiones)
- [Logs de Actividad](#logs-de-actividad)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Validaciones y Errores Comunes](#validaciones-y-errores-comunes)
- [Buenas Prácticas Frontend](#buenas-prácticas-frontend)

---
## 🎯 Visión General
Sistema de autenticación basado en JWT con gestión de sesiones persistidas en base de datos para control de concurrencia, revocación y auditoría.

Base URL (ejemplo):
```
http://localhost:5050/api
```

---
## 🔐 Autenticación y Flujo General
1. El usuario se registra (`/signup`) o ingresa (`/login`).
2. El backend devuelve un JWT (Authorization: Bearer) y datos mínimos (role_id, etc.).
3. El frontend guarda el token (localStorage o memory + refresh en cookie si se extiende).
4. Para endpoints protegidos se envía `Authorization: Bearer <token>`.
5. El frontend puede consultar /sessions/active para mostrar sesiones abiertas.
6. El usuario puede revocar sesiones específicas o todas excepto la actual.
7. Los eventos relevantes se registran en `audits.user_activity_log` accesible vía `/sessions/activity`.

> Nota: La integración completa de creación automática de sesión al login y agregar `session_id` en la respuesta de login está planificada para la siguiente fase. Los endpoints de sesiones ya están disponibles para integración temprana.

---
## 📊 Modelos de Datos

### Usuario (mínimo actual en API pública)
```typescript
interface UserSignupRequest {
  email: string;
  password: string;
}

interface UserLoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;     // JWT Bearer
  role_id: string;   // Rol asignado al usuario
  // (Futuro) session_id?: number; // ID de sesión persistida
}
```

### Claims (interno / decodificado en frontend si se requiere)
```typescript
interface TokenClaims {
  user_id: string;
  role_id: string;
  // (Planeado) session_id: number;
  exp: number; // Epoch expiration
  iat: number; // Issued at
}
```

### Session (UserSession)
```typescript
interface Session {
  id: number;
  user_id: string;
  token_hash: string;      // Hash (no el token real)
  ip_address?: string;
  user_agent?: string;
  device_type?: string;    // desktop | mobile | tablet | unknown
  is_active: boolean;
  last_activity: string;   // "YYYY-MM-DD HH:mm:ss"
  expires_at: string;      // Fecha/hora expiración
  created_at: string;      // Fecha/hora creación (login)
  revoked_at?: string;
  revoked_by?: string;
  revoke_reason?: string;
}
```

### SessionConfig
```typescript
interface SessionConfig {
  id?: number;
  role_id: string;
  max_concurrent_sessions: number;
  session_timeout_minutes: number;
  inactivity_timeout_minutes: number;
  require_device_verification: boolean;
  allow_multiple_locations: boolean;
  force_logout_on_password_change: boolean;
}
```

### Activity Log
```typescript
interface UserActivityLog {
  id: number;
  user_id: string;
  session_id?: number;
  activity_type: string;       // LOGIN, LOGOUT, API_CALL, etc.
  endpoint?: string;
  http_method?: string;
  ip_address?: string;
  user_agent?: string;
  request_data?: string;       // JSON string (sin datos sensibles)
  response_status?: number;
  duration_ms?: number;
  created_at: string;
}
```

---
## 👤 Endpoints de Usuarios

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/signup` | No | Crear nuevo usuario |
| POST | `/login` | No | Iniciar sesión y obtener JWT |

### 1. Signup
```http
POST /signup
Content-Type: application/json
```
Body:
```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```
Respuesta (201 OK):
```json
{
  "success": true,
  "message": "user created"
}
```
Errores comunes:
- 400 Email inválido / password débil
- 409 Usuario existente

### 2. Login
```http
POST /login
Content-Type: application/json
```
Body:
```json
{
  "email": "user@example.com",
  "password": "StrongP@ssw0rd"
}
```
Respuesta (200 OK):
```json
{
  "token": "<jwt>",
  "role_id": "user"
}
```
Errores comunes:
- 401 Credenciales incorrectas
- 429 Demasiados intentos (posible futura mejora)

---
## 🧪 Endpoints de Sesiones
Todos requieren `Authorization: Bearer <token>`.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/sessions/active` | Listar sesiones activas del usuario |
| GET | `/sessions/history?page=1&page_size=20` | Historial completo de sesiones |
| POST | `/sessions/{id}/revoke` | Revocar una sesión específica |
| POST | `/sessions/revoke-all` | Revocar todas excepto la actual |
| GET | `/sessions/activity?page=1&page_size=20` | Log de actividad del usuario |
| GET | `/sessions/config` | Configuración de sesión según rol |
| POST | `/sessions/cleanup` | Limpieza de sesiones expiradas (mantenimiento) |
| GET | `/admin/sessions/all` | (Admin) Todas las sesiones activas |
| POST | `/admin/sessions/{id}/revoke` | (Admin) Revocar sesión ajena |

### 1. Listar Sesiones Activas
```http
GET /sessions/active
Authorization: Bearer <jwt>
```
Respuesta:
```json
{
  "success": true,
  "data": [ { "id": 12, "user_id": "USR_123", "device_type": "desktop", "is_active": true, "last_activity": "2025-08-20 10:15:00", "expires_at": "2025-08-21 10:15:00", "created_at": "2025-08-20 09:00:00" } ],
  "count": 1
}
```

### 2. Revocar Sesión Específica
```http
POST /sessions/45/revoke
Authorization: Bearer <jwt>
```
Respuesta:
```json
{ "success": true, "message": "Session revoked successfully" }
```

### 3. Revocar Todas Menos la Actual
```http
POST /sessions/revoke-all
Authorization: Bearer <jwt>
```
Respuesta:
```json
{ "success": true, "message": "All other sessions revoked successfully", "revoked_count": 2 }
```

### 4. Historial de Sesiones
```http
GET /sessions/history?page=1&page_size=10
Authorization: Bearer <jwt>
```
Respuesta simplificada:
```json
{
  "success": true,
  "data": [ { "id": 10, "created_at": "2025-08-18 08:00:00", "revoked_at": null } ],
  "page": 1,
  "page_size": 10,
  "count": 5
}
```

### 5. Configuración de Sesiones
```http
GET /sessions/config
Authorization: Bearer <jwt>
```
Respuesta:
```json
{
  "success": true,
  "data": {
    "role_id": "user",
    "max_concurrent_sessions": 5,
    "session_timeout_minutes": 480,
    "inactivity_timeout_minutes": 60,
    "require_device_verification": false,
    "allow_multiple_locations": true,
    "force_logout_on_password_change": true
  }
}
```

### 6. Log de Actividad
```http
GET /sessions/activity?page=1&page_size=20
Authorization: Bearer <jwt>
```
Respuesta:
```json
{
  "success": true,
  "data": [ { "id": 1, "activity_type": "LOGIN", "endpoint": "/login", "created_at": "2025-08-20 09:00:00" } ],
  "page": 1,
  "page_size": 20,
  "count": 1
}
```

### 7. Admin - Todas las Sesiones
```http
GET /admin/sessions/all
Authorization: Bearer <jwt>
```
Respuesta:
```json
{ "success": true, "data": [ { "id": 77, "user_id": "USR_XYZ", "is_active": true } ], "count": 15 }
```

---
## 🧾 Logs de Actividad
`activity_type` ejemplos: `LOGIN`, `LOGOUT`, `API_CALL`, `SESSION_REVOKED`, `SESSION_CLEANUP`.

Campos relevantes para auditoría frontend:
- `endpoint` y `http_method` para trazar navegación.
- `response_status` para métricas de error.
- `duration_ms` para performance (si se registra en futuras fases).

---
## ✅ Códigos de Respuesta
| Código | Significado | Caso Común |
|--------|-------------|------------|
| 200 | OK | Operación exitosa |
| 201 | Created | Registro creado (signup) |
| 400 | Bad Request | Datos inválidos |
| 401 | Unauthorized | Token ausente / inválido |
| 403 | Forbidden | Acción sin permisos (admin) |
| 404 | Not Found | Sesión no existe / usuario no encontrado |
| 409 | Conflict | Usuario ya existe |
| 429 | Too Many Requests | (Planeado) Rate limiting |
| 500 | Internal Error | Error no controlado |

---
## 🛡️ Validaciones y Errores Comunes
- Email debe tener formato válido.
- Password mínimo 8 chars (recomendado: validar en frontend también).
- `page_size` máximo recomendado: 100.
- Revocar sesión: devolver 403 si no pertenece al usuario.
- Admin endpoints: exigir rol `admin` o `super_admin`.

Mensajes sugeridos para UI:
| Caso | Mensaje UI |
|------|------------|
| Credenciales inválidas | "Email o contraseña incorrectos" |
| Sesión vencida | "Tu sesión expiró, vuelve a iniciar sesión" |
| Sin permisos | "No tienes permiso para esta acción" |

---
## 🧠 Buenas Prácticas Frontend
1. Guardar el JWT de forma segura (evitar localStorage si se añaden refresh tokens; usar httpOnly cookies en futuras fases).
2. Refrescar vistas de sesión después de revocar una.
3. Mostrar advertencia antes de revocar todas las sesiones.
4. Implementar un timer para logout automático según `session_timeout_minutes` e `inactivity_timeout_minutes` (backend aplicará reglas; frontend mejora UX).
5. Parsear claims (base64) solo para UX, no para lógica crítica.
6. En panel admin, paginar resultados de sesiones activas (futuro endpoint paginado si se requiere).

---
## 🚀 Próximos Ajustes (Siguientes Fases)
- Inclusión de `session_id` en respuesta de login.
- Middleware reforzado: Validación de sesión activa + idle timeout.
- Endpoint de logout dedicado (`POST /logout`).
- Posible refresh token y rotación segura.

---
**Estado Actual**: Endpoints de sesión listos para integración básica. Login aún no crea registro en `user_sessions` (se añadirá en Fase 3). Frontend puede consumir listados y preparar UI de gestión.

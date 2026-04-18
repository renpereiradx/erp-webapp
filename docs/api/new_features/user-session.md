# Guia de Integracion Frontend - Usuarios y Sesiones

## Vision General

Esta guia documenta el estado vigente de autenticacion, usuarios y sesiones.

- Auto-registro publico (`/signup`) deshabilitado.
- Login habilitado por `username` o `email` via `POST /login`.
- Endpoints de auth: `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`.
- Endpoints de usuarios administrativos en `/api/v1/users`.
- Endpoints de sesiones en `/sessions` y `/admin/sessions`.

Base URL ejemplo:

```text
http://localhost:5050/api
```

## Flujo Recomendado

1. Frontend envia credenciales a `POST /login`.
2. Backend responde JWT con `token` y `role_id`.
3. Frontend almacena token y envia `Authorization: Bearer <token>` en endpoints protegidos.
4. Si el access token expira, usar `POST /auth/refresh` con `refresh_token`.
5. Para cierre de sesion usar `POST /auth/logout`; para cerrar todas, `POST /auth/logout-all`.

## Contratos Principales

### Login Request

```json
{
  "username": "admin",
  "password": "secret123"
}
```

Tambien soporta email:

```json
{
  "email": "admin@empresa.com",
  "password": "secret123"
}
```

### Login Response

```json
{
  "token": "<jwt>",
  "role_id": "F2VLso",
  "role_name": "ADMIN"
}
```

### Refresh Token Request

```json
{
  "refresh_token": "<jwt-refresh>"
}
```

### Refresh Token Response

```json
{
  "success": true,
  "access_token": "<jwt-access>",
  "refresh_token": "<jwt-refresh>",
  "token_type": "Bearer",
  "expires_in": 900
}
```

## Endpoints de Usuarios

### Publicos

- `POST /login`

### Administracion (`/api/v1/users`)

#### `GET /api/v1/users`

Lista usuarios con filtros y paginacion.

**Query Parameters:**

- `search` - Busqueda por nombre, email o username
- `status` - active, inactive, suspended, pending
- `role_id` - Filtrar por rol
- `created_from` - Fecha inicio (YYYY-MM-DD)
- `created_to` - Fecha fin (YYYY-MM-DD)
- `sort_by` - Campo ordenamiento (created_at, first_name, last_name, email, status)
- `sort_order` - asc o desc
- `page` - Numero de pagina (default: 1)
- `page_size` - Items por pagina (max: 100, default: 20)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "usr_123456",
      "first_name": "Juan",
      "last_name": "Perez",
      "email": "juan@empresa.com",
      "username": "jperez",
      "phone": "+595981123456",
      "avatar_url": "https://example.com/avatar.jpg",
      "status": "active",
      "email_verified": true,
      "last_login_at": "2025-04-02T10:30:00Z",
      "failed_login_attempts": 0,
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-04-02T10:30:00Z",
      "roles": [
        {
          "id": "ADMIN",
          "name": "Administrador"
        }
      ],
      "sessions_count": 2
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total_items": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

#### `POST /api/v1/users`

Crea un nuevo usuario.

**Request:**

```json
{
  "first_name": "Juan",
  "last_name": "Perez",
  "email": "juan@empresa.com",
  "username": "jperez",
  "password": "securePass123",
  "phone": "+595981123456",
  "status": "active",
  "role_ids": ["ADMIN"]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "first_name": "Juan",
    "last_name": "Perez",
    "email": "juan@empresa.com",
    "username": "jperez",
    "status": "active",
    "created_at": "2025-04-02T08:00:00Z"
  },
  "message": "Usuario creado exitosamente"
}
```

#### `GET /api/v1/users/{id}`

Obtiene un usuario por ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "first_name": "Juan",
    "last_name": "Perez",
    "email": "juan@empresa.com",
    "username": "jperez",
    "phone": "+595981123456",
    "avatar_url": "https://example.com/avatar.jpg",
    "status": "active",
    "email_verified": true,
    "last_login_at": "2025-04-02T10:30:00Z",
    "password_changed_at": "2025-03-15T12:00:00Z",
    "failed_login_attempts": 0,
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-04-02T10:30:00Z",
    "roles": [
      {
        "id": "ADMIN",
        "name": "Administrador"
      }
    ]
  }
}
```

#### `PUT /api/v1/users/{id}`

Actualiza un usuario.

**Request:**

```json
{
  "first_name": "Juan Carlos",
  "last_name": "Perez",
  "email": "juan.carlos@empresa.com",
  "phone": "+595981999999",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "first_name": "Juan Carlos",
    "last_name": "Perez",
    "email": "juan.carlos@empresa.com",
    "username": "jperez",
    "phone": "+595981999999",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "status": "active",
    "updated_at": "2025-04-02T11:00:00Z"
  },
  "message": "Usuario actualizado exitosamente"
}
```

#### `DELETE /api/v1/users/{id}`

Elimina un usuario (soft delete).

**Response:**

```json
{
  "success": true,
  "message": "Usuario eliminado exitosamente"
}
```

#### `POST /api/v1/users/{id}/activate`

Activa un usuario.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "status": "active"
  },
  "message": "Usuario activado exitosamente"
}
```

#### `POST /api/v1/users/{id}/deactivate`

Desactiva un usuario.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "status": "inactive"
  },
  "message": "Usuario desactivado exitosamente"
}
```

#### `POST /api/v1/users/{id}/change-password`

Cambia la contrasena de un usuario (admin).

**Request:**

```json
{
  "new_password": "newSecurePass123",
  "force_logout": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contrasena actualizada exitosamente",
  "sessions_revoked": 2
}
```

#### `GET /api/v1/users/{id}/roles`

Obtiene los roles de un usuario.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ADMIN",
      "name": "Administrador"
    },
    {
      "id": "VENDEDOR",
      "name": "Vendedor"
    }
  ]
}
```

#### `POST /api/v1/users/{id}/roles`

Asigna un rol a un usuario.

**Request:**

```json
{
  "role_id": "VENDEDOR"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Rol asignado exitosamente"
}
```

#### `DELETE /api/v1/users/{id}/roles/{roleId}`

Remueve un rol de un usuario.

**Response:**

```json
{
  "success": true,
  "message": "Rol removido exitosamente"
}
```

### Perfil propio

#### `GET /api/v1/users/me`

Obtiene el perfil del usuario autenticado.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "first_name": "Juan",
    "last_name": "Perez",
    "email": "juan@empresa.com",
    "username": "jperez",
    "phone": "+595981123456",
    "avatar_url": "https://example.com/avatar.jpg",
    "status": "active",
    "email_verified": true,
    "last_login_at": "2025-04-02T10:30:00Z",
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-04-02T10:30:00Z",
    "roles": [
      {
        "id": "ADMIN",
        "name": "Administrador"
      }
    ]
  }
}
```

#### `PUT /api/v1/users/me`

Actualiza el perfil del usuario autenticado.

**Request:**

```json
{
  "first_name": "Juan Carlos",
  "last_name": "Perez",
  "phone": "+595981999999",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "usr_123456",
    "first_name": "Juan Carlos",
    "last_name": "Perez",
    "email": "juan@empresa.com",
    "username": "jperez",
    "phone": "+595981999999",
    "avatar_url": "https://example.com/new-avatar.jpg",
    "updated_at": "2025-04-02T11:00:00Z"
  },
  "message": "Perfil actualizado exitosamente"
}
```

#### `POST /api/v1/users/me/change-password`

Cambia la contrasena del usuario autenticado.

**Request:**

```json
{
  "current_password": "oldPassword123",
  "new_password": "newSecurePass123",
  "logout_other_sessions": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Contrasena actualizada exitosamente",
  "sessions_revoked": 2
}
```

## Endpoints de Sesiones

Todos requieren `Authorization: Bearer <token>`.

#### `GET /sessions/active`

Obtiene las sesiones activas del usuario actual.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "user_id": "usr_123456",
      "token_hash": "abc123...",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "device_type": "desktop",
      "location_info": "Asuncion, Paraguay",
      "is_active": true,
      "last_activity": "2025-04-02T14:30:00Z",
      "expires_at": "2025-04-02T18:30:00Z",
      "created_at": "2025-04-02T08:00:00Z"
    }
  ],
  "count": 1
}
```

#### `GET /sessions/history`

Obtiene el historial de sesiones del usuario.

**Query Parameters:**

- `page` - Numero de pagina (default: 1)
- `page_size` - Items por pagina (max: 100, default: 20)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 122,
      "user_id": "usr_123456",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
      "device_type": "mobile",
      "location_info": "Asuncion, Paraguay",
      "is_active": false,
      "last_activity": "2025-04-01T20:00:00Z",
      "expires_at": "2025-04-01T22:00:00Z",
      "created_at": "2025-04-01T14:00:00Z",
      "revoked_at": "2025-04-01T20:30:00Z",
      "revoked_by": "usr_123456",
      "revoke_reason": "user_requested"
    }
  ],
  "page": 1,
  "page_size": 20,
  "count": 1
}
```

#### `POST /sessions/{id}/revoke`

Revoca una sesion especifica.

**Response:**

```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

#### `POST /sessions/revoke-all`

Revoca todas las sesiones del usuario excepto la actual.

**Response:**

```json
{
  "success": true,
  "message": "All other sessions revoked successfully",
  "revoked_count": 2
}
```

#### `GET /sessions/activity`

Obtiene el log de actividad del usuario.

**Query Parameters:**

- `page` - Numero de pagina (default: 1)
- `page_size` - Items por pagina (max: 100, default: 20)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "user_id": "usr_123456",
      "session_id": 123,
      "activity_type": "login",
      "endpoint": "/api/login",
      "http_method": "POST",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "request_data": "{\"username\": \"jperez\"}",
      "response_status": 200,
      "duration_ms": 150,
      "created_at": "2025-04-02T08:00:00Z"
    },
    {
      "id": 790,
      "user_id": "usr_123456",
      "session_id": 123,
      "activity_type": "session_revoked",
      "endpoint": "/api/sessions/122/revoke",
      "http_method": "POST",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-04-02T14:30:00Z"
    }
  ],
  "page": 1,
  "page_size": 20,
  "count": 2
}
```

#### `GET /sessions/config`

Obtiene la configuracion de sesion para el rol del usuario.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "role_id": "ADMIN",
    "max_concurrent_sessions": 5,
    "session_timeout_minutes": 480,
    "inactivity_timeout_minutes": 60,
    "require_device_verification": false,
    "allow_multiple_locations": true,
    "force_logout_on_password_change": true
  }
}
```

#### `POST /sessions/cleanup`

Limpia sesiones expiradas (tarea de mantenimiento).

**Response:**

```json
{
  "success": true,
  "message": "Expired sessions cleaned up successfully",
  "cleaned_count": 15
}
```

### Administracion de Sesiones (Admin)

#### `GET /admin/sessions/all`

Obtiene todas las sesiones activas (solo admin).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "user_id": "usr_123456",
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "device_type": "desktop",
      "location_info": "Asuncion, Paraguay",
      "is_active": true,
      "last_activity": "2025-04-02T14:30:00Z",
      "expires_at": "2025-04-02T18:30:00Z",
      "created_at": "2025-04-02T08:00:00Z"
    },
    {
      "id": 124,
      "user_id": "usr_789012",
      "ip_address": "192.168.1.101",
      "user_agent": "Mozilla/5.0 (iPhone...)",
      "device_type": "mobile",
      "location_info": "Lambare, Paraguay",
      "is_active": true,
      "last_activity": "2025-04-02T13:00:00Z",
      "expires_at": "2025-04-02T17:00:00Z",
      "created_at": "2025-04-02T09:00:00Z"
    }
  ],
  "count": 2
}
```

#### `POST /admin/sessions/{id}/revoke`

Revoca una sesion especifica de cualquier usuario (solo admin).

**Response:**

```json
{
  "success": true,
  "message": "Session revoked successfully by admin"
}
```

## Endpoints de Auth

#### `POST /auth/refresh`

Renueva el access token usando el refresh token.

**Request:**

```json
{
  "refresh_token": "<jwt-refresh>"
}
```

**Response:**

```json
{
  "success": true,
  "access_token": "<jwt-access>",
  "refresh_token": "<jwt-refresh>",
  "token_type": "Bearer",
  "expires_in": 900
}
```

#### `POST /auth/logout`

Cierra la sesion actual.

**Response:**

```json
{
  "success": true,
  "message": "Logout exitoso"
}
```

#### `POST /auth/logout-all`

Cierra todas las sesiones del usuario.

**Response:**

```json
{
  "success": true,
  "message": "Todas las sesiones cerradas exitosamente"
}
```

## Codigos de Respuesta Comunes

- `200`: operacion exitosa.
- `400`: payload invalido.
- `401`: token ausente, invalido o expirado.
- `403`: sin permisos suficientes.
- `404`: recurso no encontrado.
- `409`: conflicto (por ejemplo usuario o rol ya asignado).
- `500`: error interno.

## Validaciones Clave

- Password minimo: 6 caracteres.
- En login debe venir al menos uno: `username` o `email`.
- `page_size` recomendado: maximo 100 para listados.

## Buenas Practicas Frontend

1. Centralizar inyeccion del header `Authorization` en un cliente HTTP comun.
2. Implementar interceptor para `401` y refresco de token.
3. Limpiar tokens locales al fallar refresh o en logout.
4. Mostrar confirmacion antes de `logout-all` o revocaciones masivas.
5. No usar claims JWT para autorizacion critica en UI; solo para UX.

## Estado

Documento actualizado para reflejar estado operativo actual del modulo de usuarios/auth.

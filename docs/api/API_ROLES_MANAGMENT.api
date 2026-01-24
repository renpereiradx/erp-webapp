# API de Administración de Roles y Permisos

## Base URL

```
/api/v1/roles
/api/v1/permissions
```

## Autenticación

Todos los endpoints requieren autenticación JWT en el header:

```
Authorization: Bearer <token>
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/roles` | Listar todos los roles |
| POST | `/api/v1/roles` | Crear nuevo rol |
| GET | `/api/v1/roles/{id}` | Obtener rol por ID |
| PUT | `/api/v1/roles/{id}` | Actualizar rol |
| DELETE | `/api/v1/roles/{id}` | Eliminar rol |
| GET | `/api/v1/roles/{id}/permissions` | Listar permisos de un rol |
| POST | `/api/v1/roles/{id}/permissions` | Asignar permiso a un rol |
| DELETE | `/api/v1/roles/{id}/permissions/{permissionId}` | Remover permiso de un rol |
| GET | `/api/v1/permissions` | Listar todos los permisos disponibles |

---

## Endpoints de Roles

### 1. Listar Roles

Lista todos los roles del sistema con información extendida.

**Endpoint:** `GET /api/v1/roles`

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/roles" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": "admin",
            "name": "ADMINISTRADOR",
            "description": "",
            "permissions": [
                {
                    "id": 1,
                    "name": "users:read"
                },
                {
                    "id": 2,
                    "name": "users:write"
                }
            ],
            "users_count": 5,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ],
    "total": 3
}
```

---

### 2. Obtener Rol por ID

Obtiene el detalle completo de un rol específico.

**Endpoint:** `GET /api/v1/roles/{id}`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/roles/admin" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "admin",
        "name": "ADMINISTRADOR",
        "description": "Rol con acceso completo al sistema",
        "permissions": [
            {
                "id": 1,
                "name": "users:read"
            },
            {
                "id": 2,
                "name": "users:write"
            }
        ],
        "users_count": 5,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
}
```

#### Response (404 Not Found)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

---

### 3. Crear Rol

Crea un nuevo rol en el sistema.

**Endpoint:** `POST /api/v1/roles`

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | Sí | Nombre del rol (2-50 caracteres) |
| `description` | string | No | Descripción del rol |

#### Validaciones

- El nombre es **requerido**
- El nombre debe tener **mínimo 2 caracteres**
- El nombre no puede exceder **50 caracteres**
- El nombre se convierte automáticamente a **mayúsculas**
- No puede existir otro rol con el mismo nombre

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/roles" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supervisor",
    "description": "Rol de supervisión de operaciones"
  }'
```

#### Response (201 Created)

```json
{
    "success": true,
    "data": {
        "id": "aBc123",
        "name": "SUPERVISOR",
        "description": "",
        "permissions": [],
        "users_count": 0,
        "created_at": "2024-01-20T15:30:00Z",
        "updated_at": "2024-01-20T15:30:00Z"
    },
    "message": "Rol creado exitosamente"
}
```

#### Response (400 Bad Request) - Validación

```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "el nombre del rol debe tener al menos 2 caracteres"
    }
}
```

#### Response (409 Conflict) - Rol existente

```json
{
    "success": false,
    "error": {
        "code": "ROLE_ALREADY_EXISTS",
        "message": "ya existe un rol con este nombre"
    }
}
```

---

### 4. Actualizar Rol

Actualiza un rol existente.

**Endpoint:** `PUT /api/v1/roles/{id}`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `name` | string | No | Nuevo nombre del rol |
| `description` | string | No | Nueva descripción |

#### Request

```bash
curl -X PUT "http://localhost:8080/api/v1/roles/aBc123" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "supervisor senior",
    "description": "Rol de supervisión avanzada"
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": {
        "id": "aBc123",
        "name": "SUPERVISOR SENIOR",
        "description": "",
        "permissions": [],
        "users_count": 2,
        "created_at": "2024-01-20T15:30:00Z",
        "updated_at": "2024-01-21T10:00:00Z"
    },
    "message": "Rol actualizado exitosamente"
}
```

#### Response (404 Not Found)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

#### Response (409 Conflict)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_ALREADY_EXISTS",
        "message": "ya existe un rol con este nombre"
    }
}
```

---

### 5. Eliminar Rol

Elimina un rol del sistema.

**Endpoint:** `DELETE /api/v1/roles/{id}`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |

#### Restricciones

- No se puede eliminar un rol que tenga usuarios asignados
- Al eliminar un rol, se eliminan también sus relaciones con permisos

#### Request

```bash
curl -X DELETE "http://localhost:8080/api/v1/roles/aBc123" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Rol eliminado exitosamente"
}
```

#### Response (404 Not Found)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

#### Response (409 Conflict) - Rol con usuarios

```json
{
    "success": false,
    "error": {
        "code": "CANNOT_DELETE_ROLE",
        "message": "no se puede eliminar un rol que tiene usuarios asignados"
    }
}
```

---

## Endpoints de Permisos de Rol

### 6. Listar Permisos de un Rol

Obtiene todos los permisos asignados a un rol específico.

**Endpoint:** `GET /api/v1/roles/{id}/permissions`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/roles/admin/permissions" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "users:read"
        },
        {
            "id": 2,
            "name": "users:write"
        },
        {
            "id": 3,
            "name": "products:read"
        }
    ],
    "total": 3
}
```

#### Response (404 Not Found)

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

---

### 7. Asignar Permiso a un Rol

Asigna un permiso existente a un rol.

**Endpoint:** `POST /api/v1/roles/{id}/permissions`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `permission_id` | int | Sí | ID del permiso a asignar |

#### Request

```bash
curl -X POST "http://localhost:8080/api/v1/roles/admin/permissions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permission_id": 5
  }'
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Permiso asignado exitosamente"
}
```

#### Response (404 Not Found) - Rol no encontrado

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

#### Response (404 Not Found) - Permiso no encontrado

```json
{
    "success": false,
    "error": {
        "code": "PERMISSION_NOT_FOUND",
        "message": "permiso no encontrado"
    }
}
```

---

### 8. Remover Permiso de un Rol

Remueve un permiso de un rol.

**Endpoint:** `DELETE /api/v1/roles/{id}/permissions/{permissionId}`

#### Path Parameters

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | string | ID único del rol |
| `permissionId` | int | ID del permiso a remover |

#### Request

```bash
curl -X DELETE "http://localhost:8080/api/v1/roles/admin/permissions/5" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "message": "Permiso removido exitosamente"
}
```

#### Response (404 Not Found) - Rol no encontrado

```json
{
    "success": false,
    "error": {
        "code": "ROLE_NOT_FOUND",
        "message": "rol no encontrado"
    }
}
```

#### Response (404 Not Found) - Permiso no asignado

```json
{
    "success": false,
    "error": {
        "code": "PERMISSION_NOT_FOUND",
        "message": "el permiso no está asignado a este rol"
    }
}
```

---

## Endpoint de Permisos del Sistema

### 9. Listar Todos los Permisos

Lista todos los permisos disponibles en el sistema.

**Endpoint:** `GET /api/v1/permissions`

#### Request

```bash
curl -X GET "http://localhost:8080/api/v1/permissions" \
  -H "Authorization: Bearer <token>"
```

#### Response (200 OK)

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "users:read"
        },
        {
            "id": 2,
            "name": "users:write"
        },
        {
            "id": 3,
            "name": "products:read"
        },
        {
            "id": 4,
            "name": "products:write"
        },
        {
            "id": 5,
            "name": "sales:read"
        },
        {
            "id": 6,
            "name": "sales:write"
        }
    ],
    "total": 6
}
```

---

## Códigos de Error

| Código | HTTP Status | Descripción |
|--------|-------------|-------------|
| `ROLE_NOT_FOUND` | 404 | El rol especificado no existe |
| `ROLE_ALREADY_EXISTS` | 409 | Ya existe un rol con el nombre especificado |
| `CANNOT_DELETE_ROLE` | 409 | No se puede eliminar el rol porque tiene usuarios asignados |
| `PERMISSION_NOT_FOUND` | 404 | El permiso especificado no existe o no está asignado al rol |
| `VALIDATION_ERROR` | 400 | Error de validación en los datos de entrada |
| `INSUFFICIENT_PERMISSION` | 401 | Token inválido o sin permisos |

---

## Modelos de Datos

### Role

```typescript
interface Role {
    id: string;
    name: string;
}
```

### RoleDetail

```typescript
interface RoleDetail {
    id: string;
    name: string;
    description: string;
    permissions: Permission[];
    users_count: number;
    created_at: string;  // ISO 8601
    updated_at: string;  // ISO 8601
}
```

### RoleCreate

```typescript
interface RoleCreate {
    name: string;        // Requerido, 2-50 caracteres
    description?: string;
}
```

### RoleUpdate

```typescript
interface RoleUpdate {
    name?: string;       // 2-50 caracteres si se proporciona
    description?: string;
}
```

### Permission

```typescript
interface Permission {
    id: number;
    name: string;
}
```

### PermissionAssignRequest

```typescript
interface PermissionAssignRequest {
    permission_id: number;
}
```

---

## Notas de Implementación

1. **Normalización de nombres**: Los nombres de roles se convierten automáticamente a mayúsculas.

2. **IDs de roles**: Los IDs se generan automáticamente usando shortid y se truncan a 6 caracteres.

3. **Relaciones**:
   - Un rol puede tener múltiples permisos
   - Un rol puede estar asignado a múltiples usuarios
   - Al eliminar un rol, se eliminan sus relaciones con permisos y usuarios

4. **Validaciones**:
   - Nombre del rol: mínimo 2, máximo 50 caracteres
   - No se permiten nombres duplicados
   - No se puede eliminar un rol con usuarios asignados

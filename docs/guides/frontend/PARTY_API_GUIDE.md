# Guía de API de Parties (Clientes y Proveedores) para Frontend

## Base URL
`http://localhost:5050`

## Autenticación
- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal
Los endpoints de parties no requieren `branch_id` ni `X-Branch-ID`. La autenticación JWT es suficiente.

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `parties:read` |
| POST / PUT / DELETE / PATCH | `parties:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Modelo de Datos: Party

El Party Model unifica clientes y proveedores en una sola tabla `users.parties`. Cada registro tiene un `party_type`:

| Tipo | Descripción | Endpoint alias |
|------|-------------|----------------|
| `CLIENT` | Cliente regular | `/api/v1/clients` |
| `SUPPLIER` | Proveedor | `/api/v1/suppliers` |
| `CLIENT_SUPPLIER` | Es tanto cliente como proveedor | Solo vía `/api/v1/parties` |
| `INTERNAL` | Usuario interno del sistema | Solo vía User Admin |

### Response Object (Party)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | string | ID único (shortid) |
| party_type | string | `CLIENT`, `SUPPLIER`, `CLIENT_SUPPLIER` o `INTERNAL` |
| first_name | string | Nombre |
| last_name | string | Apellido |
| document_id | string | Documento de identidad (CI) |
| tax_id | string | RUC u otra identificación fiscal |
| email | string | Correo electrónico |
| phone | string | Teléfono |
| contact_info | object | JSON libre con datos de contacto adicionales |
| status | string | `"active"` o `"inactive"` |
| created_by | string | ID del usuario que creó el registro |
| created_at | string | Fecha de creación (ISO 8601) |
| updated_at | string | Fecha de última modificación (ISO 8601) |

### Response Wrapper (todos los endpoints de parties)

```json
{
    "success": true,
    "data": { ... },
    "message": "Party created successfully"
}
```

En errores:
```json
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "first_name is required"
    }
}
```

---

## 1. API Unificada `/api/v1/parties` (Recomendada)

### POST /api/v1/parties
**Descripción:** Crea un nuevo party (cliente, proveedor o ambos).

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| party_type | string | Sí | `CLIENT`, `SUPPLIER` o `CLIENT_SUPPLIER` |
| first_name | string | Sí | Nombre |
| last_name | string | No | Apellido (recomendado para `CLIENT`) |
| document_id | string | No | Documento de identidad (CI) |
| tax_id | string | No | RUC (recomendado para `SUPPLIER`) |
| email | string | No | Correo electrónico |
| phone | string | No | Teléfono |
| contact_info | object | No | JSON libre con datos de contacto |

#### Ejemplo Request

```json
{
    "party_type": "CLIENT",
    "first_name": "Juan",
    "last_name": "Pérez",
    "document_id": "1234567",
    "email": "juan@example.com",
    "phone": "0999123456"
}
```

#### Ejemplo Request — CLIENT_SUPPLIER

```json
{
    "party_type": "CLIENT_SUPPLIER",
    "first_name": "Comercial XYZ S.A.",
    "tax_id": "80000001-0",
    "document_id": "1234567",
    "email": "info@xyz.com",
    "phone": "021123456"
}
```

#### Response 200
Objeto `Party` envuelto en `{ "success": true, "data": {...}, "message": "..." }`.

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | `party_type` inválido o `first_name` vacío |
| 400 | `party_type` = `INTERNAL` (no permitido via API pública) |
| 401 | Token JWT inválido o ausente |
| 500 | Error interno de base de datos |

---

### GET /api/v1/parties
**Descripción:** Lista parties con filtros y paginación.

#### Query Parameters

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| party_type | string | — | Filtrar por tipo: `CLIENT`, `SUPPLIER`, `CLIENT_SUPPLIER` |
| status | string | — | `active` o `inactive` |
| search | string | — | Búsqueda en nombre, apellido, documento y RUC |
| page | int | 1 | Número de página |
| page_size | int | 20 | Elementos por página (máx 100) |

#### Ejemplo

```
GET /api/v1/parties?party_type=CLIENT&status=active&search=juan&page=1&page_size=10
```

#### Response 200

```json
{
    "items": [{ ... }, { ... }],
    "total": 42,
    "page": 1,
    "page_size": 10
}
```

#### Errores

| Código | Condición |
|--------|-----------|
| 401 | Token JWT inválido o ausente |
| 500 | Error interno de base de datos |

---

### GET /api/v1/parties/{id}
**Descripción:** Obtiene un party por su ID.

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| id | string | Sí | ID del party |

#### Response 200
Objeto `Party` completo.

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | `id` vacío |
| 401 | Token JWT inválido o ausente |
| 404 | Party no encontrado |
| 500 | Error interno de base de datos |

---

### PUT /api/v1/parties/{id}
**Descripción:** Actualiza un party existente. Solo los campos enviados se modifican (actualización parcial).

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| id | string | Sí | ID del party a actualizar |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| first_name | string | No | Nombre |
| last_name | string | No | Apellido |
| document_id | string | No | Documento de identidad |
| tax_id | string | No | RUC |
| email | string | No | Correo electrónico |
| phone | string | No | Teléfono |
| contact_info | object | No | JSON libre con datos de contacto |

#### Ejemplo (actualizar solo el teléfono)

```json
{
    "phone": "0999000111"
}
```

#### Response 200
Objeto `Party` actualizado envuelto en `{ "success": true, ... }`.

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | `id` vacío |
| 401 | Token JWT inválido o ausente |
| 500 | Error interno de base de datos |

---

### DELETE /api/v1/parties/{id}
**Descripción:** Eliminación lógica (soft delete). Cambia `status` a `"inactive"` y setea `deleted_at`.

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| id | string | Sí | ID del party a eliminar |

#### Response 200

```json
{
    "success": true,
    "message": "Party deleted successfully",
    "data": null
}
```

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | `id` vacío |
| 401 | Token JWT inválido o ausente |
| 500 | Error interno de base de datos |

---

### PATCH /api/v1/parties/{id}/type
**Descripción:** Cambia el tipo de un party. Permite transiciones entre tipos.

#### Transiciones permitidas

| Tipo Actual | Puede cambiar a |
|-------------|-----------------|
| `CLIENT` | `CLIENT_SUPPLIER` |
| `SUPPLIER` | `CLIENT_SUPPLIER` |
| `CLIENT_SUPPLIER` | `CLIENT` o `SUPPLIER` |
| `INTERNAL` | No se puede cambiar via API |

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| id | string | Sí | ID del party |

#### Request Body

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| new_type | string | Sí | `CLIENT`, `SUPPLIER` o `CLIENT_SUPPLIER` |

#### Ejemplo

```json
{
    "new_type": "CLIENT_SUPPLIER"
}
```

#### Response 200

```json
{
    "success": true,
    "message": "Party type changed successfully",
    "data": { ... }
}
```

#### Errores

| Código | Condición |
|--------|-----------|
| 400 | Transición no permitida o `new_type` inválido |
| 401 | Token JWT inválido o ausente |
| 500 | Error interno de base de datos |

---

## 2. Endpoints Alias `/api/v1/clients` y `/api/v1/suppliers`

Estos endpoints son wrappers de compatibilidad que internamente llaman al `PartyService` con `party_type` fijo. La respuesta usa el formato legacy (sin wrapper `{ success, data }`).

### POST /api/v1/clients
Crea un cliente. Internamente llama a `POST /api/v1/parties` con `party_type: "CLIENT"`.

#### Request Body (formato legacy)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del cliente |
| last_name | string | Sí | Apellido |
| document_id | string | No | Documento de identidad |
| contact | string | No | Teléfono |
| email | string | No | Correo electrónico |

**Nota:** El campo `contact` se mapea internamente a `phone` del modelo Party.

#### Response 200
Objeto `Client` (formato legacy):
```json
{
    "id": "abc123",
    "name": "Juan",
    "last_name": "Pérez",
    "document_id": "1234567",
    "status": "active",
    "contact": "0999123456",
    "email": "juan@example.com",
    "party_id": "abc123",
    "created_at": "2026-05-08T12:00:00Z"
}
```

### POST /api/v1/suppliers
Crea un proveedor. Internamente llama a `POST /api/v1/parties` con `party_type: "SUPPLIER"`.

#### Request Body (formato legacy)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del proveedor |
| contact_info | object | No | JSON libre con datos de contacto |
| tax_id | string | No | RUC |

#### Response 200
Objeto `Supplier` (formato legacy):
```json
{
    "id": "def456",
    "name": "Proveedor ABC",
    "contact_info": { "email": "abc@proveedor.com", "phone": "021123456" },
    "tax_id": "80000001-0",
    "status": "active",
    "user_id": "usr789",
    "party_id": "def456",
    "created_at": "2026-05-08T12:00:00Z"
}
```

### Rutas adicionales (GET/PUT/DELETE)

Los endpoints `GET`, `PUT` y `DELETE` de `/api/v1/clients/{id}` y `/api/v1/suppliers/{id}` comparten los mismos handlers que `/api/v1/parties/{id}`. La respuesta usa el formato Party estándar.

---

## 3. Endpoints Legacy (Deprecados)

### Rutas `/client/*` y `/supplier/*`

Estas rutas siguen funcionando pero **se consideran deprecadas**. El frontend debe migrar a `/api/v1/parties`.

| Legacy (deprecado) | Nuevo (recomendado) |
|---------------------|---------------------|
| `POST /client/` | `POST /api/v1/clients` o `POST /api/v1/parties` con `party_type: "CLIENT"` |
| `POST /supplier/` | `POST /api/v1/suppliers` o `POST /api/v1/parties` con `party_type: "SUPPLIER"` |
| `GET /client/{id}` | `GET /api/v1/parties/{id}` |
| `GET /supplier/{id}` | `GET /api/v1/parties/{id}` |
| `GET /client/{page}/{pageSize}` | `GET /api/v1/parties?party_type=CLIENT&page=...&page_size=...` |
| `GET /supplier/{page}/{pageSize}` | `GET /api/v1/parties?party_type=SUPPLIER&page=...&page_size=...` |
| `GET /client/name/{name}` | `GET /api/v1/parties?party_type=CLIENT&search=...` |
| `GET /supplier/name/{name}` | `GET /api/v1/parties?party_type=SUPPLIER&search=...` |
| `PUT /client/{id}` | `PUT /api/v1/parties/{id}` |
| `PUT /supplier/{id}` | `PUT /api/v1/parties/{id}` |
| `PUT /client/delete/{id}` | `DELETE /api/v1/parties/{id}` |
| `PUT /supplier/delete/{id}` | `DELETE /api/v1/parties/{id}` |

---

## 4. Migración de Frontend (Guía)

### Cambios clave

1. **Status es `string`, no `bool`.** Los endpoints nuevos retornan `"active"` / `"inactive"` en vez de `true` / `false`.
2. **Response wrapper.** Los endpoints `/api/v1/parties` envuelven la respuesta en `{ success, data, message }`. Los aliases `/api/v1/clients` y `/api/v1/suppliers` retornan el objeto directo (formato legacy).
3. **Paginación con metadatos.** `GET /api/v1/parties` retorna `{ items, total, page, page_size }`. Los endpoints legacy retornan solo el array.
4. **Nuevo endpoint de cambio de tipo.** `PATCH /api/v1/parties/{id}/type` permite cambiar un cliente a `CLIENT_SUPPLIER` y viceversa.

### Paso a paso

1. Cambiar `POST /client/` → `POST /api/v1/clients` (mismo request body, response con `status: "active"`)  
2. Cambiar `GET /client/{page}/{pageSize}` → `GET /api/v1/parties?party_type=CLIENT&page=&page_size=`  
3. Adaptar el manejo de `status`: de `true/false` a `"active"/"inactive"`  
4. Cambiar `PUT /client/delete/{id}` → `DELETE /api/v1/parties/{id}`  
5. (Opcional) Migrar a `POST /api/v1/parties` con `party_type: "CLIENT"` para usar el response wrapper unificado

---

## Notas

- **Party Model:** Todos los registros (clientes, proveedores, usuarios internos) comparten la tabla `users.parties`. El `party_type` determina el rol.
- **IDs:** Generados con `shortid` (string alfanumérico corto), mismo formato que productos.
- **Soft delete:** La eliminación es lógica (`status = "inactive"`, `deleted_at` poblado). No hay endpoint de recuperación.
- **Auditoría:** `created_by`, `updated_by`, `created_at`, `updated_at` se gestionan automáticamente. `created_by` nunca se sobreescribe en updates.
- **CLIENT_SUPPLIER:** Permite que una misma entidad sea cliente y proveedor. Solo se puede crear/ver via `/api/v1/parties`.

---

*Última actualización: 2026-05-08*

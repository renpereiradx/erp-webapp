# Guía de API de Sucursales para Frontend

## 🔧 Configuración General

### Base URL
http://localhost:5050

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`. Ver [MULTI_BRANCH_CONTEXT_GUIDE.md](./MULTI_BRANCH_CONTEXT_GUIDE.md).

### Formato de Respuesta Estándar
`{ success: bool, data?, message?, error?, pagination? }`

## Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

---

## Política de Soft Delete

Las sucursales se eliminan de forma lógica (soft delete). **No existe un endpoint DELETE para sucursales.**

- Para **desactivar** una sucursal: `PUT /branches/{id}` con `{"is_active": false}`
- Para **reactivar** una sucursal: `PUT /branches/{id}` con `{"is_active": true}`
- Las sucursales inactivas se excluyen de `GET /branches` por defecto; usar `?include_inactive=true` para incluirlas
- **No se puede desactivar** una sucursal si algún usuario la tiene como sucursal default (`is_default_branch = true`). Primero debe reasignarse la sucursal default del usuario.

---

## Permisos de Administración

Los siguientes endpoints requieren rol **ADMIN** (`role_id = "F2VLso"`):

| Endpoint | Permiso |
|----------|---------|
| `POST /branches` | Solo ADMIN |
| `PUT /branches/{id}` | Solo ADMIN |
| `POST /branches/{branch_id}/fiscal-config` | Solo ADMIN |
| `PUT /branches/fiscal-config/{id}` | Solo ADMIN |
| `POST /branches/{branch_id}/access` | Solo ADMIN |
| `PUT /branches/{branch_id}/access/{user_id}` | Solo ADMIN |
| `DELETE /branches/{branch_id}/access/{user_id}` | Solo ADMIN |

Los endpoints de lectura (`GET`) están disponibles para todos los usuarios autenticados, filtrados por sus sucursales permitidas.

---

## Endpoints

### POST /branches
**Descripción:** Crea una nueva sucursal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| code | string | Sí | Código único de la sucursal (se convierte a mayúsculas) |
| name | string | Sí | Nombre de la sucursal |
| branch_type | string | No | Tipo de sucursal. Valores: `POINT_OF_SALE`, `WAREHOUSE`, `HEADQUARTERS`, `DISTRIBUTION_CENTER`. Default: `POINT_OF_SALE` |
| legal_name | string | No | Razón social |
| trade_name | string | No | Nombre comercial |
| ruc | string | No | RUC (Registro Único de Contribuyente) |
| address | string | No | Dirección |
| city | string | No | Ciudad |
| state | string | No | Departamento/Estado |
| country | string | No | País |
| phone | string | No | Teléfono |
| email | string | No | Correo electrónico |
| allows_sales | bool | No | Permite ventas. Default: `true` |
| allows_purchases | bool | No | Permite compras. Default: `false` |
| is_warehouse | bool | No | Es depósito. Default: `false` |
| manager_user_id | string | No | ID del usuario gestor |

#### Response 201
```json
{
  "id": 1,
  "code": "MATRIZ",
  "name": "Sucursal Matriz",
  "branch_type": "POINT_OF_SALE",
  "legal_name": "Empresa S.A.",
  "trade_name": "Mi Negocio",
  "ruc": "80012345-6",
  "address": "Av. Principal 123",
  "city": "Asunción",
  "state": "Central",
  "country": "PY",
  "phone": "+59521123456",
  "email": "sucursal@empresa.com",
  "is_active": true,
  "allows_sales": true,
  "allows_purchases": false,
  "is_warehouse": false,
  "manager_user_id": "usr_abc123",
  "created_at": "2026-04-22T10:00:00Z",
  "updated_at": "2026-04-22T10:00:00Z",
  "created_by": "usr_abc123"
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | Body inválido, campos requeridos faltantes, o branch_type inválido |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador |
| 409 | Código de sucursal ya existe |
| 500 | Error interno |

---

### GET /branches
**Descripción:** Lista sucursales con paginación. Filtra por sucursales del usuario según JWT.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| include_inactive | bool | `false` | Incluir sucursales inactivas (soft delete) |
| page | int | `1` | Número de página |
| page_size | int | `20` | Elementos por página (máx. 100) |

#### Response 200
```json
{
  "branches": [
    {
      "id": 1,
      "code": "MATRIZ",
      "name": "Sucursal Matriz",
      "branch_type": "POINT_OF_SALE",
      "legal_name": "Empresa S.A.",
      "trade_name": "Mi Negocio",
      "ruc": "80012345-6",
      "address": "Av. Principal 123",
      "city": "Asunción",
      "state": "Central",
      "country": "PY",
      "phone": "+59521123456",
      "email": "sucursal@empresa.com",
      "is_active": true,
      "allows_sales": true,
      "allows_purchases": true,
      "is_warehouse": false,
      "manager_user_id": "usr_abc123",
      "created_at": "2026-04-22T10:00:00Z",
      "updated_at": "2026-04-22T10:00:00Z",
      "created_by": "usr_abc123"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 20
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 401 | Token ausente o inválido |
| 500 | Error interno |

---

### GET /branches/{id}
**Descripción:** Obtiene una sucursal por ID. El usuario debe tener acceso a la sucursal.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Response 200
```json
{
  "branch": {
    "id": 1,
    "code": "MATRIZ",
    "name": "Sucursal Matriz",
    "branch_type": "POINT_OF_SALE",
    "legal_name": "Empresa S.A.",
    "trade_name": "Mi Negocio",
    "ruc": "80012345-6",
    "address": "Av. Principal 123",
    "city": "Asunción",
    "state": "Central",
    "country": "PY",
    "phone": "+59521123456",
    "email": "sucursal@empresa.com",
    "is_active": true,
    "allows_sales": true,
    "allows_purchases": true,
    "is_warehouse": false,
    "manager_user_id": "usr_abc123",
    "created_at": "2026-04-22T10:00:00Z",
    "updated_at": "2026-04-22T10:00:00Z",
    "created_by": "usr_abc123"
  }
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` inválido |
| 401 | Token ausente o inválido |
| 403 | Sucursal no autorizada para el usuario |
| 404 | Sucursal no encontrada |
| 500 | Error interno |

---

### PUT /branches/{id}
**Descripción:** Actualiza una sucursal existente (actualización parcial). **Requiere rol ADMIN.**

#### Soft Delete vía PUT
Enviar `{"is_active": false}` para desactivar (soft delete). Se bloquea si la sucursal es default de algún usuario.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | No | Nombre |
| branch_type | string | No | Tipo: `POINT_OF_SALE`, `WAREHOUSE`, `HEADQUARTERS`, `DISTRIBUTION_CENTER` |
| legal_name | string | No | Razón social (null para limpiar) |
| trade_name | string | No | Nombre comercial (null para limpiar) |
| ruc | string | No | RUC (null para limpiar) |
| address | string | No | Dirección (null para limpiar) |
| city | string | No | Ciudad (null para limpiar) |
| state | string | No | Departamento (null para limpiar) |
| country | string | No | País (null para limpiar) |
| phone | string | No | Teléfono (null para limpiar) |
| email | string | No | Correo (null para limpiar) |
| is_active | bool | No | Estado activo (soft delete) |
| allows_sales | bool | No | Permite ventas |
| allows_purchases | bool | No | Permite compras |
| is_warehouse | bool | No | Es depósito |
| manager_user_id | string | No | ID del gestor (null para limpiar) |

#### Response 200
Estructura `Branch` actualizada dentro de `{"branch": {...}}`.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` inválido, body inválido, branch_type inválido, o no se puede desactivar (sucursal default de usuario) |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador, o sucursal no autorizada |
| 404 | Sucursal no encontrada |
| 500 | Error interno |

---

### POST /branches/{branch_id}/fiscal-config
**Descripción:** Crea configuración fiscal para una sucursal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| establishment_code | string | Sí | Código de establecimiento (SIFEN) |
| expedition_point | string | Sí | Punto de expedición |
| document_type | string | No | Tipo de documento fiscal: `FACTURA`, `NOTA_CREDITO`, `NOTA_DEBITO`. Default: `FACTURA` |
| timbrado | string | Sí | Número de timbrado |
| valid_from | datetime | No | Fecha inicio de validez |
| valid_to | datetime | No | Fecha fin de validez |
| invoice_prefix | string | No | Prefijo de factura |
| next_invoice_number | int | No | Próximo número de factura. Default: `1` |
| is_active | bool | No | Estado activo. Default: `true` |

#### Response 201
```json
{
  "id": 1,
  "branch_id": 1,
  "establishment_code": "001",
  "expedition_point": "001",
  "document_type": "FACTURA",
  "timbrado": "12345678",
  "valid_from": "2026-01-01T00:00:00Z",
  "valid_to": "2027-12-31T23:59:59Z",
  "invoice_prefix": "001-001-",
  "next_invoice_number": 1,
  "is_active": true,
  "created_at": "2026-04-22T10:00:00Z",
  "updated_at": "2026-04-22T10:00:00Z",
  "created_by": "usr_abc123",
  "updated_by": "usr_abc123"
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | Body inválido, campos requeridos faltantes, o document_type inválido |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador, o sucursal no autorizada |
| 404 | Sucursal no encontrada |
| 500 | Error interno |

---

### GET /branches/{branch_id}/fiscal-config
**Descripción:** Lista configuraciones fiscales de una sucursal.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Query Parameters
| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| active_only | bool | `false` | Solo configuraciones activas |

#### Response 200
```json
{
  "configs": [
    {
      "id": 1,
      "branch_id": 1,
      "establishment_code": "001",
      "expedition_point": "001",
      "document_type": "FACTURA",
      "timbrado": "12345678",
      "valid_from": "2026-01-01T00:00:00Z",
      "valid_to": "2027-12-31T23:59:59Z",
      "invoice_prefix": "001-001-",
      "next_invoice_number": 1,
      "is_active": true,
      "created_at": "2026-04-22T10:00:00Z",
      "updated_at": "2026-04-22T10:00:00Z",
      "created_by": "usr_abc123",
      "updated_by": "usr_abc123"
    }
  ]
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | Sucursal no autorizada |
| 404 | Sucursal no encontrada |
| 500 | Error interno |

---

### GET /branches/fiscal-config/{id}
**Descripción:** Obtiene una configuración fiscal individual por su ID.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Response 200
```json
{
  "config": {
    "id": 1,
    "branch_id": 1,
    "establishment_code": "001",
    "expedition_point": "001",
    "document_type": "FACTURA",
    "timbrado": "12345678",
    "valid_from": "2026-01-01T00:00:00Z",
    "valid_to": "2027-12-31T23:59:59Z",
    "invoice_prefix": "001-001-",
    "next_invoice_number": 1,
    "is_active": true,
    "created_at": "2026-04-22T10:00:00Z",
    "updated_at": "2026-04-22T10:00:00Z",
    "created_by": "usr_abc123",
    "updated_by": "usr_abc123"
  }
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` inválido |
| 401 | Token ausente o inválido |
| 403 | Sucursal de la config no autorizada |
| 404 | Configuración fiscal no encontrada |
| 500 | Error interno |

---

### PUT /branches/fiscal-config/{id}
**Descripción:** Actualiza una configuración fiscal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| establishment_code | string | No | Código de establecimiento |
| expedition_point | string | No | Punto de expedición |
| document_type | string | No | Tipo: `FACTURA`, `NOTA_CREDITO`, `NOTA_DEBITO` |
| timbrado | string | No | Timbrado |
| valid_from | datetime | No | Fecha inicio |
| valid_to | datetime | No | Fecha fin |
| invoice_prefix | string | No | Prefijo |
| next_invoice_number | int | No | Próximo número (debe ser > 0) |
| is_active | bool | No | Estado activo |

#### Response 200
Estructura `BranchFiscalConfig` actualizada.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `id` inválido, body inválido, o next_invoice_number <= 0 |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador |
| 404 | Configuración no encontrada |
| 500 | Error interno |

---

### POST /branches/{branch_id}/access
**Descripción:** Otorga acceso a un usuario sobre una sucursal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| user_id | string | Sí | ID del usuario |
| access_type | string | No | Tipo de acceso: `FULL`, `LIMITED`, `READ_ONLY`. Default: `FULL` |
| is_default_branch | bool | No | Marcar como sucursal default. Default: `false` |

#### Response 201
```json
{
  "id": 1,
  "user_id": "usr_abc123",
  "branch_id": 1,
  "access_type": "FULL",
  "is_default_branch": true,
  "granted_at": "2026-04-22T10:00:00Z",
  "granted_by": "usr_admin456"
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | Body inválido, user_id vacío, o access_type inválido |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador, o sucursal no autorizada |
| 404 | Sucursal o usuario no encontrado |
| 409 | El usuario ya tiene acceso a esta sucursal |
| 500 | Error interno |

---

### GET /branches/{branch_id}/access
**Descripción:** Lista accesos de usuarios para una sucursal.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Response 200
```json
{
  "access": [
    {
      "id": 1,
      "user_id": "usr_abc123",
      "branch_id": 1,
      "access_type": "FULL",
      "is_default_branch": true,
      "granted_at": "2026-04-22T10:00:00Z",
      "granted_by": "usr_admin456"
    }
  ]
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` inválido |
| 401 | Token ausente o inválido |
| 403 | Sucursal no autorizada |
| 404 | Sucursal no encontrada |
| 500 | Error interno |

---

### PUT /branches/{branch_id}/access/{user_id}
**Descripción:** Actualiza el acceso de un usuario a una sucursal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |
| Content-Type | Sí | `application/json` |

#### Request Body
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| access_type | string | No | Tipo de acceso: `FULL`, `LIMITED`, `READ_ONLY` |
| is_default_branch | bool | No | Es default |

#### Response 200
Estructura `UserBranchAccess` actualizada.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` o `user_id` inválidos, o access_type inválido |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador, o sucursal no autorizada |
| 404 | Acceso no encontrado |
| 500 | Error interno |

---

### DELETE /branches/{branch_id}/access/{user_id}
**Descripción:** Revoca el acceso de un usuario a una sucursal. **Requiere rol ADMIN.**

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Response 200
```json
{
  "message": "Acceso eliminado correctamente"
}
```

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `branch_id` o `user_id` inválidos |
| 401 | Token ausente o inválido |
| 403 | Usuario no es administrador, o sucursal no autorizada |
| 500 | Error interno |

---

### GET /users/{user_id}/branches
**Descripción:** Lista las sucursales a las que un usuario tiene acceso.

#### Headers
| Header | Requerido | Descripción |
|--------|-----------|-------------|
| Authorization | Sí | Bearer token |

#### Response 200
```json
{
  "access": [
    {
      "id": 1,
      "user_id": "usr_abc123",
      "branch_id": 1,
      "access_type": "FULL",
      "is_default_branch": true,
      "granted_at": "2026-04-22T10:00:00Z",
      "granted_by": "usr_admin456"
    }
  ]
}
```

> **Nota:** Si el usuario autenticado no es el dueño del `user_id` solicitado, solo se retornan las sucursales que ambos tienen en común.

#### Errores
| Código | Condición |
|--------|-----------|
| 400 | `user_id` vacío |
| 401 | Token ausente o inválido |
| 403 | Sin sucursales en común |
| 404 | Usuario no encontrado |
| 500 | Error interno |

---

## Tipos de Sucursal

| Tipo | Descripción |
|------|-------------|
| `POINT_OF_SALE` | Punto de venta (default) |
| `WAREHOUSE` | Depósito/almacén |
| `HEADQUARTERS` | Casa matriz |
| `DISTRIBUTION_CENTER` | Centro de distribución |

## Tipos de Acceso

| Tipo | Descripción |
|------|-------------|
| `FULL` | Acceso total a la sucursal (default al crear) |
| `LIMITED` | Puede operar transacciones |
| `READ_ONLY` | Solo lectura |

## Tipos de Documento Fiscal

| Tipo | Descripción |
|------|-------------|
| `FACTURA` | Factura electrónica (default) |
| `NOTA_CREDITO` | Nota de crédito |
| `NOTA_DEBITO` | Nota de débito |

---

## Resumen de Endpoints

| Método | Endpoint | Descripción | Permiso |
|--------|----------|-------------|---------|
| POST | `/branches` | Crear sucursal | ADMIN |
| GET | `/branches` | Listar sucursales (paginado) | Autenticado |
| GET | `/branches/{id}` | Obtener sucursal | Autenticado |
| PUT | `/branches/{id}` | Actualizar sucursal (soft delete vía `is_active`) | ADMIN |
| POST | `/branches/{branch_id}/fiscal-config` | Crear config fiscal | ADMIN |
| GET | `/branches/{branch_id}/fiscal-config` | Listar configs fiscales | Autenticado |
| GET | `/branches/fiscal-config/{id}` | Obtener config fiscal individual | Autenticado |
| PUT | `/branches/fiscal-config/{id}` | Actualizar config fiscal | ADMIN |
| POST | `/branches/{branch_id}/access` | Otorgar acceso | ADMIN |
| GET | `/branches/{branch_id}/access` | Listar accesos | Autenticado |
| PUT | `/branches/{branch_id}/access/{user_id}` | Actualizar acceso | ADMIN |
| DELETE | `/branches/{branch_id}/access/{user_id}` | Revocar acceso | ADMIN |
| GET | `/users/{user_id}/branches` | Sucursales del usuario | Autenticado |

---

*Última actualización: 2026-05-19*

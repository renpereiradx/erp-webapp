# Guía de API de Proveedores para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal

Los endpoints de proveedores no requieren `branch_id` ni `X-Branch-ID`. La autenticación JWT es suficiente.

---

## Endpoints

### POST /supplier/

**Descripción:** Crea un nuevo proveedor.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo        | Tipo   | Requerido | Descripción                                                    |
| ------------ | ------ | --------- | -------------------------------------------------------------- |
| name         | string | Sí        | Nombre del proveedor                                           |
| contact_info | object | No        | JSON libre con datos de contacto (email, phone, address, etc.) |
| tax_id       | string | No        | RUC/RFC o identificación fiscal                                |

#### Response 201

| Campo        | Tipo   | Descripción                               |
| ------------ | ------ | ----------------------------------------- |
| id           | string | ID único generado automáticamente         |
| name         | string | Nombre del proveedor                      |
| contact_info | object | Información de contacto en formato JSON   |
| tax_id       | string | Identificación fiscal                     |
| status       | bool   | `true` = activo, `false` = inactivo       |
| created_at   | string | Fecha de creación (ISO 8601)              |
| user_id      | string | ID del usuario que creó el registro       |
| party_id     | string | ID en tabla `users.parties` (Party Model) |

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `name` vacío                   |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno al guardar en DB |

---

### GET /supplier/{id}

**Descripción:** Obtiene un proveedor por su ID.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción      |
| --------- | ------ | --------- | ---------------- |
| id        | string | Sí        | ID del proveedor |

#### Response 200

Mismo schema que Response 201 de `POST /supplier/`.

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `id` vacío                     |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno de base de datos |

---

### GET /supplier/name/{name}

**Descripción:** Busca proveedores por nombre (búsqueda parcial).

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción         |
| --------- | ------ | --------- | ------------------- |
| name      | string | Sí        | Término de búsqueda |

#### Response 200

Array de objetos con el mismo schema que Response 201 de `POST /supplier/`.

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `name` vacío                   |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno de base de datos |

---

### GET /supplier/{page}/{pageSize}

**Descripción:** Lista proveedores con paginación.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo | Requerido | Descripción                      |
| --------- | ---- | --------- | -------------------------------- |
| page      | int  | Sí        | Número de página (>= 1)          |
| pageSize  | int  | Sí        | Cantidad de elementos por página |

#### Response 200

Array de objetos con el mismo schema que Response 201 de `POST /supplier/`.

#### Errores

| Código | Condición                                            |
| ------ | ---------------------------------------------------- |
| 400    | `page` o `pageSize` vacíos, o no son enteros válidos |
| 401    | Token JWT inválido o ausente                         |
| 500    | Error interno de base de datos                       |

---

### PUT /supplier/{id}

**Descripción:** Actualiza un proveedor existente.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción                   |
| --------- | ------ | --------- | ----------------------------- |
| id        | string | Sí        | ID del proveedor a actualizar |

#### Request Body

| Campo        | Tipo   | Requerido | Descripción                      |
| ------------ | ------ | --------- | -------------------------------- |
| name         | string | Sí        | Nombre del proveedor             |
| contact_info | object | No        | JSON libre con datos de contacto |
| tax_id       | string | No        | Identificación fiscal            |

#### Response 200

Mismo schema que Response 201 de `POST /supplier/`.

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `id` vacío, o `name` vacío     |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno de base de datos |

---

### PUT /supplier/delete/{id}

**Descripción:** Elimina un proveedor de forma lógica (soft delete). Cambia `status` a `false`.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción                 |
| --------- | ------ | --------- | --------------------------- |
| id        | string | Sí        | ID del proveedor a eliminar |

#### Response 200

| Campo   | Tipo   | Descripción          |
| ------- | ------ | -------------------- |
| message | string | `"Supplier deleted"` |

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `id` vacío                     |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno de base de datos |

---

## Notas

- **Party Model:** Aunque internamente los proveedores se almacenan en `users.parties`, el API externo sigue exponiendo el modelo `Supplier` compatible. El campo `party_id` vincula el registro con la tabla unificada.
- **ID tipo string:** El campo `id` es de tipo `string`, no numérico. Anteriormente era `int64`; la migración Party Model lo convirtió a `string`.
- **contact_info:** Campo JSON libre. El frontend puede enviar cualquier estructura de objeto (email, phone, address, etc.). El backend lo almacena como `json.RawMessage`.
- **Soft delete:** La eliminación es lógica (`status = false`). No hay endpoint de recuperación.
- **Auditoría:** `user_id` y `created_at` se asignan automáticamente; `created_at` nunca se sobreescribe.

---

_Última actualización: 2026-04-22_

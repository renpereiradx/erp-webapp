# Guía de API de Clientes para Frontend

## Base URL

`http://localhost:5050`

## Autenticación

- Header: `Authorization: Bearer <jwt_token>`

## Contexto de Sucursal

Los endpoints de clientes no requieren `branch_id` ni `X-Branch-ID`. La autenticación JWT es suficiente.

---

## Endpoints

### POST /client/

**Descripción:** Crea un nuevo cliente.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Request Body

| Campo       | Tipo   | Requerido | Descripción                             |
| ----------- | ------ | --------- | --------------------------------------- |
| name        | string | Sí        | Nombre del cliente                      |
| last_name   | string | Sí        | Apellido del cliente                    |
| document_id | string | No        | Documento de identidad (CI, RUC, etc.)  |
| contact     | string | No        | Teléfono u otra información de contacto |

#### Response 201

| Campo       | Tipo   | Descripción                               |
| ----------- | ------ | ----------------------------------------- |
| id          | string | ID único generado (shortid)               |
| name        | string | Nombre del cliente                        |
| last_name   | string | Apellido del cliente                      |
| document_id | string | Documento de identidad                    |
| status      | bool   | `true` = activo, `false` = inactivo       |
| user_id     | string | ID del usuario que creó el registro       |
| created_at  | string | Fecha de creación (ISO 8601)              |
| contact     | string | Información de contacto                   |
| email       | string | Email del cliente (si aplica)             |
| party_id    | string | ID en tabla `users.parties` (Party Model) |

#### Errores

| Código | Condición                                   |
| ------ | ------------------------------------------- |
| 400    | `name` o `last_name` vacíos                 |
| 401    | Token JWT inválido o ausente                |
| 500    | Error interno al generar ID o guardar en DB |

---

### GET /client/{id}

**Descripción:** Obtiene un cliente por su ID.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción    |
| --------- | ------ | --------- | -------------- |
| id        | string | Sí        | ID del cliente |

#### Response 200

Mismo schema que Response 201 de `POST /client/`.

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `id` vacío                     |
| 401    | Token JWT inválido o ausente   |
| 404    | Cliente no encontrado          |
| 500    | Error interno de base de datos |

---

### GET /client/name/{name}

**Descripción:** Busca clientes por nombre (búsqueda parcial en nombre y apellido).

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción         |
| --------- | ------ | --------- | ------------------- |
| name      | string | Sí        | Término de búsqueda |

#### Response 200

Array de objetos con el mismo schema que Response 201 de `POST /client/`.

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `name` vacío                   |
| 401    | Token JWT inválido o ausente   |
| 404    | No se encontraron clientes     |
| 500    | Error interno de base de datos |

---

### GET /client/{page}/{pageSize}

**Descripción:** Lista clientes con paginación.

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

Array de objetos con el mismo schema que Response 201 de `POST /client/`.

#### Errores

| Código | Condición                                            |
| ------ | ---------------------------------------------------- |
| 400    | `page` o `pageSize` vacíos, o no son enteros válidos |
| 401    | Token JWT inválido o ausente                         |
| 500    | Error interno de base de datos                       |

---

### PUT /client/{id}

**Descripción:** Actualiza un cliente existente.

#### Headers

| Header        | Requerido | Descripción        |
| ------------- | --------- | ------------------ |
| Authorization | Sí        | Bearer token       |
| Content-Type  | Sí        | `application/json` |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción                 |
| --------- | ------ | --------- | --------------------------- |
| id        | string | Sí        | ID del cliente a actualizar |

#### Request Body

| Campo       | Tipo   | Requerido | Descripción             |
| ----------- | ------ | --------- | ----------------------- |
| name        | string | Sí        | Nombre del cliente      |
| last_name   | string | Sí        | Apellido del cliente    |
| document_id | string | No        | Documento de identidad  |
| contact     | string | No        | Información de contacto |

#### Response 200

Mismo schema que Response 201 de `POST /client/`.

#### Errores

| Código | Condición                               |
| ------ | --------------------------------------- |
| 400    | `id` vacío, o `name`/`last_name` vacíos |
| 401    | Token JWT inválido o ausente            |
| 500    | Error interno de base de datos          |

---

### PUT /client/delete/{id}

**Descripción:** Elimina un cliente de forma lógica (soft delete). Cambia `status` a `false`.

#### Headers

| Header        | Requerido | Descripción  |
| ------------- | --------- | ------------ |
| Authorization | Sí        | Bearer token |

#### Path Parameters

| Parámetro | Tipo   | Requerido | Descripción               |
| --------- | ------ | --------- | ------------------------- |
| id        | string | Sí        | ID del cliente a eliminar |

#### Response 200

| Campo   | Tipo   | Descripción        |
| ------- | ------ | ------------------ |
| message | string | `"Client deleted"` |

#### Errores

| Código | Condición                      |
| ------ | ------------------------------ |
| 400    | `id` vacío                     |
| 401    | Token JWT inválido o ausente   |
| 500    | Error interno de base de datos |

---

## Notas

- **Party Model:** Aunque internamente los clientes se almacenan en `users.parties`, el API externo sigue exponiendo el modelo `Client` compatible. El campo `party_id` vincula el registro con la tabla unificada.
- **IDs:** Generados con `shortid` (string alfanumérico corto).
- **Soft delete:** La eliminación es lógica (`status = false`). No hay endpoint de recuperación.
- **Auditoría:** `user_id` y `created_at` se asignan automáticamente; `created_at` nunca se sobreescribe.
- **Búsqueda por nombre:** Coincide parcialmente tanto en `name` como en `last_name`.

---

_Última actualización: 2026-04-22_

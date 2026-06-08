# Reserva y Horarios - Guia Unificada Frontend

> **Disclaimer:** Esta guía contiene ejemplos JSON para ilustración de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

## Descripcion General

Esta guia unifica la integracion frontend de:

- Gestion de reservas (`/reserve/*`)
- Consulta y generacion de horarios (`/schedules/*`)
- Configuracion de ventana de generacion por producto

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

### Formato de Fechas
- Payloads: ISO 8601 (`2026-03-24T15:30:00Z`)
- Query params: `YYYY-MM-DD`

### Paginación Estándar
`{ page, page_size, total_items, total_pages, has_next, has_prev }`

### Autenticacion

- Requieren JWT: todo `/reserve/*`, y endpoints de generacion/configuracion write en `/schedules/*`.
- No requieren JWT: consultas de horarios (`GET /schedules/...`) y `GET /schedules/product/{productId}/config`.

### Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restriccion: sucursal debe estar en `allowed_branches`

> **Nota:** `?branch_id` tiene prioridad sobre `X-Branch-ID`.

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

### Módulo de Reservas

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `reserves:read` |
| POST / PUT / DELETE / PATCH | `reserves:write` |

### Módulo de Horarios

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `schedules:read` |
| POST / PUT / DELETE / PATCH | `schedules:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

## Modelos Principales

### ManageReserveRequest

```json
{
  "action": "CREATE",
  "reserve_id": 0,
  "product_id": "CANCHA_01",
  "client_id": "CLIENT_01",
  "start_time": "2026-03-24T16:00:00Z",
  "duration": 2,
  "branch_id": 1
}
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `action` | string | `CREATE \| UPDATE \| CONFIRM \| CANCEL` |
| `reserve_id` | int64 | Requerido para `UPDATE`, `CONFIRM`, `CANCEL` |
| `product_id` | string | Requerido para `CREATE` |
| `client_id` | string | Requerido para `CREATE` |
| `start_time` | string | ISO-8601. Requerido para `CREATE`. Vacio para `CONFIRM`/`CANCEL` |
| `duration` | int | Horas (entero positivo). Default 1 |
| `branch_id` | int \| null | ID de sucursal. Si se omite, se usa el branch del contexto de autenticacion (`X-Branch-ID` o `active_branch` del JWT) |

> **Nota multi-branch:** Si `branch_id` no se envia en el body, el backend lo resuelve automaticamente desde el contexto de autenticacion (`X-Branch-ID` header, `?branch_id` query param, o `active_branch` del JWT). Las operaciones de escritura (CREATE/UPDATE/CANCEL/CONFIRM) validan ownership del branch: no se puede modificar/cancelar/confirmar una reserva de otra sucursal si se envia `branch_id` explicitamente.

### GenerateSchedulesForDateRequest

```json
{
  "target_date": "2026-03-25",
  "product_ids": ["CANCHA_01", "CANCHA_02"]
}
```

- Si `product_ids` se omite o vacio, el backend hace auto discovery.

### UpsertScheduleConfigByProductRequest

```json
{
  "start_hour": 16,
  "end_hour": 22,
  "slot_minutes": 60,
  "timezone": "America/Asuncion",
  "effective_from": "2026-03-24",
  "effective_to": null,
  "is_active": true
}
```

Reglas:

- `start_hour`: `0..23`
- `end_hour`: `1..24`
- `start_hour < end_hour`
- `slot_minutes`: actualmente solo `60`

## Endpoints de Reservas (`/reserve`)

Todos requieren JWT.

| Metodo | Endpoint | Descripcion | Branch Context |
| ------ | ------------------------------- | -------------------------------------------------------------- | -------------- |
| `POST` | `/reserve/manage` | Crear/actualizar/confirmar/cancelar reserva | Si — body o header |
| `GET` | `/reserve/available-schedules` | Horarios disponibles para reservar por producto/fecha/duracion | Si — query param |
| `GET` | `/reserve/report` | Reporte de reservas por rango y filtros | Si — query param |
| `GET` | `/reserve/consistency/check` | Diagnostico de consistencia reserva/venta/horarios | Si — query param |
| `GET` | `/reserve/all` | Lista completa de reservas | Si — query param |
| `GET` | `/reserve/date-range` | Reservas por rango de fechas | Si — query param |
| `GET` | `/reserve/client/name/{name}` | Busqueda por nombre de cliente | Si — query param |
| `GET` | `/reserve/product/{product_id}` | Reservas por producto | Si — query param |
| `GET` | `/reserve/client/{client_id}` | Reservas por cliente | Si — query param |
| `GET` | `/reserve/{id}` | Reserva por ID | Si — query param |

> **Todos los endpoints GET de reservas** aceptan `?branch_id=<id>` o header `X-Branch-ID` para filtrar resultados por sucursal. Si se omite, el sistema usa `active_branch` del JWT.

### Operaciones de Escritura (POST /reserve/manage)

| Accion | `branch_id` en body | Valida ownership | Error si no pertenece al branch |
|--------|---------------------|-----------------|--------------------------------|
| CREATE | Opcional (se inyecta del contexto) | No | — |
| UPDATE | Opcional | Si | "Reservation X does not belong to branch Y" |
| CANCEL | Opcional | Si | "Reservation X does not belong to branch Y" |
| CONFIRM | Opcional | Si | "Reservation X does not belong to branch Y" |

### Ejemplos con branch context

```bash
# Obtener horarios disponibles en sucursal 2
curl "http://localhost:5050/reserve/available-schedules?product_id=CANCHA_01&date=2026-05-10&duration_hours=2&branch_id=2" \
  -H "Authorization: Bearer <token>"

# Obtener reserva por ID en sucursal 1
curl "http://localhost:5050/reserve/42?branch_id=1" \
  -H "Authorization: Bearer <token>"

# Consultar consistencia por sucursal
curl "http://localhost:5050/reserve/consistency/check?branch_id=2" \
  -H "Authorization: Bearer <token>"

# Reporte de reservas filtrado por sucursal y fechas
curl "http://localhost:5050/reserve/report?start_date=2026-05-01&end_date=2026-05-31&branch_id=1" \
  -H "Authorization: Bearer <token>"
```

Ejemplo rapido:

```bash
# Crear reserva en sucursal 2
curl -X POST "http://localhost:5050/reserve/manage?branch_id=2" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"CREATE",
    "product_id":"CANCHA_01",
    "client_id":"CLIENT_01",
    "start_time":"2026-03-24T16:00:00Z",
    "duration":2,
    "branch_id":2
  }'
```

> Tip: `branch_id` puede ir tanto en el body JSON como via query param `?branch_id=` o header `X-Branch-ID`. Si se envia en ambos, el del body tiene prioridad.

### Respuesta de ManageReserve (branch-aware)

La respuesta JSON de `manage_reserve` ahora incluye `branch_id`:

```json
{
  "success": true,
  "action": "CREATE",
  "reserve_id": 42,
  "total_amount": 120000,
  "hourly_price": 60000,
  "branch_id": 2,
  "message": "Reservation created successfully"
}
```

Errores de branch ownership:

```json
{
  "success": false,
  "error": "Reservation 42 does not belong to branch 3",
  "action": "CONFIRM"
}
```

## Endpoints de Horarios (`/schedules`)

### Consulta (sin JWT)

| Metodo | Endpoint | Descripcion |
| ------ | ------------------------------------------------------ | ----------------------------------------- |
| `GET` | `/schedules/available` | Disponibilidad global (filtros por query) |
| `GET` | `/schedules/today` | Horarios del dia actual |
| `GET` | `/schedules/product/{productId}/date/{date}/available` | Horarios disponibles por producto/fecha |
| `GET` | `/schedules/product/{productId}/date/{date}/all` | Todos los slots + estado de reserva |
| `GET` | `/schedules/product/{productId}/all` | Todos los horarios de producto |
| `GET` | `/schedules/product/{productId}` | Horarios de producto (paginado) |
| `GET` | `/schedules/{id}` | Horario por ID |
| `GET` | `/schedules/product/{productId}/config` | Config activa de generacion por producto |

### Generacion / configuracion (con JWT)

| Metodo | Endpoint | Descripcion |
| ------ | --------------------------------------- | ----------------------------------------------- |
| `POST` | `/schedules/generate/daily` | Generacion diaria |
| `POST` | `/schedules/generate/today` | Generar para hoy |
| `POST` | `/schedules/generate/tomorrow` | Generar para manana |
| `POST` | `/schedules/generate/date` | Generar por fecha usando config por producto |
| `POST` | `/schedules/generate/date/custom-range` | Generar por fecha con rango explicito |
| `POST` | `/schedules/generate/next-days` | Generar proximos N dias |
| `POST` | `/schedules/product/{productId}/config` | Crear/actualizar config de ventana por producto |

Ejemplo: generar por fecha con config por producto

```bash
curl -X POST "http://localhost:5050/schedules/generate/date" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_date":"2026-03-25",
    "product_ids":["CANCHA_01"]
  }'
```

Ejemplo: setear ventana por producto

```bash
curl -X POST "http://localhost:5050/schedules/product/CANCHA_01/config" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "start_hour":16,
    "end_hour":22,
    "slot_minutes":60,
    "timezone":"America/Asuncion",
    "effective_from":"2026-03-24",
    "is_active":true
  }'
```

## Flujo recomendado en frontend

1. Configurar ventana por producto (`POST /schedules/product/{productId}/config`).
2. Generar slots (`POST /schedules/generate/date`).
3. Mostrar agenda completa (`GET /schedules/product/{productId}/date/{date}/all`).
4. Crear reserva (`POST /reserve/manage` con `action=CREATE`).
5. Confirmar o cancelar segun proceso (`CONFIRM` / `CANCEL`).
6. Usar `GET /reserve/consistency/check` en vistas admin/soporte.

## Codigos de respuesta comunes

| Codigo | Condicion |
|--------|-----------|
| 200 | Operacion exitosa |
| 201 | Recurso creado (ej. config de horario por producto) |
| 400 | Parametros invalidos, horario no disponible, reserva ya cancelada |
| 401 | Token ausente/invalido |
| 403 | Branch ownership: reserva no pertenece a la sucursal |
| 500 | Error interno (SQL error, etc.) |

## Modelo de respuesta: ReserveRiched (branch-aware)

Todas las responses de GET de reservas incluyen `branch_id`:

```json
{
  "id": 42,
  "product_id": "CANCHA_01",
  "product_name": "Cancha de Fútbol",
  "product_description": "Cancha profesional",
  "client_id": "CLIENT_01",
  "client_name": "Juan Pérez",
  "start_time": "2026-03-24T16:00:00Z",
  "end_time": "2026-03-24T18:00:00Z",
  "duration": 2,
  "total_amount": 120000,
  "status": "RESERVED",
  "user_id": "USR_001",
  "user_name": "Admin User",
  "reserve_date": "2026-03-24",
  "branch_id": 2
}
```

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `branch_id` | int \| null | ID de la sucursal a la que pertenece la reserva. `null` si no esta asignada |

## Modelo de respuesta: ReservationReport (branch-aware)

```json
{
  "reserve_id": 42,
  "product_name": "Cancha de Fútbol",
  "client_name": "Juan Pérez",
  "start_time": "2026-03-24T16:00:00Z",
  "end_time": "2026-03-24T18:00:00Z",
  "duration_hours": 2,
  "total_amount": 120000,
  "status": "CONFIRMED",
  "created_by": "Admin User",
  "days_until_reservation": 5,
  "branch_id": 2
}
```

## Modelo de respuesta: AvailableSchedule (branch-aware)

```json
{
  "start_time": "2026-03-25T15:00:00Z",
  "end_time": "2026-03-25T16:00:00Z",
  "available_consecutive_hours": 3
}
```

> **Nota:** `AvailableSchedule` no incluye `branch_id` en la respuesta. El filtrado por branch se realiza via query param `?branch_id=` en el endpoint.

## Modelo de respuesta: ScheduleWithReservationInfo

`GET /schedules/product/{productId}/date/{date}/all` devuelve slots con info de reserva:

```json
[
  {
    "id": 123,
    "product_id": "CANCHA_01",
    "product_name": "Cancha de Fútbol",
    "start_time": "2026-03-25T15:00:00Z",
    "end_time": "2026-03-25T16:00:00Z",
    "is_available": false,
    "reserved_by": "Juan Pérez",
    "reserve_id": 14,
    "reserve_status": "RESERVED"
  },
  {
    "id": 124,
    "product_id": "CANCHA_01",
    "product_name": "Cancha de Fútbol",
    "start_time": "2026-03-25T16:00:00Z",
    "end_time": "2026-03-25T17:00:00Z",
    "is_available": false,
    "reserved_by": "Juan Pérez",
    "reserve_id": 14,
    "reserve_status": "RESERVED"
  }
]
```

### Importante: Deteccion de overlap para reservas multi-hora

Cuando un cliente reserva 2+ horas (ej: 15:00-17:00), el sistema detecta automaticamente todos los slots cubiertos:

- Reserva de 15:00 a 17:00 (2 horas) -> Los slots 15:00-16:00 y 16:00-17:00 aparecen como ocupados
- Ambos slots tendran el mismo `reserve_id` y `reserved_by`
- El campo `is_available` sera `false` para ambos slots

El frontend debe agrupar visualmente slots con el mismo `reserve_id` para mostrar la reserva completa.

## Notas de implementacion

- El estado de reserva debe guiar la UI (`RESERVED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
- Para fecha en path/query usar `YYYY-MM-DD`.
- Para fecha/hora en payload usar ISO-8601.
- Mantener zona horaria de negocio en UI (`America/Asuncion`) para evitar desfasajes.
- **Reservas multi-hora**: Cuando muestres slots ocupados, agrupa por `reserve_id` para indicar visualmente que es la misma reserva.
- **Campo `reserved_by`**: Contiene "Nombre Apellido" del cliente que reservo. Usalo para mostrar quien ocupa el slot.

## Integracion Reserva -> Venta (obligatorio)

Cuando conviertas una reserva confirmada en venta (`POST /sale/`):

- Enviar `reserve_id` en el request raiz de la venta.
- En el detalle del producto de servicio reservado, enviar tambien `reserve_id`.
- No reutilizar `reserve_id` en productos adicionales (ej: bebidas, snacks).

Payload recomendado:

```json
{
  "client_id": "7s0XHleHg",
  "reserve_id": 18,
  "allow_price_modifications": true,
  "currency_id": 1,
  "product_details": [
    {
      "product_id": "5Jqh2t4vg",
      "quantity": 1,
      "reserve_id": 18,
      "sale_price": 60000
    },
    {
      "product_id": "-PhxobeHg",
      "quantity": 2
    }
  ]
}
```

Regla de descuento:

- Para llegar al monto final del servicio, usar una sola estrategia por item (`sale_price` o `discount_*`), no ambas al mismo tiempo.

---

_Ultima actualizacion: 2026-05-19_

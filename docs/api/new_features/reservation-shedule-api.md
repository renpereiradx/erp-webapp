# Reserva y Horarios - Guia Unificada Frontend

## Descripcion General

Esta guia unifica la integracion frontend de:

- Gestion de reservas (`/reserve/*`)
- Consulta y generacion de horarios (`/schedules/*`)
- Configuracion de ventana de generacion por producto

Base URL (local): `http://localhost:8080`

## Autenticacion

- Requieren JWT: todo `/reserve/*`, y endpoints de generacion/configuracion write en `/schedules/*`.
- No requieren JWT: consultas de horarios (`GET /schedules/...`) y `GET /schedules/product/{productId}/config`.

Headers comunes:

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## Modelos Principales

### ManageReserveRequest

```json
{
  "action": "CREATE",
  "reserve_id": 0,
  "product_id": "CANCHA_01",
  "client_id": "CLIENT_01",
  "start_time": "2026-03-24T16:00:00Z",
  "duration": 2
}
```

- `action`: `CREATE | UPDATE | CONFIRM | CANCEL`
- `reserve_id`: requerido para `UPDATE`, `CONFIRM`, `CANCEL`
- `duration`: horas (entero positivo)

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

| Metodo | Endpoint                        | Descripcion                                                    |
| ------ | ------------------------------- | -------------------------------------------------------------- |
| `POST` | `/reserve/manage`               | Crear/actualizar/confirmar/cancelar reserva                    |
| `GET`  | `/reserve/available-schedules`  | Horarios disponibles para reservar por producto/fecha/duracion |
| `GET`  | `/reserve/report`               | Reporte de reservas por rango y filtros                        |
| `GET`  | `/reserve/consistency/check`    | Diagnostico de consistencia reserva/venta/horarios             |
| `GET`  | `/reserve/all`                  | Lista completa de reservas                                     |
| `GET`  | `/reserve/date-range`           | Reservas por rango de fechas                                   |
| `GET`  | `/reserve/client/name/{name}`   | Busqueda por nombre de cliente                                 |
| `GET`  | `/reserve/product/{product_id}` | Reservas por producto                                          |
| `GET`  | `/reserve/client/{client_id}`   | Reservas por cliente                                           |
| `GET`  | `/reserve/{id}`                 | Reserva por ID                                                 |

Ejemplo rapido:

```bash
curl -X POST "http://localhost:8080/reserve/manage" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"CREATE",
    "product_id":"CANCHA_01",
    "client_id":"CLIENT_01",
    "start_time":"2026-03-24T16:00:00Z",
    "duration":2
  }'
```

## Endpoints de Horarios (`/schedules`)

### Consulta (sin JWT)

| Metodo | Endpoint                                               | Descripcion                               |
| ------ | ------------------------------------------------------ | ----------------------------------------- |
| `GET`  | `/schedules/available`                                 | Disponibilidad global (filtros por query) |
| `GET`  | `/schedules/today`                                     | Horarios del dia actual                   |
| `GET`  | `/schedules/product/{productId}/date/{date}/available` | Horarios disponibles por producto/fecha   |
| `GET`  | `/schedules/product/{productId}/date/{date}/all`       | Todos los slots + estado de reserva       |
| `GET`  | `/schedules/product/{productId}/all`                   | Todos los horarios de producto            |
| `GET`  | `/schedules/product/{productId}`                       | Horarios de producto (paginado)           |
| `GET`  | `/schedules/{id}`                                      | Horario por ID                            |
| `GET`  | `/schedules/product/{productId}/config`                | Config activa de generacion por producto  |

### Generacion / configuracion (con JWT)

| Metodo | Endpoint                                | Descripcion                                     |
| ------ | --------------------------------------- | ----------------------------------------------- |
| `POST` | `/schedules/generate/daily`             | Generacion diaria                               |
| `POST` | `/schedules/generate/today`             | Generar para hoy                                |
| `POST` | `/schedules/generate/tomorrow`          | Generar para manana                             |
| `POST` | `/schedules/generate/date`              | Generar por fecha usando config por producto    |
| `POST` | `/schedules/generate/date/custom-range` | Generar por fecha con rango explicito           |
| `POST` | `/schedules/generate/next-days`         | Generar proximos N dias                         |
| `POST` | `/schedules/product/{productId}/config` | Crear/actualizar config de ventana por producto |

Ejemplo: generar por fecha con config por producto

```bash
curl -X POST "http://localhost:8080/schedules/generate/date" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_date":"2026-03-25",
    "product_ids":["CANCHA_01"]
  }'
```

Ejemplo: setear ventana por producto

```bash
curl -X POST "http://localhost:8080/schedules/product/CANCHA_01/config" \
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

- `200`: operacion exitosa
- `201`: recurso creado (ej. config de horario por producto)
- `400`: validacion de entrada
- `401`: token ausente/invalido
- `500`: error interno

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

### Importante: Detección de overlap para reservas multi-hora

Cuando un cliente reserva 2+ horas (ej: 15:00-17:00), el sistema detecta automáticamente todos los slots cubiertos:

- Reserva de 15:00 a 17:00 (2 horas) -> Los slots 15:00-16:00 y 16:00-17:00 aparecen como ocupados
- Ambos slots tendrán el mismo `reserve_id` y `reserved_by`
- El campo `is_available` será `false` para ambos slots

El frontend debe agrupar visualmente slots con el mismo `reserve_id` para mostrar la reserva completa.

## Notas de implementacion

- El estado de reserva debe guiar la UI (`RESERVED`, `CONFIRMED`, `CANCELLED`, `COMPLETED`).
- Para fecha en path/query usar `YYYY-MM-DD`.
- Para fecha/hora en payload usar ISO-8601.
- Mantener zona horaria de negocio en UI (`America/Asuncion`) para evitar desfasajes.
- **Reservas multi-hora**: Cuando muestres slots ocupados, agrupa por `reserve_id` para indicar visualmente que es la misma reserva.
- **Campo `reserved_by`**: Contiene "Nombre Apellido" del cliente que reservó. Úsalo para mostrar quién ocupa el slot.

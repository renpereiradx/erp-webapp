# 🗓️ API del Sistema de Reservas

**Versión:** 3.4
**Fecha:** 24 de Noviembre de 2025
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta documentación especifica la API del sistema de reservas. Proporciona información técnica precisa sobre endpoints, modelos de datos, códigos de respuesta y validaciones para facilitar una integración rápida y correcta por parte del equipo frontend.

### Características Principales

- ✅ Gestión completa de reservas (Crear, Actualizar, Confirmar, Cancelar).
- ✅ Búsqueda y filtrado de reservas por múltiples criterios.
- ✅ Consulta de horarios disponibles en tiempo real.
- ✅ Generación de reportes de reservas.
- ✅ Verificación de consistencia de datos.

---

## 📝 Historial de Cambios

### v3.4 - 24 de Noviembre de 2025
- 🔄 **Refactorización**: Documentación migrada al formato estándar para frontend.
- ✅ **Aclaración**: Mejoras en la descripción de parámetros y errores.

### v3.3.1 - 15 de Octubre de 2025
- ⚠️ **Fix**: Corregido el manejo de timestamps y timezones. `reserve_date` ahora es `timestamptz`.

### v3.3 - Octubre de 2025
- ✅ **Nuevos Endpoints**: Agregados `GET /reserve/all`, `GET /reserve/client/name/{name}`, y `GET /reserve/date-range`.
- ✅ **Integración**: Añadido el campo `reserve_date` a todas las respuestas de reservas.

---

## 🔧 Configuración General

### Base URL
```
http://localhost:5050
```

### Headers Requeridos
```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```
> **Nota:** Todos los endpoints de esta API requieren autenticación mediante un token JWT. Un token faltante o inválido resultará en un error `401 Unauthorized`.

---

## 📊 Estructuras de Datos

### ReserveRequest
Objeto utilizado para crear y modificar reservas.

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `action` | string | ✅ Sí | Acción a realizar: `CREATE` \| `UPDATE` \| `CONFIRM` \| `CANCEL`. |
| `reserve_id` | number | ⚠️ Condicional | Requerido para `UPDATE`, `CONFIRM`, y `CANCEL`. |
| `product_id` | string | ⚠️ Condicional | Requerido para `CREATE` y `UPDATE`. ID del servicio a reservar. |
| `client_id` | string | ⚠️ Condicional | Requerido para `CREATE` y `UPDATE`. ID del cliente. |
| `start_time` | string | ⚠️ Condicional | Requerido para `CREATE` y `UPDATE`. Formato ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`). |
| `duration` | number | ⚠️ Condicional | Requerido para `CREATE` y `UPDATE`. Duración en horas (entero ≥ 1). |

### ReserveRiched
Objeto enriquecido que representa una reserva con datos de relaciones (producto, cliente, usuario).

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | number | ID único de la reserva. |
| `product_id` | string | ID del producto reservado. |
| `product_name` | string | Nombre del producto. |
| `product_description` | string | Descripción del producto. |
| `client_id` | string | ID del cliente. |
| `client_name` | string | Nombre del cliente. |
| `start_time` | string (ISO 8601) | Timestamp de inicio de la reserva. |
| `end_time` | string (ISO 8601) | Timestamp de fin (calculado automáticamente). |
| `duration` | number | Duración en horas. |
| `total_amount` | number | Monto total de la reserva. |
| `status` | string | Estado: `RESERVED` \| `CONFIRMED` \| `CANCELLED` \| `COMPLETED`. |
| `user_id` | string | ID del usuario que creó la reserva. |
| `user_name` | string | Nombre del usuario. |
| `reserve_date` | string (ISO 8601) | Timestamp de creación del registro de la reserva. |

### AvailableSchedule
Representa un bloque de tiempo disponible para un servicio.

| Campo | Tipo | Descripción |
|---|---|---|
| `start_time` | string (ISO 8601) | Hora de inicio del bloque disponible. |
| `end_time` | string (ISO 8601) | Hora de fin del bloque disponible. |
| `available_consecutive_hours` | number | Número de horas consecutivas disponibles en ese bloque. |

---

## 🔗 Endpoints de la API

### 1. Gestionar Reserva
**Endpoint:** `POST /reserve/manage`

Endpoint único para crear, actualizar, confirmar o cancelar una reserva. La operación se determina por el campo `action`.

**Request Body (`CREATE`):**
```json
{
  "action": "CREATE",
  "product_id": "CANCHA-01",
  "client_id": "FjQ0Q2xHR",
  "start_time": "2025-09-15T15:00:00Z",
  "duration": 2
}
```

**Request Body (`CONFIRM` o `CANCEL`):**
```json
{
  "action": "CONFIRM",
  "reserve_id": 8
}
```

**Response (200 OK - para `CREATE`):**
```json
{
  "data": {
    "success": true,
    "action": "CREATE",
    "reserve_id": 8,
    "total_amount": 150000.00,
    "hourly_price": 75000.00,
    "message": "Reservation created successfully"
  }
}
```

**Response (200 OK - para `CONFIRM`):**
```json
{
  "data": {
    "success": true,
    "action": "CONFIRM",
    "reserve_id": 8,
    "message": "Reservation confirmed successfully"
  }
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Invalid request body` | 400 | El JSON enviado es inválido, faltan campos, o los tipos son incorrectos. |
| `Time slot not available` | 400 | El horario solicitado para la reserva ya no está disponible. |
| `Product not found` | 400 | El `product_id` no existe o no es de tipo "SERVICE". |
| `Unauthorized` | 401 | El token JWT es inválido, ha expirado o no fue proporcionado. |
| `Error managing reserve...` | 500 | Error interno del servidor al procesar la reserva en la base de datos. |

---

### 2. Obtener Reserva por ID
**Endpoint:** `GET /reserve/{id}`

Recupera la información completa y enriquecida de una reserva específica.

**Parámetros de Ruta:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `id` | number | ✅ Sí | El ID numérico de la reserva a obtener. |

**Response (200 OK):**
```json
{
  "id": 8,
  "product_id": "CANCHA-01",
  "product_name": "Cancha de Beach Tennis",
  "product_description": "",
  "client_id": "FjQ0Q2xHR",
  "client_name": "Horacio Cartel",
  "start_time": "2025-09-15T15:00:00Z",
  "end_time": "2025-09-15T17:00:00Z",
  "duration": 2,
  "total_amount": 150000,
  "status": "CANCELLED",
  "user_id": "Ohsf6kXNg",
  "user_name": " ",
  "reserve_date": "2025-09-13T15:43:21.528508Z"
}
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Invalid reserve ID` | 400 | El ID proporcionado no es un número válido. |
| `Unauthorized` | 401 | Token JWT inválido o no proporcionado. |
| `Error getting reserve...` | 500 | Error interno del servidor. La reserva puede no existir. |

---

### 3. Obtener Todas las Reservas
**Endpoint:** `GET /reserve/all`

Obtiene una lista completa de todas las reservas en el sistema, ordenadas por fecha de inicio descendente. Ideal para vistas de dashboard.

**Response (200 OK):**
```json
[
  {
    "id": 4,
    "product_id": "IigVyceNg",
    "product_name": "Cancha de Beach Tennis",
    "product_description": "",
    "client_id": "4hu5VK6Ng",
    "client_name": "Juan Pérez",
    "start_time": "2025-10-14T18:00:00Z",
    "end_time": "2025-10-14T19:00:00Z",
    "duration": 1,
    "total_amount": 60000,
    "status": "RESERVED",
    "user_id": "jJkV4F6HR",
    "user_name": "Admin User",
    "reserve_date": "2025-10-14T14:15:34.563257Z"
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Unauthorized` | 401 | Token JWT inválido o no proporcionado. |
| `Error getting all reserves...` | 500 | Error interno del servidor. |

---

### 4. Obtener Reservas por Rango de Fechas
**Endpoint:** `GET /reserve/date-range`

Obtiene las reservas cuyo `start_time` se encuentra dentro de un rango de fechas específico.

**Query Parameters:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `start_date` | string | ✅ Sí | Fecha de inicio del rango (`YYYY-MM-DD`). |
| `end_date` | string | ✅ Sí | Fecha de fin del rango (`YYYY-MM-DD`). |

**Ejemplo de Uso:**
`GET /reserve/date-range?start_date=2025-10-01&end_date=2025-10-31`

**Response (200 OK):** `ReserveRiched[]`
```json
[
  {
    "id": 2,
    "product_id": "IigVyceNg",
    "product_name": "Cancha de Beach Tennis",
    "client_id": "4hu5VK6Ng",
    "client_name": "Juan Pérez",
    "start_time": "2025-10-14T14:00:00Z",
    "end_time": "2025-10-14T15:00:00Z",
    "duration": 1,
    "total_amount": 60000,
    "status": "COMPLETED",
    "user_id": "jJkV4F6HR",
    "user_name": "Admin User",
    "reserve_date": "2025-10-13T21:26:01.208387Z"
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `start_date and end_date are required...` | 400 | Uno o ambos parámetros de fecha faltan. |
| `Invalid start_date format...` | 400 | La fecha de inicio no tiene el formato `YYYY-MM-DD`. |
| `Invalid end_date format...` | 400 | La fecha de fin no tiene el formato `YYYY-MM-DD`. |
| `Unauthorized` | 401 | Token JWT inválido o no proporcionado. |
| `Error getting reserves by date range...` | 500 | Error interno del servidor. |

---

### 5. Buscar Reservas por Nombre de Cliente
**Endpoint:** `GET /reserve/client/name/{name}`

Busca reservas haciendo una coincidencia parcial y case-insensitive con el nombre del cliente.

**Parámetros de Ruta:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `name` | string | ✅ Sí | Texto a buscar en el nombre del cliente. |

**Ejemplo de Uso:** `GET /reserve/client/name/juan%20perez`

**Response (200 OK):** `ReserveRiched[]` (Array de reservas que coinciden)

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `Client name is required` | 400 | El parámetro `name` en la ruta está vacío. |
| `Unauthorized` | 401 | Token JWT inválido o no proporcionado. |
| `Error getting reserves by client name...` | 500 | Error interno del servidor. |

---

### 6. Obtener Horarios Disponibles
**Endpoint:** `GET /reserve/available-schedules`

Calcula y devuelve los bloques de tiempo disponibles para un producto en una fecha específica, considerando la duración deseada.

**Query Parameters:**

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `product_id` | string | ✅ Sí | ID del servicio para el cual se consultan horarios. |
| `date` | string | ✅ Sí | Fecha de consulta en formato `YYYY-MM-DD`. |
| `duration_hours` | number | ❌ No | Duración deseada en horas. **Default: 1**. |

**Ejemplo de Uso:** `GET /reserve/available-schedules?product_id=CANCHA-01&date=2025-09-15&duration_hours=2`

**Response (200 OK):** `AvailableSchedule[]`
```json
[
  {
    "start_time": "2025-09-15T14:00:00Z",
    "end_time": "2025-09-15T16:00:00Z",
    "available_consecutive_hours": 2
  },
  {
    "start_time": "2025-09-15T17:00:00Z",
    "end_time": "2025-09-15T20:00:00Z",
    "available_consecutive_hours": 3
  }
]
```

**Errores Posibles:**

| Error | HTTP Status | Descripción |
|---|---|---|
| `product_id and date are required...` | 400 | Faltan parámetros obligatorios en la consulta. |
| `Unauthorized` | 401 | Token JWT inválido o no proporcionado. |
| `Error getting available schedules...` | 500 | Error interno del servidor. |

---

## 🔍 Validaciones y Reglas de Negocio

### Pre-Procesamiento (Validar en Frontend)
1. ✅ **Acciones:** El campo `action` debe ser `CREATE`, `UPDATE`, `CONFIRM` o `CANCEL`.
2. ✅ **IDs para Modificación:** `reserve_id` es obligatorio para acciones de modificación (`UPDATE`, `CONFIRM`, `CANCEL`).
3. ✅ **Campos para Creación:** `product_id`, `client_id`, `start_time`, y `duration` son obligatorios para `CREATE`.
4. ✅ **Duración:** `duration` debe ser un entero positivo (≥ 1).
5. ✅ **Formato de Fecha:** `start_time` debe ser un string en formato ISO 8601 válido.
6. ✅ **Rango de Fechas:** Para el endpoint de rango, `end_date` debe ser igual o posterior a `start_date`.

### Post-Procesamiento (Garantizado por Backend)
1. ✅ **Cálculos automáticos**: `end_time` y `total_amount` son calculados por el sistema.
2. ✅ **Auditoría**: `user_id` (del JWT) y `reserve_date` (`CURRENT_TIMESTAMP`) se registran automáticamente.
3. ✅ **Disponibilidad**: El backend vuelve a verificar la disponibilidad para evitar concurrencia.
4. ✅ **Existencia de Entidades**: Se valida que `product_id` y `client_id` existan.
5. ✅ **Precio**: Se valida que el servicio tenga un precio válido configurado.

### Reglas de Negocio Importantes
- **No se puede reservar en el pasado**: `start_time` debe ser una fecha/hora futura.
- **Estados de reserva**: El flujo de estados es `RESERVED` -> `CONFIRMED` -> `COMPLETED`. Una reserva puede ser `CANCELLED` desde `RESERVED` o `CONFIRMED`.
- **Atomicidad**: La creación de una reserva y la marcación del horario como ocupado son una transacción atómica.

---

## 🎯 Recomendaciones de Implementación

### 1. Flujo para Crear una Reserva
**Antes de llamar al `POST /reserve/manage`:**
1.  Llamar a `GET /reserve/available-schedules` para la fecha y producto deseados.
2.  Permitir al usuario seleccionar un `start_time` de los resultados.
3.  Construir el objeto `ReserveRequest` con `action: "CREATE"`.
4.  Realizar las validaciones de frontend descritas en la sección anterior.

### 2. Validaciones en UI
- **Debounce:** Al usar `GET /reserve/client/name/{name}`, aplicar un debounce de ~300ms en el campo de búsqueda para no sobrecargar la API.
- **Date Pickers:** Utilizar componentes de calendario para `start_date` y los filtros de rango para asegurar el formato `YYYY-MM-DD`.
- **Validación en Tiempo Real:** Validar `duration` para que sea numérico y positivo mientras el usuario escribe.

### 3. Sincronización de Estado
**Después de una operación exitosa en `POST /reserve/manage`:**
- Invalidar y refrescar las queries de listas de reservas (`/reserve/all`, `/reserve/date-range`, etc.).
- Limpiar el formulario de creación/edición.
- Mostrar una notificación al usuario con el mensaje de éxito de la respuesta.

---

## 🚫 Errores Comunes y Soluciones

| Error | HTTP Status | Causa Común | Solución |
|---|---|---|---|
| `Unauthorized` | 401 | Token JWT faltante, expirado o malformado en el header `Authorization`. | Asegurarse de enviar `Authorization: Bearer <token>` y de que el token sea válido. |
| `Invalid request body` | 400 | JSON malformado, campo `action` incorrecto (e.g., minúsculas), o `reserve_id` faltante para `CONFIRM`/`CANCEL`. | Validar el objeto `ReserveRequest` en el frontend antes de enviarlo. Usar valores exactos en mayúsculas para `action`. |
| `cannot insert a non-DEFAULT value into column 'end_time' or 'reserve_date'` | 500 | Se está enviando `end_time` o `reserve_date` en el request body. | **NO ENVIAR** estos campos. Son generados automáticamente por el backend. |
| `Time slot not available` | 400 | El horario seleccionado fue ocupado por otro usuario entre la consulta de disponibilidad y el intento de creación. | Informar al usuario que el horario ya no está disponible y sugerirle que elija otro. |
| `Product not found` | 400 | El `product_id` enviado no existe o no corresponde a un producto de tipo "SERVICE". | Asegurarse de que solo se puedan seleccionar productos válidos en la UI. |
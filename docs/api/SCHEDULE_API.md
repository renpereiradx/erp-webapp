# API de Horarios (Schedules) - Especificación Técnica

## 📋 Índice
- [Visión General](#visión-general)
- [Modelos de Datos](#modelos-de-datos)
- [Endpoints](#endpoints)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Validaciones](#validaciones)

---

## 🎯 Visión General

Sistema de gestión de horarios para productos reservables implementado en el sistema de business management. Permite consultar disponibilidad, generar horarios automáticamente y gestionar su estado basado en la implementación actual del código.

### Autenticación
- **Endpoints de consulta**: No requieren autenticación
- **Endpoints de modificación/generación**: Requieren JWT Bearer token

---

## 📊 Modelos de Datos

### Schedule
```typescript
interface Schedule {
  id: number;              // ID numérico del horario (int64 en DB)
  product_id: string;      // ID del producto reservable
  start_time: string;      // Hora inicio (ISO 8601: "2024-01-15T14:00:00Z")
  end_time: string;        // Hora fin (ISO 8601: "2024-01-15T15:00:00Z")
  is_available: boolean;   // Disponibilidad para reserva
}
```

### ScheduleRiched
```typescript
interface ScheduleRiched {
  id: number;              // ID numérico (int64)
  product_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  product_name: string;    // Nombre del producto (JOIN con products)
}
```

### AvailableSchedulesResponse
```typescript
interface AvailableSchedulesResponse {
  schedules: ScheduleRiched[];  // Lista de horarios disponibles
  count: number;                // Cantidad de horarios encontrados
  message: string;              // Mensaje informativo
}
```

### Request Bodies

#### UpdateScheduleAvailabilityRequest
```typescript
interface UpdateScheduleAvailabilityRequest {
  is_available: boolean;         // Nueva disponibilidad
}
```

#### GenerateScheduleForDateRequest
```typescript
interface GenerateScheduleForDateRequest {
  target_date: string;           // Fecha en formato "YYYY-MM-DD"
}
```

#### GenerateSchedulesForNextNDaysRequest
```typescript
interface GenerateSchedulesForNextNDaysRequest {
  days: number;                  // Número de días (1-365)
}
```

---

## 🚀 Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/schedules/{id}` | No | Obtener horario por ID |
| `GET` | `/schedules/available` | No | **NUEVO** - Horarios disponibles (todos los servicios) |
| `GET` | `/schedules/today` | No | **NUEVO** - Horarios de servicios para HOY |
| `GET` | `/schedules/product/{productId}/date/{date}/available` | No | Horarios disponibles para producto/fecha |
| `GET` | `/schedules/product/{productId}/all` | No | **NUEVO** - Todos los horarios de un producto |
| `GET` | `/schedules/product/{productId}` | No | **NUEVO** - Horarios de un producto (paginado) |
| `PUT` | `/schedules/{id}/availability` | Sí | Actualizar disponibilidad ⚠️ |
| `POST` | `/schedules/generate/daily` | Sí | Generar horarios diarios |
| `POST` | `/schedules/generate/date` | Sí | Generar para fecha específica |
| `POST` | `/schedules/generate/next-days` | Sí | Generar para próximos N días |

⚠️ **Nota**: El endpoint de actualización de disponibilidad está implementado pero no está actualmente incluido en las rutas.

### 1. Obtener Horario por ID
```http
GET /schedules/{id}
```

**Parámetros:**
- `id` (path): ID del horario (string en URL, se convierte internamente)

**Response:** `Schedule`
```json
{
  "id": 12345,
  "product_id": "BT_Cancha_1_xyz123abc",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T15:00:00Z",
  "is_available": true
}
```

**Errores:**
- `404`: "Schedule not found" - Horario no existe
- `500`: Error interno del servidor

### 2. 🆕 Obtener Horarios Disponibles (Todos los Servicios)
```http
GET /schedules/available?date=YYYY-MM-DD&limit=50
```

**Query Parameters:**
- `date` (optional): Fecha específica en formato "YYYY-MM-DD". Si se omite, busca desde ahora en adelante
- `limit` (optional): Máximo número de resultados (default: 50)

**Response:** `AvailableSchedulesResponse`
```json
{
  "schedules": [
    {
      "id": 12345,
      "product_id": "BT_Cancha_1_xyz123abc",
      "start_time": "2024-01-15T14:00:00Z",
      "end_time": "2024-01-15T15:00:00Z",
      "is_available": true,
      "product_name": "Cancha de Tenis 1"
    },
    {
      "id": 12346,
      "product_id": "BT_Cancha_2_def456ghi",
      "start_time": "2024-01-15T14:00:00Z",
      "end_time": "2024-01-15T15:00:00Z",
      "is_available": true,
      "product_name": "Cancha de Tenis 2"
    }
  ],
  "count": 2,
  "message": "Horarios disponibles para 2024-01-15"
}
```

**Sin horarios disponibles:**
```json
{
  "schedules": [],
  "count": 0,
  "message": "No hay horarios disponibles para la fecha 2024-01-15"
}
```

**Errores:**
- `400`: "Invalid date format. Use YYYY-MM-DD" - Formato de fecha inválido
- `500`: Error interno del servidor

### 3. 🆕 Obtener Horarios de Servicios para HOY
```http
GET /schedules/today
```

**Descripción:** Obtiene todos los horarios programados para la fecha actual (HOY). No requiere parámetros y devuelve información enriquecida con nombres de productos.

**Response:** `AvailableSchedulesResponse`
```json
{
  "schedules": [
    {
      "id": 12345,
      "product_id": "BT_Cancha_1_xyz123abc",
      "start_time": "2025-09-05T14:00:00Z",
      "end_time": "2025-09-05T15:00:00Z",
      "is_available": true,
      "product_name": "Cancha de Tenis 1"
    },
    {
      "id": 12346,
      "product_id": "BT_Cancha_2_def456ghi",
      "start_time": "2025-09-05T15:00:00Z",
      "end_time": "2025-09-05T16:00:00Z",
      "is_available": false,
      "product_name": "Cancha de Tenis 2"
    }
  ],
  "count": 2,
  "message": "Horarios de servicios para hoy"
}
```

**Sin horarios programados:**
```json
{
  "schedules": [],
  "count": 0,
  "message": "No hay horarios programados para hoy"
}
```

**Errores:**
- `500`: Error interno del servidor

### 4. Obtener Horarios Disponibles por Producto
```http
GET /schedules/product/{productId}/date/{date}/available
```

**Parámetros:**
- `productId` (path): ID del producto
- `date` (path): Fecha en formato "YYYY-MM-DD"

**Response:** `Schedule[]`
```json
[
  {
    "id": 12345,
    "product_id": "BT_Cancha_1_xyz123abc",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "is_available": true
  }
]
```

**Errores:**
- `500`: Error interno del servidor

### 5. 🆕 Obtener Todos los Horarios de un Producto
```http
GET /schedules/product/{productId}/all
```

**Parámetros:**
- `productId` (path): ID del producto

**Response:** `Schedule[]`
```json
[
  {
    "id": 12345,
    "product_id": "BT_Cancha_1_xyz123abc",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "is_available": true
  }
]
```

**Sin horarios:** Retorna array vacío `[]`

**Errores:**
- `500`: Error interno del servidor

### 6. 🆕 Obtener Horarios de un Producto (Paginado)
```http
GET /schedules/product/{productId}?page=1&pageSize=50
```

**Parámetros:**
- `productId` (path): ID del producto

**Query Parameters:**
- `page` (optional): Número de página (default: 1)
- `pageSize` (optional): Elementos por página (default: 50)

**Response:** `Schedule[]`
```json
[
  {
    "id": 12345,
    "product_id": "BT_Cancha_1_xyz123abc",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "is_available": true
  }
]
```

**Errores:**
- `500`: Error interno del servidor

### 7. Actualizar Disponibilidad 🔒 ⚠️
```http
PUT /schedules/{id}/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

⚠️ **Nota**: Este endpoint está implementado en el handler pero no está incluido en las rutas actuales.

**Parámetros:**
- `id` (path): ID del horario

**Body:** `UpdateScheduleAvailabilityRequest`
```json
{
  "is_available": false
}
```

**Response:**
```json
{
  "message": "Schedule availability updated successfully"
}
```

**Errores:**
- `400`: Body JSON inválido
- `401`: "Invalid token" - Token inválido o faltante
- `500`: Error interno del servidor

### 8. Generar Horarios Diarios 🔒
```http
POST /schedules/generate/daily
Authorization: Bearer <jwt_token>
```

**Body:** Sin body requerido

**Response:**
```json
{
  "message": "Daily schedules generated successfully"
}
```

**Errores:**
- `401`: "Invalid token" - Token inválido o faltante
- `500`: Error interno del servidor

### 9. Generar Horarios para Fecha Específica 🔒
```http
POST /schedules/generate/date
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:** `GenerateScheduleForDateRequest`
```json
{
  "target_date": "2024-01-20"
}
```

**Response:**
```json
{
  "message": "Schedules generated successfully for 2024-01-20"
}
```

**Errores:**
- `400`: "Invalid date format. Use YYYY-MM-DD" - Formato de fecha inválido
- `401`: "Invalid token" - Token inválido o faltante
- `500`: Error interno del servidor

### 10. Generar Horarios para Próximos N Días 🔒
```http
POST /schedules/generate/next-days
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:** `GenerateSchedulesForNextNDaysRequest`
```json
{
  "days": 7
}
```

**Response:**
```json
{
  "message": "Schedules generated successfully for next 7 days",
  "days": 7
}
```

**Errores:**
- `400`: "Days must be between 1 and 365" - Valor de days inválido
- `401`: "Invalid token" - Token inválido o faltante
- `500`: Error interno del servidor

---

## 📋 Códigos de Respuesta

| Código | Descripción | Cuándo se produce |
|--------|-------------|-------------------|
| `200` | OK | Operación exitosa |
| `400` | Bad Request | Parámetros inválidos, JSON malformado o validación fallida |
| `401` | Unauthorized | Token JWT inválido o faltante |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error interno del servidor |

## ✅ Validaciones y Restricciones

### Autenticación por Endpoint
- **GET endpoints**: No requieren autenticación
- **PUT/POST endpoints**: Requieren JWT válido con `*models.TokenClaims`

### Validaciones de Parámetros

**Path Parameters:**
- `id` (schedule): String en URL, se convierte internamente
- `productId`: String, se pasa directamente al repositorio
- `date`: String en formato "YYYY-MM-DD"

**Query Parameters:**
- `date`: String formato "YYYY-MM-DD" opcional para `/schedules/available`
- `limit`: Number (default: 50) para `/schedules/available`
- `page`: Number (default: 1) para endpoints paginados
- `pageSize`: Number (default: 50) para endpoints paginados

**Request Bodies:**
- `is_available`: boolean (UpdateScheduleAvailabilityRequest)
- `target_date`: string formato "YYYY-MM-DD" (GenerateScheduleForDateRequest)
- `days`: number entre 1 y 365 (GenerateSchedulesForNextNDaysRequest)

### Validación de Fechas
- **target_date**: Se valida con `time.Parse("2006-01-02", req.TargetDate)`
- **date query param**: Se valida con `time.Parse("2006-01-02", date)`
- **Formato requerido**: "YYYY-MM-DD" (ISO date format)
- **Error si inválido**: "Invalid date format. Use YYYY-MM-DD"

### Restricciones de Días
- **Mínimo**: 1 día
- **Máximo**: 365 días
- **Error si inválido**: "Days must be between 1 and 365"

### Lógica de Consulta de Horarios
- **Con fecha específica**: Filtra por `DATE(start_time) = fecha`
- **Sin fecha**: Filtra por `start_time >= NOW()` (solo horarios futuros)
- **Disponibilidad**: Filtra por `is_available = true`
- **Ordenamiento**: Por `start_time` y `product_name`

---

## 🎯 Casos de Uso Principales

### Frontend de Reservas
```javascript
// Buscar horarios de HOY
const todayResponse = await fetch('/schedules/today');
const { schedules: todaySchedules, count, message } = await todayResponse.json();

if (count > 0) {
  console.log('Horarios de hoy:');
  todaySchedules.forEach(schedule => {
    console.log(`${schedule.product_name}: ${schedule.start_time} - ${schedule.end_time} (${schedule.is_available ? 'Disponible' : 'No disponible'})`);
  });
} else {
  console.log(message); // "No hay horarios programados para hoy"
}

// Buscar horarios disponibles para fecha específica
const response = await fetch('/schedules/available?date=2024-01-15&limit=20');
const { schedules, count: availableCount, message: availableMessage } = await response.json();

if (availableCount > 0) {
  // Mostrar horarios disponibles con nombre del servicio
  schedules.forEach(schedule => {
    console.log(`${schedule.product_name}: ${schedule.start_time} - ${schedule.end_time}`);
  });
} else {
  // Mostrar mensaje informativo
  console.log(availableMessage); // "No hay horarios disponibles para la fecha 2024-01-15"
}
```

### Administración de Horarios
```javascript
// Obtener todos los horarios de un producto específico
const schedules = await fetch('/schedules/product/BT_Cancha_1_xyz123abc/all');

// Obtener horarios paginados para administración
const paginatedSchedules = await fetch('/schedules/product/BT_Cancha_1_xyz123abc?page=1&pageSize=25');
```

### Generación de Horarios
```javascript
// Generar horarios para mañana
await fetch('/schedules/generate/date', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ target_date: '2024-01-16' })
});
```

---

## 📝 Notas Técnicas

1. **Nuevos Endpoints**: Se agregaron 4 endpoints principales para consulta de horarios sin autenticación
2. **Respuestas Enriquecidas**: Los endpoints `/schedules/available` y `/schedules/today` incluyen nombre del producto y mensajes informativos
3. **Sin Arrays Vacíos como Errores**: Los endpoints retornan arrays vacíos `[]` en lugar de errores 404
4. **Servicios**: Los endpoints de generación usan `services.NewScheduleService(repository.GetRepository())`
5. **Repositorio**: Los endpoints de consulta llaman directamente a `repository.*`
6. **Content-Type**: Siempre se establece como `application/json` en responses
7. **Errores**: Se retornan con `http.Error()` y detalles específicos
8. **IDs**: Se procesan como strings desde la URL y se convierten según sea necesario
9. **Paginación**: Valores por defecto optimizados para horarios (50 en lugar de 20)
10. **⚠️ Orden de Rutas**: Las rutas específicas (`/available`, `/today`) se declaran antes que las genéricas (`/{id}`) para evitar conflictos de routing

---

**Última actualización**: 5 de Septiembre de 2025  
**Versión**: 2.1  
**Basado en**: handlers/schedule.go, routes/routes.go, database/postgres/schedule.go, database/postgres/schedule_today.go

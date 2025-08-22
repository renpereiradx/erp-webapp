# API de Horarios (Schedules) - Especificación Técnica

## 📋 Índice
- [Visión General](#visión-general)
- [Modelos de Datos](#modelos-de-datos)
- [Endpoints](#endpoints)
- [Códigos de Respuesta](#códigos-de-respuesta)
- [Validaciones](#validaciones)

---

## 🎯 Visión General

Sistema de gestión de horarios para productos reservables. Permite consultar disponibilidad, generar horarios automáticamente y gestionar su estado.

### Base URL
```
http://localhost:5050/api
```

### Autenticación
- Endpoints de consulta: **No requieren autenticación**
- Endpoints de modificación: **Requieren JWT Bearer token**

---

## 📊 Modelos de Datos

### Schedule
```typescript
interface Schedule {
  id: number;              // ID numérico del horario (integer en DB)
  product_id: string;      // ID del producto reservable
  start_time: string;      // Hora inicio (ISO 8601: "2024-01-15T14:00:00Z")
  end_time: string;        // Hora fin (ISO 8601: "2024-01-15T15:00:00Z")
  is_available: boolean;   // Disponibilidad para reserva
}
```

### ScheduleRiched
```typescript
interface ScheduleRiched {
  id: number;
  product_id: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  product_name: string;    // Nombre del producto (JOIN con products)
}
```

### Request Bodies
```typescript
interface UpdateScheduleAvailabilityRequest {
  is_available: boolean;         // Nueva disponibilidad
}

interface GenerateScheduleForDateRequest {
  target_date: string;           // Fecha en formato "YYYY-MM-DD"
}

interface GenerateSchedulesForNextNDaysRequest {
  days: number;                  // Número de días (1-365)
}
```

### Request Bodies

#### GenerateScheduleForDateRequest
```typescript
interface GenerateScheduleForDateRequest {
  target_date: string;     // Formato: "YYYY-MM-DD"
}
```

#### GenerateSchedulesForNextNDaysRequest
```typescript
interface GenerateSchedulesForNextNDaysRequest {
  days: number;           // Entre 1 y 365
}
```

#### UpdateScheduleAvailabilityRequest
```typescript
interface UpdateScheduleAvailabilityRequest {
  is_available: boolean;
}
```

---

## 🚀 Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/schedules/{id}` | No | Obtener horario por ID |
| `GET` | `/schedules/product/{productId}/date/{date}/available` | No | Horarios disponibles para producto/fecha |
| `GET` | `/schedules/date-range` | No | Horarios por rango de fechas (paginado) |
| `GET` | `/schedules/product/{productId}` | No | Horarios por producto (paginado) |
| `PUT` | `/schedules/{id}/availability` | Sí | Actualizar disponibilidad |
| `POST` | `/schedules/generate/daily` | Sí | Generar horarios diarios |
| `POST` | `/schedules/generate/date` | Sí | Generar para fecha específica |
| `POST` | `/schedules/generate/next-days` | Sí | Generar para próximos N días |

### 1. Obtener Horario por ID
```http
GET /schedules/{id}
```

**Parámetros:**
- `id` (path): ID numérico del horario (puede enviarse como string en URL)

**Body:** `N/A`

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

**Status Codes:**
- `200`: Horario encontrado
- `404`: Horario no encontrado
- `500`: Error interno

### 2. Obtener Horarios Disponibles
```http
GET /schedules/product/{productId}/date/{date}/available
```

**Parámetros:**
- `productId` (path): ID del producto
- `date` (path): Fecha en formato "YYYY-MM-DD"

**Body:** `N/A`

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

**Status Codes:**
- `200`: Horarios encontrados
- `404`: No hay horarios disponibles
- `400`: Parámetros inválidos
- `500`: Error interno

### 3. Obtener Horarios por Rango de Fechas
```http
GET /schedules/date-range?startDate={start}&endDate={end}&page={page}&pageSize={size}
```

**Query Parameters:**
- `startDate` (requerido): Fecha inicio "YYYY-MM-DD"
- `endDate` (requerido): Fecha fin "YYYY-MM-DD"
- `page` (opcional): Número de página (default: 1)
- `pageSize` (opcional): Elementos por página (default: 20)

**Body:** `N/A`

**Response:** `ScheduleRiched[]`
```json
[
  {
    "id": 12345,
    "product_id": "BT_Cancha_1_xyz123abc",
    "product_name": "Cancha de Tenis 1",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T15:00:00Z",
    "is_available": true
  }
]
```

**Status Codes:**
- `200`: Horarios encontrados
- `400`: Parámetros de fecha inválidos
- `500`: Error interno

### 4. Obtener Horarios por Producto
```http
GET /schedules/product/{productId}?page={page}&pageSize={size}
```

**Parámetros:**
- `productId` (path): ID del producto
- `page` (query, opcional): Número de página (default: 1)
- `pageSize` (query, opcional): Elementos por página (default: 20)

**Body:** `N/A`

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

**Status Codes:**
- `200`: Horarios encontrados
- `404`: No se encontraron horarios para este producto
- `500`: Error interno

### 5. Actualizar Disponibilidad 🔒
```http
PUT /schedules/{id}/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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

**Status Codes:**
- `200`: Actualización exitosa
- `400`: Body inválido
- `401`: Token inválido o faltante
- `404`: Horario no encontrado
- `500`: Error interno

### 6. Generar Horarios Diarios 🔒
```http
POST /schedules/generate/daily
Authorization: Bearer <jwt_token>
```

**Body:** `N/A`

**Response:**
```json
{
  "message": "Daily schedules generated successfully"
}
```

**Status Codes:**
- `200`: Generación exitosa
- `401`: Token inválido o faltante
- `500`: Error interno

### 7. Generar Horarios para Fecha Específica 🔒
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

**Status Codes:**
- `200`: Generación exitosa
- `400`: Formato de fecha inválido
- `401`: Token inválido o faltante
- `500`: Error interno

### 8. Generar Horarios para Próximos N Días 🔒
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

**Status Codes:**
- `200`: Generación exitosa
- `400`: Valor de days inválido (debe ser entre 1 y 365)
- `401`: Token inválido o faltante
- `500`: Error interno

---

## � Códigos de Respuesta

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado exitosamente |
| `400` | Parámetros de solicitud inválidos |
| `401` | Token de autorización requerido o inválido |
| `404` | Recurso no encontrado |
| `500` | Error interno del servidor |

## ✅ Validaciones

### Parámetros de Fecha
- **Formato**: `YYYY-MM-DD` (ISO 8601)
- **Ejemplo válido**: `2024-01-15`

### Parámetros Numéricos
- **days**: Entre 1 y 365
- **page**: Mayor a 0 (default: 1)
- **pageSize**: Entre 1 y 100 (default: 20)

### Parámetros de ID
- **schedule_id**: Integer/número convertido automáticamente desde string en URL
- **product_id**: String alfanumérico

### Headers Requeridos (Endpoints Autenticados)
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

**🔧 Última actualización:** Agosto 2025  
**👥 Mantenido por:** Equipo Backend  
**📧 Contacto:** desarrollo@businessmanagement.com

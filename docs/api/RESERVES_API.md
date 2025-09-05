# 📋 Guía de Integración API - Sistema de Reservas

## 🎯 Descripción General

Esta documentación especifica la API del sistema de reservas implementada en el sistema de business management. Proporciona información técnica precisa sobre endpoints, modelos de datos, códigos de respuesta y validaciones basada en la implementación actual del código.

---

## 📊 Modelos de Datos

### Reserve
```typescript
interface Reserve {
  id: number;              // ID numérico de la reserva (int64 en DB)
  product_id: string;      // ID del producto reservado
  client_id: string;       // ID del cliente que reserva
  start_time: string;      // Hora inicio (ISO 8601: "2024-01-15T14:00:00Z")
  end_time: string;        // Hora fin (ISO 8601: "2024-01-15T15:00:00Z")
  duration: number;        // Duración en horas (int)
  total_amount: number;    // Monto total de la reserva (float32)
  status: string;          // Estado: "RESERVED", "confirmed", "cancelled"
  user_id: string;         // ID del usuario que creó la reserva
}
```

### ReserveRiched
```typescript
interface ReserveRiched {
  id: number;                    // ID numérico (int64)
  product_id: string;
  product_name: string;          // Nombre del producto (JOIN con products)
  product_description: string;   // Descripción del producto
  client_id: string;
  client_name: string;           // Nombre del cliente (JOIN con clients)
  start_time: string;
  end_time: string;
  duration: number;              // Duración en horas (int)
  total_amount: number;          // Monto total (float32)
  status: string;
  user_id: string;
  user_name: string;             // Nombre del usuario (JOIN con users)
}
```

### ReservationReport
```typescript
interface ReservationReport {
  reserve_id: number;            // ID de la reserva (int)
  product_name: string;          // Nombre del producto
  client_name: string;           // Nombre del cliente
  start_time: string;            // Hora inicio
  end_time: string;              // Hora fin
  duration_hours: number;        // Duración en horas (int)
  total_amount: number;          // Monto total (float64)
  status: string;                // Estado de la reserva
  created_by: string;            // Usuario que creó la reserva
  days_until_reservation: number; // Días hasta la reserva (int)
}
```

### AvailableSchedule
```typescript
interface AvailableSchedule {
  start_time: string;                    // Hora inicio disponible
  end_time: string;                      // Hora fin disponible
  available_consecutive_hours: number;   // Horas consecutivas disponibles (int)
}
```

### ConsistencyIssue
```typescript
interface ConsistencyIssue {
  issue_type: string;       // Tipo de problema de consistencia
  reserve_id?: number;      // ID de reserva afectada (opcional, puede ser null)
  sales_count: number;      // Número de ventas relacionadas (int64)
  details: string;          // Descripción del problema
}
```

### Request Bodies
```typescript
interface ReserveRequest {
  action: string;           // Acción: "create", "update", "cancel"
  reserve_id?: number;      // ID de reserva (int64, para update/cancel)
  product_id: string;       // ID del producto
  client_id: string;        // ID del cliente
  start_time: string;       // Hora inicio ISO 8601
  duration: number;         // Duración en horas (int)
}
```

---

## 🔗 Endpoints de la API

**Todos los endpoints requieren autenticación JWT** 🔒

### 1. Gestionar Reserva 🔒
```http
POST /reserve/manage
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Descripción:** Endpoint único para crear, actualizar o cancelar reservas basado en el campo `action`.

**Body:** `ReserveRequest`
```json
{
  "action": "create",
  "product_id": "BT_Cancha_1_xyz123abc",
  "client_id": "CLI_12345",
  "start_time": "2024-01-15T14:00:00Z",
  "duration": 2
}
```

**Response:** `Reserve` (objeto reserva procesado)
```json
{
  "id": 12345,
  "product_id": "BT_Cancha_1_xyz123abc",
  "client_id": "CLI_12345",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T16:00:00Z",
  "duration": 2,
  "total_amount": 150.00,
  "status": "RESERVED",
  "user_id": "USR_789"
}
```

**Errores:**
- `400`: "Invalid request body" - JSON malformado
- `401`: "Unauthorized" - Token inválido
- `500`: "Error managing reserve: {details}" - Error interno

### 2. Obtener Reserva por ID 🔒
```http
GET /reserve/{id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `id` (path): ID numérico de la reserva (int64)

**Response:** `Reserve`
```json
{
  "id": 12345,
  "product_id": "BT_Cancha_1_xyz123abc",
  "client_id": "CLI_12345",
  "start_time": "2024-01-15T14:00:00Z",
  "end_time": "2024-01-15T16:00:00Z",
  "duration": 2,
  "total_amount": 150.00,
  "status": "RESERVED",
  "user_id": "USR_789"
}
```

**Errores:**
- `400`: "Invalid reserve ID" - ID no es un número válido
- `401`: "Unauthorized" - Token inválido
- `500`: "Error getting reserve: {details}" - Error interno

### 3. Obtener Reservas por Producto 🔒
```http
GET /reserve/product/{product_id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `product_id` (path): ID del producto

**Response:** `ReserveRiched[]` (array con información enriquecida)
```json
[
  {
    "id": 12345,
    "product_id": "BT_Cancha_1_xyz123abc",
    "product_name": "Cancha de Tenis 1",
    "product_description": "Cancha de tenis profesional",
    "client_id": "CLI_12345",
    "client_name": "Juan Pérez",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T16:00:00Z",
    "duration": 2,
    "total_amount": 150.00,
    "status": "RESERVED",
    "user_id": "USR_789",
    "user_name": "Admin User"
  }
]
```

**Errores:**
- `400`: "Product ID is required" - product_id vacío
- `401`: "Unauthorized" - Token inválido
- `500`: "Error getting reserves: {details}" - Error interno

### 4. Obtener Reservas por Cliente 🔒
```http
GET /reserve/client/{client_id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `client_id` (path): ID del cliente

**Response:** `ReserveRiched[]` (igual formato que endpoint de producto)

**Errores:**
- `400`: "Client ID is required" - client_id vacío
- `401`: "Unauthorized" - Token inválido
- `500`: "Error getting reserves: {details}" - Error interno

### 5. Obtener Reporte de Reservas 🔒
```http
GET /reserve/report?start_date={start}&end_date={end}&product_id={product}&client_id={client}&status={status}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `start_date` (opcional): Fecha inicio "YYYY-MM-DD" (default: hoy)
- `end_date` (opcional): Fecha fin "YYYY-MM-DD" (default: +30 días)
- `product_id` (opcional): Filtrar por producto
- `client_id` (opcional): Filtrar por cliente
- `status` (opcional): Filtrar por estado

**Response:** `ReservationReport[]`
```json
[
  {
    "reserve_id": 12345,
    "product_name": "Cancha de Tenis 1",
    "client_name": "Juan Pérez",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T16:00:00Z",
    "duration_hours": 2,
    "total_amount": 150.00,
    "status": "RESERVED",
    "created_by": "Admin User",
    "days_until_reservation": 5
  }
]
```

**Errores:**
- `401`: "Unauthorized" - Token inválido
- `500`: "Error getting reservations report: {details}" - Error interno

### 6. Verificar Consistencia de Reservas 🔒
```http
GET /reserve/consistency/check
Authorization: Bearer <jwt_token>
```

**Descripción:** Verifica la consistencia entre reservas y ventas asociadas.

**Response:** `ConsistencyIssue[]`
```json
[
  {
    "issue_type": "MISSING_SALE",
    "reserve_id": 12345,
    "sales_count": 0,
    "details": "Reserva sin venta asociada"
  }
]
```

**Errores:**
- `401`: "Unauthorized" - Token inválido
- `500`: "Error checking reservation consistency: {details}" - Error interno

### 7. Obtener Horarios Disponibles para Reserva 🔒
```http
GET /reserve/available-schedules?product_id={product}&date={date}&duration_hours={duration}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `product_id` (requerido): ID del producto
- `date` (requerido): Fecha en formato "YYYY-MM-DD"
- `duration_hours` (opcional): Duración deseada en horas (default: 1)

**Response:** `AvailableSchedule[]`
```json
[
  {
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T16:00:00Z",
    "available_consecutive_hours": 2
  }
]
```

**Errores:**
- `400`: "product_id and date are required parameters"
- `401`: "Unauthorized" - Token inválido
- `500`: "Error getting available schedules: {details}" - Error interno

---

## 📋 Códigos de Respuesta

| Código | Descripción | Cuándo se produce |
|--------|-------------|-------------------|
| `200` | OK | Operación exitosa |
| `400` | Bad Request | Parámetros inválidos, JSON malformado o validación fallida |
| `401` | Unauthorized | Token JWT inválido o faltante |
| `500` | Internal Server Error | Error del servidor o servicios internos |

**Nota:** No se implementa código `404` en los handlers actuales.

---

## ⚡ Validaciones y Restricciones

### Campos Obligatorios en ReserveRequest

**POST /reserve/manage:**
- `action`: string (valores: "create", "update", "cancel")
- `product_id`: string (no vacío)
- `client_id`: string (no vacío)
- `start_time`: string (formato ISO 8601)
- `duration`: number (entero positivo)
- `reserve_id`: number (requerido para "update" y "cancel")

### Validaciones de Parámetros

**Path Parameters:**
- `id` (reserva): Debe ser convertible a int64
- `product_id`: String no vacío
- `client_id`: String no vacío

**Query Parameters:**
- `product_id`: Requerido, no vacío (available-schedules)
- `date`: Requerido, formato "YYYY-MM-DD" (available-schedules)
- `duration_hours`: Opcional, entero positivo, default = 1
- Fechas de reporte: Formato "YYYY-MM-DD", defaults automáticos

### Comportamiento por Defecto

- **start_date**: Si no se proporciona = fecha actual
- **end_date**: Si no se proporciona = fecha actual + 30 días
- **duration_hours**: Si no se proporciona = 1 hora

### Tipos de Datos

- **IDs de reserva**: int64
- **Duración**: int (horas)
- **total_amount**: float32 en Reserve, float64 en ReservationReport
- **Fechas**: string en formato ISO 8601
- **Estados**: string ("RESERVED", "confirmed", "cancelled")

---

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT** mediante header:
```
Authorization: Bearer <jwt_token>
```

- El token debe contener claims válidos (`*models.TokenClaims`)
- El `user_id` del token se asigna automáticamente a las reservas
- Token inválido o faltante retorna `401 Unauthorized`

---

## 📝 Notas Técnicas

1. **user_id**: Se extrae automáticamente del JWT, no se envía en el body
2. **end_time**: Se calcula automáticamente basado en start_time + duration
3. **Servicios**: Usan `services.NewReserveService(repository.GetRepository())`
4. **Errores**: Incluyen detalles técnicos del error interno
5. **Content-Type**: Siempre `application/json` en responses

---

**Última actualización**: 3 de Septiembre de 2025  
**Versión**: 1.0  
**Basado en**: handlers/reserve.go:17-308, models/reserve.go:8-190

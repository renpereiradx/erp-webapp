# 📋 Guía de Integración API - Sistema de Reservas

## 🎯 Descripción General

Esta documentación especifica la API del sistema de reservas, proporcionando información técnica sobre endpoints, modelos de datos, códigos de respuesta y validaciones para facilitar la integración frontend.

---

## 📊 Modelos de Datos

### Reserve
```typescript
interface Reserve {
  id: number;              // ID numérico de la reserva (integer en DB)
  product_id: string;      // ID del producto reservado
  client_id: string;       // ID del cliente que reserva
  start_time: string;      // Hora inicio (ISO 8601: "2024-01-15T14:00:00Z")
  end_time: string;        // Hora fin (ISO 8601: "2024-01-15T15:00:00Z")
  duration: number;        // Duración en horas
  total_amount: number;    // Monto total de la reserva
  status: string;          // Estado: "RESERVED", "confirmed", "cancelled"
  user_id: string;         // ID del usuario que creó la reserva
}
```

### ReserveRiched
```typescript
interface ReserveRiched {
  id: number;
  product_id: string;
  product_name: string;          // Nombre del producto (JOIN con products)
  product_description: string;   // Descripción del producto
  client_id: string;
  client_name: string;           // Nombre del cliente (JOIN con clients)
  start_time: string;
  end_time: string;
  duration: number;
  total_amount: number;
  status: string;
  user_id: string;
  user_name: string;             // Nombre del usuario (JOIN con users)
}
```

### ReservationReport
```typescript
interface ReservationReport {
  reserve_id: number;            // ID de la reserva
  product_name: string;          // Nombre del producto
  client_name: string;           // Nombre del cliente
  start_time: string;            // Hora inicio
  end_time: string;              // Hora fin
  duration_hours: number;        // Duración en horas
  total_amount: number;          // Monto total
  status: string;                // Estado de la reserva
  created_by: string;            // Usuario que creó la reserva
  days_until_reservation: number; // Días hasta la reserva
}
```

### AvailableSchedule
```typescript
interface AvailableSchedule {
  start_time: string;                    // Hora inicio disponible
  end_time: string;                      // Hora fin disponible
  available_consecutive_hours: number;   // Horas consecutivas disponibles
}
```

### ConsistencyIssue
```typescript
interface ConsistencyIssue {
  issue_type: string;       // Tipo de problema de consistencia
  reserve_id?: number;      // ID de reserva afectada (opcional)
  sales_count: number;      // Número de ventas relacionadas
  details: string;          // Descripción del problema
}
```

### Request Bodies
```typescript
interface ReserveRequest {
  action: string;           // Acción: "create", "update", "cancel"
  reserve_id?: number;      // ID de reserva (para update/cancel)
  product_id: string;       // ID del producto
  client_id: string;        // ID del cliente
  start_time: string;       // Hora inicio ISO 8601
  duration: number;         // Duración en horas
}
```

---

## 🔗 Endpoints de la API

🔒 = Requiere autenticación JWT

### 1. Gestionar Reserva 🔒
```http
POST /reserve/manage
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

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

**Status Codes:**
- `200`: Operación exitosa
- `400`: Body inválido o datos incorrectos
- `401`: Token inválido o faltante
- `500`: Error interno

### 2. Obtener Reserva por ID 🔒
```http
GET /reserve/{id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `id` (path): ID numérico de la reserva

**Body:** `N/A`

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

**Status Codes:**
- `200`: Reserva encontrada
- `400`: ID inválido
- `401`: Token inválido o faltante
- `404`: Reserva no encontrada
- `500`: Error interno

### 3. Obtener Reservas por Producto 🔒
```http
GET /reserve/product/{product_id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `product_id` (path): ID del producto

**Body:** `N/A`

**Response:** `ReserveRiched[]`
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

**Status Codes:**
- `200`: Reservas encontradas
- `400`: Product ID requerido
- `401`: Token inválido o faltante
- `500`: Error interno

### 4. Obtener Reservas por Cliente 🔒
```http
GET /reserve/client/{client_id}
Authorization: Bearer <jwt_token>
```

**Parámetros:**
- `client_id` (path): ID del cliente

**Body:** `N/A`

**Response:** `ReserveRiched[]`
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

**Status Codes:**
- `200`: Reservas encontradas
- `400`: Client ID requerido
- `401`: Token inválido o faltante
- `500`: Error interno

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

**Body:** `N/A`

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

**Status Codes:**
- `200`: Reporte generado
- `401`: Token inválido o faltante
- `500`: Error interno

### 6. Verificar Consistencia de Reservas 🔒
```http
GET /reserve/consistency/check
Authorization: Bearer <jwt_token>
```

**Body:** `N/A`

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

**Status Codes:**
- `200`: Verificación completada
- `401`: Token inválido o faltante
- `500`: Error interno

### 7. Obtener Horarios Disponibles para Reserva 🔒
```http
GET /reserve/available-schedules?product_id={product}&date={date}&duration_hours={duration}
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `product_id` (requerido): ID del producto
- `date` (requerido): Fecha en formato "YYYY-MM-DD"
- `duration_hours` (opcional): Duración deseada en horas (default: 1)

**Body:** `N/A`

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

**Status Codes:**
- `200`: Horarios encontrados
- `400`: product_id y date son requeridos
- `401`: Token inválido o faltante
- `500`: Error interno

---

## 📋 Códigos de Respuesta

| Código | Descripción | Cuándo se produce |
|--------|-------------|-------------------|
| `200` | OK | Operación exitosa |
| `400` | Bad Request | Parámetros inválidos o faltantes |
| `401` | Unauthorized | Token JWT inválido o faltante |
| `404` | Not Found | Recurso no encontrado |
| `500` | Internal Server Error | Error del servidor |

---

## ⚡ Validaciones

### Campos Requeridos por Endpoint

**POST /reserve/manage:**
- `action`: string (valores válidos: "create", "update", "cancel")
- `product_id`: string (no vacío)
- `client_id`: string (no vacío)
- `start_time`: string (formato ISO 8601)
- `duration`: number (mayor a 0)

**GET endpoints con parámetros de ruta:**
- Parámetros de ruta no pueden estar vacíos
- IDs numéricos deben ser enteros válidos

**GET /reserve/available-schedules:**
- `product_id`: string (requerido, no vacío)
- `date`: string (requerido, formato "YYYY-MM-DD")
- `duration_hours`: number (opcional, mayor a 0)

### Validaciones de Datos

- **Fechas**: Deben estar en formato ISO 8601 para `start_time`
- **Fechas de consulta**: Formato "YYYY-MM-DD" para parámetros de fecha
- **Duración**: Número entero positivo
- **Estados válidos**: "RESERVED", "confirmed", "cancelled"
- **Acciones válidas**: "create", "update", "cancel"

---

## 🔐 Autenticación

Todos los endpoints requieren autenticación JWT mediante header:
```
Authorization: Bearer <jwt_token>
```

El token debe incluir los claims necesarios (`user_id`) para operaciones de reserva.

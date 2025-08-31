# Client API - Frontend Integration Guide

## 📋 Resumen General

Esta guía documenta los endpoints del sistema de gestión de clientes, siguiendo el mismo patrón robusto y consistente que los sistemas de proveedores y pagos. Permite crear, consultar, actualizar, eliminar y obtener estadísticas de clientes, facilitando la integración frontend y el desarrollo de flujos de negocio relacionados.

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT.**
```
Authorization: Bearer <token>
```

## 🛠 Endpoints Disponibles

### 1. Crear Cliente

**POST** `/client`

Crea un nuevo cliente con información básica y metadatos opcionales.

#### Request Body
```json
{
  "name": "Cliente S.A.",
  "contact": {
    "email": "contacto@cliente.com",
    "phone": "+52-555-9876"
  },
  "address": {
    "street": "Av. Juárez 321",
    "city": "CDMX",
    "country": "México"
  },
  "tax_id": "RFC987654321",
  "metadata": {
    "priority": "medium",
    "notes": "Cliente frecuente"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "client_id": 201,
  "message": "Cliente creado correctamente"
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "tax_id already exists"
}
```

---

### 2. Consultar Cliente por ID

**GET** `/client/{id}`

Obtiene la información detallada de un cliente específico.

#### Path Parameters
- `id`: ID del cliente (int)

#### Response (Success)
```json
{
  "success": true,
  "client": {
    "id": 201,
    "name": "Cliente S.A.",
    "contact": {
      "email": "contacto@cliente.com",
      "phone": "+52-555-9876"
    },
    "address": {
      "street": "Av. Juárez 321",
      "city": "CDMX",
      "country": "México"
    },
    "tax_id": "RFC987654321",
    "metadata": {
      "priority": "medium",
      "notes": "Cliente frecuente"
    },
    "created_at": "2025-08-29T10:00:00Z",
    "updated_at": "2025-08-29T10:00:00Z"
  }
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "Client not found",
  "error": "client with ID 999 not found"
}
```

---

### 3. Actualizar Cliente

**PUT** `/client/{id}`

Actualiza la información de un cliente existente.

#### Request Body
```json
{
  "name": "Cliente S.A. Renovado",
  "contact": {
    "email": "nuevo@cliente.com",
    "phone": "+52-555-6543"
  },
  "address": {
    "street": "Av. Patriotismo 789",
    "city": "CDMX",
    "country": "México"
  },
  "metadata": {
    "priority": "high"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "client_id": 201,
  "message": "Cliente actualizado correctamente"
}
```

---

### 4. Eliminar Cliente (Borrado Lógico)

**DELETE** `/client/{id}`

Marca un cliente como inactivo (no se elimina físicamente).

#### Response (Success)
```json
{
  "success": true,
  "client_id": 201,
  "message": "Cliente eliminado correctamente"
}
```

---

### 5. Listar Clientes (Paginado y Búsqueda)

**GET** `/client?name=cliente&page=1&pageSize=10`

Obtiene una lista paginada de clientes, con opción de búsqueda por nombre.

#### Response (Success)
```json
{
  "success": true,
  "clients": [
    {
      "id": 201,
      "name": "Cliente S.A.",
      "contact": { "email": "contacto@cliente.com", "phone": "+52-555-9876" },
      "address": { "city": "CDMX" },
      "tax_id": "RFC987654321"
    },
    {
      "id": 202,
      "name": "Cliente B S.A.",
      "contact": { "email": "ventas@clienteb.com", "phone": "+52-555-8765" },
      "address": { "city": "Monterrey" },
      "tax_id": "RFC123456789"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 2
}
```

---

### 6. Estadísticas de Clientes

**GET** `/client/statistics`

Obtiene estadísticas consolidadas de clientes para análisis y monitoreo.

#### Query Parameters (Opcionales)
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)
- `active_only`: Solo clientes activos (boolean)

#### Example Request
```
GET /client/statistics?start_date=2025-08-01&end_date=2025-08-31&active_only=true
```

#### Response (Success)
```json
{
  "period": {
    "start_date": "2025-08-01",
    "end_date": "2025-08-31"
  },
  "client_statistics": {
    "total_clients": 40,
    "active_clients": 35,
    "inactive_clients": 5,
    "new_clients": 4,
    "updated_clients": 10
  },
  "generated_at": "2025-08-29T10:30:00Z"
}
```

---

## 📊 Modelos de Datos Principales

### Client
```typescript
interface Client {
  id: number;
  name: string;
  contact: {
    email: string;
    phone: string;
  };
  address: {
    street?: string;
    city?: string;
    country?: string;
  };
  tax_id: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}
```

### ClientStatistics
```typescript
interface ClientStatistics {
  total_clients: number;
  active_clients: number;
  inactive_clients: number;
  new_clients: number;
  updated_clients: number;
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `VALIDATION_FAILED` | Datos de entrada inválidos |
| `CLIENT_NOT_FOUND` | Cliente no existe |
| `TAX_ID_DUPLICATE` | RFC/tax_id duplicado |
| `INSUFFICIENT_PERMISSIONS` | Usuario sin permisos |
| `INACTIVE_CLIENT` | Cliente inactivo |

### Estructura de Error Estándar
```json
{
  "success": false,
  "message": "Human readable error message",
  "error_code": "ERROR_CODE",
  "details": "Additional technical details",
  "timestamp": "2025-08-29T10:30:00Z"
}
```

---

## 🔄 Flujo de Trabajo Recomendado

### 1. Crear Cliente
```
POST /client → {client_id}
```

### 2. Consultar y Actualizar
```
GET /client/{id}
PUT /client/{id}
```

### 3. Eliminar (borrado lógico)
```
DELETE /client/{id}
```

### 4. Listar y Buscar
```
GET /client?name=...&page=...&pageSize=...
```

### 5. Estadísticas y Monitoreo
```
GET /client/statistics
```

---

## 📋 Notas para el Equipo Frontend

1. **Validación de Campos**: Validar datos antes de enviar para mejor UX.
2. **Borrado Lógico**: Los clientes eliminados no se muestran en listados activos, pero pueden consultarse para auditoría.
3. **Metadatos Flexibles**: El campo `metadata` acepta cualquier JSON válido.
4. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC).
5. **IDs**: Los IDs son numéricos y únicos.
6. **Consistencia**: La API sigue el mismo patrón que los sistemas de proveedores y pagos para facilitar el desarrollo.

## 🔗 Endpoints Relacionados

- **Ventas**: `/sale/*` para órdenes y pagos
- **Productos**: `/product/*` para validar productos
- **Usuarios**: `/user/*` para información de usuarios

---

**Última actualización**: 29 de Agosto de 2025
**Versión API**: 1.0
**Patrón**: Siguiendo Supplier/Payments System

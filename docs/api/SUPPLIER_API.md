# Supplier API - Frontend Integration Guide

## 📋 Resumen General

Esta guía documenta los endpoints del sistema de gestión de proveedores, siguiendo el mismo patrón robusto y consistente que el sistema de pagos de compras. Permite crear, consultar, actualizar, eliminar y obtener estadísticas de proveedores, facilitando la integración frontend y el desarrollo de flujos de negocio relacionados.

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT.**
```
Authorization: Bearer <token>
```

## 🛠 Endpoints Disponibles

### 1. Crear Proveedor

**POST** `/supplier`

Crea un nuevo proveedor con información básica y metadatos opcionales.

#### Request Body
```json
{
  "name": "Proveedor S.A.",
  "contact": {
    "email": "contacto@proveedor.com",
    "phone": "+52-555-1234"
  },
  "address": {
    "street": "Av. Reforma 123",
    "city": "CDMX",
    "country": "México"
  },
  "tax_id": "RFC123456789",
  "metadata": {
    "priority": "high",
    "notes": "Proveedor estratégico"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "supplier_id": 101,
  "message": "Proveedor creado correctamente"
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

### 2. Consultar Proveedor por ID

**GET** `/supplier/{id}`

Obtiene la información detallada de un proveedor específico.

#### Path Parameters
- `id`: ID del proveedor (int)

#### Response (Success)
```json
{
  "success": true,
  "supplier": {
    "id": 101,
    "name": "Proveedor S.A.",
    "contact": {
      "email": "contacto@proveedor.com",
      "phone": "+52-555-1234"
    },
    "address": {
      "street": "Av. Reforma 123",
      "city": "CDMX",
      "country": "México"
    },
    "tax_id": "RFC123456789",
    "metadata": {
      "priority": "high",
      "notes": "Proveedor estratégico"
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
  "message": "Supplier not found",
  "error": "supplier with ID 999 not found"
}
```

---

### 3. Actualizar Proveedor

**PUT** `/supplier/{id}`

Actualiza la información de un proveedor existente.

#### Request Body
```json
{
  "name": "Proveedor S.A. Renovado",
  "contact": {
    "email": "nuevo@proveedor.com",
    "phone": "+52-555-5678"
  },
  "address": {
    "street": "Av. Insurgentes 456",
    "city": "CDMX",
    "country": "México"
  },
  "metadata": {
    "priority": "medium"
  }
}
```

#### Response (Success)
```json
{
  "success": true,
  "supplier_id": 101,
  "message": "Proveedor actualizado correctamente"
}
```

---

### 4. Eliminar Proveedor (Borrado Lógico)

**DELETE** `/supplier/{id}`

Marca un proveedor como inactivo (no se elimina físicamente).

#### Response (Success)
```json
{
  "success": true,
  "supplier_id": 101,
  "message": "Proveedor eliminado correctamente"
}
```

---

### 5. Listar Proveedores (Paginado y Búsqueda)

**GET** `/supplier?name=proveedor&page=1&pageSize=10`

Obtiene una lista paginada de proveedores, con opción de búsqueda por nombre.

#### Response (Success)
```json
{
  "success": true,
  "suppliers": [
    {
      "id": 101,
      "name": "Proveedor S.A.",
      "contact": { "email": "contacto@proveedor.com", "phone": "+52-555-1234" },
      "address": { "city": "CDMX" },
      "tax_id": "RFC123456789"
    },
    {
      "id": 102,
      "name": "Proveedor B S.A.",
      "contact": { "email": "ventas@proveedorb.com", "phone": "+52-555-4321" },
      "address": { "city": "Guadalajara" },
      "tax_id": "RFC987654321"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 2
}
```

---

### 6. Estadísticas de Proveedores

**GET** `/supplier/statistics`

Obtiene estadísticas consolidadas de proveedores para análisis y monitoreo.

#### Query Parameters (Opcionales)
- `start_date`: Fecha de inicio (YYYY-MM-DD)
- `end_date`: Fecha de fin (YYYY-MM-DD)
- `active_only`: Solo proveedores activos (boolean)

#### Example Request
```
GET /supplier/statistics?start_date=2025-08-01&end_date=2025-08-31&active_only=true
```

#### Response (Success)
```json
{
  "period": {
    "start_date": "2025-08-01",
    "end_date": "2025-08-31"
  },
  "supplier_statistics": {
    "total_suppliers": 25,
    "active_suppliers": 20,
    "inactive_suppliers": 5,
    "new_suppliers": 3,
    "updated_suppliers": 7
  },
  "generated_at": "2025-08-29T10:30:00Z"
}
```

---

## 📊 Modelos de Datos Principales

### Supplier
```typescript
interface Supplier {
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

### SupplierStatistics
```typescript
interface SupplierStatistics {
  total_suppliers: number;
  active_suppliers: number;
  inactive_suppliers: number;
  new_suppliers: number;
  updated_suppliers: number;
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Error Comunes

| Código | Descripción |
|--------|-------------|
| `VALIDATION_FAILED` | Datos de entrada inválidos |
| `SUPPLIER_NOT_FOUND` | Proveedor no existe |
| `TAX_ID_DUPLICATE` | RFC/tax_id duplicado |
| `INSUFFICIENT_PERMISSIONS` | Usuario sin permisos |
| `INACTIVE_SUPPLIER` | Proveedor inactivo |

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

### 1. Crear Proveedor
```
POST /supplier → {supplier_id}
```

### 2. Consultar y Actualizar
```
GET /supplier/{id}
PUT /supplier/{id}
```

### 3. Eliminar (borrado lógico)
```
DELETE /supplier/{id}
```

### 4. Listar y Buscar
```
GET /supplier?name=...&page=...&pageSize=...
```

### 5. Estadísticas y Monitoreo
```
GET /supplier/statistics
```

---

## 📋 Notas para el Equipo Frontend

1. **Validación de Campos**: Validar datos antes de enviar para mejor UX.
2. **Borrado Lógico**: Los proveedores eliminados no se muestran en listados activos, pero pueden consultarse para auditoría.
3. **Metadatos Flexibles**: El campo `metadata` acepta cualquier JSON válido.
4. **Fechas**: Todas las fechas están en formato ISO 8601 (UTC).
5. **IDs**: Los IDs son numéricos y únicos.
6. **Consistencia**: La API sigue el mismo patrón que el sistema de pagos y compras para facilitar el desarrollo.

## 🔗 Endpoints Relacionados

- **Compras**: `/purchase/*` para órdenes y pagos
- **Productos**: `/product/*` para validar productos
- **Usuarios**: `/user/*` para información de usuarios

---

**Última actualización**: 29 de Agosto de 2025
**Versión API**: 1.0
**Patrón**: Siguiendo Purchase Payments System

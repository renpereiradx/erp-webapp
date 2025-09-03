# Supplier API - Frontend Integration Guide

## 📋 Resumen General

Esta guía documenta los endpoints del sistema de gestión de proveedores implementados en el sistema de business management. La API permite crear, consultar, actualizar, eliminar y listar proveedores con funcionalidad básica de gestión.

## 🔐 Autenticación

**Todos los endpoints requieren autenticación JWT.**
```
Authorization: Bearer <token>
```

## 🛠 Endpoints Disponibles

### 1. Crear Proveedor

**POST** `/supplier/`

Crea un nuevo proveedor en el sistema.

#### Request Body
```json
{
  "name": "Proveedor S.A.",
  "contact_info": {
    "email": "contacto@proveedor.com",
    "phone": "+52-555-1234",
    "address": "Av. Reforma 123, CDMX, México"
  },
  "tax_id": "RFC123456789"
}
```

#### Response (Success)
```json
{
  "message": "Supplier added"
}
```

---

### 2. Consultar Proveedor por ID

**GET** `/supplier/{id}`

Obtiene la información detallada de un proveedor específico por ID.

#### Path Parameters
- `id`: ID del proveedor (int)

#### Response (Success)
```json
{
  "id": 101,
  "name": "Proveedor S.A.",
  "contact_info": {
    "email": "contacto@proveedor.com",
    "phone": "+52-555-1234",
    "address": "Av. Reforma 123, CDMX, México"
  },
  "tax_id": "RFC123456789",
  "status": true,
  "created_at": "2025-08-29T10:00:00Z",
  "user_id": "user123"
}
```

#### Response (Error - 400)
- "ID is required" - Cuando el ID no se proporciona
- "Invalid ID format" - Cuando el ID no es un entero válido

#### Response (Error - 500)
- Error del servidor interno

---

### 3. Buscar Proveedor por Nombre

**GET** `/supplier/name/{name}`

Busca proveedores que coincidan con el nombre especificado.

#### Path Parameters
- `name`: Nombre del proveedor a buscar (string)

#### Response (Success)
```json
[
  {
    "id": 101,
    "name": "Proveedor S.A.",
    "contact_info": {
      "email": "contacto@proveedor.com",
      "phone": "+52-555-1234"
    },
    "tax_id": "RFC123456789",
    "status": true,
    "created_at": "2025-08-29T10:00:00Z",
    "user_id": "user123"
  }
]
```

---

### 4. Listar Proveedores (Paginado)

**GET** `/supplier/{page}/{pageSize}`

Obtiene una lista paginada de proveedores.

#### Path Parameters
- `page`: Número de página (int)
- `pageSize`: Cantidad de elementos por página (int)

#### Response (Success)
```json
[
  {
    "id": 101,
    "name": "Proveedor S.A.",
    "contact_info": {
      "email": "contacto@proveedor.com",
      "phone": "+52-555-1234"
    },
    "tax_id": "RFC123456789",
    "status": true,
    "created_at": "2025-08-29T10:00:00Z",
    "user_id": "user123"
  },
  {
    "id": 102,
    "name": "Proveedor B S.A.",
    "contact_info": {
      "email": "ventas@proveedorb.com",
      "phone": "+52-555-4321"
    },
    "tax_id": "RFC987654321",
    "status": true,
    "created_at": "2025-08-29T11:00:00Z",
    "user_id": "user123"
  }
]
```

#### Response (Error - 400)
- "Page and PageSize are required" - Cuando faltan parámetros
- "Invalid Page format" / "Invalid PageSize format" - Cuando los parámetros no son enteros

---

### 5. Actualizar Proveedor

**PUT** `/supplier/{id}`

Actualiza la información de un proveedor existente.

#### Path Parameters
- `id`: ID del proveedor a actualizar (int)

#### Request Body
```json
{
  "name": "Proveedor S.A. Renovado",
  "contact_info": {
    "email": "nuevo@proveedor.com",
    "phone": "+52-555-5678",
    "address": "Av. Insurgentes 456, CDMX, México"
  },
  "tax_id": "RFC123456789"
}
```

#### Response (Success)
```json
{
  "message": "Supplier updated"
}
```

#### Response (Error - 400)
- "ID is required" - Cuando el ID no se proporciona
- "Invalid ID format" - Cuando el ID no es un entero válido

---

### 6. Eliminar Proveedor (Borrado Lógico)

**PUT** `/supplier/delete/{id}`

Marca un proveedor como inactivo (cambio de estado, no eliminación física).

#### Path Parameters
- `id`: ID del proveedor a eliminar (int)

#### Response (Success)
```json
{
  "message": "Supplier deleted"
}
```

#### Response (Error - 400)
- "ID is required" - Cuando el ID no se proporciona
- "Invalid ID format" - Cuando el ID no es un entero válido

---

## 📊 Modelos de Datos Principales

### Supplier
```typescript
interface Supplier {
  id: number;
  name: string;
  contact_info: any; // JSON object containing contact information
  tax_id: string;
  status: boolean; // true = active, false = inactive
  created_at: string; // ISO 8601 format
  user_id: string; // ID del usuario que creó el proveedor
}
```

### Ejemplo de contact_info
```json
{
  "email": "contacto@proveedor.com",
  "phone": "+52-555-1234",
  "address": "Av. Reforma 123, CDMX, México"
}
```

---

## ⚠️ Manejo de Errores

### Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200` | Operación exitosa |
| `400` | Error de validación en los datos de entrada |
| `401` | Token JWT inválido o faltante |
| `500` | Error interno del servidor |

### Mensajes de Error Comunes

#### Errores de Validación (400)
- "ID is required" - ID no proporcionado en la URL
- "Invalid ID format" - ID no es un número entero
- "Name is required" - Nombre no proporcionado en búsqueda
- "Page and PageSize are required" - Parámetros de paginación faltantes
- "Invalid Page format" / "Invalid PageSize format" - Parámetros no numéricos

#### Errores de Autenticación (401)
- Token JWT inválido, expirado o faltante

#### Errores del Servidor (500)
- Errores de base de datos
- Errores internos del sistema

---

## 🔄 Flujos de Trabajo Recomendados

### 1. Crear Nuevo Proveedor
```
POST /supplier/ → { "message": "Supplier added" }
```

### 2. Consultar Información de Proveedor
```
GET /supplier/{id} → Supplier object
```

### 3. Buscar Proveedores por Nombre
```
GET /supplier/name/{name} → Array of Supplier objects
```

### 4. Listar Proveedores con Paginación
```
GET /supplier/{page}/{pageSize} → Array of Supplier objects
```

### 5. Actualizar Proveedor Existente
```
PUT /supplier/{id} → { "message": "Supplier updated" }
```

### 6. Eliminar Proveedor (Borrado Lógico)
```
PUT /supplier/delete/{id} → { "message": "Supplier deleted" }
```

---

## 📋 Notas Importantes para Frontend

1. **Autenticación Obligatoria**: Todos los endpoints requieren token JWT válido
2. **Borrado Lógico**: La eliminación solo cambia el estado a `false`, no borra físicamente
3. **Paginación**: El listado usa paginación obligatoria con `page` y `pageSize`
4. **contact_info**: Campo flexible JSON que puede contener email, phone, address, etc.
5. **user_id**: Se asigna automáticamente desde el token JWT del usuario autenticado
6. **Fechas**: El campo `created_at` está en formato ISO 8601
7. **IDs**: Todos los IDs son números enteros únicos

## 🔗 Endpoints Relacionados

- **Compras**: `/purchase/*` - Para gestionar órdenes de compra a proveedores
- **Productos**: `/products/*` - Para gestionar productos del inventario
- **Clientes**: `/client/*` - Para gestionar clientes del sistema

---

**Última actualización**: 3 de Septiembre de 2025  
**Versión API**: 1.0  
**Basado en**: Implementación actual del sistema business_management

````markdown
# Guía de API de Clientes para Desarrolladores Frontend

Esta guía proporciona documentación completa de todos los endpoints de clientes disponibles para integración con aplicaciones frontend.

## Base URL
```
http://localhost:5050
```

## Autenticación
Todos los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <jwt_token>
```

---

## ¿Qué es el Sistema de Clientes?

El sistema de gestión de clientes permite:
- **Crear clientes**: Registro de nuevos clientes con información completa
- **Consultar clientes**: Búsqueda por ID, nombre o listado paginado
- **Actualizar clientes**: Modificación de información existente
- **Eliminar clientes**: Eliminación lógica (soft delete)
- **Gestión de contacto**: Información de contacto y documentos de identidad

### Estructura del Cliente:
- **Datos básicos**: ID, nombre, apellido, documento de identidad
- **Contacto**: Información de contacto (teléfono, email, etc.)
- **Estado**: Estado activo/inactivo del cliente
- **Auditoría**: Usuario que creó/modificó y fechas de creación

---

## Endpoints de Clientes

### 1. Crear Cliente

**POST** `/client/`

Crea un nuevo cliente con información básica.

**Request Body:**
```json
{
  "name": "Juan",
  "last_name": "Pérez García",
  "document_id": "12345678",
  "contact": "+595-21-123456"
}
```

**Campos:**
- `name` (string, requerido): Nombre del cliente
- `last_name` (string, requerido): Apellido del cliente
- `document_id` (string, requerido): Número de documento de identidad (CI, RUC, etc.)
- `contact` (string, opcional): Información de contacto (teléfono, email, etc.)

**Response (201):**
```json
{
  "message": "Client added"
}
```

**Response (400):**
```json
{
  "error": "Invalid request body"
}
```

---

### 2. Obtener Cliente por ID

**GET** `/client/{id}`

Obtiene un cliente específico por su ID.

**Path Parameters:**
- `id` (string, requerido): ID del cliente

**Response (200):**
```json
{
  "id": "abc123",
  "name": "Juan",
  "last_name": "Pérez García",
  "document_id": "12345678",
  "status": true,
  "user_id": "user123",
  "created_at": "2024-01-15T10:30:00Z",
  "contact": "+595-21-123456"
}
```

**Response (404):**
```json
{
  "error": "Client not found"
}
```

---

### 3. Buscar Cliente por Nombre

**GET** `/client/name/{name}`

Busca clientes por nombre (búsqueda parcial).

**Path Parameters:**
- `name` (string, requerido): Nombre o parte del nombre a buscar

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Juan",
    "last_name": "Pérez García",
    "document_id": "12345678",
    "status": true,
    "user_id": "user123",
    "created_at": "2024-01-15T10:30:00Z",
    "contact": "+595-21-123456"
  }
]
```

**Response (404):**
```json
{
  "error": "Client not found"
}
```

---

### 4. Obtener Clientes Paginados

**GET** `/client/{page}/{pageSize}`

Obtiene clientes con paginación.

**Path Parameters:**
- `page` (int, requerido): Número de página (empezando desde 1)
- `pageSize` (int, requerido): Cantidad de elementos por página

**Response (200):**
```json
[
  {
    "id": "abc123",
    "name": "Juan",
    "last_name": "Pérez García",
    "document_id": "12345678",
    "status": true,
    "user_id": "user123",
    "created_at": "2024-01-15T10:30:00Z",
    "contact": "+595-21-123456"
  },
  {
    "id": "def456",
    "name": "María",
    "last_name": "González López",
    "document_id": "87654321",
    "status": true,
    "user_id": "user123",
    "created_at": "2024-01-16T09:00:00Z",
    "contact": "maria@email.com"
  }
]
```

---

### 5. Actualizar Cliente

**PUT** `/client/{id}`

Actualiza la información de un cliente existente.

**Path Parameters:**
- `id` (string, requerido): ID del cliente a actualizar

**Request Body:**
```json
{
  "name": "Juan Carlos",
  "last_name": "Pérez García",
  "document_id": "12345678",
  "contact": "+595-21-987654"
}
```

**Response (200):**
```json
{
  "message": "Client updated"
}
```

**Response (400):**
```json
{
  "error": "Invalid request body"
}
```

---

### 6. Eliminar Cliente

**PUT** `/client/delete/{id}`

Elimina un cliente (eliminación lógica - cambia el estado a inactivo).

**Path Parameters:**
- `id` (string, requerido): ID del cliente a eliminar

**Response (200):**
```json
{
  "message": "Client deleted"
}
```

**Response (404):**
```json
{
  "error": "Client not found"
}
```

---

## Integración con Otros Sistemas

### Ventas por Cliente

Los clientes se integran con el sistema de ventas:

**GET** `/sale/client_id/{client_id}`

Obtiene todas las ventas realizadas a un cliente específico.

**GET** `/sale/client_name/{name}`

Obtiene ventas por nombre del cliente.

### Reservas por Cliente

Los clientes también se integran con el sistema de reservas:

**GET** `/reserve/client/{client_id}`

Obtiene todas las reservas de un cliente específico.

---

## Códigos de Respuesta HTTP

| Código | Descripción |
|--------|-------------|
| 200    | Operación exitosa |
| 201    | Recurso creado exitosamente |
| 400    | Solicitud inválida |
| 401    | No autorizado (token JWT inválido) |
| 404    | Recurso no encontrado |
| 500    | Error interno del servidor |

---

## Modelo de Datos del Cliente

### Client
```typescript
interface Client {
  id: string;                // ID único generado automáticamente
  name: string;              // Nombre del cliente
  last_name: string;         // Apellido del cliente
  document_id: string;       // Número de documento de identidad
  status: boolean;           // Estado activo (true) o inactivo (false)
  user_id: string;           // ID del usuario que creó/modificó el cliente
  created_at: string;        // Fecha de creación (ISO 8601)
  contact: string;           // Información de contacto
}
```

---

## Ejemplos de Uso con JavaScript/TypeScript

### Crear un cliente
```typescript
const createClient = async (clientData: {
  name: string;
  last_name: string;
  document_id: string;
  contact?: string;
}) => {
  try {
    const response = await fetch('/client/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};
```

### Obtener cliente por ID
```typescript
const getClientById = async (clientId: string) => {
  try {
    const response = await fetch(`/client/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const client = await response.json();
    return client;
  } catch (error) {
    console.error('Error fetching client:', error);
    throw error;
  }
};
```

### Buscar clientes por nombre
```typescript
const searchClientsByName = async (searchTerm: string) => {
  try {
    const response = await fetch(`/client/name/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const clients = await response.json();
    return clients;
  } catch (error) {
    console.error('Error searching clients:', error);
    throw error;
  }
};
```

### Obtener clientes paginados
```typescript
const getClientsPaginated = async (page: number, pageSize: number) => {
  try {
    const response = await fetch(`/client/${page}/${pageSize}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const clients = await response.json();
    return clients.map(client => ({
      ...client,
      // Agregar campos útiles para la UI
      fullName: `${client.name} ${client.last_name}`,
      isActive: client.status,
      hasContact: !!client.contact
    }));
  } catch (error) {
    console.error('Error fetching paginated clients:', error);
    throw error;
  }
};
```

### Actualizar cliente
```typescript
const updateClient = async (clientId: string, clientData: {
  name: string;
  last_name: string;
  document_id: string;
  contact?: string;
}) => {
  try {
    const response = await fetch(`/client/${clientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};
```

### Eliminar cliente
```typescript
const deleteClient = async (clientId: string) => {
  try {
    const response = await fetch(`/client/delete/${clientId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};
```

---

## Cuándo Usar Cada Endpoint

### Gestión Básica de Clientes
- **Crear cliente**: `POST /client/` - Para registrar nuevos clientes
- **Buscar por ID**: `GET /client/{id}` - Para obtener información específica
- **Buscar por nombre**: `GET /client/name/{name}` - Para búsquedas rápidas
- **Listado paginado**: `GET /client/{page}/{pageSize}` - Para mostrar listas

### Operaciones de Mantenimiento
- **Actualizar**: `PUT /client/{id}` - Para modificar información
- **Eliminar**: `PUT /client/delete/{id}` - Para desactivar clientes

### Integración con Ventas
- **Ventas por cliente**: `GET /sale/client_id/{client_id}`
- **Reservas por cliente**: `GET /reserve/client/{client_id}`

---

## Notas Importantes

1. **Autenticación**: Todos los endpoints requieren un token JWT válido.
2. **IDs únicos**: Los IDs se generan automáticamente usando shortid.
3. **Eliminación lógica**: Los clientes no se eliminan físicamente, solo se marcan como inactivos.
4. **Documento de identidad**: Campo requerido para identificación única del cliente.
5. **Búsqueda flexible**: La búsqueda por nombre acepta coincidencias parciales.
6. **Paginación**: Use siempre paginación para listas grandes de clientes.
7. **Estado del cliente**: El campo `status` indica si el cliente está activo (true) o inactivo (false).
8. **Auditoría**: Todos los cambios quedan registrados con el usuario que los realizó.

### Validaciones del Sistema
- **Nombre**: Campo requerido, no puede estar vacío
- **Apellido**: Campo requerido, no puede estar vacío
- **Documento**: Campo requerido, debe ser único por cliente
- **Contacto**: Campo opcional, puede contener teléfono, email, etc.

### Flujo Recomendado
1. **Crear cliente** → `POST /client/`
2. **Buscar clientes** → `GET /client/name/{name}` o `GET /client/{page}/{pageSize}`
3. **Ver detalles** → `GET /client/{id}`
4. **Actualizar datos** → `PUT /client/{id}`
5. **Eliminar** → `PUT /client/delete/{id}` (solo si es necesario)

Esta documentación cubre todos los endpoints de clientes disponibles en el sistema. Para dudas adicionales, consulte el código fuente en `/handlers/client.go` y `/models/client.go`.
````

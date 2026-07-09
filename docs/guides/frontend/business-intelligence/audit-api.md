# Audit API - Sistema de Auditoria

Sistema de registro y analisis de auditoria para trazabilidad completa de operaciones.

## Descripcion General

El modulo de auditoria proporciona:
- **Registro de Actividad**: Log completo de todas las operaciones del sistema
- **Trazabilidad**: Seguimiento de quien, cuando y que cambios se realizaron
- **Reportes de Usuario**: Analisis de actividad por usuario
- **Historial de Entidades**: Cambios historicos de cualquier entidad
- **Alertas de Seguridad**: Deteccion de actividad sospechosa
- **Exportacion**: Descarga de logs en formatos JSON y CSV

## Endpoints

### Consulta de Logs

#### GET /api/v1/audit/logs
Obtiene logs de auditoria con filtros.

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| start_date | date | Fecha inicio (YYYY-MM-DD) |
| end_date | date | Fecha fin (YYYY-MM-DD) |
| user_id | string | Filtrar por ID de usuario |
| category | string | Filtrar por categoria |
| action | string | Filtrar por tipo de accion |
| entity_type | string | Filtrar por tipo de entidad |
| entity_id | string | Filtrar por ID de entidad |
| level | string | Filtrar por nivel (INFO, WARNING, ERROR, CRITICAL) |
| success | boolean | Filtrar por resultado |
| search | string | Busqueda en descripcion |
| ip_address | string | Filtrar por IP |
| page | integer | Pagina (default: 1) |
| page_size | integer | Tamaño (default: 20, max: 100) |
| sort_by | string | Campo para ordenar |
| sort_order | string | asc o desc |

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": 12345,
        "timestamp": "2026-01-07T10:30:00Z",
        "user_id": "USER001",
        "username": "admin@empresa.com",
        "session_id": "sess_abc123",
        "ip_address": "192.168.1.100",
        "category": "SALE",
        "action": "CREATE",
        "entity_type": "SALE",
        "entity_id": "VTA-2026-00001",
        "description": "Venta creada por $15,000.00",
        "old_values": null,
        "new_values": {
          "total": 15000,
          "items": 5
        },
        "level": "INFO",
        "success": true,
        "duration_ms": 245
      }
    ],
    "total": 1500,
    "page": 1,
    "page_size": 50,
    "total_pages": 30
  }
}
```

#### GET /api/v1/audit/logs/{id}
Obtiene un log de auditoria especifico.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "timestamp": "2026-01-07T10:30:00Z",
    "user_id": "USER001",
    "username": "admin@empresa.com",
    "session_id": "sess_abc123",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "category": "SALE",
    "action": "CREATE",
    "entity_type": "SALE",
    "entity_id": "VTA-2026-00001",
    "description": "Venta creada por $15,000.00",
    "old_values": null,
    "new_values": {
      "total": 15000,
      "items": 5,
      "client_id": "CLI001"
    },
    "metadata": {
      "payment_method": "CASH"
    },
    "level": "INFO",
    "success": true,
    "duration_ms": 245,
    "request_method": "POST",
    "request_path": "/api/v1/sales"
  }
}
```

### Resumen de Auditoria

#### GET /api/v1/audit/summary
Obtiene resumen de auditoria para un periodo.

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| period | string | today, week, month, year (default: month) |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T15:30:00Z",
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-02-01T00:00:00Z"
    },
    "total_logs": 15420,
    "successful_actions": 15100,
    "failed_actions": 320,
    "success_rate": 97.92,
    "unique_users": 12,
    "unique_sessions": 450,
    "unique_ips": 8,
    "actions_by_category": [
      {
        "category": "SALE",
        "count": 5200,
        "success_rate": 99.1,
        "percentage": 33.7
      },
      {
        "category": "AUTH",
        "count": 3100,
        "success_rate": 94.5,
        "percentage": 20.1
      }
    ],
    "actions_by_type": [
      {
        "action": "READ",
        "count": 8500,
        "success_rate": 99.9,
        "percentage": 55.1
      },
      {
        "action": "CREATE",
        "count": 3200,
        "success_rate": 98.5,
        "percentage": 20.8
      }
    ],
    "top_users": [
      {
        "user_id": "USER001",
        "username": "vendedor1@empresa.com",
        "total_actions": 4500,
        "successful_actions": 4480,
        "failed_actions": 20,
        "unique_categories": 6,
        "unique_sessions": 120,
        "last_activity": "2026-01-07T15:25:00Z",
        "avg_actions_per_day": 145.2
      }
    ],
    "error_summary": [
      {
        "category": "AUTH",
        "action": "LOGIN",
        "error_message": "Invalid credentials",
        "count": 45,
        "last_occurred": "2026-01-07T14:30:00Z"
      }
    ],
    "hourly_distribution": [
      {"hour": 9, "count": 1200},
      {"hour": 10, "count": 1850},
      {"hour": 11, "count": 1650}
    ],
    "security_alerts": [
      {
        "type": "FAILED_LOGINS",
        "severity": "MEDIUM",
        "message": "5 intentos de login fallidos",
        "user_id": "USER003",
        "ip_address": "192.168.1.50",
        "occurred_at": "2026-01-07T10:15:00Z",
        "count": 5
      }
    ]
  }
}
```

#### GET /api/v1/audit/summary/range
Obtiene resumen para un rango de fechas especifico.

**Query Parameters:**
| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| start_date | date | Si | Fecha inicio |
| end_date | date | Si | Fecha fin |

### Tendencias

#### GET /api/v1/audit/trends
Obtiene tendencias de auditoria para un periodo.

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| period | string | today, week, month, year |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2026-01-01T00:00:00Z",
      "label": "01 Ene",
      "total_actions": 520,
      "successful": 510,
      "failed": 10,
      "unique_users": 8,
      "error_rate": 1.92
    },
    {
      "date": "2026-01-02T00:00:00Z",
      "label": "02 Ene",
      "total_actions": 480,
      "successful": 475,
      "failed": 5,
      "unique_users": 7,
      "error_rate": 1.04
    }
  ]
}
```

#### GET /api/v1/audit/trends/range
Obtiene tendencias para un rango de fechas.

### Historial de Entidad

#### GET /api/v1/audit/entity/{entity_type}/{entity_id}/history
Obtiene el historial de cambios de una entidad especifica.

**Path Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| entity_type | string | Tipo de entidad (SALE, PRODUCT, CLIENT, etc.) |
| entity_id | string | ID de la entidad |

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| page | integer | Pagina |
| page_size | integer | Tamaño de pagina |

**Response:**
```json
{
  "success": true,
  "data": {
    "entity_type": "PRODUCT",
    "entity_id": "PROD001",
    "total_changes": 15,
    "created_at": "2025-06-15T10:00:00Z",
    "created_by": "USER001",
    "last_modified": "2026-01-07T09:30:00Z",
    "last_modified_by": "USER003",
    "changes": [
      {
        "id": 12340,
        "timestamp": "2026-01-07T09:30:00Z",
        "user_id": "USER003",
        "username": "admin@empresa.com",
        "action": "UPDATE",
        "description": "Precio actualizado de $100 a $120",
        "old_values": {
          "price": 100
        },
        "new_values": {
          "price": 120
        }
      },
      {
        "id": 12320,
        "timestamp": "2026-01-05T14:20:00Z",
        "user_id": "USER001",
        "username": "vendedor1@empresa.com",
        "action": "UPDATE",
        "description": "Stock ajustado",
        "old_values": {
          "stock": 50
        },
        "new_values": {
          "stock": 45
        }
      }
    ]
  }
}
```

### Actividad de Usuario

#### GET /api/v1/audit/users/{user_id}/activity
Obtiene reporte de actividad detallado para un usuario.

**Path Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| user_id | string | ID del usuario |

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| period | string | today, week, month, year |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T15:30:00Z",
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-02-01T00:00:00Z"
    },
    "user_id": "USER001",
    "username": "vendedor1@empresa.com",
    "summary": {
      "total_actions": 4500,
      "successful_actions": 4480,
      "failed_actions": 20,
      "unique_categories": 6,
      "unique_sessions": 120,
      "last_activity": "2026-01-07T15:25:00Z",
      "avg_actions_per_day": 145.2
    },
    "actions_by_category": [
      {"category": "SALE", "count": 2500, "success_rate": 99.5, "percentage": 55.6}
    ],
    "actions_by_day": [
      {"date": "2026-01-07", "label": "07 Ene", "actions": 180, "success": 178, "failed": 2}
    ],
    "recent_actions": [
      {
        "id": 12345,
        "timestamp": "2026-01-07T15:25:00Z",
        "category": "SALE",
        "action": "CREATE",
        "entity_type": "SALE",
        "entity_id": "VTA-2026-00123",
        "description": "Venta creada",
        "success": true
      }
    ]
  }
}
```

#### GET /api/v1/audit/users/{user_id}/activity/range
Obtiene reporte de actividad para un rango de fechas.

#### GET /api/v1/audit/users/top
Obtiene usuarios con mayor actividad.

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| period | string | Periodo de tiempo |
| limit | integer | Numero de usuarios (default: 10) |

### Dashboard de Auditoria

#### GET /api/v1/audit/dashboard
Obtiene dashboard consolidado de auditoria.

**Query Parameters:**
| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| period | string | today, week, month, year |

**Response:**
```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T15:30:00Z",
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-02-01T00:00:00Z"
    },
    "kpis": {
      "total_actions": 15420,
      "successful_actions": 15100,
      "failed_actions": 320,
      "success_rate": 97.92,
      "unique_users": 12,
      "unique_sessions": 450,
      "avg_actions_per_user": 1285.0,
      "avg_actions_per_session": 34.3,
      "peak_hour": 10,
      "peak_hour_actions": 1850,
      "critical_errors": 5,
      "security_incidents": 12
    },
    "actions_by_category": [...],
    "actions_by_type": [...],
    "top_users": [...],
    "recent_activity": [...],
    "trends": [...],
    "security_alerts": [...],
    "error_summary": [...]
  }
}
```

#### GET /api/v1/audit/dashboard/range
Obtiene dashboard para un rango de fechas.

### Exportacion

#### POST /api/v1/audit/export
Exporta logs de auditoria.

**Request Body:**
```json
{
  "filter": {
    "start_date": "2026-01-01",
    "end_date": "2026-01-31",
    "category": "SALE",
    "success": true
  },
  "format": "csv",
  "max_records": 5000
}
```

**Response:**
Archivo descargable en el formato especificado (JSON o CSV).

### Constantes

#### GET /api/v1/audit/categories
Obtiene categorias disponibles.

**Response:**
```json
{
  "success": true,
  "data": [
    {"code": "AUTH", "name": "Autenticacion"},
    {"code": "SALE", "name": "Ventas"},
    {"code": "PURCHASE", "name": "Compras"},
    {"code": "INVENTORY", "name": "Inventario"},
    {"code": "PRODUCT", "name": "Productos"},
    {"code": "CLIENT", "name": "Clientes"},
    {"code": "SUPPLIER", "name": "Proveedores"},
    {"code": "PAYMENT", "name": "Pagos"},
    {"code": "USER", "name": "Usuarios"},
    {"code": "CONFIG", "name": "Configuracion"},
    {"code": "REPORT", "name": "Reportes"},
    {"code": "COMMISSION", "name": "Comisiones"},
    {"code": "LOYALTY", "name": "Fidelizacion"},
    {"code": "CASH_REGISTER", "name": "Caja"},
    {"code": "MANUFACTURING", "name": "Manufactura"},
    {"code": "SYSTEM", "name": "Sistema"}
  ]
}
```

#### GET /api/v1/audit/actions
Obtiene tipos de acciones disponibles.

#### GET /api/v1/audit/levels
Obtiene niveles de log disponibles.

#### GET /api/v1/audit/entity-types
Obtiene tipos de entidades disponibles.

## Categorias de Auditoria

| Categoria | Descripcion | Acciones Comunes |
|-----------|-------------|------------------|
| AUTH | Autenticacion | LOGIN, LOGOUT |
| SALE | Ventas | CREATE, UPDATE, CANCEL, PROCESS |
| PURCHASE | Compras | CREATE, UPDATE, CANCEL |
| INVENTORY | Inventario | ADJUST, TRANSFER |
| PRODUCT | Productos | CREATE, UPDATE, DELETE |
| CLIENT | Clientes | CREATE, UPDATE, DELETE |
| SUPPLIER | Proveedores | CREATE, UPDATE, DELETE |
| PAYMENT | Pagos | CREATE, PROCESS, VOID |
| USER | Usuarios | CREATE, UPDATE, DELETE |
| CONFIG | Configuracion | UPDATE |
| CASH_REGISTER | Caja | OPEN, CLOSE |
| COMMISSION | Comisiones | CREATE, APPROVE, ADJUST |
| LOYALTY | Fidelizacion | EARN, REDEEM, ADJUST |

## Niveles de Log

| Nivel | Descripcion | Uso |
|-------|-------------|-----|
| INFO | Informativo | Operaciones normales exitosas |
| WARNING | Advertencia | Situaciones atipicas pero no criticas |
| ERROR | Error | Operaciones fallidas |
| CRITICAL | Critico | Errores graves que requieren atencion |

## Alertas de Seguridad

El sistema genera alertas automaticas para:

1. **FAILED_LOGINS**: 5+ intentos fallidos en 15 minutos
2. **UNUSUAL_ACTIVITY**: 100+ acciones por hora (por usuario)
3. **CRITICAL_ERRORS**: Errores de nivel CRITICAL

## Retencion de Datos

Por defecto:
- Logs generales: 365 dias
- Logs criticos: 730 dias
- Logs de autenticacion: 730 dias
- Logs de pagos: 730 dias
- Logs de configuracion: 730 dias

## Notas de Implementacion

1. **Automatico**: Los logs se crean automaticamente para la mayoria de operaciones
2. **Asincronico**: El logging no bloquea las operaciones principales
3. **Inmutable**: Los logs no pueden ser modificados una vez creados
4. **Indexado**: Indices optimizados para consultas frecuentes
5. **Particionado**: Soporte para particionamiento mensual en ambientes de alto volumen

## Notas de Versión

### v1.1 (2026-02-23)
- **Fix**: Corregido valor por defecto de `page_size` en `GET /api/v1/audit/logs` — el valor real es **20** (max 100) según `parsePagination`, no 50/1000 como indicaba la documentación anterior

### v1.0 (2026-01-07)
- Versión inicial

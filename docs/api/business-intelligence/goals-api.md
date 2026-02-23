# Goals API - Sistema de Gestión de Metas

> **ESTADO: DESHABILITADO** — Este módulo está pendiente de implementación. Las rutas no están registradas porque las tablas de base de datos no existen. No usar en producción.

API para definición, asignación y seguimiento de metas empresariales.

## Descripción General

El módulo de Metas permite:

- **Definición de Metas**: Crear objetivos de ventas, ingresos, unidades, etc.
- **Asignación**: Asignar metas a vendedores o equipos
- **Seguimiento**: Monitorear progreso en tiempo real
- **Análisis**: Comparar rendimiento y tendencias
- **Incentivos**: Configurar recompensas por logro de metas

## Tipos de Metas

| Tipo | Código | Descripción |
|------|--------|-------------|
| Ventas | `SALES` | Monto total de ventas |
| Ingresos | `REVENUE` | Ingresos netos |
| Unidades | `UNITS` | Cantidad de unidades vendidas |
| Clientes | `CUSTOMERS` | Nuevos clientes |
| Utilidad | `PROFIT` | Margen de utilidad |
| Cobranza | `COLLECTION` | Monto de cobranza |

## Períodos

| Período | Código |
|---------|--------|
| Diario | `DAILY` |
| Semanal | `WEEKLY` |
| Mensual | `MONTHLY` |
| Trimestral | `QUARTERLY` |
| Anual | `ANNUAL` |

## Alcances (Scope)

| Alcance | Código | Descripción |
|---------|--------|-------------|
| Individual | `INDIVIDUAL` | Meta para un vendedor |
| Equipo | `TEAM` | Meta para un equipo |
| Empresa | `COMPANY` | Meta para toda la empresa |
| Categoría | `CATEGORY` | Meta para una categoría específica |

## Endpoints

### 1. Gestión de Metas

#### Listar Metas

```
GET /api/v1/goals
```

**Parámetros de Query:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `goal_type` | string | Filtrar por tipo |
| `status` | string | Filtrar por estado (ACTIVE, COMPLETED, EXPIRED) |
| `scope` | string | Filtrar por alcance |
| `period` | string | Filtrar por período |
| `page` | int | Página (default: 1) |
| `page_size` | int | Tamaño de página (default: 20) |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "uuid",
        "name": "Meta Ventas Enero 2026",
        "description": "Meta de ventas para el mes de enero",
        "goal_type": "SALES",
        "scope": "INDIVIDUAL",
        "period": "MONTHLY",
        "target_value": 50000.00,
        "target_unit": "AMOUNT",
        "start_date": "2026-01-01T00:00:00Z",
        "end_date": "2026-01-31T23:59:59Z",
        "status": "ACTIVE",
        "reward_type": "BONUS",
        "reward_value": 500.00,
        "created_at": "2025-12-15T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 20,
    "total_pages": 2
  }
}
```

---

#### Crear Meta

```
POST /api/v1/goals
```

**Body:**

```json
{
  "name": "Meta Ventas Q1 2026",
  "description": "Meta trimestral de ventas",
  "goal_type": "SALES",
  "scope": "INDIVIDUAL",
  "period": "QUARTERLY",
  "target_value": 150000.00,
  "target_unit": "AMOUNT",
  "start_date": "2026-01-01T00:00:00Z",
  "end_date": "2026-03-31T23:59:59Z",
  "reward_type": "BONUS",
  "reward_value": 1500.00
}
```

---

#### Obtener Meta por ID

```
GET /api/v1/goals/{id}
```

---

#### Obtener Meta con Progreso

```
GET /api/v1/goals/{id}/progress
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Meta Ventas Enero",
    "goal_type": "SALES",
    "target_value": 50000.00,
    "status": "ACTIVE",
    "assignments": [
      {
        "assignee_id": "seller-1",
        "assignee_name": "Juan Pérez",
        "target_value": 25000.00,
        "current_value": 18500.00,
        "progress": 74.0
      }
    ],
    "total_assigned": 2,
    "average_progress": 68.5,
    "top_performers": [
      {
        "assignee_id": "seller-1",
        "assignee_name": "Juan Pérez",
        "progress": 74.0,
        "rank": 1,
        "status": "ON_TRACK"
      }
    ]
  }
}
```

---

#### Cancelar Meta

```
POST /api/v1/goals/{id}/cancel
```

---

### 2. Asignación de Metas

#### Asignar Meta

```
POST /api/v1/goals/assign
```

**Body:**

```json
{
  "goal_id": "uuid-de-la-meta",
  "assignee_id": "seller-123",
  "assignee_type": "SELLER",
  "target_value": 25000.00
}
```

---

#### Obtener Asignaciones de una Meta

```
GET /api/v1/goals/{goal_id}/assignments
```

---

#### Obtener Metas de un Vendedor

```
GET /api/v1/goals/seller/{seller_id}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "seller_id": "seller-123",
    "seller_name": "Juan Pérez",
    "active_goals": [...],
    "completed_goals": [...],
    "summary": {
      "total_active": 3,
      "total_completed": 5,
      "average_progress": 72.5,
      "on_track_count": 2,
      "at_risk_count": 1,
      "behind_count": 0,
      "achieved_count": 5,
      "total_rewards_earned": 2500.00
    }
  }
}
```

---

### 3. Gestión de Progreso

#### Actualizar Progreso

```
POST /api/v1/goals/progress/update
```

**Body:**

```json
{
  "assignment_id": "uuid",
  "value": 5000.00,
  "notes": "Venta especial del día"
}
```

---

#### Recalcular Progreso desde Ventas

```
POST /api/v1/goals/progress/{assignment_id}/recalculate
```

Recalcula el progreso basándose en los datos reales de ventas del sistema.

---

### 4. Analytics

#### Resumen de Metas

```
GET /api/v1/goals/summary
GET /api/v1/goals/summary/date-range
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "total_goals": 50,
    "active_goals": 20,
    "completed_goals": 25,
    "expired_goals": 5,
    "overall_progress": 68.5,
    "on_track_count": 12,
    "at_risk_count": 5,
    "behind_count": 3,
    "total_target_value": 1000000.00,
    "total_achieved": 750000.00,
    "achievement_rate": 83.3
  }
}
```

---

#### Leaderboard de Meta

```
GET /api/v1/goals/{goal_id}/leaderboard
```

**Parámetros:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `limit` | int | 10 | Cantidad de posiciones |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "goal_id": "uuid",
    "goal_name": "Meta Ventas Enero",
    "entries": [
      {
        "rank": 1,
        "assignee_id": "seller-1",
        "assignee_name": "Juan Pérez",
        "target_value": 25000.00,
        "current_value": 27500.00,
        "progress": 110.0,
        "achievement": 110.0,
        "status": "ACHIEVED",
        "trend": "IMPROVING"
      }
    ]
  }
}
```

---

#### Top Performers

```
GET /api/v1/goals/top-performers
```

---

#### Tendencias

```
GET /api/v1/goals/trends
```

---

### 5. Dashboard

```
GET /api/v1/goals/dashboard
GET /api/v1/goals/dashboard/date-range
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:30:00Z",
    "period": {
      "start_date": "2026-01-01T00:00:00Z",
      "end_date": "2026-01-31T23:59:59Z"
    },
    "summary": {
      "total_goals": 20,
      "active_goals": 15,
      "completed_goals": 5,
      "overall_progress": 72.5,
      "achievement_rate": 83.3
    },
    "active_goals": [...],
    "at_risk_goals": [...],
    "top_performers": [...],
    "trends": {
      "by_type": [...],
      "by_period": [...],
      "achievement_rate": [...]
    }
  }
}
```

---

### 6. Mantenimiento

#### Expirar Metas Vencidas

```
POST /api/v1/goals/expire
```

Marca como expiradas las metas cuya fecha de fin ha pasado.

---

### 7. Constantes

#### Tipos de Meta

```
GET /api/v1/goals/types
```

#### Períodos

```
GET /api/v1/goals/periods
```

#### Alcances

```
GET /api/v1/goals/scopes
```

---

## Estados de Progreso

| Estado | Criterio | Descripción |
|--------|----------|-------------|
| `ACHIEVED` | progress >= 100% | Meta lograda |
| `ON_TRACK` | progress >= 75% | En camino de lograr |
| `AT_RISK` | progress >= 50% | En riesgo |
| `BEHIND` | progress < 50% | Atrasado |

## Tipos de Recompensa

| Tipo | Descripción |
|------|-------------|
| `BONUS` | Bono fijo al lograr la meta |
| `COMMISSION_BOOST` | Incremento en tasa de comisión |
| `POINTS` | Puntos de fidelización |

---

**Última actualización:** 2026-01-07

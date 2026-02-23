# Loyalty API

> **ESTADO: DESHABILITADO** — Este módulo está pendiente de implementación. Las rutas no están registradas porque las tablas de base de datos no existen. No usar en producción.

API para gestionar programas de fidelizacion, puntos, niveles y canjes.

## Base URL

```
/loyalty
```

## Autenticacion

Todos los endpoints requieren autenticacion JWT Bearer Token.

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Programas de Fidelizacion

#### GET /programs

Obtiene todos los programas de fidelizacion.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `active_only` | boolean | Filtrar solo programas activos (default: false) |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Programa Principal",
      "description": "Programa de fidelizacion estandar - 1 punto por cada $100",
      "points_per_amount": 100.0,
      "min_purchase_for_points": 0,
      "points_expiration_days": null,
      "points_value": 1.0,
      "is_active": true,
      "created_at": "2026-01-07T10:00:00Z",
      "updated_at": "2026-01-07T10:00:00Z"
    }
  ]
}
```

#### POST /programs

Crea un nuevo programa de fidelizacion.

**Body:**

```json
{
  "name": "Programa VIP",
  "description": "Programa exclusivo para clientes VIP",
  "points_per_amount": 50.0,
  "min_purchase_for_points": 0,
  "points_expiration_days": 365,
  "points_value": 1.5
}
```

#### GET /programs/{id}

Obtiene un programa por ID.

#### PUT /programs/{id}

Actualiza un programa existente.

---

### 2. Niveles (Tiers)

#### GET /tiers

Obtiene todos los niveles de fidelizacion.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `program_id` | int | Filtrar por programa |
| `active_only` | boolean | Filtrar solo niveles activos |

**Respuesta:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "program_id": 1,
      "name": "BRONZE",
      "display_name": "Bronce",
      "description": "Nivel inicial - Bienvenido al programa",
      "min_points_required": 0,
      "min_annual_spend": 0,
      "points_multiplier": 1.0,
      "discount_rate": 0,
      "priority": 1,
      "color": "#CD7F32",
      "is_active": true
    },
    {
      "id": 2,
      "program_id": 1,
      "name": "SILVER",
      "display_name": "Plata",
      "min_points_required": 1000,
      "min_annual_spend": 50000,
      "points_multiplier": 1.25,
      "discount_rate": 2.0,
      "priority": 2,
      "color": "#C0C0C0"
    },
    {
      "id": 3,
      "program_id": 1,
      "name": "GOLD",
      "display_name": "Oro",
      "min_points_required": 5000,
      "min_annual_spend": 200000,
      "points_multiplier": 1.5,
      "discount_rate": 5.0,
      "priority": 3,
      "color": "#FFD700"
    },
    {
      "id": 4,
      "program_id": 1,
      "name": "PLATINUM",
      "display_name": "Platino",
      "min_points_required": 15000,
      "min_annual_spend": 500000,
      "points_multiplier": 2.0,
      "discount_rate": 10.0,
      "priority": 4,
      "color": "#E5E4E2"
    }
  ]
}
```

#### POST /tiers

Crea un nuevo nivel.

**Body:**

```json
{
  "program_id": 1,
  "name": "DIAMOND",
  "display_name": "Diamante",
  "description": "Nivel supremo",
  "min_points_required": 50000,
  "min_annual_spend": 1000000,
  "points_multiplier": 3.0,
  "discount_rate": 15.0,
  "priority": 5,
  "color": "#B9F2FF"
}
```

#### GET /tiers/{id}

Obtiene un nivel por ID.

#### PUT /tiers/{id}

Actualiza un nivel existente.

---

### 3. Miembros

#### POST /members

Inscribe un cliente en un programa de fidelizacion.

**Body:**

```json
{
  "program_id": 1,
  "client_id": "CLI001234"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "program_id": 1,
    "program_name": "Programa Principal",
    "client_id": "CLI001234",
    "client_name": "Juan Perez",
    "tier_id": 1,
    "tier_name": "BRONZE",
    "tier_display_name": "Bronce",
    "tier_color": "#CD7F32",
    "current_points": 0,
    "lifetime_points": 0,
    "redeemed_points": 0,
    "annual_spend": 0,
    "points_multiplier": 1.0,
    "discount_rate": 0,
    "enrolled_at": "2026-01-07T10:00:00Z",
    "is_active": true
  }
}
```

#### GET /members/{client_id}

Obtiene la membresia de un cliente.

#### GET /members/{client_id}/transactions

Obtiene el historial de transacciones de puntos.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `period` | string | `today`, `week`, `month`, `year` (default: `month`) |
| `page` | int | Pagina (default: 1) |
| `page_size` | int | Registros por pagina (default: 20) |

#### GET /members/{client_id}/transactions/date-range

Obtiene transacciones por rango de fechas.

**Parametros Query:**

| Parametro | Tipo | Requerido | Descripcion |
|-----------|------|-----------|-------------|
| `start_date` | string | Si | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | Si | Fecha fin (YYYY-MM-DD) |

#### GET /members/{client_id}/balance

Obtiene el balance actual de puntos del cliente.

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "member_id": 1,
    "client_id": "CLI001234",
    "client_name": "Juan Perez",
    "current_points": 5000,
    "lifetime_points": 8000,
    "redeemed_points": 3000,
    "points_value": 1.0,
    "redeemable_value": 5000.0,
    "tier_name": "GOLD",
    "tier_display_name": "Oro",
    "points_multiplier": 1.5,
    "next_tier_name": "PLATINUM",
    "points_to_next_tier": 10000,
    "pending_redemptions": 1,
    "pending_discount_amount": 500.0
  }
}
```

#### GET /members/{client_id}/tier-history

Obtiene el historial de cambios de nivel del cliente.

#### GET /members/{client_id}/redemptions/pending

Obtiene los canjes pendientes del cliente.

---

### 4. Operaciones de Puntos

#### POST /points/earn

Acumula puntos por una venta.

**Body:**

```json
{
  "client_id": "CLI001234",
  "sale_id": "SALE-2026-001",
  "sale_amount": 15000.0,
  "description": "Compra en tienda principal"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "member_id": 1,
    "client_id": "CLI001234",
    "sale_id": "SALE-2026-001",
    "sale_amount": 15000.0,
    "base_points": 150,
    "multiplier": 1.5,
    "bonus_points": 75,
    "total_points": 225,
    "new_balance": 5225
  }
}
```

#### POST /points/adjust

Ajuste manual de puntos.

**Body:**

```json
{
  "client_id": "CLI001234",
  "points": 500,
  "reason": "Bonificacion por cumpleanos",
  "notes": "Cliente frecuente"
}
```

---

### 5. Canjes de Puntos

#### POST /redeem

Canjea puntos por un descuento.

**Body:**

```json
{
  "client_id": "CLI001234",
  "points_to_redeem": 1000,
  "notes": "Descuento para proxima compra"
}
```

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "member_id": 1,
    "client_id": "CLI001234",
    "client_name": "Juan Perez",
    "points_used": 1000,
    "discount_amount": 1000.0,
    "redemption_type": "DISCOUNT",
    "status": "PENDING",
    "expires_at": "2026-02-07T10:00:00Z",
    "created_at": "2026-01-07T10:00:00Z"
  }
}
```

**Estados de Canje:**

| Estado | Descripcion |
|--------|-------------|
| PENDING | Pendiente de aplicar |
| APPLIED | Aplicado a una venta |
| CANCELLED | Cancelado |
| EXPIRED | Expirado |

#### GET /redemptions/pending

Obtiene todos los canjes pendientes de aplicar.

#### POST /redemptions/apply

Aplica un canje a una venta.

**Body:**

```json
{
  "redemption_id": 1,
  "sale_id": "SALE-2026-002"
}
```

#### POST /redemptions/cancel

Cancela un canje pendiente y devuelve los puntos.

**Body:**

```json
{
  "redemption_id": 1,
  "reason": "Cliente decidio no usar el descuento"
}
```

---

### 6. Dashboard y Reportes

#### GET /dashboard

Obtiene dashboard consolidado de fidelizacion.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `program_id` | int | ID del programa (default: 1) |
| `period` | string | `today`, `week`, `month`, `year` |

**Respuesta:**

```json
{
  "success": true,
  "data": {
    "generated_at": "2026-01-07T10:00:00Z",
    "period": {...},
    "kpis": {
      "total_members": 500,
      "active_members": 350,
      "active_members_pct": 70.0,
      "new_members_this_period": 25,
      "members_growth": 5.26,
      "total_points_issued": 150000,
      "total_points_redeemed": 45000,
      "points_outstanding": 105000,
      "redemption_rate": 30.0,
      "avg_points_per_member": 210,
      "total_discounts_given": 45000.0,
      "avg_discount_per_redemption": 900.0,
      "top_tier_members": 15,
      "top_tier_members_pct": 3.0
    },
    "tier_distribution": [
      {
        "tier_id": 1,
        "tier_name": "BRONZE",
        "display_name": "Bronce",
        "color": "#CD7F32",
        "member_count": 300,
        "percentage": 60.0,
        "total_points": 30000,
        "total_spend": 1500000
      },
      ...
    ],
    "top_members": [...],
    "recent_activity": [...],
    "trends": [...],
    "pending_redemptions": [...],
    "alerts": [
      {
        "type": "POSITIVE_GROWTH",
        "category": "GROWTH",
        "message": "Excelente crecimiento de miembros: +5.26%",
        "value": 5.26,
        "severity": "LOW"
      }
    ]
  }
}
```

#### GET /dashboard/date-range

Obtiene dashboard por rango de fechas.

#### GET /summary

Obtiene resumen del programa de fidelizacion.

#### GET /summary/date-range

Obtiene resumen por rango de fechas.

#### GET /top-members

Obtiene ranking de mejores clientes por puntos.

**Parametros Query:**

| Parametro | Tipo | Descripcion |
|-----------|------|-------------|
| `program_id` | int | ID del programa |
| `limit` | int | Cantidad de resultados (default: 10) |

#### GET /tier-distribution

Obtiene distribucion de miembros por nivel.

#### GET /trends

Obtiene tendencias de puntos y canjes.

#### GET /trends/date-range

Obtiene tendencias por rango de fechas.

---

## Tipos de Transaccion

| Tipo | Descripcion |
|------|-------------|
| EARN | Puntos ganados por compra |
| REDEEM | Puntos canjeados |
| EXPIRE | Puntos expirados |
| ADJUST | Ajuste manual |
| BONUS | Bonificacion especial |

## Tipos de Referencia

| Tipo | Descripcion |
|------|-------------|
| SALE | Venta |
| REDEMPTION | Canje |
| MANUAL | Ajuste manual |
| EXPIRATION | Expiracion |
| BONUS | Bonificacion |

## Severidad de Alertas

| Severidad | Descripcion |
|-----------|-------------|
| HIGH | Alta prioridad |
| MEDIUM | Prioridad media |
| LOW | Baja prioridad |

---

## Codigos de Error

| Codigo | Descripcion |
|--------|-------------|
| 400 | Parametros invalidos o solicitud incorrecta |
| 401 | No autorizado |
| 404 | Recurso no encontrado |
| 500 | Error interno del servidor |

## Ejemplo de Uso con cURL

```bash
# Obtener programas de fidelizacion
curl -X GET "http://localhost:8080/loyalty/programs?active_only=true" \
  -H "Authorization: Bearer <token>"

# Inscribir cliente en programa
curl -X POST "http://localhost:8080/loyalty/members" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"program_id": 1, "client_id": "CLI001234"}'

# Obtener balance de puntos
curl -X GET "http://localhost:8080/loyalty/members/CLI001234/balance" \
  -H "Authorization: Bearer <token>"

# Acumular puntos por venta
curl -X POST "http://localhost:8080/loyalty/points/earn" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "CLI001234", "sale_id": "SALE-001", "sale_amount": 15000}'

# Canjear puntos por descuento
curl -X POST "http://localhost:8080/loyalty/redeem" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"client_id": "CLI001234", "points_to_redeem": 1000}'

# Aplicar canje a venta
curl -X POST "http://localhost:8080/loyalty/redemptions/apply" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"redemption_id": 1, "sale_id": "SALE-002"}'

# Obtener dashboard
curl -X GET "http://localhost:8080/loyalty/dashboard?period=month" \
  -H "Authorization: Bearer <token>"
```

---

## Flujo de Trabajo Tipico

1. **Configuracion inicial:**
   - Crear programa de fidelizacion (`POST /programs`)
   - Configurar niveles (`POST /tiers`)

2. **Inscripcion de clientes:**
   - Inscribir cliente (`POST /members`)
   - El cliente inicia en nivel BRONZE automaticamente

3. **Acumulacion de puntos:**
   - Al registrar una venta, llamar a `POST /points/earn`
   - Los puntos se calculan segun el monto y multiplicador del nivel
   - Se evalua automaticamente si el cliente sube de nivel

4. **Canje de puntos:**
   - Cliente solicita canje (`POST /redeem`)
   - Se genera un canje pendiente con fecha de expiracion
   - Al registrar la siguiente venta, aplicar el canje (`POST /redemptions/apply`)

5. **Monitoreo:**
   - Revisar dashboard (`GET /dashboard`)
   - Analizar distribucion por niveles (`GET /tier-distribution`)
   - Identificar mejores clientes (`GET /top-members`)

---

**Ultima actualizacion:** 2026-01-07

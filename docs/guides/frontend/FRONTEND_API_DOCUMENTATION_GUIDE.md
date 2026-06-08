# Guía de Documentación de APIs para Frontend

**Versión:** 1.1  
**Fecha:** 22 de Marzo de 2026  
**Propósito:** Estándar para documentar endpoints del backend

---

## 📋 Propósito

Esta guía define el formato estándar para documentar APIs del backend. El equipo frontend puede usarla como referencia técnica para integrarse con los endpoints.

---

## Principios

### ✅ QUÉ Documentar

1. **Endpoints exactos** con método HTTP
2. **Estructuras de request/response** completas
3. **Todos los campos** con tipos de datos precisos
4. **Todos los errores posibles** con HTTP status codes
5. **Validaciones requeridas** antes de enviar requests
6. **Casos de uso** con ejemplos reales
7. **Cambios importantes** entre versiones

### ❌ QUÉ NO Documentar

1. **Código de implementación** (JavaScript, TypeScript, React, etc.)
2. **Decisiones de arquitectura frontend** (cómo estructurar componentes)
3. **Detalles de implementación backend** (SQL queries, lógica interna)
4. **Tutoriales de frameworks** (el equipo frontend ya sabe usarlos)

---

## Estructura Estándar

### 1. Encabezado

```markdown
# 🏷️ Nombre del Módulo

**Versión:** X.X  
**Fecha:** YYYY-MM  
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Breve descripción del módulo (2-4 líneas).

### Características Principales

- ✅ Característica 1
- ✅ Característica 2
```

### 2. Configuración General

```markdown
## 🔧 Configuración General

### Headers Requeridos

\`\`\`http
Content-Type: application/json
Authorization: Bearer <jwt_token>
\`\`\`
```

### 3. Endpoint Individual

```markdown
## 1️⃣ Nombre de la Operación

**Endpoint:** `POST /ruta/del/endpoint`

Descripción breve de qué hace el endpoint.

**Request Body:**
\`\`\`json
{
  "campo1": "valor1",
  "campo2": 123
}
\`\`\`

**Parámetros del Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `campo1` | string | Sí | Descripción del campo |
| `campo2` | int | No | Default: 0 |

**Query Parameters:** (solo para GET)

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | int | 1 | Página actual |
| `page_size` | int | 20 | Elementos por página (max: 100) |

**Path Parameters:** (solo para rutas con :id)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `id` | int | ID del recurso |

**Response (200 OK):**
\`\`\`json
{
  "id": 1,
  "nombre": "Ejemplo"
}
\`\`\`

**Errores Posibles:**

| Error | HTTP | Descripción | Solución |
|-------|------|-------------|----------|
| `NOT_FOUND` | 404 | Recurso no encontrado | Verificar ID |
| `INVALID_INPUT` | 400 | Datos inválidos | Revisar request body |
```

### 4. Historial de Cambios

```markdown
## 📝 Historial de Cambios

### v2.0 - Marzo 2026
- ✅ Soporte para multi-moneda.
- ✅ Desglose de IVA en respuestas.

### v1.0 - Enero 2026
- ✅ Versión inicial.
```

---

## Tablas de Parámetros

### Request Body / Query Params

| Columna | Contenido |
|---------|-----------|
| Campo/Parámetro | Nombre exacto (con backticks) |
| Tipo | `string`, `int`, `float`, `bool`, `array`, `object` |
| Requerido/Default | `Sí`, `No`, o valor default |
| Descripción | Explicación clara y concisa |

### Ejemplos

**Parámetros de Request:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `client_id` | string | Sí | ID único del cliente |
| `amount` | float | Sí | Monto a procesar (mayor a 0) |
| `currency_id` | int | No | ID de moneda (default: moneda base) |
| `notes` | string | No | Notas adicionales |

**Query Parameters:**

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `start_date` | string | - | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | - | Fecha fin (YYYY-MM-DD) |
| `page` | int | 1 | Página actual |
| `page_size` | int | 10 | Elementos por página (max: 100) |

---

## Tabla de Errores

Formato obligatorio:

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `ERROR_CODE` | 400/404/etc | Qué causó el error | Cómo resolverlo |

### Códigos HTTP Comunes

| HTTP Status | Significado |
|-------------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Recurso creado |
| 204 | No Content - Operación exitosa sin respuesta |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido/ausente |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto de estado |
| 500 | Internal Server Error - Error del servidor |

---

## Modelos de Datos

Documentar estructuras de respuesta complejas:

```markdown
### NombreDelModelo

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int | Identificador único |
| `name` | string | Nombre del recurso |
| `status` | string | Estado: ACTIVE, INACTIVE |
| `created_at` | string | Fecha creación (ISO 8601) |

**Ejemplo:**
\`\`\`json
{
  "id": 1,
  "name": "Ejemplo",
  "status": "ACTIVE",
  "created_at": "2026-03-18T10:00:00Z"
}
\`\`\`
```

---

## Secciones Opcionales

### Notas Importantes

```markdown
> **Nota:** El campo `currency_id` es opcional. Si no se envía, se usa la moneda base.
```

### Advertencias

```markdown
> **⚠️ Importante:** `amount_received` debe ser mayor o igual a `amount_to_apply`.
```

### Enums

```markdown
| Campo | Tipo | Valores Posibles |
|-------|------|------------------|
| `status` | string | `PENDING` \| `PAID` \| `CANCELLED` |
| `type` | string | `NACIONAL` \| `CANASTA` \| `EXEMPT` |
```

### Campos Opcionales

```markdown
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `email` | string \| null | No | Email (puede ser null) |
| `metadata` | object | No | Datos adicionales |
```

---

## Flujo de Trabajo

```markdown
## 🔄 Flujo de Trabajo Recomendado

1. **Crear Venta:** `POST /sale`
2. **Consultar Estado:** `GET /sale/{id}/payment-status`
3. **Procesar Pago:** `POST /payment/process-partial`
4. **Verificar Resultado:** Revisar `payment_complete` y `requires_change`.
```

---

## Convenio de Nombres

| Elemento | Convención |
|----------|------------|
| Rutas | `kebab-case`: `/sale/{id}/payment-status` |
| Query params | `snake_case`: `start_date`, `page_size` |
| Campos JSON | `snake_case`: `client_id`, `total_amount` |
| Estados | UPPER_CASE: `PENDING`, `PAID`, `CANCELLED` |

### IDs

- Ventas: `string` (ej: `SALE-20260318-001`)
- Compras, productos: `int`

---

## Emojis Permitidos

| Emoji | Uso |
|-------|-----|
| 📋 | Descripción general |
| 🔧 | Configuración |
| 💳 | Pagos, métodos de pago |
| 💰 | Dinero, montos |
| 📊 | Estadísticas, reportes |
| ✅ | Características, cambios completados |
| ⚠️ | Advertencias importantes |
| ❌ | Errores |
| 🔄 | Flujos de trabajo |
| 📝 | Historial de cambios |
| 🔒 | Autenticación |

---

## Validaciones

```markdown
## 🔍 Validaciones

### Pre-Procesamiento (Validar en Frontend)

1. ✅ Campo `amount` debe ser mayor a 0
2. ✅ Si se envía `currency_id`, debe existir en `/currencies`
3. ⚠️ Advertir si `amount > 1000000` (valor alto)

### Post-Procesamiento (Backend Garantiza)

1. ✅ Registro creado en base de datos
2. ✅ Estado actualizado correctamente
3. ✅ Transacción atómica (todo o nada)
```

---

## Checklist de Documentación

Antes de publicar, verificar:

**Información Básica:**
- [ ] Encabezado con versión y fecha
- [ ] Descripción general clara
- [ ] Headers requeridos

**Endpoints:**
- [ ] Método HTTP explícito
- [ ] Ruta completa
- [ ] Request body con ejemplo JSON real
- [ ] Parámetros con tipo y requerimiento
- [ ] Response exitoso
- [ ] Todos los errores documentados

**Tipos de Datos:**
- [ ] Todos los campos tienen tipo especificado
- [ ] Campos opcionales marcados
- [ ] Enums con todos los valores

---

## Errores Comunes

### ❌ Ejemplos Genéricos

```json
{
  "id": 1,
  "name": "string",
  "amount": 0
}
```

### ✅ Ejemplos Reales

```json
{
  "id": 32,
  "name": "Caja Principal",
  "amount": 264000
}
```

### ❌ Tipos Imprecisos

```markdown
- amount: número
- status: texto
```

### ✅ Tipos Precisos

```markdown
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `amount` | number | Monto en guaraníes (entero) |
| `status` | string | Estado: `OPEN` \| `CLOSED` |
```

### ❌ Sin Documentación de Errores

```markdown
Si hay error, retorna status 400.
```

### ✅ Errores Documentados

```markdown
| Error | HTTP | Causa | Solución |
|-------|------|-------|----------|
| `NOT_FOUND` | 404 | ID no existe | Verificar ID |
| `INVALID_AMOUNT` | 400 | amount ≤ 0 | Validar amount > 0 |
```

---

## Archivos de Referencia

| Archivo | Propósito |
|---------|-----------|
| `docs/api/payments/ventas-cobros-api-unificada.md` | Documentación técnica completa de ventas |
| `docs/api/payments/compras-pagos-api-unificada.md` | Documentación técnica completa de compras |
| `docs/guides/frontend/SALE_PAYMENT_API.md` | Guía práctica de ventas y cobros |
| `docs/guides/frontend/PURCHASE_PAYMENTS_API_GUIDE.md` | Guía práctica de compras y pagos |
| `docs/guides/frontend/CATEGORY_IVA_API_GUIDE.md` | Categorías e IVA (CRUD completo) |
| `docs/guides/frontend/PRODUCT_API_GUIDE.md` | Productos con información de IVA |
| `docs/guides/frontend/PAYMENT_METHOD_CURRENCY_CASH_API_GUIDE.md` | Métodos de pago, monedas y cajas |

---

## Ejemplos de Respuestas con IVA

### Producto con IVA de Categoría (Default)

```json
{
  "id": "abc123",
  "name": "Coca-Cola 2L",
  "category": {
    "id": 10,
    "name": "Bebidas",
    "default_tax_rate_id": 1,
    "default_tax_rate": {
      "id": 1,
      "tax_name": "IVA 10%",
      "code": "IVA10",
      "rate": 10.0
    }
  },
  "override_tax_rate_id": null,
  "applicable_tax_rate": {
    "id": 1,
    "tax_name": "IVA 10%",
    "code": "IVA10",
    "rate": 10.0
  }
}
```

### Producto con IVA Sobrescrito (Override)

```json
{
  "id": "xyz789",
  "name": "Medicamento Genérico",
  "category": {
    "id": 15,
    "name": "Medicamentos",
    "default_tax_rate_id": 1,
    "default_tax_rate": {
      "id": 1,
      "tax_name": "IVA 10%",
      "code": "IVA10",
      "rate": 10.0
    }
  },
  "override_tax_rate_id": 3,
  "applicable_tax_rate": {
    "id": 3,
    "tax_name": "EXENTO",
    "code": "EXENTO",
    "rate": 0.0
  }
}
```

---

## Lógica de IVA Aplicable

El campo `applicable_tax_rate` se determina con la siguiente prioridad:

1. **Override del producto**: Si `override_tax_rate_id` tiene valor, usar esa tasa.
2. **Default de categoría**: Si no hay override, usar `category.default_tax_rate`.
3. **Sin IVA**: Si la categoría no tiene default y el producto no tiene override, el campo será `null`.

---

## Mantenimiento

### Cuándo Actualizar

1. **Cambios en API**: Endpoints, campos, comportamiento
2. **Nuevos endpoints**: Documentar inmediatamente
3. **Bugs descubiertos**: Actualizar errores y validaciones
4. **Feedback del equipo**: Si alguien pregunta algo, documentarlo

### Versionado

```markdown
**Versión:** X.Y
```

- **X (Major)**: Cambios breaking (estructura, endpoints deprecados)
- **Y (Minor)**: Nuevas features, campos opcionales

---

**Última actualización:** 18 Marzo 2026  
**Mantenido por:** Equipo Backend

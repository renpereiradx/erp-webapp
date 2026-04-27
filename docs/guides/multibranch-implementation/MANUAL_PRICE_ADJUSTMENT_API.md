# 🔧 API de Ajustes Manuales de Precios

> **Disclaimer:** Esta guía contiene ejemplos JSON y TypeScript/JavaScript para ilustración de payloads y respuestas. Para el modelado de datos en el frontend, utilice las **tablas de definición de campos** como fuente de verdad.

**Versión:** 2.1  
**Fecha:** 19 de Marzo de 2026  
**Endpoint Base:** `http://localhost:5050`

---

## 📋 Descripción General

Esta guía documenta la API para realizar ajustes manuales en los precios de venta de los productos. El sistema está diseñado para ser robusto, prevenir errores comunes de datos y mantener un historial claro de todos los cambios de precios.

La versión 2.0 introduce mejoras críticas que automatizan procesos y garantizan la integridad de los datos, simplificando la integración del frontend.

### ✅ Características Principales (v2.0)

- **Normalización Automática de Unidades**: El backend convierte automáticamente las unidades a minúsculas (ej. "UNIT" -> "unit") para evitar duplicados.
- **UPSERT Inteligente**: En lugar de crear un nuevo registro de precio para la misma unidad, el sistema actualiza el existente, manteniendo un único precio canónico por producto/unidad.
- **Validación de Productos**: El API verifica que el producto exista antes de aplicar cualquier ajuste de precio, previniendo datos huérfanos.
- **Ordenamiento Cronológico**: El historial de precios se devuelve ordenado por fecha descendente, facilitando al frontend mostrar siempre el precio más reciente.
- **Integración Total**: Cada ajuste de precio genera automáticamente una transacción financiera (`price_transactions`), garantizando la consistencia contable.

---

## ⚠️ Cambios Importantes en v2.0

### Breaking Changes

No hay breaking changes en los endpoints existentes, pero el comportamiento interno ha sido mejorado significativamente.

### Impacto en Integración

1.  **Consistencia de Datos**: El frontend ya no necesita preocuparse por normalizar las unidades antes de enviarlas.
2.  **Historial Simplificado**: Al haber un solo precio por unidad, la lógica para obtener el "precio actual" es más sencilla.
3.  **Respuestas de Error Mejoradas**: La validación de productos inexistentes devuelve un error claro, que el frontend puede manejar para guiar al usuario.

---

## 🔧 Configuración General

### Base URL

```
http://localhost:5050
```

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Contexto de Sucursal

- Query param: `?branch_id=<id>`
- O header: `X-Branch-ID: <id>`
- Fallback: `active_branch` del token JWT
- Restricción: sucursal debe estar en `allowed_branches`

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## 📋 Validación de Metadata

El campo `metadata` en ajustes de precio es validado contra un JSON Schema en el backend. Si la estructura no es válida, el API devuelve un error 400 con detalles.

### Estructura Válida para Metadata de Ajuste de Precio

```json
{
  "system_version": "string (opcional)",
  "adjustment_type": "string enum: MARKET_UPDATE, COMPETITOR_ADJUSTMENT, PROMOTION, COST_CHANGE, CURRENCY_ADJUSTMENT, CORRECTION, SEASONAL (opcional)",
  "old_price": "number >= 0 (opcional)",
  "new_price": "number >= 0 (opcional)",
  "price_difference": "number (opcional)",
  "price_change_percent": "number (opcional)",
  "margin_impact": "number (opcional)",
  "unit": "string (opcional)",
  "currency_code": "string (opcional)",
  "effective_date": "string ISO datetime (opcional)",
  "expiry_date": "string ISO datetime (opcional)",
  "applicable_to": "string enum: ALL_CLIENTS, SPECIFIC_CLIENT, SPECIFIC_REGION, CHANNEL (opcional)",
  "reason_code": "string (opcional)",
  "competitor_reference": "string (opcional)",
  "verified_by": "string (opcional)",
  "approved_by": "string (opcional)",
  "notes": "string (opcional)"
}
```

### Ejemplo de Metadata Válida

```json
{
  "adjustment_type": "MARKET_UPDATE",
  "competitor_reference": "Tienda Competidora X",
  "approved_by": "manager_01",
  "notes": "Ajuste por competencia directa"
}
```

### Ejemplo de Error

```json
{
  "success": false,
  "message": "Invalid metadata: adjustment_type: adjustment_type must be one of the following: MARKET_UPDATE, COMPETITOR_ADJUSTMENT, PROMOTION, COST_CHANGE, CURRENCY_ADJUSTMENT, CORRECTION, SEASONAL"
}
```

---

## 🎯 Endpoints

### 1. Ajustar Precio de Venta

**Endpoint:** `POST /manual_adjustment/price`

Crea o actualiza el precio de venta para una unidad de producto específica. Este es el endpoint principal para realizar ajustes.

**Request Body:**

```json
{
  "product_id": "PROD_BANANA_001",
  "new_price": 18.75,
  "unit": "UNIT",
  "reason": "Ajuste por fluctuación del mercado",
  "metadata": {
    "source": "frontend_app_v2",
    "change_type": "increase",
    "approved_by": "manager_001"
  }
}
```

**Parámetros:**

| Campo        | Tipo   | Requerido | Descripción                                                                         |
| ------------ | ------ | --------- | ----------------------------------------------------------------------------------- |
| `product_id` | string | ✅ Sí     | ID único del producto a ajustar.                                                    |
| `new_price`  | number | ✅ Sí     | El nuevo precio de venta. Debe ser >= 0.                                            |
| `unit`       | string | ❌ No     | La unidad de medida para el precio (ej. "UNIT", "caja", "kg"). **Default: "UNIT"**. |
| `reason`     | string | ✅ Sí     | Justificación del cambio de precio.                                                 |
| `metadata`   | object | ❌ No     | Objeto JSON para datos adicionales (auditoría, etc.).                               |

**Response (200 OK):**

```json
{
  "message": "Manual price adjustment successful"
}
```

> **💡 Nota para Frontend:** Aunque la respuesta es simple, el backend realiza una operación completa, incluyendo la creación de un registro de ajuste y una transacción de precio. Para obtener los detalles completos del ajuste, se puede consultar el historial del producto.

**Errores Posibles:**

| Mensaje de Error                           | HTTP Status | Causa                                                           |
| ------------------------------------------ | ----------- | --------------------------------------------------------------- |
| `Product with ID [..] does not exist`      | 500         | El `product_id` enviado no corresponde a un producto existente. |
| `Price cannot be negative`                 | 500         | El `new_price` es menor que 0.                                  |
| `Reason is required for price adjustments` | 500         | El campo `reason` está vacío.                                   |
| (Error de decodificación JSON)             | 400         | El cuerpo de la solicitud no es un JSON válido.                 |
| (Error de autenticación)                   | 401         | El token JWT es inválido, ha expirado o no se proporcionó.      |

---

### 2. Obtener Historial por Producto

**Endpoint:** `GET /manual_adjustment/product/{productId}/history`

Recupera el historial completo de ajustes de precios para un producto específico, ordenado del más reciente al más antiguo.

**Parámetros de URL:**

| Parámetro   | Tipo   | Descripción                  |
| ----------- | ------ | ---------------------------- |
| `productId` | string | ID del producto a consultar. |

**Parámetros de Query:**

| Parámetro | Tipo   | Requerido | Descripción                                              |
| --------- | ------ | --------- | -------------------------------------------------------- |
| `limit`   | number | ❌ No     | Número máximo de resultados a devolver. **Default: 50**. |
| `offset`  | number | ❌ No     | Desplazamiento para paginación. **Default: 0**.          |

**Response (200 OK):**

```json
{
  "product_id": "PROD_BANANA_001",
  "history": [
    {
      "adjustment_id": 25,
      "adjustment_type": "price",
      "old_value": 21.5,
      "new_value": 22.75,
      "value_change": 1.25,
      "user_id": "QSmaDgjHg",
      "adjustment_date": "2025-09-11T20:23:33.968806Z",
      "reason": "Test después del fix NULL values",
      "metadata": {
        "unit": "UNIT",
        "integration_status": "completed",
        "price_transaction_id": 57
      },
      "related_transaction_id": null
    }
  ],
  "limit": 50,
  "offset": 0,
  "count": 5
}
```

---

### 3. Obtener Ajustes de Precio Recientes

**Endpoint:** `GET /manual_adjustment/price/recent`

Obtiene una lista de los ajustes de precios más recientes en todo el sistema. Ideal para un dashboard de actividad.

**Parámetros de Query:**

| Parámetro | Tipo   | Requerido | Descripción                                             |
| --------- | ------ | --------- | ------------------------------------------------------- |
| `days`    | number | ❌ No     | Número de días hacia atrás para buscar. **Default: 7**. |
| `limit`   | number | ❌ No     | Número máximo de resultados. **Default: 50**.           |

**Response (200 OK):**

```json
{
  "adjustments": [
    {
      "adjustment_id": 26,
      "adjustment_type": "price",
      "old_value": 22000,
      "new_value": 25000,
      "value_change": 3000,
      "user_id": "2pmK5NPfHiRwZUkcd3d3cETC2JW",
      "adjustment_date": "2025-09-11T20:24:51.301467Z",
      "reason": "Declaración de precio inicial",
      "metadata": {
        "unit": "UNIT",
        "integration_status": "completed",
        "price_transaction_id": 58
      },
      "related_transaction_id": null
    }
  ],
  "filter": {
    "days_back": 7,
    "limit": 10
  },
  "count": 5
}
```

---

### 4. Obtener Ajustes por Rango de Fechas

**Endpoint:** `GET /manual_adjustment/price/date-range`

Busca ajustes de precios dentro de un rango de fechas específico, con filtros opcionales.

**Parámetros de Query:**

| Parámetro    | Tipo   | Requerido | Descripción                                     |
| ------------ | ------ | --------- | ----------------------------------------------- |
| `start_date` | string | ❌ No     | Fecha de inicio (formato `YYYY-MM-DD`).         |
| `end_date`   | string | ❌ No     | Fecha de fin (formato `YYYY-MM-DD`).            |
| `product_id` | string | ❌ No     | Filtrar por un ID de producto específico.       |
| `limit`      | number | ❌ No     | Máximo de resultados. **Default: 50**.          |
| `offset`     | number | ❌ No     | Desplazamiento para paginación. **Default: 0**. |

**Response (200 OK):**

```json
{
  "adjustments": [
    {
      "adjustment_id": 25,
      "adjustment_type": "price",
      "old_value": 21.5,
      "new_value": 22.75,
      "value_change": 1.25,
      "user_id": "QSmaDgjHg",
      "adjustment_date": "2025-09-11T20:23:33.968806Z",
      "reason": "Ajuste de prueba",
      "metadata": {
        "unit": "UNIT",
        "integration_status": "completed"
      },
      "related_transaction_id": null
    }
  ],
  "filters": {
    "start_date": "2025-09-11",
    "end_date": "2025-09-11",
    "product_id": "PROD_BANANA_001"
  },
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

---

### 5. Verificar Integridad del Sistema

**Endpoint:** `GET /manual_adjustment/integration/verify`

Endpoint de diagnóstico para verificar la salud e integridad de las integraciones financieras del sistema.

**Response (200 OK):**

```json
{
  "integration_status": "FULLY_INTEGRATED",
  "verification_results": {
    "sale_payments_without_movements": 0,
    "purchase_payments_without_movements": 0,
    "orphaned_cash_movements": 0,
    "closed_register_payments": 0
  },
  "recommendations": [],
  "verified_at": "2025-09-12T10:30:00Z"
}
```

---

## 🔍 Validaciones y Reglas de Negocio

### Pre-Procesamiento (Validar en Frontend)

1.  ✅ **Precio Válido**: `new_price` debe ser un número positivo (`>= 0`).
2.  ✅ **Razón Obligatoria**: `reason` no puede estar vacío y se recomienda una longitud mínima (ej. 10 caracteres) para asegurar justificaciones claras.
3.  ✅ **Producto Seleccionado**: `product_id` debe ser proporcionado.

### Post-Procesamiento (El Backend Garantiza)

1.  **Normalización de Unidad**: El backend convierte `unit` a minúsculas. El frontend puede enviar "UNIT", "unit", o "Unit" y el resultado será el mismo.
2.  **Actualización Inteligente (UPSERT)**: Si ya existe un precio para la combinación `product_id` y `unit`, el sistema lo actualiza. Si no, crea uno nuevo. Esto previene precios duplicados para la misma unidad.
3.  **Validación de Existencia**: El backend rechaza ajustes para `product_id` que no existen en la base de datos.

---

## 🔄 Casos de Uso

### Caso 1: Ajustar el precio de un producto

**Escenario:** Cambiar el precio unitario de "PROD_BANANA_001" a 18.75.

```bash
curl -X POST http://localhost:5050/manual_adjustment/price \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "product_id": "PROD_BANANA_001",
    "new_price": 18.75,
    "unit": "UNIT",
    "reason": "Ajuste semanal de precios"
  }'
```

**Resultado:**

- ✅ El precio de "PROD_BANANA_001" para la unidad "unit" se actualiza a 18.75.
- ✅ Se crea un registro en `manual_price_adjustments`.
- ✅ Se crea una transacción en `price_transactions`.

### Caso 2: Consultar el historial de un producto

**Escenario:** Ver todos los cambios de precio que ha tenido "PROD_BANANA_001".

```bash
curl -X GET "http://localhost:5050/manual_adjustment/product/PROD_BANANA_001/history?limit=5" \
  -H "Authorization: Bearer <jwt_token>"
```

**Resultado:**

- ✅ Devuelve un JSON con los últimos 5 ajustes de precio para ese producto.

### Caso 3: Ver los ajustes más recientes en el sistema

**Escenario:** Un gerente quiere ver los últimos 10 cambios de precio realizados hoy.

```bash
curl -X GET "http://localhost:5050/manual_adjustment/price/recent?days=1&limit=10" \
  -H "Authorization: Bearer <jwt_token>"
```

**Resultado:**

- ✅ Devuelve una lista de los últimos 10 ajustes de precios realizados en las últimas 24 horas.

---

## 🎯 Recomendaciones de Implementación

### 1. Flujo de Ajuste de Precio en UI

1.  **Obtener Precio Actual**: Antes de mostrar el formulario de ajuste, obtenga los datos del producto (usando `GET /product/enriched/{id}` o similar) para mostrar el precio actual.
2.  **Validar Formulario**: Implementar las validaciones del frontend (precio positivo, razón no vacía) para evitar requests innecesarios.
3.  **Confirmación**: Mostrar al usuario el precio antiguo y el nuevo, y pedir confirmación antes de enviar la solicitud `POST /manual_adjustment/price`.
4.  **Refrescar Datos**: Tras una respuesta exitosa (200 OK), vuelva a solicitar los datos del producto para que la UI refleje el precio actualizado. Invalide cualquier caché local para ese producto.

### 2. Sincronización de Estado

- Después de un ajuste exitoso, es crucial invalidar cualquier estado o caché del lado del cliente que contenga información de precios del producto modificado.
- Considere mostrar una notificación (toast/snackbar) al usuario confirmando que el ajuste fue exitoso.

### 3. Manejo de Errores Específicos

- Si recibe un error `Product with ID [...] does not exist`, informe al usuario que el producto ya no es válido o fue eliminado.
- Para errores de validación, resalte los campos del formulario que son incorrectos.

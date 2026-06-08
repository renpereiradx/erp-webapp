# [Emoji] Título del Sistema/Feature - API Guide

**Versión:** 1.0  
**Fecha:** [DD de Mes de YYYY]  
**Endpoint Base:** `http://localhost:[PORT]`

---

## 📋 Descripción General

[2-3 párrafos explicando qué hace este sistema/feature y por qué existe. Contexto de negocio breve.]

### Características Principales

- ✅ Feature 1: Breve descripción
- ✅ Feature 2: Breve descripción
- ✅ Feature 3: Breve descripción
- ✅ Feature 4: Breve descripción

---

## ⚠️ Cambios Importantes en v[X.X] (Si aplica)

### Breaking Changes

**Antes (v[X.X]):**
- Campo `old_field` era tipo_antiguo
- Endpoint usaba `/old-path`
- Comportamiento anterior

**Ahora (v[X.X]):**
- Campo `new_field` es tipo_nuevo
- Endpoint ahora es `/new-path`
- Comportamiento nuevo

### Impacto en Integración

1. **Cambio 1**: Descripción del cambio y cómo migrar
2. **Cambio 2**: Descripción del cambio y cómo migrar
3. **Cambio 3**: Descripción del cambio y cómo migrar

---

## 🔧 Configuración General

### Base URL

```
http://localhost:[PORT]
```

### Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Formato de Respuesta Estándar

```json
{
  "success": boolean,
  "data": object,
  "message": string,
  "error": string
}
```

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `resource:read` |
| POST / PUT / DELETE / PATCH | `resource:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.
- Sin el permiso de lectura → `403 Forbidden`
- Intentar escritura en módulo de solo lectura → `405 Method Not Allowed`

> **Para módulos de solo lectura:** Reemplazar la celda de escritura con `— (módulo de solo lectura)` y omitir el permiso de escritura.

---

## [Emoji] [Nombre de la Sección de Endpoints]

### 1. [Acción Específica] - [Nombre Descriptivo]

**Endpoint:** `[MÉTODO] /ruta/completa/del/endpoint`

[Breve descripción de 1-2 líneas explicando qué hace este endpoint]

**Request Body:**

```json
{
  "campo1": "valor_ejemplo",
  "campo2": 12345,
  "campo3": {
    "subcampo1": "valor"
  },
  "campo4": ["item1", "item2"]
}
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `campo1` | string | ✅ Sí | Descripción detallada del campo |
| `campo2` | number | ✅ Sí | Descripción con restricciones (ej: debe ser > 0) |
| `campo3` | object | ❌ No | Descripción de qué contiene el objeto |
| `campo3.subcampo1` | string | ⚠️ Condicional | Obligatorio si se envía campo3 |
| `campo4` | array<string> | ❌ No | Lista de items, máximo 10 elementos |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 123,
    "campo1": "valor_ejemplo",
    "campo2": 12345,
    "created_at": "2025-10-02T10:30:00Z",
    "metadata": {
      "key": "value"
    }
  },
  "message": "Operation completed successfully"
}
```

**Estructura del Response:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `success` | boolean | Indica si la operación fue exitosa |
| `data` | object | Objeto con los datos de respuesta |
| `data.id` | number | ID único del recurso creado/actualizado |
| `data.campo1` | string | Descripción del campo |
| `data.created_at` | string (ISO 8601) | Timestamp de creación |
| `message` | string | Mensaje descriptivo del resultado |

**Errores Posibles:**

| Error | HTTP Status | Descripción | Prevención |
|-------|-------------|-------------|------------|
| `Resource not found` | 404 | El recurso solicitado no existe | Verificar que el ID existe antes de enviar |
| `Invalid parameter` | 400 | Parámetro campo2 inválido (debe ser > 0) | Validar campo2 > 0 en frontend |
| `Unauthorized` | 401 | Token inválido o expirado | Verificar token antes de request |
| `Forbidden` | 403 | Usuario no tiene permisos | Verificar rol del usuario |

**Validaciones Recomendadas:**

1. ✅ Validar que `campo2 > 0` antes de enviar
2. ✅ Verificar que `campo1` no esté vacío
3. ⚠️ Advertir si `campo2 > 1000000` (valor inusualmente alto)

---

### 2. [Otra Acción] - [Nombre Descriptivo]

**Endpoint:** `[MÉTODO] /ruta/del/endpoint`

[Descripción breve]

**Query Parameters:**

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `filter` | string | ❌ No | Filtrar por: `value1` \| `value2` \| `value3` |
| `start_date` | string | ❌ No | Fecha inicio (YYYY-MM-DD) |
| `end_date` | string | ❌ No | Fecha fin (YYYY-MM-DD) |
| `page` | number | ❌ No | Número de página (default: 1) |
| `limit` | number | ❌ No | Items por página (default: 20, max: 100) |

**Ejemplo:**

```
GET /endpoint?filter=value1&start_date=2025-10-01&page=1&limit=50
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Item 1"
      },
      {
        "id": 2,
        "name": "Item 2"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3
    }
  }
}
```

---

## 🔄 Casos de Uso

### Caso 1: [Nombre Descriptivo del Caso]

**Escenario:** [Descripción detallada del caso de uso]

**Request:**

```json
POST /endpoint
{
  "campo1": "valor_real",
  "campo2": 123456
}
```

**Resultado:**

- ✅ Se crea recurso con ID único
- ✅ Estado cambia de `PENDING` a `ACTIVE`
- ✅ Se envía notificación al usuario
- ✅ Se registra en auditoría

**Response Esperado:**

```json
{
  "success": true,
  "data": {
    "id": 789,
    "status": "ACTIVE"
  }
}
```

---

### Caso 2: [Caso con Manejo de Error]

**Escenario:** [Descripción del caso que puede fallar]

**Request:**

```json
POST /endpoint
{
  "campo1": "valor_invalido"
}
```

**Resultado:**

- ❌ Error 400: Invalid parameter
- Error message: "campo1 must be one of: value1, value2, value3"

**Cómo Prevenir:**

1. Validar `campo1` contra lista de valores permitidos
2. Mostrar dropdown con opciones válidas
3. Deshabilitar envío si valor no es válido

---

## 🔍 Validaciones del Sistema

### Pre-Procesamiento (Validar en Frontend)

1. ✅ Campo `campo1` debe existir y no estar vacío
2. ✅ Campo `campo2` debe ser > 0
3. ✅ Si se envía `campo3`, entonces `campo4` es obligatorio
4. ✅ Formato de `email` debe ser válido
5. ⚠️ Advertir si `amount > 1000000` (monto muy alto)

### Post-Procesamiento (Backend Garantiza)

1. ✅ Registro creado en base de datos
2. ✅ Estado actualizado correctamente
3. ✅ Transacción atómica (todo o nada)
4. ✅ Triggers de auditoría ejecutados

### Reglas de Negocio Importantes

- **Regla 1**: Descripción de la regla y por qué existe
- **Regla 2**: Condiciones que deben cumplirse
- **Regla 3**: Restricciones del sistema

---

## ❌ Códigos de Error

| Error | HTTP Status | Descripción | Solución |
|-------|-------------|-------------|----------|
| `Resource not found` | 404 | El recurso no existe | Verificar ID antes de request |
| `Invalid parameter` | 400 | Parámetro inválido | Ver descripción de error específica |
| `Validation failed` | 422 | Falló validación de negocio | Revisar reglas de negocio |
| `Unauthorized` | 401 | Token inválido | Renovar token |
| `Forbidden` | 403 | Sin permisos | Verificar rol de usuario |
| `Conflict` | 409 | Recurso ya existe | Verificar duplicados |
| `Internal server error` | 500 | Error del sistema | Contactar soporte |

---

## 🎯 Recomendaciones de Implementación

### 1. Flujo de [Operación Principal]

**Antes de ejecutar:**

1. Verificar precondición X con `GET /endpoint-verificacion`
2. Validar datos en frontend según reglas documentadas
3. Preparar payload con estructura correcta

**Durante ejecución:**

1. Enviar request a `POST /endpoint`
2. Mostrar loading state
3. Manejar timeout (30 segundos)

**Después de ejecución exitosa:**

1. Actualizar UI con `data.id` del response
2. Refrescar lista de recursos
3. Mostrar mensaje de éxito
4. Limpiar formulario

**Manejo de errores:**

1. Si 404: "Recurso no encontrado"
2. Si 400: Mostrar mensaje específico del response
3. Si 500: "Error del sistema, intente más tarde"

---

### 2. Validación en Tiempo Real

**Campos a validar mientras el usuario escribe:**

- `email`: Formato válido
- `amount`: Número positivo
- `phone`: Formato según país

**Validaciones antes de enviar:**

```javascript
// Pseudocódigo ilustrativo (NO código de implementación)
if (campo1 === '' || campo2 <= 0) {
  mostrarError("Validación fallida");
  return;
}
```

**⚠️ Nota:** El ejemplo anterior es solo ilustrativo. Implementar según el framework usado.

---

### 3. Sincronización de Estado

**Después de operación exitosa:**

- Actualizar campo X en estado local
- Refrescar campo Y desde servidor
- Invalidar caché de lista Z

**Si hay conflicto:**

- Mostrar advertencia al usuario
- Ofrecer opciones: "Recargar" o "Descartar cambios"

---

## 📊 Monitoreo y Auditoría (Opcional)

### Datos Auditables

**Cada operación registra:**

- Usuario que ejecutó la acción (del token JWT)
- Timestamp exacto
- IP de origen
- Datos modificados

### Logs Importantes

**Eventos a monitorear:**

- Errores 500 (críticos)
- Intentos fallidos repetidos (posible ataque)
- Operaciones de alto valor ($X)

---

## 🔗 Recursos Adicionales

**Documentación relacionada:**

- [Otro documento relacionado](./otro-documento.md)
- [Sistema dependiente](./sistema-dependiente.md)

**Base de datos:**

- Tabla principal: `schema.table_name`
- Tablas relacionadas: `schema.related_table`

**Repositorio:**

[github.com/owner/repo](https://github.com/owner/repo)

---

## 📝 Historial de Cambios

### v1.0 - [DD de Mes de YYYY]

- ✅ Versión inicial
- ✅ Endpoints básicos implementados
- ✅ Validaciones principales

---

**Última actualización:** [DD de Mes de YYYY]  
**Versión:** 1.0  
**Estado:** [🚧 En Desarrollo | ✅ Production Ready | ⚠️ Deprecado]  
**Próxima revisión:** [DD de Mes de YYYY]

---

## 📋 Checklist de Documentación

Antes de publicar, verificar:

- [ ] Header completo con versión y fecha
- [ ] Descripción general clara
- [ ] Todos los endpoints documentados
- [ ] Request/Response con ejemplos JSON reales
- [ ] Todos los campos con tipo especificado
- [ ] Errores documentados con HTTP status
- [ ] Validaciones recomendadas
- [ ] Al menos 2 casos de uso
- [ ] Código de ejemplo mínimo (solo si es necesario)
- [ ] Referencias cruzadas actualizadas

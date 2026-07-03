# Guía de API de Dispositivos de Balanza y Formatos de Etiqueta

**Versión:** 1.0.0
**Fecha:** 19 de Junio de 2026
**Endpoint Base:** `http://localhost:5050`

---

## Descripción General

Este módulo gestiona la configuración de dispositivos de balanza (`/scales/*`) y formatos de etiqueta (`/label-formats/*`) utilizados para imprimir etiquetas de productos pesables. Complementa la guía de pesaje [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) y la guía end-to-end [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md).

### Características Principales

- ✅ CRUD completo de dispositivos de balanza
- ✅ CRUD completo de formatos de etiqueta
- ✅ Configuración de parámetros por dispositivo

---

## Permisos del Módulo

> **Nota:** A partir de la implementación RBAC por módulo (2026-05-19), todos los endpoints de este módulo están protegidos por middleware de permisos. Ver [SECURITY_FRONTEND_INTEGRATION_GUIDE.md](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) para la matriz completa de roles.

| Método HTTP | Permiso Requerido |
|-------------|-------------------|
| GET / HEAD | `products:read` |
| POST / PUT / DELETE / PATCH | `products:write` |

- Admin (`role_id = "F2VLso"`) tiene acceso total sin verificación de permisos.

---

## Headers Requeridos

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

---

## Endpoints de Balanzas (Scales)

### POST /scales
**Descripción:** Registra un nuevo dispositivo de balanza.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre descriptivo de la balanza |
| model | string | No | Modelo del dispositivo |
| serial_number | string | No | Número de serie |
| ip_address | string | No | Dirección IP |
| port | int | No | Puerto de conexión |
| location | string | No | Ubicación física |
| is_active | bool | No | Estado del dispositivo (default: true) |

### GET /scales
**Descripción:** Lista todos los dispositivos de balanza.

### GET /scales/{id}
**Descripción:** Obtiene una balanza por ID.

### PUT /scales/{id}
**Descripción:** Actualiza una balanza.

### DELETE /scales/{id}
**Descripción:** Elimina una balanza.

---

## Endpoints de Formatos de Etiqueta (Label Formats)

### POST /label-formats
**Descripción:** Crea un nuevo formato de etiqueta.

**Request Body:**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| name | string | Sí | Nombre del formato |
| width_mm | decimal | Sí | Ancho en milímetros |
| height_mm | decimal | Sí | Alto en milímetros |
| template | string | Sí | Template de la etiqueta (HTML/JSON) |
| is_default | bool | No | Si es el formato por defecto |
| is_active | bool | No | Estado del formato (default: true) |

### GET /label-formats
**Descripción:** Lista todos los formatos de etiqueta.

### GET /label-formats/{id}
**Descripción:** Obtiene un formato de etiqueta por ID.

### PUT /label-formats/{id}
**Descripción:** Actualiza un formato de etiqueta.

### DELETE /label-formats/{id}
**Descripción:** Elimina un formato de etiqueta.

---

## Relación con Otras Guías

| Guía | Contenido |
|------|-----------|
| [SCALE_API_GUIDE.md](./SCALE_API_GUIDE.md) | Pesaje de productos: `/scale/weigh-item`, `/scale/generate-label`, `/scale/catalog` |
| [BARCODE_API_GUIDE.md](./BARCODE_API_GUIDE.md) | Generación y decodificación de códigos de barra EAN-13 |
| [WEIGHABLE_PRODUCTS_GUIDE.md](./WEIGHABLE_PRODUCTS_GUIDE.md) | Flujo end-to-end de productos pesables |

---

## Códigos de Error Comunes

| HTTP Status | Descripción | Solución |
|-------------|-------------|----------|
| 400 | Datos inválidos | Verificar campos requeridos |
| 401 | Token JWT inválido | Verificar header Authorization |
| 403 | Sin permisos | Verificar rol del usuario |
| 404 | Recurso no encontrado | Verificar el ID |
| 500 | Error interno | Reportar al equipo de backend |

---

**Última actualización:** 19 de Junio de 2026
**Versión:** 1.0.0
**Estado:** ✅ Production Ready

# Índice de Guías de API para Frontend

## Descripción General

Este directorio contiene todas las guías de integración API para desarrolladores frontend. Cada guía sigue la [plantilla estandarizada](./API_DOCUMENTATION_TEMPLATE.md) y refleja el contrato actual post-migraciones Multi-Branch + Party Model.

> ℹ️ Este README se mantiene sincronizado entre los directorios `backend/docs/guides/frontend/` y `frontend/docs/guides/multibranch-implementation/`.

---

## Guías Base (Leer Primero)

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**MULTI_BRANCH_CONTEXT_GUIDE.md**](./MULTI_BRANCH_CONTEXT_GUIDE.md) | Contexto Multi-Sucursal: claims JWT, `branch_id`, `X-Branch-ID`, resolución de sucursal, errores 400/403 | ✅ Completado | 2026-04-22 |
| [**API_DOCUMENTATION_TEMPLATE.md**](./API_DOCUMENTATION_TEMPLATE.md) | Plantilla estandarizada para documentar endpoints API del frontend | ✅ Completado | 2026-05-19 |
| [**SETUP_INITIALIZATION_FRONTEND_GUIDE.md**](./SETUP_INITIALIZATION_FRONTEND_GUIDE.md) | Guía de configuración inicial y puesta en marcha del frontend | ✅ Completado | 2026-05-19 |
| [**FRONTEND_API_DOCUMENTATION_GUIDE.md**](./FRONTEND_API_DOCUMENTATION_GUIDE.md) | Guía general de documentación API: convenciones, estándares y buenas prácticas | ✅ Completado | 2026-05-19 |
| [**RBAC_MODULE_PERMISSIONS_SUMMARY.md**](./RBAC_MODULE_PERMISSIONS_SUMMARY.md) | Cheat-sheet rápido: permisos requeridos por cada guía de módulo (`resource:read`/`resource:write`) | ✅ Completado | 2026-05-19 |
| [**FRONTEND_RBAC_GUIDE.md**](./FRONTEND_RBAC_GUIDE.md) | Guía de roles y permisos: cómo encontrar permisos en cada API guide, matriz roles→permisos, reglas para UI | ✅ Completado | 2026-05-29 |
| [**API_UPDATES_2026_01_23.md**](./API_UPDATES_2026_01_23.md) | Registro de cambios y actualizaciones de la API al 23 de enero 2026 | ✅ Completado | 2026-01-23 |

---

## Guías por Módulo

### Autenticación y Seguridad

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**USER_API_GUIDE.md**](./USER_API_GUIDE.md) | CRUD de usuarios `/api/v1/users` (crear, listar, actualizar, eliminar, cambiar estado, roles, contraseña) | ✅ Completado | 2026-05-08 |
| [**USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md**](./USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md) | Login, JWT, claims `allowed_branches`/`active_branch`, refresh tokens | ✅ Completado | 2026-04-22 |
| [**SECURITY_FRONTEND_INTEGRATION_GUIDE.md**](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) | RBAC por módulo: 6 roles, 35 permisos `resource:action`, matriz rol×permiso, 403/405, rutas públicas | ✅ Completado | 2026-05-19 |
| [**ROLES_PERMISSIONS_API_GUIDE.md**](./ROLES_PERMISSIONS_API_GUIDE.md) | CRUD de roles `/api/v1/roles`, asignación de permisos, listado de permisos disponibles | ✅ Completado | 2026-06-19 |
| [**SESSION_MANAGEMENT_API_GUIDE.md**](./SESSION_MANAGEMENT_API_GUIDE.md) | Gestión de sesiones: activas, historial, revocación, `/sessions/*`, `/admin/sessions/*` | ✅ Completado | 2026-06-19 |

### Clientes y Proveedores (Party Model) — API Unificada

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**PARTY_API_GUIDE.md**](./PARTY_API_GUIDE.md) | API unificada `/api/v1/parties` (clientes, proveedores, CLIENT_SUPPLIER, cambio de tipo) + endpoints alias `/api/v1/clients`, `/api/v1/suppliers` | ✅ Completado | 2026-05-08 |
| [CLIENT_API_GUIDE.md](./CLIENT_API_GUIDE.md) | ⚠️ Deprecado — CRUD clientes legacy `/client/*` | 🔴 Archivado | 2026-04-22 |
| [SUPPLIER_API_GUIDE.md](./SUPPLIER_API_GUIDE.md) | ⚠️ Deprecado — CRUD proveedores legacy `/supplier/*` | 🔴 Archivado | 2026-04-22 |

### Ventas

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**SALES_API_GUIDE.md**](./SALES_API_GUIDE.md) | 16 endpoints de ventas, branch context, modelos `Sale`/`SaleDetailRiched`, IVA y descuentos | ✅ Completado | 2026-04-22 |
| [**SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md**](./SALES_ADD_PRODUCTS_EXISTING_SALE_CONTRACT.md) | Contrato funcional para agregar productos a venta existente | 🟢 Probablemente inmune | - |

### Compras y Requisiciones

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**PURCHASE_ORDERS_API_GUIDE.md**](./PURCHASE_ORDERS_API_GUIDE.md) | API completa de órdenes de compra: CRUD, pagos, cancelación, branch_id, estructuras de respuesta | ✅ Completado | 2026-05-07 |
| [**PURCHASE_REQUISITION_API_GUIDE.md**](./PURCHASE_REQUISITION_API_GUIDE.md) | Requisiciones de compra, `supplier_id: string`, branch context | ✅ Completado | 2026-04-22 |
| [**PURCHASE_PRICING_INTEGRATION_GUIDE.md**](./PURCHASE_PRICING_INTEGRATION_GUIDE.md) | Integracion compras-pricing, register_cost_transaction, IVA, branch_id | ✅ Actualizado | 2026-05-23 |

### Presupuestos

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**BUDGET_API_GUIDE.md**](./BUDGET_API_GUIDE.md) | Presupuestos/cotizaciones, branch context, conversión a venta | ✅ Completado | 2026-04-22 |

### Productos

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**PRODUCT_API_GUIDE.md**](./PRODUCT_API_GUIDE.md) | Gestión de productos, lectura enriquecida, branch context, productos de medida variable | ✅ Actualizado | 2026-06-16 |
| [**VARIANT_API_GUIDE.md**](./VARIANT_API_GUIDE.md) | FASE 3: Variantes de producto (SKUs), stock/precio independiente, integración ventas/compras | ✅ Completado | 2026-06-20 |
| [**VARIANT_TAG_USAGE_GUIDE.md**](./VARIANT_TAG_USAGE_GUIDE.md) | Guía práctica: flujos completos de variantes, tags y atributos para frontend (creación, UI selectores, barcode, búsqueda) | ✅ Completado | 2026-06-20 |
| [**UNIT_CONVERSIONS_API_GUIDE.md**](./UNIT_CONVERSIONS_API_GUIDE.md) | CRUD de conversiones de unidad `/unit-conversions`, factores de conversión, unidades soportadas | ✅ Completado | 2026-05-26 |
| [**CATEGORY_IVA_API_GUIDE.md**](./CATEGORY_IVA_API_GUIDE.md) | Categorías e IVA, rutas verificadas | ✅ Completado | 2026-04-22 |
| [**PRODUCT_DISCOUNTS_GUIDE.md**](./PRODUCT_DISCOUNTS_GUIDE.md) | Descuentos por producto, configuración y aplicación en transacciones | ✅ Completado | 2026-05-19 |
| [**BRAND_ATTRIBUTE_TAG_API_GUIDE.md**](./BRAND_ATTRIBUTE_TAG_API_GUIDE.md) | FASE 1/2/4/5: Marcas normalizadas, atributos dinámicos (EAV), etiquetas, búsqueda avanzada, herencia | ✅ Completado | 2026-06-16 |
| [**BARCODE_API_GUIDE.md**](./BARCODE_API_GUIDE.md) | Sistema de códigos de barra EAN-13, decodificación, generación de barcodes variables | ✅ Completado | 2026-05-27 |
| [**PRODUCT_UNIT_FLOWS_GUIDE.md**](./PRODUCT_UNIT_FLOWS_GUIDE.md) | Flujos operativos end-to-end: productos con múltiples unidades de medida (creación → precio → compra → venta) | ✅ Completado | 2026-06-09 |
| [**WEIGHABLE_PRODUCTS_GUIDE.md**](./WEIGHABLE_PRODUCTS_GUIDE.md) | Guía end-to-end de productos pesables: registro, balanza, etiqueta EAN-13, escaneo en POS | ✅ Completado | 2026-06-05 |

### Manufactura

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**MANUFACTURING_API_GUIDE.md**](./MANUFACTURING_API_GUIDE.md) | Manufactura e insumos: supplies, recetas, lotes de producción, reportes | ✅ Completado | 2026-06-19 |

### Auditoría

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**AUDIT_API_GUIDE.md**](./AUDIT_API_GUIDE.md) | Sistema de auditoría `/api/v1/audit/*`: logs, resumen, tendencias, historial por entidad, exportación | ✅ Completado | 2026-06-19 |

### Básculas y Pesaje

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**SCALES_DEVICES_API_GUIDE.md**](./SCALES_DEVICES_API_GUIDE.md) | CRUD de dispositivos de balanza `/scales/*` y formatos de etiqueta `/label-formats/*` | ✅ Completado | 2026-06-19 |
| [**SCALE_API_GUIDE.md**](./SCALE_API_GUIDE.md) | Pesaje e integración con balanzas: `/scale/weigh-item`, `/scale/generate-label`, `/scale/catalog` | ✅ Completado | 2026-05-27 |

### Inventario y Ajustes

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md**](./INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md) | Ajustes de inventario y stock, branch context (falta sección) | 🔄 En verificación | 2026-04-22 |
| [**STOCK_TRANSACTIONS_API_GUIDE.md**](./STOCK_TRANSACTIONS_API_GUIDE.md) | Transacciones de stock `/stock-transactions/*`: historial, validación de consistencia, reportes | ✅ Completado | 2026-06-19 |

### Costos y Precios

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**COST_PRICING_API_GUIDE.md**](./COST_PRICING_API_GUIDE.md) | Costos y precios, `unit_costs` estado actual (1 fila/producto+unidad), historial en `price_transactions`, BI branch context | ✅ Actualizado | 2026-05-25 |
| [**MANUAL_PRICE_ADJUSTMENTS_API_GUIDE.md**](./MANUAL_PRICE_ADJUSTMENTS_API_GUIDE.md) | Ajustes manuales de precio, falta branch context | 🔄 En verificación | 2026-04-22 |
| [**PRICE_TRANSACTIONS_API_GUIDE.md**](./PRICE_TRANSACTIONS_API_GUIDE.md) | Transacciones de precio, tipos, reportes de variación | ✅ Actualizado | 2026-05-23 |
| [**COST_TRANSACTIONS_API_GUIDE.md**](./COST_TRANSACTIONS_API_GUIDE.md) | Transacciones de costo `/cost-transactions/*`: historial de costos, ajustes manuales, auditoría | ✅ Completado | 2026-06-19 |

### Reservas y Horarios

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**RESERVATION_SCHEDULE_FRONTEND_GUIDE.md**](./RESERVATION_SCHEDULE_FRONTEND_GUIDE.md) | Reservas y horarios, falta branch context | 🔄 En verificación | 2026-04-22 |

### Cajas Registradoras

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**CASH_REGISTER_API_GUIDE.md**](./CASH_REGISTER_API_GUIDE.md) | Cajas registradoras, apertura/cierre, movimientos, pagos, branch context | ✅ Completado | 2026-04-22 |

### Pagos y Monedas

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**PAYMENT_METHOD_CURRENCY_CASH_API_GUIDE.md**](./PAYMENT_METHOD_CURRENCY_CASH_API_GUIDE.md) | Métodos de pago, monedas, tipos de cambio, rutas verificadas | ✅ Completado | 2026-04-22 |

### Multi-Sucursal

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**BRANCH_API_GUIDE.md**](./BRANCH_API_GUIDE.md) | CRUD sucursales, config fiscal, accesos por usuario | ✅ Completado | 2026-04-22 |
| [**BRANCH_TRANSFER_API_GUIDE.md**](./BRANCH_TRANSFER_API_GUIDE.md) | Transferencias entre sucursales, workflow de 7 estados | ✅ Completado | 2026-04-22 |

### Fiscal y Clasificación

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**TAX_CLASSIFICATION_API_GUIDE.md**](./TAX_CLASSIFICATION_API_GUIDE.md) | Jerarquía IVA (6 niveles), códigos SIFEN, asignación a productos | ✅ Completado | 2026-04-22 |

### Business Intelligence (BI)

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**BI_API_GUIDE.md**](./BI_API_GUIDE.md) | Dashboard, cobranzas, pagos, reportes financieros, analytics, reglas BI branch context, RBAC | ✅ Completado | 2026-04-22 |
| [**FORECAST_API_GUIDE.md**](./FORECAST_API_GUIDE.md) | Pronósticos `/api/v1/forecast/*`: ventas, inventario, demanda, ingresos, dashboard | ✅ Completado | 2026-06-19 |

---

## Checklist para Nuevos Documentos

Al crear o actualizar un documento en este directorio, verificar:

### Consistencia Cross-Documento
- [ ] Base URL: `http://localhost:5050`
- [ ] Autenticacion: `Authorization: Bearer <jwt_token>`
- [ ] Headers requeridos: `Content-Type: application/json` + `Authorization`
- [ ] Contexto de Sucursal: query param > header > JWT `active_branch` > `allowed_branches`
- [ ] Formato de fechas: ISO 8601 en payloads, `YYYY-MM-DD` en query params
- [ ] Respuesta estandar: `{ success, data?, message?, error?, pagination? }`
- [ ] Paginacion: `{ page, page_size, total_items, total_pages, has_next, has_prev }`

### Endpoints
- [ ] Cada endpoint documentado existe en `routes/routes.go` del backend
- [ ] Metodo HTTP correcto (GET/POST/PUT/DELETE)
- [ ] Path correcto (incluyendo prefijos como `/products/`, `/sale/`, etc.)
- [ ] Parametros de query documentados
- [ ] Request body documentado con tipos correctos
- [ ] Response documentada con tipos correctos
- [ ] Codigos de error documentados (400/401/403/404/409/500)

### Modelos de Datos
- [ ] Cada campo documentado existe en `models/*.go` del backend
- [ ] Tipos coinciden (`string` vs `int`, `float` vs `decimal`, `boolean` vs `bool`)
- [ ] JSON tags coinciden con los nombres de campo documentados
- [ ] Campos nullable usan punteros (`*string`, `*int`, `*float64`)

### Branch Context
- [ ] Si el endpoint usa `resolveBranchContextFromAuth` → documentar como "Contexto de Sucursal" (transaccional)
- [ ] Si el endpoint usa `resolveBIContextFromAuth` → documentar como "Contexto de Sucursal (BI)" con reglas especificas
- [ ] Los endpoints de BI deben mencionar: ADMIN sin branch = global, non-ADMIN sin branch = 400

### Reglas de Negocio
- [ ] Estados y transiciones documentados coinciden con `models/*.go` o `services/*.go`
- [ ] Workflows documentan permisos por rol donde aplica
- [ ] Jerarquias (IVA, resolucion de sucursal) documentadas en orden correcto
- [ ] Rate limits documentados coinciden con `config/rate_limit.go`
- [x] Permisos de módulo documentados: `resource:read` y `resource:write` — Ver `FRONTEND_RBAC_GUIDE.md` y `RBAC_MODULE_PERMISSIONS_SUMMARY.md`
- [ ] Toda guía de módulo tiene sección `## Permisos del Módulo` estandarizada (ver `API_DOCUMENTATION_TEMPLATE.md`)

### Party Model
- [ ] `client_id` es `string`
- [ ] `supplier_id` es `string`
- [ ] `party_id` esta presente en modelos Client y Supplier

### Formato
- [ ] Fecha de ultima actualizacion al final del documento
- [ ] Sin codigo JS/TS/curl (solo tablas de referencia)

---

## Convenciones de Estado

| Icono | Estado | Significado |
|-------|--------|-------------|
| ✅ | Completado | Guía verificada y actualizada al contrato actual |
| 🔄 | En verificación | Verificada contra código, requiere ajustes menores |
| 📝 | En corrección | Correcciones en progreso |
| ⏳ | Pendiente | Aún no verificada |
| 🔴 | Archivado | Guía obsoleta, movida a `docs/archive/` |

---

## Próximos Pasos

1. **Prioridad 1:** Completar correcciones de guías en verificación (PRODUCT, INVENTORY, COST_PRICING, MANUAL_PRICE_ADJUSTMENTS, PRICE_TRANSACTIONS, RESERVATION)
2. ~~**Prioridad 2:** Agregar sección "Permisos Requeridos" en cada guía por módulo~~ ✅ Completado — Ver `FRONTEND_RBAC_GUIDE.md` para referencia de roles y `RBAC_MODULE_PERMISSIONS_SUMMARY.md` para resumen de permisos
3. ~~**Prioridad 2 (nueva):** Actualizar `BARCODE_API_GUIDE.md` y `SCALE_API_GUIDE.md` con el formato completo de permisos~~ ✅ Completado — Ver `RBAC_MODULE_PERMISSIONS_SUMMARY.md`
4. ~~**Prioridad 3:** Verificar guías restantes no listadas en este índice~~ ✅ Completado
5. **Prioridad 3:** Actualizar ejemplos de respuesta 403 en guías que usan endpoints protegidos por módulo

---

**Última actualización del índice**: 2026-06-20
**Total de guías documentadas**: 47
**Guías completadas**: 37
**Guías deprecadas**: 2

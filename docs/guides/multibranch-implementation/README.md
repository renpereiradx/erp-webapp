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
| [**API_UPDATES_2026_01_23.md**](./API_UPDATES_2026_01_23.md) | Registro de cambios y actualizaciones de la API al 23 de enero 2026 | ✅ Completado | 2026-01-23 |

---

## Guías por Módulo

### Autenticación y Seguridad

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**USER_API_GUIDE.md**](./USER_API_GUIDE.md) | CRUD de usuarios `/api/v1/users` (crear, listar, actualizar, eliminar, cambiar estado, roles, contraseña) | ✅ Completado | 2026-05-08 |
| [**USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md**](./USER_SESSION_FRONTEND_INTEGRATION_GUIDE.md) | Login, JWT, claims `allowed_branches`/`active_branch`, refresh tokens | ✅ Completado | 2026-04-22 |
| [**SECURITY_FRONTEND_INTEGRATION_GUIDE.md**](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md) | RBAC, rate limiting, auditoría, branch context (parcial — requiere rewrite completo) | 📝 En corrección | 2026-04-22 |

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
| [**PURCHASE_PRICING_INTEGRATION_GUIDE.md**](./PURCHASE_PRICING_INTEGRATION_GUIDE.md) | Integración compras-pricing, cálculo de precio de venta, IVA, branch_id, payment_method/currency reales | ✅ Completado | 2026-05-07 |

### Presupuestos

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**BUDGET_API_GUIDE.md**](./BUDGET_API_GUIDE.md) | Presupuestos/cotizaciones, branch context, conversión a venta | ✅ Completado | 2026-04-22 |

### Productos

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**PRODUCT_API_GUIDE.md**](./PRODUCT_API_GUIDE.md) | Gestión de productos, lectura enriquecida, branch context (falta sección) | 🔄 En verificación | 2026-04-22 |
| [**CATEGORY_IVA_API_GUIDE.md**](./CATEGORY_IVA_API_GUIDE.md) | Categorías e IVA, rutas verificadas | ✅ Completado | 2026-04-22 |
| [**PRODUCT_DISCOUNTS_GUIDE.md**](./PRODUCT_DISCOUNTS_GUIDE.md) | Descuentos por producto, configuración y aplicación en transacciones | ✅ Completado | 2026-05-19 |

### Inventario y Ajustes

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md**](./INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE.md) | Ajustes de inventario, branch context (falta sección) | 🔄 En verificación | 2026-04-22 |

### Costos y Precios

| Guía | Descripción | Estado | Última Actualización |
|------|-------------|--------|---------------------|
| [**COST_PRICING_API_GUIDE.md**](./COST_PRICING_API_GUIDE.md) | Costos y precios, `supplier_id: *string`, BI branch context, guía en inglés con JS | 🔄 En verificación | 2026-04-22 |
| [**MANUAL_PRICE_ADJUSTMENTS_API_GUIDE.md**](./MANUAL_PRICE_ADJUSTMENTS_API_GUIDE.md) | Ajustes manuales de precio, falta branch context | 🔄 En verificación | 2026-04-22 |
| [**PRICE_TRANSACTIONS_API_GUIDE.md**](./PRICE_TRANSACTIONS_API_GUIDE.md) | Transacciones de precio, falta branch context | 🔄 En verificación | 2026-04-22 |

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
2. **Prioridad 2:** Rewrite completo de SECURITY_FRONTEND_INTEGRATION_GUIDE.md (eliminar código JS/TS, estandarizar a plantilla)
3. **Prioridad 3:** Agregar ejemplos de uso y casos prácticos en las guías base recién añadidas
4. **Prioridad 4:** Verificar guías restantes no listadas en este índice

---

**Última actualización del índice**: 2026-05-19
**Total de guías documentadas**: 31
**Guías completadas**: 22
**Guías deprecadas**: 2

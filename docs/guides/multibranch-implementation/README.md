# Documentacion Multibranch Implementation — Checklist de Validacion Cruzada

> **Ultima verificacion**: 2026-05-06 (completada)
> **Plan de verificacion**: `conductor/FRONTEND_DOCUMENTATION_VERIFICATION_PLAN.md`

## Documentos (19)

| # | Archivo | Criticidad | Ultima verificacion | Estado |
|---|---|---|---|---|
| 1 | `BI_API.md` | P0 | 2026-05-06 | ✅ |
| 2 | `MULTI_BRANCH_CONTEXT_GUIDE.md` | P0 | 2026-05-06 | ✅ |
| 3 | `BRANCH_API.md` | P0 | 2026-05-06 | ✅ |
| 4 | `USER-SESION_API.md` | P0 | 2026-05-06 | ✅ |
| 5 | `SECURITY_FRONTEND_INTEGRATION.md` | P0 | 2026-05-06 | ✅ |
| 6 | `PRODUCT_API.md` | P1 | 2026-05-06 | ✅ |
| 7 | `CASH_REGISTER_API.md` | P1 | 2026-05-06 | ✅ |
| 8 | `BUDGET_API.md` | P1 | 2026-05-06 | ✅ |
| 9 | `PURCHASE_REQUISITION.md` | P1 | 2026-05-06 | ✅ |
| 10 | `BRANCH_TRANSFER_API.md` | P1 | 2026-05-06 | ✅ |
| 11 | `RESERVATION_SCHEDULE_API.md` | P1 | 2026-05-06 | ✅ |
| 12 | `TAX_CLASIFICATION_API.md` | P2 | 2026-05-06 | ✅ |
| 13 | `COST_PRICING_API.md` | P2 | 2026-05-06 | ✅ |
| 14 | `PRICE_TRANSACTION_API.md` | P2 | 2026-05-06 | ✅ |
| 15 | `MANUAL_PRICE_ADJUSTMENT_API.md` | P2 | 2026-05-06 | ✅ |
| 16 | `INVENTORY_ADJUSTMENTS_PRICE_API.md` | P2 | 2026-05-06 | ✅ |
| 17 | `PURCHASE_PRICING_INTREGATION_API.md` | P2 | 2026-05-06 | ✅ |
| 18 | `CLIENT_API.md` | P2 | 2026-05-06 | ✅ |
| 19 | `SUPPLIER_API.md` | P2 | 2026-05-06 | ✅ |

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

## Referencias

- `conductor/FRONTEND_DOCUMENTATION_VERIFICATION_PLAN.md` — Plan maestro
- `conductor/FRONTEND_DOCUMENTATION_VERIFICATION_STATUS.md` — Estado de verificacion
- `conductor/FRONTEND_DOC_VERIFICATION_REPORT.md` — Reporte final
- `conductor/FRONTEND_DOCUMENTATION_CORRECTION_PLAN.md` — Plan de correccion (docs/guides/frontend/)

---

_Actualizado: 2026-05-06 — Verificacion completada._

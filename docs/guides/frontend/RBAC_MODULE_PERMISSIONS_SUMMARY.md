# Resumen: Permisos RBAC por Módulo de API

**Fecha:** 2026-05-19  
**Versión:** 1.0  
**Propósito:** Cheat-sheet rápida para el equipo frontend. Indica, por cada guía de módulo, qué permisos `resource:action` requiere el backend.

> ℹ️ Para la matriz completa Rol × Permiso y reglas del middleware, ver [`SECURITY_FRONTEND_INTEGRATION_GUIDE.md`](./SECURITY_FRONTEND_INTEGRATION_GUIDE.md).

---

## Productos y Precios

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **PRODUCT_API_GUIDE** | `products:read` | `products:write` |
| **CATEGORY_IVA_API_GUIDE** | `products:read` | `products:write` |
| **COST_PRICING_API_GUIDE** | `products:read` | `products:write` |
| **MANUAL_PRICE_ADJUSTMENTS_API_GUIDE** | `products:read` | `products:write` |
| **PRICE_TRANSACTIONS_API_GUIDE** | `products:read` | `products:write` |
| **PRODUCT_DISCOUNTS_GUIDE** | `products:read` | `products:write` |

## Inventario y Stock

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **INVENTORY_ADJUSTMENTS_PRICE_API_GUIDE** | `inventory:read` | `inventory:write` |

## Ventas

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **SALES_API_GUIDE** | `sales:read` | `sales:write` |

## Compras

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **PURCHASE_ORDERS_API_GUIDE** | `purchases:read` | `purchases:write` |
| **PURCHASE_REQUISITION_API_GUIDE** | `purchases:read` | `purchases:write` |
| **PURCHASE_PRICING_INTEGRATION_GUIDE** | `purchases:read` | `purchases:write` |

## Clientes y Proveedores (Party Model)

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **PARTY_API_GUIDE** | `parties:read` | `parties:write` |

## Business Intelligence (Solo Lectura)

| Guía | Lectura (GET/HEAD) | Escritura |
|------|-------------------|---------|
| **BI_API_GUIDE** | `analytics:read` | — (solo lectura) |

> El módulo BI agrupa dashboard, receivables, payables, financial-reports, sales-analytics, inventory-analytics, profitability y forecast. Todos son de solo lectura.

## Cajas Registradoras

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **CASH_REGISTER_API_GUIDE** | `cash:read` | `cash:write` |

## Pagos, Monedas y Tipos de Cambio

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **PAYMENT_METHOD_CURRENCY_CASH_API_GUIDE** | `payments:read` | `payments:write` |

## Reservas y Horarios

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **RESERVATION_SCHEDULE_FRONTEND_GUIDE** | `reserves:read` + `schedules:read` | `reserves:write` + `schedules:write` |

## Presupuestos / Cotizaciones

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **BUDGET_API_GUIDE** | `budgets:read` | `budgets:write` |

## Transferencias entre Sucursales

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **BRANCH_TRANSFER_API_GUIDE** | `transfers:read` | `transfers:write` |

## Sucursales

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **BRANCH_API_GUIDE** | `branches:read` | `branches:write` |

## Manufactura e Insumos

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **MANUFACTURING_API_GUIDE**¹ | `manufacturing:read` | `manufacturing:write` |

¹ No existe guía dedicada a manufacturing en `docs/guides/frontend/`; los endpoints están bajo `/manufacturing` en el backend.

## Fiscal y Clasificación de Impuestos

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **TAX_CLASSIFICATION_API_GUIDE** | `tax:read` | `tax:write` |

## Administración de Usuarios

| Guía | Lectura (GET/HEAD) | Escritura (POST/PUT/DELETE/PATCH) |
|------|-------------------|-----------------------------------|
| **USER_API_GUIDE** | `users:read` | `users:write` |

---

## Reglas Globales para el Frontend

1. **Admin bypass:** El rol `ADMIN` (`role_id = "F2VLso"`) nunca es bloqueado por el middleware de módulo.
2. **Sin permiso de lectura:** El backend responde `403 Forbidden`.
3. **Módulo de solo lectura + intento de escritura:** El backend responde `405 Method Not Allowed`.
4. **Fuente de verdad:** El frontend puede usar los permisos para ocultar/mostrar UI, pero el backend siempre valida.
5. **Obtener permisos del usuario:** `GET /api/v1/users/me` retorna el array `permissions` con todos los permisos asignados al usuario autenticado.

---

_Última actualización: 2026-05-19_

# Sales Analytics — Descuentos (`/sales-analytics/discounts`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **ÚNICA ruta del grupo CON guard** (`PermissionGuard reports:read` ✅) · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/Discounts.tsx` ✅ (la única .tsx del grupo; patrón FSD/zod esperable)

## 1. Screenshot

- `../screenshots/sales-analytics/discounts-admin.png` — resumen + líneas con datos reales.

## 2. Trazabilidad card → endpoint

`getDiscounts({start_date, end_date})` + `getDiscountsSummary` → `GET /sales-analytics/discounts` (gate reports:read T18; el page envía fechas default 08/17-09/16 ✅ — evita el 400 "sin fechas" del smoke T14):

| Sección | Runtime |
|:--|:--|
| Resumen por vendedor: ADMINISTRADOR ADMINISTRADOR — 3 descuentos, Gs. 9.310 | ✅ real |
| Líneas con descuento (3 filas): venta, cant., precio original/final, descuento, aplicado por, motivo | ✅ mayormente real — SALE-…771: 70.000→66.780, desc. 3.220 ✅ cuadra con la actividad reciente |
| **Fila incoherente**: SALE-…964 "Gs. 100.000 → Gs. 105.690, Descuento Gs. 5.690" | ❌ precio FINAL mayor al ORIGINAL con descuento positivo — o el "precio original" es de otra base (unit×cant vs total) o el descuento se calculó sobre un monto distinto; verificar contrato |
| Tabs Por vendedor / Por aplicador / Por sucursal | ✅ cableados (agrupaciones del endpoint summary) |

## 3. Comprensión de usuario

- Clara y accionable ("quién descontó cuánto"). La fila incoherente 100.000→105.690 llama la atención y siembra duda sobre el resto.

## 4. Afordancias probadas (runtime)

- Fechas + "Aplicar" ✅. Tabs ✅. Sin Exportar (bien — no hay affordancia muerta).

## 5. Hardcode scan

- Limpio — sin mocks detectados. 🟢

## 6. Tabla

- Líneas: LIMIT del endpoint (T9: `metadata.total_count` disponible) — la UI muestra 3 filas hoy; el total_count debería mostrarse cuando crezca.

## 7. Redirecciones

- Sin links.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; error honesto (no observado — API sana).

## 9. DESIGN.md §10

- Tabla limpia con motivo semántico (🔻). ✅

## 10. AGENTS.md

- `.tsx` ✅ (el estándar a seguir por el resto del grupo); zod/validación presente.

## Veredicto

**PASS condicional** — Página funcional con datos reales y guard correcto (la mejor práctica del grupo). Deuda: incoherencia en 1 fila (original/final/descuento) y total_count sin mostrar.

**Fixes (FASE 3, P2)**: reconciliar original/final/descuento de la línea (mapear campos correctos del payload o corregir backend) · mostrar `metadata.total_count` · usarla como plantilla al migrar las 5 páginas .jsx restantes del grupo.

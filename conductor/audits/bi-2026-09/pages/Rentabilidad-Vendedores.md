# Rentabilidad — Vendedores (`/profitability/sellers`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · Gated `analytics:read` ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/SellerProfitability.jsx`

## 1. Screenshot

- `../screenshots/profitability/sellers-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/sellers` (Performance; fan-out `total_sales` por LEFT JOIN details detectado en T15 como hallazgo BE — backlog):

| Sección | Runtime |
|:--|:--|
| Promedio Beneficio 154.980 / Top Vendedor ADMINISTRADOR Gs. 200.660 | 🟡 reales del endpoint pero **impactados por el fan-out T15** (inflación por líneas de venta — verificado: 441.260 de ingresos del vendedor vs 551.760 totales con 8 ventas; el número de transacciones 7+1 también sugiere división de ventas) |
| **Margen Operativo Promedio 0% / "OBJETIVO CORPORATIVO: 0%"** | ❌ placeholders |
| Ranking (Transacciones/Ingresos/Beneficio/Margen %) | ✅ estructura real, auditado |

## 3-10

- Búsqueda ✅. Exportar decorativo 🟡. 2 filas. `.jsx`.

## Veredicto

**FAIL (P1)** — Ranking real pero con números inflados por el fan-out T15 (BE) y objetivos 0% placeholder (FE). Requiere fix BE (backlog T15) + mapeo FE.

**Fixes (FASE 3 + BE backlog)**: corregir fan-out de `total_sales` en Performance (BE) · objetivo corporativo real o fuera · promedio/margen recalculados post-fix.

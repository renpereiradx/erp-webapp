# Rentabilidad — Clientes (`/profitability/customers`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · Gated `analytics:read` ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/CustomerProfitability.jsx`

## 1. Screenshot

- `../screenshots/profitability/customers-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/customers`:

| Sección | Runtime |
|:--|:--|
| Clientes Activos 4 / Ticket Promedio 77.490 | ✅ reales |
| **Contribución Pareto: 0%** | ❌ placeholder — con 4 clientes el cálculo es trivial pero 0% literal no aporta |
| Tabla cartera (Oscar PLATINUM 4 compras 249.370 52,16%…) | ✅ real, segmentación Pareto correcta |

## 3-10

- Página funcional con 4 filas. Búsqueda ✅. Exportar decorativo 🟡. `.jsx`.

## Veredicto

**PASS condicional** — Real y bien presentada. Deuda: Pareto 0% placeholder, Exportar.

**Fixes (FASE 3, P2)**: calcular Pareto real (suma top-20%) o n/d · Exportar.

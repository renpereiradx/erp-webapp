# Rentabilidad — Categorías (`/profitability/categories`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · Gated `analytics:read` ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/CategoryProfitability.jsx`

## 1. Screenshot

- `../screenshots/profitability/categories-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/categories`:

| Sección | Runtime |
|:--|:--|
| **KPI "Líder en Beneficio: Alquiler de Canchas — Gs. NaN"** | ❌ **NaN renderizado** (división/campo ausente en el mapping) |
| Margen Crítico: Bebidas 5,2% | ✅ real |
| Rendimiento de Portafolio: 309.960 | 🟡 consistente con el módulo (misma política de costo que el dashboard de rentabilidad; difiere del summary global) |
| Matriz por familia (6 filas: SKUs, volumen, contribución, ingresos, margen) | ✅ real |
| Períodos Mes/Trim./Año | ✅ cableados |

## 3-10

- Búsqueda ✅. Exportar decorativo 🟡. 6 filas ✅. `.jsx`.

## Veredicto

**FAIL (P1)** — El NaN en un KPI principal descalifica la página ante un auditor, aunque el resto es real.

**Fixes (FASE 3)**: NaN ← mapear el campo correcto del líder (o n/d si el beneficio es 0/NULL) · revisar el resto de KPIs del mismo bloque.

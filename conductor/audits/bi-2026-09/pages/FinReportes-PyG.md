# FinReportes — Estado de Resultados PyG (`/finance/profit-and-loss`)

**Fecha**: 2026-09-16 · FASE 2H · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/ProfitAndLoss.jsx` → `getIncomeStatement` (BC-5 corregido en T4: compras CANCELLED excluidas)

## 1. Screenshot

- `../screenshots/finance/profit-and-loss-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Ingresos 551.760 / Utilidad Bruta, Operativa y Neta 309.960 | 🟡 reales del módulo; **"Utilidad Operativa = Neta = Bruta"** — sin líneas de gastos operativos desglosadas (los 241.800 de gastos del Resumen no aparecen aquí) → PyG incompleto como estado contable |
| Tabla Cálculo de Utilidad Bruta (Ventas Brutas 551.760, Devoluciones (0), Ventas Netas) | ✅ real; columnas "Periodo Ant." en "-" (comparador sin datos) |
| "Exportar PDF" | 🟡 sin verificar efecto |

## 3-10

- Toggle "Mes Actual" ✅. `.jsx`. Coherente con la política de costo del módulo financiero (misma discrepancia vs summary global ya documentada).

## Veredicto

**PASS condicional** — Datos reales (post-BC-5); como PyG le faltan las líneas de gastos operativos y el comparativo del período anterior.

**Fixes (FASE 3, P2)**: sumar líneas de gastos (241.800) para utilidad operativa/neta real · poblar comparativo · Exportar PDF o fuera.

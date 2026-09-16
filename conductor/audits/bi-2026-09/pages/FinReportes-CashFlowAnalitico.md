# FinReportes — Flujo de Efectivo Analítico (`/finance/analytical-cash-flow`)

**Fecha**: 2026-09-16 · FASE 2H · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/CashFlowAnalysisDashboard.jsx` → `financialReportsService.getCashFlow` (o similar) — badge "Fuente: API" honesto ✅

## 1. Screenshot

- `../screenshots/finance/analytical-cash-flow-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Saldo Inicial Gs. 386.360 | ✅ real (= cash_registers del summary) |
| Entradas Totales +Gs. 551.760 | ✅ real (ventas del período) |
| Salidas Totales Gs. -261.500 | ✅ real (compras+gastos; signo negativo en KPI = presentación) |
| **Saldo Final Gs. 124.860** | ❌ **incoherente**: inicial − salidas = 124.860 ignora las entradas (386.360+551.760−261.500 = 676.620). Si "entradas" son ventas-a-cobrar (no yet cobradas), el KPI está mal etiquetado; si son cobradas, el saldo está mal calculado |
| Gráfico diario entradas/salidas/saldo | ✅ con datos reales |

## 3-10

- Períodos Hoy/Semana/Mes/Año ✅. "Exportar" 🟡 sin verificar efecto. `.jsx`.

## Veredicto

**PASS condicional** — Datos reales con badge honesto; incoherencia de aritmética del saldo final (aclarar definición o corregir cálculo).

**Fixes (FASE 3, P2)**: reconciliar Saldo Final = Inicial + Entradas − Salidas (o relabel: "Caja al cierre" vs "Flujo del período") · formatear salidas sin signo negativo duplicado.

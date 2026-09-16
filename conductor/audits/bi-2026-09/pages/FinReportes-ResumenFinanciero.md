# FinReportes — Resumen Financiero (`/dashboard/financial-summary`)

**Fecha**: 2026-09-16 · FASE 2H · Rol: admin consolidado · Gated `DashboardRoute` (dashboard:read) · Modo API, BE FASE 1.

**Archivo**: `src/pages/FinancialSummaryDashboard.jsx` → `useFinancialReports` / health-score.

## 1. Screenshot

- `../screenshots/finance/financial-summary-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Ingresos 551.760 / Gastos 241.800 / Utilidad 309.960 | ✅ reales (política de costo del módulo financiero — ver ficha Rentabilidad-Dashboard) |
| **"Posición de Caja: $1.2M"** | ❌ **FABRICADO** — es el monto del mock `bankPositions` (Santander $1.2M); la caja real es Gs. 386.360 |
| **"Pronóstico de Trimestre: utilidad neta estimada de $742k, 14% superior" + "Powered by Predictive BI" + "Generar Proyección"** | ❌ **fabricado** (dólares + número sin fuente) |
| Salud Financiera 84 "Excelente" + Recomendación BI (texto genérico) | 🟡 el BE tiene HealthScore tipado (T19); el texto de recomendación es plantilla |
| Ratios Current 2.45 / Quick 1.82 / Margen 42,5% (Obj 45%) | 🟡 verificar si vienen del HealthScore API o son literales — el margen no coincide con ningún módulo |
| "Sincronizado BI: Hace 4m" | ❌ badge falso |

## 3-4. Usuario y afordancias

- La mezcla es peligrosa en la página más "ejecutiva" del grupo: 3 KPIs reales + caja inventada + pronóstico inventado. Períodos ✅; toggle comparar ✅ visual.

## 5-10

- Mocks: "$1.2M"/"$742k" (fabricaciones P1); badge falso. Exportar BI sin efecto observado.

## Veredicto

**FAIL (P1)** — Base real pero 2 fabricaciones de alto impacto (caja $1.2M y pronóstico $742k) en una página de dirección.

**Fixes (FASE 3, ronda P1)**: caja ← `GET /dashboard/summary` (cash_registers) · quitar sección Pronóstico o cablear a forecast real · HealthScore ← API T19 con texto propio · quitar badge "Sincronizado".

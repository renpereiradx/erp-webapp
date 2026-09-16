# Sales Analytics — Comparativa de Períodos (`/sales-analytics/period-comparison`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/PeriodComparison.jsx` — `useState(MOCK_COMPARE)` (P1-2); datos reales renderizan (T7 refactorizó el endpoint Comparison 2→1 query con A/B idéntico).

## 1. Screenshot

- `../screenshots/sales-analytics/period-comparison-admin.png` — comparación real "Este Mes vs Anterior" con floats crudos.

## 2. Trazabilidad card → endpoint

`GET /sales-analytics/compare?period=...` (verify shape via comparePeriods):

| Métrica | Runtime |
|:--|:--|
| Ventas Gs. 551.760 vs Gs. 2.407.523 (delta -1.855.763) | ✅ real (mes parcial vs mes completo anterior — esperable) |
| Transacciones 8 vs 13 / Unidades 15 vs 31 / Clientes 4 vs 5 / Ticket 68.970 vs 185.194 | ✅ reales y coherentes |
| **Porcentajes crudos**: "-77.08183888585903%", "-38.46153846153847%", "-51.61290322580645%", "-62.75798818952093%" | ❌ sin redondear (14 decimales) |
| **Margen Bruto incoherente**: "37.7% vs 17.4%" con chips "-50.42%" y "**-5.0pp**" | ❌ 37.7-17.4 = **+20.3pp**, y la variación relativa de 17.4→37.7 es +116% — ambos indicadores mal calculados/mapeados |
| Tendencia diaria A vs B | ✅ 2 series reales |

## 3. Comprensión de usuario

- Las magnitudes absolutas son confiables; los porcentajes (la razón de ser de una comparativa) están rotos en presentación y el margen en semántica. "-5.0pp" con números que dan +20.3pp es exactamente el tipo de error que dispara decisiones equivocadas.

## 4. Afordancias probadas (runtime)

- Select "Este Mes vs Anterior" + botón "Comparar" ✅ refetch. Tabs "Períodos Predefinidos"/"Rangos Personalizados": el segundo tab presente (rango custom) — no probado a fondo 🟡.

## 5. Hardcode scan

- MOCK_COMPARE en archivo; sin otros literales.

## 6. Tabla

- Cards, no tabla.

## 7. Redirecciones

- Breadcrumb Ventas → ruta del grupo ✅.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅.

## 9. DESIGN.md §10

- Cards de comparación bien estructuradas (valor, vs-valor, delta).

## 10. AGENTS.md

- `.jsx` legacy; formateo de % ausente.

## Veredicto

**FAIL (P1)** — Datos reales; presentación de porcentajes rota (floats crudos) y cálculo de delta de margen inconsistente (pp incorrecto).

**Fixes (FASE 3)**: redondeo a 1 decimal · recalcular pp y % del payload (o mapear los campos correctos del endpoint) · eliminar MOCK_COMPARE del catch.

# Rentabilidad — Tendencias (`/profitability/trends`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · Gated `analytics:read` ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/ProfitabilityTrends.jsx`

## 1. Screenshot

- `../screenshots/profitability/trends-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/trends`:

| Sección | Runtime |
|:--|:--|
| "Vector de Tendencia: Contracción / EN DECLIVE" | 🟡 plausible (mes parcial) pero sin dato de respaldo visible |
| **"Tasa de Crecimiento: +-100%"** | ❌ valor absurdo (float/negativo concatenado) |
| **"Pico de Beneficio: --- / Gs. 0 NETO"** | ❌ sin mapear |
| Matriz de Evolución (gráfico) | ❌ vacío ("0 auditoría consolidada") con eje 01-14 Sep |
| "Smart Insights: No hay insights para este periodo" | ✅ empty-state honesto |
| Vigilancia de Margen: Bruto 0% / Neto 0% | ❌ ceros (mapping) |

## 3-10

- Diario/Semanal/Mensual ✅ (labels). "Auditoría Detallada" sin efecto observado 🟡. `.jsx`.

## Veredicto

**FAIL (P1)** — Página mayormente rota en presentación: +-100%, pico ---, gráfico vacío, vigilancia 0%. Solo el empty-state de insights es honesto.

**Fixes (FASE 3)**: remapear crecimiento/pico/vigilancia al contrato real del endpoint · gráfico ← data_points · "+-100%" imposible de enviar a producción.

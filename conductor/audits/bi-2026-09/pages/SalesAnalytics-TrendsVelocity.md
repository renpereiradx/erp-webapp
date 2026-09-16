# Sales Analytics — Tendencias y Velocidad (`/sales-analytics/trends-velocity`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/TrendsVelocity.jsx` — `useState(MOCK_VELOCITY)` (P1-2); P1-4 confirmado en vivo.

## 1. Screenshot

- `../screenshots/sales-analytics/trends-velocity-admin.png` — KPIs con valores plausibles, **heatmap vacío**, "hora pico 14:00" hardcodeada.

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| Ventas por Día Gs. 30.201 / por Hora Gs. 1.258 / Unidades 0,5 / Ciclo 5400 min | `getTrends`/`getVelocity` | 🟡 plausibles y derivados de datos reales (8 ventas/mes → 1 venta/3,75 días = 5400 min ✅ coherente) |
| **"Hora pico: 14:00 - 15:00"** + chip "PICO: 14:00" | **literal** (P1-4 confirmado) | ❌ hardcodeado — no sale del API |
| "+5% unidades vs mes anterior" | **literal** | ❌ |
| **Heatmap de Ventas (grid Lun-Dom × 0-22h)** | velocity payload | ❌ **grid sin datos visibles** (todas las celdas al mínimo) — contraste: el heatmap de `/dashboard/sales-heatmap` SÍ tiene datos; aquí el mapeo/mock (P1-4 "max 1000000") aplana todo |
| Gráficos Ventas por Día / por Hora | trends | ✅ con datos reales (día) / 🟡 por hora con pocas marcas |

## 3. Comprensión de usuario

- La página promete "picos de demanda" y muestra un heatmap vacío + una hora pico fija: el usuario no puede distinguir "no hay patrón" de "roto".
- KPIs numéricos correctos y coherentes entre sí.

## 4. Afordancias probadas (runtime)

- Rango de fechas (9/1-10/1) mostrado; "Actualizar" ✅ refetch. Sin más affordances.

## 5. Hardcode scan

- "Hora pico 14:00-15:00", "+5%", max fijo del heatmap (P1-4), MOCK_VELOCITY.

## 6. Tabla

- No aplica.

## 7. Redirecciones

- Ninguna.

## 8. Estados de datos (DESIGN §6.7)

- Sin estados de vacío en el heatmap (debería mostrar empty-state, no celdas planas).

## 9. DESIGN.md §10

- Grid legible; sin datos = mentira visual.

## 10. AGENTS.md

- `.jsx` legacy; sin i18n.

## Veredicto

**FAIL (P1)** — KPIs razonables pero el contenido central (heatmap) no pinta los datos y la "hora pico" es inventada.

**Fixes (FASE 3)**: mapear el grid al payload real (normalizar max dinámico — mata P1-4) · hora pico ← endpoint (by-hour ya existe en dashboard) · quitar "+5%" literal · re-auditar.

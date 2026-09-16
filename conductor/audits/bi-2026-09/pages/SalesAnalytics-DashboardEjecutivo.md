# Sales Analytics — Dashboard Ejecutivo (`/sales-analytics/dashboard`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **Ruta SIN guard** (5 de 6 del grupo sin PermissionGuard; solo Discounts lo tiene) · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/Dashboard.jsx` — **P1-2 en código**: `useState(MOCK_DASHBOARD)` inicial; con API sana los datos reales REEMPLAZAN al mock (verificado en vivo: los números son los de la API, no los del mock 15M). El mock queda como red de seguridad silenciosa (peligro en prod con API caída).

## 1. Screenshot

- `../screenshots/sales-analytics/dashboard-admin.png`

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| KPI Ventas Totales Gs. 551.760 / Transacciones 8 / Ticket Gs. 68.970 | `GET /sales-analytics/dashboard` | ✅ **reales** (cuadran con /dashboard/summary) |
| KPI Margen Bruto "**56.17659852109613%**" | ídem | 🟡 real pero **float crudo sin redondear** |
| Chips "+0%" ×4 | growth | ❌ literales/cero — P1-3 |
| Tendencia de Ventas (gráfico) | `getTrends` | ✅ real (01-14 Sep, escala correcta) |
| Alertas del Sistema | panel | ❌ **vacío sin estado** (no muestra ni "sin alertas") |
| Top Productos (tabla 5 filas) | `getByProduct` | ✅ real, coherente con dashboard/top-products |
| **Métodos de Pago: "UNKNOWN 100%"** | dashboard payload | ❌ **mapping roto**: todas las ventas caen en "unknown" — los payment methods reales existen en la DB |

## 3. Comprensión de usuario

- Núcleo correcto y coherente con el resto del sistema ✅.
- "UNKNOWN 100%" en métodos de pago es información falsa-útil: parece que no se registra el método.
- Margen con 14 decimales = falta de formateo.

## 4. Afordancias probadas (runtime)

- Período hoy/semana/mes/año ✅ cableado. "Exportar" ❌ sin efecto. "Ver Detalles" (métodos de pago) no observado con efecto. "..." del gráfico decorativo.

## 5. Hardcode scan

- `MOCK_DASHBOARD`/`MOCK_*` en el archivo (inicial + catch) — P1-2; growth "+0%".

## 6. Tabla

- Top Productos: 5 filas visibles sin paginación server-side (plan P2) — hoy < 10, riesgo cuando crezca.

## 7. Redirecciones

- Sin links salientes críticos.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅. Alertas: vacío sin empty-state ❌.

## 9. DESIGN.md §10

- Consistente. Percentajes crudos = pulido.

## 10. AGENTS.md

- `.jsx` legacy; MOcaKS en el bundle; sin i18n parcial.

## Veredicto

**PASS condicional** — Datos reales correctos. Deudas: payment methods "UNKNOWN" (mapping), floats crudos, growth "+0%", alertas sin empty-state, mock en catch (P1-2), sin guard.

**Fixes (FASE 3)**: mapear payment_method real · redondeo % · growth del API (trends ya lo trae) o quitar chip · empty-state en alertas · eliminar MOCK_* del catch (mostrar error) · decidir guard del grupo.

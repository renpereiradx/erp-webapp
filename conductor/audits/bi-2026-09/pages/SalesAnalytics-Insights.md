# Sales Analytics — Insights Clientes/Vendedores (`/sales-analytics/insights`)

**Fecha**: 2026-09-16 · FASE 2D · Rol: admin consolidado · **Ruta SIN guard** · Modo API, BE FASE 1.

**Archivo**: `src/pages/sales-analytics/CustomerSellerInsights.jsx` — `useState(MOCK_BY_CUSTOMER/SELLER)` (P1-2); con API real los datos reales reemplazan al mock.

## 1. Screenshot

- `../screenshots/sales-analytics/insights-admin.png`

## 2. Trazabilidad card → endpoint

| Sección | Fuente | Runtime |
|:--|:--|:--|
| Total Clientes 4 ("4 Recurrentes \| 0 Nuevos") | `getByCustomer` | ✅ real |
| LTV Gs. 1.396.995 | ídem | ✅ plausible (BC-9 acotado en T4) |
| Segmentación de Clientes (tabla 4 filas: Oscar/RENE/Fernando/Mario con totales reales) | ídem | ✅ real — RUC **vacío** (parties sin tax_id o mapping), frecuencia en inglés lowercase ("frequent"/"new") |
| Ranking Vendedores (ADMINISTRADOR Gs. 441.260 / E2E Cajero Gs. 110.50x) | `getBySeller` | ✅ real |
| "Progreso de Meta: %" | **sin fuente** | ❌ barra sin dato ("%" vacío) — no hay concepto de meta en la API |
| KPI chips **"+12%", "+5.4%", "-2.1%", "Churn rate: 13.9%", "+15%"** | **literales** (P1-3 confirmado en vivo) | ❌ "Retención 100%" + "Churn 13.9%" = contradictorios en la misma pantalla |

## 3. Comprensión de usuario

- Tablas reales y útiles ✅. Los chips de KPI con growth inventado y métricas contradictorias (100% retención + 13.9% churn) destruyen la confianza en la pantalla.
- "Venta Clientes Top Gs. 2.959.728" con etiqueta "Máximo histórico individual" — verificado coherente con cartera histórica (Oscar 616.380 saldo; total histórico mayor) 🟡 no desmiente.

## 4. Afordancias probadas (runtime)

- "Exportar Reporte" ❌ sin efecto. "Ver todos los clientes" sin destino claro (sin efecto observado). Filtro del ranking (ícono) sin efecto.

## 5. Hardcode scan

- Growth literals ×5 (P1-3); MOCK_BY_* en archivo; "Progreso de Meta" sin fuente.

## 6. Tabla

- Clientes: 4 filas (hoy); **sin paginación** (plan P2 — "tablas de Insights sin paginar"). Vendedores: 2 filas.

## 7. Redirecciones

- Ninguna operativa.

## 8. Estados de datos (DESIGN §6.7)

- Loading ✅; vacío no observado.

## 9. DESIGN.md §10

- Layout correcto; chips contradictorios = contenido incoherente.

## 10. AGENTS.md

- `.jsx` legacy; sin i18n ("frequent"/"new" crudos del API mostrados al usuario).

## Veredicto

**FAIL (P1)** — Datos reales bien presentados en tablas, pero 5 chips inventados (P1-3), meta sin fuente, y contradicción retención/churn.

**Fixes (FASE 3)**: eliminar growth/churn literales (calcular del API o quitar) · columna Meta: fuera o backend · paginación server-side en clientes · traducir frecuencia · RUC ← `tax_id` (drift conocido de T4).

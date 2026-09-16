# Rentabilidad — Dashboard (`/profitability/dashboard`)

**Fecha**: 2026-09-16 · FASE 2F · Rol: admin consolidado · **Grupo 100% gated `analytics:read`** ✅ · Modo API, BE FASE 1.

**Archivo**: `src/features/profitability/components/ProfitabilityDashboard.jsx`

## 1. Screenshot

- `../screenshots/profitability/dashboard-admin.png`

## 2. Trazabilidad → endpoint

`GET /profitability/overview` ( ProfitabilityService):

| Sección | Runtime |
|:--|:--|
| Ingresos Gs. 551.760 | ✅ real (= summary) |
| Profit Bruto Gs. 309.960 / Margen 56,18% / ROI 128,19% / Profit-Tx 20.664 | 🟡 **no cuadran con /dashboard/summary** (profit 289.260 / 52,4%) — política de costo distinta (fallback 0,7 de BC-12 vs costo real). El módulo es internamente consistente pero difiere del dashboard principal → decisión de negocio necesaria sobre qué número es "el bueno" |
| Chips de variación (▼77,1% / ▼67,6%) | ✅ reales (mes parcial vs anterior) |
| Tendencia de Eficiencia (gráfico) | ❌ **vacío** (no dibuja) |
| "Equilibrio Corporativo: Faltan Cobertura / margen adicional del 0%" | ❌ texto roto + objetivo 0% placeholder |
| Alerta HIGH DECLINING_PROFIT -67,6% | ✅ derivada real |

## 3-4. Usuario y afordancias

- Períodos Hoy/Semana/Mes/Año ✅. Sin botones muertos visibles aparte de los já existentes. La discrepancia de profit entre módulos (552k ingresos → 310k o 289k de profit) es IMPOSSIBLE de explicar para un usuario: hay que unificar la política de costo.

## 5-7. Hardcode/Tabla/Redirecciones

- Sin mocks. Sin tablas grandes. Nav lateral propia del grupo ✅ (links a las 6 páginas).

## 8-10. Estados/DESIGN/AGENTS

- Loading ✅. `.jsx`; texto "Faltan Cobertura" gramaticalmente roto.

## Veredicto

**FAIL (P1)** — Mitad real; gráfico vacío, objetivo 0%, texto roto, y **discrepancia de profit entre módulos** (política de costo).

**Fixes (FASE 3)**: unificar política de costo (decisión documentada) o mostrar fuente · gráfico: mapear o quitar · objetivo corporativo: config real o fuera · copy "Faltan Cobertura".

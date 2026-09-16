# Pronósticos — Dashboard (`/bi/pronosticos/dashboard`)

**Fecha**: 2026-09-16 · FASE 2E · Rol: admin consolidado · **Rutas del grupo SIN guard** · Modo API, BE FASE 1. Servicio: `src/services/biForecastingService.ts` (`get(endpoint, mockData, normalizer)` — mock catch-only).

**Archivo**: `src/features/bi-forecasting/components/DashboardPronosticos.jsx`

## 1. Screenshot

- `../screenshots/bi-pronosticos/dashboard-admin.png`

## 2. Trazabilidad card → endpoint

`GET /forecast/dashboard`:

| Sección | Runtime |
|:--|:--|
| Ventas Proyectadas Gs. 7.572.047 (+58.79%) | ✅ real (coherente con el +58.79% de Pronóstico de Ventas) |
| Ingresos Anuales Gs. 33.521.439 | ✅ plausible (proyección anual) |
| Riesgo de Inventario: 5 Productos | ✅ real (= reorder de SaludInventario) |
| Demanda Total 128 Unidades | ✅ plausible (= suma de demanda por categoría) |
| Insight "+33521439.14% Proyección de ingresos anual" | ❌ **el MONTO en dólares pegado como porcentaje** + "Se proyectan $33521439.14" — doble bug: símbolo $ (NA-DB-2) y % absurdo |
| Estrategias Recomendadas (2 cards genéricas) | 🟡 plantilla con datos reales (5 críticos) + texto fijo |

## 3. Comprensión de usuario

- KPIs coherentes entre páginas del grupo ✅. El insight con "+33521439.14%" resta toda credibilidad; en un dashboard "IA" el número absurdo es especialmente dañino.

## 4. Afordancias probadas (runtime)

- Nav interna de 5 tabs ✅. "Actualizar" ✅. "Exportar" ❌ sin efecto. "Ver todos" (insights) sin efecto observado.

## 5. Hardcode scan

- Estrategias recomendadas = texto plantilla con datos insertados; "$"/% crudo.

## 6-8. Tabla/Redirecciones/Estados

- Sin tablas grandes. Estados loading ✅.

## 9-10. DESIGN/AGENTS

- `.jsx` (FSD parcial); sin i18n; acentos faltantes ("Proyeccion", "confianza").

## Veredicto

**FAIL (P1)** — Datos reales; 1 insight con porcentaje absurdo + símbolo $.

**Fixes (FASE 3)**: el insight de ingresos: formatear Gs. y quitar el chip-% (o calcular % real) · acentos/i18n · Exportar fuera o cableado.

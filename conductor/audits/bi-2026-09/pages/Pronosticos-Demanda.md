# Pronósticos — Pronóstico de Demanda (`/bi/pronosticos/demanda`)

**Fecha**: 2026-09-16 · FASE 2E · Rol: admin consolidado · Ruta sin guard · Modo API, BE FASE 1.

**Archivo**: `src/features/bi-forecasting/components/PronosticoDemanda.jsx` → `GET /forecast/demand`

## 1. Screenshot

- `../screenshots/bi-pronosticos/demanda-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| KPIs Categoría Mayor Crecimiento (MODA +250%) y Producto Mayor Demanda (CAMISETA ADIDAS 87 uds) | ✅ coherentes con la tabla |
| Desglose por categoría (13 filas): históricas, proyectadas, crecimiento, tendencia, confianza | ✅ real (MODA 31→54, Electrónicos 23→37, Alquiler 18→3 con -66,67% — direcciones plausibles) |
| Confianza "75%" repetida en todas las filas | 🟡 valor único del modelo (banda global) — mostrar una vez o por-categoría real |

## 3. Comprensión de usuario

- Clara y útil para planificación. El "-66,67%" de Alquiler (frente a +0% de otros) muestra que el cálculo distingue categorías.

## 4. Afordancias

- "Exportar Análisis Completo" ❌ sin efecto. Sin más.

## 5-7. Hardcode/Tabla/Redirecciones

- Limpio. 13 filas > 10 ⚠️ **sin paginación** (plan P2) — agregar server-side o al menos paginación con total.

## 8-10. Estados/DESIGN/AGENTS

- Loading ✅. `.jsx`; sin i18n.

## Veredicto

**PASS condicional** — Datos reales y útiles. Deuda: 13 filas sin paginación, confianza repetida, Exportar decorativo.

**Fixes (FASE 3, P2)**: paginación · confianza por fila o global única · Exportar fuera.

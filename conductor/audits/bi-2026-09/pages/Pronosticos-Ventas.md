# Pronósticos — Pronóstico de Ventas (`/bi/pronosticos/ventas`)

**Fecha**: 2026-09-16 · FASE 2E · Rol: admin consolidado · Ruta sin guard · Modo API, BE FASE 1.

**Archivo**: `src/features/bi-forecasting/components/PronosticoVentas.jsx` → `GET /forecast/sales`

## 1. Screenshot

- `../screenshots/bi-pronosticos/ventas-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| Historial 6 meses (Abr 75.000 … Sep 551.760) | ✅ **real** — Aug 2.407.523 y Sep 551.760 cuadran con la comparativa de períodos |
| Proyección 3 meses (Oct 2.316.356 / Nov 2.524.016 / Dec 2.731.675) | ✅ real (LINEAR MONTHLY; granularidad/modelo mostrados — honesto post-T20) |
| Stats del modelo: Confianza **6,86%**, R² **0,07**, MAE Gs. 1.166.347 | ✅ **honestos** (fit pobre mostrado sin maquillaje — el espíritu de T20/BQ-5) |
| Chip "MAE -334.4%" | 🟡 semántica rara (error negativo en %) |
| "Intervalo de confianza 6.857822432766058%" | ❌ float crudo |
| Símbolo "₲" en headers vs "Gs." en celdas | 🟡 inconsistencia tipográfica |

## 3. Comprensión de usuario

- Con confianza 6,86% y R² 0,07, la proyección es débil — y la página lo DICE (bien). Falta una nota interpretativa ("datos insuficientes") para no-gnu-users.
- Las bandas ±15% de T20 existen en el API pero no se muestran aquí.

## 4. Afordancias

- "Recalcular" ✅ refetch. "Exportar Reporte" ❌ sin efecto.

## 5-7. Hardcode/Tabla/Redirecciones

- Limpio (mock catch-only). 2 tablas de 6/3 filas ✅.

## 8-10. Estados/DESIGN/AGENTS

- Loading ✅. `.jsx`; floats crudos.

## Veredicto

**PASS** — Datos reales, modelo honesto. Pulido: formatear confianza, aclarar chip MAE, mostrar bandas.

**Fixes (FASE 3, P2)**: redondeos · nota interpretativa de fit · opcional bandas del forecast.

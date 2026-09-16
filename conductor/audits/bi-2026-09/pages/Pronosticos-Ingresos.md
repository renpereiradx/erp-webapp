# Pronósticos — Escenarios de Ingresos (`/bi/pronosticos/ingresos`)

**Fecha**: 2026-09-16 · FASE 2E · Rol: admin consolidado · Ruta sin guard · Modo API, BE FASE 1.

**Archivo**: `src/features/bi-forecasting/components/PronosticoIngresos.jsx` → `GET /forecast/revenue`

## 1. Screenshot

- `../screenshots/bi-pronosticos/ingresos-admin.png` — 3 escenarios en Gs. 0 con la tabla mensual real debajo.

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| **3 Escenarios (Pesimista/Base/Optimista): Gs. 0, "+0%", "Prob. 0%"** | ❌ **mapping roto** — el payload trae los valores pero las cards no los leen (o el endpoint no los expone con estos nombres; verificar en FASE 3) |
| Proyección Mensual Detallada (Oct 2025 179.288, Dec 29.000, Feb 33.400, Abr 75.000, May 331.350, Jun 3.757.936…) | ✅ **real** — coincide con el historial de Pronóstico de Ventas |
| Límite Inferior/Superior: Gs. 0 en todas las filas | ❌ **bandas no mapeadas** — T20 expone bandas ±15%/absolutas en el API y el FE no las lee |
| Estado "-" por fila | 🟡 columna sin datos |

## 3. Comprensión de usuario

- La página promete "escenarios financieros" y muestra ceros con "Recomendado" sobre un escenario sin valor: sin valor de decisión. La tabla histórica salva la mitad de la pantalla.

## 4. Afordancias

- "Exportar Informe" ❌ sin efecto.

## 5-7. Hardcode/Tabla/Redirecciones

- Sin mocks visibles; mapping drift. Tabla ~18 filas históricas sin paginación ⚠️ (P2).

## 8-10. Estados/DESIGN/AGENTS

- Loading ✅ (y los ceros NO son fallback demo: vienen del mapping). `.jsx`.

## Veredicto

**FAIL (P1)** — Mitad real (tabla), mitad rota (escenarios + bandas). Patrón CashFlow a menor escala.

**Fixes (FASE 3)**: mapear escenarios (pesimista/base/optimista ← p25/50/75 o proyecciones ×{0.85,1,1.15} del payload) · bandas ← `lower_bound/upper_bound` de T20 · paginación o recorte de la tabla · Estado: quitar o poblar.

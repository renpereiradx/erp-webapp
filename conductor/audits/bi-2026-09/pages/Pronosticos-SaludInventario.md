# Pronósticos — Salud de Inventario (`/bi/pronosticos/inventario`)

**Fecha**: 2026-09-16 · FASE 2E · Rol: admin consolidado · Ruta sin guard · Modo API, BE FASE 1.

**Archivo**: `src/features/bi-forecasting/components/SaludInventario.jsx` → `GET /forecast/inventory`

## 1. Screenshot

- `../screenshots/bi-pronosticos/inventario-admin.png`

## 2. Trazabilidad → endpoint

| Sección | Runtime |
|:--|:--|
| KPIs Stock Total 1.070 uds / Cobertura 36,07% / En Riesgo 5 items | ✅ reales y coherentes entre sí (36 días ≈ dashboard "cubre 36 dias") |
| Tabla por producto (5 filas): stock actual, venta diaria, demanda pronosticada, días restantes, punto de reorden, riesgo | ✅ **real y accionable** (LAVADO DE AUTO 0 stock / 2/día / 60 proyectadas / 0 días / ALTO) |
| Notificaciones Urgentes ("Stock se agotara en 0 dias | 2 dias | 3 dias...") | ✅ derivado real, sin acentos |

## 3. Comprensión de usuario

- Página útil: un encargado de compras sabe QUÉ comprar y para cuándo. "0 días" con stock 0 es correcto (ya agotado).

## 4. Afordancias

- "Ver Detalles" ✅ (ancla a la tabla). "Exportar Reporte" ❌ sin efecto.

## 5-7. Hardcode/Tabla/Redirecciones

- Sin mocks visibles. 5 filas (< 10 ✅; el plan pedía controles de paginación — hoy no hacen falta, agregar al crecer). Sin links de acción directa a compras (oportunidad: "Generar orden de compra").

## 8-10. Estados/DESIGN/AGENTS

- Loading ✅. Semáforo de riesgo correcto. `.jsx`; sin i18n (acentos).

## Veredicto

**PASS** — La mejor página del grupo: datos reales, coherentes y accionables. Deuda menor: Exportar decorativo, sin paginación preventiva, sin acción directa a reposición.

**Fixes (FASE 3, P2)**: Exportar o quitar; CTA de reposición (requiere productos:write — decidir destino).

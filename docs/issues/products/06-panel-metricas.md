# Issue: Panel métrico UI básico (hits/misses, circuit-failures)

- Title: Panel métrico mínimo para Products (devtools)
- Owner: infra/frontend
- Estimate: 3d
- Labels: telemetry, frontend, P2
- Branch: feat/products/metrics-panel

## Descripción
Implementar un mini-panel accesible desde entorno de desarrollo que muestre métricas: cache hits/misses, ratio, fallos del circuito, FPS snapshot. Consumir telemetría existente y exponer controles simples (clear, export).

## Criterios de aceptación
- Panel disponible en entorno dev/stage.
- Datos reales visibles tras 24h de actividad.
- Export básico (CSV/JSON) de métricas.

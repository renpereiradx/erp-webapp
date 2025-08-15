# Issue: E2E flujo completo (Playwright) + auditoría AXE básica

- Title: Playwright E2E para flujo Products + ejecución AXE
- Owner: QA
- Estimate: 5d
- Labels: e2e, accessibility, P1
- Branch: feat/products/e2e-axe

## Descripción
Crear suites E2E que cubran: crear producto, buscar, editar inline, bulk actions y comportamiento offline. Ejecutar auditoría AXE en los flujos críticos como parte del job E2E en CI.

## Criterios de aceptación
- E2E en CI pasa de manera confiable (usar msw/fixtures si procede).
- AXE no reporta fallos críticos en los flujos probados.
- Documentación de cómo ejecutar localmente.

## Notas
- Reutilizar datos fake y rutas interceptadas para estabilidad.

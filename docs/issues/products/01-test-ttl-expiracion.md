# Issue: Test expiración TTL (products cache)

- Title: Test TTL expiración y refetch
- Owner: frontend/backend
- Estimate: 3d
- Labels: test, backend, frontend, P1
- Branch: feat/products/ttl-test

## Descripción
Crear test automatizado que simule una cache envejecida (TTL expirado) y verifique que la página Products realiza un refetch real hacia la API y actualiza la UI. Debe integrarse en CI y poder ejecutarse localmente.

## Criterios de aceptación
- Test pasa en CI y localmente.
- Simula TTL > valor configurado y confirma refetch (mock de tiempo o manipulación de almacenamiento).
- Registra telemetría o evento en el flujo para auditar el refetch.

## Notas técnicas
- Reutilizar `msw` para interceptar requests.
- Añadir job en CI que pueda manipular tiempo (si procede) o inyectar TTL reducido para la prueba.

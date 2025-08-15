# Issue: Mostrar código/error hint en UI (toast/banner)

- Title: Mostrar código + hint traducido en Toast/Banner para errores API
- Owner: frontend, UX
- Estimate: 2d
- Labels: UX, frontend, P1
- Branch: feat/products/error-hint-ui

## Descripción
Mejorar la experiencia de errores mostrando (cuando exista) el código de error y un hint traducido. Añadir acciones rápidas en el toast: copiar código, reintentar y abrir diagnóstico. Emitir eventos para que las páginas puedan reaccionar (p.ej. `toast:retry`).

## Criterios de aceptación
- Toast muestra mensaje, código (si existe) y hint traducido.
- Botones funcionales: copiar código al portapapeles y emitir evento `toast:retry`.
- Telemetría del evento de visualización del error incluida.

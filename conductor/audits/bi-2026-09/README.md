# Auditoría BI 2026-09 — Fichas por página (FASE 2 del plan raíz)

Estructura de la auditoría página por página del módulo "Inteligencia de Negocios"
(plan raíz: `conductor/PLAN_AUDIT_BI_INTELIGENCIA_NEGOCIOS_2026-09-14.md` del wrapper).

- `pages/<Grupo>-<Pagina>.md` — ficha por página según el protocolo §3 del plan
  (screenshot, trazabilidad card→endpoint, hardcode scan, tablas >10 filas,
  redirecciones, estados loading/empty/error, checklist DESIGN §10).
- `screenshots/<ruta>.png` — capturas full-page por ruta (modo API).

**Regla de sesión**: auditar siempre con `pnpm dev:api` (`.env.api`, `VITE_USE_DEMO=false`),
backend vivo en `:5050`. FASE 2 arranca solo cuando el gate de FASE 1 (backend) esté verde.

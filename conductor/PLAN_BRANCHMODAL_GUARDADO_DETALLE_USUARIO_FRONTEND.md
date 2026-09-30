# PLAN — BranchModal: guardado por contexto + Sucursales Asignadas en detalle de usuario

Fecha: 2026-09-30 · Repos: `erp-webapp` (rama `dev`) · Estado: EJECUTADO

## Pedido del owner (2 capturas)

1. **Detalle de usuario** (`/configuracion/usuarios/:id`): falta información, p. ej. **a qué
   sucursal fue asignado** el usuario.
2. **Modal de sucursal** (`BranchModal`, tabs Información General / Config. Fiscal / Accesos):
   el botón "Guardar" del footer es **global a todas las pestañas** — ¿debería ser
   independiente por pestaña, o guardar todo junto? Pide mejora u otra opción, alineada
   estrictamente con `DESIGN.md`.

## Diagnóstico

- `GET /api/v1/users/{id}` **no** trae sucursales. El endpoint necesario **ya existe**:
  `GET /users/{user_id}/branches` (`internal/identity/http_branch.go:961`) →
  `{access: [{branch_id, access_type, is_default_branch, granted_at}]}`, y el FE ya lo
  consume en `UserFormModal` (sección de solo lectura D.2). **No hay cambio de backend.**
- `BranchModal`: Radix Tabs con **un solo estado de form por concern** (`formData`,
  `fiscalForm`, `accessForm`). El footer muestra **Guardar siempre visible**, pero solo
  persiste el tab "info" (`form="branch-form"`); fiscal y accesos ya son **acciones
  inmediatas por fila** (POST/PUT/DELETE con invalidación de query). Además **no hay dirty
  tracking**: cerrar descarta edits de "info" en silencio. El Guardar global sobre tabs de
  acción inmediata es el bug de UX reportado.

## Decisión de diseño (por qué NO "guardar todo junto")

Cada pestaña toca **un recurso distinto con efectos distintos**:

| Tab    | Recurso                          | Persistencia            |
| :----- | :------------------------------- | :---------------------- |
| info   | `PUT /branches/{id}`             | Formulario con Guardar  |
| fiscal | `POST /branches/{id}/fiscal-config`, toggle SIFEN, delete | Inmediata por fila |
| access | `POST/PUT/DELETE /branches/{id}/access[...]` | Inmediata por fila    |

Un "Guardar todo" exigiría batch backend y rompería la semántica inmediata que la propia
página anuncia ("los cambios... tienen efecto inmediato"). **Opción elegida: footer
contextual por pestaña** (§6.10 de DESIGN.md, nueva receta):

- Tab `info`: `[secondary Cancelar] [primary Guardar]` (jerarquía §6.1).
- Tabs `fiscal`/`access`: hint "Los cambios de esta sección se aplican de inmediato" +
  `[secondary Cerrar]`. Sin Guardar.
- **Dirty tracking** del form info: punto `bg-warning` en el trigger + `sr-only`; cambiar
  de pestaña o cerrar con cambios sin guardar pide confirmación (**`AlertDialog` de Radix
  anidado** en el mismo stack de capas, `z-[1200]`, precedente `CategoryManagementModal`;
  un `EnhancedModal` apilado queda bloqueado por el pointer-events lock del `Dialog`);
  descartar revierte al snapshot de apertura; guardar actualiza el snapshot.
- Tabs pasan a **controladas** (`value`/`onValueChange`) para que el footer reaccione.

## Cambios (todos FE)

| Archivo | Cambio |
| :------ | :----- |
| `src/features/users/hooks/useUserBranchAccess.ts` | **NUEVO** — hook con las 2 queries (`getUserBranches` + nombres `getBranches`) que hoy viven inline en `UserFormModal` |
| `src/features/users/components/UserBranchAccessList.tsx` | **NUEVO** — lista de solo lectura (nombre + código mono + badge "Por defecto" + nivel de acceso traducido), compartida |
| `src/features/users/components/UserBranchesCard.tsx` | **NUEVO** — card "Sucursales Asignadas" para el detalle (loading/empty/error §6.7 + link a Configuración → Sucursales) |
| `src/features/users/components/UserDetailPage.tsx` | Renderiza la card en la columna derecha, entre Roles y Actividad |
| `src/features/users/components/UserFormModal.tsx` | Refactor: su sección inline usa hook + lista compartida |
| `src/features/branches/components/BranchModal.tsx` | Footer contextual + tabs controladas + dirty guard + i18n de líneas tocadas + invalida `['user-branches']` al mutar accesos |
| `src/lib/i18n/locales/es/users.js` | Claves `users.branches.*` (se retiran las `users.form.branches.*` movidas; queda `createNote`) |
| `src/lib/i18n/locales/es/branches.js` | **NUEVO módulo** `branches.modal.*` + `branches.withId`; registro en `es/index.js` (en hereda vía spread de es) |
| `DESIGN.md` | **§6.10** receta "Modal de configuración con pestañas (guardado por contexto)" |

## Tests (diseño PLAN_TEST_DESIGN_FRONTEND)

- `src/features/users/__tests__/UserBranchAccessList.test.tsx` — labels de acceso, badge por defecto, fallback `Sucursal {{id}}`.
- `src/features/users/__tests__/UserBranchesCard.test.tsx` — 4 estados (loading/empty/error/data), mocks en frontera (`branchService`, i18n).
- `src/features/branches/__tests__/BranchModal.saveTabs.test.tsx` — footer por tab (Guardar solo en info; hint+Cerrar en fiscal/access), dirty guard al cerrar y al cambiar de tab, descarte revierte.

Gate de salida: `npx vitest --run` 0 fallos, `npx tsc --noEmit` 0 errores, `pnpm build`,
`pnpm lint:design` en verde + smoke en navegador.

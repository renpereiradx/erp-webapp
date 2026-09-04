# PLAN — Alineación UI de Parties (Clientes y Proveedores) a DESIGN.md

Fecha: 2026-09-03
Estado: ✅ COMPLETADO y verificado en navegador (2026-09-03)
Alcance: `/parties` (PartiesPage + tab Clientes + tab Proveedores)
Referencias: `erp-webapp/DESIGN.md` (Precision Air), `AGENTS.md`, skill `vercel-react-best-practices`
Página de referencia alineada: `src/pages/Currencies.tsx`

---

## 1. Diagnóstico (estado previo)

Los tres archivos de la página ya son `.tsx` con la lógica extraída a hooks
(`useClientsView.ts`, `useSuppliersView.ts`), pero la capa visual viola DESIGN.md:

| Violación | Dónde |
|:----------|:------|
| Hex/rgba hardcodeados (`#0f6cbd`, `#242424`, `#f3f2f1`, `#616161`, `#dff6dd`, `#edebe9`, `#d1d1d1`, `#faf9f8`, `#107c10`, `#d13438`) | Los 3 archivos |
| Colores genéricos Tailwind (`text-slate-400`, `divide-slate-100`, `hover:bg-slate-50/80`) | Los 3 archivos |
| Escala tipográfica genérica (`text-xs`, `text-sm`, `text-[10px]`, `text-[11px]`, `text-3xl`, `text-base`) | Los 3 archivos |
| Sin `PageHeader` ni header con tokens (`border-l-4 border-[#0f6cbd]` hex) | PartiesPage |
| Contenedor `max-w-[1600px]` en vez de `max-w-container-max`; `bg-[#faf9f8]` en vez de `bg-background` | PartiesPage |
| Icono `material-symbols-outlined` (el proyecto usa `lucide-react`) | PartiesPage |
| Loading con spinner artesanal (regla §6.7: skeleton) | Clients, Suppliers |
| Empty/error como texto plano (sin `EmptyState`/`ErrorState`, sin acción/retry) | Clients, Suppliers |
| String de UI hardcoded en español ("Escribe al menos 3 caracteres…") | Clients |
| Menú de acciones de proveedor hecho a mano con portal (existe `ui/dropdown-menu`) | Suppliers |
| `rounded-xl` en cards/tabla (tabla §5: `rounded-md`) | Clients, Suppliers |
| `duration-500` en animación de entrada (regla: ≤ 300ms) | PartiesPage |
| Radios/sombras fuera de tabla cerrada (`rounded-lg`, `shadow-sm`) | Varios |
| Números/fechas/IDs sin `text-data-mono font-data-mono` | Ambas tablas |

## 2. Decisiones de diseño

1. **Header de página**: patrón establecido por las páginas alineadas recientes
   (Currencies, PaymentMethods): header propio con clases semánticas
   (`border-l-4 border-primary pl-4`, `text-headline-lg-mobile md:text-headline-lg`).
   El componente `PageHeader` queda descartado: usa escala genérica (`text-3xl`,
   `text-muted-foreground`) y no sigue el patrón actual del repo.
   NOTA: `text-headline-md` (usado en Currencies) **no existe** en `design/tokens.json`;
   aquí se usan `text-headline-lg-mobile` / `text-headline-lg` que sí existen.
2. **Jerarquía de layout**: `PartiesPage` posee header + tabs; cada tab posee su
   toolbar (búsqueda + acciones) y tabla. Un solo botón `primary` por vista:
   "Nuevo Cliente" / "Nuevo proveedor" según tab activo.
3. **Estados de datos (§6.7)**: loading → `GenericSkeletonList`; error → `ErrorState`
   con `onRetry`; empty → `EmptyState` con acción de creación. Se mantienen los
   `data-testid="datastate-*"` que esperan los tests.
4. **Menú de proveedor**: se reemplaza el portal artesanal por `ui/dropdown-menu`
   (Radix): focus trap, Escape, click-outside y posicionamiento gratis.
5. **Status**: pill con `Badge` semántico (`success` / `secondary`) + punto de color
   + texto (accesibilidad §11.5).
6. **Datos**: documento/taxId → `text-data-mono font-data-mono`; fecha de creación →
   mono; contactos (email/teléfono) → `text-body-md text-on-surface-deep`.

## 3. Cambios por archivo

| Archivo | Cambio |
|:--------|:-------|
| `src/lib/i18n/locales/es/party.js` | + claves `parties.*` (título, subtítulo, breadcrumb, tabs) |
| `src/lib/i18n/locales/es/clients.js` | + `clients.search.min_chars`, `clients.pagination.*` footer, `clients.empty.title` (ya existe), acciones |
| `src/lib/i18n/locales/es/suppliers.js` | + claves de toolbar si faltan |
| `src/lib/i18n/locales/en/party.js` | overrides EN de `parties.*` |
| `src/pages/PartiesPage.tsx` | Header con tokens, breadcrumb con `lucide-react`, tabs con tokens, layout `bg-background` + `max-w-container-max` |
| `src/pages/Clients.tsx` | Toolbar/tabla/paginación con tokens, data states §6.7, i18n del hint de 3 caracteres, mono en datos |
| `src/pages/Suppliers.tsx` | Igual que Clients + menú contextual migrado a `DropdownMenu` |

No se tocan: stores, hooks de vista (lógica ya extraída), modales de formulario/detalle
(quedan para una fase posterior de alineación — ver §6).

## 4. Verificación

- `npx tsc --noEmit` (el build de Vite NO typechequea)
- `pnpm lint:design` (código nuevo/cambiado en verde; legacy preexistente reporta pero no bloquea)
- `pnpm build`
- `pnpm test` — baseline: 48 fallos preexistentes (2026-09-03); los tests de esta página
  (`Clients.page.test.jsx`, `Clients.toasts.test.jsx`) ya fallaban antes del cambio;
  no se deben añadir fallos nuevos.
- Verificación visual en :5173 (estados loading/empty/error/tabla + tab proveedores).

## 5. Auditoría vercel-react-best-practices (alcance de los archivos tocados)

- `rerender-no-inline-components`: `SupplierActionsMenu` ya es componente de nivel
  superior; tras migrar a `DropdownMenu` desaparece el menú con portal y refs manuales.
- `rendering-conditional-render`: renderizado condicional con ternarios explícitos en
  estados de datos (evita `0`/`""` renderizados).
- `client-*`/`async-*`: búsqueda ya debounced (500ms) en los hooks; no hay waterfalls nuevos.
- `js-cache-function-results`: los handlers derivados que se pasan a filas provienen de
  hooks estables; no se introducen closures pesadas por fila.
- Sin `server-*` (SPA Vite sin SSR).

## 6. Fuera de alcance (fase posterior)

- Modales de cliente/proveedor (`components/ClientFormModal.jsx`, `ClientDetailsModal.jsx`,
  `components/clients/*`, `components/suppliers-directory/*`): siguen con hex legacy y
  `.jsx`; requieren migración a `.tsx` + `EnhancedModal` + Zod en un plan propio.
- Páginas satélite (`SupplierAnalysis.jsx`, `ClientCreditProfile.jsx`).

---

## 7. Resultado de la implementación (2026-09-03)

**Archivos modificados** (10 + plan): `PartiesPage.tsx`, `Clients.tsx`, `Suppliers.tsx`,
`ui/EmptyState.jsx` y `ui/ErrorState.jsx` (JSDoc `@param` para uso desde TSX, mismo
patrón que `ui/PageHeader.jsx`), i18n `es/party.js`, `es/clients.js`, `es/suppliers.js`,
`es/common.js`, `en/party.js`.

**Verificación:**

| Check | Resultado |
|:------|:----------|
| `npx tsc --noEmit` | 9 errores, todos preexistentes (`RegisterSalePaymentModal.tsx`); 0 nuevos |
| `pnpm lint:design` | ✓ Código nuevo limpio |
| `pnpm build` | ✓ built in 5.4s |
| `pnpm test` (suite completa) | 48 fallos / 439 pasan — idéntico al baseline; `Suppliers.toasts` pasó |
| Hex/slate/text-xs/duration-500 en los 3 archivos | 0 ocurrencias |
| Navegador (:5173, modo api) | Breadcrumb, header, tabs (URL `?tab=`), toolbar, tabla, badge, paginación, empty/error/loading, hint 2/3 con interpolación i18n, menú DropdownMenu con 5 acciones y toast de copiado: OK |

**Decisiones tomadas durante la implementación:**

1. `EmptyState`/`ErrorState` eran infenestrables desde TSX (inferencia de props JS
   marcaba `onAction?: undefined` y `className` requerido). Se anotaron con JSDoc en
   los propios ui components en vez de usar casts o `DataState`.
2. `SuppliersPage` usa `useContext(AuthContext)` fail-closed (mismo contrato de
   `WithPermission`) en vez de `useAuth()`, que lanza sin provider y rompería tests.
3. El menú artesanal con portal se reemplazó por `ui/dropdown-menu` (Radix): Escape,
   focus trap y reposicionamiento gratis; ~120 líneas menos.
4. **Gotcha descubierto (Tailwind 4 en este repo):** la variante `md:max-w-sm`
   resuelve `--spacing-sm` (8px) en vez de `--container-sm` (24rem). El variante base
   `max-w-sm` sí resuelve bien (360px). Evitar `md:max-w-*`; usar la clase base.
5. Bug preexistente anotado: el footer de paginación de Clientes muestra
   "Mostrando 1 a 0 de 0" en resultados de búsqueda (los contadores de
   `useClientsView` solo son correctos para el directorio paginado, no para
   `searchResults`). Queda para el hook, fuera de este plan de UI.
6. El dev server debió reiniciarse durante la verificación (grafo viejo = pantalla
   negra, ya documentado en memoria). Quedó corriendo `pnpm dev:api` (mismo modo
   `--mode api` que el proceso anterior).

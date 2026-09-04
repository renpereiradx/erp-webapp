# PLAN — Alineación de páginas de Caja (`/caja-registradora`, `/movimientos-caja`)

Fecha: 2026-09-03
Alcance: páginas enlazadas desde el aside bajo **Caja (cash:read)**:

| Item aside | Ruta | Página actual | Estado pre-migración |
|:-----------|:-----|:--------------|:---------------------|
| Apertura y Cierre | `/caja-registradora` | `pages/NewCashRegister.tsx` (566 líneas) | TSX con tipos parciales; hex crudos (`#0f6cbd`, `#107c10`, `#f3f2f1`…), `text-slate-*`, strings hardcodeados, lógica de formato/diferencia en el componente, sin estados de datos estándar |
| Movimientos Manuales | `/movimientos-caja` | `pages/CashMovements.tsx` (502 líneas) | TSX parcial; mismo set de violaciones + tabla hand-rolled sin primitivas `ui/table`, conceptos duplicados, `console.error` como único error path |

Fuera de alcance (documentado, no se toca):
- `/movimientos-caja/nuevo` → `pages/RegisterCashMovement.tsx`: **ruta huérfana** (ningún enlace navega a ella; el registro se hace por modal desde `/movimientos-caja`). Queda pendiente decidir: eliminar ruta o migrar.
- `pages/CashRegister.tsx` (obsoleta, no enrutada) + sus 4 modales legacy en `features/cash-register/components/` (`OpenCashRegisterModal`, `CloseCashRegisterModal`, `MovementModal`, `CashAuditModal`): solo los usa la página obsoleta; violan §6.6 (modal artesanal `fixed inset-0`). Limpieza futura.

## Decisiones

1. **Feature-Sliced**: la lógica y los componentes viven en `features/cash-register/`; las páginas quedan como shells de composición (patrón `CategoriesPage.tsx`).
2. **No reutilizar los modales legacy** de la feature: están desalineados y atados a la página obsoleta. Los diálogos nuevos usan `EnhancedModal` (DESIGN §6.6).
3. **Store/servicio sin cambios de contrato**: el hook nuevo usa `useCashRegisterStore` (normalización de la caja activa) y `cashRegisterService` (movimientos filtrados `/movements/filter` y anulación) preservando endpoints y payloads exactos.
4. **Validators de dominio devuelven claves i18n**, no texto: el texto se resuelve en la capa UI con `t(key, fallback)`. Los únicos consumidores eran las páginas de caja.
5. **Formateo de moneda/fechas/duración → `domain/cash-register/format.ts`** (funciones puras, testeable). `calculations.formatCurrency` se deja intacto para la página obsoleta.
6. **Conceptos de movimiento** (ids + clave i18n) se centralizan en la feature; se elimina la duplicación page/modal. Payload idéntico: `category: id`, `concept: label + (notes ? ' - ' + notes : '')`.

## Estructura final

```
src/domain/cash-register/
├── format.ts               ← NUEVO: formatPYG, groupDigits, parseGroupedDigits,
│                              formatDateTimeEs, sessionDuration, closingDifference
├── validators.ts           ← MODIFICADO: devuelve claves i18n
├── calculations.ts         ← intacto (usado por página obsoleta)
└── models.ts               ← intacto

src/features/cash-register/
├── constants.ts            ← NUEVO: conceptos de movimiento (id + i18n key)
├── hooks/
│   ├── useCashRegisterSession.ts  ← intacto
│   └── useCashMovements.ts        ← NUEVO: lista+filtros+crear+anular
├── components/
│   ├── CashRegisterStatusCard.tsx   ← NUEVO (sidebar de sesión activa)
│   ├── OpenSessionForm.tsx          ← NUEVO (form apertura)
│   ├── CloseSessionForm.tsx         ← NUEVO (form cierre + diferencia de arqueo)
│   ├── MovementsFilterPanel.tsx     ← NUEVO (panel de filtros)
│   ├── MovementsTable.tsx           ← NUEVO (ui/table, mono, acciones)
│   ├── RegisterMovementModal.tsx    ← NUEVO (EnhancedModal + SegmentedControl)
│   ├── VoidMovementModal.tsx        ← NUEVO (EnhancedModal variant=error)
│   └── (4 modales legacy: intactos, deprecation pendiente)
└── index.ts                ← NUEVO barrel (patrón features/categories)

src/pages/
├── NewCashRegister.tsx     ← REESCRITO: PageHeader + StatusCard + tabs open/close
└── CashMovements.tsx       ← REESCRITO: PageHeader + filtros + tabla + 2 modales
```

## Reglas DESIGN.md aplicadas (checklist §10)

- Cero hex/rgba y cero `slate-*`/`gray-*` en código nuevo → `bg-background`, `bg-surface`, `bg-surface-muted`, `text-foreground`, `text-on-surface-deep`, `text-success`, `text-error`, `border-border-subtle`, `border-divider`.
- Tipografía semántica: `text-headline-lg(-mobile)`, `text-title-md`, `text-body-md(-bold)`, `text-body-sm-bold`, `text-label-caps uppercase`; datos `text-data-mono font-data-mono` + `text-right`.
- 1 solo `primary` por vista; cierre de jornada → `destructive`; cancelar → `secondary`/`ghost`.
- Espaciado por tokens (`xs/sm/md/lg/xl`), radios por tabla §5 (`rounded-md` cards, `rounded-input`, `rounded-xl` modal), sombras `shadow-whisper` / `shadow-fluent-16`.
- Estados de datos: `GenericSkeletonList` (loading), `EmptyState` (sin caja activa / sin movimientos, con acción), `ErrorState` con `onRetry` (error).
- `PageHeader` en ambas páginas; `Label htmlFor` en todos los inputs; `aria-label` en icon-only.
- i18n: todo string visible por `t('clave', fallback)`; claves nuevas en `locales/es/cashRegister.js` y `locales/es/cashMovement.js` (existentes reutilizadas).

## Skill vercel-react-best-practices — reglas aplicadas

- `rerender-no-inline-components`: sin componentes definidos dentro de componentes (config con JSX hoisteada a módulo).
- `rendering-hoist-jsx`: listas de conceptos y configs estáticas a nivel de módulo (`constants.ts`).
- `rerender-dependencies`: efectos dependen de primitivos (`activeCashRegister?.id`).
- `rerender-lazy-state-init`: fecha inicial via initializer.
- `rerender-functional-setstate`: updates funcionales en formularios.
- `async-dependencies`: cadena active→movements (dependiente, no paralelizable).
- `bundle-*`/`server-*`: N/A (SPA Vite sin SSR; imports directos, sin barrel nuevo cross-feature).

## Verificación

- `npx tsc --noEmit` (el build de Vite NO typea chequea).
- `pnpm build` verde.
- `pnpm test`: baseline 44 fails pre-existentes; objetivo = no aumentar (tests de página reescritos alineados al nuevo DOM; tests nuevos de dominio en verde).
- `pnpm lint:design` sobre archivos nuevos.

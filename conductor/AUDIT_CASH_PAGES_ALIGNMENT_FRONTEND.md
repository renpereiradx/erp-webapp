# AUDIT — Verificación y alineación forzada de páginas de Caja (`/caja-registradora`, `/movimientos-caja`)

Fecha: 2026-09-04
Verificación de: [PLAN_CASH_PAGES_ALIGNMENT_FRONTEND.md](./PLAN_CASH_PAGES_ALIGNMENT_FRONTEND.md) (migración 2026-09-03)
Alcance: los dos ítems del aside bajo **Caja (cash:read)** + sus componentes/hook del feature `cash-register`. Alineación **forzada** sobre archivos existentes (mandato explícito del usuario; AGENTS.md marca las reglas para archivos nuevos).

Resultado: **build verde, lint:design verde, tests de caja 14/14, suite total 40 fails (= baseline 44 − 4 arreglados, 0 nuevos).**

## Hallazgos y correcciones

### Funcionales (detectados por el typecheck + auditoría)

| # | Hallazgo | Corrección |
|:--|:---------|:-----------|
| 1 | `CashMovements.tsx` pasaba el payload del modal a `createMovement` **sin inyectar `translateConcept`** (obligatorio en `CreateMovementInput`): registrar un movimiento hubiese fallado en runtime con "not a function" y toast de error crudo. | La página inyecta `translateConcept` que resuelve `MOVEMENT_CONCEPTS[direction]` → `t(labelKey, conceptId)`. Handler tipado con `RegisterMovementPayload`. |
| 2 | `/caja-registradora` sin **estado de error** al fallar la carga de la caja activa (DESIGN §6.7 exige los 3 estados; `/movimientos-caja` sí lo tenía). | Rama `ErrorState` con `onRetry={refreshActive}`; `activeCashRegisterError` expuesto por `useCashRegisterSession`. |
| 3 | `VoidMovementModal` pasaba `movement.movement_id` (`number \| undefined`) a `onConfirm(number)` (TS2322 pre-existente). | Guard `typeof movementId !== 'number'` antes de confirmar. |

### Performance (`vercel-react-best-practices`)

| # | Regla | Hallazgo | Corrección |
|:--|:------|:---------|:-----------|
| 4 | `client-*` (no pedir lo que no se renderiza) | `useCashRegisterSession` disparaba `getCashRegisters` + `getMovements` + `getAudits` en `/caja-registradora`, que nunca muestra esos datos: 3 requests desperdiciadas por montaje. | Hook con `options.includeHistory` (default `false`); solo la página obsoleta `CashRegister.tsx` pasa `{ includeHistory: true }`. |
| 5 | `rerender-defer-reads` | `NewCashRegister` se suscribía al store completo del dashboard (`const { fetchDashboardData } = useDashboardStore()`): re-render ante cualquier cambio del dashboard. | Selector `useDashboardStore(state => state.fetchDashboardData)` (acción estable en Zustand). |
| 6 | `rendering-hoist-jsx` / DRY | Config de tabs duplicada con el className literal repetido 2×, inline en el componente. | `SESSION_TABS` a nivel de módulo + `map`; patrón `ProductFormModal.tsx`. Añadidos `id`/`aria-controls`/`role="tabpanel"`/`aria-labelledby`. |

### DESIGN.md (alineación forzada)

| # | Regla | Hallazgo | Corrección |
|:--|:------|:---------|:-----------|
| 7 | §1.4 sin cálculos en componentes | `activeCashRegister?.current_balance \|\| initial_balance \|\| 0` duplicado en `CashMovements.tsx` y `CloseSessionForm.tsx`. | Helper puro `systemBalanceOf(session)` en `domain/cash-register/format.ts`, consumido por ambos. |
| 8 | §1.6 datos en mono | `CashMovements` formateaba el saldo con `Intl.NumberFormat` inline (y sufijo `₲`, distinto al formato del dominio `₲1.250.000`). | `formatPYG` del dominio; clase `text-data-mono font-data-mono`. |
| 9 | §3 tipografía sin mezclas | Tokens en conflicto: `text-body-md-bold` sobre `text-data-mono font-data-mono` (700 vs 500, gana el orden CSS, no el intento), `text-body-lg font-data-mono font-semibold`, `tracking-tight` (no token), `text-body-sm` (alias no documentado en la tabla). | Montos/fechas normalizados a `text-data-mono font-data-mono`; jerarquías hero (`text-title-md font-data-mono`) conservadas sin mezclar peso. |
| 10 | §2.2 roles de color de texto | Separador `\|` del subtítulo con `text-divider` (token de borde, no de texto). | `text-on-surface-deep` (decorativo, `aria-hidden`). |
| 11 | §4 espaciado | `mb-md` extra en `MovementsFilterPanel` (la página ya separa secciones con `mt-lg`): espaciado doble asimétrico. | Eliminado. |
| 12 | §11 accesibilidad | Botón de anular en la tabla con `opacity-0` hasta hover: invisible en touch. | `max-md:opacity-100`. |

### Tests

- `src/__tests__/newCashRegister.page.test.jsx` estaba **obsoleto**: mock de `useToast` con contrato viejo (`success/error`), sin `<Router>` (4 fails por `useNavigate`), asserts de clases BEM inexistentes y textos de la página pre-rediseño. Reescrito al contrato actual: `MemoryRouter`, mocks selector-aware, `t(key, fallback)` real, tabs por rol ARIA, estado vacío de cierre, tokens de layout (`bg-background`, `bg-surface rounded-md shadow-whisper`). **4 fails → 14/14 verdes** (junto a `cashRegisterMovements.test.js`).

## Desviaciones documentadas (decisión consciente, no CORRECTION)

1. **Validación sin Zod**: los 3 validadores viven en `domain/cash-register/validators.ts`, son puros, devuelven claves i18n y están testeados. Cumplen la intención arquitectural (lógica fuera de componentes); migrarlos a Zod sería churn sin beneficio visible hoy.
2. **Hero amounts a `text-title-md` + `font-data-mono`** (saldo en status card, diferencia de arqueo, input de cierre): DESIGN §3 fija `text-data-mono` 14px para datos, pero estos números son la figura principal de su card; se mantiene la jerarquía con fuente mono y sin pesos mezclados.
3. **Radix `ui/tabs.jsx` NO reutilizado**: es el preset shadcn genérico (`text-sm`, `bg-muted`) no tokenizado; sobreescribirlo con `cn()` (sin tailwind-merge) es poco fiable. Se mantiene el patrón tablist manual tokenizado, idéntico al de `ProductFormModal.tsx` (referencia migrada).
4. **Campo "Fecha efectiva"** en apertura es decorativo (`defaultValue`, nunca se envía). Comportamiento pre-existente; requiere decisión de producto (enviarla o quitarla).
5. **Fuera de alcance**: los 9 errores TS restantes viven en `components/sales/RegisterSalePaymentModal.tsx` (pre-existentes, feature ventas); modales legacy de la página obsoleta (`OpenCashRegisterModal`, `CloseCashRegisterModal`, `MovementModal`, `CashAuditModal`) y la ruta huérfana `/movimientos-caja/nuevo` (pendiente en el PLAN).

## Verificación ejecutada

- `npx tsc --noEmit`: 0 errores en el área de caja (9 pre-existentes en sales, fuera de alcance).
- `pnpm lint:design`: "✓ Código nuevo limpio".
- `npx vitest run` (suite completa): **40 fails / 495** vs baseline 44 — los 4 menos son los arreglados aquí; 0 nuevos.
- `pnpm build`: verde (warning de chunk >500kB pre-existente y global).

## Archivos tocados

```
src/pages/NewCashRegister.tsx                    ← selector dashboard, ErrorState, tabs DRY+ARIA
src/pages/CashMovements.tsx                      ← translateConcept inyectado (fix runtime), formatPYG/systemBalanceOf, clases de datos
src/pages/CashRegister.tsx                       ← { includeHistory: true } (página obsoleta, 1 línea)
src/features/cash-register/hooks/useCashRegisterSession.ts ← includeHistory opt-in, activeCashRegisterError
src/features/cash-register/hooks/useCashMovements.ts       ← import sin uso
src/features/cash-register/components/CashRegisterStatusCard.tsx ← tipografía datos
src/features/cash-register/components/CloseSessionForm.tsx       ← systemBalanceOf, tipografía datos
src/features/cash-register/components/MovementsTable.tsx         ← text-data-mono, botón touch-visible
src/features/cash-register/components/MovementsFilterPanel.tsx   ← mb-md fuera
src/features/cash-register/components/VoidMovementModal.tsx      ← guard movement_id, tipografía datos
src/domain/cash-register/format.ts               ← systemBalanceOf (puro)
src/__tests__/newCashRegister.page.test.jsx      ← reescrito al contrato actual (14/14)
```

# PLAN — Receta canónica "Card con tabla" + alineación del carrito de Ventas

Fecha: 2026-09-30 · Repo: erp-webapp · Rama: dev · Origen: auditoría de contraste de
cards con header/thead (`bg-surface-muted`) pedida por el owner (capturas de /compras,
/ventas y /receivables/overdue).

## Problema

El patrón "card cuyo contenido principal es una tabla" existía en 3 variantes no
documentadas (solo estaba especificado el `thead` muted en §6.3):

| Variante | Anatomía | Dónde |
| :-- | :-- | :-- |
| Compras | banda de toolbar (`bg-surface-muted` + `border-b border-divider`) + thead full-bleed pegado a los bordes, sin marco interno | `PurchaseCartTable` |
| Ventas | header blanco + thead dentro de un **recuadro interno** (`border` + `rounded`) | `SalesCartGrid` |
| Cuentas Vencidas | card con marco `border-border-subtle` + sombra que crece al hover | `OverdueTable` (BI) |

Además, el empty state de Ventas **reemplazaba** la tabla (la card se veía "desarmada"
vacía), mientras Compras la mantiene armada (el empty es una fila `colSpan` dentro).

## Decisión

**Canónica = variante Compras**: card `bg-surface rounded-md shadow-whisper border-0
overflow-hidden` → toolbar opcional (`bg-surface-muted` + `border-b border-divider`,
solo si el header lleva buscador/acciones) → tabla full-bleed (thead muted pegado a los
bordes, sin recuadro interno) → empty state SIEMPRE dentro de la tabla (fila `colSpan`).

**Variante sancionada** (no deuda): card enmarcada `border border-border-subtle` (±
`hover:shadow-fluent-8`) para listas de solo lectura / BI, thead muted dentro, sin
toolbar. Regla dura: elegir UNA forma por card; prohibido el recuadro interno dentro de
card sin marco (doble marco implícito).

## Cambios

1. **DESIGN.md**
   - §2.1: la fila de `bg-surface-muted` nombra explícitamente la "toolbar de card".
   - §6.3: anatomía canónica copy-paste (toolbar + full-bleed + empty dentro) y regla
     de vacío enmendada (antes: "usa EmptyState" sin distinción).
   - §6.7: nota que enruta card-con-tabla a §6.3.
   - §8: fila anti-patrón "recuadro interno" y matiz de la fila "Tabla con 0 filas".
   - §10: checklist referencia §6.3 en estados de datos.
2. **`src/features/sales/components/SalesCartGrid.tsx`** (desktop): fuera el recuadro
   interno (thead full-bleed) y empty state dentro de la tabla (fila `colSpan`, icono en
   círculo muted + título + hint + acción F2, testids `sales-cart-empty` /
   `empty-action` se conservan). La vista mobile (cards, sin tabla) conserva `EmptyState`.
3. **`src/pages/SalesNew.tsx`**: la card del carrito adopta la banda de toolbar
   (título + hints `[F2][F12][F4]` sobre `bg-surface-muted` + `border-b border-divider`)
   — hermana del carrito de /compras.

## No se toca en este pase (revisar en su próxima alineación)

- `OverdueTable` (BI): queda como ejemplo de la variante enmarcada sancionada.
- `PrinterList.tsx:48` y `PurchaseConfirmationModal.tsx:144` tienen tablas con recuadro
  interno; el del modal puede ser legítimo (contexto modal, no card). Decidir ahí.

## Gates

`npx vitest --run` · `npx tsc --noEmit` · `pnpm build` · `pnpm lint:design` + smoke
visual en :5173 (/ventas vacío y con ítems, /compras como referencia).

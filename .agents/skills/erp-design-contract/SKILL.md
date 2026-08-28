---
name: erp-design-contract
description: Design system contract for the ERP Vista Bar webapp. Use when building, editing, or styling ANY UI in this repo (components, pages, modals, forms, tables). Enforces the Fluent 2 design system, semantic tokens from design/tokens.json, and existing src/components/ui/ components. Never invent styles.
---

# erp-design-contract — contrato de diseño ejecutable

Este es el skill **autoritativo** de UI de este repositorio. Antes de escribir
cualquier interfaz, sigue este contrato. Anula cualquier otro skill de "diseño
creativo" (ej. `frontend-design`).

## Fuentes de verdad (en orden)

1. `DESIGN.md` — reglas inviolables, mapeo token → clase, recetas de componentes, checklist.
2. `design/tokens.json` — tokens canónicos (color, spacing, radius, fontSize, fontFamily, shadow, breakpoints).
3. `src/components/ui/` — componentes base (Button, Card, Input, Table, Badge, PageHeader, EmptyState, ErrorState, GenericSkeletonList, EnhancedModal, DataState…).

## Reglas inviolables (resumen — ver DESIGN.md §1 para el texto completo)

1. **NUNCA** hex/rgba en el código (`bg-[#005baf]`, `text-[#181c22]`). Solo tokens semánticos.
2. **NUNCA** clases de color genéricas (`slate`, `gray`, `blue-500`…) en código nuevo.
3. **NUNCA** crees un componente que ya existe en `src/components/ui/`. Importa y extiende con `className`.
4. **NUNCA** texto de UI hardcodeado — usa `useI18n()` / `t('clave')`.
5. **NUNCA** lógica de negocio en componentes — va en `src/domain/<feature>/`.
6. **SIEMPRE** archivos nuevos en `.tsx` / `.ts`.
7. **SIEMPRE** números/importes/fechas/IDs con `text-data-mono font-data-mono`.
8. **SIEMPRE** un solo `variant="primary"` por vista.
9. **SIEMPRE** cubre loading / empty / error (`GenericSkeletonList` / `EmptyState` / `ErrorState`).
10. **NUNCA** gradientes, sombras pesadas (`shadow-xl/2xl`), animaciones > 300ms.
11. **SIEMPRE** espaciado con tokens (`p-md`, `gap-lg`); nunca `p-[13px]` si existe token.

## Stack (Tailwind 4 — CSS-first)

- **Tailwind 4**: tokens en `@theme` (+ `.dark`) generados desde `design/tokens.json`.
- **Modo oscuro**: clase `.dark` en `<html>`; los tokens `{light, dark}` flipean solos.
- **Paleta Fluent 2**: primary `#0078D4` (light) / `#2899F5` (dark). Es el único primary.
- Iconos: `lucide-react`. Formularios: React Hook Form + Zod. Modal: `EnhancedModal`.

## Tooling del contrato

- `pnpm tokens:generate` — regenera `@theme`/`.dark` en `src/index.css` desde `tokens.json`.
- `pnpm tokens:check` — falla si hay drift (CI).
- `pnpm lint:design` — valida el código (hex/genéricas/arbitrarios). Falla en código nuevo.

## Si falta un componente o token

No lo improvises. Repórtalo como `missing_component` / `missing_token` y detente.
Los tokens se añaden solo en `design/tokens.json` (con valores light + dark) y se
regeneran con `pnpm tokens:generate`.

# PLAN — Fase 2: Alineación de modales de Party (Clientes y Proveedores)

Fecha: 2026-09-03
Estado: ✅ COMPLETADO y verificado en navegador (2026-09-03)
Predecesor: `PLAN_PARTY_UI_ALIGNMENT_FRONTEND.md` (páginas, ✅ completado)
Alcance: los 4 modales vivos que renderiza `/parties` + eliminación de legacy muerto

---

## 1. Inventario y estado previo

**Vivos** (referenciados por las páginas migradas de fase 1):

| Archivo legacy | Líneas | Usado por |
|:---------------|-------:|:----------|
| `components/ClientFormModal.jsx` | 373 | `Clients.tsx` |
| `components/ClientDetailsModal.jsx` | 210 | `Clients.tsx` |
| `components/suppliers-directory/SupplierDirectoryFormModal.jsx` | 403 | `Suppliers.tsx` |
| `components/suppliers-directory/SupplierDirectoryDetailsModal.jsx` | 202 | `Suppliers.tsx` |

**Muertos** (cero referencias fuera de sí mismos, verificado por basename en todo `src/`):
`components/ClientModal.jsx`, `ClientDetailModal.jsx`, `DeleteClientModal.jsx`,
`ClientStats.jsx`, `ClientSelector.jsx`, `ClientCardSelector.jsx`, `SupplierModal.jsx`,
`SupplierSelector.jsx`, `SupplierSelectionModal.jsx`, `DeleteSupplierModal.jsx` y los
directorios `components/clients/` y `components/suppliers/` completos.

**Violaciones comunes de los 4 vivos:** modal artesanal `fixed inset-0` (§6.6 dice
`EnhancedModal`), hex en todo, `text-[10px]`/`text-[11px]`, inputs/labels crudos sin
`ui/Input`/`ui/Label`, validación manual sin Zod, y dos bugs:
- `ClientDetailsModal` llama `useNavigate()` antes del early-return → crashea fuera de
  `<Router>` (causa de 3 de los 4 fallos preexistentes de `Clients.page.test.jsx`).
- String hardcoded "Análisis de Riesgo" (violación i18n).

## 2. Decisiones

1. **Feature-Sliced**: los nuevos modales viven en `src/features/party/components/`
   (junto a `QuickClientModal.tsx`). Nombres: `ClientFormModal.tsx`,
   `ClientDetailsModal.tsx`, `SupplierFormModal.tsx`, `SupplierDetailsModal.tsx`.
2. **Zod en `src/domain/party/`**: `clientForm.ts` y `supplierForm.ts` contienen
   schemas (mensajes = claves i18n), normalización form↔API y construcción de payload
   (incluye la regla "solo enviar campos extendidos con valor" y `sanitizeContact`).
   Los componentes no calculan nada.
3. **`EnhancedModal`** como base (overlay, Escape, foco, body-scroll). Formularios
   `size="lg"`, detalles `size="md"`. Footer con `Button secondary` (cancelar) +
   `Button primary` (guardar, con prop `loading`); el submit usa el atributo
   `form="<form-id>"` para vivir fuera del `<form>`.
4. **Detalles con mount-when-open**: el wrapper devuelve `null` si está cerrado ANTES
   de montar el contenido interno (que usa `useNavigate`). Elimina el crash sin Router
   y deja el DOM liviano. Los formularios quedan always-mounted (pasan `isOpen` a
   `EnhancedModal`, que ya retorna `null` internamente) para conservar el reset por
   `useEffect(isOpen)` existente.
5. **Inputs**: `ui/Input` (prop `state="error"` + mensaje `text-error` debajo),
   `ui/Label` con `htmlFor`. Banner de error de submit: `bg-error-container` +
   `text-on-error-container` (§2.3).
6. **i18n**: claves existentes reutilizadas; nuevas: `clients.details.risk_analysis`
   (es/en), `action.save_changes` (es/en). Schemas producen claves, no español.
7. **Páginas**: `Clients.tsx`/`Suppliers.tsx` actualizan imports; APIs de props sin
   cambios (`onClose(shouldRefresh)` etc.).
8. **Legacy muerto**: se eliminan los 4 archivos reemplazados + los 16 archivos
   muertos listados arriba (verificación: build + suite completa en verde).

## 3. Verificación

- `npx tsc --noEmit` (0 errores nuevos), `pnpm lint:design` (código nuevo limpio),
  `pnpm build`, `pnpm test` (≥ baseline: 48 fallos preexistentes; objetivo: los 3
  tests `datastate-*` de `Clients.page.test.jsx` pasan al eliminar el crash de Router),
  grep de hex/clases genéricas en archivos nuevos.
- Navegador: crear/editar cliente, detalles de cliente, crear/editar proveedor,
  detalles de proveedor, validaciones visibles, Escape y click-overlay.

## 4. Fuera de alcance

- Páginas satélite `SupplierAnalysis.jsx` y `ClientCreditProfile.jsx` (siguen legacy).
- `DeleteClientModal.jsx`/`DeleteSupplierModal.jsx` (muertos; la desactivación de
  proveedor usa `ConfirmationModal` ya alineado).

---

## 5. Resultado (2026-09-03)

**Archivos nuevos:** `domain/party/{clientForm,supplierForm,zodErrors}.ts`,
`features/party/components/{ClientFormModal,ClientDetailsModal,SupplierFormModal,
SupplierDetailsModal,DetailField}.tsx`.
**Eliminados:** los 4 .jsx reemplazados + 16 archivos muertos (12 en `components/` +
los directorios `components/clients/` y `components/suppliers/` completos).
**Tocados:** `Clients.tsx`, `Suppliers.tsx` (imports), i18n es/en (`clients.details.
risk_analysis`, `action.save_changes`).

| Check | Resultado |
|:------|:----------|
| `npx tsc --noEmit` | 0 errores nuevos (9 preexistentes de `RegisterSalePaymentModal`) |
| `pnpm lint:design` | ✓ Código nuevo limpio |
| `pnpm build` | ✓ built in 5.65s |
| `pnpm test` | **44 fallos / 443 pasan** (baseline 48): -4 — pasan los 3 tests `datastate-*` de `Clients.page.test.jsx` (desapareció el crash de `useNavigate` sin Router) y `Clients.toasts`. El restante de esa suite espera el texto exacto "Clientes" que la página ya no renderiza en ningún nodo. |
| Navegador | Modal nuevo cliente (validación Zod: 3 errores i18n + `state="error"`), detalles de cliente (badge, "Análisis de Riesgo" i18n), editar proveedor (datos precargados), detalle de proveedor (ID/fechas mono, badge, fallback de dirección legacy). Escape y footer OK. |

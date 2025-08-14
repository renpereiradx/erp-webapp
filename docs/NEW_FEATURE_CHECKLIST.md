# Checklist central para implementar una nueva página (feature)

Fecha: 2025-08-14
Responsable: Equipo Frontend
Estado: Plantilla central

Resumen
- Archivo único que centraliza el checklist mínimo y referencias a los recursos necesarios (documentación y ejemplos) para implementar una nueva página siguiendo el estándar del proyecto.

Cómo usar
1. Crear rama `feature/<feature>-new-ui`.
2. Seguir el checklist mínimo (sección "Checklist rápido") y abrir los recursos enlazados cuando sea necesario.
3. Marcar cada ítem completado antes de solicitar PR review.

Checklist rápido
- [ ] Auditoría rápida del feature (responsabilidades, métricas, deuda)
- [ ] Crear estructura feature (components, modals, hooks, services, store, tests)
- [ ] Extraer/usar primitives: `EditableField`, `useDebouncedValue`, `useFeatureFlag`
- [ ] Implementar store normalizada (byId + order/page), cache SWR-like y `_withRetry`
- [ ] Inline edits optimistas con rollback + bulk operations con confirmación
- [ ] Accesibilidad: `aria-live` announcements, focus restore, keyboard navigation
- [ ] Virtualización si > 50 items (react-virtuoso) o tabla paginada
- [ ] Telemetría mínima instrumentada (latencia, error rate, cache hits)
- [ ] Tests: unit + integration (MSW) + a11y básica
- [ ] i18n: todas las cadenas key-based en `src/lib/i18n.js`
- [ ] Linter / Typecheck / Tests pasan
- [ ] Feature flag para rollout progresivo

Recursos y dónde leer (orden recomendado)
1. Plantilla y checklist base
   - `docs/FEATURE_PAGE_IMPROVEMENT_TEMPLATE.md` — plantilla principal, roadmap y checklist detallado
2. Caché y datos
   - `docs/CACHE_IMPLEMENTATION.md` — estrategia SWR-like, TTLs, LRU trimming
   - `src/store/useProductStore.js` — ejemplo implementado (cache, revalidate, optimistic, retries)
3. Observabilidad y errores
   - `docs/OBSERVABILITY.md` — eventos telemetry, correlación, métricas a recolectar
   - `src/utils/ApiError.js` y `src/utils/errorCodes.js` — normalización de errores
4. Feature flags
   - `docs/FEATURE_FLAGS.md`
   - `src/hooks/useFeatureFlag.js`
5. UI / Accesibilidad / Theming
   - `docs/THEME_GUIDE.md` o `docs/THEME_SYSTEM.md` — tokens y `useThemeStyles`
   - `docs/PRODUCTS_STATES_MATRIX.md` — ejemplos de estados y mensajes
   - `src/components/EditableField.jsx` — inline-edit reutilizable
6. i18n
   - `src/lib/i18n.js` — patrón y diccionarios base
7. Pruebas y herramientas
   - `vitest.setup.ts` (o `vitest.setup`) — MSW + test setup
   - `src/features/<feature>/__tests__/` — ejemplos de tests (buscar `products` tests)
8. Ejemplo concreto / checklist por feature
   - `docs/CHECKLIST_FEATURE_orders.md` — checklist ejemplo para `orders` (ya creado)

Notas rápidas
- Si necesitas un esqueleto de carpetas/archivos para arrancar, puedo crearlo automáticamente (componentes vacíos, hooks y store stub).
- Usa `src/store/useProductStore.js` y `src/features/products/` como referencia de implementación y tests.

---
Archivo creado para centralizar recursos y checklist. Mantener aquí los enlaces y actualizar cuando se agreguen nuevas primitives o docs.

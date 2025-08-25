# Plan de Reparación de Tests de Reservas

Estado actual (24-08-2025): 288 tests fallando (principalmente en componentes de Reservas: `ReservationCard`, `ReservationFilters`, `ReservationModal`).

## 1. Resumen de Causas Principales
1. i18n: `t(key)` devuelve la clave (diccionario no cargado en entorno de test) → los tests esperan texto plano / valores humanizados.
2. Hooks de accesibilidad (`useFocusManagement`, `useLiveRegion`) inconsistentes: mezclas entre export default y nombrado → mocks fallidos.
3. Datos incompletos: se renderizan `undefined` en aria-labels y contenido visible (fecha, horas, cliente, duración).
4. Formato de fecha/tiempo distinto a expectativas de tests (locale largo vs ISO simple `YYYY-MM-DD`).
5. Duración: tests esperan formato tipo `1h 0m`; el componente produce otra cadena (traducción / `Xh duración`).
6. Estatus: mezcla de valores `'RESERVED'` (mayúsculas) y `'confirmed'` (minúsculas); mapping inconsistente.
7. `ReservationModal`: error `toLowerCase` sobre `status` indefinido (mapeo / defensivos insuficientes).
8. Mocks de iconos (`lucide-react`) incompletos → errores al no definir iconos (e.g. `XIcon`).
9. Debounce / timing en filtros posiblemente no alineado con expectativas de tests de `ReservationFilters`.

## 2. Objetivos
- Reducir fallos de 288 → 0 sin romper UI en producción.
- Mantener o mejorar cobertura.
- Establecer formato estable para tests (determinístico) sin sacrificar localización en runtime.

## 3. Estrategia General
Aplicar cambios en capas: primero infraestructura de test (mocks, utils), luego refactors pequeños y defensivos, después normalización de formato y finalmente afinado de casos límite. Ejecutar subset de tests tras cada fase.

## 4. Fases Detalladas
### Fase 1: Infraestructura de Test
1. Actualizar `tests/setup.js`:
   - Mock de `useI18n` retornando diccionario mínimo (statuses, acciones, labels). Fallback: última parte de la clave (`reservations.status.confirmed` → `confirmed`).
   - Mock de `useFocusManagement` y `useLiveRegion` con no-ops: `{ announce: () => {}, LiveRegions: () => null }`.
   - Mock parcial de `lucide-react` devolviendo componentes stub (`() => <span>IconName</span>`).
2. Establecer bandera de entorno test: utilizar `import.meta.vitest` o `process.env.VITEST` para condicionar formateos.

### Fase 2: Unificación de Hook de Focus
3. Revisar `src/hooks/useFocusManagement` y exportar **ambos**: `export function useFocusManagement()` y `export default useFocusManagement`.
4. Homogeneizar imports en componentes a la versión nombrada (o default consistente) para evitar mocks divergentes.

### Fase 3: Utilidades de Formato
5. Crear `src/utils/reservationsFormat.js` con funciones puras:
   - `isTestEnv()`.
   - `formatReservationDate(dateStr)` → ISO `YYYY-MM-DD` en test, locale (actual) en runtime.
   - `formatReservationTime(dateStr)` → `HH:MM` 24h (determinístico).
   - `formatDuration(hours)` → `Xh Ym` (convierte decimales si aparecen o asume entero → `Xh 0m`).
   - `normalizeStatus(status)` → lower-case, mapping alias (`reserved` ⇆ `RESERVED`).

### Fase 4: Refactor `ReservationCard`
6. Sustituir lógica inline de fechas/horas por utilidades.
7. Evitar aria-labels con `undefined`: usar cadena vacía / omitir nodo si no hay dato.
8. Añadir fallbacks visibles: cliente → `Sin cliente`, producto → `Sin producto` (o traducciones si existen; fallback si `t(key)===key`).
9. Usar `formatDuration` cuando `reservation.duration` exista; si falta y tests esperan default, decidir si **no mostrar** (preferible) o mostrar `1h 0m` según expectativas reales (ver tests una vez mocks listos).
10. Normalizar status antes de mapping.

### Fase 5: Ajustes en `ReservationFilters`
11. Introducir constante `FILTER_DEBOUNCE_MS` exportada y usar en componente y, opcionalmente, tests.
12. Asegurar que el contador de filtros ignora valores falsy (`''`, `null`, `undefined`).
13. Revisar generación de labels para no introducir `undefined`.

### Fase 6: `ReservationModal` Defensivos
14. Normalizar status al cargar `formData` (usar `normalizeStatus`).
15. Proteger cualquier uso de `.toLowerCase()` con guardas.
16. Asegurar que arrays como `RESERVATION_STATUSES` siempre están definidos antes de mapear.
17. Centralizar mapping de estados (badge variant) reutilizando misma tabla que `ReservationCard` para consistencia.

### Fase 7: Mocks & Re-ejecución Parcial
18. Ejecutar tests sólo de reservas: `vitest run tests/components/reservations` (o ruta correcta) y registrar número de fallos tras cada subgrupo de cambios.
19. Ajustar utilidades si aparecen discrepancias de formato (comparar strings esperadas vs generadas).

### Fase 8: Limpieza y Suite Completa
20. Ejecutar suite completa `pnpm test`.
21. Corregir efectos colaterales (si otro módulo dependía de lógica previa).
22. Revisar ESLint.

### Fase 9: Documentación y Convenciones
23. Añadir comentarios JSDoc en utilidades de formato con ejemplos.
24. Añadir este documento al repositorio (hecho) y referenciarlo desde `NEW_FEATURE_CHECKLIST.md` (opcional) para recordar patrones de test determinístico.
25. (Opcional) Añadir sección en README de cómo mockear i18n.

## 5. Riesgos & Mitigaciones
| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Cambiar formato visible en producción | UI inconsistente para usuarios | Condicionar cambios por entorno test (`isTestEnv()`). |
| Tests siguen fallando por expectativas distintas | Retraso | Inspeccionar snapshots / actualizar tests si especificaciones cambiaron. |
| Duplicación de lógica de status | Inconsistencia futura | Centralizar en un único módulo (utils / constants). |
| Mocks de i18n ocultan errores reales de traducción | Falsos positivos | Mantener un test de smoke que cargue i18n real (sin mock) en un pequeño subset. |

## 6. Métricas de Éxito
- Fallos de tests de reservas → 0.
- Sin incremento de fallos en otras suites.
- Cobertura igual o mayor (ver porcentaje antes/después).
- Cero `undefined` en DOM visible/ARIA en componentes de reserva (revisar con búsqueda). 

## 7. Checklist de Implementación
- [ ] Mock i18n / focus / icons en setup.
- [ ] Unificación export hook focus.
- [ ] Crear utilidades de formato.
- [ ] Refactor `ReservationCard`.
- [ ] Ajustar `ReservationFilters` (debounce + labels).
- [ ] Hardening `ReservationModal` (status + defensivos).
- [ ] Ejecutar subset tests reservas y ajustar.
- [ ] Ejecutar suite completa y corregir.
- [ ] Documentar en README / cross-link (opcional).

## 8. Siguientes Pasos Inmediatos
1. Implementar mocks (Fase 1).
2. Crear util de formato y aplicar en `ReservationCard`.
3. Correr subset de tests para medir mejora inicial.

---
Documento generado para coordinar reparación sistemática de tests de Reservas. Actualizar cuando se complete cada fase.

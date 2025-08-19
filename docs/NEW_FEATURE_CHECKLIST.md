# Checklist simplificado para nueva página / feature

Fecha: 2025-08-19
Responsable: Equipo Frontend
Estado: Plantilla activa (versión reducida por capacidad limitada)

Resumen
Documento único con el mínimo necesario para entregar un MVP usable rápido y una ruta incremental clara. Todo lo no esencial pasa a fases posteriores para evitar bloqueo mientras seguimos creando páginas.

Fases de implementación
| Fase | Objetivo | Tiempo aprox | Salida clave |
|------|----------|--------------|--------------|
| MVP | Página funcional básica | 1-3 días | Listado + ver detalle / acción primaria |
| Hardening | Robustez + accesibilidad + test mínimo | 1-2 días | Errores claros, i18n, a11y base |
| Optimización | Perf, virtualización, métricas extra | Opcional | Sólo si detectado en métricas |

Checklist MVP (obligatorio)
- [ ] Carpeta `src/features/<feature>/` con: `components/`, `hooks/`, `services/` y `__tests__/` (aunque sea 1 test)
- [ ] Fetch básico con wrapper `_fetchWithRetry` (máx 2 reintentos + backoff simple)
- [ ] Estado local (useState/useReducer) o store mínimo (sin normalizar si < 200 items)
- [ ] Render listado + acción primaria (crear / actualizar / habilitar) según necesidad
- [ ] Cadenas visibles en i18n (`src/lib/i18n.js`) sin hardcodes en JSX (incluye labels internos de cards/resúmenes como DOCUMENTO:, RUC:, REGISTRO:, TOTAL:)
- [ ] Accesibilidad mínima: roles/labels en inputs y botón principal focusable
- [ ] Manejo de error simple: mensaje genérico + botón reintentar
- [ ] Telemetría mínima: evento `feature.<feature>.load` (duración) y `feature.<feature>.error`
- [ ] 1 test unit (servicio o hook) + 1 test render básico (smoke)
- [ ] Linter y build pasan
 - [ ] (Recomendado) Usar `<DataState variant="loading" />` para placeholder inicial

Checklist Hardening (hacer después si MVP estable)
- [ ] Normalizar datos (byId + ids) si se añaden mutaciones múltiples
- [ ] Inline edit optimista solo para campos críticos (diferir bulk)
- [ ] Estados UI unificados (Loading / Empty / Error) reutilizando componentes comunes
 - [ ] Sustituir cualquier implementación ad-hoc por `<DataState>` con `skeletonVariant` adecuado
- [ ] i18n: placeholders / tooltips y labels internos restantes extraídos
- [ ] Focus management tras acciones (crear / cerrar modal)
- [ ] Telemetría: agregar `errorCode` y `latencyMs`
- [ ] Test de error y de actualización (mock 200 + mock 500)

Checklist Optimización (opt-in según señales)
- [ ] Virtualización si lista > 300 elementos o FPS < 50
- [ ] Cache con TTL si se observa fetch repetido (>30% duplicado en 2 min)
- [ ] Prefetch siguiente página si scroll > 80%
- [ ] Métricas extra: hit ratio, p50/p95 (solo si hay panel activo)

Qué se ha pospuesto globalmente
- Bulk operations complejas (se implementan puntualmente donde justifique)
- Panel métricas extendido (solo productos por ahora)
- Circuit breaker específico por feature (uso global cuando esté estable)
- Cola offline (se integrará primero en features críticas)

Plantilla carpeta mínima
```
src/features/<feature>/
   components/
      <Feature>MainView.jsx
   hooks/
      use<Feature>Data.js
   services/
      <feature>Api.js
   __tests__/
      <feature>.smoke.test.jsx
      <feature>.service.test.js
```

Convenciones rápidas
- Eventos telemetry: `feature.<feature>.*`
- Claves i18n: `<feature>.title`, `<feature>.error.generic`, `<feature>.action.primary`
- Evitar premature optimization (no virtualización ni normalización si no hay necesidad)
 - Estados: `<DataState variant="loading|empty|error" skeletonVariant="list|productGrid" />`

Recursos (orden recomendado)
1. `docs/FEATURE_PAGE_IMPROVEMENT_TEMPLATE.md` (si se requiere profundizar)
2. `docs/CACHE_IMPLEMENTATION.md` (solo al entrar en Optimización)
3. `docs/OBSERVABILITY.md` (telemetría extra opcional)
4. `docs/FEATURE_FLAGS.md` (si se gatea la página)
5. `src/features/products/` (referencia completa – usar selectivamente)

Preguntas rápidas de decisión
| Pregunta | Si Sí | Si No |
|----------|-------|-------|
| ¿>300 items potenciales? | Evaluar virtualización | Mantener listado simple |
| ¿Fetch repetido mismo payload? | Introducir cache TTL | Seguir sin cache |
| ¿Errores frecuentes? | Añadir códigos/hints | Mantener mensaje genérico |
| ¿Necesidad edición rápida? | Implementar inline básico | Modal o formulario dedicado |

Notas
- Preferir entregar MVP navegable antes que completar Hardening.
- Documentar en el PR qué parte se dejó para Hardening / Optimización.

---
Mantener este documento corto. Cualquier crecimiento moverlo a docs más específicas.

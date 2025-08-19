# Feature Page Improvement Template (Versión Simplificada)

Fecha: YYYY-MM-DD  
Responsable: Equipo Frontend  
Estado: Plantilla activa simplificada

Objetivo
Permitir crear / mejorar páginas rápido (MVP) sin bloqueo por complejidad avanzada, dejando claro qué se hace después (Hardening / Optimización) sólo si aporta valor.

Fases
| Fase | Meta | Incluye | Evita |
|------|------|---------|-------|
| MVP | Página usable | Listado + acción primaria + errores básicos + i18n visible | Virtualización, cache compleja, bulk, inline avanzado |
| Hardening | Robustez | Estados UI unificados, mejores errores/hints, accesibilidad base, 2 tests extra | Perf micro, panel métricas extendido |
| Optimización | Escala | Virtualización, cache TTL, prefetch, métricas avanzadas | Nuevas features funcionales |

Checklist MVP (Obligatorio)
- Carpeta `src/features/<feature>/` con `components/`, `hooks/`, `services/`, `__tests__/`
- Listado o vista principal (tabla/lista/cards) + acción primaria (crear o actualizar)
- Fetch simple con retry ligero (máx 2) y abort (AbortController)
- Mensaje de error genérico + botón Reintentar
- Todas las cadenas visibles en i18n (`<feature>.*`)
- Accesibilidad mínima: role correcto + labels en inputs + foco visible
- Telemetría básica: `feature.<feature>.load` (duración) y `feature.<feature>.error`
- 1 test smoke render + (si hay mutación) 1 test de éxito/fracaso
- Linter / build pasan
 - (Opcional pero recomendado) Uso inicial de `DataState` para evitar duplicar placeholders

Checklist Hardening (Cuando MVP estable)
- Estados: Loading / Empty / Error reutilizando componentes compartidos
  - Implementar `DataState` (+ `skeletonVariant="productGrid|list"`) en lugar de estados ad-hoc
  - Usar wrapper tokenizado `.data-state-wrapper` (spacing vía `--ds-spacing-y`)
- Hints de error (mapear código → mensaje recuperable)
- Focus management (tras cerrar modal vuelve al trigger)
- i18n: placeholders y tooltips restantes extraídos
- Telemetría: añadir `latencyMs` y `errorCode`
- Tests: añadir caso de error HTTP + caso de lista vacía

Checklist Optimización (Sólo si señales)
- Virtualización si >300 ítems o FPS < 50
- Cache TTL si el mismo fetch se repite >30% en 2 min
- Prefetch siguiente página al 80% scroll
- Métricas panel: hitRatio, p50/p95 si flag activo

Preguntas Rápidas de Decisión
| Pregunta | Sí | No |
|----------|----|----|
| ¿Lista grande (>300)? | Virtualizar (Optimización) | Mantener simple |
| ¿Fetch repetido? | Añadir cache TTL | Ignorar |
| ¿Ediciones muy frecuentes? | Inline básico (Hardening) | Modal |
| ¿Errores confunden usuarios? | Añadir hints | Dejar genérico |

Estructura Mínima
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
```

Convenciones
- i18n: `<feature>.title`, `<feature>.error.generic`, `<feature>.action.primary`
- Telemetría: `feature.<feature>.load|error|update-success`
- No normalizar datos hasta necesitar filtros complejos o updates parciales
- Estados unificados: usar `<DataState variant="loading|empty|error" skeletonVariant="list|productGrid" />`

Ejemplo rápido DataState
```jsx
import DataState from '@/components/ui/DataState';

// Loading (lista genérica)
{loading && <DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 6 }} />}

// Empty (sin resultados)
{!loading && items.length === 0 && (
  <DataState
    variant="empty"
    title={t('orders.empty.title')}
    description={t('orders.empty.desc')}
    actionLabel={t('orders.empty.create')}
    onAction={handleCreate}
  />
)}

// Error (con hint)
{error && (
  <DataState
    variant="error"
    code={error.code}
    hint={error.hintKey}
    onRetry={refetch}
  />
)}
```

Contrato Básico de Datos (Recomendado)
`fetch<Feature>List(params) -> { items: [], total }`  (Error lanza ApiError { code?, message })

Criterios Salida de MVP
- Listado operativo + acción primaria funcional
- Errores manejados (sin pantalla rota)
- i18n completo para textos visibles
- 1–2 eventos telemetry enviados
- Smoke test pasa en CI

Guía de Evolución
1. Entregar MVP rápido (1–3 días)
2. Registrar fricciones reales de usuarios / QA
3. Aplicar Hardening sólo a problemas observados
4. Optimizar únicamente tras detectar señal (perf/logs)

Formato de Estado por Feature (añadir al doc global si se desea)
```
<Feature>: Fase=MVP|Hardening|Optimización | Próximo Paso=... | Riesgo=...
```

Avanzado (Mover a docs especializadas si se reintroduce)
- Virtualización, cola offline, circuit breaker, bulk avanzado, panel métricas detallado, mappers formales, storybook states.

Notas
- Evitar crecimiento de este template; ampliar siempre en documentos específicos.
- El contenido completo anterior está disponible en historial git si se necesita.

---
Última simplificación: 2025-08-19

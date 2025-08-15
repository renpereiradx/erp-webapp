# ✅ / ⏳ / 🚧 Pendientes Feature Productos

Documento vivo que consolida los elementos restantes tras la primera fase de refactor / mejora de la página **Products**.

## Leyenda Prioridad
- P0: Bloqueante / alto impacto usuario / riesgo regresión
- P1: Mejora importante UX, accesibilidad o robustez
- P2: Optimización, deuda técnica o nice-to-have

## Resumen Ejecutivo
Primera fase completada: caching SWR, resiliencia (retry + circuito), edición inline básica, accesibilidad inicial (aria-live + navegación teclado), telemetría granular, i18n base y banner offline. Falta cerrar la experiencia completa (estados unificados, i18n total, panel métricas, E2E, slices store) y extender patrones al resto de features.

---
## 1. Accesibilidad (A11y)
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Anuncios de error específicos | Mensajes aria-live diferenciando error de red vs validación — Parcial: se añadieron claves i18n y mejoras en aria-labels/inputs; falta separar y anunciar explícitamente errores de red vs validación y reconexión | P1 |
| ⏳ | Focus trap modales mejorado | Asegurar ciclo focus dentro de diálogo y retorno consistente — Modales actuales respetan trap básico; queda cerrar la restauración de foco y pruebas de teclado | P1 |
| ⏳ | Orden de tab optimizado | Revisar tabIndex en grid virtualizado y acciones inline — Pendiente auditoría de tabIndex y navegación en lista virtualizada | P2 |
| ⏳ | Aria offline/hidratación | Banner offline implementado (visual + retry); falta aria-label más descriptivo y announce de reconexión para ATs | P2 |

## 2. Edición Inline
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ✅ | Validaciones i18n | Claves agregadas (precio, stock, requerido) | - |
| ✅ | Flash éxito | Resaltado verdoso temporal tras guardar | - |
| ⏳ | Undo rápido | Botón/tecla para revertir último patch (guardar snapshot previo) | P2 |
| ⏳ | Foco tras guardar | Volver foco al primer campo / botón editar según heurística | P2 |

## 3. Resiliencia y Rendimiento
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ✅ | Jitter en backoff | +/-30% agregado a retry | - |
| ⏳ | Circuit breaker | Circuit breaker implementado en el store; ajustes de cooldown/timers y sincronización con fake-timers en tests en curso (se observan falseos en test de cierre) | P1 |
| ⏳ | Test expiración TTL real | Test que espere > TTL y verifique refetch | P1 |
| ⏳ | Panel métricas UI | Mini panel (hits/misses, ratio, FPS, fallos circuito) | P2 |
| ⏳ | Prefetch predictivo | Basado en scroll / near end para siguiente página | P2 |

## 4. Internacionalización
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Extraer cadenas restantes | Textos de placeholders, tooltips, banners, paginación | P1 |
| ⏳ | Traducción hints ApiError | Mapear hint por código + i18n | P1 |
| ⏳ | Soporte cambio de idioma runtime global | Toggle en UI y persistencia (localStorage) | P2 |

## 5. Telemetría / Observabilidad
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ✅ | Eventos rollback (bulk/inline) | Integrados (rollback) | - |
| ⏳ | Contadores agregados UI | Mostrar errorCounters por código | P1 |
| ⏳ | Dashboard interno | Script/mini vista resumiendo latencias, ratio cache | P2 |
| ⏳ | Tipado eventos | Definir typings (TS o JSDoc) para claves de eventos | P2 |

## 6. API / Errores
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Mostrar código/error hint | Toast / banner con (código + hint traducida) | P1 |
| ⏳ | Acciones rápidas en error | Reintentar, limpiar caché, modo diagnóstico | P2 |

## 7. UI / UX General
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Skeletons / Empty / Error unificados | Componentes reutilizables y theming | P1 |
| ⏳ | Infinite scroll opcional | Flag para sustituir paginación manual | P2 |
| ⏳ | Persistencia selección | Mantener selectedIds al cambiar página / refetch | P2 |
| ⏳ | Limpieza backups | Remover archivos *_backup / _old redundantes | P2 |
| ✅ | Banner offline | Implementado con retry | - |
| ⏳ | Badge modo offline en cards | Indicar datos potencialmente stale | P3 |

## 8. Arquitectura / Código
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Slices del store | productsSlice, categoriesSlice, uiSlice | P2 |
| ⏳ | Migración a TypeScript (store + services) | Tipos de producto, eventos, errores | P1 |
| ⏳ | Selectores derivados | selectActiveProducts, selectLowStock, memoization | P2 |
| ✅ | Fetch abortable | AbortController integrado | - |
| ⏳ | Tipado eventos telemetry | Unión de literales / enum central | P2 |

## 9. Pruebas
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Test expiración TTL | Simular aged cache y confirmar refetch | P1 |
| ⏳ | E2E flujo completo (Playwright) | Crear, buscar, editar inline, bulk, offline | P1 |
| ⏳ | Auditoría AXE automatizada | Validar aria, roles, contraste | P1 |
| ⏳ | Test infinite scroll | Una vez implementado | P2 |
| ✅ | Test harness: archivo vacío corregido | Se añadió placeholder para `inlineEdit.rollback.test.jsx` para evitar fallo de ejecución; revisar si debe transformarse en caso de prueba real | - |

## 10. Documentación
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Actualizar template con aprendizajes | Añadir secciones offline, rollback, jitter | P2 |
| ⏳ | Guía i18n | Convenciones de claves, pluralización futura | P2 |
| ⏳ | Guía UI de errores | Tabla códigos → mensajes → acciones | P2 |
| ⏳ | Guía offline | Estados, métricas, recovery manual | P2 |

## 11. Feature Flags
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ⏳ | Flag infiniteScroll | `productsInfiniteScroll` | P2 |
| ⏳ | Estrategia rollout | % usuarios / entornos / cookie | P2 |

## 12. Offline / Degradación
| Estado | Ítem | Detalle | Prioridad |
|--------|------|---------|-----------|
| ✅ | Snapshot local listado | Persistencia última lista | - |
| ⏳ | Cola acciones offline (optimista) | Encolar updates y reenviar al reconectar | P1 |
| ⏳ | Etiqueta stale | Mostrar si snapshot > TTL | P2 |
| ⏳ | Reintento automático con backoff al volver online | Hook de reconexión | P2 |

---
## Siguiente Lote Recomendado (Sprint Corto)
1. (P0/P1) Test TTL expiración + mostrar códigos/hints en UI.
2. (P1) Unificar componentes Empty/Error/Skeleton + extraer todas las cadenas a i18n.
3. (P1) E2E + AXE básico.
4. (P2) Panel métrico simple (cache hits/misses + circuito + FPS).

## Métricas de Cierre de Próximo Sprint
- Cobertura tests críticos > 75% en carpeta products.
- Ratio cache hit inicial > 0.5 (tras calentamiento).
- 0 errores AXE críticos.
- < 2s TTFB promedio productos (medición local simulada / telemetría).

---
## Notas Técnicas
- Añadir jitter ya reduce thundering herd; evaluar decorrelación adicional (Full Jitter / Equal Jitter) si hay picos.
- Para slices Zustand: migrar creando `createProductsSlice` y combinando con `create()` + shallow selectors.
- Para E2E: reutilizar datos fake + interceptar network (msw/playwright route).

---
Última actualización: _auto-generado_.

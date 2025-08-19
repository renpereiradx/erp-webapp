---
name: Nueva Página / Feature (MVP -> Hardening -> Optimización)
about: Crear o mejorar una página siguiendo el flujo simplificado por fases
labels: feature,new-page
assignees: ''
---

## Contexto
Describe brevemente el objetivo de la página (usuarios, acción primaria, dato crítico).

## Fase Actual
Selecciona: `MVP` | `Hardening` | `Optimización`

## Alcance de Esta Issue
- (Lista concreta de lo que entra en esta issue – evitar “todo”)

## Checklist Fase MVP (obligatorio para cierre de MVP)
- [ ] Carpeta `src/features/<feature>/` creada (components/hooks/services/__tests__)
- [ ] Listado / vista principal renderiza datos reales
- [ ] Acción primaria funciona (crear / actualizar / activar)
- [ ] Errores básicos muestran mensaje + botón Reintentar
- [ ] Cadenas visibles en i18n `<feature>.*`
- [ ] Telemetría: evento load (duración) + error
- [ ] 1 test smoke + (si muta) test éxito/fracaso
- [ ] Linter / build pasan

## Hardening (si aplica en esta issue)
- [ ] Estados UI unificados (Loading/Empty/Error)
- [ ] Hints de error por código
- [ ] Focus vuelve al trigger tras cerrar modal
- [ ] i18n placeholders/tooltips
- [ ] Telemetría con latencyMs + errorCode
- [ ] Tests extra: error HTTP + lista vacía

## Optimización (solo si justificado)
- [ ] Virtualización (>300 ítems o FPS < 50)
- [ ] Cache TTL (fetch repetido >30%)
- [ ] Prefetch siguiente página (>80% scroll)
- [ ] Métricas p50/p95 + hitRatio (flag panel)

## Riesgos / Suposiciones
- Riesgo principal:
- Suposiciones:

## Métrica(s) a Observar (si Hardening/Optimización)
- Ej: latencia p50, FPS, error rate

## Criterio de Cierre de Esta Issue
Claridad de cuándo se considera DONE (ej: “MVP listo y deploy a staging”).

## Notas / Follow-ups
Puntos diferidos que NO bloquean cierre (crear issues separadas).

---
Guía rápida: entrega MVP primero; sólo añade Hardening si hay fricción real; Optimización tras evidencia en métricas.

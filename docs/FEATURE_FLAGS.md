# Feature Flags Productos

| Flag | Descripción | Default |
|------|-------------|---------|
| newInlineEdit | Habilita edición inline avanzada | true |
| enhancedTelemetry | Envia snapshots perf y eventos extra | true |
| infiniteScroll | Reemplaza paginación por scroll infinito | false |

## Uso
```javascript
const [enabled, setFlag] = useFeatureFlag('newInlineEdit');
```
Persistencia en localStorage (clave `feature.flags.v1`).

## Extensiones Futuras
- Remote config (fetch flags desde backend)
- Segmentación por rol/tenant
- Estrategia gradual (rollout %) 

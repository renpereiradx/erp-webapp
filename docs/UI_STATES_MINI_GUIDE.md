# Mini Guía: Estados de Datos Unificados (Loading / Empty / Error)

Fecha: 2025-08-19  
Responsable: Frontend  
Scope: TODAS las páginas con listados, formularios iniciales y vistas de datos (incluye placeholders, labels internos y contadores).

## 1. Objetivo
Eliminar duplicación visual y lógica para estados de carga, vacíos y error; reducir tiempo de implementación y facilitar consistencia (spacing, a11y, i18n, theming).

## 2. Componente Central
`DataState` (`src/components/ui/DataState.jsx`)

Props clave:
| Prop | Tipo | Default | Uso |
|------|------|---------|-----|
| `variant` | 'loading' \| 'empty' \| 'error' | 'empty' | Determina rama de render |
| `skeletonVariant` | 'productGrid' \| 'list' | 'productGrid' | Ajusta placeholder visual |
| `skeletonProps` | object | `{}` | Passthrough (ej: `{ count: 6 }`) |
| `title` / `description` | string | - | Texto para estado Empty o título Error custom (siempre vía i18n) |
| `actionLabel` / `onAction` | string / fn | - | CTA en Empty |
| `code` / `hint` | string | - | Mostrar error técnico + hint traducida |
| `onRetry` | fn | - | Botón reintentar en Error |
| `testId` | string | - | Testing estable |

## 3. Skeletons Disponibles
| `skeletonVariant` | Escenario recomendado |
|-------------------|-----------------------|
| `productGrid` | Grids de cards / productos / mini paneles |
| `list` | Tablas, listas verticales, paneles lineales |

`GenericSkeletonList` acepta `count`, `lineHeight`, `gap`, `rounded`.

## 4. Wrapper y Spacing
Clase estandarizada: `.data-state-wrapper`  
Token CSS: `--ds-spacing-y` (default igual a `py-20`).  
→ Permite ajuste global sin tocar JSX.

## 5. Patrones de Uso
### Loading
```jsx
{loading && (
  <DataState variant="loading" skeletonVariant="list" skeletonProps={{ count: 5 }} />
)}
```

### Empty (inicial)
```jsx
{!loading && items.length === 0 && !searchTerm && (
  <DataState
    variant="empty"
    title={t('orders.empty.title')}
    description={t('orders.empty.desc')}
    actionLabel={t('orders.empty.new')}
    onAction={openCreate}
  />
)}
```

### Empty (sin resultados búsqueda)
```jsx
{!loading && items.length === 0 && searchTerm && (
  <DataState
    variant="empty"
    title={t('common.no_results')}
    description={t('common.no_results_for', { term: searchTerm })}
  />
)}
```

### Error
```jsx
{error && (
  <DataState
    variant="error"
    code={error.code}
    hint={error.hintKey}
    message={error.message}
    onRetry={refetch}
  />
)}
```

## 6. Checklist Migración (por página)
- [ ] Sustituir implementaciones ad-hoc de loading/empty/error por `DataState`.
- [ ] Elegir `skeletonVariant` correcto (`list` para filas / paneles lineales, `productGrid` para cards).
- [ ] Extraer TODOS los textos (title, description, actionLabel, hints) a i18n (`<feature>.empty.title` ...).
- [ ] Extraer también labels internos de cards/resumen (DOCUMENTO:, RUC:, REGISTRO:, SUBTOTAL) a i18n para evitar rezagos (hecho en clients/suppliers/purchases/booking).
- [ ] Añadir `testId` estable (convención: `<feature>-loading|empty|error[-context]`).
- [ ] Verificar único `aria-live` en página (contenedor padre, no el skeleton).
- [ ] Eliminar CSS duplicado (usar `.data-state-wrapper` + token).
- [ ] Test: contar skeleton items + verificar título empty + retry dispara callback.

## 7. Accesibilidad
- `DataState` no fuerza roles; el contenedor puede estar dentro de una región `role="status"` externa si se requiere anuncio.
- Mantener un único `aria-live` por página para evitar spam de AT.
- En error distinguir `code` y `hint` (hint traducida). Claves sugeridas: `errors.<code>.hint`.

## 8. Testing Rápido (Vitest + RTL)
```jsx
import { render, screen } from '@testing-library/react';
import DataState from '@/components/ui/DataState';

test('render list skeleton count', () => {
  render(<DataState variant="loading" skeletonVariant="list" testId="orders-loading" skeletonProps={{ count: 3 }} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
});

test('render empty title', () => {
  render(<DataState variant="empty" title="Nada" description="Desc" />);
  expect(screen.getByText('Nada')).toBeInTheDocument();
});
```

## 9. Telemetría (Opcional)
No emitir eventos dentro de `DataState`. Emite en la capa que resuelve datos / store:
- `feature.<feature>.load` (duración)
- `feature.<feature>.error` (code, latencyMs)
- (Opcional Hardening) `feature.<feature>.empty` si es insight útil para UX.

## 10. Anti-Patrones
| Anti Patrón | Solución |
|-------------|----------|
| `<p>Cargando...</p>` suelto | `DataState variant="loading"` |
| 3 bloques duplicados para empty | Un solo `DataState` + condiciones previas |
| Esconder error sin acción | Mostrar `onRetry` si la operación es reintetable |
| Skeletons distintos por capricho | Añadir prop a skeleton existente o mejorar generic, no crear otro |

## 11. Extensión Futura
- `skeletonVariant="table"` (si aparece necesidad real).
- Prop `ariaLabel` opcional para personalizar en loading.
- Animaciones reducidas según preferencia usuario (prefers-reduced-motion).

## 12. Resumen TL;DR
`DataState` centraliza Loading/Empty/Error con skeleton parametrizable y estilos consistentes. Todo texto (incluyendo labels de tarjetas y resúmenes) va a i18n. Un wrapper `.data-state-wrapper` + token de spacing eliminan divergencias. Tests mínimos: skeleton count, empty title, retry callback. No crear variantes visuales arbitrarias: extender props o `GenericSkeletonList`.

---
Última actualización: 2025-08-19 (i18n extendido: clients, suppliers, purchases, booking/login)

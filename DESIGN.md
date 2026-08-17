---
name: Precision Air
# ─────────────────────────────────────────────────────────────────────────────
# FUENTE DE VERDAD DE TOKENS: tailwind.config.js
# Este frontmatter es SOLO documentación. En el código NUNCA se escriben estos
# hex: se usan las clases Tailwind ya generadas (ver tablas en el cuerpo).
# ─────────────────────────────────────────────────────────────────────────────
colors:
  surface: '#f8f9ff'
  surface-dim: '#d7dae2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fc'
  surface-container: '#ebeef6'
  surface-container-high: '#e5e8f1'
  surface-container-highest: '#dfe2eb'
  on-surface: '#181c22'
  on-surface-variant: '#414753'
  inverse-surface: '#2d3137'
  inverse-on-surface: '#eef1f9'
  outline: '#717785'
  outline-variant: '#c1c6d5'
  surface-tint: '#005eb4'
  primary: '#005baf'
  on-primary: '#ffffff'
  primary-container: '#0074db'
  on-primary-container: '#fefcff'
  inverse-primary: '#a8c8ff'
  secondary: '#455f89'
  on-secondary: '#ffffff'
  secondary-container: '#b3cdfd'
  on-secondary-container: '#3c5780'
  tertiary: '#964400'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc5700'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a8c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#004689'
  secondary-fixed: '#d6e3ff'
  secondary-fixed-dim: '#adc7f7'
  on-secondary-fixed: '#001b3c'
  on-secondary-fixed-variant: '#2c4770'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#ffb68c'
  on-tertiary-fixed: '#321200'
  on-tertiary-fixed-variant: '#753400'
  background: '#f8f9ff'
  on-background: '#181c22'
  surface-variant: '#dfe2eb'
  # Estados semánticos (definidos en tailwind.config.js)
  success: '#107c10'
  warning: '#d83b01'
  info: '#005baf'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '900'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '800'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  data-mono:
    fontFamily: Source Code Pro   # clase: font-data-mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-tabular:
    fontFamily: JetBrains Mono    # clase: font-data-tabular (alineación tabular estricta)
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:        # escala REAL en tailwind.config.js
  xs: 4px       # rounded-xs  → chips pequeños
  sm: 8px       # rounded-sm  → componentes pequeños
  input: 8px    # rounded-input → inputs
  button: 10px  # rounded-button → botones
  md: 12px      # rounded-md  → cards, tablas (DEFAULT estructural)
  lg: 16px      # rounded-lg
  xl: 24px      # rounded-xl  → modales
  full: 9999px  # rounded-full → badges, pills, avatares
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 24px
  margin-page: 40px
  container-max: 1440px
---

# DESIGN.md — Precision Air

Guía operativa para generar UI en este proyecto. Está escrita para ser **ejecutable**:
cada regla apunta a una clase Tailwind o a un componente que YA EXISTE.

**Audiencia:** modelos de IA y desarrolladores. Léela así:

1. Lee las **Reglas inviolables** (§1). No hay excepciones.
2. Cuando necesites un estilo, busca la tabla correspondiente (§2–§5) y **copia la clase exacta**.
3. Cuando necesites un componente, copia la **receta** (§6) y ajusta el contenido.
4. Antes de terminar, pasa el **checklist** (§10).

**Fuentes de verdad (en este orden):**

| Qué | Dónde |
|:----|:------|
| Tokens (colores, radios, sombras, spacing, tipografía) | `tailwind.config.js` |
| Componentes base | `src/components/ui/` |
| Reglas de uso (cuándo usar qué) | Este archivo |

Si este archivo contradice al config o a un componente, **ganan el config y el componente**. Corrige este archivo.

**Marca en 3 líneas:** ERP profesional de alta densidad de datos. Sensación de "aire"
mediante espaciado generoso y fondos claros, NUNCA mediante decoración. La jerarquía se
construye con peso tipográfico y tono de superficie, no con bordes ni sombras fuertes.

---

## 1. Reglas inviolables

1. **NUNCA** escribas hex o rgba en el código (`bg-[#005baf]`, `text-[#181c22]`). Usa las clases semánticas de las tablas §2. (Excepción: componentes legacy ya escritos; código nuevo, NUNCA.)
2. **NUNCA** crees un componente que ya existe en `src/components/ui/`. Antes de construir, mira esa carpeta. Importa y extiende con `className`.
3. **NUNCA** hardcodees texto de UI. Todo string visible pasa por i18n:
   ```jsx
   import { useI18n } from '@/lib/i18n'
   const { t } = useI18n()
   <h1>{t('products.title')}</h1>
   ```
4. **NUNCA** pongas lógica de negocio o cálculos en componentes. Van en `src/domain/<feature>/`.
5. **SIEMPRE** archivos nuevos en `.tsx` / `.ts`. Nunca `.jsx` / `.js`.
6. **SIEMPRE** números, importes, fechas e IDs con `text-data-mono font-data-mono`.
7. **SIEMPRE** un solo botón `variant="primary"` por vista. El resto: `secondary`, `ghost` o `link`.
8. **SIEMPRE** cubre los 3 estados de datos: loading, empty, error (receta §6.7).
9. **NUNCA** uses gradientes, sombras pesadas (`shadow-xl`, `shadow-2xl`), ni animaciones > 300ms.
10. **SIEMPRE** espaciado con tokens (`p-md`, `gap-lg`, `space-y-md`). Nunca valores arbitrarios (`p-[13px]`) si existe token.

---

## 2. Color: qué clase usar y cuándo

### 2.1 Fondos y superficies (capas)

| Necesidad | Clase | Hex | Regla |
|:----------|:------|:----|:------|
| Fondo de página | `bg-background` | `#f8f9ff` | SIEMPRE el lienzo base. Nunca blanco puro ni grises de Tailwind. |
| Card, modal, panel principal | `bg-surface-container-lowest` | `#ffffff` | El contenido "flota" sobre el fondo. |
| Sidebar, zona secundaria, header de tabla | `bg-surface-container-low` | `#f1f3fc` | Separación sutil sin bordes. |
| Hover de filas / estados sutiles | `bg-surface-container-low` | `#f1f3fc` | Mismo token, contexto hover. |
| Fondo de badge neutro / disabled | `bg-surface-container` | `#ebeef6` | — |
| Zona inerte muy marcada | `bg-surface-container-high` | `#e5e8f1` | Uso raro. Si dudas, no lo uses. |

> Jerarquía de capas: `background` (página) → `surface-container-low` (zonas) → `surface-container-lowest` (cards). Ese es todo el sistema de profundidad.

### 2.2 Texto

| Necesidad | Clase | Hex | Regla |
|:----------|:------|:----|:------|
| Texto principal | `text-on-surface` | `#181c22` | DEFAULT para todo texto. |
| Texto secundario, metadata, captions | `text-on-surface-variant` | `#414753` | Máx. ~30% del texto en pantalla. |
| Texto sobre botón/fondo primary | `text-on-primary` | `#ffffff` | Solo encima de `bg-primary`. |
| Texto de error | `text-error` | `#ba1a1a` | Mensajes de validación. |
| Texto sobre `error-container` | `text-on-error-container` | `#93000a` | — |
| Texto de éxito | `text-success` | `#107c10` | Confirmaciones. |
| Texto de advertencia | `text-warning` | `#d83b01` | Alertas no bloqueantes. |

> NUNCA uses `text-gray-*` / `text-slate-*` en código nuevo. Usa `text-on-surface` o `text-on-surface-variant`.

### 2.3 Acciones y estados semánticos

| Intención | Fondo | Texto encima | Uso |
|:----------|:------|:-------------|:----|
| Acción principal | `bg-primary` / hover `bg-primary-container` | `text-on-primary` | 1 por vista (ver §6.1, preferir `<Button>`). |
| Éxito | `bg-success` | `text-white` | Confirmado, pagado, activo. |
| Advertencia | `bg-warning` | `text-white` | Pendiente, stock bajo. |
| Error / destructivo | `bg-error` | `text-on-error` | Eliminar, vencido. |
| Error suave (banner inline) | `bg-error-container` | `text-on-error-container` | Alertas dentro de cards. |

### 2.4 Bordes

| Necesidad | Clase | Regla |
|:----------|:------|:------|
| Borde sutil estándar | `border-border-subtle` | DEFAULT. Token del tema activo. |
| Borde estructural visible | `border-outline-variant` (`#c1c6d5`) | Separadores de tabla, divisores. |
| Borde de input | Ya incluido en `<Input>` | No lo redefinas. |

> Los bordes NO elevan. Para separar una card del fondo usa sombra whisper (§5), no borde grueso.

---

## 3. Tipografía

Todas las clases de tamaño ya incluyen `fontSize + lineHeight + fontWeight (+ letterSpacing)`. **No las combines con `font-bold` ni `text-sm` sueltos.**

| Necesidad | Clase | Spec | Regla |
|:----------|:------|:-----|:------|
| Hero de dashboard (raro) | `text-display-lg` | 48/56 · 900 | Máx. 1 por app. |
| Título de página | `text-headline-lg` | 32/40 · 800 | 1 por página. En móvil: `text-headline-lg-mobile`. |
| Título de card / modal / sección | `text-title-md` | 20/28 · 700 | — |
| Texto destacado / intro | `text-body-lg` | 16/24 · 400 | — |
| **Texto por defecto** | `text-body-md` | 14/20 · 400 | Si dudas, usa este. |
| Énfasis en body | `text-body-md-bold` | 14/20 · 700 | — |
| Label de botón / texto pequeño | `text-body-sm-bold` | 12/16 · 600 | NADA por debajo de 12px. |
| Números, importes, fechas, IDs | `text-data-mono font-data-mono` | 14/20 · 500 | OBLIGATORIO en datos. |
| Columnas numéricas que deben alinear | `text-data-tabular font-data-tabular` | 14/20 · 400 | Tablas financieras densas. |
| Header de tabla / label en mayúsculas | `text-label-caps uppercase` | 11/16 · 700 · +0.05em | Solo headers y micro-labels. |

Reglas:

- Familia por defecto: **Inter** (ya es `font-sans`). No declares `font-family` salvo para datos mono.
- Escala móvil: los títulos de página bajan un nivel en `< md` (`text-headline-lg-mobile`).
- NUNCA uses `text-xs`, `text-2xl` ni la escala genérica de Tailwind en código nuevo: usa las clases semánticas de la tabla.

---

## 4. Espaciado y layout

Tokens de espaciado (útiles como `p-*`, `px-*`, `py-*`, `m-*`, `gap-*`, `space-y-*`):

| Token | Valor | Uso típico |
|:------|:------|:-----------|
| `xs` | 4px | Icono ↔ texto, ajustes finos. |
| `sm` | 8px | Entre label e input, elementos muy relacionados. |
| `md` | 16px | **DEFAULT.** Dentro de cards densas, entre campos de formulario, gaps de grid. |
| `lg` | 24px | Padding estándar de card, gutters de layout. |
| `xl` | 48px | Separación entre secciones de página. |
| `gutter` | 24px | Entre columnas de grid. |

**Estructura de página estándar (copia esto):**

```jsx
<div className="min-h-screen bg-background">
  <div className="mx-auto w-full max-w-container-max px-md lg:px-lg">
    {/* contenido de página: secciones separadas con space-y-xl */}
  </div>
</div>
```

Reglas:

- Contenedor centrado: `max-w-container-max` (1440px). NUNCA páginas a ancho completo sin límite.
- Márgenes de página: `px-md` (16px) en móvil, `lg:px-lg` (24px) en desktop.
- Entre secciones de una página: `space-y-xl` (48px).
- Dentro de una card: padding `p-lg` (24px); si es tabla densa o toolbar, `p-md` (16px).
- Entre campos de formulario: `space-y-md` (16px). Label ↔ input: `space-y-sm` o `gap-xs`.
- Si dudas entre dos tamaños, usa el MAYOR. Este sistema prefiere aire a densidad.

---

## 5. Radios, sombras y glass

### Radios (por componente — tabla cerrada, no improvises)

| Elemento | Clase | px |
|:---------|:------|:---|
| Card, panel, contenedor de tabla | `rounded-md` | 12 |
| Botón | `rounded-button` | 10 |
| Input, select, textarea | `rounded-input` | 8 |
| Chip pequeño / tag cuadrado | `rounded-xs` | 4 |
| Modal, drawer, popover grande | `rounded-xl` | 24 |
| Badge, pill, avatar, toggle | `rounded-full` | — |

### Sombras (solo estas tres + card)

| Nivel | Clase | Uso |
|:------|:------|:----|
| Reposo de card | `shadow-whisper` o `shadow-fluent-2` | Cards en página. |
| Overlay flotante | `shadow-fluent-8` | Dropdowns, popovers, tooltips grandes. |
| Modal / diálogo | `shadow-fluent-16` | Todo lo que bloquea la pantalla. |

- NUNCA `shadow-md`/`shadow-lg`/`shadow-xl`/`shadow-2xl` de la escala genérica.
- NUNCA sombras con color (ej. `shadow-blue-500/30`).
- Hover de card interactiva: subir a `shadow-fluent-8` con `transition-shadow duration-150`.

### Glass (efectos del tema Fluent)

| Clase | Uso |
|:------|:----|
| `glass-acrylic` | Modales, overlays, headers sticky. |
| `glass-mica` | Cards destacadas dentro de página (opcional, con moderación). |

> ⚠️ **Trampa conocida:** estas clases se usan en varios componentes, pero su definición CSS
> NO está importada globalmente (vive en `docs/design-system/FLUENT2_RESOURCES.css`). Si el
> efecto blur no se ve, añade esto a `src/index.css` (o al CSS del tema activo):
>
> ```css
> .glass-acrylic {
>   background-color: rgba(255, 255, 255, 0.75);
>   backdrop-filter: blur(20px) saturate(140%);
>   -webkit-backdrop-filter: blur(20px) saturate(140%);
>   border: 1px solid rgba(255, 255, 255, 0.4);
> }
> .glass-mica {
>   background-color: rgba(249, 249, 255, 0.8);
>   backdrop-filter: blur(30px);
>   -webkit-backdrop-filter: blur(30px);
> }
> ```

---

## 6. Recetas de componentes (copy-paste)

> Todas las props citadas existen en los archivos reales de `src/components/ui/`. Si una receta no compila, el componente cambió: lee su fuente y actualiza esta receta.

### 6.1 Botón

Archivo: `src/components/ui/button.jsx` · Variantes: `primary`, `secondary`, `ghost`, `subtle`, `destructive`, `success`, `warning`, `link`, `filter` · Tamaños: `sm`, `default`, `lg`, `icon`.

```jsx
import { Button } from '@/components/ui/button'

<Button variant="primary">Guardar</Button>        // acción principal — 1 por vista
<Button variant="secondary">Cancelar</Button>     // acción secundaria
<Button variant="ghost">Ver detalle</Button>      // terciaria / navegación leve
<Button variant="destructive">Eliminar</Button>   // destructiva
<Button variant="success">Confirmar pago</Button> // confirmación positiva
<Button variant="link">Volver al listado</Button> // navegación
<Button loading>Guardando…</Button>               // estado de carga (prop loading)
<Button size="icon" aria-label="Eliminar"><Trash2 /></Button> // icon-only: aria-label OBLIGATORIO
```

Reglas:

- SIEMPRE usa `<Button>`, nunca `<button className="bg-[...]">` artesanal.
- Jerarquía de acciones en un footer de formulario/modal: `[ghost o secondary] ... [primary]`, primary a la derecha.
- Acción destructiva SIEMPRE con confirmación (modal §6.6) si no es reversible.

### 6.2 Card

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

<Card className="bg-surface-container-lowest rounded-md shadow-whisper border-0 p-lg">
  <CardHeader className="p-0 pb-md">
    <CardTitle className="text-title-md text-on-surface">Resumen de venta</CardTitle>
    <CardDescription className="text-body-md text-on-surface-variant">
      Últimos 30 días
    </CardDescription>
  </CardHeader>
  <CardContent className="p-0">{/* contenido */}</CardContent>
</Card>
```

Reglas:

- Padding interno mínimo `p-lg` (24px) salvo cards de tabla densa (`p-md`).
- Una idea por card. Si una card tiene 3 secciones sin relación, son 3 cards.
- Card clicable: añade `interactive` y `onClick`; SIEMPRE con `cursor-pointer` y foco de teclado.

### 6.3 Tabla de datos

```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

<div className="rounded-md bg-surface-container-lowest shadow-whisper overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow className="bg-surface-container-low hover:bg-surface-container-low border-0">
        <TableHead className="text-label-caps uppercase text-on-surface-variant">Producto</TableHead>
        <TableHead className="text-label-caps uppercase text-on-surface-variant text-right">Precio</TableHead>
        <TableHead className="text-label-caps uppercase text-on-surface-variant text-right">Stock</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id} className="hover:bg-surface-container-low transition-colors duration-150">
          <TableCell className="text-body-md text-on-surface">{item.name}</TableCell>
          <TableCell className="text-data-mono font-data-mono text-right">{item.price}</TableCell>
          <TableCell className="text-data-mono font-data-mono text-right">{item.stock}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

Reglas:

- Texto a la **izquierda**; números e importes a la **derecha** (`text-right` + `text-data-mono font-data-mono`); columna de acciones a la derecha.
- Header: `text-label-caps uppercase` sobre `bg-surface-container-low`.
- Hover de fila: `hover:bg-surface-container-low` con `duration-150`. NADA más (ni scale, ni sombra).
- La tabla vive dentro de un contenedor `rounded-md shadow-whisper`; la tabla en sí no lleva sombra.
- Vacía: NO renderices una tabla sin filas; usa `EmptyState` (§6.7).

### 6.4 Formulario (Input + Label)

```jsx
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

<form className="space-y-md" onSubmit={onSubmit}>
  <div className="space-y-xs">
    <Label htmlFor="email" className="text-body-md-bold text-on-surface">
      {t('form.email')}
    </Label>
    <Input id="email" type="email" state={errors.email ? 'error' : ''} />
    {errors.email && (
      <p className="text-body-md text-error">{errors.email.message}</p>
    )}
  </div>

  <div className="flex justify-end gap-sm pt-md">
    <Button type="button" variant="secondary">{t('common.cancel')}</Button>
    <Button type="submit" variant="primary">{t('common.save')}</Button>
  </div>
</form>
```

Reglas:

- SIEMPRE `<Label htmlFor>` enlazado al `id` del input (accesibilidad, no opcional).
- Estado de error: prop `state="error"` en `<Input>` + mensaje con `text-error` debajo. Nunca solo borde rojo sin texto.
- Validación con **Zod** (ver `src/features/products/` como referencia).
- Botones del form: alineados a la derecha, `secondary` + `primary`, separados con `gap-sm`.

### 6.5 Badge / estado

```jsx
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/ui/StatusBadge'

<Badge variant="success">Pagado</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="destructive">Vencido</Badge>
<Badge variant="secondary">Borrador</Badge>

<StatusBadge active={product.isActive} />   // activo/inactivo con icono
```

Reglas:

- Color semántico SIEMPRE acompañado de texto o icono (nunca solo un punto de color).
- Mapeo fijo: OK→`success`, atención→`warning`, problema→`destructive`, neutro→`secondary`, informativo→`info`.

### 6.6 Modal / diálogo

```jsx
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'

<EnhancedModal
  isOpen={open}
  onClose={() => setOpen(false)}
  title={t('products.delete_title')}
  variant="error"                       // default | success | warning | error | info
  size="sm"                             // sm | md | lg | xl | full
  footer={
    <div className="flex justify-end gap-sm">
      <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
      <Button variant="destructive" onClick={handleDelete}>{t('common.delete')}</Button>
    </div>
  }
>
  <p className="text-body-md text-on-surface-variant">{t('products.delete_confirm')}</p>
</EnhancedModal>
```

Reglas:

- Todo modal usa `EnhancedModal` (o primitives Radix de `dialog.jsx` si necesitas composición fina). NUNCA un modal artesanal con `fixed inset-0`.
- Efecto visual de overlay: `glass-acrylic` + `shadow-fluent-16` + `rounded-xl` (los componentes del proyecto ya lo aplican; si lo construyes a mano, cópialos).
- `variant` comunica severidad: confirmación de borrado → `error`; aviso → `warning`; éxito → `success`.
- Tamaño por defecto `sm`/`md`. `lg`+ solo para formularios grandes.

### 6.7 Estados de datos (loading / empty / error) — OBLIGATORIOS

```jsx
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Package } from 'lucide-react'

{isLoading && <GenericSkeletonList count={5} />}

{error && (
  <ErrorState
    title={t('errors.load_title')}
    message={error.message}
    onRetry={refetch}
  />
)}

{!isLoading && !error && items.length === 0 && (
  <EmptyState
    icon={Package}
    title={t('products.empty_title')}
    description={t('products.empty_description')}
    actionLabel={t('products.new')}
    onAction={() => navigate('/products/new')}
  />
)}

{!isLoading && !error && items.length > 0 && <DataTable items={items} />}
```

Reglas:

- Loading: skeleton que imite la forma final (NUNCA un spinner centrado solo en páginas de datos).
- Empty: SIEMPRE con acción sugerida (`actionLabel` + `onAction`) cuando el usuario puede crear contenido.
- Error: SIEMPRE con `onRetry` si la operación es reintentable.

### 6.8 Encabezado de página

```jsx
import PageHeader from '@/components/ui/PageHeader'

<PageHeader
  breadcrumb={t('nav.catalog')}
  title={t('products.title')}
  subtitle={t('products.subtitle')}
  actions={<Button variant="primary">{t('products.new')}</Button>}
/>
```

Reglas:

- Toda página de feature usa `PageHeader`. No construyas `<h1>` artesanales.
- La acción primaria de la página vive en `actions` (y es el único `primary` de la vista).

---

## 7. Plantilla de página de listado estándar

```tsx
import { useI18n } from '@/lib/i18n'
import PageHeader from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
// ... tabla, badges, etc.

export default function ProductsPage() {
  const { t } = useI18n()
  const { items, isLoading, error, refetch } = useProducts() // hook del feature

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        <PageHeader
          breadcrumb={t('nav.catalog')}
          title={t('products.title')}
          subtitle={t('products.subtitle')}
          actions={<Button variant="primary">{t('products.new')}</Button>}
        />

        <section className="mt-lg">
          {isLoading && <GenericSkeletonList count={5} />}
          {error && <ErrorState message={error.message} onRetry={refetch} />}
          {!isLoading && !error && items.length === 0 && (
            <EmptyState /* ... */ />
          )}
          {!isLoading && !error && items.length > 0 && (
            <ProductsTable items={items} />
          )}
        </section>
      </div>
    </div>
  )
}
```

---

## 8. Anti-patrones (NUNCA → haz esto)

| ❌ NUNCA | ✅ HAZ ESTO |
|:---------|:-----------|
| `bg-[#005baf]`, `text-[#181c22]` | `bg-primary`, `text-on-surface` (tokens semánticos) |
| `<button className="...">` artesanal | `<Button>` de `ui/button` |
| Modal con `fixed inset-0 bg-black/50` a mano | `<EnhancedModal>` |
| `text-gray-500`, `bg-slate-100` | `text-on-surface-variant`, `bg-surface-container-low` |
| `text-xs` para labels | `text-body-sm-bold` o `text-label-caps` |
| `shadow-xl`, `shadow-2xl`, sombras de color | `shadow-whisper` / `shadow-fluent-8` / `shadow-fluent-16` |
| Bordes gruesos para "elevar" una card | `shadow-whisper` sobre `bg-surface-container-lowest` |
| Gradientes (`bg-gradient-to-*`) | Fondo plano del sistema de capas §2.1 |
| `p-[13px]`, `mt-[7px]` | Token más cercano (`p-md`, `mt-sm`); si dudas, el mayor |
| Números en `font-sans` dentro de tablas | `text-data-mono font-data-mono` |
| Spinner solo en página de datos | `<GenericSkeletonList>` |
| Tabla con 0 filas | `<EmptyState>` |
| `console.error` y nada en pantalla | `<ErrorState>` con `onRetry` |
| 2+ botones `primary` en la misma vista | 1 primary; el resto `secondary`/`ghost` |
| Texto de UI hardcoded en español/inglés | `t('clave')` con `useI18n()` |
| Archivo nuevo `.jsx` | `.tsx` |
| Animaciones > 300ms, `animate-bounce` | `transition-colors duration-150` / `animate-in fade-in` |
| Lógica de cálculo en el componente | `src/domain/<feature>/` |

---

## 9. Árbol de decisión rápido

| Pregunta | Respuesta |
|:---------|:----------|
| ¿Qué fondo uso? | Página → `bg-background`. Panel → `bg-surface-container-lowest`. Zona secundaria → `bg-surface-container-low`. |
| ¿Qué color de texto? | `text-on-surface`. ¿Secundario/metadata? `text-on-surface-variant`. |
| ¿Qué tamaño de texto? | `text-body-md`. ¿Título de página? `text-headline-lg`. ¿Título de card? `text-title-md`. |
| ¿Es un número/fecha/ID? | `text-data-mono font-data-mono`. En tabla, además `text-right`. |
| ¿Qué botón? | Acción principal → `primary`. Cancelar → `secondary`. Navegación → `ghost`/`link`. Borrar → `destructive`. |
| ¿Qué espaciado? | `md` (16px). ¿Card? padding `lg` (24px). ¿Entre secciones? `xl` (48px). |
| ¿Qué radio? | `rounded-md`. ¿Botón? `rounded-button`. ¿Modal? `rounded-xl`. ¿Badge? `rounded-full`. |
| ¿Qué sombra? | Card → `shadow-whisper`. Dropdown → `shadow-fluent-8`. Modal → `shadow-fluent-16`. ¿Ninguna de estas? No lleva sombra. |
| ¿Qué color de estado? | OK→`success` · aviso→`warning` · error→`error`/`destructive` · neutro→`secondary`. |
| ¿Necesito un componente nuevo? | Primero busca en `src/components/ui/`. ¿Existe parecido? Extiéndelo con `className`. ¿No existe? Constrúyelo con Radix + estas clases, en `.tsx`. |
| ¿Cómo muestro loading/empty/error? | `GenericSkeletonList` / `EmptyState` / `ErrorState`. Siempre los 3. |
| ¿Dónde pongo el texto? | NUNCA en el JSX literal. `t('feature.clave')` vía `useI18n()`. |

---

## 10. Checklist antes de dar por terminada una UI

- [ ] Solo componentes de `src/components/ui/` (no reinventé botones, modales, badges, tablas).
- [ ] Cero hex/rgba en el código nuevo; solo clases semánticas de §2.
- [ ] Cero clases genéricas de color (`gray`, `slate`, `blue-500`...) en código nuevo.
- [ ] Todos los textos visibles pasan por `t()` de `useI18n()`.
- [ ] Números, importes, fechas e IDs con `text-data-mono font-data-mono`.
- [ ] 1 solo `variant="primary"` por vista.
- [ ] Estados loading / empty / error cubiertos (§6.7).
- [ ] Espaciado solo con tokens (`xs/sm/md/lg/xl`); cero valores arbitrarios redundantes.
- [ ] Radios según tabla §5; sombras solo `whisper` / `fluent-*`.
- [ ] Modal con `glass-acrylic` + `shadow-fluent-16` (o `EnhancedModal`).
- [ ] Archivos nuevos en `.tsx`.
- [ ] `pnpm lint` y `pnpm test` en verde.

---

## 11. Accesibilidad mínima obligatoria

1. Todo input con `<Label htmlFor="...">` enlazado. Sin excepciones.
2. Botones icon-only con `aria-label`.
3. NUNCA quites el focus ring (`outline-none` solo si reemplazas con `focus:ring-2` visible). Los componentes `ui/` ya lo traen: no lo borres.
4. Contraste de texto ≥ 4.5:1. Las combinaciones de §2 ya cumplen; no inventes otras (ej. gris claro sobre gris).
5. El estado nunca se comunica solo con color: color + icono o texto (§6.5).
6. Modales: foco atrapado y cierre con `Escape` (Radix/EnhancedModal lo dan gratis; no lo rompas con `tabIndex` raros).
7. Iconos de `lucide-react`, tamaño `w-4 h-4` (inline con texto) o `w-5 h-5` (solo icono).

# Guía de Migración de Páginas Individuales

**Para:** Desarrolladores asignados a migrar una página específica
**Sistema:** Fluent UI 2 + Sass/SCSS + BEM
**Fecha:** 2025-10-29

---

## 🎯 Objetivo

Esta guía te ayudará a migrar una página individual del sistema antiguo (Tailwind + lógica condicional) al nuevo sistema (Sass + BEM + Fluent UI 2).

---

## 📚 Paso 1: Lectura de Documentación (30-45 min)

### Orden de Lectura Recomendado

#### 1.1. **Lectura Rápida Obligatoria** (~15 min)

📖 **`THEME_SYSTEM.md` - Secciones clave:**
- Lee completa la sección "Component Theming > Pattern Comparison"
- Lee "Development Guidelines > Adding New Components"
- Revisa ejemplos de código (✅ correcto vs ❌ incorrecto)

**Por qué:** Te muestra exactamente qué NO hacer y qué SÍ hacer.

**Puntos clave a memorizar:**
- ❌ NO usar lógica condicional de estilos en JSX
- ❌ NO usar clases de Tailwind en nuevos componentes
- ✅ Usar solo clases BEM definidas en Sass
- ✅ Los estilos se adaptan automáticamente al tema

#### 1.2. **Referencia de Tokens** (~10 min)

📖 **`FLUENT_DESIGN_SYSTEM.md` - Secciones clave:**
- Sección 4: Sistema de Color (revisar paletas light/dark)
- Sección 5: Tipografía (type ramp y mixins)
- Sección 6: Espaciado (sistema base-4)
- Sección 12.2: Variables Theme-aware (código completo)

**Por qué:** Necesitas saber qué tokens usar en lugar de valores hardcodeados.

**Guarda estos tokens en un archivo aparte o en tu mente:**
```scss
// Los más comunes
$spacing-l: 16px;
$spacing-xxl: 24px;
$border-radius-medium: 4px;
$font-size-300: 14px;
```

#### 1.3. **Patrón de Implementación** (~10 min)

📖 **`FLUENT_IMPLEMENTATION_PROGRESS.md`:**
- Lee "Patrón de Migración" en Fase 3 o Fase 4
- Revisa el checklist de migración

**Por qué:** Te da el proceso paso a paso que debes seguir.

#### 1.4. **Referencia de Componentes** (~10 min - según necesidad)

📖 **`FLUENT_DESIGN_SYSTEM.md` - Sección 10:**
- Busca los componentes que usa tu página (Button, Card, Input, etc.)
- Revisa su anatomía y clases BEM
- Copia los nombres de las clases que necesitarás

**Ejemplo:** Si tu página usa botones, lee la sección 10.1 y anota:
```scss
.btn
.btn--primary
.btn--secondary
.btn__icon
```

---

## 🔍 Paso 2: Análisis de la Página Actual (15-30 min)

### 2.1. Identificar Componentes Usados

Abre el archivo de la página y lista todos los componentes que usa:

```bash
# Ejemplo: Analizar src/pages/Products.jsx
cat src/pages/Products.jsx | grep "import.*from.*components"
```

**Checklist de componentes:**
- [ ] ¿Usa Button?
- [ ] ¿Usa Card?
- [ ] ¿Usa Input/Formularios?
- [ ] ¿Usa Modal/Dialog?
- [ ] ¿Usa Dropdown/Select?
- [ ] ¿Usa Badge/Tags?
- [ ] ¿Usa DataState (loading/error/empty)?
- [ ] Otros: _________________

### 2.2. Verificar Estado de Componentes

**CRÍTICO:** Antes de migrar la página, verifica que los componentes que usa ya estén migrados.

```bash
# Verificar si existe el SCSS del componente
ls src/styles/scss/components/_button.scss
ls src/styles/scss/components/_card.scss
ls src/styles/scss/components/_input.scss
```

**Si un componente NO está migrado:**
- ⚠️ **Opción A**: Migra el componente primero (sigue la guía de componentes)
- ⚠️ **Opción B**: Notifica al equipo y espera a que se migre
- ⚠️ **Opción C**: Deja clases de Tailwind temporalmente en ese componente

### 2.3. Identificar Clases de Tailwind en la Página

```bash
# Buscar clases de Tailwind
grep -n "className.*bg-\|text-\|p-\|m-\|flex\|grid" src/pages/Products.jsx
```

**Anota todas las líneas que tienen clases de Tailwind.** Estas son las que deberás reemplazar.

### 2.4. Identificar Lógica Condicional de Estilos

Busca patrones como:
```jsx
// ❌ Esto debe eliminarse
const { theme } = useTheme();
const isDark = theme === 'dark';

className={isDark ? 'bg-black' : 'bg-white'}
className={`... ${theme.includes('neo') ? 'border-4' : 'border'}`}
```

**Anota todas las líneas con lógica condicional de estilos.** Estas deben eliminarse.

---

## 🛠️ Paso 3: Implementación (Tiempo variable según complejidad)

### 3.1. Crear Archivo SCSS de la Página (si es necesario)

**¿Cuándo crear archivo SCSS específico de página?**
- ✅ Si la página tiene layout específico único
- ✅ Si tiene estilos complejos no cubiertos por componentes
- ❌ Si solo usa componentes estándar (NO crear archivo)

**Si es necesario:**

```bash
# Crear archivo SCSS de la página
touch src/styles/scss/pages/_products.scss
```

**Plantilla básica:**

```scss
// src/styles/scss/pages/_products.scss
@import '../abstracts/variables';
@import '../abstracts/mixins';
@import '../abstracts/theme-mixin';

.products-page {
  padding: $spacing-xxl;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-l;
  }

  &__title {
    @include type-title;
    @include themify($themes) {
      color: themed('text-primary');
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: $spacing-l;
  }
}
```

**Importar en main.scss:**

```scss
// src/styles/scss/main.scss
// ... otros imports
@import 'pages/products';
```

### 3.2. Refactorizar JSX

#### Paso A: Eliminar imports innecesarios

```jsx
// ❌ ELIMINAR
import { useTheme } from '@/contexts/ThemeContext';
import { useThemeStyles } from '@/hooks/useThemeStyles'; // Si existe
```

**Excepción:** Solo mantener `useTheme` si necesitas el modo para **lógica de negocio** (telemetría, etc.), NO para estilos.

#### Paso B: Reemplazar clases de Tailwind por BEM

**Ejemplo de migración:**

```jsx
// ❌ ANTES (Tailwind)
<div className="flex justify-between items-center p-6 bg-white dark:bg-gray-800">
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Productos
  </h1>
  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
    Nuevo
  </button>
</div>

// ✅ DESPUÉS (BEM)
<div className="products-page__header">
  <h1 className="products-page__title">
    Productos
  </h1>
  <button className="btn btn--primary">
    Nuevo
  </button>
</div>
```

#### Paso C: Eliminar lógica condicional de estilos

```jsx
// ❌ ANTES
const { theme } = useTheme();
const isNeo = theme?.includes('neo-brutalism');

<div className={`card ${isNeo ? 'border-4 shadow-brutal' : 'border shadow-lg'}`}>
  {/* contenido */}
</div>

// ✅ DESPUÉS
<div className="card">
  {/* contenido */}
</div>
```

**El Sass se encarga de la adaptación:**
```scss
.card {
  @include themify($themes) {
    background-color: themed('bg-secondary');
    box-shadow: themed('shadow-card');
    border: 1px solid themed('border-default');
  }
}
```

#### Paso D: Actualizar componentes hijos

Asegúrate de que todos los componentes usan las clases BEM correctas:

```jsx
// ✅ Componentes con clases BEM
<Button className="btn btn--primary">Guardar</Button>
<Input className="input" />
<Card className="card card--elevated">
  <div className="card__header">Título</div>
  <div className="card__content">Contenido</div>
</Card>
```

### 3.3. Testing Visual

#### Test Checklist:

```bash
# 1. Iniciar dev server
pnpm dev
```

**En el navegador:**

- [ ] **Light Mode**: ¿Se ve correctamente?
  - [ ] Colores apropiados (fondos claros, texto oscuro)
  - [ ] Bordes visibles
  - [ ] Sombras sutiles
  - [ ] Botones con hover states

- [ ] **Dark Mode**: Cambiar tema en Settings
  - [ ] Colores apropiados (fondos oscuros, texto claro)
  - [ ] Bordes visibles (no "desaparecen")
  - [ ] Sombras sutiles
  - [ ] Botones con hover states

- [ ] **Responsive**: Resize del navegador
  - [ ] Mobile (< 640px): ¿Se ve bien?
  - [ ] Tablet (768px): ¿Se ve bien?
  - [ ] Desktop (> 1024px): ¿Se ve bien?

- [ ] **Estados de carga**:
  - [ ] Loading state
  - [ ] Error state
  - [ ] Empty state

- [ ] **Interactividad**:
  - [ ] Todos los botones funcionan
  - [ ] Formularios funcionan
  - [ ] Modales abren/cierran
  - [ ] Navegación funciona

### 3.4. Testing de Accesibilidad

**Navegación por teclado:**

- [ ] `Tab` navega por todos los elementos interactivos
- [ ] `Shift+Tab` navega hacia atrás
- [ ] `Enter` / `Space` activan botones
- [ ] `Escape` cierra modales
- [ ] El foco es **visible** (outline o border)

**Screen reader (opcional pero recomendado):**

- [ ] Todos los botones tienen labels
- [ ] Inputs tienen labels asociados
- [ ] Imágenes tienen alt text

### 3.5. Code Review Personal

Antes de hacer commit, revisa:

```bash
# Buscar clases de Tailwind remanentes
grep -n "className.*bg-\|text-\|p-\|m-\|flex\|grid" src/pages/Products.jsx

# Buscar lógica condicional de estilos
grep -n "isDark\|isLight\|theme.includes\|useTheme" src/pages/Products.jsx
```

**Resultados esperados:**
- ✅ **0 clases de Tailwind** (o solo las que están en componentes no migrados)
- ✅ **0 lógica condicional de estilos** (a menos que sea para lógica de negocio)

---

## 📋 Paso 4: Commit y PR

### 4.1. Estructura del Commit

```bash
# Stage de archivos
git add src/pages/Products.jsx
git add src/styles/scss/pages/_products.scss  # Si creaste archivo SCSS

# Commit con mensaje descriptivo
git commit -m "feat(pages): migrar página Products a Sass + Fluent UI 2

CAMBIOS:
- Eliminar clases de Tailwind de Products.jsx
- Reemplazar con clases BEM siguiendo Fluent Design System
- Crear pages/_products.scss con estilos específicos (si aplica)
- Eliminar lógica condicional de estilos en JSX
- Verificar funcionamiento en light y dark mode

COMPONENTES USADOS:
- Button (btn, btn--primary)
- Card (card, card__header, card__content)
- Input (input)
- DataState (para estados loading/error/empty)

TESTING:
✅ Visual en light mode
✅ Visual en dark mode
✅ Responsive (mobile, tablet, desktop)
✅ Navegación por teclado
✅ Estados de carga funcionan
"
```

### 4.2. Checklist Pre-PR

- [ ] Build pasa: `pnpm build`
- [ ] Linter pasa: `pnpm lint`
- [ ] Tests pasan (si hay tests): `pnpm test`
- [ ] La página funciona en light mode
- [ ] La página funciona en dark mode
- [ ] No hay clases de Tailwind (o solo temporales justificadas)
- [ ] No hay lógica condicional de estilos
- [ ] Navegación por teclado funciona
- [ ] README actualizado (si es necesario)

### 4.3. Crear Pull Request

**Título del PR:**
```
feat(pages): migrar [NombrePágina] a Sass + Fluent UI 2
```

**Descripción del PR:**
```markdown
## 📄 Descripción

Migración de la página [NombrePágina] del sistema antiguo (Tailwind + lógica condicional) al nuevo sistema (Sass + BEM + Fluent UI 2).

## ✅ Cambios Realizados

- Eliminadas clases de Tailwind de [archivo.jsx]
- Implementadas clases BEM siguiendo Fluent Design System
- Creado `pages/_nombre.scss` con estilos específicos (SI/NO)
- Eliminada lógica condicional de estilos
- Componentes usados: Button, Card, Input, etc.

## 🧪 Testing

- ✅ Visual en light mode
- ✅ Visual en dark mode
- ✅ Responsive (mobile/tablet/desktop)
- ✅ Navegación por teclado
- ✅ Estados: loading, error, empty

## 📸 Screenshots

[Adjuntar screenshots de light y dark mode]

## 📚 Documentación de Referencia

- `FLUENT_DESIGN_SYSTEM.md` - Design tokens y componentes
- `THEME_SYSTEM.md` - Patrones de implementación
- `PAGE_MIGRATION_GUIDE.md` - Esta guía

## ⚠️ Notas

[Cualquier nota relevante, decisiones tomadas, TODOs pendientes]
```

---

## 🚨 Troubleshooting Común

### Problema 1: "Los estilos no se aplican"

**Síntomas:** La página no tiene estilos o se ve rota

**Soluciones:**
1. Verifica que importaste el SCSS en `main.scss`
2. Verifica que las clases BEM en JSX coinciden con las de SCSS
3. Hard refresh (`Ctrl+F5`) para limpiar cache
4. Revisa la consola del navegador por errores de compilación Sass

### Problema 2: "El tema no cambia"

**Síntomas:** La página no se adapta de light a dark

**Soluciones:**
1. Verifica que usas el mixin `@themify` en los estilos
2. Verifica que la clase `.theme--light` o `.theme--dark` está en `<body>`
3. Revisa que no hay estilos inline que sobrescriben los del tema

### Problema 3: "Componente se ve diferente"

**Síntomas:** Un componente no se ve como en otras páginas

**Soluciones:**
1. Verifica que estás usando las clases BEM correctas
2. Revisa `FLUENT_DESIGN_SYSTEM.md` para ver la anatomía del componente
3. No añadas clases adicionales que sobrescriban los estilos base
4. Si necesitas variación, usa modificadores BEM: `.card--elevated`

### Problema 4: "No encuentro el token/variable"

**Síntomas:** No sabes qué variable Sass usar

**Soluciones:**
1. Busca en `FLUENT_DESIGN_SYSTEM.md` sección 12.2
2. Busca en `src/styles/scss/abstracts/_variables.scss`
3. Si no existe el token que necesitas, pregunta al equipo

---

## 📊 Métricas de Éxito

Una página está **correctamente migrada** cuando:

- ✅ **0 clases de Tailwind** en el código de la página
- ✅ **0 lógica condicional de estilos** en JSX (excepto lógica de negocio)
- ✅ **100% BEM** en todas las clases CSS
- ✅ **Funciona en light y dark mode** sin código condicional
- ✅ **Responsive** en mobile/tablet/desktop
- ✅ **Accesible** (navegación por teclado funciona)
- ✅ **Build pasa** sin errores ni warnings
- ✅ **Tests pasan** (si hay tests existentes)

---

## 🎓 Recursos Rápidos

### Documentos por Orden de Importancia

| # | Documento | Cuándo Leerlo | Tiempo |
|---|-----------|---------------|--------|
| 1 | **THEME_SYSTEM.md** | Siempre primero | 15 min |
| 2 | **FLUENT_DESIGN_SYSTEM.md** | Para referencia de tokens | 10-30 min |
| 3 | **PAGE_MIGRATION_GUIDE.md** | Este documento | 10 min |
| 4 | **GUIA_MVP_DESARROLLO.md** | Para contexto general (opcional) | 10 min |

### Comandos Útiles

```bash
# Buscar clases de Tailwind remanentes
grep -r "className.*bg-\|text-\|p-\|m-" src/pages/

# Verificar que componentes SCSS existen
ls src/styles/scss/components/

# Verificar compilación Sass
pnpm dev

# Build de producción
pnpm build

# Run linter
pnpm lint

# Run tests
pnpm test
```

### Contactos del Equipo

**Dudas técnicas:**
- Sistema de diseño: [Responsable del sistema]
- Sass/SCSS: [Experto en Sass]
- Accesibilidad: [Experto en a11y]

**Slack channels:**
- `#frontend-sass-migration`
- `#frontend-help`

---

## 📝 Checklist Final (Imprimir/Guardar)

```
□ Leí THEME_SYSTEM.md sección "Pattern Comparison"
□ Revisé tokens en FLUENT_DESIGN_SYSTEM.md
□ Identifiqué componentes usados en la página
□ Verifiqué que componentes están migrados
□ Identifiqué clases de Tailwind a reemplazar
□ Creé archivo SCSS de página (si necesario)
□ Eliminé imports innecesarios (useTheme, etc.)
□ Reemplacé clases de Tailwind por BEM
□ Eliminé lógica condicional de estilos
□ Testé visualmente en light mode
□ Testé visualmente en dark mode
□ Testé responsive (mobile/tablet/desktop)
□ Testé navegación por teclado
□ Verifiqué estados (loading/error/empty)
□ Build pasa sin errores
□ Linter pasa sin warnings
□ Hice commit con mensaje descriptivo
□ Creé PR con descripción completa
□ Adjunté screenshots a PR
```

---

**Última actualización:** 2025-10-29
**Versión:** 1.0
**Mantenido por:** Equipo Frontend

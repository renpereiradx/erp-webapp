# Plan de Mejora: Design System inspirado en Fluent 2 (Microsoft)

## Objetivo
Refinar y embellecer la documentación y estética de los componentes en `@docs/design-system/**` para lograr una apariencia más limpia, moderna, "airy" (espaciosa) y estrictamente alineada con los principios de diseño de **Microsoft Fluent 2.0**.

## 1. Actualización de Paleta de Colores (Tokens)
Fluent 2 utiliza colores de superficie muy sutiles para crear jerarquías, abandonando grises pesados y contrastes duros.
- **Primary Color:** Cambiar a `#0F6CBD` (Azul oficial de Fluent 2).
- **Backgrounds:**
  - `background-base`: `#FAF9F8` (Fondo general, muy suave, cálido).
  - `surface`: `#FFFFFF` (Tarjetas, modales, áreas de contenido).
- **Borders:**
  - `border-subtle`: `rgba(0,0,0,0.06)` o `#EDEBE9`. Más suave que el actual `#e5e7eb`.

## 2. Elevación, Profundidad y Materiales (Mica / Acrylic)
Fluent 2 se caracteriza por la translucidez y sombras multi-capa sutiles.
- **Shadows:** Refinar `fluent-2`, `fluent-8` y `fluent-16` para usar sombras ultra-suaves.
  - Ejemplo: `0 4px 8px rgba(0,0,0,0.04), 0 0 2px rgba(0,0,0,0.06)`.
- **Sidebars / Headers:** Implementar efectos tipo "Acrylic" usando `bg-white/70 backdrop-blur-xl` en los encabezados y paneles laterales de la documentación para dar un toque hiper-moderno.

## 3. Tipografía y Jerarquía
Fluent 2 es profesional y legible, evitando pesos extremos a menos que sea estrictamente necesario.
- Reemplazar los pesos `font-black` (900) por `font-semibold` (600) o `font-bold` (700) en títulos. Fluent prefiere la escala por tamaño y color (texto secundario) en lugar de engrosar demasiado la fuente.
- Mantener `Inter` como fuente principal, pero ajustar el `tracking` (espaciado entre letras) para que sea más natural y menos agresivo (`tracking-normal` o `tracking-tight` ligero).

## 4. Refinamiento de Componentes
- **Botones:** Bordes redondeados más suaves (Fluent 2 usa típicamente `4px` para controles). El botón primario no lleva sombra intensa.
- **Inputs & Selects:** Fondos ligeramente grisáceos (`#F3F2F1`) con bordes sutiles que, al hacer `focus`, revelan una línea inferior o anillo azul primario característico.
- **Data Grids (Tablas):** Filas con más "aire" (padding), bordes inferiores muy sutiles, hover de fila usando el color de superficie primaria con opacidad baja (`bg-slate-50/50`).
- **Tarjetas (Cards):** Borde sutil, radio de `8px` o `12px` (`rounded-lg` o `rounded-xl`), y la sombra `fluent-2` que solo aumenta en hover.

## 5. Implementación en Archivos
Se modificarán los siguientes archivos:
1. `docs/design-system/FLUENT2_RESOURCES.css`: Añadir tokens nativos y clases utilitarias para materiales de Fluent (Mica/Acrylic).
2. `docs/design-system/FLUENT2_FUNDAMENTALS.html`: Actualizar el script de `tailwind.config` interno, aplicar el estilo Acrylic al sidebar/header, suavizar tipografía y sombras.
3. `docs/design-system/FLUENT2_COMPONENTS.html`: Refinar botones (radios, colores), inputs (estilo Fluent focus) y etiquetas.
4. `docs/design-system/FLUENT2_DATA_VISUALIZATION.html`: Limpiar las tablas, hacer las jerarquías más "limpias" visualmente con más espacio y mejores iconos.
5. `docs/design-system/README.md`: Actualizar para reflejar los nuevos principios visuales y tokens de Fluent 2 exactos.

## Verificación
- Abrir los archivos HTML localmente para asegurar que el diseño se sienta significativamente más moderno, ligero y alineado con productos modernos de Microsoft (como Teams o el nuevo Outlook).

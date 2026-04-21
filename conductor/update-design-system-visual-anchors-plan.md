# Plan: Actualización del Sistema de Diseño (Anclas Visuales)

## Objetivo
Documentar formalmente el patrón "Visual Anchors" (Anclas Visuales) utilizando el estilo `Deep Brand Blue` en el sistema de diseño Fluent 2.0. Este patrón asegura que los componentes estratégicos destaquen con una estética corporativa y cálida, evitando el uso de fondos negros puros.

## Archivos a Modificar
- `docs/design-system/visual-refinement.md`

## Implementación
Se añadirá una nueva sección `## 4. Anclas Visuales (Visual Anchors) - Deep Brand Blue` al final del archivo `visual-refinement.md` que incluirá:

1. **Propósito**: Explicar por qué evitar fondos negros puros en Fluent 2.0 y cómo usar el azul profundo para jerarquizar KPIs o secciones críticas.
2. **Características del Patrón**:
   - **Fondo Gradient**: `bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd]`
   - **Sombra Envolvente**: `shadow-2xl shadow-blue-900/20`
   - **Textos Secundarios**: Tonos azulados suaves (`text-blue-200/80` o `text-blue-100/70`) en lugar de grises.
   - **Acentos de Éxito**: Verde esmeralda pastel (`text-emerald-300`).
3. **Ejemplo Práctico de Código (JSX)**: Proveer un snippet base que los desarrolladores puedan copiar para aplicar el `Soft Glow`, las tipografías correctas y los colores de acento.
4. **Regla de Oro**: Restringir el uso de este patrón a **máximo un (1) componente principal** por vista para mantener su impacto y evitar sobrecargar la interfaz.
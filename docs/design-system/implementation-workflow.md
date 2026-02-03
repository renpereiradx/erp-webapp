# Flujo de Implementación de Nuevas Páginas

Guía paso a paso para implementar diseños proporcionados por el equipo de diseño.

---

## Flujo de Trabajo (Stitch vs. Archivos)

El flujo de trabajo prioriza **Stitch** como fuente de verdad.

### 1. Flujo Principal (Stitch)
1. **Acceder a Stitch**: Conectar mediante las herramientas disponibles.
2. **Seleccionar Proyecto**: Ir al proyecto específico indicado.
3. **Buscar Pantalla**: Localizar la pantalla requerida.
4. **Obtener Referencias**: Descargar la pantalla en HTML/PNG o capturar un screenshot desde Stitch.
5. **Implementar**: **Solo si el usuario lo solicita explícitamente.**

### 2. Flujo Secundario (Archivos Locales)
Este flujo solo se activa si el usuario **pide explícitamente** trabajar con archivos estáticos:
- [ ] **Archivo PNG**: Captura visual del diseño.
- [ ] **Archivo HTML**: Implementación de referencia.

---

## Fase 1: Preparación

- [ ] Revisar el diseño completo (Stitch o PNG)
- [ ] Identificar secciones principales de la página
- [ ] Listar todos los componentes UI visibles en el diseño
- [ ] Leer la [Guía de Componentes](./component-guide.md)

### Componentes identificados en el diseño:

| Componente | Existe en SCSS? | Necesita actualización? |
|:--|:--|:--|
| _(agregar aquí)_ | Sí / No | Sí / No |

---

## Fase 2: Análisis de Componentes

Para cada componente identificado:

### 2.1 Verificar existencia

- [ ] Buscar el componente en `src/styles/scss/components/`
- [ ] Revisar la documentación en `docs/design-system/component-guide.md`

### 2.2 Comparar con diseño

- [ ] ¿Los estilos base coinciden? (colores, tipografía, espaciado)
- [ ] ¿Los estados coinciden? (hover, active, disabled)
- [ ] ¿Los tamaños/variantes coinciden?

### 2.3 Decisión

| Si... | Entonces... |
|:--|:--|
| El componente existe y coincide | ✅ Usar clases SCSS existentes |
| El componente existe pero difiere | ⚠️ **Actualizar el SCSS** (ver Fase 3) |
| El componente no existe | 🆕 **Crear nuevo SCSS** (ver Fase 3) |

---

## Fase 3: Actualización de Componentes

> ⚠️ **IMPORTANTE**: Los diseños proporcionados por diseño tienen prioridad.
> Si el diseño difiere de nuestro componente, actualizar nuestro SCSS.

### 3.1 Antes de modificar

- [ ] Documentar qué cambios son necesarios
- [ ] Verificar que los cambios no rompan otras páginas
- [ ] Si hay riesgo, crear variante nueva en vez de modificar base

### 3.2 Proceso de actualización

- [ ] Abrir archivo SCSS del componente
- [ ] Hacer los cambios siguiendo convención BEM:
  - Base: `.componente`
  - Variante: `.componente--variante`
  - Elemento: `.componente__elemento`
- [ ] Probar compilación: `pnpm run build`
- [ ] Verificar que otras páginas no se vean afectadas

### 3.3 Documentar cambios

- [ ] Actualizar `docs/design-system/component-guide.md` con nuevas clases
- [ ] Si es variante nueva, agregar ejemplo de uso
- [ ] Commit con mensaje descriptivo: `feat(scss): update [componente] per design spec`

---

## Fase 4: Implementación de la Página

- [ ] Crear archivo JSX en `src/pages/`
- [ ] Usar componentes UI de `src/components/ui/`
- [ ] Aplicar clases SCSS del sistema Fluent (NO Tailwind inline)
- [ ] Verificar responsividad

---

## Fase 5: Verificación Final

- [ ] Comparar página implementada vs diseño original (Stitch/PNG)
- [ ] Verificar consistencia de:
  - [ ] Colores
  - [ ] Tipografía
  - [ ] Espaciados
  - [ ] Estados interactivos
- [ ] Probar en diferentes resoluciones
- [ ] `pnpm run build` sin errores

---

## Registro de Cambios por Página

### Página: _(nombre de la página)_

**Fecha:** _(fecha de implementación)_
**Desarrollador:** _(nombre)_

#### Componentes actualizados:

| Componente | Archivo SCSS | Cambio realizado |
|:--|:--|:--|
| _(ejemplo)_ | `_button.scss` | Agregado variant `--outline-primary` |

#### Componentes nuevos creados:

| Componente | Archivo SCSS | Descripción |
|:--|:--|:--|
| _(ejemplo)_ | `_stat-card.scss` | Card para métricas del dashboard |

---

## Recursos

- [Guía de Componentes](./component-guide.md) - Referencia de clases SCSS
- [Proceso de Revisión](./review-process.md) - Convenciones y checklist
- [README](./README.md) - Índice del sistema de diseño

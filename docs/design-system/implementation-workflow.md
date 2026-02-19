# Flujo de Extracción e Implementación de Pantallas

Guía para transformar los diseños de **Stitch** en páginas funcionales del ERP.

---

## Fuente de Verdad: Stitch

No diseñamos interfaces desde cero. Utilizamos Stitch para generar la estructura visual y los tokens, extrayendo los estilos necesarios para mantener la consistencia del sistema.

### 1. Extracción (Stitch)
1. **Acceder a Stitch**: Seleccionar el proyecto `ERP WEBAPP`.
2. **Localizar la Pantalla**: Identificar la pantalla específica requerida.
3. **Analizar la Estructura**: Observar la jerarquía de componentes (Sidebar, Table, Modals).
4. **Extraer Tokens**: Identificar colores, bordes y espaciados directamente del diseño.

### 2. Mapeo y Adaptación (JSX/SCSS)
Este paso consiste en llevar lo extraído de Stitch a nuestros componentes React existentes:
- [ ] **Componentes Base**: Mapear los elementos visuales a nuestros componentes UI (`Button`, `Input`, `Card`).
- [ ] **Estructura HTML**: Replicar la jerarquía de Stitch en el JSX de la página.
- [ ] **Estilos Específicos**: Extraer clases SCSS únicas para la página y moverlas a `src/styles/scss/pages/`.

---

## Fase 1: Identificación de Componentes

- [ ] Revisar la pantalla en Stitch.
- [ ] Listar los componentes UI necesarios.
- [ ] Verificar si el componente base necesita una variante SCSS nueva para igualar el diseño de Stitch.

### Mapeo de Componentes Extraídos:

| Elemento en Stitch | Componente UI React | Variante SCSS |
|:--|:--|:--|
| _(ej: Botón Guardar)_ | `Button` | `--primary` |

---

## Fase 2: Implementación de Estilos

> ⚠️ **IMPORTANTE**: Si el diseño en Stitch difiere de un componente base, se debe actualizar el SCSS base o crear una variante específica. El diseño de Stitch tiene **absoluta prioridad**.

### 3.1 Proceso de Extracción de Estilos

- [ ] Identificar las variables de diseño (tokens) de Stitch.
- [ ] Traducir estilos inline o de utilidad de Stitch a BEM SCSS.
- [ ] Integrar en el archivo SCSS de la página correspondiente.
- [ ] **Prioridad**: No usar Tailwind inline; usar siempre el sistema de variables SCSS del proyecto.

---

## Fase 3: Construcción de la Página

- [ ] Crear el archivo JSX en `src/pages/`.
- [ ] Importar los componentes UI necesarios.
- [ ] Aplicar la estructura de layout extraída de Stitch.
- [ ] Consumir los datos necesarios mediante el Store (Zustand).

---

## Fase 4: Verificación de Fidelidad

- [ ] Comparar la implementación local contra la pantalla de Stitch.
- [ ] Validar:
  - [ ] Colores y contraste.
  - [ ] Alineación de celdas en tablas.
  - [ ] Espaciados (paddings/margins) idénticos.
  - [ ] Comportamiento responsivo básico.

---

## Registro de Cambios

### Página: _(Nombre)_

**Fecha:** _(Hoy)_
**Acción:** Extracción e implementación desde Stitch.

#### Estilos Actualizados/Extraídos:

| Componente | Cambio / Variante | Notas |
|:--|:--|:--|
| `Table` | Agregado hover sutil | Extraído de diseño de lista |

---

## Recursos

- [Guía de Componentes](./component-guide.md) - Referencia de clases SCSS existentes.
- [Inventario](./component-inventory.md) - Estado de integración de componentes.

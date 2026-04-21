# Guías de Refinamiento Visual y Fidelidad de Diseño

Este documento resume las lecciones aprendidas y mejores prácticas para lograr una fidelidad visual del 100% con los diseños de referencia (Stitch/Figma), centrándose en el manejo de bordes, recortes de contenido y adaptabilidad de contenedores.

## 1. La Regla del "Clip Content" (Recorte de Contenido)

Uno de los problemas más comunes al aplicar bordes redondeados (`rounded-xl`, `rounded-2xl`, etc.) es que estos parecen "desaparecer" o no aplicarse en las esquinas superiores o inferiores de una tarjeta.

### El Problema (Por qué no funciona a la primera)
Cuando un contenedor padre tiene bordes redondeados, pero sus hijos directos (como la cabecera de una tabla, una barra de progreso o un div con fondo de color) tienen un fondo sólido, el fondo del hijo "tapa" la curvatura del padre en las esquinas.

### La Solución: `overflow-hidden`
Para que el borde redondeado del padre sea efectivo, **siempre** se debe aplicar la clase `overflow-hidden` al contenedor que define el radio del borde.

```jsx
// ❌ INCORRECTO: El fondo de la cabecera tapará las esquinas superiores
<div className="rounded-xl bg-white border">
  <div className="bg-slate-50 p-4">Cabecera con fondo</div>
  <div className="p-4">Contenido</div>
</div>

// ✅ CORRECTO: overflow-hidden obliga a los hijos a respetar la curvatura
<div className="rounded-xl bg-white border overflow-hidden">
  <div className="bg-slate-50 p-4">Cabecera con fondo</div>
  <div className="p-4">Contenido</div>
</div>
```

---

## 2. Prevención de Desbordamiento en Tarjetas KPI (Icon Push)

En dashboards ejecutivos, las cifras numéricas pueden ser extremadamente largas (millones con decimales). Si no se maneja correctamente, el texto empujará a los elementos adyacentes (como iconos) fuera del contenedor.

### El Patrón de Contenedor Flexible
Para evitar que el icono se desborde o se "aplaste", se debe usar una combinación de `flex-1` y `min-w-0` en el contenedor de texto, y `flex-shrink-0` en el contenedor del icono.

```jsx
// ✅ Estructura robusta para tarjetas KPI
<div className="flex justify-between items-start gap-4">
  {/* Contenedor de Texto: flex-1 permite crecer, min-w-0 permite truncar/ajustar */}
  <div className="flex-1 min-w-0">
    <p className="truncate text-sm">Título Largo que debe Truncarse</p>
    <h2 className="text-2xl font-bold break-words">$1,000,000,000.00</h2>
  </div>
  
  {/* Contenedor de Icono: flex-shrink-0 evita que se aplaste */}
  <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
    <Icon className="w-6 h-6" />
  </div>
</div>
```

---

## 3. Alineación de Tokens y Configuración de Tailwind

La fidelidad visual depende de que las clases utilizadas coincidan con la definición del sistema de diseño en el archivo de configuración.

- **Verificar `tailwind.config.js`**: Si el diseño pide `rounded-xl` (12px), asegúrate de que el token en la configuración no esté sobreescrito por un valor diferente (ej. 8px).
- **Consistencia de Tokens**: Si se define `xl` como el estándar para tarjetas, evita usar `lg` o `2xl` arbitrariamente en la misma vista para mantener la armonía visual.

---

## 4. Anclas Visuales (Visual Anchors) - Deep Brand Blue

Para destacar KPIs estratégicos o secciones de alta prioridad, se debe evitar el uso de bloques negros puros que rompan la estética ligera. En su lugar, utilizamos el patrón **Deep Brand Blue**.

### Características del Patrón
- **Fondo:** `bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd]`
- **Sombra:** `shadow-2xl shadow-blue-900/20`
- **Contraste:** Texto blanco (`text-white`) con acentos esmeralda (`text-emerald-300`) para valores positivos.

---

## 5. Jerarquía de Pesos Numéricos (Numerical Contrast)

No todos los números en la interfaz deben tener el mismo peso visual. La jerarquía se establece mediante el contraste de `font-weight` en fuentes monoespaciadas (`font-mono`).

### Escala de Pesos
- **font-black (900)**: **Métricas Maestras.** Totales globales de la página y anclas visuales.
- **font-bold (700)**: **Métricas Primarias.** Valores estándar de tarjetas KPI y totales de fila.
- **font-semibold (600)**: **Métricas Secundarias.** Datos de soporte en tablas (cantidades, markup, costos).
- **font-medium (500)**: **Métricas de Apoyo.** Paginación, timestamps y metadatos.

---

### Checklist de Fidelidad Visual
- [ ] ¿El contenedor padre tiene `rounded-xl` y `overflow-hidden`?
- [ ] ¿Los elementos con fondo interno respetan los bordes del padre?
- [ ] ¿Las cifras largas en KPIs usan `min-w-0` para no empujar iconos?
- [ ] ¿El `tracking-tight` y `font-extrabold` se aplicaron a los títulos principales?
- [ ] ¿Los espaciados (`gap-*`, `p-*`) siguen la escala de 8px del sistema?
- [ ] ¿Se aplica contraste de pesos (`black` vs `semibold`) en los números?

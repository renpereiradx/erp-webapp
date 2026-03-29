# Plan de Implementación: Mejoras en UI y Corrección de Modal de Pagos

## Objetivo
Mejorar el diseño de los wrappers SVG (SegmentedControl y campos de input de precios) y corregir la inicialización del componente `InstantPaymentDialog` que actualmente falla con `TypeError: onConfirmPayment is not a function`.

## Archivos Clave
- `src/pages/SalesNew.tsx`
- `src/components/ui/InstantPaymentDialog.jsx`
- `src/components/ui/SegmentedControl.jsx` (evaluar estilos si aplica a `.css`)

## Pasos de Implementación

### 1. Corrección del Error del Modal de Pagos
- **Problema:** En `SalesNew.tsx`, el modal de pagos instantáneos fue implementado pasando la propiedad `onSubmit`, pero el componente interno `InstantPaymentDialog` espera `onConfirmPayment`. Adicionalmente, recibe `isSale` pero el componente usa `variant="sale"`.
- **Solución:** Refactorizar el renderizado del `InstantPaymentDialog` en `SalesNew.tsx` para que coincidan los nombres y formatos de las propiedades (Props) esperadas:
  - Cambiar `onSubmit` a `onConfirmPayment`.
  - Añadir un control visual de "Pagar el Total" ("Cobrar Total") mediante un pequeño botón tipo "Fantasma" que permita rellenar el campo del input al monto original.
  - Asegurar que `payment_notes` en la función asíncrona llame a la propiedad correcta del objeto (`data.payment_notes`).

### 2. Mejora del Estilo del Modal de Edición (Precio/Descuento)
- **Problema:** Los `div` que envuelven a los iconos (como `<DollarSign />` y `<Percent />`) en el modal se ven planos.
- **Solución UI:**
  - Añadir estilos sutiles de fondo y bordes al contenedor del ícono absoluto en los `Input`. Por ejemplo, transformarlo en un bloque indicador gris claro (`bg-slate-100 rounded-md border border-slate-200`) que quede estéticamente separado pero anidado dentro del contenedor relativo.
  - O usar el patrón moderno donde el ícono flota libremente pero tiene un color primario al hacer "focus" en el input adyacente.

### 3. Abstracción del Flujo (Domain Driven)
- Utilizaremos el estado y servicio actual (`salePaymentService`) que ya cumple con la estructura requerida, pero garantizaremos que en el diálogo de cobro se lea apropiadamente el `totalAmount`.

## Verificación
1. Crear una venta y confirmar. Aparecerá el diálogo de pago.
2. Ingresar monto y notas, y dar a "Confirmar Cobro". Debe ejecutar `onConfirmPayment` exitosamente sin error de función no definida.
3. Observar que el "botón" de cobro total sugerido sea seleccionable.
4. Inspeccionar el modal de "Editar Producto" para confirmar que la UI de los SVG luzca como un elemento interactivo ("Fluent Design") y no como un texto plano.
# Plan de Corrección: Formateo de Números e Internacionalización

Este plan aborda el problema de los números con decimales infinitos y la presencia de código "hardcodeado" (textos fijos en español) en varias páginas críticas del ERP.

## Objetivos
1.  **Formateo de Números:** Asegurar que todos los valores numéricos (cantidades, porcentajes, stocks) se muestren con un máximo de 2 decimales (o 0 para PYG según corresponda).
2.  **Internacionalización (i18n):** Migrar los textos en español que están fijos en el JSX a los archivos de traducción correspondientes usando la función `t()`.
3.  **Centralización:** Utilizar utilidades globales para evitar la repetición de lógica de formateo en cada página.

## Archivos y Contextos Clave
-   **Utilidades:** `src/utils/currencyUtils.js` (se extenderá para incluir `formatNumber`).
-   **Traducciones:** `src/lib/i18n/locales/es/*.js` (donde se añadirán nuevas claves).
-   **Páginas Afectadas:**
    -   `src/pages/Purchases.tsx`
    -   `src/pages/InventoryManagement.jsx`
    -   `src/pages/DetailedKPIs.jsx`
    -   `src/pages/SalesNew.tsx`
    -   `src/pages/Dashboard.jsx`

## Pasos de Implementación

### Fase 1: Utilidades de Formateo
1.  Modificar `src/utils/currencyUtils.js` para añadir la función `formatNumber(value, decimals = 2)`.
2.  Asegurar que `formatPYG` se use correctamente para montos en moneda local (0 decimales).

### Fase 2: Refactorización de Páginas (Sistemático)
Para cada página (empezando por `Purchases.tsx` e `InventoryManagement.jsx`):
1.  **Identificación:** Localizar textos fijos en el JSX (ej. `<h1>Gestión de Compras</h1>`).
2.  **Traducción:**
    -   Añadir la clave al archivo de idioma correspondiente (ej. `src/lib/i18n/locales/es/purchases.js`).
    -   Reemplazar el texto en el JSX por `t('clave.identificador', 'Texto Original')`.
3.  **Formateo de Números:**
    -   Identificar variables numéricas renderizadas directamente (ej. `{item.quantity}`).
    -   Envolverlas en `formatNumber(value)` o la utilidad correspondiente.
    -   Asegurar que los cálculos complejos (márgenes, porcentajes) usen `.toFixed(2)` antes de ser mostrados o pasen por el formateador.

### Fase 3: Validación y Pruebas
1.  Verificar visualmente que las páginas ya no muestran decimales infinitos.
2.  Cambiar el idioma del sistema (si es posible) para asegurar que las nuevas claves de traducción funcionan correctamente.
3.  Ejecutar el linter para asegurar que no se introdujeron errores de sintaxis.

## Verificación
-   Los números como `22.222222222255` deberán mostrarse como `22.22`.
-   El título "Gestión de Compras" deberá provenir de `t()`.
-   No deberá haber duplicación de la función `formatCurrency` en las páginas refactorizadas.

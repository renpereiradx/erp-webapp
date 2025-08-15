# Issue: Extraer cadenas restantes a i18n en Products

- Title: Extraer cadenas a i18n en `src/pages/products` y componentes relacionados
- Owner: frontend
- Estimate: 4d
- Labels: i18n, frontend, P1
- Branch: feat/products/i18n-extract

## Descripción
Extraer todos los textos hard-coded en la carpeta `src/pages/products` y componentes usados directamente por esa página (ProductCard, ProductModal, DeleteProductModal, ProductGrid) a claves i18n. Incluir ejemplos en `src/lib/i18n.js` (es/en) y pruebas de que no hay strings directas en `src/pages/products`.

## Criterios de aceptación
- No hay textos hard-coded en `src/pages/products`.
- Nuevas claves añadidas a `src/lib/i18n.js` (es/en).
- PR pequeño con cambios revisables y tests/lint passing.

## Notas
- Mantener claves con prefijo `products.` cuando aplique.
- Revisar accesibilidad de placeholders y aria-labels.

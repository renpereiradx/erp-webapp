# Capa de Dominio de Negocio (Business Domain Layer)

## Introducción
La capa de dominio en este proyecto centraliza las reglas de negocio, cálculos y validaciones que son independientes de la interfaz de usuario (React) y de los detalles de implementación de la infraestructura (APIs).

Esta separación sigue los principios de **Arquitectura Limpia (Clean Architecture)** y permite que el núcleo del negocio sea testeable, mantenible y portable.

## Estructura de Directorios
La lógica se organiza por dominios funcionales dentro de `src/domain/`:

- **`core/`**: Funciones transversales a todo el sistema (ej: redondeo de moneda).
- **`purchase/`**: Reglas específicas para el módulo de Compras.
  - `pricing/`: Políticas de precios y márgenes.
  - `calculations/`: Cálculo de totales de órdenes.
  - `validators/`: Validaciones de integridad de datos.
- **`sale/`**: Reglas específicas para el módulo de Ventas.
- **`product/`**: Reglas de negocio de productos y gestión de stock.

## Principios de Diseño

### 1. Funciones Puras
Las funciones de dominio deben ser, en lo posible, **puras**. Esto significa que:
- Ante los mismos argumentos, siempre devuelven el mismo resultado.
- No tienen efectos secundarios (no llaman a APIs, no modifican `localStorage`, no disparan eventos globales).
- No dependen del estado externo.

### 2. Independencia de la UI
El dominio no sabe nada de React, Tailwind o hooks. No debe importar componentes ni librerías de UI.

### 3. Tipado Estricto (TypeScript)
Todo el nuevo código de dominio se escribe en `.ts` para garantizar que los modelos de negocio sean consistentes en toda la aplicación.

## Ejemplos de Uso

### Cálculos de Precios
```typescript
import { calculatePurchaseSalePriceGs } from '@/domain/purchase/pricing/purchasePricingPolicy';

const salePrice = calculatePurchaseSalePriceGs(cost, margin);
```

### Validaciones
```typescript
import { validatePurchaseOrder } from '@/domain/purchase/validators/purchaseOrderValidator';

const { isValid, errors } = validatePurchaseOrder(orderData);
```

## Beneficios
- **Testeabilidad**: Es muy sencillo escribir tests unitarios para funciones puras.
- **Reusabilidad**: La lógica de cálculo de totales puede usarse en la página de creación, en el store y en los reportes.
- **Claridad**: Los componentes React se vuelven más delgados y se enfocan solo en la presentación.

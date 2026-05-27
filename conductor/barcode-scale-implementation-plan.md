# Plan de Implementación: Integración de Barcodes y Balanzas (Conductor)

Este plan de acción detalla la implementación de la Fase 4 para el escaneo de códigos de barras (estáticos y dinámicos) en el POS y la creación de la interfaz de administración para balanzas electrónicas en el ERP.

## Objetivos
1. Soportar el escaneo universal (estático y catch-weight variable) en el POS (`SalesNew.tsx`) a través del endpoint `/sales/scan`.
2. Implementar CRUD de Balanzas (`/scales`) y Formatos de Etiqueta (`/label-formats`) bajo una arquitectura orientada a features en TypeScript.
3. Crear un panel interactivo de pesaje y sincronización del catálogo de balanzas.

---

## Archivos a Modificar / Crear

### 1. Cliente API y Tipos
- **`src/types.ts`**: Definición de interfaces TS (`DecodedBarcode`, `ScanResult`, `WeighItemResponse`, `Scale`, `LabelFormat`) e integración de constantes en `API_ENDPOINTS`.
- **`src/services/BusinessManagementAPI.ts`**: Métodos para `/sales/scan`, `/barcode/decode`, `/barcode/generate`, `/scale/*` y CRUDs de `/scales` y `/label-formats`.
- **`src/services/api.ts`**: Registrar nuevos métodos en `apiService` para compatibilidad.

### 2. Lógica en Punto de Venta (POS)
- **`src/pages/SalesNew.tsx`**:
  - Detección de entrada rápida de código de barras (regex `^\d{8,13}$` en el input).
  - Consulta asíncrona a `POST /sales/scan`.
  - Diferenciación en inserción al carrito:
    - Productos variables (`is_variable_measure`): inserción como nueva fila independiente, sin acumular. Cantidad calculada por el endpoint.
    - Productos estándar: incremento acumulado de cantidad.

### 3. Feature Módulo de Balanzas (TypeScript)
- **`src/domain/scales/models.ts`**: Validaciones del formato EAN-13 y prefijos semánticos.
- **`src/features/scales/services/scaleService.ts`**: Operaciones específicas del módulo.
- **`src/features/scales/components/ScaleConfigPage.tsx`**: UI de administración de alta densidad Fluent 2.0 para gestionar balanzas, formatos, realizar test de pesaje y sincronizar catálogo.

### 4. Enrutamiento y Navegación
- **`src/App.tsx`**: Registrar la ruta `/configuracion/balanzas` protegida por permisos.
- **`src/pages/Settings.jsx`**: Añadir acceso directo a la configuración de balanzas bajo la sección de Sistema.

---

## Plan de Verificación

### Pruebas Estáticas
- Ejecutar `pnpm tsc --noEmit` para verificar la ausencia de errores de tipado.
- Ejecutar `pnpm build` para asegurar el correcto empaquetado del bundle.

### Pruebas Funcionales (Manuales)
1. **POS**: Escanear código de barras estándar (ej: Coca-Cola) -> Verificar incremento de cantidad.
2. **POS**: Escanear código catch-weight variable (ej: Tomate `2000010246250`) -> Verificar inserción de línea separada con cantidad `1.97 kg`.
3. **Configuración**: Crear balanza e iniciar simulación de pesaje.
4. **Catálogo**: Cargar y verificar la lista de productos de medida variable listos para balanza.

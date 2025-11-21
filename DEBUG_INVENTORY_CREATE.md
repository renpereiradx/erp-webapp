# 🔍 Debug: Creación de Inventario - Items no se guardan en DB

## Problema Reportado

Se está creando correctamente el registro de inventario en la base de datos con los metadata, pero **NO se están guardando los items/productos** (detalles del inventario).

### Ejemplo de registro creado en DB:
```
ID: 2
check_date: "2025-11-21 12:05:56.522108"
user_id: "jJkV4F6HR"
state: true
metadata: {
  "notes": "Prueba",
  "source": "physical_count",
  "location": "Cantina",
  "operator": "Marcelo",
  "timestamp": "2025-11-21T15:05:56.518Z",
  "verification": "single_check",
  "counting_method": "manual"
}
```

**✅ El inventario SE crea**
**❌ Los items NO se guardan**

---

## Logs de Debug Implementados

Se han agregado logs detallados en toda la cadena de llamadas:

### 📝 Frontend (InventoryManagement.jsx - línea 264)
```javascript
console.log('📝 [FRONTEND] Datos construidos en handleSubmitInventory:');
console.log('Estructura completa:', JSON.stringify(inventoryData, null, 2));
console.log('Items originales del form:', inventoryForm.items);
console.log('Items count:', inventoryData.items.length);
```

### 🗄️ Store (useInventoryManagementStore.js - línea 139)
```javascript
console.log('🗄️ [STORE] Datos recibidos en createInventory del store:');
console.log('Estructura:', JSON.stringify(inventoryData, null, 2));
console.log('¿Tiene items?', !!inventoryData.items);
console.log('Items count:', inventoryData.items?.length || 0);
```

### 📦 Service (inventoryService.js - línea 358)
```javascript
console.log('📦 [INVENTORY SERVICE] Datos recibidos en createInventory:');
console.log('Estructura completa:', JSON.stringify(inventoryData, null, 2));
console.log('Items length:', inventoryData.items?.length || 0);
```

### 🚀 Service - Payload (inventoryService.js - línea 378)
```javascript
console.log('🚀 [INVENTORY SERVICE] Payload que se enviará a POST /inventory/:');
console.log('Payload completo:', JSON.stringify(apiPayload, null, 2));
console.log('Items count:', apiPayload.items.length);
```

### 🌐 API Client (BusinessManagementAPI.js - línea 69)
```javascript
console.log('🌐 [API CLIENT] Request HTTP a la API:');
console.log('URL:', url);
console.log('Body (parsed):', JSON.stringify(bodyObj, null, 2));
console.log('Body.items:', bodyObj.items);
console.log('Body.items.length:', bodyObj.items?.length);
```

### ✅ Service - Response (inventoryService.js - línea 389)
```javascript
console.log('✅ [INVENTORY SERVICE] Respuesta de la API:');
console.log('Respuesta completa:', JSON.stringify(result, null, 2));
```

---

## Estructura de Datos Enviada

Según la documentación de la API (`docs/api/INVENTORY_ADJUST_API.md`), el endpoint espera:

### Endpoint: `POST /inventory/`

**Request Body esperado:**
```json
{
  "items": [
    {
      "product_id": "PROD_ABC_001",
      "quantity_checked": 150
    },
    {
      "product_id": "PROD_DEF_002",
      "quantity_checked": 75
    }
  ],
  "metadata": {
    "source": "physical_count",
    "operator": "warehouse_manager_01",
    "location": "main_warehouse",
    "counting_method": "barcode_scanner",
    "verification": "double_check",
    "timestamp": "2025-11-20T15:30:00Z",
    "notes": "Conteo mensual completo"
  }
}
```

**Response esperado (200 OK):**
```json
{
  "message": "Inventory added"
}
```

---

## Instrucciones para Reproducir y Capturar Logs

1. Abrir la consola del navegador (F12)
2. Ir a la página de Gestión de Inventarios: `/gestion-inventarios`
3. Hacer clic en "Crear Nuevo Inventario"
4. Llenar el formulario:
   - **Operador:** Marcelo
   - **Ubicación:** Cantina
   - **Método de conteo:** manual
   - **Verificación:** single_check
   - **Notas:** Prueba
5. Agregar al menos 2 productos con cantidades
6. Hacer clic en "Crear Inventario"
7. **Capturar todos los logs de la consola** que empiecen con los emojis:
   - 📝 [FRONTEND]
   - 🗄️ [STORE]
   - 📦 [INVENTORY SERVICE]
   - 🚀 [INVENTORY SERVICE]
   - 🌐 [API CLIENT]
   - ✅ [INVENTORY SERVICE]

---

## Preguntas para el Equipo Backend

Con los logs capturados, por favor verificar:

1. **¿Está llegando el array `items` al endpoint?**
   - Verificar en los logs del servidor si `request.body.items` está presente
   - Confirmar que `items` es un array con elementos

2. **¿Qué se está guardando en la base de datos?**
   - ¿Se está ejecutando el INSERT en la tabla `inventory_items`?
   - ¿Hay algún error en los logs del servidor relacionado con items?

3. **¿La transacción es atómica?**
   - Si hay error al guardar items, ¿se está haciendo rollback del inventario?

4. **¿Hay validaciones en el backend que estén rechazando los items?**
   - Validación de `product_id` (¿debe existir en la tabla productos?)
   - Validación de `quantity_checked` (¿debe ser > 0?)

---

## Archivos Modificados con Logs

- `src/pages/InventoryManagement.jsx` (línea 264-272)
- `src/store/useInventoryManagementStore.js` (línea 139-145)
- `src/services/inventoryService.js` (línea 358-392)
- `src/services/BusinessManagementAPI.js` (línea 69-87)

---

## Estructura de Base de Datos Esperada

Según la documentación, debe haber dos tablas:

### Tabla `inventory`
```sql
id: number (PK, AUTO_INCREMENT)
user_id: string
check_date: timestamp
state: boolean
metadata: jsonb
```

### Tabla `inventory_items` (o `inventory_item`)
```sql
id: number (PK, AUTO_INCREMENT)
inventory_id: number (FK → inventory.id)
product_id: string (FK → products.product_id)
quantity_checked: number
previous_quantity: number
```

**¿Están ambas tablas creadas?**
**¿Existe la relación foreign key entre `inventory_items.inventory_id` y `inventory.id`?**

---

## Próximos Pasos

1. ✅ Ejecutar una prueba completa y capturar todos los logs
2. ✅ Compartir los logs con el equipo backend
3. ⏳ Backend: Verificar si `items` llega al endpoint
4. ⏳ Backend: Verificar si hay errores al insertar en `inventory_items`
5. ⏳ Backend: Confirmar estructura de BD y queries SQL ejecutados

---

## ✅ Mejoras Implementadas (2025-11-21)

Después de confirmar que el inventario id=3 se creó correctamente con los items, se implementaron las siguientes mejoras preventivas:

### 1. **Validación Exhaustiva en Frontend**
- ✅ Validación de `product_id` como string no vacío
- ✅ Validación de `quantity_checked` como número >= 0
- ✅ Validación de campos nulos/undefined
- ✅ Validación que items no esté vacío antes de enviar

### 2. **Sanitización de Datos**
- ✅ `product_id`: Convertido a String y trimmed
- ✅ `quantity_checked`: Convertido explícitamente a Number
- ✅ Double-check antes de enviar al store

### 3. **Validación en Múltiples Capas**
- ✅ Frontend: Validación exhaustiva de formulario
- ✅ Store: Validación que items no esté vacío
- ✅ Service: Validación de cada item antes de mapear
- ✅ Service: Validación que array items exista y tenga elementos

### 4. **Logs Condicionales (Solo en Desarrollo)**
- ✅ Todos los logs de debug solo se muestran con `import.meta.env.DEV`
- ✅ No impactan el rendimiento en producción
- ✅ Mantienen la capacidad de debug completa en desarrollo

### 5. **Mejor Feedback al Usuario**
- ✅ Mensaje de éxito con número de productos creados
- ✅ Mensajes de error más descriptivos
- ✅ Validación en tiempo real

---

## 🔧 Corrección del Bug Original

**Problema:** El servicio buscaba `inventoryData.products` pero el frontend enviaba `inventoryData.items`

**Solución:**
```javascript
// ANTES (línea 360)
const apiPayload = {
  items: inventoryData.products?.map(...)  // ❌ products no existe
}

// DESPUÉS (línea 369-389)
const itemsArray = inventoryData.items || inventoryData.products || [];
if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
  throw new Error('Se requiere al menos un producto en el inventario');
}

const apiPayload = {
  items: itemsArray.map((product, index) => {
    // Validación de cada campo
    if (!product.product_id) {
      throw new Error(`Item ${index + 1}: product_id es requerido`);
    }
    // ... más validaciones

    return {
      product_id: String(product.product_id).trim(),
      quantity_checked: Number(product.quantity_checked)
    };
  })
}
```

---

**Fecha de Debug:** 2025-11-21
**Fecha de Mejoras:** 2025-11-21 (después de confirmar éxito con id=3)
**Versión de la API:** v4.0
**Endpoint:** `POST http://localhost:5050/inventory/`
**Estado:** ✅ Funcionando correctamente con validaciones mejoradas

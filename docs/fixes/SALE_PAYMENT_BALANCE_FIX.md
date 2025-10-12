# ✅ Fix: Balance de Caja en Modal de Procesar Pagos

**Fecha:** 11 de Octubre de 2025  
**Problema:** Balance muestra ₲0 en el dropdown de Caja Registradora al procesar pagos  
**Archivo:** `/src/pages/SalePayment.jsx`  
**Estado:** ✅ Implementado

---

## 🐛 Problema

En el modal "Procesar Pago de Venta", el dropdown de selección de caja muestra:

```
Caja #1 - principal
Balance: ₲0  ❌ (debería mostrar ₲417,500)
```

### Causa Raíz

La función `handleLoadCashRegisters()` en `SalePayment.jsx` estaba cargando las cajas directamente desde el servicio **sin calcular el balance**:

```javascript
// ❌ ANTES - No calcula balance
const allCashRegisters = await cashRegisterService.getCashRegisters();
const openCashRegisters = allCashRegisters?.filter(cr => cr.status === 'OPEN');
setCashRegisters(openCashRegisters); // Balance = 0
```

---

## ✅ Solución Implementada

### 1. Importar Utilidad de Cálculo

```javascript
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils';
```

### 2. Modificar Función de Carga

Ahora calcula el balance para cada caja registradora:

```javascript
const handleLoadCashRegisters = async () => {
  setIsCashRegistersLoading(true);
  try {
    const allCashRegisters = await cashRegisterService.getCashRegisters();
    const openCashRegisters = allCashRegisters?.filter(
      cr => cr.status === 'OPEN' || cr.state === 'OPEN'
    ) || [];

    // 🔧 WORKAROUND: Calcular balance para cada caja
    const cashRegistersWithBalance = await Promise.all(
      openCashRegisters.map(async (cashRegister) => {
        // Si el backend ya envía current_balance > 0, usarlo
        if (cashRegister.current_balance && cashRegister.current_balance > 0) {
          return cashRegister;
        }
        
        // Si no, calcular desde movimientos
        try {
          const movements = await cashRegisterService.getMovements(cashRegister.id);
          return calculateCashRegisterBalance(cashRegister, movements);
        } catch (error) {
          console.warn(`⚠️ No se pudieron cargar movimientos para caja ${cashRegister.id}:`, error);
          return cashRegister; // Retornar sin modificar si falla
        }
      })
    );

    console.log('💰 Cash registers with calculated balance:', cashRegistersWithBalance);
    setCashRegisters(cashRegistersWithBalance);
    
    // ... resto del código para seleccionar caja activa
  } catch (error) {
    console.error('Error loading cash registers:', error);
    setCashRegisters([]);
  } finally {
    setIsCashRegistersLoading(false);
  }
};
```

---

## 🧪 Cómo Probar

### 1. Recargar la Aplicación

```bash
# En el navegador:
Ctrl + Shift + R  (hard refresh)
```

### 2. Abrir Modal de Procesar Pago

1. Navegar a `/pagos-ventas`
2. Seleccionar una venta pendiente
3. Click en "Procesar Pago"
4. Seleccionar "Con Caja Registradora"

### 3. Verificar Dropdown

Ahora el dropdown debería mostrar:

```
╔══════════════════════════════════╗
║  Caja #1 - principal              ║
║  Balance: ₲417,500  ✅           ║
╚══════════════════════════════════╝
```

### 4. Verificar Console Logs

En DevTools Console deberías ver:

```console
📦 All cash registers: [...]
📦 Open cash registers: [...]
💰 Cash registers with calculated balance: [{
  id: 1,
  name: "Caja #1 - principal",
  initial_balance: 350000,
  current_balance: 417500,  ✅
  _balance_calculated_on_frontend: true
}]
```

---

## ⚙️ Funcionamiento Técnico

### Flujo de Ejecución

1. **Cargar todas las cajas** → `getCashRegisters()`
2. **Filtrar abiertas** → `status === 'OPEN'`
3. **Para cada caja:**
   - Si `current_balance > 0` → Usar valor del backend ✅
   - Si `current_balance === 0` → Calcular desde movimientos 🔧
4. **Calcular balance:**
   - Cargar movimientos → `getMovements(cashRegisterId)`
   - Aplicar fórmula → `initial_balance + Σ(movimientos)`
5. **Actualizar estado** → `setCashRegisters(cashRegistersWithBalance)`

### Fórmula de Cálculo

```javascript
current_balance = initial_balance 
  + Σ(INCOME movements) 
  - Σ(EXPENSE movements) 
  + Σ(ADJUSTMENT movements)
```

---

## 🔄 Integración con Otros Componentes

Este fix utiliza la misma utilidad implementada para otros componentes:

| Componente | Uso | Estado |
|------------|-----|--------|
| `/src/pages/CashRegister.jsx` | Página principal de cajas | ✅ Implementado |
| `/src/store/useCashRegisterStore.js` | Store Zustand | ✅ Implementado |
| `/src/pages/SalePayment.jsx` | Modal procesar pagos | ✅ Implementado |
| `/src/utils/cashRegisterUtils.js` | Utilidad compartida | ✅ Creada |

---

## ⚠️ Limitaciones

### Este es un Workaround Temporal

1. **Performance**: Requiere 1 request adicional por cada caja abierta para cargar movimientos
2. **Escalabilidad**: Con muchas cajas o muchos movimientos puede ser lento
3. **Duplicación**: El cálculo debería hacerse en el backend (fuente única de verdad)

### Ejemplo de Overhead

```
❌ Sin workaround:
- 1 request: GET /cash-registers

✅ Con workaround (3 cajas abiertas):
- 1 request: GET /cash-registers
- 3 requests: GET /cash-registers/1/movements
- 3 requests: GET /cash-registers/2/movements
- 3 requests: GET /cash-registers/3/movements
= TOTAL: 7 requests (700% más requests)
```

---

## 🚨 Acción Requerida: Fix en Backend

### Prioridad: 🔴 ALTA

El backend DEBE implementar el cálculo de `current_balance` en:

- ✅ `GET /cash-registers` (listado)
- ✅ `GET /cash-registers/active` (caja activa)
- ✅ `GET /cash-registers/{id}` (detalle)

Ver documentación completa en: `/docs/issues/CASH_REGISTER_BALANCE_ZERO.md`

---

## 📊 Comparación: Antes vs Después

### Dropdown - ANTES ❌

```
Caja Registradora: *
[ Caja #1 - principal ]
  Balance: ₲0
```

### Dropdown - DESPUÉS ✅

```
Caja Registradora: *
[ Caja #1 - principal ]
  Balance: ₲417,500
```

---

## ✅ Checklist

- [x] Importar `calculateCashRegisterBalance` en SalePayment.jsx
- [x] Modificar `handleLoadCashRegisters()`
- [x] Agregar cálculo de balance con Promise.all
- [x] Agregar manejo de errores graceful
- [x] Agregar console.log para debugging
- [x] Documentar fix (este archivo)
- [ ] Probar en navegador con venta real
- [ ] Verificar que no afecte performance negativamente
- [ ] Eliminar workaround cuando backend se corrija

---

## 🔗 Referencias

- **Problema original**: `/docs/issues/CASH_REGISTER_BALANCE_ZERO.md`
- **Workaround completo**: `/docs/fixes/CASH_REGISTER_BALANCE_WORKAROUND_IMPLEMENTED.md`
- **Utilidad reutilizable**: `/src/utils/cashRegisterUtils.js`
- **Archivo modificado**: `/src/pages/SalePayment.jsx`

---

**Siguiente paso:** Hard refresh del navegador para ver los cambios aplicados.

**Nota:** Este workaround es temporal. Una vez que el backend implemente el fix correcto, esta lógica debe removerse.

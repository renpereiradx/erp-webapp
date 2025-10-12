# ✅ Workaround Implementado: Balance de Caja Registradora

**Fecha:** 11 de Octubre de 2025  
**Problema:** Balance Actual siempre muestra $0  
**Estado:** ✅ Workaround implementado (temporal hasta que backend se corrija)

---

## 🐛 Problema Original

### Síntomas

- **Balance Inicial**: $350,000 ✅
- **Balance Actual**: $0 ❌ (debería ser $417,500)
- **Diferencia**: -$350,000 en rojo ❌ (debería ser +$67,500 en verde)

### Causa Raíz

El backend **NO envía** el campo `current_balance` en el endpoint `GET /cash-registers/active`:

```json
{
  "id": 1,
  "name": "Caja #1 - principal",
  "initial_balance": 350000
  // ❌ Falta: "current_balance": 417500
}
```

---

## ✅ Solución Implementada

### 1. Utilidad de Cálculo de Balance

**Archivo:** `/src/utils/cashRegisterUtils.js`

Función que calcula `current_balance` basándose en movimientos:

```javascript
export function calculateCashRegisterBalance(cashRegister, movements = []) {
  // Si el backend envía current_balance > 0, usarlo
  if (cashRegister.current_balance && cashRegister.current_balance > 0) {
    return cashRegister;
  }
  
  // Calcular desde movimientos
  const initialBalance = cashRegister.initial_balance || 0;
  const movementsSum = movements.reduce((sum, movement) => {
    switch (movement.movement_type) {
      case 'INCOME': return sum + movement.amount;
      case 'EXPENSE': return sum - movement.amount;
      case 'ADJUSTMENT': return sum + movement.amount;
      default: return sum;
    }
  }, 0);
  
  return {
    ...cashRegister,
    current_balance: initialBalance + movementsSum,
    _balance_calculated_on_frontend: true
  };
}
```

### 2. Integración en el Store

**Archivo:** `/src/store/useCashRegisterStore.js`

Modificado `getActiveCashRegister` para calcular balance automáticamente:

```javascript
getActiveCashRegister: async () => {
  set({ isActiveCashRegisterLoading: true });
  
  try {
    const activeCashRegister = await cashRegisterService.getActiveCashRegister();
    
    // 🔧 WORKAROUND: Calcular balance si el backend no lo envía
    if (!activeCashRegister.current_balance || activeCashRegister.current_balance === 0) {
      const movements = await cashRegisterService.getMovements(activeCashRegister.id);
      const cashRegisterWithBalance = calculateCashRegisterBalance(
        activeCashRegister, 
        movements
      );
      
      set({ 
        activeCashRegister: cashRegisterWithBalance,
        movements,
        isActiveCashRegisterLoading: false 
      });
      
      return cashRegisterWithBalance;
    }
    
    // Backend envía balance correcto
    set({ activeCashRegister, isActiveCashRegisterLoading: false });
    return activeCashRegister;
  } catch (error) {
    set({ activeCashRegisterError: error, isActiveCashRegisterLoading: false });
    throw error;
  }
}
```

### 3. Carga Automática de Datos

**Archivo:** `/src/pages/CashRegister.jsx`

Agregado `useEffect` para cargar datos al montar la página:

```javascript
// 🔄 Cargar datos al montar el componente
useEffect(() => {
  const loadInitialData = async () => {
    await handleLoadActiveCashRegister();
    await handleLoadCashRegisters();
    
    if (activeCashRegister?.id) {
      await handleLoadMovements();
    }
  };
  
  loadInitialData();
}, []); // Solo al montar

// 🔄 Recargar movimientos cuando cambie la caja activa
useEffect(() => {
  if (activeCashRegister?.id) {
    handleLoadMovements();
  }
}, [activeCashRegister?.id]);
```

### 4. Workaround en Página de Pagos ✅ NUEVO

**Archivo:** `/src/pages/SalePayment.jsx`

Aplicado el mismo workaround para calcular balance al cargar cajas registradoras en el modal de "Procesar Pago":

```javascript
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils';

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
        if (cashRegister.current_balance && cashRegister.current_balance > 0) {
          return cashRegister;
        }
        
        try {
          const movements = await cashRegisterService.getMovements(cashRegister.id);
          return calculateCashRegisterBalance(cashRegister, movements);
        } catch (error) {
          console.warn(`⚠️ No se pudieron cargar movimientos para caja ${cashRegister.id}:`, error);
          return cashRegister;
        }
      })
    );

    console.log('💰 Cash registers with calculated balance:', cashRegistersWithBalance);
    setCashRegisters(cashRegistersWithBalance);
    // ... resto del código
  } catch (error) {
    console.error('Error loading cash registers:', error);
    setCashRegisters([]);
  } finally {
    setIsCashRegistersLoading(false);
  }
};
```

**Beneficios:**
- ✅ El dropdown de cajas en el modal ahora muestra el balance correcto
- ✅ Usa la misma utilidad reutilizable
- ✅ Maneja errores gracefully (si falla cargar movimientos, muestra la caja sin balance)
- ✅ Ya tiene `useEffect` para carga automática al montar el componente

---

## 🧪 Cómo Probar

### 1. Recargar la Aplicación

```bash
# Detener el servidor de desarrollo
Ctrl+C

# Reiniciar
npm run dev
# o
pnpm dev
```

### 2. Abrir Página de Cajas

1. Navegar a `/cash-register`
2. Los datos se deben cargar **automáticamente**
3. Verificar en DevTools Console:

```console
⚠️ Backend no envía current_balance, calculando desde movimientos...
💰 Balance calculado en frontend (workaround): {
  cashRegisterId: 1,
  cashRegisterName: "Caja #1 - principal",
  initial: 350000,
  movementsSum: 67500,
  total: 417500,
  movementCount: 1
}
```

### 3. Verificar Display

Ahora debería ver:

```
╔══════════════════════════════════════╗
║  Caja #1 - principal         [ABIERTA]  ║
╠══════════════════════════════════════╣
║  Balance Inicial:    $350,000        ║
║  Balance Actual:     $417,500   ✅  ║
║  Diferencia:         +$67,500   🟢  ║
╚══════════════════════════════════════╝
```

---

## ⚠️ Limitaciones del Workaround

### Problemas Conocidos

1. **Performance**: 
   - Requiere cargar TODOS los movimientos para calcular balance
   - Con muchos movimientos (>1000) puede ser lento

2. **Requests Adicionales**:
   - Backend: 1 request (`GET /cash-registers/active`)
   - Frontend: 2 requests (`GET /cash-registers/active` + `GET /cash-registers/{id}/movements`)
   - **Total: 100% más requests** 😞

3. **Duplicación de Lógica**:
   - El cálculo está duplicado (backend + frontend)
   - Riesgo de inconsistencias si cambia la lógica

4. **No Escalable**:
   - Funciona para demo/desarrollo
   - NO recomendado para producción con alto volumen

---

## 🚨 Acción Requerida: Fix en Backend

### Prioridad: 🔴 ALTA

Este workaround es **TEMPORAL**. El backend DEBE implementar el fix correcto.

### Backend Fix Requerido

**Archivo:** Probablemente `services/cash_register.go` o similar

**Cambio necesario:** Agregar subconsulta para calcular `current_balance`

```sql
SELECT 
  cr.id,
  cr.name,
  cr.status,
  cr.initial_balance,
  cr.opened_at,
  cr.opened_by,
  cr.closed_at,
  cr.closed_by,
  cr.final_balance,
  cr.notes,
  -- ✅ AGREGAR ESTE CAMPO
  cr.initial_balance + COALESCE(
    (
      SELECT SUM(
        CASE 
          WHEN movement_type = 'INCOME' THEN amount
          WHEN movement_type = 'EXPENSE' THEN -amount
          WHEN movement_type = 'ADJUSTMENT' THEN amount
          ELSE 0
        END
      )
      FROM cash_register_movements
      WHERE cash_register_id = cr.id
    ), 0
  ) AS current_balance
FROM cash_registers cr
WHERE cr.id = $1 AND cr.status = 'OPEN'
```

### Endpoints Afectados

- ✅ `GET /cash-registers/active` ← **Más crítico**
- ✅ `GET /cash-registers` (listado)
- ✅ `GET /cash-registers/{id}` (detalle)
- ⚠️ `PUT /cash-registers/{id}/close` (también debería incluir `current_balance`)

---

## 📊 Comparación: Antes vs Después

### API Response - ANTES ❌

```json
{
  "id": 1,
  "name": "Caja #1 - principal",
  "initial_balance": 350000
  // Falta current_balance
}
```

### API Response - DESPUÉS (con workaround) ✅

```json
{
  "id": 1,
  "name": "Caja #1 - principal",
  "initial_balance": 350000,
  "current_balance": 417500,  // ✅ Calculado en frontend
  "_balance_calculated_on_frontend": true  // Flag de debugging
}
```

### API Response - OBJETIVO FINAL 🎯

```json
{
  "id": 1,
  "name": "Caja #1 - principal",
  "initial_balance": 350000,
  "current_balance": 417500  // ✅ Calculado en backend (óptimo)
}
```

---

## 🔗 Referencias

- **Documentación del problema**: `/docs/issues/CASH_REGISTER_BALANCE_ZERO.md`
- **Utilidad de cálculo**: `/src/utils/cashRegisterUtils.js`
- **Store modificado**: `/src/store/useCashRegisterStore.js`
- **Páginas modificadas**: 
  - `/src/pages/CashRegister.jsx` (página principal de cajas)
  - `/src/pages/SalePayment.jsx` (modal de procesar pagos) ✅ NUEVO
- **API Docs**: `/docs/api/CASH_REGISTER_API.md`

---

## ✅ Checklist de Implementación

- [x] Crear utilidad `calculateCashRegisterBalance`
- [x] Integrar en `useCashRegisterStore`
- [x] Agregar `useEffect` para carga automática en CashRegister.jsx
- [x] Importar `useEffect` en componente
- [x] Documentar problema en `/docs/issues/`
- [x] Documentar workaround (este archivo)
- [x] **Aplicar workaround en SalePayment.jsx** ✅ NUEVO
- [ ] Probar en navegador (pendiente)
- [ ] Reportar bug al equipo backend (pendiente)
- [ ] Eliminar workaround cuando backend se corrija (pendiente)

---

**Siguiente paso:** Recargar la aplicación y verificar que el balance se muestre correctamente.

**Recordatorio:** Este es un fix temporal. El backend debe corregir el problema para evitar overhead de performance.

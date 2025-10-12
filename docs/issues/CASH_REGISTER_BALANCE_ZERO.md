# 🐛 Bug: Balance de Caja Registradora Siempre es $0

## 📋 Problema Identificado

El balance actual de la caja registradora siempre muestra **$0**, aunque hay movimientos registrados.

### Evidencia de las Capturas

**Captura 1 - Cajas Registradoras:**
- Balance Inicial: $350,000
- Balance Actual: **$0** ❌
- Diferencia: -$350,000 (en rojo)
- Movimiento mostrado: "Pago de venta #SALE-1760203557-339" → +$67,500

**Captura 2 - Modal de Pago:**
- Caja #1 - Balance: **₲0** ❌

### Balance Esperado

```
Balance Actual = Balance Inicial + Suma de Movimientos
Balance Actual = $350,000 + $67,500 = $417,500 ✅
```

## 🎯 Causa Raíz

El problema está en el **BACKEND**. El endpoint `GET /cash-registers/active` no está calculando o enviando correctamente el campo `current_balance`.

### Comportamiento Actual

```json
{
  "id": 6,
  "name": "Caja #1 - principal", 
  "status": "OPEN",
  "initial_balance": 350000,
  "current_balance": 0,  ← Siempre devuelve 0 o null
  "opened_at": "2025-10-11T09:27:56Z"
}
```

### Comportamiento Esperado (según CASH_REGISTER_API.md)

```json
{
  "id": 6,
  "name": "Caja #1 - principal",
  "status": "OPEN",
  "initial_balance": 350000,
  "current_balance": 417500,  ← Debe calcular: initial + Σ(movimientos)
  "opened_at": "2025-10-11T09:27:56Z"
}
```

## 📝 Cálculo Requerido en el Backend

El backend debe calcular `current_balance` usando:

```sql
SELECT 
  cr.*,
  cr.initial_balance + COALESCE(SUM(
    CASE 
      WHEN crm.movement_type = 'INCOME' THEN crm.amount
      WHEN crm.movement_type = 'EXPENSE' THEN -crm.amount
      WHEN crm.movement_type = 'ADJUSTMENT' THEN crm.amount
      ELSE 0
    END
  ), 0) AS current_balance
FROM cash_registers cr
LEFT JOIN cash_register_movements crm ON cr.id = crm.cash_register_id
WHERE cr.id = ? AND cr.status = 'OPEN'
GROUP BY cr.id
```

## ✅ Solución: Workaround Temporal en el Frontend

Mientras el backend se corrige, podemos calcular el balance en el frontend cuando se cargue la caja activa.

### Implementación

Crear una utilidad para calcular el balance:

```javascript
// src/utils/cashRegisterUtils.js

/**
 * Calcula el balance actual de una caja basándose en sus movimientos
 * WORKAROUND: Mientras el backend no calcule current_balance correctamente
 * 
 * @param {Object} cashRegister - Objeto de caja registradora
 * @param {Array} movements - Array de movimientos de la caja
 * @returns {Object} Caja con current_balance calculado
 */
export function calculateCashRegisterBalance(cashRegister, movements = []) {
  if (!cashRegister) return null;
  
  // Si el backend ya envía current_balance > 0, usarlo
  if (cashRegister.current_balance && cashRegister.current_balance > 0) {
    return cashRegister;
  }
  
  // Calcular balance basándose en movimientos
  const initialBalance = cashRegister.initial_balance || 0;
  
  const movementsSum = movements.reduce((sum, movement) => {
    switch (movement.movement_type) {
      case 'INCOME':
        return sum + (movement.amount || 0);
      case 'EXPENSE':
        return sum - (movement.amount || 0);
      case 'ADJUSTMENT':
        return sum + (movement.amount || 0);
      default:
        return sum;
    }
  }, 0);
  
  const calculatedBalance = initialBalance + movementsSum;
  
  console.log('💰 Balance calculado en frontend:', {
    initial: initialBalance,
    movements: movementsSum,
    total: calculatedBalance,
    movementCount: movements.length
  });
  
  return {
    ...cashRegister,
    current_balance: calculatedBalance,
    _balance_calculated_on_frontend: true  // Flag para debugging
  };
}
```

### Actualizar el Store

Modificar `useCashRegisterStore.js` para calcular el balance:

```javascript
// En getActiveCashRegister
getActiveCashRegister: async () => {
  set({ isActiveCashRegisterLoading: true, activeCashRegisterError: null });
  
  try {
    const cashRegister = await cashRegisterService.getActiveCashRegister();
    
    if (cashRegister) {
      // 🔧 WORKAROUND: Obtener movimientos y calcular balance
      try {
        const movements = await cashRegisterService.getMovements(cashRegister.id);
        const cashRegisterWithBalance = calculateCashRegisterBalance(cashRegister, movements);
        
        set({ 
          activeCashRegister: cashRegisterWithBalance,
          movements,  // También guardar movimientos
          isActiveCashRegisterLoading: false 
        });
      } catch (movementsError) {
        // Si falla obtener movimientos, usar caja sin balance calculado
        console.warn('No se pudieron cargar movimientos para calcular balance', movementsError);
        set({ 
          activeCashRegister: cashRegister,
          isActiveCashRegisterLoading: false 
        });
      }
    } else {
      set({ 
        activeCashRegister: null, 
        isActiveCashRegisterLoading: false 
      });
    }
    
    return cashRegister;
  } catch (error) {
    // ... manejo de errores
  }
}
```

## 🚨 IMPORTANTE: Reportar al Backend

Este workaround es **TEMPORAL**. El backend DEBE corregir este bug porque:

1. ❌ **Ineficiencia**: Requiere cargar todos los movimientos solo para calcular el balance
2. ❌ **Duplicación**: La lógica de cálculo debería estar en una sola place (backend)
3. ❌ **Inconsistencia**: Otros endpoints pueden no tener el balance correcto
4. ❌ **Performance**: Con muchos movimientos, será lento

### Bug Report para Backend

```markdown
## 🐛 Backend Bug: current_balance siempre es 0

**Endpoint:** `GET /cash-registers/active`

**Prioridad:** Alta

**Impacto:** Los usuarios no ven el balance real de su caja, causando confusión

**Pasos para reproducir:**
1. Abrir caja con balance inicial de $350,000
2. Registrar movimiento de +$67,500
3. Consultar caja activa
4. Observar que `current_balance` es 0 en lugar de $417,500

**Fix requerido:** Calcular `current_balance` sumando `initial_balance + Σ(movimientos)`

**Otros endpoints afectados:**
- `GET /cash-registers` (listado)
- `GET /cash-registers/{id}` (detalle)
- `PUT /cash-registers/{id}/close` (cierre)
```

## 📚 Referencias

- [CASH_REGISTER_API.md](../api/CASH_REGISTER_API.md) - Línea 121: Estructura esperada con `current_balance`
- Capturas de pantalla del bug en contexto de esta issue

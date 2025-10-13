/**
 * 💰 Utilidades para Cajas Registradoras
 * Incluye workarounds temporales mientras el backend se corrige
 */

/**
 * Calcula el balance actual de una caja basándose en sus movimientos
 *
 * ⚠️ WORKAROUND TEMPORAL: Mientras el backend no calcule current_balance correctamente
 *
 * El backend debería enviar `current_balance` calculado, pero actualmente devuelve 0.
 * Esta función calcula el balance en el frontend como solución temporal.
 *
 * @param {Object} cashRegister - Objeto de caja registradora del backend
 * @param {Array} movements - Array de movimientos de la caja
 * @returns {Object} Caja con current_balance calculado correctamente
 *
 * @example
 * const cashRegister = { id: 1, initial_balance: 350000, current_balance: 0 };
 * const movements = [
 *   { movement_type: 'INCOME', amount: 67500 },
 *   { movement_type: 'EXPENSE', amount: 10000 }
 * ];
 * const result = calculateCashRegisterBalance(cashRegister, movements);
 * // result.current_balance === 407500 (350000 + 67500 - 10000)
 */
export function calculateCashRegisterBalance(cashRegister, movements = []) {
  if (!cashRegister) return null

  // Si el backend ya envía current_balance > 0, usarlo
  // (cuando corrijan el bug, esta función se volverá transparente)
  if (cashRegister.current_balance && cashRegister.current_balance > 0) {
    console.log(
      '✅ Backend envía current_balance correctamente:',
      cashRegister.current_balance
    )
    return cashRegister
  }

  // Calcular balance basándose en movimientos
  const initialBalance = cashRegister.initial_balance || 0

  const movementsSum = (movements || []).reduce((sum, movement) => {
    switch (movement.movement_type) {
      case 'INCOME':
        return sum + (movement.amount || 0)
      case 'EXPENSE':
        return sum - (movement.amount || 0)
      case 'ADJUSTMENT':
        // Los ajustes pueden ser positivos o negativos según el backend
        // Asumir que amount ya tiene el signo correcto
        return sum + (movement.amount || 0)
      default:
        console.warn(
          '⚠️ Tipo de movimiento desconocido:',
          movement.movement_type
        )
        return sum
    }
  }, 0)

  const calculatedBalance = initialBalance + movementsSum

  console.log('💰 Balance calculado en frontend (workaround):', {
    cashRegisterId: cashRegister.id,
    cashRegisterName: cashRegister.name,
    initial: initialBalance,
    movementsSum,
    total: calculatedBalance,
    movementCount: movements.length,
    note: 'Este cálculo es temporal - el backend debe enviar current_balance',
  })

  return {
    ...cashRegister,
    current_balance: calculatedBalance,
    _balance_calculated_on_frontend: true, // Flag para debugging
  }
}

/**
 * Calcula el balance para múltiples cajas
 *
 * @param {Array} cashRegisters - Array de cajas registradoras
 * @param {Object} movementsByCashRegister - Objeto con movimientos por caja { [id]: movements[] }
 * @returns {Array} Array de cajas con balances calculados
 *
 * @example
 * const cashRegisters = [{ id: 1, initial_balance: 100000 }, { id: 2, initial_balance: 200000 }];
 * const movements = {
 *   1: [{ movement_type: 'INCOME', amount: 50000 }],
 *   2: [{ movement_type: 'EXPENSE', amount: 30000 }]
 * };
 * const result = calculateMultipleCashRegisterBalances(cashRegisters, movements);
 */
export function calculateMultipleCashRegisterBalances(
  cashRegisters,
  movementsByCashRegister = {}
) {
  if (!Array.isArray(cashRegisters)) return []

  return cashRegisters.map(cashRegister => {
    const movements = movementsByCashRegister[cashRegister.id] || []
    return calculateCashRegisterBalance(cashRegister, movements)
  })
}

/**
 * Valida que el balance calculado coincida con el esperado
 * Útil para verificar integridad de datos
 *
 * @param {Object} cashRegister - Caja con balance
 * @param {number} expectedBalance - Balance esperado
 * @param {number} tolerance - Tolerancia permitida (default: 0)
 * @returns {Object} Resultado de validación { valid: boolean, difference: number, message: string }
 */
export function validateCashRegisterBalance(
  cashRegister,
  expectedBalance,
  tolerance = 0
) {
  if (!cashRegister || typeof expectedBalance !== 'number') {
    return {
      valid: false,
      difference: 0,
      message: 'Datos inválidos para validación',
    }
  }

  const currentBalance = cashRegister.current_balance || 0
  const difference = Math.abs(currentBalance - expectedBalance)
  const valid = difference <= tolerance

  return {
    valid,
    difference,
    message: valid
      ? 'Balance correcto'
      : `Diferencia de ${difference} detectada (tolerancia: ${tolerance})`,
  }
}

export default {
  calculateCashRegisterBalance,
  calculateMultipleCashRegisterBalances,
  validateCashRegisterBalance,
}

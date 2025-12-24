/**
 * 💰 Utilidades para Cajas Registradoras
 *
 * NOTA: El backend ahora calcula current_balance automáticamente.
 * Estas funciones se mantienen como utilidades de respaldo/validación.
 */

/**
 * Calcula el balance actual de una caja basándose en sus movimientos
 *
 * ✅ El backend ahora envía current_balance calculado para cajas OPEN.
 * Esta función se puede usar para validación o como fallback.
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

  // Si el backend ya envía current_balance (valor válido), usarlo directamente
  if (
    cashRegister.current_balance != null &&
    cashRegister.current_balance > 0
  ) {
    return cashRegister
  }

  // Asegurar que movements es un array válido (protección contra null/undefined)
  const safeMovements = Array.isArray(movements) ? movements : []

  // Si el endpoint enriquecido v2.1 devuelve running_balance, usar el último movimiento
  if (
    safeMovements.length > 0 &&
    typeof safeMovements[safeMovements.length - 1]?.running_balance === 'number'
  ) {
    const lastMovement = safeMovements[safeMovements.length - 1]
    return {
      ...cashRegister,
      current_balance: lastMovement.running_balance,
    }
  }

  // Calcular balance basándose en movimientos (fallback)
  const initialBalance = cashRegister.initial_balance || 0

  const movementsSum = safeMovements.reduce((sum, movement) => {
    switch (movement.movement_type) {
      case 'INCOME':
        return sum + (movement.amount || 0)
      case 'EXPENSE':
        return sum - (movement.amount || 0)
      case 'ADJUSTMENT':
        return sum + (movement.amount || 0)
      default:
        return sum
    }
  }, 0)

  return {
    ...cashRegister,
    current_balance: initialBalance + movementsSum,
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

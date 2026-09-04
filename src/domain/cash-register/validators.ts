/**
 * Validation rules for cash-register forms.
 * Returns i18n message KEYS (never user-facing text); the UI resolves
 * them via t(key, fallback).
 */

export function isValidInitialBalance(balance: number): boolean {
  return !isNaN(balance) && balance >= 0;
}

export function isValidMovementAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0;
}

export function validateOpenForm(name: string, initialBalance: number): string | null {
  if (!name.trim()) return 'cashRegister.error.noName';
  if (!isValidInitialBalance(initialBalance)) return 'cashRegister.error.invalidBalance';
  return null;
}

export function validateCloseForm(finalBalance: number): string | null {
  if (isNaN(finalBalance) || finalBalance < 0) return 'cashRegister.error.invalidFinalBalance';
  return null;
}

export function validateMovementForm(amount: number, concept: string): string | null {
  if (!isValidMovementAmount(amount)) return 'cashMovement.error.invalidAmount';
  if (!concept.trim()) return 'cashMovement.error.noConcept';
  return null;
}

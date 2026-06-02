export function isValidInitialBalance(balance: number): boolean {
  return !isNaN(balance) && balance >= 0;
}

export function isValidMovementAmount(amount: number): boolean {
  return !isNaN(amount) && amount > 0;
}

export function validateOpenForm(name: string, initialBalance: number): string | null {
  if (!name.trim()) return 'El nombre de la caja es requerido';
  if (!isValidInitialBalance(initialBalance)) return 'El fondo inicial no es válido';
  return null;
}

export function validateCloseForm(finalBalance: number): string | null {
  if (isNaN(finalBalance) || finalBalance < 0) return 'El saldo ingresado no es válido';
  return null;
}

export function validateMovementForm(amount: number, concept: string): string | null {
  if (!isValidMovementAmount(amount)) return 'El monto no es válido';
  if (!concept.trim()) return 'El concepto es requerido';
  return null;
}

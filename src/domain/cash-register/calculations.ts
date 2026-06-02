import { Denominations } from './models';

export function calculateAuditDifference(systemBalance: number, countedAmount: number): number {
  return countedAmount - systemBalance;
}

export function calculateTotalCounted(denominations: Denominations | null, counts: Record<number, number>): number {
  if (!denominations) return 0;
  let total = 0;
  denominations.bills?.forEach(val => total += (counts[val] || 0) * val);
  denominations.coins?.forEach(val => total += (counts[val] || 0) * val);
  return total;
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('es-PY');
}

export function calculateNetDifference(currentBalance: number, initialBalance: number): number {
  return currentBalance - initialBalance;
}

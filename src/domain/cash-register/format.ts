/**
 * Pure formatting helpers for the cash-register domain.
 * No React, no side effects — safe to unit test and reuse.
 */

const PYG_LOCALE = 'es-PY';

/** Groups digits with es-PY separators for amount inputs ("1250000" → "1.250.000"). */
export function groupDigits(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString(PYG_LOCALE);
}

/** Reverses groupDigits ("1.250.000" → "1250000"). */
export function parseGroupedDigits(formatted: string): string {
  if (!formatted) return '';
  return formatted.replace(/\./g, '').replace(/,/g, '');
}

/** Formats an amount as Guaraní with symbol: "₲1.250.000" (negatives: "₲-50.000"). */
export function formatPYG(amount: number): string {
  return `₲${Math.round(amount).toLocaleString(PYG_LOCALE)}`;
}

/** Formats an ISO datetime as "dd/mm/aaaa hh:mm". */
export function formatDateTimeEs(dateString: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

/** Elapsed time since the session opened, as "Xh Ym" / "Ym"; null when unknown. */
export function sessionDuration(
  openedAt: string | undefined,
  now: Date = new Date()
): string | null {
  if (!openedAt) return null;
  const diffMs = now.getTime() - new Date(openedAt).getTime();
  const hrs = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

/** Balance shown while the session is open: current, falling back to the initial float. */
export function systemBalanceOf(session: {
  current_balance?: number | null;
  initial_balance?: number | null;
}): number {
  return session.current_balance || session.initial_balance || 0;
}

/** Difference between physically counted cash and the system balance (positive = sobrante). */
export function closingDifference(countedBalance: number, systemBalance: number): number {
  return countedBalance - systemBalance;
}

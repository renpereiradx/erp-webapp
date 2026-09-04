/**
 * Pure display helpers for the users domain.
 * No React, no side effects — safe to unit test and reuse.
 */

import type { User } from '@/types';

export interface RoleRef {
  id: string;
  name: string;
}

/** Well-known admin role id used by the backend seed. */
export const ADMIN_ROLE_ID = 'F2VLso';

/** "Ada" + "Lovelace" → "Ada Lovelace", tolerating missing parts. */
export function getUserFullName(user: Pick<User, 'first_name' | 'last_name'>): string {
  return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
}

/** Full name when present, otherwise the username (list display contract). */
export function getUserDisplayName(
  user: Pick<User, 'first_name' | 'last_name' | 'username' | 'email'>,
): string {
  return getUserFullName(user) || user.username || user.email || '';
}

/** First letters of first/last name, uppercased ("Ada Lovelace" → "AL"). */
export function getUserInitials(user: Pick<User, 'first_name' | 'last_name'>): string {
  return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
}

/** Visual tone for a role badge: admin roles stand out, the rest are neutral. */
export function getRoleBadgeTone(role: RoleRef): 'primary' | 'neutral' {
  return role.id === ADMIN_ROLE_ID ? 'primary' : 'neutral';
}

/** ISO date → localized date string, or a fallback label when missing. */
export function formatDateOrFallback(
  value: string | undefined | null,
  fallback: string,
): string {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
}

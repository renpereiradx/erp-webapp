/**
 * Pure filtering logic for the sessions domain.
 * No React, no side effects — safe to unit test and reuse.
 */

import type { UserSession } from '@/types';
import { getSessionDisplayName, getSessionDisplayEmail } from './sessionDisplay';

/** Filter values handled by the admin sessions toolbar. */
export type SessionStatusFilter = 'all' | 'active' | 'idle' | 'revoked';

export interface SessionFilterCriteria {
  search: string;
  status: SessionStatusFilter;
}

/** Case-insensitive search across user, email, IP, device and location. */
export function filterSessions(
  sessions: UserSession[],
  { search, status }: SessionFilterCriteria,
): UserSession[] {
  const searchLower = search.trim().toLowerCase();

  return sessions.filter((session) => {
    const matchesSearch =
      !searchLower ||
      getSessionDisplayName(session).toLowerCase().includes(searchLower) ||
      getSessionDisplayEmail(session).toLowerCase().includes(searchLower) ||
      (session.user_username || session.user?.username || '').toLowerCase().includes(searchLower) ||
      (session.ip_address ?? '').includes(search.trim()) ||
      (session.device_type ?? '').toLowerCase().includes(searchLower) ||
      (session.location_info ?? '').toLowerCase().includes(searchLower);

    const matchesStatus =
      status === 'all' ||
      (status === 'active' && session.is_active !== false && !session.is_idle) ||
      (status === 'idle' && session.is_idle === true) ||
      (status === 'revoked' && session.is_active === false);

    return matchesSearch && matchesStatus;
  });
}

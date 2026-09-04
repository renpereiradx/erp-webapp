/**
 * Pure display helpers for the sessions domain.
 * No React, no side effects — safe to unit test and reuse.
 */

import type { User, UserSession } from '@/types';

export type SessionDeviceKey = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/** Normalizes the backend device type to a closed set for icon mapping. */
export function getSessionDeviceKey(session: Pick<UserSession, 'device_type'>): SessionDeviceKey {
  switch (session.device_type) {
    case 'mobile':
    case 'tablet':
    case 'desktop':
      return session.device_type;
    default:
      return 'unknown';
  }
}

/** Session status as a closed union for badge rendering. */
export type SessionStatusKey = 'revoked' | 'idle' | 'active';

export function getSessionStatusKey(session: UserSession): SessionStatusKey {
  if (session.is_active === false) return 'revoked';
  if (session.is_idle) return 'idle';
  return 'active';
}

/** Display name from enriched flat fields, falling back to nested user, username, then user id. */
export function getSessionDisplayName(session: UserSession): string {
  const flat = `${session.user_first_name ?? ''} ${session.user_last_name ?? ''}`.trim();
  if (flat) return flat;
  const nested = `${session.user?.first_name ?? ''} ${session.user?.last_name ?? ''}`.trim();
  if (nested) return nested;
  return session.user_username || session.user?.username || `ID: ${session.user_id}`;
}

/**
 * Fills missing identity fields with the logged user's data when the session
 * belongs to them (the list endpoint may not enrich every row).
 */
export function withCurrentUserFallback(
  sessions: UserSession[],
  currentUser: Pick<User, 'id' | 'first_name' | 'last_name' | 'username' | 'email'> | null,
): UserSession[] {
  if (!currentUser) return sessions;

  return sessions.map((session) => {
    const hasIdentity = Boolean(
      session.user_first_name ||
        session.user_last_name ||
        session.user_username ||
        session.user_email ||
        session.user?.first_name ||
        session.user?.last_name ||
        session.user?.username ||
        session.user?.email,
    );
    if (hasIdentity || String(session.user_id) !== String(currentUser.id)) return session;

    return {
      ...session,
      user_first_name: currentUser.first_name,
      user_last_name: currentUser.last_name,
      user_username: currentUser.username,
      user_email: currentUser.email,
    };
  });
}

export function getSessionDisplayEmail(session: UserSession): string {
  return session.user_email || session.user?.email || '';
}

export function getSessionAvatarInitial(session: UserSession): string {
  const source =
    session.user_first_name ||
    session.user?.first_name ||
    session.user_username ||
    session.user?.username ||
    '';
  return source.charAt(0).toUpperCase() || 'U';
}

/** Truncates a user agent for the dense table cell ("…", 24 chars). */
export function truncateUserAgent(userAgent: string | undefined, max = 24): string | null {
  if (!userAgent) return null;
  return userAgent.length > max ? `${userAgent.substring(0, max)}…` : userAgent;
}

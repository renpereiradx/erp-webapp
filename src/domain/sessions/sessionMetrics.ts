/**
 * Pure metrics computation for the sessions domain.
 * No React, no side effects — safe to unit test and reuse.
 */

import type { UserSession } from '@/types';

export interface SessionMetrics {
  /** Sessions that can still be used (not revoked), idle or not. */
  active: number;
  /** Sessions flagged as idle by the backend. */
  idle: number;
  /** Revoked sessions in the payload (the endpoint does not filter by date). */
  revoked: number;
  /** Sessions flagged as anomalous. */
  anomalies: number;
}

/** Derives the dashboard counters from a session list in a single pass. */
export function computeSessionMetrics(sessions: UserSession[]): SessionMetrics {
  let active = 0;
  let idle = 0;
  let revoked = 0;
  let anomalies = 0;

  for (const session of sessions) {
    if (session.is_active === false) revoked++;
    else active++;
    if (session.is_idle) idle++;
    if (session.is_anomaly) anomalies++;
  }

  return { active, idle, revoked, anomalies };
}

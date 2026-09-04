/**
 * Pure insight derivation for the admin sessions dashboard.
 * Everything is computed from real session data — no fabricated numbers.
 * No React, no side effects — safe to unit test and reuse.
 */

import type { UserSession } from '@/types';

export interface ActivityBucket {
  /** Bucket start hour (0-23). */
  hour: number;
  /** Human label ("08:00"). */
  label: string;
  /** Session activity count in the bucket. */
  count: number;
}

/** Hour labels for the 12 two-hour buckets of a day ("00:00", "02:00", …). */
const BUCKET_LABELS = Array.from({ length: 12 }, (_, i) => {
  const hour = i * 2;
  return `${String(hour).padStart(2, '0')}:00`;
});

/** Distributes sessions over 2-hour buckets of the day by last activity. */
export function activityByHour(sessions: UserSession[]): ActivityBucket[] {
  const counts = new Array<number>(12).fill(0);

  for (const session of sessions) {
    if (!session.last_activity) continue;
    const date = new Date(session.last_activity);
    if (Number.isNaN(date.getTime())) continue;
    counts[Math.floor(date.getHours() / 2)]++;
  }

  return counts.map((count, index) => ({
    hour: index * 2,
    label: BUCKET_LABELS[index],
    count,
  }));
}

export interface LocationSlice {
  location: string;
  count: number;
  /** Share of the total, 0-100 rounded. */
  percent: number;
}

const UNKNOWN_LOCATION_KEY = '__unknown__';

/** Groups sessions by `location_info` (unknowns lumped together), highest first. */
export function locationDistribution(sessions: UserSession[]): LocationSlice[] {
  const total = sessions.length;
  if (total === 0) return [];

  const counts = new Map<string, number>();
  for (const session of sessions) {
    const key = session.location_info?.trim() || UNKNOWN_LOCATION_KEY;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([location, count]) => ({
      location: location === UNKNOWN_LOCATION_KEY ? '' : location,
      count,
      percent: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** True when there is at least one non-zero bucket (i.e. a chart is worth drawing). */
export function hasActivityData(buckets: ActivityBucket[]): boolean {
  return buckets.some((bucket) => bucket.count > 0);
}

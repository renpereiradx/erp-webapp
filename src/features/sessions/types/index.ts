/**
 * Types for the sessions feature (admin control).
 */

export type TFn = (key: string, defaultValue?: string, vars?: Record<string, unknown>) => string;

export { type SessionStatusFilter } from '@/domain/sessions/sessionFilters';

/**
 * Types for the users feature (list + detail).
 * Core entities come from `@/types`; these are feature-local shapes.
 */

export type TFn = (key: string, defaultValue?: string, vars?: Record<string, unknown>) => string;

export interface Role {
  id: string;
  name: string;
}

export interface UsersFilters {
  search: string;
  status: '' | 'active' | 'inactive';
  role_id: string;
}

export interface UsersPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Rows of the selection set: id -> selected. Kept as array for order stability. */
export type SelectedUserIds = string[];

/** Request for the destructive-action confirmation dialog. */
export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  action: () => Promise<void> | void;
}

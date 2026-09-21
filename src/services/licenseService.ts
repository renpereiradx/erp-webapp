import apiClient from './api';

// Cliente del endpoint de licenciamiento (PLAN_BI_PACK_PREMIUM ADR-5).
// GET /api/v1/system/license es auth-only (sin permiso de módulo): cualquier
// usuario autenticado puede consultar qué edición corre la instalación.

export type LicenseStatus =
  | 'active'
  | 'grace'
  | 'expired'
  | 'none'
  | 'invalid';

export interface LicenseSnapshot {
  status: LicenseStatus;
  enforcing: boolean;
  edition?: string;
  customer?: string;
  modules: string[];
  expires_at: string | null;
  days_remaining: number;
  grace_days: number;
  error?: string;
}

export const licenseService = {
  getStatus: async (): Promise<LicenseSnapshot> => {
    const response = (await apiClient.get('/api/v1/system/license')) as unknown;
    let raw: Partial<LicenseSnapshot> = {};
    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      if (record.data && typeof record.data === 'object') {
        raw = record.data as Partial<LicenseSnapshot>;
      } else {
        raw = response as Partial<LicenseSnapshot>;
      }
    }
    return {
      status: raw.status ?? 'none',
      enforcing: Boolean(raw.enforcing),
      edition: raw.edition,
      customer: raw.customer,
      modules: Array.isArray(raw.modules) ? raw.modules : [],
      expires_at: raw.expires_at ?? null,
      days_remaining: Number(raw.days_remaining ?? 0),
      grace_days: Number(raw.grace_days ?? 0),
      error: raw.error,
    };
  },
};

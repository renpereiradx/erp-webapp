import { apiClient } from './api';

// Cliente del endpoint de licenciamiento (PLAN_BI_PACK_PREMIUM ADR-5 +
// REQ_BIPACK v2.0). GET /api/v1/system/license es auth-only (sin permiso de
// módulo): cualquier usuario autenticado puede consultar qué edición corre
// la instalación. PUT instala una licencia nueva desde la web (rescate del
// bloqueo por trial agotado): el body ES el archivo entregado por el
// vendedor, la verificación de firma corre del lado del backend.

export type LicenseStatus =
  | 'active'
  | 'grace'
  | 'expired'
  | 'none'
  | 'invalid';

/** Qué gobierna la instalación ahora (v2.0): licencia válida, evaluación o bloqueo. */
export type LicenseMode = 'licensed' | 'trial' | 'expired';

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
  // v2.0 — campos aditivos del trial. trial_ends_at delimita la ventana de
  // evaluación; blocked = bloqueo total (solo la whitelist de rescate vive).
  mode?: LicenseMode;
  trial_ends_at?: string | null;
  blocked?: boolean;
}

function normalizeSnapshot(raw: Partial<LicenseSnapshot>): LicenseSnapshot {
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
    mode: raw.mode,
    trial_ends_at: raw.trial_ends_at ?? null,
    blocked: Boolean(raw.blocked),
  };
}

function extractSnapshot(response: unknown): Partial<LicenseSnapshot> {
  if (response && typeof response === 'object') {
    const record = response as Record<string, unknown>;
    if (record.data && typeof record.data === 'object') {
      return record.data as Partial<LicenseSnapshot>;
    }
  }
  return (response ?? {}) as Partial<LicenseSnapshot>;
}

export const licenseService = {
  getStatus: async (): Promise<LicenseSnapshot> => {
    const response = (await apiClient.get('/api/v1/system/license')) as unknown;
    return normalizeSnapshot(extractSnapshot(response));
  },

  /**
   * Rescate v2.0: instala el archivo de licencia (su contenido JSON textual,
   * exactamente los bytes que entregó el vendedor). El backend verifica la
   * firma antes de persistir; un candidato inválido responde 400 con el
   * motivo y deja el estado actual intacto. Devuelve el snapshot fresco.
   */
  upload: async (licenseFileContent: string): Promise<LicenseSnapshot> => {
    const response = await apiClient.makeRequest('/api/v1/system/license', {
      method: 'PUT',
      body: licenseFileContent,
      headers: { 'Content-Type': 'application/json' },
    });
    return normalizeSnapshot(extractSnapshot(response));
  },
};

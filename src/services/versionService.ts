import { apiClient } from './api'
import type { BackendBuildInfo } from '@/domain/version/version'

// GET /version — sin auth, raíz del router (NO /api/v1). Metadata de build
// inyectada por ldflags (Makefile APP_VERSION desde git describe). Ya la
// consumían el smoke test del instalador y el inventario de soporte VPN; el
// badge de versión UI la usa además para detectar instalaciones parcialmente
// actualizadas (divergencia bundle FE vs binario BE).

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  return typeof value === 'string' ? value : ''
}

export const versionService = {
  getBuildInfo: async (): Promise<BackendBuildInfo> => {
    const response = (await apiClient.get('/version')) as unknown
    const record = (response ?? {}) as Record<string, unknown>
    return {
      version: pickString(record, 'version'),
      commit: pickString(record, 'commit'),
      build_date: pickString(record, 'build_date'),
    }
  },
}

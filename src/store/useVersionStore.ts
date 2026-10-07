import { create } from 'zustand'
import { versionService } from '@/services/versionService'
import { FE_APP_VERSION } from '@/domain/version/feVersion'
import type { BackendBuildInfo } from '@/domain/version/version'

export type VersionFetchStatus = 'idle' | 'loading' | 'ready' | 'error'

interface VersionState {
  /** Versión del build FE (package.json vía __APP_VERSION__); '' si el define no existe. */
  feVersion: string
  /** Metadata de build del BE desde GET /version; null hasta un fetch exitoso. */
  backend: BackendBuildInfo | null
  status: VersionFetchStatus
  /**
   * Idempotente (D3 del plan): un fetch en curso o exitoso basta — el badge se
   * monta en el shell Y en el login, nunca simultáneamente, y el guard evita
   * fetches duplicados ante remounts. Fail-open: si el BE no responde, el
   * badge sigue mostrando la versión de compilación FE.
   */
  fetchVersion: () => Promise<void>
}

const useVersionStore = create<VersionState>((set, get) => ({
  feVersion: FE_APP_VERSION,
  backend: null,
  status: 'idle',
  fetchVersion: async () => {
    const { status } = get()
    if (status === 'loading' || status === 'ready') return
    set({ status: 'loading' })
    try {
      const backend = await versionService.getBuildInfo()
      set({ backend, status: 'ready' })
    } catch {
      set({ status: 'error' })
    }
  },
}))

export default useVersionStore

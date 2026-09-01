import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { businessSettingsService, type BusinessSetting } from '@/services/businessSettingsService';

/**
 * Configuración del negocio (nivel tenant) consumida por el frontend.
 *
 * El fetch se dispara post-login (MainLayout) y alimenta los gates de
 * features: hoy, el toggle del módulo de reservas.
 */

export const RESERVATIONS_ENABLED_KEY = 'modules.reservations.enabled';

interface BusinessConfigState {
  /** Mapa clave → valor efectivo (solo claves allowlisteadas del backend). */
  settings: Record<string, unknown>;
  loading: boolean;
  /** true tras el primer fetch (exitoso o no) — evita reintentos en bucle. */
  loaded: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  /** Devuelve la fila guardada (con updated_at/updated_by) para feedback de UI. */
  updateSetting: (key: string, value: unknown) => Promise<BusinessSetting>;
}

export const useBusinessConfigStore = create<BusinessConfigState>()(
  devtools(
    (set) => ({
      settings: {},
      loading: false,
      loaded: false,
      error: null,

      fetchSettings: async () => {
        set({ loading: true, error: null });
        try {
          const list: BusinessSetting[] = await businessSettingsService.getAll();
          const settings: Record<string, unknown> = {};
          for (const s of list || []) {
            settings[s.key] = s.value;
          }
          set({ settings, loading: false, loaded: true });
        } catch (error: any) {
          // D-SR-5 (fail-open conservador): si GET /settings falla (403 sin
          // settings:read, error de red, backend viejo) se conserva el default
          // `true` en los gates. El negocio que desactivó el módulo solo deja
          // de verlo cuando la configuración carga; nunca se rompe el arranque.
          set({
            error: error?.message || 'No se pudo cargar la configuración del negocio',
            loading: false,
            loaded: true,
          });
        }
      },

      updateSetting: async (key, value) => {
        const saved = await businessSettingsService.update(key, value);
        set((state) => ({ settings: { ...state.settings, [key]: saved.value } }));
        return saved;
      },
    }),
    { name: 'BusinessConfigStore' },
  ),
);

/**
 * Selector del toggle de reservas. Fail-open (D-SR-5): SOLO un `false`
 * explícito desactiva el módulo; `undefined` (sin cargar, request fallida,
 * clave ausente) mantiene el comportamiento actual.
 */
export const selectReservationsEnabled = (state: BusinessConfigState): boolean =>
  state.settings[RESERVATIONS_ENABLED_KEY] !== false;

/** Hook de conveniencia para los gates de UI. */
export const useReservationsEnabled = (): boolean =>
  useBusinessConfigStore(selectReservationsEnabled);

export default useBusinessConfigStore;

/**
 * unitsService — catálogo canónico de unidades del backend (GET /units,
 * PLAN_UNITS_V2_COMPLETACION F3.1).
 *
 * Fuente única de QUÉ unidades existen (products.get_available_unit_values).
 * Cache por sesión: una sola llamada HTTP por carga de la SPA; el fallback
 * ante error es el catálogo local de src/constants/units.js (sincronizado con
 * el canónico), de modo que el selector nunca quede vacío offline.
 */
import { apiService as apiClient } from '@/services/api';

export interface UnitCatalogEntry {
  value: string;
  description: string;
  category: string;
}

let cache: UnitCatalogEntry[] | null = null;
let inflight: Promise<UnitCatalogEntry[]> | null = null;

export const unitsService = {
  /** Entradas cacheadas de esta sesión (null = todavía no hidratado). */
  getCached(): UnitCatalogEntry[] | null {
    return cache;
  },

  /**
   * Descarga el catálogo una vez por sesión. force refresca. Rechaza si el
   * backend no responde: el consumidor decide el fallback (UnitSelect cae al
   * catálogo local).
   */
  async getCatalog(force = false): Promise<UnitCatalogEntry[]> {
    if (!force && cache) return cache;
    if (!force && inflight) return inflight;
    inflight = apiClient
      .get('/units')
      .then((response: any) => {
        const rows: UnitCatalogEntry[] = response?.data?.data || [];
        if (rows.length > 0) cache = rows;
        return rows;
      })
      .finally(() => {
        inflight = null;
      });
    return inflight;
  },
};

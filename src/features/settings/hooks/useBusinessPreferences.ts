import { useCallback, useEffect, useRef, useState } from 'react';
import {
  businessSettingsService,
  type BusinessSetting,
} from '@/services/businessSettingsService';
import { useBusinessConfigStore } from '@/store/useBusinessConfigStore';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';

/**
 * Orquestación de la página "Preferencias del negocio"
 * (PLAN_SERVICIOS_Y_RESERVAS_CONFIGURABLES — pendiente Q1).
 *
 * Carga el listado allowlistado de settings con su metadata de auditoría
 * (updated_at/updated_by) y guarda mediante el store global, de modo que los
 * gates (menú Agenda, paso Reservas del checkout) reaccionen al instante.
 */
export function useBusinessPreferences() {
  const { t } = useI18n();
  const toast = useToast();
  const updateGlobalSetting = useBusinessConfigStore((s) => s.updateSetting);
  const mountedRef = useRef(true);

  const [rows, setRows] = useState<BusinessSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Clave en curso de guardado (deshabilita su switch). */
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await businessSettingsService.getAll();
      if (!mountedRef.current) return;
      setRows(list ?? []);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || 'No se pudo cargar la configuración del negocio');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Guarda un setting booleano y sincroniza la fila local con la respuesta
   * del backend (que trae la auditoría). Devuelve la fila guardada o null
   * si falló (el switch queda en su valor previo: no hay estado optimista).
   */
  const saveBoolean = useCallback(
    async (key: string, next: boolean): Promise<BusinessSetting | null> => {
      setSavingKey(key);
      try {
        const saved = await updateGlobalSetting(key, next);
        if (mountedRef.current) {
          setRows((prev) => prev.map((r) => (r.key === key ? saved : r)));
        }
        toast.success(t('businessPrefs.toast.saved', 'Preferencia guardada'));
        return saved;
      } catch (err: any) {
        toast.errorFrom(err, {
          fallback: t('businessPrefs.toast.saveError', 'No se pudo guardar la preferencia'),
        });
        return null;
      } finally {
        if (mountedRef.current) setSavingKey(null);
      }
    },
    [updateGlobalSetting, toast, t],
  );

  return { rows, loading, error, savingKey, reload: load, saveBoolean };
}

export default useBusinessPreferences;

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';

/**
 * Copia un dato de la fila (documento, RUC o SKU) al portapapeles con
 * confirmación por toast. Si el portapapeles no está disponible (contexto no
 * seguro / permisos), avisa el fallo — nunca queda silencioso.
 */
export const useRowCopyValue = () => {
  const { t } = useI18n();

  return useCallback(
    async (value: string) => {
      if (!value) return;
      try {
        await navigator.clipboard.writeText(value);
        toast.success(t('relationalAnalytics.actions.copied', 'Copiado al portapapeles'));
      } catch {
        toast.error(t('relationalAnalytics.actions.copyError', 'No se pudo copiar'));
      }
    },
    [t],
  );
};

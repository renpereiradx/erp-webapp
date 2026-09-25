import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';

/**
 * Copia un valor de fila (documento, RUC o SKU) al portapapeles con
 * confirmación por toast. Error silencioso con toast (portapapeles no
 * disponible fuera de contexto seguro).
 */
export function useRowCopyValue() {
  const { t } = useI18n();
  const toast = useToast();

  return useCallback(
    async (value: string) => {
      try {
        await navigator.clipboard.writeText(value);
        toast.success(t('bi.relational.action.copied', 'Copiado al portapapeles'));
      } catch {
        toast.error(t('bi.relational.action.copyError', 'No se pudo copiar'));
      }
    },
    [toast, t],
  );
}

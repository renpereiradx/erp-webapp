/**
 * Hook del panel fiscal de una venta (FE3).
 * Orquesta: lectura del estado fiscal (GET /sale/{id}/fiscal), reenvío manual
 * (retry), email del comprobante y reimpresión (ticket 80 mm con reprint_count).
 *
 * El 404 de GET /sale/{id}/fiscal es el estado "venta sin documento fiscal"
 * (branch no activado, D3) — NO un error: se expone como `isNotFiscal`.
 */
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import type { SaleFiscalStatus } from '@/features/fiscal/types';

const isNotFound = (error: unknown): boolean => {
  const e = error as { response?: { status?: number }; status?: number };
  return e?.response?.status === 404 || e?.status === 404;
};

export interface SaleFiscalPanelState {
  /** null = venta sin documento fiscal (404) o sin cargar aún. */
  status: SaleFiscalStatus | null | undefined;
  isLoading: boolean;
  isNotFiscal: boolean;
  error: unknown;
  retrying: boolean;
  emailing: boolean;
  reprinting: boolean;
  /** Contador de reimpresiones devuelto por el render del ticket (S5.2). */
  reprintCount: number | null;
  retry: () => Promise<SaleFiscalStatus | undefined>;
  emailComprobante: () => Promise<void>;
  reprintTicket: () => Promise<void>;
}

export const useSaleFiscalPanel = (saleId?: string): SaleFiscalPanelState => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useI18n();

  const queryKey = useMemo(() => ['sale-fiscal', saleId] as const, [saleId]);

  const { data: status, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => fiscalService.getSaleFiscal(saleId!),
    enabled: !!saleId,
    // El 404 (branch no fiscal) no debe reintentar; el resto (502 SIFEN, etc.) sí.
    retry: (failureCount, err) => !isNotFound(err) && failureCount < 2,
  });

  const isNotFiscal = !isLoading && !status && isNotFound(error);

  const retryMutation = useMutation({
    mutationFn: () => fiscalService.retryEmission(saleId!),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKey, updated);
      addToast(t('fiscal.panel.retried', 'Reenvío iniciado'), 'success');
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.panel.retryError', 'No se pudo reenviar el documento'), 'error'),
  });

  const emailMutation = useMutation({
    mutationFn: () => fiscalService.emailComprobante(saleId!),
    onSuccess: () => addToast(t('fiscal.panel.emailed', 'Comprobante enviado por email'), 'success'),
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.panel.emailError', 'No se pudo enviar el email'), 'error'),
  });

  const reprintMutation = useMutation({
    mutationFn: () => fiscalService.renderTicket(saleId!),
    onSuccess: () => {
      addToast(t('fiscal.panel.reprinted', 'Ticket reimpreso'), 'success');
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.panel.reprintError', 'No se pudo reimprimir el ticket'), 'error'),
  });

  const retry = useCallback(async () => {
    try {
      return await retryMutation.mutateAsync();
    } catch {
      return undefined;
    }
  }, [retryMutation]);

  const emailComprobante = useCallback(async () => {
    try {
      await emailMutation.mutateAsync();
    } catch {
      /* toast ya emitido */
    }
  }, [emailMutation]);

  const reprintTicket = useCallback(async () => {
    try {
      await reprintMutation.mutateAsync();
    } catch {
      /* toast ya emitido */
    }
  }, [reprintMutation]);

  return {
    status,
    isLoading,
    isNotFiscal,
    error: isNotFiscal ? null : error,
    retrying: retryMutation.isPending,
    emailing: emailMutation.isPending,
    reprinting: reprintMutation.isPending,
    reprintCount: reprintMutation.data?.reprint_count ?? null,
    retry,
    emailComprobante,
    reprintTicket,
  };
};

/**
 * Hook del panel fiscal de una venta (FE3).
 * Orquesta: lectura del estado fiscal (GET /sale/{id}/fiscal), reenvío manual
 * (retryEmission, D2), descarga del KuDE PDF como blob con auth (S6-H1),
 * email del comprobante y reimpresión (ticket 80 mm con reprint_count).
 *
 * El 404 de GET /sale/{id}/fiscal es el estado "venta sin documento fiscal"
 * (branch no activado, D3) — NO un error: se expone como `isNotFiscal`.
 *
 * S6-H2: `refetch` recarga la query; `retryEmission` es la MUTACIÓN de
 * reenvío del DE a SIFEN — nunca confluir la una con la otra (el "Reintentar"
 * del estado de error debe llamar a refetch, no reenviar el DE).
 */
import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { fiscalService, isApiNotFound } from '@/features/fiscal/services/fiscalService';
import type { SaleFiscalStatus } from '@/features/fiscal/types';

// ApiError no trae `status` ni `response`: el código determinista es
// `code === 'NOT_FOUND'` (helper compartido del service).
const isNotFound = isApiNotFound;

export interface SaleFiscalPanelState {
  /** null = venta sin documento fiscal (404) o sin cargar aún. */
  status: SaleFiscalStatus | null | undefined;
  isLoading: boolean;
  isNotFiscal: boolean;
  error: unknown;
  /** Recarga la query de estado (para el "Reintentar" del estado de error). */
  refetch: () => Promise<unknown>;
  retrying: boolean;
  downloading: boolean;
  emailing: boolean;
  reprinting: boolean;
  /** Contador de reimpresiones: respuesta del render o estado fiscal (S6-H7). */
  reprintCount: number | null;
  /** Reenvío manual del DE a SIFEN (POST /sale/{id}/fiscal/retry, D2). */
  retryEmission: () => Promise<SaleFiscalStatus | undefined>;
  /** Descarga el KuDE PDF autenticado y dispara el save del navegador. */
  downloadPdf: () => Promise<void>;
  emailComprobante: () => Promise<void>;
  reprintTicket: () => Promise<void>;
}

/** Dispara la descarga del blob en el navegador (a[download] + object URL). */
const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const useSaleFiscalPanel = (saleId?: string): SaleFiscalPanelState => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useI18n();

  const queryKey = useMemo(() => ['sale-fiscal', saleId] as const, [saleId]);

  const { data: status, isLoading, error, refetch } = useQuery({
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

  const pdfMutation = useMutation({
    mutationFn: () => fiscalService.downloadComprobantePdf(saleId!),
    onSuccess: ({ blob, filename }) => {
      saveBlob(blob, filename);
      addToast(t('fiscal.panel.downloaded', 'KuDE descargado'), 'success');
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.panel.downloadError', 'No se pudo descargar el KuDE PDF'), 'error'),
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
      // Sincroniza el reprint_count inicial del estado (S6-H7).
      void refetch();
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.panel.reprintError', 'No se pudo reimprimir el ticket'), 'error'),
  });

  const retryEmission = useCallback(async () => {
    try {
      return await retryMutation.mutateAsync();
    } catch {
      return undefined;
    }
  }, [retryMutation]);

  const downloadPdf = useCallback(async () => {
    try {
      await pdfMutation.mutateAsync();
    } catch {
      /* toast ya emitido */
    }
  }, [pdfMutation]);

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
    refetch: refetch as () => Promise<unknown>,
    retrying: retryMutation.isPending,
    downloading: pdfMutation.isPending,
    emailing: emailMutation.isPending,
    reprinting: reprintMutation.isPending,
    reprintCount: reprintMutation.data?.reprint_count ?? status?.reprint_count ?? null,
    retryEmission,
    downloadPdf,
    emailComprobante,
    reprintTicket,
  };
};

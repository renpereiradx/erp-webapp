import { useCallback, useRef, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { tRaw } from '@/lib/i18n';

/**
 * Factory de hooks por recurso para reportes financieros (FASE 6 del plan
 * de alineación BI). Cada recurso tiene su loading/error/guard — antes los
 * 10 fetchers compartían un único loading interferiéndose.
 */

type AnyFetcher = (...args: any[]) => Promise<any>;

export function useFinancialResource<T>(
  fetcher: AnyFetcher,
  errorDescription: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const seq = useRef(0);
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetch = useCallback(
    async (...args: any[]) => {
      const requestId = ++seq.current;
      setLoading(true);
      setError(null);
      try {
        const response = await fetcher(...args);
        if (requestId !== seq.current) return response; // llegó otra solicitud
        // Tolerancia del envelope: con success explícito se respeta; sin él
        // (drift legacy) se acepta la respuesta directa.
        const hasExplicitSuccess = typeof response?.success === 'boolean';
        const isSuccess = hasExplicitSuccess ? response.success : true;
        if (isSuccess) {
          setData(response?.data ?? response ?? null);
        }
        return response;
      } catch (err: any) {
        if (requestId !== seq.current) return;
        setError(err?.message ?? 'error');
        toastRef.current({
          title: tRaw('common.error', 'Error', {}),
          description: tRaw(errorDescription, errorDescription, {}),
          variant: 'destructive',
        });
      } finally {
        if (requestId === seq.current) setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetcher],
  );

  return { data: data as T | null, loading, error, fetch };
}

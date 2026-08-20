/**
 * Hook del dashboard de ops fiscal (FE5.2 — S7.2).
 * Consume GET /sifen/metrics/overview: rechazos por código, pendientes de
 * envío (ventana 72 h), extemporáneos y caducidad de timbrados. El backend
 * clasifica todo contra su propio reloj; el FE solo muestra.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import type { FiscalMetricsOverview } from '@/features/fiscal/types';

export interface UseFiscalMetricsState {
  data: FiscalMetricsOverview | undefined;
  loading: boolean;
  isFetching: boolean;
  error: unknown;
  /** Invalida la query (refetch en segundo plano). */
  refresh: () => void;
}

export const useFiscalMetrics = (dias = 30): UseFiscalMetricsState => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sifen-metrics', dias],
    queryFn: () => fiscalService.getMetricsOverview(dias),
    staleTime: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sifen-metrics'] });
  };

  return {
    data: query.data,
    loading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh,
  };
};

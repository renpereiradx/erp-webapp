/**
 * Hook del dashboard de ops fiscal (FE5.2 — S7.2).
 * Consume GET /sifen/metrics/overview (KPIs) y GET /sifen/metrics/alerts
 * (capa de alertas accionables, remedación S7-H9-b). El backend clasifica
 * todo contra su propio reloj; el FE solo muestra.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import type { FiscalMetricsOverview, FiscalOpsAlerts } from '@/features/fiscal/types';

export interface UseFiscalMetricsState {
  data: FiscalMetricsOverview | undefined;
  alerts: FiscalOpsAlerts | undefined;
  loading: boolean;
  isFetching: boolean;
  error: unknown;
  /** Invalida las queries (refetch en segundo plano). */
  refresh: () => void;
}

export const useFiscalMetrics = (dias = 30): UseFiscalMetricsState => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sifen-metrics', dias],
    queryFn: () => fiscalService.getMetricsOverview(dias),
    staleTime: 60_000,
  });

  const alertsQuery = useQuery({
    queryKey: ['sifen-alerts', dias],
    queryFn: () => fiscalService.getMetricsAlerts(dias),
    staleTime: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sifen-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['sifen-alerts'] });
  };

  return {
    data: query.data,
    alerts: alertsQuery.data,
    loading: query.isLoading || alertsQuery.isLoading,
    isFetching: query.isFetching || alertsQuery.isFetching,
    error: query.error ?? alertsQuery.error,
    refresh,
  };
};

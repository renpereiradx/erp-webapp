/**
 * Hook del dashboard de ops fiscal (FE5.2 — S7.2).
 * Consume GET /sifen/metrics/overview (KPIs), GET /sifen/metrics/alerts
 * (capa de alertas accionables, remedación S7-H9-b) y GET /sifen/config/
 * {TEST,PROD} (estado del ambiente, FE6/H9-audit S6). El backend clasifica
 * todo contra su propio reloj; el FE solo muestra.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import { resolveEnvironmentStatus, type EnvironmentStatus } from '@/domain/fiscal/environment';
import type { FiscalMetricsOverview, FiscalOpsAlerts } from '@/features/fiscal/types';

export interface UseFiscalMetricsState {
  data: FiscalMetricsOverview | undefined;
  alerts: FiscalOpsAlerts | undefined;
  /** Estado del ambiente SIFEN (activo + salud de config); undefined = cargando o error. */
  environment: EnvironmentStatus | undefined;
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

  const envQuery = useQuery({
    queryKey: ['sifen-environment'],
    // El 404 (ambiente sin configurar) ya llega como null del service: la
    // resolución del ambiente que rige es dominio puro (H9-audit S6).
    queryFn: async () => {
      const [test, prod] = await Promise.all([
        fiscalService.getConfigPublic('TEST'),
        fiscalService.getConfigPublic('PROD'),
      ]);
      return resolveEnvironmentStatus(test, prod);
    },
    staleTime: 60_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['sifen-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['sifen-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['sifen-environment'] });
  };

  return {
    data: query.data,
    alerts: alertsQuery.data,
    environment: envQuery.data,
    loading: query.isLoading || alertsQuery.isLoading || envQuery.isLoading,
    isFetching: query.isFetching || alertsQuery.isFetching || envQuery.isFetching,
    error: query.error ?? alertsQuery.error,
    refresh,
  };
};

/**
 * useCancellationRequests — orquestación de la bandeja de solicitudes de
 * anulación (FASE C, PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES). Encapsula
 * fetch por estado, aprobar/rechazar (con toast) y el contador de pendientes
 * para el badge de la pestaña. Solo se consulta con `enabled` (permiso
 * sales:cancel).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import saleService from '@/services/saleService';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import type { CancellationRequest, CancellationRequestStatus } from '../types/cancellation';

const DEBOUNCE_MS = 300;

export function useCancellationRequests(enabled: boolean) {
  const { t } = useI18n();
  const toast = useToast();

  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CancellationRequestStatus>('pending');
  const [actingId, setActingId] = useState<number | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchSequence = useRef(0);

  const fetchRequests = useCallback(
    async (status: CancellationRequestStatus) => {
      const seq = ++fetchSequence.current;
      setLoading(true);
      setError(null);
      const result = await saleService.listCancellationRequests({ status, page: 1, page_size: 50 });
      if (seq !== fetchSequence.current) return; // respuesta desactualizada
      if (result.success) {
        setRequests(result.data);
        setTotal(result.total);
        if (status === 'pending') setPendingCount(result.total);
      } else {
        setError(result.error ?? 'Error');
      }
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    fetchRequests(statusFilter);
  }, [enabled, statusFilter, fetchRequests]);

  // Contador del badge: se refresca con debounce al habilitar la bandeja.
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      saleService.listCancellationRequests({ status: 'pending', page: 1, page_size: 1 }).then((result) => {
        if (result.success) setPendingCount(result.total);
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  const refresh = useCallback(() => fetchRequests(statusFilter), [fetchRequests, statusFilter]);

  const approve = useCallback(
    async (request: CancellationRequest) => {
      setActingId(request.id);
      const result = await saleService.approveCancellationRequest(request.id);
      setActingId(null);
      if (result.success) {
        toast.success(t('sales.cancellation.approvedToast', 'Solicitud aprobada: la venta fue anulada'));
        fetchRequests(statusFilter);
        return true;
      }
      toast.errorFrom(result.error ?? new Error('Error'), {
        fallback: t('sales.cancellation.approveError', 'No se pudo aprobar la solicitud'),
      });
      return false;
    },
    [fetchRequests, statusFilter, t, toast],
  );

  const reject = useCallback(
    async (request: CancellationRequest, reason: string) => {
      setActingId(request.id);
      const result = await saleService.rejectCancellationRequest(request.id, reason);
      setActingId(null);
      if (result.success) {
        toast.success(t('sales.cancellation.rejectedToast', 'Solicitud rechazada'));
        fetchRequests(statusFilter);
        return true;
      }
      toast.errorFrom(result.error ?? new Error('Error'), {
        fallback: t('sales.cancellation.rejectError', 'No se pudo rechazar la solicitud'),
      });
      return false;
    },
    [fetchRequests, statusFilter, t, toast],
  );

  return {
    requests,
    total,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    actingId,
    pendingCount,
    refresh,
    approve,
    reject,
  };
}

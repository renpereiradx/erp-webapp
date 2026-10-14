import { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { ScheduleSlot, ProductScheduleConfig, ManageReserveRequest, ReserveAction } from '../domain/reservation';
import { reservationService } from '../services/reservationService';

export const useReservation = (initialProductId?: string) => {
  const { t } = useI18n();
  const [productId, setProductId] = useState(productIdFromUrl() || initialProductId || '');
  // 🔧 FIX: Usar fecha local en formato YYYY-MM-DD para evitar desfase de un día (ISO usa UTC)
  const [targetDate, setTargetDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [config, setConfig] = useState<ProductScheduleConfig | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function productIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('product_id');
  }

  const fetchInitialData = useCallback(async () => {
    try {
      const productList = await reservationService.getProducts();
      setProducts(productList || []);

      // Si no tenemos productId y hay productos disponibles, seleccionamos el primero
      if (!productId && productList && productList.length > 0) {
        setProductId(productList[0].id || productList[0].product_id);
      }
    } catch (err) {
      console.error('Error loading products', err);
    }
  }, [productId]);

  const fetchSchedules = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    try {
      // Horarios y configuración son lecturas independientes: van en paralelo.
      const [data, configResult] = await Promise.allSettled([
        reservationService.getSchedulesForProductAndDate(productId, targetDate),
        reservationService.getProductConfig(productId),
      ]);

      if (configResult.status === 'fulfilled') {
        setConfig(configResult.value);
      } else {
        console.warn('No se pudo cargar la configuración del producto', configResult.reason);
      }

      if (data.status === 'fulfilled') {
        setSlots(data.value || []);
        return;
      }

      setSlots([]); // Limpiar slots si hay error
      // Si es un 500, asumimos que no están generados
      const msg = data.reason?.message?.includes('500')
        ? t('reservations.errors.noSchedules')
        : t('reservations.errors.loadSchedules');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId, targetDate, t]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const searchClients = async (name: string) => {
    return await reservationService.searchClients(name);
  };

  const handleGenerateToday = async () => {
    if (!productId) return;
    try {
      // 🔧 UPDATE: Generar para la fecha seleccionada (targetDate) en lugar de hardcodear "hoy"
      await reservationService.generateSchedules({ target_date: targetDate, product_ids: [productId] });
      await fetchSchedules();
    } catch (err) {
      setError(t('reservations.errors.generate'));
      throw err;
    }
  };

  const updateConfig = async (newConfig: any) => {
    if (!productId) return;
    try {
      await reservationService.upsertProductConfig(productId, {
        ...newConfig,
        effective_from: targetDate,
        slot_minutes: newConfig.slot_minutes || 60,
      });
      await fetchSchedules();
    } catch (err) {
      setError(t('reservations.errors.config'));
      throw err;
    }
  };

  const buildBranchPayload = () => {
    const branchIdStr = localStorage.getItem('activeBranch');
    const branchId = branchIdStr ? parseInt(branchIdStr, 10) : undefined;
    return { product_id: productId, branch_id: branchId };
  };

  // manage_reserve envuelve el resultado en {Data}: unwrap compartido por acción.
  const extractReserveResult = (res: any) => res?.data ?? res;

  const manageReserveAction = async (action: ReserveAction, payload: Omit<ManageReserveRequest, 'action'>, fallbackError: string) => {
    const res = await reservationService.manageReserve({ action, ...payload });
    const data = extractReserveResult(res);
    if (data?.success === false) throw new Error(data.error || fallbackError);
    if (res?.success === false) throw new Error(res.error || fallbackError);
    await fetchSchedules();
  };

  const createReservation = async (clientId: string, startTime: string, duration: number) => {
    try {
      if (!productId || !clientId || !startTime) {
        throw new Error('Faltan datos requeridos para la reserva');
      }

      await manageReserveAction(
        'CREATE',
        {
          client_id: clientId,
          start_time: startTime,
          duration: Number(duration) || 1,
          ...buildBranchPayload(),
        },
        t('reservations.errors.create'),
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || t('reservations.errors.create');
      setError(msg);
      throw new Error(msg);
    }
  };

  const confirmReservation = async (reserveId: number) => {
    try {
      if (!reserveId) throw new Error('ID de reserva no válido');

      await manageReserveAction(
        'CONFIRM',
        { reserve_id: reserveId, ...buildBranchPayload() },
        t('reservations.errors.confirm'),
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || t('reservations.errors.confirm');
      setError(msg);
      throw new Error(msg);
    }
  };

  const cancelReservation = async (reserveId: number) => {
    try {
      if (!reserveId) throw new Error('ID de reserva no válido');

      await manageReserveAction(
        'CANCEL',
        { reserve_id: reserveId, ...buildBranchPayload() },
        t('reservations.errors.cancel'),
      );
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || t('reservations.errors.cancel');
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    productId,
    setProductId,
    targetDate,
    setTargetDate,
    slots,
    config,
    loading,
    error,
    handleGenerateToday,
    createReservation,
    confirmReservation,
    cancelReservation,
    searchClients,
    products,
    updateConfig,
    refresh: fetchSchedules,
  };
};

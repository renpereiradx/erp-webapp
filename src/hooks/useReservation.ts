import { useState, useEffect, useCallback } from 'react';
import { ScheduleSlot, ProductScheduleConfig } from '../domain/reservation';
import { reservationService } from '../services/reservationService';

export const useReservation = (initialProductId?: string) => {
  const [productId, setProductId] = useState(productIdFromUrl() || initialProductId || '');
  // 🔧 FIX: Usar fecha local en formato YYYY-MM-DD para evitar desfase de un día (ISO usa UTC)
  const [targetDate, setTargetDate] = useState(new Date().toLocaleDateString('en-CA'));
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
      const data = await reservationService.getSchedulesForProductAndDate(productId, targetDate);
      setSlots(data || []);
      
      try {
        const configData = await reservationService.getProductConfig(productId);
        setConfig(configData);
      } catch (configErr) {
        console.warn('No se pudo cargar la configuración del producto', configErr);
      }
    } catch (err: any) {
      setSlots([]); // Limpiar slots si hay error
      // Si es un 500, asumimos que no están generados
      const msg = err.message?.includes('500') 
        ? 'No hay horarios generados para este recurso en la fecha seleccionada.' 
        : 'Error al cargar horarios';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [productId, targetDate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const searchClients = async (name: string) => {
    return await reservationService.searchClients(name);
  };

  const getInitialClients = async () => {
    return await reservationService.getInitialClients();
  };

  const handleGenerateToday = async () => {
    if (!productId) return;
    try {
      // 🔧 UPDATE: Generar para la fecha seleccionada (targetDate) en lugar de hardcodear "hoy"
      await reservationService.generateSchedules({ target_date: targetDate, product_ids: [productId] });
      await fetchSchedules();
    } catch (err) {
      setError('Error al generar horarios');
      throw err; // Relanzar para el toast
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
      setError('Error al actualizar configuración');
      throw err;
    }
  };

  const createReservation = async (clientId: string, startTime: string, duration: number) => {
    try {
      await reservationService.manageReserve({
        action: 'CREATE',
        product_id: productId,
        client_id: clientId,
        start_time: startTime,
        duration: duration,
      });
      await fetchSchedules();
    } catch (err) {
      setError('Error al crear reserva');
    }
  };

  const confirmReservation = async (reserveId: number) => {
    try {
      await reservationService.manageReserve({
        action: 'CONFIRM',
        reserve_id: reserveId,
        product_id: productId,
        client_id: '', // Requerido por el tipo pero no por el backend para CONFIRM
        start_time: '',
        duration: 0,
      });
      await fetchSchedules();
    } catch (err) {
      setError('Error al confirmar reserva');
    }
  };

  const cancelReservation = async (reserveId: number) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta reserva?')) return;
    try {
      await reservationService.manageReserve({
        action: 'CANCEL',
        reserve_id: reserveId,
        product_id: productId,
        client_id: '',
        start_time: '',
        duration: 0,
      });
      await fetchSchedules();
    } catch (err) {
      setError('Error al cancelar reserva');
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
    getInitialClients,
    products,
    updateConfig,
    refresh: fetchSchedules,
  };
};

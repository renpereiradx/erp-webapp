import { useState, useEffect, useCallback } from 'react';
import { ScheduleSlot, ProductScheduleConfig } from '../domain/reservation';
import { reservationService } from '../services/reservationService';

export const useReservation = (initialProductId: string) => {
  const [productId, setProductId] = useState(initialProductId);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [config, setConfig] = useState<ProductScheduleConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reservationService.getSchedulesForProductAndDate(productId, targetDate);
      setSlots(data);
      const configData = await reservationService.getProductConfig(productId);
      setConfig(configData);
    } catch (err) {
      setError('Error al cargar horarios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productId, targetDate]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleGenerateToday = async () => {
    try {
      await reservationService.generateSchedules({ target_date: targetDate, product_ids: [productId] });
      await fetchSchedules();
    } catch (err) {
      setError('Error al generar horarios');
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
    refresh: fetchSchedules,
  };
};

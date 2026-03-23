import { useState, useCallback, useEffect } from 'react';
import { reservationUnifiedService, ManageReserveRequest } from '@/services/reservationUnifiedService';
import { ScheduleSlot, ScheduleConfig } from '@/domain/reservation/models';
import { validateScheduleConfig, validateReservation } from '@/domain/reservation/validators';

export const useReservationSchedule = () => {
  const [selectedProduct, setSelectedProduct] = useState('CANCHA_01');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [config, setConfig] = useState<Partial<ScheduleConfig>>({
    start_hour: 8,
    end_hour: 22,
    slot_minutes: 60,
    timezone: 'America/Asuncion',
    effective_from: new Date().toISOString().split('T')[0],
    is_active: true
  });
  
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await reservationUnifiedService.getConfig(selectedProduct);
      if (data) {
        setConfig(data);
      }
    } catch (err) {
      console.error('Error fetching config', err);
    }
  }, [selectedProduct]);

  const saveConfig = async (newConfig: Partial<ScheduleConfig>) => {
    const validation = validateScheduleConfig(newConfig);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsLoading(true);
    try {
      await reservationUnifiedService.saveConfig(selectedProduct, newConfig);
      setConfig(newConfig);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error saving config');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSchedules = async () => {
    setIsLoading(true);
    try {
      await reservationUnifiedService.generateSchedules({
        target_date: selectedDate,
        product_ids: [selectedProduct]
      });
      await fetchSlots();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error generating schedules');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await reservationUnifiedService.getSlotsByDate(selectedProduct, selectedDate);
      setSlots(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error fetching slots');
    } finally {
      setIsLoading(false);
    }
  }, [selectedProduct, selectedDate]);

  const manageReservation = async (request: ManageReserveRequest) => {
    if (request.action === 'CREATE') {
      const validation = validateReservation({
        product_id: request.product_id,
        client_id: request.client_id,
        start_time: request.start_time,
        duration: request.duration
      });
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }
    }

    setIsLoading(true);
    try {
      await reservationUnifiedService.manageReservation(request);
      await fetchSlots(); // refresh
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error managing reservation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchSlots();
  }, [fetchConfig, fetchSlots]);

  return {
    selectedProduct,
    setSelectedProduct,
    selectedDate,
    setSelectedDate,
    config,
    setConfig,
    slots,
    isLoading,
    error,
    saveConfig,
    generateSchedules,
    manageReservation
  };
};

/**
 * Componente para flujo de reprogramación de reservas
 * Permite cambiar fecha/hora de reservas existentes con validación de disponibilidad
 * Integrado con API de horarios disponibles y verificación de conflictos
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Calendar, Clock, AlertTriangle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useI18n } from '../../lib/i18n';
import useReservationStore from '../../store/useReservationStore';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import { MOCK_PRODUCTS, MOCK_CLIENTS } from '../../services/mockReservationsAPI';
import { cn } from '../../lib/utils';
import LiveRegion from '../a11y/LiveRegion';

const RescheduleModal = ({ 
  isOpen = false, 
  onClose, 
  reservation = null 
}) => {
  const { t } = useI18n();
  const { trapFocus, restoreFocus, announce } = useFocusManagement();
  
  const {
    loading,
    error,
    rescheduleReservation,
    getAvailableSchedules
  } = useReservationStore();

  // Estado del formulario
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    start_time: '',
    duration: 1
  });

  // Estado de horarios disponibles
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  
  // Estado de validación
  const [validationErrors, setValidationErrors] = useState({});
  const [conflictWarning, setConflictWarning] = useState(null);

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && reservation) {
      const startDateTime = new Date(reservation.start_time);
      setNewSchedule({
        date: startDateTime.toISOString().split('T')[0],
        start_time: startDateTime.toTimeString().slice(0, 5),
        duration: reservation.duration || 1
      });
      setValidationErrors({});
      setConflictWarning(null);
    }
  }, [isOpen, reservation]);

  // Cargar horarios disponibles cuando cambian producto/fecha
  const loadAvailableSchedules = useCallback(async () => {
    if (!reservation?.product_id || !newSchedule.date) {
      setAvailableSchedules([]);
      return;
    }

    setLoadingSchedules(true);
    setScheduleError(null);
    
    try {
      console.log('[telemetry] feature.reservations.reschedule.schedules.load', {
        reservationId: reservation.id,
        productId: reservation.product_id,
        date: newSchedule.date
      });
      
      const schedules = await getAvailableSchedules(reservation.product_id, newSchedule.date);
      setAvailableSchedules(schedules || []);
      
      console.log('[telemetry] feature.reservations.reschedule.schedules.success', {
        count: schedules?.length || 0,
        reservationId: reservation.id
      });
    } catch (error) {
      console.error('[telemetry] feature.reservations.reschedule.schedules.error', {
        error: error.message,
        reservationId: reservation.id
      });
      setScheduleError(error.message);
    } finally {
      setLoadingSchedules(false);
    }
  }, [reservation?.product_id, reservation?.id, newSchedule.date, getAvailableSchedules]);

  useEffect(() => {
    loadAvailableSchedules();
  }, [loadAvailableSchedules]);

  // Verificar si el nuevo horario está disponible
  const isNewScheduleAvailable = useMemo(() => {
    if (!newSchedule.start_time || availableSchedules.length === 0) return true;
    
    const [hours, minutes] = newSchedule.start_time.split(':').map(Number);
    const selectedDateTime = new Date(newSchedule.date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return availableSchedules.some(schedule => {
      const scheduleStart = new Date(schedule.start_time);
      const scheduleEnd = new Date(schedule.end_time);
      const selectedEnd = new Date(selectedDateTime.getTime() + (newSchedule.duration * 60 * 60 * 1000));
      
      return selectedDateTime >= scheduleStart && selectedEnd <= scheduleEnd;
    });
  }, [newSchedule.start_time, newSchedule.date, newSchedule.duration, availableSchedules]);

  // Detectar posibles conflictos
  useEffect(() => {
    if (newSchedule.start_time && newSchedule.date && !isNewScheduleAvailable) {
      setConflictWarning(t('reservations.reschedule.conflict_warning'));
    } else {
      setConflictWarning(null);
    }
  }, [newSchedule, isNewScheduleAvailable, t]);

  // Validar formulario
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!newSchedule.date) errors.date = t('reservations.errors.date_required');
    if (!newSchedule.start_time) errors.start_time = t('reservations.errors.time_required');
    if (newSchedule.duration < 0.5) errors.duration = t('reservations.errors.duration_minimum');
    
    // Validar que no sea la misma fecha/hora actual
    if (reservation && newSchedule.date && newSchedule.start_time) {
      const originalStart = new Date(reservation.start_time);
      const [hours, minutes] = newSchedule.start_time.split(':').map(Number);
      const newStart = new Date(newSchedule.date);
      newStart.setHours(hours, minutes, 0, 0);
      
      if (originalStart.getTime() === newStart.getTime() && 
          reservation.duration === newSchedule.duration) {
        errors.general = t('reservations.reschedule.same_time_error');
      }
    }
    
    // Validar fecha no sea pasada
    if (newSchedule.date) {
      const selectedDate = new Date(newSchedule.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = t('reservations.errors.date_past');
      }
    }
    
    return errors;
  }, [newSchedule, reservation, t]);

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setNewSchedule(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error de validación
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (!isNewScheduleAvailable) {
      setValidationErrors({
        start_time: t('reservations.errors.schedule_not_available')
      });
      return;
    }

    try {
      const [hours, minutes] = newSchedule.start_time.split(':').map(Number);
      const startDateTime = new Date(newSchedule.date);
      startDateTime.setHours(hours, minutes, 0, 0);

      const scheduleData = {
        start_time: startDateTime.toISOString(),
        duration: newSchedule.duration
      };

      console.log('[telemetry] feature.reservations.reschedule.attempt', {
        reservationId: reservation.id,
        originalTime: reservation.start_time,
        newTime: scheduleData.start_time
      });

      await rescheduleReservation(reservation.id, scheduleData);
      
      console.log('[telemetry] feature.reservations.reschedule.success', {
        reservationId: reservation.id
      });

      announce(t('reservations.reschedule.success_message'));
      onClose();
      
    } catch (error) {
      console.error('[telemetry] feature.reservations.reschedule.error', {
        reservationId: reservation?.id,
        error: error.message
      });
      
      setValidationErrors({
        general: error.message || t('reservations.reschedule.error_message')
      });
    }
  };

  // Focus management
  useEffect(() => {
    if (isOpen) {
      trapFocus();
    } else {
      restoreFocus();
    }
  }, [isOpen, trapFocus, restoreFocus]);

  // Obtener detalles de la reserva original
  const getProductName = (productId) => {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    return product?.name || productId;
  };

  const getClientName = (clientId) => {
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    return client?.name || clientId;
  };

  // Generar opciones de horarios sugeridos
  const suggestedTimes = useMemo(() => {
    if (availableSchedules.length === 0) return [];
    
    return availableSchedules
      .slice(0, 6) // Mostrar solo los primeros 6
      .map(schedule => {
        const startTime = new Date(schedule.start_time);
        return {
          time: startTime.toTimeString().slice(0, 5),
          maxDuration: schedule.available_consecutive_hours || 1,
          label: `${startTime.toTimeString().slice(0, 5)} (${schedule.available_consecutive_hours || 1}h disponibles)`
        };
      });
  }, [availableSchedules]);

  if (!isOpen || !reservation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="reschedule-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('reservations.reschedule.title')}
          </DialogTitle>
        </DialogHeader>

        <div id="reschedule-modal-description" className="sr-only">
          {t('reservations.reschedule.description')}
        </div>

        {/* Información de la reserva actual */}
        <Card className="bg-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {t('reservations.reschedule.current_reservation')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">{t('reservations.modal.product')}:</span>
                <div>{getProductName(reservation.product_id)}</div>
              </div>
              <div>
                <span className="font-medium">{t('reservations.modal.client')}:</span>
                <div>{getClientName(reservation.client_id)}</div>
              </div>
              <div>
                <span className="font-medium">{t('reservations.modal.current_time')}:</span>
                <div>
                  {new Date(reservation.start_time).toLocaleDateString('es-ES')} -{' '}
                  {new Date(reservation.start_time).toTimeString().slice(0, 5)}
                </div>
              </div>
              <div>
                <span className="font-medium">{t('reservations.modal.duration')}:</span>
                <div>{reservation.duration} {t('common.hours')}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nueva fecha */}
          <div className="space-y-2">
            <Label htmlFor="new-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('reservations.reschedule.new_date')} *
            </Label>
            <Input
              id="new-date"
              type="date"
              value={newSchedule.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={cn(validationErrors.date && "border-red-500")}
              aria-describedby={validationErrors.date ? "date-error" : undefined}
            />
            {validationErrors.date && (
              <p id="date-error" className="text-sm text-red-600" role="alert">
                {validationErrors.date}
              </p>
            )}
          </div>

          {/* Horarios disponibles */}
          {newSchedule.date && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t('reservations.modal.available_schedules')}
                  {loadingSchedules && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {scheduleError ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{scheduleError}</AlertDescription>
                  </Alert>
                ) : suggestedTimes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {loadingSchedules ? 
                      t('reservations.modal.loading_schedules') : 
                      t('reservations.reschedule.no_availability')
                    }
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                      {suggestedTimes.map((timeOption, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex flex-col p-2 h-auto"
                          onClick={() => {
                            handleInputChange('start_time', timeOption.time);
                            if (newSchedule.duration > timeOption.maxDuration) {
                              handleInputChange('duration', timeOption.maxDuration);
                            }
                          }}
                        >
                          <span className="font-medium">{timeOption.time}</span>
                          <span className="text-xs text-muted-foreground">
                            {timeOption.maxDuration}h {t('common.available')}
                          </span>
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={loadAvailableSchedules}
                      className="w-full"
                      disabled={loadingSchedules}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", loadingSchedules && "animate-spin")} />
                      {t('reservations.modal.refresh_schedules')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Nueva hora y duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-time">
                {t('reservations.reschedule.new_time')} *
              </Label>
              <Input
                id="new-time"
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={cn(validationErrors.start_time && "border-red-500")}
                aria-describedby={validationErrors.start_time ? "time-error" : undefined}
              />
              {validationErrors.start_time && (
                <p id="time-error" className="text-sm text-red-600" role="alert">
                  {validationErrors.start_time}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-duration">
                {t('reservations.modal.duration')} *
              </Label>
              <Select
                value={newSchedule.duration.toString()}
                onValueChange={(value) => handleInputChange('duration', parseFloat(value))}
              >
                <SelectTrigger 
                  id="new-duration"
                  className={cn(validationErrors.duration && "border-red-500")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8].map(hours => (
                    <SelectItem key={hours} value={hours.toString()}>
                      {hours === 0.5 ? 
                        t('reservations.modal.duration_minutes', { minutes: 30 }) :
                        t('reservations.modal.duration_hours', { hours })
                      }
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.duration && (
                <p id="duration-error" className="text-sm text-red-600" role="alert">
                  {validationErrors.duration}
                </p>
              )}
            </div>
          </div>

          {/* Advertencia de conflicto */}
          {conflictWarning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{conflictWarning}</AlertDescription>
            </Alert>
          )}

          {/* Resumen del cambio */}
          {newSchedule.date && newSchedule.start_time && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <div className="font-medium">{t('reservations.reschedule.from')}:</div>
                    <div>
                      {new Date(reservation.start_time).toLocaleDateString('es-ES')} -{' '}
                      {new Date(reservation.start_time).toTimeString().slice(0, 5)} ({reservation.duration}h)
                    </div>
                  </div>
                  
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  
                  <div className="space-y-1">
                    <div className="font-medium">{t('reservations.reschedule.to')}:</div>
                    <div>
                      {new Date(newSchedule.date).toLocaleDateString('es-ES')} -{' '}
                      {newSchedule.start_time} ({newSchedule.duration}h)
                    </div>
                  </div>
                </div>
                
                {isNewScheduleAvailable && (
                  <div className="flex items-center gap-2 mt-3 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">{t('reservations.reschedule.available_confirmation')}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error general */}
          {validationErrors.general && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationErrors.general}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isNewScheduleAvailable}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('reservations.reschedule.confirm')}
            </Button>
          </div>
        </form>

        <LiveRegion />
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(RescheduleModal);

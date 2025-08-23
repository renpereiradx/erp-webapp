/**
 * Modal de gestión de reservas con integración de horarios disponibles
 * Soporta crear, editar y reprogramar reservas con validación en tiempo real
 * Integrado con API /reserve/available-schedules y sistema de consistencia
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Calendar, Clock, User, AlertTriangle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useI18n } from '../../lib/i18n';
import useReservationStore from '../../store/useReservationStore';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import LiveRegion from '../a11y/LiveRegion';
import { MOCK_PRODUCTS, MOCK_CLIENTS, RESERVATION_STATUSES } from '../../services/mockReservationsAPI';
import { cn } from '../../lib/utils';

const ReservationModal = ({ 
  isOpen = false, 
  onClose, 
  reservation = null, 
  mode = 'create' // 'create', 'edit', 'reschedule'
}) => {
  const { t } = useI18n();
  const { trapFocus, restoreFocus } = useFocusManagement();
  
  const {
    loading,
    error,
    createReservation,
    updateReservation,
    rescheduleReservation,
    getAvailableSchedules,
    checkConsistency
  } = useReservationStore();

  // Estado del formulario
  const [formData, setFormData] = useState({
    product_id: '',
    client_id: '',
    date: '',
    start_time: '',
    duration: 1,
    status: 'RESERVED'
  });

  // Estado de horarios disponibles
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);
  
  // Estado de validación
  const [validationErrors, setValidationErrors] = useState({});
  const [consistencyIssues, setConsistencyIssues] = useState([]);

  // Inicializar formulario cuando cambia la reserva
  useEffect(() => {
    if (reservation && (mode === 'edit' || mode === 'reschedule')) {
      const startDateTime = new Date(reservation.start_time);
      setFormData({
        product_id: reservation.product_id || '',
        client_id: reservation.client_id || '',
        date: startDateTime.toISOString().split('T')[0],
        start_time: startDateTime.toTimeString().slice(0, 5),
        duration: reservation.duration || 1,
        status: reservation.status || 'RESERVED'
      });
    } else {
      // Reset para crear nueva reserva
      const today = new Date();
      setFormData({
        product_id: '',
        client_id: '',
        date: today.toISOString().split('T')[0],
        start_time: '09:00',
        duration: 1,
        status: 'RESERVED'
      });
    }
    
    setValidationErrors({});
    setConsistencyIssues([]);
    setAvailableSchedules([]);
  }, [reservation, mode, isOpen]);

  // Cargar horarios disponibles cuando cambian producto/fecha
  const loadAvailableSchedules = useCallback(async () => {
    if (!formData.product_id || !formData.date) {
      setAvailableSchedules([]);
      return;
    }

    setLoadingSchedules(true);
    setScheduleError(null);
    
    try {
      console.log('[telemetry] feature.reservations.modal.available_schedules.load');
      const schedules = await getAvailableSchedules(formData.product_id, formData.date);
      setAvailableSchedules(schedules || []);
      console.log('[telemetry] feature.reservations.modal.available_schedules.success', {
        count: schedules?.length || 0,
        product: formData.product_id,
        date: formData.date
      });
    } catch (error) {
      console.error('[telemetry] feature.reservations.modal.available_schedules.error', {
        error: error.message,
        product: formData.product_id,
        date: formData.date
      });
      setScheduleError(error.message);
    } finally {
      setLoadingSchedules(false);
    }
  }, [formData.product_id, formData.date, getAvailableSchedules]);

  useEffect(() => {
    loadAvailableSchedules();
  }, [loadAvailableSchedules]);

  // Verificar consistencia automáticamente
  const checkReservationConsistency = useCallback(async () => {
    if (reservation?.id) {
      try {
        const issues = await checkConsistency();
        const relevantIssues = issues.filter(issue => 
          issue.reserve_id === reservation.id
        );
        setConsistencyIssues(relevantIssues);
      } catch (error) {
        console.error('Error checking consistency:', error);
      }
    }
  }, [reservation?.id, checkConsistency]);

  useEffect(() => {
    if (mode === 'edit' && reservation?.id) {
      checkReservationConsistency();
    }
  }, [mode, reservation?.id, checkReservationConsistency]);

  // Validación de formulario
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (!formData.product_id) errors.product_id = t('reservations.errors.product_required');
    if (!formData.client_id) errors.client_id = t('reservations.errors.client_required');
    if (!formData.date) errors.date = t('reservations.errors.date_required');
    if (!formData.start_time) errors.start_time = t('reservations.errors.time_required');
    if (formData.duration < 0.5) errors.duration = t('reservations.errors.duration_minimum');
    
    // Validar fecha no sea pasada (excepto para edición)
    if (formData.date && mode === 'create') {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.date = t('reservations.errors.date_past');
      }
    }

    return errors;
  }, [formData, mode, t]);

  // Verificar disponibilidad del horario seleccionado
  const isScheduleAvailable = useMemo(() => {
    if (!formData.start_time || availableSchedules.length === 0) return true;
    
    const [hours, minutes] = formData.start_time.split(':').map(Number);
    const selectedDateTime = new Date(formData.date);
    selectedDateTime.setHours(hours, minutes, 0, 0);
    
    return availableSchedules.some(schedule => {
      const scheduleStart = new Date(schedule.start_time);
      const scheduleEnd = new Date(schedule.end_time);
      const selectedEnd = new Date(selectedDateTime.getTime() + (formData.duration * 60 * 60 * 1000));
      
      return selectedDateTime >= scheduleStart && selectedEnd <= scheduleEnd;
    });
  }, [formData.start_time, formData.date, formData.duration, availableSchedules]);

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error de validación al corregir
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

    if (!isScheduleAvailable && mode !== 'edit') {
      setValidationErrors({
        start_time: t('reservations.errors.schedule_not_available')
      });
      return;
    }

    try {
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(hours, minutes, 0, 0);

      const reservationData = {
        product_id: formData.product_id,
        client_id: formData.client_id,
        start_time: startDateTime.toISOString(),
        duration: formData.duration,
        status: formData.status
      };

      let result;
      if (mode === 'create') {
        console.log('[telemetry] feature.reservations.modal.create.attempt');
        result = await createReservation(payload);
        console.log('[telemetry] feature.reservations.modal.create.success');
      } else if (mode === 'reschedule') {
        console.log('[telemetry] feature.reservations.modal.reschedule.attempt');
        result = await rescheduleReservation(editingReservation.id, {
          date: payload.date,
          start_time: payload.start_time,
          duration: payload.duration
        });
        console.log('[telemetry] feature.reservations.modal.reschedule.success');
      } else {
        console.log('[telemetry] feature.reservations.modal.update.attempt');
        result = await updateReservation(editingReservation.id, payload);
        console.log('[telemetry] feature.reservations.modal.update.success');
      }

      onClose();
      
    } catch (error) {
      console.error('[telemetry] feature.reservations.modal.submit.error', {
        mode,
        error: error.message
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

  // Obtener nombre del producto
  const getProductName = (productId) => {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    return product?.name || productId;
  };

  // Obtener nombre del cliente
  const getClientName = (clientId) => {
    const client = MOCK_CLIENTS.find(c => c.id === clientId);
    return client?.name || clientId;
  };

  // Obtener título del modal
  const getModalTitle = () => {
    switch (mode) {
      case 'reschedule':
        return t('reservations.modal.title_reschedule');
      case 'edit':
        return t('reservations.modal.title_edit');
      default:
        return t('reservations.modal.title_create');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        aria-describedby="reservation-modal-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'reschedule' ? <RefreshCw className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>

        <div id="reservation-modal-description" className="sr-only">
          {mode === 'create' ? 
            t('reservations.modal.description_create') : 
            t('reservations.modal.description_edit')
          }
        </div>

        {/* Alertas de consistencia */}
        {consistencyIssues.length > 0 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('reservations.modal.consistency_issues')}
              <ul className="mt-2 list-disc list-inside">
                {consistencyIssues.map((issue, index) => (
                  <li key={index} className="text-sm">
                    {issue.details}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de producto */}
          <div className="space-y-2">
            <Label htmlFor="product-select">
              {t('reservations.modal.product')} *
            </Label>
            <Select
              value={formData.product_id}
              onValueChange={(value) => handleInputChange('product_id', value)}
              disabled={mode === 'edit'}
            >
              <SelectTrigger 
                id="product-select"
                className={cn(validationErrors.product_id && "border-red-500")}
                aria-describedby={validationErrors.product_id ? "product-error" : undefined}
              >
                <SelectValue placeholder={t('reservations.modal.select_product')} />
              </SelectTrigger>
              <SelectContent>
                {MOCK_PRODUCTS.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.product_id && (
              <p id="product-error" className="text-sm text-red-600" role="alert">
                {validationErrors.product_id}
              </p>
            )}
          </div>

          {/* Selección de cliente */}
          <div className="space-y-2">
            <Label htmlFor="client-select">
              {t('reservations.modal.client')} *
            </Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => handleInputChange('client_id', value)}
            >
              <SelectTrigger 
                id="client-select"
                className={cn(validationErrors.client_id && "border-red-500")}
                aria-describedby={validationErrors.client_id ? "client-error" : undefined}
              >
                <SelectValue placeholder={t('reservations.modal.select_client')} />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CLIENTS.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.client_id && (
              <p id="client-error" className="text-sm text-red-600" role="alert">
                {validationErrors.client_id}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="date-input">
              {t('reservations.modal.date')} *
            </Label>
            <Input
              id="date-input"
              type="date"
              value={formData.date}
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
          {formData.product_id && formData.date && (
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
                ) : availableSchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {loadingSchedules ? 
                      t('reservations.modal.loading_schedules') : 
                      t('reservations.modal.no_schedules')
                    }
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSchedules.map((schedule, index) => {
                      const startTime = new Date(schedule.start_time);
                      const endTime = new Date(schedule.end_time);
                      
                      return (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex flex-col p-2 h-auto"
                          onClick={() => {
                            handleInputChange('start_time', startTime.toTimeString().slice(0, 5));
                            const maxDuration = schedule.available_consecutive_hours || 1;
                            if (formData.duration > maxDuration) {
                              handleInputChange('duration', maxDuration);
                            }
                          }}
                        >
                          <span className="font-medium">
                            {startTime.toTimeString().slice(0, 5)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {t('reservations.modal.available_hours', { 
                              hours: schedule.available_consecutive_hours 
                            })}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadAvailableSchedules}
                  className="mt-3 w-full"
                  disabled={loadingSchedules}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loadingSchedules && "animate-spin")} />
                  {t('reservations.modal.refresh_schedules')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Hora y duración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-input">
                {t('reservations.modal.start_time')} *
              </Label>
              <Input
                id="time-input"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={cn(validationErrors.start_time && "border-red-500")}
                aria-describedby={validationErrors.start_time ? "time-error" : undefined}
              />
              {validationErrors.start_time && (
                <p id="time-error" className="text-sm text-red-600" role="alert">
                  {validationErrors.start_time}
                </p>
              )}
              {!isScheduleAvailable && formData.start_time && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {t('reservations.modal.schedule_conflict')}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration-input">
                {t('reservations.modal.duration')} *
              </Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(value) => handleInputChange('duration', parseFloat(value))}
              >
                <SelectTrigger 
                  id="duration-input"
                  className={cn(validationErrors.duration && "border-red-500")}
                  aria-describedby={validationErrors.duration ? "duration-error" : undefined}
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

          {/* Estado (solo para edición) */}
          {mode === 'edit' && (
            <div className="space-y-2">
              <Label htmlFor="status-select">
                {t('reservations.modal.status')}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger id="status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_STATUSES.map(status => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant={status.variant} className="w-2 h-2 p-0" />
                        {t(`reservations.status.${status.id.toLowerCase()}`)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Error general */}
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
              disabled={loading || (!isScheduleAvailable && mode !== 'edit')}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' && t('reservations.modal.create')}
              {mode === 'edit' && t('reservations.modal.save')}
              {mode === 'reschedule' && t('reservations.modal.reschedule')}
            </Button>
          </div>
        </form>

        <LiveRegion />
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(ReservationModal);

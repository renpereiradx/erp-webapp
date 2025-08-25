/**
 * Vista de calendario para reservas con navegación por fecha/producto
 * Visualización optimizada de disponibilidad y reservas existentes
 * Integrado con sistema de horarios disponibles y gestión de reservas
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RefreshCw,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { useI18n } from '../../lib/i18n';
import useReservationStore from '../../store/useReservationStore';
import { MOCK_PRODUCTS, RESERVATION_STATUSES } from '../../services/mockReservationsAPI';
import { cn } from '../../lib/utils';
import ReservationModal from './ReservationModal';

const ReservationCalendarView = ({ className = "" }) => {
  const { t } = useI18n();
  
  const {
    reservations,
    loading,
    getReservations,
    getReservationsByProduct,
    getAvailableSchedules
  } = useReservationStore();

  // Estado local
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [viewMode, setViewMode] = useState('week'); // 'day', 'week', 'month'
  const [availableSchedules, setAvailableSchedules] = useState({});
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  
  // Modal de reserva
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Funciones de navegación de fecha
  const navigateDate = useCallback((direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
    console.log('[telemetry] feature.reservations.calendar.navigate', {
      direction,
      viewMode,
      newDate: newDate.toISOString().split('T')[0]
    });
  }, [currentDate, viewMode]);

  // Obtener rango de fechas según vista
  const getDateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        return { start, end };
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 6);
        return { start, end };
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        return { start, end };
      default:
        return { start, end };
    }
  }, [currentDate, viewMode]);

  // Cargar reservas para el rango actual
  useEffect(() => {
    const loadReservations = async () => {
      try {
        const params = {
          startDate: getDateRange.start.toISOString().split('T')[0],
          endDate: getDateRange.end.toISOString().split('T')[0]
        };
        
        if (selectedProduct !== 'all') {
          await getReservationsByProduct(selectedProduct, params);
        } else {
          await getReservations(params);
        }
        
        console.log('[telemetry] feature.reservations.calendar.load', {
          viewMode,
          product: selectedProduct,
          dateRange: params
        });
      } catch (error) {
        console.error('[telemetry] feature.reservations.calendar.load.error', {
          error: error.message
        });
      }
    };

    loadReservations();
  }, [getDateRange, selectedProduct, getReservations, getReservationsByProduct, viewMode]);

  // Cargar horarios disponibles para productos seleccionados
  const loadAvailableSchedules = useCallback(async () => {
    if (selectedProduct === 'all') return;
    
    setLoadingSchedules(true);
    const schedules = {};
    
    try {
      const dates = [];
      const current = new Date(getDateRange.start);
      
      while (current <= getDateRange.end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      
      for (const date of dates) {
        try {
          const daySchedules = await getAvailableSchedules(selectedProduct, date);
          schedules[date] = daySchedules || [];
        } catch (error) {
          schedules[date] = [];
        }
      }
      
      setAvailableSchedules(schedules);
      console.log('[telemetry] feature.reservations.calendar.schedules.loaded', {
        product: selectedProduct,
        dates: dates.length
      });
    } catch (error) {
      console.error('[telemetry] feature.reservations.calendar.schedules.error', {
        error: error.message
      });
    } finally {
      setLoadingSchedules(false);
    }
  }, [selectedProduct, getDateRange, getAvailableSchedules]);

  useEffect(() => {
    loadAvailableSchedules();
  }, [loadAvailableSchedules]);

  // Filtrar reservas por fecha y producto
  const filteredReservations = useMemo(() => {
    if (!reservations) return [];
    
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.start_time);
      const isInRange = reservationDate >= getDateRange.start && reservationDate <= getDateRange.end;
      const matchesProduct = selectedProduct === 'all' || reservation.product_id === selectedProduct;
      
      return isInRange && matchesProduct;
    });
  }, [reservations, getDateRange, selectedProduct]);

  // Generar días para vista semanal/mensual
  const getDaysInRange = useMemo(() => {
    const days = [];
    const current = new Date(getDateRange.start);
    
    while (current <= getDateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }, [getDateRange]);

  // Agrupar reservas por fecha
  const reservationsByDate = useMemo(() => {
    const grouped = {};
    
    filteredReservations.forEach(reservation => {
      const date = new Date(reservation.start_time).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(reservation);
    });
    
    // Ordenar por hora de inicio
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );
    });
    
    return grouped;
  }, [filteredReservations]);

  // Obtener estado de disponibilidad para un día
  const getDayAvailability = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayReservations = reservationsByDate[dateStr] || [];
    const daySchedules = availableSchedules[dateStr] || [];
    
    if (selectedProduct === 'all') {
      return {
        hasReservations: dayReservations.length > 0,
        totalReservations: dayReservations.length,
        availableSlots: 0 // No calculamos sin producto específico
      };
    }
    
    return {
      hasReservations: dayReservations.length > 0,
      totalReservations: dayReservations.length,
      availableSlots: daySchedules.length
    };
  }, [reservationsByDate, availableSchedules, selectedProduct]);

  // Manejar clic en día
  const handleDayClick = useCallback((date) => {
    if (viewMode !== 'day') {
      setCurrentDate(date);
      setViewMode('day');
    }
    
    console.log('[telemetry] feature.reservations.calendar.day.click', {
      date: date.toISOString().split('T')[0]
    });
  }, [viewMode]);

  // Manejar clic en horario disponible
  const handleScheduleClick = useCallback((date, schedule) => {
    if (selectedProduct === 'all') return;
    
    setSelectedSlot({
      date: date.toISOString().split('T')[0],
      start_time: schedule.start_time,
      product_id: selectedProduct
    });
    setModalMode('create');
    setSelectedReservation(null);
    setShowModal(true);
    
    console.log('[telemetry] feature.reservations.calendar.schedule.click', {
      product: selectedProduct,
      date: date.toISOString().split('T')[0],
      time: schedule.start_time
    });
  }, [selectedProduct]);

  // Manejar clic en reserva
  const handleReservationClick = useCallback((reservation) => {
    setSelectedReservation(reservation);
    setModalMode('edit');
    setSelectedSlot(null);
    setShowModal(true);
    
    console.log('[telemetry] feature.reservations.calendar.reservation.click', {
      reservationId: reservation.id
    });
  }, []);

  // Obtener color de estado de reserva
  const getStatusColor = (status) => {
    const statusConfig = RESERVATION_STATUSES.find(s => s.id === status);
    return statusConfig?.variant || 'default';
  };

  // Obtener nombre del producto
  const getProductName = (productId) => {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    return product?.name || productId;
  };

  // Renderizar vista de día
  const renderDayView = () => {
    const date = currentDate;
    const dateStr = date.toISOString().split('T')[0];
    const dayReservations = reservationsByDate[dateStr] || [];
    const daySchedules = availableSchedules[dateStr] || [];
    
    // Crear timeline de 24 horas
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {date.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          <Badge variant="outline">
            {t('reservations.calendar.reservations_count', { 
              count: dayReservations.length 
            })}
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {hours.map(hour => {
            const hourStr = hour.toString().padStart(2, '0') + ':00';
            const hourReservations = dayReservations.filter(res => {
              const resHour = new Date(res.start_time).getHours();
              return resHour === hour;
            });
            
            const hourSchedules = daySchedules.filter(schedule => {
              const scheduleHour = new Date(schedule.start_time).getHours();
              return scheduleHour === hour;
            });
            
            return (
              <div key={hour} className="flex items-center gap-3 p-2 border rounded">
                <div className="w-16 text-sm font-medium text-muted-foreground">
                  {hourStr}
                </div>
                
                <div className="flex-1 space-y-1">
                  {/* Reservas existentes */}
                  {hourReservations.map(reservation => (
                    <button
                      key={reservation.id}
                      onClick={() => handleReservationClick(reservation)}
                      className="w-full text-left p-2 rounded border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(reservation.status)} className="text-xs">
                            {t(`reservations.status.${reservation.status.toLowerCase()}`)}
                          </Badge>
                          <span className="text-sm font-medium">
                            {reservation.client_name || reservation.client_id}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.duration}h
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {selectedProduct === 'all' ? getProductName(reservation.product_id) : ''}
                      </div>
                    </button>
                  ))}
                  
                  {/* Horarios disponibles */}
                  {selectedProduct !== 'all' && hourSchedules.map((schedule, index) => (
                    <button
                      key={index}
                      onClick={() => handleScheduleClick(date, schedule)}
                      className="w-full text-left p-2 rounded border border-dashed border-green-300 bg-green-50 hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">
                          {t('reservations.calendar.available_slot')}
                        </span>
                        <div className="text-xs text-green-600">
                          {schedule.available_consecutive_hours}h {t('common.available')}
                        </div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Hora vacía */}
                  {hourReservations.length === 0 && hourSchedules.length === 0 && (
                    <div className="text-xs text-muted-foreground italic p-2">
                      {selectedProduct === 'all' ? 
                        t('reservations.calendar.no_reservations') : 
                        t('reservations.calendar.no_availability')
                      }
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizar vista de semana
  const renderWeekView = () => {
    const days = getDaysInRange.slice(0, 7); // Asegurar solo 7 días
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const dayAvailability = getDayAvailability(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <Card 
              key={dateStr}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent",
                isToday && "ring-2 ring-primary"
              )}
              onClick={() => handleDayClick(date)}
            >
              <CardHeader className="pb-2">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">
                    {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-semibold">
                    {date.getDate()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {dayAvailability.hasReservations && (
                    <Badge variant="default" className="text-xs w-full justify-center">
                      {dayAvailability.totalReservations} {t('reservations.calendar.reservations')}
                    </Badge>
                  )}
                  
                  {selectedProduct !== 'all' && dayAvailability.availableSlots > 0 && (
                    <Badge variant="outline" className="text-xs w-full justify-center">
                      {dayAvailability.availableSlots} {t('reservations.calendar.available')}
                    </Badge>
                  )}
                  
                  {!dayAvailability.hasReservations && dayAvailability.availableSlots === 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      {selectedProduct === 'all' ? 
                        t('reservations.calendar.no_data') : 
                        t('reservations.calendar.no_availability')
                      }
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Renderizar vista de mes
  const renderMonthView = () => {
    const days = getDaysInRange;
    const weeks = [];
    
    // Agrupar días en semanas
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return (
      <div className="space-y-2">
        {/* Encabezado de días de semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Semanas */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 gap-2">
            {week.map(date => {
              const dateStr = date.toISOString().split('T')[0];
              const dayAvailability = getDayAvailability(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              
              return (
                <Card 
                  key={dateStr}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-accent min-h-[80px]",
                    !isCurrentMonth && "opacity-50",
                    isToday && "ring-2 ring-primary"
                  )}
                  onClick={() => handleDayClick(date)}
                >
                  <CardContent className="p-2">
                    <div className="text-sm font-semibold mb-1">
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayAvailability.hasReservations && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      
                      {selectedProduct !== 'all' && dayAvailability.availableSlots > 0 && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}
        
        {/* Leyenda */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{t('reservations.calendar.has_reservations')}</span>
          </div>
          {selectedProduct !== 'all' && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{t('reservations.calendar.has_availability')}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {t('reservations.calendar.title')}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Selector de producto */}
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t('reservations.calendar.all_products')}
                  </SelectItem>
                  {MOCK_PRODUCTS.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Selector de vista */}
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">{t('reservations.calendar.day')}</SelectItem>
                  <SelectItem value="week">{t('reservations.calendar.week')}</SelectItem>
                  <SelectItem value="month">{t('reservations.calendar.month')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Navegación de fecha */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {viewMode === 'month' && 
                  currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                }
                {viewMode === 'week' && 
                  `${getDateRange.start.toLocaleDateString('es-ES')} - ${getDateRange.end.toLocaleDateString('es-ES')}`
                }
                {viewMode === 'day' && 
                  currentDate.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' })
                }
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateDate('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                {t('reservations.calendar.today')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedProduct !== 'all') {
                    loadAvailableSchedules();
                  }
                }}
                disabled={loadingSchedules || loading}
              >
                <RefreshCw className={cn("h-4 w-4", (loadingSchedules || loading) && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
        </CardContent>
      </Card>
      
      {/* Modal de reserva */}
      <ReservationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        reservation={selectedReservation}
        mode={modalMode}
        initialData={selectedSlot}
      />
    </TooltipProvider>
  );
};

export default React.memo(ReservationCalendarView);

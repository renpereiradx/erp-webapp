/**
 * Componente de gestión administrativa de horarios
 * Permite ver, filtrar y gestionar la disponibilidad de horarios por producto
 * Integrado con el sistema de reservas siguiendo patrones establecidos
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, Filter, RefreshCw, MoreVertical, Check, X, Plus, BarChart3 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useReservationStore } from '../../store/useReservationStore';
import { MOCK_PRODUCTS } from '../../services/mockReservationsAPI';
import { useTranslation } from '../../lib/i18n';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import { LiveRegion } from '../a11y/LiveRegion';
import { cn } from '../../lib/utils';

const ScheduleManagement = ({ className = "" }) => {
  const { t } = useTranslation();
  const { announce } = useFocusManagement();
  
  // Estado local
  const [selectedProduct, setSelectedProduct] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const week = new Date();
    week.setDate(week.getDate() + 7);
    return week.toISOString().split('T')[0];
  });
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [selectedSchedules, setSelectedSchedules] = useState(new Set());

  // Store de reservas
  const {
    schedules,
    loading,
    error,
    scheduleManagement,
    getSchedulesByDateRange,
    getSchedulesByProduct,
    updateScheduleAvailability,
    bulkUpdateScheduleAvailability,
    setScheduleProduct,
    setScheduleDateRange,
    getScheduleStats,
    clearError,
    clearScheduleCache
  } = useReservationStore();

  // Efecto para cargar horarios cuando cambian los filtros
  useEffect(() => {
    if (selectedProduct && startDate && endDate) {
      setScheduleProduct(selectedProduct);
      setScheduleDateRange({ start: startDate, end: endDate });
      
      if (selectedProduct === 'all') {
        getSchedulesByDateRange(startDate, endDate);
      } else {
        getSchedulesByProduct(selectedProduct, { startDate, endDate });
      }
    }
  }, [selectedProduct, startDate, endDate, getSchedulesByDateRange, getSchedulesByProduct, setScheduleProduct, setScheduleDateRange]);

  // Filtrar horarios según criterios seleccionados
  const filteredSchedules = useMemo(() => {
    let filtered = [...schedules];

    if (availabilityFilter === 'available') {
      filtered = filtered.filter(s => s.is_available);
    } else if (availabilityFilter === 'occupied') {
      filtered = filtered.filter(s => !s.is_available);
    }

    // Ordenar por fecha/hora
    filtered.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    return filtered;
  }, [schedules, availabilityFilter]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const total = filteredSchedules.length;
    const available = filteredSchedules.filter(s => s.is_available).length;
    const occupied = total - available;
    
    return {
      total,
      available,
      occupied,
      availabilityRate: total > 0 ? Math.round((available / total) * 100) : 0
    };
  }, [filteredSchedules]);

  // Manejadores de eventos
  const handleToggleAvailability = async (scheduleId, currentAvailability) => {
    try {
      await updateScheduleAvailability(scheduleId, !currentAvailability);
      const newStatus = !currentAvailability ? t('reservations.a11y.schedule.available') : t('reservations.a11y.schedule.occupied');
      announce(t('reservations.a11y.schedule.availability_updated', { status: newStatus }));
    } catch (error) {
      announce(t('reservations.a11y.schedule.update_failed'));
    }
  };

  const handleBulkToggleAvailability = async (available) => {
    if (selectedSchedules.size === 0) return;
    
    try {
      const scheduleIds = Array.from(selectedSchedules);
      await bulkUpdateScheduleAvailability(scheduleIds, available);
      
      const action = available ? t('reservations.a11y.schedule.made_available') : t('reservations.a11y.schedule.made_unavailable');
      announce(t('reservations.a11y.schedule.bulk_updated', { count: scheduleIds.length, action }));
      
      setSelectedSchedules(new Set());
    } catch (error) {
      announce(t('reservations.a11y.schedule.bulk_update_failed'));
    }
  };

  const handleSelectSchedule = (scheduleId) => {
    const newSelection = new Set(selectedSchedules);
    if (newSelection.has(scheduleId)) {
      newSelection.delete(scheduleId);
    } else {
      newSelection.add(scheduleId);
    }
    setSelectedSchedules(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSchedules.size === filteredSchedules.length) {
      setSelectedSchedules(new Set());
      announce(t('reservations.a11y.schedule.selection_cleared'));
    } else {
      setSelectedSchedules(new Set(filteredSchedules.map(s => s.id)));
      announce(t('reservations.a11y.schedule.all_selected', { count: filteredSchedules.length }));
    }
  };

  const handleRefresh = () => {
    clearScheduleCache();
    clearError();
    
    if (selectedProduct && startDate && endDate) {
      if (selectedProduct === 'all') {
        getSchedulesByDateRange(startDate, endDate);
      } else {
        getSchedulesByProduct(selectedProduct, { startDate, endDate });
      }
    }
    
    announce(t('reservations.a11y.schedule.refreshed'));
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const getProductName = (productId) => {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    return product?.name || productId;
  };

  return (
    <div className={cn("space-y-6", className)}>
      <LiveRegion />
      
      {/* Header con título y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            {t('reservations.schedule.management_title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('reservations.schedule.management_subtitle')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowStats(!showStats)}
            aria-expanded={showStats}
            aria-controls="schedule-stats"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('reservations.schedule.toggle_stats')}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      {/* Panel de estadísticas (colapsible) */}
      {showStats && (
        <Card id="schedule-stats" role="region" aria-label={t('reservations.schedule.stats_section')}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('reservations.schedule.statistics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">{t('reservations.schedule.total_schedules')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                <div className="text-sm text-gray-600">{t('reservations.schedule.available_schedules')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.occupied}</div>
                <div className="text-sm text-gray-600">{t('reservations.schedule.occupied_schedules')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.availabilityRate}%</div>
                <div className="text-sm text-gray-600">{t('reservations.schedule.availability_rate')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card role="region" aria-label={t('reservations.schedule.filters_section')}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Selector de producto */}
            <div>
              <label htmlFor="product-select" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.schedule.select_product')}
              </label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product-select">
                  <SelectValue placeholder={t('reservations.schedule.all_products')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reservations.schedule.all_products')}</SelectItem>
                  {MOCK_PRODUCTS.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha inicio */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.schedule.start_date')}
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* Fecha fin */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.schedule.end_date')}
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Filtro disponibilidad */}
            <div>
              <label htmlFor="availability-filter" className="block text-sm font-medium text-gray-700 mb-1">
                {t('reservations.schedule.availability_filter')}
              </label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger id="availability-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('reservations.schedule.all_statuses')}</SelectItem>
                  <SelectItem value="available">{t('reservations.schedule.available_only')}</SelectItem>
                  <SelectItem value="occupied">{t('reservations.schedule.occupied_only')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acciones masivas */}
            <div className="flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('reservations.schedule.bulk_actions')}
              </label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggleAvailability(true)}
                  disabled={selectedSchedules.size === 0 || scheduleManagement.availabilityUpdating}
                  className="flex-1"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkToggleAvailability(false)}
                  disabled={selectedSchedules.size === 0 || scheduleManagement.availabilityUpdating}
                  className="flex-1"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de horarios */}
      <Card role="region" aria-label={t('reservations.schedule.schedules_section')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {t('reservations.schedule.schedules_list')} ({filteredSchedules.length})
          </CardTitle>
          
          {filteredSchedules.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedSchedules.size === filteredSchedules.length ? 
                t('reservations.schedule.deselect_all') : 
                t('reservations.schedule.select_all')
              }
            </Button>
          )}
        </CardHeader>
        
        <CardContent>
          {error && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-red-800 text-sm">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={clearError}
                className="mt-2"
              >
                {t('common.dismiss')}
              </Button>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-600 mt-2" aria-live="polite">
                {t('reservations.schedule.loading')}
              </p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-gray-300" />
              <p className="text-gray-600 mt-4">
                {t('reservations.schedule.no_schedules')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSchedules.map((schedule) => {
                const { date, time } = formatDateTime(schedule.start_time);
                const endTime = formatDateTime(schedule.end_time).time;
                const isSelected = selectedSchedules.has(schedule.id);
                
                return (
                  <div
                    key={schedule.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors",
                      isSelected && "bg-blue-50 border-blue-200"
                    )}
                    role="article"
                    aria-label={t('reservations.schedule.schedule_item', {
                      product: getProductName(schedule.product_id),
                      date,
                      time: `${time} - ${endTime}`,
                      status: schedule.is_available ? t('reservations.schedule.available') : t('reservations.schedule.occupied')
                    })}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectSchedule(schedule.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={t('reservations.a11y.schedule.select_item')}
                      />
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {getProductName(schedule.product_id)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {date} • {time} - {endTime}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={schedule.is_available ? "success" : "secondary"}
                        className="text-xs"
                      >
                        {schedule.is_available ? 
                          t('reservations.schedule.available') : 
                          t('reservations.schedule.occupied')
                        }
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleAvailability(schedule.id, schedule.is_available)}
                        disabled={scheduleManagement.availabilityUpdating}
                        aria-label={
                          schedule.is_available ?
                            t('reservations.a11y.schedule.mark_unavailable') :
                            t('reservations.a11y.schedule.mark_available')
                        }
                      >
                        {schedule.is_available ? 
                          <X className="h-4 w-4 text-red-600" /> : 
                          <Check className="h-4 w-4 text-green-600" />
                        }
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleManagement;

/**
 * Componente ReservationFilters - Panel de filtros para reservas
 * Filtros funcionales por estado, fecha, cliente y producto
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Filter, CalendarDays, User, Package, RotateCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { MOCK_PRODUCTS, RESERVATION_STATUSES } from '@/services/mockReservationsAPI';
import useFocusManagement from '@/hooks/useFocusManagement';
import { useLiveRegion } from '@/components/a11y/LiveRegion';

const ReservationFilters = ({ 
  onFiltersChange, 
  onClose,
  currentFilters = {} 
}) => {
  const { t } = useI18n();
  
  // Focus management y live regions para accesibilidad
  const { announce } = useFocusManagement();
  const { announce: liveAnnounce, LiveRegions } = useLiveRegion();
  const filterRef = useRef(null);
  const firstFocusableRef = useRef(null);

  // Estado de filtros
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    clientId: '',
    productId: '',
    clientName: '', // Para búsqueda por nombre de cliente
    ...currentFilters
  });

  // Focus inicial en el componente
  useEffect(() => {
    if (firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, []);

  // Funciones helper para fechas memoizadas
  const dateHelpers = useMemo(() => {
    const getWeekStart = () => {
      const date = new Date();
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lunes como primer día
      return new Date(date.setDate(diff));
    };

    const getWeekEnd = () => {
      const weekStart = getWeekStart();
      return new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    };

    return { getWeekStart, getWeekEnd };
  }, []);

  // Filtros rápidos predefinidos con memoización
  const quickFilters = useMemo(() => [
    {
      id: 'today',
      label: t('reservations.filters.quick.today') || 'Hoy',
      icon: CalendarDays,
      filters: {
        dateFrom: new Date().toISOString().split('T')[0],
        dateTo: new Date().toISOString().split('T')[0]
      }
    },
    {
      id: 'this_week',
      label: t('reservations.filters.quick.this_week') || 'Esta Semana',
      icon: CalendarDays,
      filters: {
        dateFrom: dateHelpers.getWeekStart().toISOString().split('T')[0],
        dateTo: dateHelpers.getWeekEnd().toISOString().split('T')[0]
      }
    },
    {
      id: 'pending',
      label: t('reservations.filters.quick.pending') || 'Pendientes',
      icon: Filter,
      filters: {
        status: 'RESERVED'
      }
    },
    {
      id: 'confirmed',
      label: t('reservations.filters.quick.confirmed') || 'Confirmadas',
      icon: Filter,
      filters: {
        status: 'confirmed'
      }
    }
  ], [t, dateHelpers]);

  // Manejar cambios en filtros
  const handleFilterChange = useCallback((key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Anunciar cambio de filtro para screen readers
    const filterLabels = {
      status: t('reservations.filters.status_label') || 'Estado',
      dateFrom: t('reservations.filters.date_from') || 'Fecha desde',
      dateTo: t('reservations.filters.date_to') || 'Fecha hasta',
      productId: t('reservations.filters.product_label') || 'Producto',
      clientName: t('reservations.filters.client_label') || 'Cliente'
    };
    
    if (value) {
      announce(t('reservations.a11y.filter_changed', { 
        filter: filterLabels[key], 
        value 
      }) || `Filtro ${filterLabels[key]} cambiado a ${value}`);
    } else {
      announce(t('reservations.a11y.filter_cleared', { 
        filter: filterLabels[key] 
      }) || `Filtro ${filterLabels[key]} limpiado`);
    }
  }, [filters, announce, t]);

  // Aplicar filtro rápido
  const handleQuickFilter = useCallback((quickFilter) => {
    const newFilters = { ...filters, ...quickFilter.filters };
    setFilters(newFilters);
    
    // Anunciar filtro rápido aplicado
    liveAnnounce(t('reservations.a11y.quick_filter_applied', { 
      filter: quickFilter.label 
    }) || `Filtro rápido aplicado: ${quickFilter.label}`);
  }, [filters, liveAnnounce, t]);

  // Limpiar todos los filtros
  const handleClearFilters = useCallback(() => {
    const clearedFilters = {
      status: '',
      dateFrom: '',
      dateTo: '',
      clientId: '',
      productId: '',
      clientName: ''
    };
    setFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
    
    // Anunciar limpieza de filtros
    liveAnnounce(t('reservations.a11y.filters_cleared') || 'Todos los filtros han sido limpiados');
  }, [onFiltersChange, liveAnnounce, t]);

  // Aplicar filtros
  const handleApplyFilters = useCallback(() => {
    // Limpiar campos vacíos
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== '')
    );
    
    onFiltersChange?.(cleanFilters);
    
    // Anunciar aplicación de filtros
    const activeCount = Object.keys(cleanFilters).length;
    liveAnnounce(t('reservations.a11y.filters_applied', { count: activeCount }) || 
      `${activeCount} filtros aplicados`);
  }, [filters, onFiltersChange, liveAnnounce, t]);

  // Contar filtros activos con memoización
  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== '').length;
  }, [filters]);

  // Obtener etiquetas de filtros activos con memoización
  const activeFilterLabels = useMemo(() => {
    const labels = [];
    
    if (filters.status) {
      const status = RESERVATION_STATUSES.find(s => s.value === filters.status);
      labels.push({
        key: 'status',
        label: status?.label || filters.status,
        color: status?.color || 'bg-gray-100 text-gray-800'
      });
    }
    
    if (filters.dateFrom || filters.dateTo) {
      const dateLabel = filters.dateFrom && filters.dateTo 
        ? `${filters.dateFrom} - ${filters.dateTo}`
        : filters.dateFrom 
          ? `Desde ${filters.dateFrom}`
          : `Hasta ${filters.dateTo}`;
      labels.push({
        key: 'date',
        label: dateLabel,
        color: 'bg-blue-100 text-blue-800'
      });
    }
    
    if (filters.productId) {
      const product = MOCK_PRODUCTS.find(p => p.id === filters.productId);
      labels.push({
        key: 'product',
        label: product?.name || filters.productId,
        color: 'bg-purple-100 text-purple-800'
      });
    }
    
    if (filters.clientName) {
      labels.push({
        key: 'client',
        label: `Cliente: ${filters.clientName}`,
        color: 'bg-green-100 text-green-800'
      });
    }
    
    return labels;
  }, [filters]);

  // Remover filtro específico con useCallback
  const removeFilter = useCallback((filterKey) => {
    const updatedFilters = { ...filters };
    
    if (filterKey === 'date') {
      updatedFilters.dateFrom = '';
      updatedFilters.dateTo = '';
    } else if (filterKey === 'client') {
      updatedFilters.clientId = '';
      updatedFilters.clientName = '';
    } else {
      updatedFilters[filterKey] = '';
    }
    
    setFilters(updatedFilters);
    
    // Anunciar filtro removido
    const filterLabels = {
      status: t('reservations.filters.status_label') || 'Estado',
      date: t('reservations.filters.date_range') || 'Rango de fechas',
      product: t('reservations.filters.product_label') || 'Producto',
      client: t('reservations.filters.client_label') || 'Cliente'
    };
    
    announce(t('reservations.a11y.filter_removed', { 
      filter: filterLabels[filterKey] 
    }) || `Filtro ${filterLabels[filterKey]} removido`);
  }, [filters, announce, t]);

  return (
    <>
      <LiveRegions />
      <Card 
        ref={filterRef}
        role="region"
        aria-labelledby="filters-title"
        aria-describedby="filters-description"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle 
              id="filters-title"
              className="flex items-center gap-2"
            >
              <Filter className="w-5 h-5" aria-hidden="true" />
              {t('reservations.filters.title') || 'Filtros'}
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2"
                  aria-label={t('reservations.a11y.active_filters_count', { count: activeFiltersCount }) || 
                    `${activeFiltersCount} filtros activos`}
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            <Button 
              ref={firstFocusableRef}
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              aria-label={t('reservations.a11y.close_filters') || 'Cerrar panel de filtros'}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <p id="filters-description" className="sr-only">
            Panel de filtros para refinar la búsqueda de reservas. Utiliza los controles a continuación para aplicar filtros por estado, fecha, cliente o producto.
          </p>
          
          {/* Filtros activos */}
          {activeFiltersCount > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {t('reservations.filters.active') || 'Filtros activos:'}
              </p>
              <div 
                className="flex flex-wrap gap-2"
                role="list"
                aria-label={t('reservations.a11y.active_filters_list') || 'Lista de filtros activos'}
              >
                {activeFilterLabels.map((filter, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className={`${filter.color} flex items-center gap-1`}
                    role="listitem"
                  >
                    {filter.label}
                    <button
                      onClick={() => removeFilter(filter.key)}
                      className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      aria-label={t('reservations.a11y.remove_filter', { filter: filter.label }) || 
                        `Remover filtro ${filter.label}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros rápidos */}
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">
              {t('reservations.filters.quick_filters') || 'Filtros Rápidos'}
            </legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="quick-filters-label">
              <span id="quick-filters-label" className="sr-only">Filtros rápidos disponibles</span>
              {quickFilters.map((quickFilter) => (
                <Button
                  key={quickFilter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(quickFilter)}
                  className="justify-start"
                  aria-describedby={`quick-filter-${quickFilter.id}-desc`}
                >
                  <quickFilter.icon className="w-4 h-4 mr-2" aria-hidden="true" />
                  {quickFilter.label}
                  <span id={`quick-filter-${quickFilter.id}-desc`} className="sr-only">
                    Aplicar filtro rápido {quickFilter.label}
                  </span>
                </Button>
              ))}
            </div>
          </fieldset>

          {/* Estado */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="w-4 h-4" aria-hidden="true" />
              {t('reservations.filters.status_label') || 'Estado'}
            </Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
              aria-describedby="status-filter-help"
            >
              <SelectTrigger aria-label={t('reservations.a11y.status_filter') || 'Filtrar por estado de reserva'}>
                <SelectValue placeholder={t('reservations.filters.status_placeholder') || 'Todos los estados'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {t('reservations.filters.all_statuses') || 'Todos los estados'}
                </SelectItem>
                {RESERVATION_STATUSES.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} aria-hidden="true" />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="status-filter-help" className="text-xs text-gray-500">
              Filtra las reservas por su estado actual
            </p>
          </div>

          {/* Rango de fechas */}
          <fieldset className="space-y-3">
            <legend className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="w-4 h-4" aria-hidden="true" />
              {t('reservations.filters.date_range') || 'Rango de Fechas'}
            </legend>
            <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="date-range-label">
              <span id="date-range-label" className="sr-only">Rango de fechas para filtrar reservas</span>
              <div className="space-y-1">
                <Label htmlFor="dateFrom" className="text-xs text-gray-500">
                  {t('reservations.filters.date_from') || 'Desde'}
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  aria-describedby="date-from-help"
                />
                <p id="date-from-help" className="sr-only">
                  Fecha de inicio del rango para filtrar reservas
                </p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="dateTo" className="text-xs text-gray-500">
                  {t('reservations.filters.date_to') || 'Hasta'}
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  aria-describedby="date-to-help"
                />
                <p id="date-to-help" className="sr-only">
                  Fecha de fin del rango para filtrar reservas
                </p>
              </div>
            </div>
          </fieldset>

          {/* Producto/Servicio */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4" aria-hidden="true" />
              {t('reservations.filters.product_label') || 'Producto/Servicio'}
            </Label>
            <Select 
              value={filters.productId} 
              onValueChange={(value) => handleFilterChange('productId', value)}
              aria-describedby="product-filter-help"
            >
              <SelectTrigger aria-label={t('reservations.a11y.product_filter') || 'Filtrar por producto o servicio'}>
                <SelectValue placeholder={t('reservations.filters.product_placeholder') || 'Todos los productos'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">
                  {t('reservations.filters.all_products') || 'Todos los productos'}
                </SelectItem>
                {MOCK_PRODUCTS.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="product-filter-help" className="text-xs text-gray-500">
              Filtra las reservas por el producto o servicio seleccionado
            </p>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clientName" className="flex items-center gap-2">
              <User className="w-4 h-4" aria-hidden="true" />
              {t('reservations.filters.client_label') || 'Cliente'}
            </Label>
            <Input
              id="clientName"
              type="text"
              placeholder={t('reservations.filters.client_placeholder') || 'Buscar por nombre de cliente...'}
              value={filters.clientName}
              onChange={(e) => handleFilterChange('clientName', e.target.value)}
              aria-describedby="client-filter-help"
            />
            <p id="client-filter-help" className="text-xs text-gray-500">
              Busca reservas por el nombre del cliente
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-4 border-t" role="group" aria-label="Acciones de filtros">
            <Button 
              variant="outline" 
              onClick={handleClearFilters} 
              className="flex-1"
              disabled={activeFiltersCount === 0}
              aria-label={t('reservations.a11y.clear_all_filters') || 'Limpiar todos los filtros'}
            >
              <RotateCcw className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('reservations.filters.clear') || 'Limpiar'}
            </Button>
            <Button 
              onClick={handleApplyFilters} 
              className="flex-1"
              aria-label={t('reservations.a11y.apply_filters') || 'Aplicar filtros seleccionados'}
            >
              <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
              {t('reservations.filters.apply') || 'Aplicar'} 
              {activeFiltersCount > 0 && `(${activeFiltersCount})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default React.memo(ReservationFilters);

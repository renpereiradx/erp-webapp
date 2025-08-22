/**
 * Página independiente de Reservas - Versión Hardened
 * Implementa mejores prácticas de desarrollo establecidas en el proyecto:
 * - Store Zustand con helpers de resiliencia (reliability, circuit, cache, offline)
 * - DataState pattern para estados unificados
 * - Telemetría completa con namespace feature.reservations.*
 * - i18n exhaustivo
 * - Componentes específicos reutilizables
 * - Gestión de errores robusta
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Calendar, Search, Filter, Plus, RefreshCw, Clock, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import PageHeader from '../components/ui/PageHeader';
import DataState from '../components/ui/DataState';
import { useI18n } from '../lib/i18n';
import useReservationStore from '../store/useReservationStore';
import useDebounce from '../hooks/useDebounce';
import useReservationCache from '../hooks/useReservationCache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import CacheMetricsPanel from '../components/debug/CacheMetricsPanel';
import ReservationMetricsPanel from '../components/reservations/ReservationMetricsPanel';

// Componentes específicos de reservas
import ReservationCard from '../components/reservations/ReservationCard';
import ReservationModal from '../components/reservations/ReservationModal';
import ReservationFilters from '../components/reservations/ReservationFilters';
import ReservationStats from '../components/reservations/ReservationStats';

// Componentes de gestión de horarios
import ScheduleManagement from '../components/reservations/ScheduleManagement';
import ScheduleGenerator from '../components/reservations/ScheduleGenerator';

// Componentes Wave 5: Offline Support & Circuit Breaker
import OfflineBanner from '../components/reservations/OfflineBanner';
import CircuitBreakerIndicator from '../components/reservations/CircuitBreakerIndicator';

const Reservations = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  
  // Estado local para UI
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [activeTab, setActiveTab] = useState('list'); // list, create, schedules

  // Wave 5: Network status monitoring
  const networkStatus = useNetworkStatus();

  // Tabs configuration
  const tabs = [
    { 
      id: 'list', 
      label: t('reservations.tabs.list') || 'Reservas', 
      icon: Calendar,
      description: t('reservations.tabs.list_description') || 'Ver y gestionar reservas existentes'
    },
    { 
      id: 'create', 
      label: t('reservations.tabs.create') || 'Nueva Reserva', 
      icon: Plus,
      description: t('reservations.tabs.create_description') || 'Crear una nueva reserva'
    },
    { 
      id: 'schedules', 
      label: t('reservations.tabs.schedules') || 'Gestión Horarios', 
      icon: Clock,
      description: t('reservations.tabs.schedules_description') || 'Administrar horarios disponibles',
      adminOnly: true
    }
  ];

  // Debounce para búsqueda optimizada
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Cache avanzado para reservaciones
  const reservationCache = useReservationCache({
    pageCacheTTL: 60000, // 1 minuto
    enablePrefetch: true
  });

  // Store de reservas con patrón hardened
  const {
    // Estado
    reservations,
    loading,
    error,
    lastErrorCode,
    lastErrorHintKey,
    pagination,
    stats,
    isOffline,
    circuitOpen,
    hasStaleData,
    staleDataCount,
    
    // Cache y métricas
    selectors,
    
    // Acciones principales
    fetchReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    confirmReservation,
    
    // Wave 5: Offline & Circuit Breaker
    checkStaleData,
    forceRevalidateOffline,
    
    // Acciones de UI
    setFilters,
    clearError,
    hydrateFromStorage,
    setIsOffline
  } = useReservationStore();

  // Selectores para métricas
  const cacheStats = selectors.selectCacheStats(useReservationStore.getState());
  const circuitStats = selectors.selectCircuitStats(useReservationStore.getState());

  // Parámetros de búsqueda combinados con cache
  const searchParams = useMemo(() => ({
    search: debouncedSearchTerm,
    ...activeFilters,
    page: pagination?.current_page || 1
  }), [debouncedSearchTerm, activeFilters, pagination?.current_page]);

  // Función optimizada para cargar reservas con cache
  const loadReservationsWithCache = useCallback(async (params = {}, forceRefresh = false) => {
    const cacheKey = { ...searchParams, ...params };
    
    // Verificar cache primero si no es refresh forzado
    if (!forceRefresh) {
      const cachedData = reservationCache.getCachedPage(cacheKey, cacheKey.page);
      if (cachedData) {
        console.log('[telemetry] reservations.cache.hit', cacheKey);
        
        // Verificar si necesita revalidación en background
        if (reservationCache.needsRevalidation(cacheKey, cacheKey.page)) {
          reservationCache.backgroundRevalidate(cacheKey, cacheKey.page, fetchReservations);
        }
        
        return cachedData;
      }
    }

    console.log('[telemetry] reservations.cache.miss', { ...cacheKey, forceRefresh });
    
    // Cargar desde API/mock
    const data = await fetchReservations(cacheKey);
    
    // Guardar en cache
    if (data) {
      reservationCache.setCachedPage(data, cacheKey, cacheKey.page);
      
      // Prefetch página siguiente si existe
      if (data.pagination?.hasNext) {
        reservationCache.prefetchNextPage(cacheKey, cacheKey.page, fetchReservations);
      }
    }
    
    return data;
  }, [searchParams, reservationCache, fetchReservations]);

  // Cargar reservas inicial con cache
  useEffect(() => {
    const loadInitialReservations = async () => {
      try {
        await loadReservationsWithCache({ page: 1, limit: 20 });
      } catch (error) {
        console.error('Error loading initial reservations:', error);
        // Si estamos offline, intentar hidratar desde storage
        if (error.code === 'NETWORK_ERROR') {
          const offlineData = hydrateFromStorage();
          if (offlineData) {
            console.log('Hydrated reservations from offline storage');
          }
        }
      }
    };

    loadInitialReservations();
  }, [loadReservationsWithCache, hydrateFromStorage]);

  // Efecto para búsqueda debounced con cache
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return; // Evitar doble ejecución
    
    loadReservationsWithCache({ 
      page: 1, 
      search: debouncedSearchTerm,
      ...activeFilters 
    });
  }, [debouncedSearchTerm, activeFilters, loadReservationsWithCache]);

  // Listener para cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Auto-refetch si está configurado
      const { autoRefetchOnReconnect } = useReservationStore.getState();
      if (autoRefetchOnReconnect) {
        loadReservationsWithCache(searchParams, true); // Force refresh al reconectar
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setIsOffline, loadReservationsWithCache, searchParams]);

  // Wave 5: Chequeo automático de stale data
  useEffect(() => {
    const checkStaleDataInterval = setInterval(() => {
      checkStaleData();
    }, 30000); // Chequear cada 30 segundos

    // Chequeo inicial
    checkStaleData();

    return () => clearInterval(checkStaleDataInterval);
  }, [checkStaleData]);

  // Handlers optimizados con useCallback y cache invalidation
  const handlePageChange = useCallback(async (newPage) => {
    await loadReservationsWithCache({ 
      page: newPage, 
      search: debouncedSearchTerm || undefined,
      ...activeFilters
    });
  }, [loadReservationsWithCache, debouncedSearchTerm, activeFilters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setActiveFilters(newFilters);
    setShowFilters(false); // Cerrar panel de filtros al aplicar
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveFilters({});
  }, []);

  const handleRefresh = useCallback(async () => {
    await loadReservationsWithCache(searchParams, true); // Force refresh
  }, [loadReservationsWithCache, searchParams]);

  // Handlers de reservas optimizados con invalidación de cache
  const handleCreateReservation = useCallback(async (reservationData) => {
    try {
      const result = await createReservation(reservationData);
      setShowCreateModal(false);
      
      // Invalidar cache después de crear
      reservationCache.invalidateAfterMutation('create', reservationData);
      
      // Refrescar lista desde cache o API
      await loadReservationsWithCache({ 
        page: 1, 
        search: debouncedSearchTerm || undefined,
        ...activeFilters 
      }, true);
      
      return result;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error; // Re-throw para manejo en modal
    }
  }, [createReservation, reservationCache, loadReservationsWithCache, debouncedSearchTerm, activeFilters]);

  const handleUpdateReservation = useCallback(async (id, updates) => {
    try {
      const result = await updateReservation(id, updates);
      setSelectedReservation(null);
      
      // Invalidar cache después de actualizar
      reservationCache.invalidateAfterMutation('update', { id, ...updates });
      
      // Refrescar datos
      await loadReservationsWithCache(searchParams, true);
      
      return result;
    } catch (error) {
      console.error('Error updating reservation:', error);
      throw error;
    }
  }, [updateReservation, reservationCache, loadReservationsWithCache, searchParams]);

  const handleCancelReservation = useCallback(async (id, reason = '') => {
    try {
      const result = await cancelReservation(id, reason);
      
      // Invalidar cache después de cancelar
      reservationCache.invalidateAfterMutation('delete', { id, reason });
      
      // Refrescar datos
      await loadReservationsWithCache(searchParams, true);
      
      return result;
    } catch (error) {
      console.error('Error canceling reservation:', error);
      throw error;
    }
  }, [cancelReservation, reservationCache, loadReservationsWithCache, searchParams]);

  const handleConfirmReservation = useCallback(async (id) => {
    try {
      const result = await confirmReservation(id);
      
      // Invalidar cache después de confirmar
      reservationCache.invalidateAfterMutation('update', { id, status: 'confirmed' });
      
      // Refrescar datos
      await loadReservationsWithCache(searchParams, true);
      
      return result;
    } catch (error) {
      console.error('Error confirming reservation:', error);
      throw error;
    }
  }, [confirmReservation, reservationCache, loadReservationsWithCache, searchParams]);

  const handleRescheduleReservation = useCallback(async (id, newSchedule) => {
    try {
      const result = await rescheduleReservation(id, newSchedule);
      
      // Invalidar cache para reschedule (puede afectar múltiples productos)
      reservationCache.invalidateAfterMutation('reschedule', {
        id,
        oldProductId: selectedReservation?.product_id,
        newProductId: newSchedule.product_id
      });
      
      // Refrescar datos
      await loadReservationsWithCache(searchParams, true);
      setSelectedReservation(null);
      
      return result;
    } catch (error) {
      console.error('Error rescheduling reservation:', error);
      throw error;
    }
  }, [rescheduleReservation, reservationCache, loadReservationsWithCache, searchParams, selectedReservation]);

  // Retry manual para errores de red
  const handleRetry = useCallback(() => {
    clearError();
    loadReservationsWithCache(searchParams, true); // Force refresh on retry
  }, [clearError, loadReservationsWithCache, searchParams]);

  // Renderizar estados especiales
  if (loading && reservations.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('reservations.page.title') || 'Reservas'}
          subtitle={t('reservations.page.subtitle') || 'Gestión completa de reservas de servicios'}
          breadcrumb={[
            { label: t('nav.operations') || 'Operaciones', href: '/dashboard' }, 
            { label: t('reservations.page.title') || 'Reservas' }
          ]}
        />
        <DataState 
          variant="loading" 
          skeletonVariant="list" 
          skeletonProps={{ count: 6 }} 
          testId="reservations-loading"
        />
      </div>
    );
  }

  if (error && reservations.length === 0) {
    const errorHint = lastErrorHintKey ? t(lastErrorHintKey) : null;
    
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('reservations.page.title') || 'Reservas'}
          subtitle={t('reservations.page.subtitle') || 'Gestión completa de reservas de servicios'}
          breadcrumb={[
            { label: t('nav.operations') || 'Operaciones', href: '/dashboard' }, 
            { label: t('reservations.page.title') || 'Reservas' }
          ]}
        />
        <DataState 
          variant="error"
          title={t('reservations.error.load_failed') || 'Error al cargar reservas'}
          description={errorHint || error}
          actionLabel={t('reservations.button.retry') || 'Reintentar'}
          onAction={handleRetry}
          testId="reservations-error"
        />
      </div>
    );
  }

  if (!loading && reservations.length === 0 && !searchTerm) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('reservations.page.title') || 'Reservas'}
          subtitle={t('reservations.page.subtitle') || 'Gestión completa de reservas de servicios'}
          breadcrumb={[
            { label: t('nav.operations') || 'Operaciones', href: '/dashboard' }, 
            { label: t('reservations.page.title') || 'Reservas' }
          ]}
        />
        <DataState 
          variant="empty"
          title={t('reservations.empty.title') || 'No hay reservas'}
          description={t('reservations.empty.description') || 'Crea tu primera reserva para comenzar'}
          actionLabel={t('reservations.button.create_first') || 'Crear Primera Reserva'}
          onAction={() => setShowCreateModal(true)}
          testId="reservations-empty"
        />
      </div>
    );
  }

  if (!loading && reservations.length === 0 && searchTerm) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('reservations.page.title') || 'Reservas'}
          subtitle={t('reservations.page.subtitle') || 'Gestión completa de reservas de servicios'}
          breadcrumb={[
            { label: t('nav.operations') || 'Operaciones', href: '/dashboard' }, 
            { label: t('reservations.page.title') || 'Reservas' }
          ]}
        />
        
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder={t('reservations.search.placeholder') || 'Buscar reservas...'}
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {t('reservations.button.filters') || 'Filtros'}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('reservations.button.create') || 'Nueva Reserva'}
          </Button>
        </div>

        <DataState 
          variant="empty"
          title={t('reservations.search.no_results.title') || 'Sin resultados'}
          description={t('reservations.search.no_results.description', { term: searchTerm }) || `No se encontraron reservas para "${searchTerm}"`}
          actionLabel={t('reservations.button.clear_search') || 'Limpiar búsqueda'}
          onAction={() => setSearchTerm('')}
          testId="reservations-search-empty"
        />
      </div>
    );
  }

  // Renderizado principal con datos
  return (
    <div className="space-y-6" data-testid="reservations-page">
      <PageHeader
        title={t('reservations.page.title') || 'Reservas'}
        subtitle={t('reservations.page.subtitle') || 'Gestión completa de reservas de servicios'}
        breadcrumb={[
          { label: t('nav.operations') || 'Operaciones', href: '/dashboard' }, 
          { label: t('reservations.page.title') || 'Reservas' }
        ]}
      />

      {/* Métricas de reservas (desarrollo) - Wave 7 */}
      {import.meta.env.DEV && (
        <ReservationMetricsPanel />
      )}

      {/* Wave 5: Offline Banner - Mostrar cuando esté offline */}
      <OfflineBanner />
      
      {/* Wave 5: Circuit Breaker Indicator - Mostrar cuando haya problemas */}
      <CircuitBreakerIndicator />

      {/* Banner offline */}
      {isOffline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <RefreshCw className="w-4 h-4" />
                <span className="font-medium">
                  {t('reservations.offline.banner') || 'Sin conexión - mostrando datos guardados'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-orange-800 border-orange-200"
              >
                {t('reservations.button.retry') || 'Reintentar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Banner de circuit breaker */}
      {circuitOpen && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <RefreshCw className="w-4 h-4" />
              <span className="font-medium">
                {t('reservations.circuit.open') || 'Servicio temporalmente no disponible'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sistema de tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="flex items-center gap-2"
                disabled={tab.adminOnly && !import.meta.env.DEV} // Solo admins en producción
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab: Lista de Reservas */}
        <TabsContent value="list" className="space-y-6">
          {/* Estadísticas */}
          <ReservationStats stats={stats} />

          {/* Barra de búsqueda y acciones */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder={t('reservations.search.placeholder') || 'Buscar reservas...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t('reservations.button.filters') || 'Filtros'}
            </Button>
            <Button
              onClick={() => setActiveTab('create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('reservations.button.create') || 'Nueva Reserva'}
            </Button>
          </div>

          {/* Panel de filtros */}
          {showFilters && (
            <ReservationFilters 
              onFiltersChange={handleFiltersChange}
              onClose={() => setShowFilters(false)}
            />
          )}

          {/* Lista de reservas */}
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                onEdit={(reservation) => setSelectedReservation(reservation)}
                onCancel={handleCancelReservation}
                onConfirm={handleConfirmReservation}
                onView={(reservation) => setSelectedReservation(reservation)}
              />
            ))}
          </div>

          {/* Paginación */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                disabled={pagination.current_page <= 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                {t('common.pagination.previous') || 'Anterior'}
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-600">
                {t('common.pagination.info', {
                  current: pagination.current_page,
                  total: pagination.total_pages
                }) || `Página ${pagination.current_page} de ${pagination.total_pages}`}
              </span>
              
              <Button
                variant="outline"
                disabled={pagination.current_page >= pagination.total_pages}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                {t('common.pagination.next') || 'Siguiente'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Tab: Crear Reserva */}
        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {t('reservations.create.title') || 'Crear Nueva Reserva'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationModal
                reservation={null}
                onSave={async (reservationData) => {
                  const result = await handleCreateReservation(reservationData);
                  setActiveTab('list'); // Volver a la lista después de crear
                  return result;
                }}
                onClose={() => setActiveTab('list')}
                inline={true} // Renderizar dentro del tab sin modal
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gestión de Horarios */}
        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('reservations.schedule.admin_title') || 'Administración de Horarios'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generador de horarios */}
              <ScheduleGenerator />
              
              {/* Separador */}
              <div className="border-t border-gray-200"></div>
              
              {/* Gestión de horarios existentes */}
              <ScheduleManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de editar reserva (solo cuando se edita desde la lista) */}
      {selectedReservation && (
        <ReservationModal
          reservation={selectedReservation}
          onSave={handleUpdateReservation}
          onClose={() => setSelectedReservation(null)}
        />
      )}

      {/* Indicador de carga en background */}
      {loading && reservations.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-3 border">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {t('reservations.loading.background') || 'Actualizando...'}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;

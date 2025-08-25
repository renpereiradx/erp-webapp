import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import { useI18n } from '@/i18n/hooks';
import { useTheme } from '@/themes/hooks';
import { useThemeStyles } from '@/themes/themeUtils';
import { useToast } from '@/hooks/useToast';
import { useClientStore } from '@/store/clientStore';
import { Toast } from '@/components/Toast';
import { ClientCard } from '@/components/ClientCard';
import { telemetry } from '@/lib/telemetry';

// Wave 3A: Hooks optimizados
import { useClientSearch } from '@/hooks/useDebounce';
import { useClientCache } from '@/hooks/useClientCache';
import { useClientModals } from '@/hooks/useLazyComponents';

// Wave 3B: Advanced prefetch & cache warming
import { usePrefetchManager } from '@/hooks/usePrefetchManager';

// Iconos
import { 
  PlusIcon, 
  SearchIcon, 
  XIcon, 
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

/**
 * Página de Clientes optimizada con Wave 3A: React Performance
 * 
 * Optimizaciones implementadas:
 * - React.memo en componentes hijo (ClientCard)
 * - useMemo para valores calculados costosos
 * - useCallback para handlers estables
 * - Debounced search (300ms) para reducir API calls
 * - Lazy loading de modales con preload en hover
 * - Cache avanzado con TTL y LRU
 * - Suspense para code splitting
 */
const ClientsPage = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const store = useClientStore();
  const { t } = useI18n();

  // Estados locales optimizados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  
  // Modales lazy loading
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Wave 3A: Hooks optimizados
  const {
    debouncedSearchTerm,
    isSearching,
    shouldSearch
  } = useClientSearch(searchTerm, {
    delay: 300,
    minLength: 2,
    enableTelemetry: true,
    onSearchStart: useCallback((term) => {
      telemetry.record('feature.clients.search.start', { term });
    }, []),
    onSearchComplete: useCallback((term, duration) => {
      telemetry.record('feature.clients.search.complete', { term, duration });
    }, [])
  });

  const clientCache = useClientCache({
    ttl: 5 * 60 * 1000, // 5 minutos
    maxEntries: 30,
    enableTelemetry: true,
    enableBackgroundRevalidation: true,
    fetcher: async (key) => {
      // Fetcher para background revalidation
      const [, page, searchTerm, pageSize] = key.match(/page_(\d+)_(.*)_(\d+)/) || [];
      if (page) {
        return await store.searchClients(searchTerm, parseInt(page), parseInt(pageSize));
      }
      return null;
    }
  });

  const {
    getLazyComponent,
    onPreloadHover,
    onCancelPreload,
    loadingStates,
    stats: lazyStats
  } = useClientModals();

  // Wave 3B: Advanced Prefetch Manager
  const {
    prefetchNextPage,
    warmCache,
    invalidateAfterMutation,
    setupScrollPrefetch,
    isPrefetching,
    getQueueStats
  } = usePrefetchManager({
    fetcher: async ({ page, pageSize, searchTerm }) => {
      return await store.searchClients(searchTerm, page, pageSize);
    },
    cache: clientCache,
    enablePrefetch: true,
    enableCacheWarming: true,
    prefetchThreshold: 0.8
  });

  // Memoizar valores calculados costosos
  const computedValues = useMemo(() => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    const isMaterial = theme?.includes('material');
    
    return {
      isNeoBrutalism,
      isMaterial
    };
  }, [theme]);

  // Filtros memoizados para evitar re-calcular en cada render
  const filteredClients = useMemo(() => {
    if (!store.clients?.length) return [];
    
    return store.clients.filter(client => {
      const search = searchTerm.toLowerCase();
      const fullName = `${client.name || ''} ${client.last_name || ''}`.toLowerCase();
      const matchesSearch = !search || 
        fullName.includes(search) || 
        (client.document_id || '').toLowerCase().includes(search) ||
        (client.email || '').toLowerCase().includes(search);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && client.status === true) || 
        (statusFilter === 'inactive' && client.status === false);
      
      return matchesSearch && matchesStatus;
    });
  }, [store.clients, searchTerm, statusFilter]);

  // Estadísticas memoizadas
  const stats = useMemo(() => {
    const total = store.totalClients;
    const active = filteredClients.filter(c => c.status === true).length;
    const inactive = filteredClients.filter(c => c.status === false).length;
    
    return { total, active, inactive, filtered: filteredClients.length };
  }, [store.totalClients, filteredClients]);

  // Handlers estables con useCallback
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    telemetry.record('feature.clients.search.input', { term });
  }, []);

  const handleSearchSubmit = useCallback(async () => {
    if (shouldSearch) {
      try {
        await store.searchClients(debouncedSearchTerm, 1, store.pageSize);
        telemetry.record('feature.clients.search.submit', { 
          term: debouncedSearchTerm,
          results: store.clients?.length || 0
        });
      } catch (error) {
        showError('Error al buscar clientes');
        telemetry.record('feature.clients.search.error', { 
          term: debouncedSearchTerm,
          error: error.message 
        });
      }
    }
  }, [shouldSearch, debouncedSearchTerm, store, showError]);

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status);
    telemetry.record('feature.clients.filter.status', { status });
  }, []);

  const handlePageSizeChange = useCallback(async (newSize) => {
    try {
      await store.changePageSize(parseInt(newSize));
      telemetry.record('feature.clients.page_size.change', { size: newSize });
    } catch (error) {
      showError('Error al cambiar tamaño de página');
    }
  }, [store, showError]);

  const handleLoadPage = useCallback(async (page) => {
    try {
      await store.loadPage(page, store.pageSize, debouncedSearchTerm);
      telemetry.record('feature.clients.page.load', { page, searchTerm: debouncedSearchTerm });
    } catch (error) {
      showError('Error al cargar página');
    }
  }, [store, debouncedSearchTerm, showError]);

  // Handlers de modales optimizados
  const handleCreateClient = useCallback(() => {
    setEditingClient(null);
    setShowClientModal(true);
    telemetry.record('feature.clients.modal.create.open');
  }, []);

  const handleEditClient = useCallback((client) => {
    setEditingClient(client);
    setShowClientModal(true);
    telemetry.record('feature.clients.modal.edit.open', { clientId: client.id });
  }, []);

  const handleViewClient = useCallback((client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
    telemetry.record('feature.clients.modal.detail.open', { clientId: client.id });
  }, []);

  const handleDeleteClient = useCallback((client) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
    telemetry.record('feature.clients.modal.delete.open', { clientId: client.id });
  }, []);

  // Effect para búsqueda debounced
  useEffect(() => {
    if (shouldSearch && debouncedSearchTerm !== store.lastSearchTerm) {
      handleSearchSubmit();
    }
  }, [debouncedSearchTerm, shouldSearch, handleSearchSubmit, store.lastSearchTerm]);

  // Wave 3B: Invalidación inteligente en handlers de mutación
  const handleCreateClientSuccess = useCallback((newClient) => {
    invalidateAfterMutation('create', { clientId: newClient?.id });
    success('Cliente creado exitosamente');
    telemetry.record('feature.clients.create.success', { clientId: newClient?.id });
  }, [invalidateAfterMutation, success]);

  const handleEditClientSuccess = useCallback((updatedClient) => {
    invalidateAfterMutation('update', { clientId: updatedClient?.id });
    success('Cliente actualizado exitosamente');
    telemetry.record('feature.clients.update.success', { clientId: updatedClient?.id });
  }, [invalidateAfterMutation, success]);

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedClient) return;
    
    try {
      await store.deleteClient(selectedClient.id);
      setShowDeleteModal(false);
      
      // Wave 3B: Invalidación post-delete
      invalidateAfterMutation('delete', { clientId: selectedClient.id });
      
      setSelectedClient(null);
      success('Cliente eliminado exitosamente');
      telemetry.record('feature.clients.delete.success', { clientId: selectedClient.id });
    } catch (error) {
      showError('Error al eliminar cliente');
      telemetry.record('feature.clients.delete.error', { 
        clientId: selectedClient.id,
        error: error.message 
      });
    }
  }, [selectedClient, store, invalidateAfterMutation, success, showError]);

  const handleSearchSubmit = useCallback(async () => {
    if (shouldSearch) {
      try {
        // Wave 3B: Invalidar cache de búsqueda anterior si cambió
        if (debouncedSearchTerm !== store.lastSearchTerm) {
          invalidateAfterMutation('search', { searchTerm: store.lastSearchTerm });
        }

        await store.searchClients(debouncedSearchTerm, 1, store.pageSize);
        telemetry.record('feature.clients.search.submit', { 
          term: debouncedSearchTerm,
          results: store.clients?.length || 0
        });
      } catch (error) {
        showError('Error al buscar clientes');
        telemetry.record('feature.clients.search.error', { 
          term: debouncedSearchTerm,
          error: error.message 
        });
      }
    }
  }, [shouldSearch, debouncedSearchTerm, store, showError, invalidateAfterMutation]);

  const handleModalClose = useCallback((modalType) => {
    switch (modalType) {
      case 'client':
        setShowClientModal(false);
        setEditingClient(null);
        break;
      case 'detail':
        setShowDetailModal(false);
        setSelectedClient(null);
        break;
      case 'delete':
        setShowDeleteModal(false);
        setSelectedClient(null);
        break;
    }
  }, []);

  // Wave 3A: Precargar modales en hover para mejor UX
  const handleClientHover = useCallback((client) => {
    onPreloadHover('ClientDetailModal');
    clientCache.prefetch(client.id);
  }, [onPreloadHover, clientCache]);

  const handleClientLeave = useCallback(() => {
    onCancelPreload('ClientDetailModal');
  }, [onCancelPreload]);

  // Componentes lazy memoizados para evitar re-creación
  const LazyClientModal = useMemo(() => getLazyComponent('ClientModal'), [getLazyComponent]);
  const LazyClientDetailModal = useMemo(() => getLazyComponent('ClientDetailModal'), [getLazyComponent]);
  const LazyDeleteClientModal = useMemo(() => getLazyComponent('DeleteClientModal'), [getLazyComponent]);

  // Effect para scroll prefetch automático
  const scrollContainerRef = useRef(null);
  useEffect(() => {
    if (scrollContainerRef.current && store.totalPages > store.currentPage) {
      const cleanup = setupScrollPrefetch(scrollContainerRef.current, {
        currentPage: store.currentPage,
        totalPages: store.totalPages,
        searchTerm: debouncedSearchTerm,
        pageSize: store.pageSize
      });

      return cleanup;
    }
  }, [setupScrollPrefetch, store.currentPage, store.totalPages, debouncedSearchTerm, store.pageSize]);

  // Effect para prefetch siguiente página cuando se carga una nueva
  useEffect(() => {
    if (store.currentPage && store.totalPages > store.currentPage) {
      // Prefetch con delay para no interferir con carga actual
      const timer = setTimeout(() => {
        prefetchNextPage(store.currentPage, store.totalPages, debouncedSearchTerm, store.pageSize);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [prefetchNextPage, store.currentPage, store.totalPages, debouncedSearchTerm, store.pageSize]);

  // Effect para cargar datos iniciales
  useEffect(() => {
    if (!store.clients?.length && !store.loading) {
      store.searchClients('', 1, store.pageSize);
      telemetry.record('feature.clients.page.initial_load');
    }
  }, [store]);

  // Effect para manejo de errores del store
  useEffect(() => {
    if (store.error) {
      showError(store.error);
      telemetry.record('feature.clients.error.store', { message: store.error });
      
      // Auto-clear error después de mostrar toast
      setTimeout(() => {
        store.clearError();
      }, 100);
    }
  }, [store.error, showError, store]);

  const { isNeoBrutalism, isMaterial } = computedValues;

  return (
    <div className="relative w-full h-full overflow-auto" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <Suspense fallback={<div>Cargando...</div>}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex-shrink-0 border-b" style={{ ...themeHeader, borderColor: 'var(--border)' }}>
            <div className="flex flex-col space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  {t('clients.title', 'Clientes')}
                </h1>
                <div className="flex items-center gap-2">
                  {/* Indicador de búsqueda activa */}
                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Buscando...
                    </div>
                  )}
                  
                  {/* Wave 3B: Estadísticas avanzadas de cache y prefetch */}
                  {clientCache.stats.hitRatio > 0 && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <div>Cache: {(clientCache.stats.hitRatio * 100).toFixed(1)}%</div>
                      <div>({clientCache.stats.hits}H/{clientCache.stats.misses}M)</div>
                      {clientCache.stats.prefetches > 0 && (
                        <div>Prefetch: {clientCache.stats.prefetches}</div>
                      )}
                      {getQueueStats().prefetchQueue > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full" />
                          Prefetching...
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    className={`${themeButton} ${themeButton?.variants?.default || ''}`}
                    onClick={handleCreateClient}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    {t('clients.create', 'Nuevo Cliente')}
                  </button>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-sm text-muted-foreground">Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                  <div className="text-sm text-muted-foreground">Inactivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.filtered}</div>
                  <div className="text-sm text-muted-foreground">Filtrados</div>
                </div>
              </div>

              {/* Controles de búsqueda y filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder={t('clients.search.placeholder', 'Buscar por nombre, documento o email...')}
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className={`${themeInput} pl-10`}
                      style={{
                        ...themeInput,
                        backgroundColor: 'var(--input)',
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)'
                      }}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => handleSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {isSearching && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Búsqueda en tiempo real activa (debounce: 300ms)
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {/* Filtro de estado */}
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className={themeInput}
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>

                  {/* Control de tamaño de página */}
                  <select
                    value={store.pageSize}
                    onChange={(e) => handlePageSizeChange(e.target.value)}
                    className={themeInput}
                    style={{
                      backgroundColor: 'var(--input)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)'
                    }}
                  >
                    <option value="10">10 por página</option>
                    <option value="25">25 por página</option>
                    <option value="50">50 por página</option>
                    <option value="100">100 por página</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal con scroll prefetch */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-auto p-6"
          >
            {store.loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda' 
                    : 'Comienza agregando tu primer cliente'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateClient}
                    className={`${themeButton} ${themeButton?.variants?.default || ''}`}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Crear primer cliente
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onMouseEnter={() => handleClientHover(client)}
                    onMouseLeave={handleClientLeave}
                  >
                    <ClientCard
                      client={client}
                      onEdit={handleEditClient}
                      onDelete={handleDeleteClient}
                      onView={handleViewClient}
                      theme={theme}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Paginación */}
            {store.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Página {store.currentPage} de {store.totalPages} ({stats.total} clientes total)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLoadPage(store.currentPage - 1)}
                    disabled={store.currentPage <= 1}
                    className={`${themeButton} ${themeButton?.variants?.outline || ''}`}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Anterior
                  </button>
                  <button
                    onClick={() => handleLoadPage(store.currentPage + 1)}
                    disabled={store.currentPage >= store.totalPages}
                    className={`${themeButton} ${themeButton?.variants?.outline || ''}`}
                  >
                    Siguiente
                    <ChevronRightIcon className="h-4 w-4 ml-2" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wave 3B: Modales lazy loading con Suspense e invalidación inteligente */}
        {showClientModal && (
          <Suspense fallback={<div>Cargando modal...</div>}>
            <LazyClientModal
              isOpen={showClientModal}
              onClose={() => handleModalClose('client')}
              client={editingClient}
              onSuccess={editingClient ? handleEditClientSuccess : handleCreateClientSuccess}
            />
          </Suspense>
        )}

        {showDetailModal && selectedClient && (
          <Suspense fallback={<div>Cargando detalles...</div>}>
            <LazyClientDetailModal
              isOpen={showDetailModal}
              onClose={() => handleModalClose('detail')}
              client={selectedClient}
            />
          </Suspense>
        )}

        {showDeleteModal && selectedClient && (
          <Suspense fallback={<div>Cargando...</div>}>
            <LazyDeleteClientModal
              isOpen={showDeleteModal}
              onClose={() => handleModalClose('delete')}
              onConfirm={handleConfirmDelete}
              clientName={`${selectedClient.name} ${selectedClient.last_name}`}
            />
          </Suspense>
        )}

        {/* Toast notifications */}
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </Suspense>
    </div>
  );
};

export default ClientsPage;

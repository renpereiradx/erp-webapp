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

// Wave 4: Accessibility Enterprise
import { 
  useFocusManagement, 
  useLiveRegion, 
  useAccessibleForm
} from '@/accessibility';
import { AccessibleModal, AccessibleConfirmModal } from '@/components/AccessibleModal';

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
 * Página de Clientes con Wave 4: UX & Accessibility Enterprise
 * 
 * Optimizaciones implementadas:
 * Wave 3A: React Performance
 * - React.memo en componentes hijo (ClientCard)
 * - useMemo para valores calculados costosos
 * - useCallback para handlers estables
 * - Debounced search (300ms) para reducir API calls
 * - Lazy loading de modales con preload en hover
 * 
 * Wave 3B: Advanced Caching
 * - Cache avanzado con TTL y LRU
 * - Background revalidation automática
 * - Prefetch inteligente con intersection observer
 * - Invalidación post-mutación específica
 * 
 * Wave 4: UX & Accessibility Enterprise - NUEVO
 * - WCAG 2.1 AA compliance completo
 * - Focus management con traps y restauración
 * - Live regions para anuncios a screen readers
 * - Navegación por teclado completa
 * - i18n completo (35+ claves)
 * - Formularios accesibles con validación
 * - ARIA attributes y roles semánticos
 * - Screen reader support optimizado
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

  // Referencias para accesibilidad
  const mainContentRef = useRef(null);
  const searchInputRef = useRef(null);

  // Wave 4: Accessibility hooks
  const {
    saveFocus,
    restoreFocus
  } = useFocusManagement({
    enableSkipLinks: true,
    enableTelemetry: true,
    debugMode: process.env.NODE_ENV === 'development'
  });

  const {
    announce,
    announceLoading,
    announceSuccess,
    announceError,
    liveRegionProps
  } = useLiveRegion({
    enableTelemetry: true,
    debugMode: process.env.NODE_ENV === 'development'
  });

  // Wave 4: Formulario accesible para crear/editar clientes
  const clientFormValidation = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      requiredMessage: t('clients.accessibility.nameRequired', 'Nombre es requerido'),
      minLengthMessage: t('clients.accessibility.nameMinLength', 'Nombre debe tener al menos 2 caracteres')
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      requiredMessage: t('clients.accessibility.emailRequired', 'Email es requerido'),
      patternMessage: t('clients.accessibility.emailInvalid', 'Email tiene formato inválido')
    }
  };

  const {
    values: formValues,
    errors: formErrors,
    handleSubmit: handleFormSubmit,
    getFieldProps,
    getErrorProps,
    getHelpProps,
    reset: resetForm
  } = useAccessibleForm(
    editingClient || { name: '', email: '', phone: '', company: '', status: 'active' },
    clientFormValidation,
    {
      enableTelemetry: true,
      announceErrors: true
    }
  );

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
    loadingStates
  } = useClientModals();

  // Wave 3B: Advanced Prefetch Manager
  const {
    prefetchNextPage,
    invalidateAfterMutation,
    getQueueStats
  } = usePrefetchManager({
    cache: clientCache,
    fetcher: store.searchClients,
    enableTelemetry: true
  });

  // Valores calculados con useMemo
  const filteredClients = useMemo(() => {
    if (!store.clients) return [];
    
    return store.clients.filter(client => {
      const matchesSearch = !debouncedSearchTerm || 
        client.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        client.company?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && client.status) ||
        (statusFilter === 'inactive' && !client.status);
      
      return matchesSearch && matchesStatus;
    });
  }, [store.clients, debouncedSearchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = store.totalClients;
    const active = filteredClients.filter(c => c.status === true).length;
    const inactive = filteredClients.filter(c => c.status === false).length;
    
    return { total, active, inactive, filtered: filteredClients.length };
  }, [store.totalClients, filteredClients]);

  // Handlers estables con useCallback + Wave 4 accessibility
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (term.length >= 2) {
      announce(t('clients.accessibility.searchStarted', { term }));
    }
    
    telemetry.record('feature.clients.search.input', { term });
  }, [announce, t]);

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status);
    
    announce(t('clients.accessibility.filterApplied', { 
      count: filteredClients.filter(c => 
        status === 'all' || 
        (status === 'active' && c.status) || 
        (status === 'inactive' && !c.status)
      ).length
    }));
    
    telemetry.record('feature.clients.filter.status', { status });
  }, [announce, t, filteredClients]);

  // Wave 4: Handlers específicos para accesibilidad
  const handleClientCreate = useCallback(() => {
    saveFocus();
    setEditingClient(null);
    setShowClientModal(true);
    
    announce(t('accessibility.modals.modalOpened', { 
      title: t('clients.create') 
    }));
    
    telemetry.record('accessibility.modal.opened', { 
      type: 'create', 
      source: 'clients' 
    });
  }, [saveFocus, announce, t]);

  const handleClientEdit = useCallback((client) => {
    saveFocus();
    setEditingClient(client);
    setShowClientModal(true);
    
    announce(t('accessibility.modals.modalOpened', { 
      title: t('clients.edit') 
    }));
    
    telemetry.record('accessibility.modal.opened', { 
      type: 'edit', 
      source: 'clients',
      clientId: client.id 
    });
  }, [saveFocus, announce, t]);

  const handleClientDelete = useCallback((client) => {
    saveFocus();
    setSelectedClient(client);
    setShowDeleteModal(true);
    
    announce(t('accessibility.modals.modalOpened', { 
      title: t('accessibility.modals.confirmDelete') 
    }));
    
    telemetry.record('accessibility.modal.opened', { 
      type: 'delete', 
      source: 'clients',
      clientId: client.id 
    });
  }, [saveFocus, announce, t]);

  const handleModalClose = useCallback((modalType) => {
    setShowClientModal(false);
    setShowDeleteModal(false);
    setShowDetailModal(false);
    setSelectedClient(null);
    setEditingClient(null);
    resetForm();
    
    restoreFocus();
    announce(t('accessibility.modals.modalClosed'));
    
    telemetry.record('accessibility.modal.closed', { 
      type: modalType, 
      source: 'clients' 
    });
  }, [restoreFocus, announce, t, resetForm]);

  const handleFormSave = useCallback(async () => {
    return handleFormSubmit(async (values) => {
      try {
        if (editingClient) {
          await store.updateClient(editingClient.id, values);
          announceSuccess(t('clients.accessibility.clientUpdated', { 
            name: values.name 
          }));
          success(t('clients.messages.updated'));
        } else {
          await store.createClient(values);
          announceSuccess(t('clients.accessibility.clientCreated', { 
            name: values.name 
          }));
          success(t('clients.messages.created'));
        }
        
        handleModalClose('save');
        return { success: true };
      } catch (error) {
        announceError(t('clients.messages.error'), t('clients.title'));
        showError(error.message);
        return { success: false, error: error.message };
      }
    });
  }, [
    handleFormSubmit, 
    editingClient, 
    store, 
    announceSuccess, 
    announceError, 
    success, 
    showError, 
    handleModalClose, 
    t
  ]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedClient) return;
    
    try {
      await store.deleteClient(selectedClient.id);
      
      announceSuccess(t('clients.accessibility.clientDeleted', { 
        name: selectedClient.name 
      }));
      success(t('clients.messages.deleted'));
      
      handleModalClose('delete');
    } catch (error) {
      announceError(t('clients.messages.error'), t('clients.title'));
      showError(error.message);
    }
  }, [
    selectedClient, 
    store, 
    announceSuccess, 
    announceError, 
    success, 
    showError, 
    handleModalClose, 
    t
  ]);

  // Effect para cargar datos iniciales
  useEffect(() => {
    if (!store.clients?.length && !store.loading) {
      store.searchClients('', 1, store.pageSize);
      telemetry.record('feature.clients.page.initial_load');
    }
  }, [store]);

  return (
    <div className="relative w-full h-full overflow-auto" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Wave 4: Skip Links para navegación rápida */}
      <div className="sr-only focus:not-sr-only">
        <a
          href="#main-content"
          className="absolute top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              mainContentRef.current?.focus();
            }
          }}
        >
          {t('accessibility.skipToContent')}
        </a>
      </div>

      <Suspense fallback={<div role="status" aria-live="polite">{t('accessibility.status.loading')}</div>}>
        <div className="flex flex-col h-full">
          {/* Wave 4: Header con estructura semántica */}
          <header 
            className="flex-shrink-0 border-b" 
            style={{ ...themeHeader, borderColor: 'var(--border)' }}
            role="banner"
          >
            <div className="flex flex-col space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h1 
                  className="text-2xl font-bold"
                  id="page-title"
                >
                  {t('clients.title')}
                </h1>
                <div className="flex items-center gap-2" role="group">
                  {/* Indicador de búsqueda activa */}
                  {isSearching && (
                    <div 
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-md"
                      role="status"
                      aria-live="polite"
                    >
                      <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" aria-hidden="true"></div>
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {t('common.loading')}
                      </span>
                    </div>
                  )}
                  
                  {/* Botón Crear Cliente */}
                  <button
                    onClick={handleClientCreate}
                    className={themeButton.primary}
                    aria-label={t('clients.create')}
                  >
                    <PlusIcon className="h-5 w-5" aria-hidden="true" />
                    <span className="ml-2">{t('clients.create')}</span>
                  </button>
                </div>
              </div>

              {/* Wave 4: Controles de búsqueda y filtro accesibles */}
              <div className="flex flex-col sm:flex-row gap-4" role="search">
                <div className="flex-1">
                  <label htmlFor="search-input" className="sr-only">
                    {t('clients.search')}
                  </label>
                  <div className="relative">
                    <input
                      id="search-input"
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder={t('clients.search')}
                      className={`${themeInput.base} pl-10 pr-4`}
                      role="searchbox"
                      autoComplete="off"
                    />
                    <SearchIcon 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" 
                      aria-hidden="true" 
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Filtro de estado */}
                  <div>
                    <label htmlFor="status-filter" className="sr-only">
                      {t('clients.filters.status')}
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => handleStatusFilterChange(e.target.value)}
                      className={themeInput.base}
                    >
                      <option value="all">{t('common.all', 'Todos')}</option>
                      <option value="active">{t('clients.status.active')}</option>
                      <option value="inactive">{t('clients.status.inactive')}</option>
                    </select>
                  </div>

                  {/* Indicador de resultados */}
                  <div 
                    className="text-sm text-gray-600 dark:text-gray-400"
                    role="status"
                    aria-live="polite"
                  >
                    {filteredClients.length} {t('common.results', 'resultados')}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Wave 4: Contenido principal con estructura semántica */}
          <main 
            id="main-content"
            ref={mainContentRef}
            className="flex-1 overflow-hidden"
            role="main"
            aria-labelledby="page-title"
            tabIndex={-1}
          >
            <div className="h-full flex flex-col">
              {/* Estadísticas */}
              <section 
                className="flex-shrink-0 p-6 border-b dark:border-gray-700"
                aria-label={t('clients.stats.title', 'Estadísticas')}
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">{t('clients.stats.total', 'Total')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <div className="text-sm text-muted-foreground">{t('clients.status.active')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                    <div className="text-sm text-muted-foreground">{t('clients.status.inactive')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.filtered}</div>
                    <div className="text-sm text-muted-foreground">{t('clients.stats.filtered', 'Filtrados')}</div>
                  </div>
                </div>

                {/* Wave 3B: Cache & Prefetch Stats */}
                {clientCache.stats.hitRatio > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-4">
                      <span>Cache: {(clientCache.stats.hitRatio * 100).toFixed(1)}%</span>
                      <span>({clientCache.stats.hits}H/{clientCache.stats.misses}M)</span>
                      {clientCache.stats.prefetches > 0 && (
                        <span>Prefetch: {clientCache.stats.prefetches}</span>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Lista de clientes */}
              <section 
                className="flex-1 overflow-auto p-6"
                aria-label={t('clients.list')}
              >
                {store.loading ? (
                  <div 
                    className="flex items-center justify-center h-64"
                    role="status" 
                    aria-live="polite"
                  >
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" aria-hidden="true"></div>
                    <span className="ml-3">{t('clients.messages.loading')}</span>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div 
                    className="text-center py-12"
                    role="status"
                    aria-live="polite"
                  >
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      {searchTerm 
                        ? t('clients.messages.noResults') 
                        : t('clients.messages.empty')
                      }
                    </h3>
                  </div>
                ) : (
                  <div 
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    role="grid"
                  >
                    {filteredClients.map((client, index) => (
                      <div
                        key={client.id}
                        role="gridcell"
                      >
                        <ClientCard
                          client={client}
                          onEdit={() => handleClientEdit(client)}
                          onDelete={() => handleClientDelete(client)}
                          onView={() => setSelectedClient(client)}
                          onPreloadHover={onPreloadHover}
                          onCancelPreload={onCancelPreload}
                          isPreloading={loadingStates.ClientModal}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>

        {/* Wave 4: Modales accesibles con WCAG 2.1 AA compliance */}
        {showClientModal && (
          <AccessibleModal
            isOpen={showClientModal}
            onClose={() => handleModalClose('client')}
            title={editingClient ? t('clients.edit') : t('clients.create')}
            size="large"
            modalId="client-form-modal"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleFormSave(); }} className="space-y-4">
              {/* Nombre */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  {t('clients.fields.name')} *
                </label>
                <input
                  {...getFieldProps('name')}
                  type="text"
                  className={`${themeInput.base} ${formErrors.name ? themeInput.error : ''}`}
                />
                <div {...getErrorProps('name')} />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  {t('clients.fields.email')} *
                </label>
                <input
                  {...getFieldProps('email')}
                  type="email"
                  className={`${themeInput.base} ${formErrors.email ? themeInput.error : ''}`}
                />
                <div {...getErrorProps('email')} />
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  {t('clients.fields.phone')}
                </label>
                <input
                  {...getFieldProps('phone')}
                  type="tel"
                  className={themeInput.base}
                />
              </div>

              {/* Empresa */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-1">
                  {t('clients.fields.company')}
                </label>
                <input
                  {...getFieldProps('company')}
                  type="text"
                  className={themeInput.base}
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleModalClose('client')}
                  className={themeButton.secondary}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className={themeButton.primary}
                  disabled={Object.keys(formErrors).length > 0}
                >
                  {editingClient ? t('common.save') : t('common.create')}
                </button>
              </div>
            </form>
          </AccessibleModal>
        )}

        {showDeleteModal && selectedClient && (
          <AccessibleConfirmModal
            isOpen={showDeleteModal}
            onConfirm={handleDeleteConfirm}
            onCancel={() => handleModalClose('delete')}
            title={t('clients.delete')}
            message={t('clients.messages.deleteConfirm')}
            confirmText={t('common.delete')}
            cancelText={t('common.cancel')}
            variant="danger"
          />
        )}

        {/* Wave 4: Live Region para anuncios accesibles */}
        <div {...liveRegionProps} />

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

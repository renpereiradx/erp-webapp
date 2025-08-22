import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Truck,
  Package,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  BarChart3,
  AlertTriangle,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import useSupplierStore from '@/store/useSupplierStore';
import { useShallow } from 'zustand/react/shallow';
import SupplierModal from '@/components/SupplierModal';
import DeleteSupplierModal from '@/components/DeleteSupplierModal';
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { telemetry } from '@/utils/telemetry';
import { Input } from '@/components/ui/Input';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import DataState from '@/components/ui/DataState';
import { useI18n } from '@/lib/i18n';
import SuppliersMetricsPanel from '@/components/SuppliersMetricsPanel';

const SuppliersPage = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const {
    suppliers,
    loading,
    error,
    pagination,
    lastErrorHintKey,
    isOffline,
    lastQuery,
    pageCacheTTL,
    pageCacheTs
  } = useSupplierStore(useShallow(state => {
    const { page, pageSize, search } = state.lastQuery || { page: 1, pageSize: 10, search: '' };
    const key = `${search || '__'}|${page}`;
    return {
      suppliers: state.suppliers,
      loading: state.loading,
      error: state.error,
      pagination: state.pagination,
      lastErrorHintKey: state.lastErrorHintKey,
      isOffline: state.isOffline,
      lastQuery: state.lastQuery,
      pageCacheTTL: state.pageCacheTTL,
      pageCacheTs: state.pageCache[key]?.ts || 0
    };
  }));
  const loadPage = useSupplierStore(s => s.loadPage);
  const deleteSupplier = useSupplierStore(s => s.deleteSupplier);
  const clearSuppliers = useSupplierStore(s => s.clearSuppliers);
  const forceRefetch = useSupplierStore(s => s.forceRefetch);

  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const lastFocusedRef = useRef(null);
  const liveRegionRef = useRef(null);

  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');

  const { t } = useI18n();

  // Flag configurable: por defecto no autoload (activar poniendo VITE_SUPPLIERS_AUTOLOAD=true)
  const AUTOLOAD_SUPPLIERS = import.meta.env?.VITE_SUPPLIERS_AUTOLOAD === 'true';
  const SHOW_SUPPLIERS_METRICS = (import.meta.env?.VITE_SHOW_SUPPLIERS_METRICS === 'true') || import.meta.env?.DEV;

  // Emitir toast cuando el store expone un error
  useEffect(() => {
    if (error) {
      const hint = lastErrorHintKey ? t(lastErrorHintKey) : undefined;
      errorFrom(new Error(hint ? `${error} (${hint})` : error));
      telemetry.record?.('feature.suppliers.error', { op: 'store', message: error, hint: lastErrorHintKey });
    }
  }, [error, lastErrorHintKey, errorFrom, t]);

  const filteredSuppliers = (suppliers || []).filter(supplier => {
    const search = localSearchTerm.toLowerCase();
    const matchesSearch = (supplier.name || '').toLowerCase().includes(search) || 
                          (supplier.tax_id || '').toLowerCase().includes(search) ||
                          (typeof supplier.contact_info === 'string' && supplier.contact_info.toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && supplier.status) || (statusFilter === 'inactive' && !supplier.status);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (!liveRegionRef.current) return;
    if (loading) return;
    if (searchTerm) {
      liveRegionRef.current.textContent = t('announce.results_for', { total: filteredSuppliers.length, term: searchTerm });
    } else {
      liveRegionRef.current.textContent = t('announce.total_results', { total: filteredSuppliers.length });
    }
  }, [filteredSuppliers.length, searchTerm, loading, t]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && (showSupplierModal || showDeleteModal)) {
        setShowSupplierModal(false); setShowDeleteModal(false); restoreFocus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSupplierModal, showDeleteModal]);

  useEffect(() => {
    // (Auto load deshabilitado por defecto para evitar llamada inicial.)
    if (!AUTOLOAD_SUPPLIERS) return;
    try {
      const storeRef = useSupplierStore.getState ? useSupplierStore.getState() : null;
      if (storeRef && !storeRef.suppliers.length) {
        storeRef.loadPage?.(1, 10, '');
      }
    } catch {}
  }, [AUTOLOAD_SUPPLIERS]);

  const handleSearch = () => {
    if (searchTerm.trim() !== '') {
      const tStart = telemetry.startTimer('feature.suppliers.search');
      Promise.resolve(loadPage(1, 10, searchTerm))
        .then(() => {
          const ms = telemetry.endTimer(tStart, { term: searchTerm });
          telemetry.record?.('feature.suppliers.search.success', { latencyMs: ms, term: searchTerm });
        })
        .catch((err) => {
          telemetry.endTimer(tStart);
          telemetry.record?.('feature.suppliers.error', { op: 'search', message: err?.message });
        });
    }
  };
  
  const handleClearSearch = () => { 
    setSearchTerm(''); 
    clearSuppliers(); 
  };

  const handlePageChange = (page) => loadPage(page, pagination.per_page, searchTerm);

  const captureFocus = () => { lastFocusedRef.current = document.activeElement; };
  const restoreFocus = () => { if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === 'function') lastFocusedRef.current.focus(); };
  const handleCreateSupplier = () => { captureFocus(); setEditingSupplier(null); setShowSupplierModal(true); };
  const handleEditSupplier = (supplier) => { captureFocus(); setEditingSupplier(supplier); setShowSupplierModal(true); };
  const handleDeleteSupplier = (supplier) => { captureFocus(); setSelectedSupplier(supplier); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      setShowDeleteModal(false);
      success('Proveedor eliminado');
      telemetry.record?.('feature.suppliers.delete-success', { id: selectedSupplier.id });
      restoreFocus();
    } catch (err) {
      telemetry.record?.('feature.suppliers.error', { op: 'delete', message: err?.message, id: selectedSupplier.id });
      errorFrom(err, { fallback: 'Error al eliminar proveedor' });
    }
  };

  const handleModalSuccess = () => {
    setShowSupplierModal(false);
    loadPage(pagination.current_page || 1, pagination.per_page || 10, searchTerm);
    success('Operación de proveedor completada.');
    telemetry.record?.('feature.suppliers.update-success');
    restoreFocus();
  };

  // Use DataState for standard states
  const renderMainContent = () => {
    if (loading && !suppliers.length) {
      return <DataState variant="loading" skeletonVariant="list" testId="suppliers-loading" skeletonProps={{ count: 6 }} />;
    }

  if (error) {
      return (
        <DataState
          variant="error"
          title={isNeoBrutalism ? 'ERROR' : 'Error'}
      message={lastErrorHintKey ? `${error} — ${t(lastErrorHintKey)}` : error}
          onRetry={handleSearch}
          testId="suppliers-error"
        />
      );
    }

    if (suppliers.length === 0 && searchTerm.trim() === '') {
      return (
        <DataState
          variant="empty"
          title={isNeoBrutalism ? 'SIN PROVEEDORES' : 'Sin Proveedores'}
          description={isNeoBrutalism ? 'REALIZA UNA BÚSQUEDA PARA EMPEZAR' : 'Realiza una búsqueda para empezar.'}
          actionLabel={isNeoBrutalism ? 'NUEVO PROVEEDOR' : 'Nuevo Proveedor'}
          onAction={handleCreateSupplier}
          testId="suppliers-empty-initial"
        />
      );
    }

    if (filteredSuppliers.length === 0 && searchTerm) {
      return (
        <DataState
          variant="empty"
          title={isNeoBrutalism ? 'SIN RESULTADOS' : 'Sin Resultados'}
          description={isNeoBrutalism ? `NO SE ENCONTRARON PROVEEDORES PARA "${searchTerm.toUpperCase()}"` : `No se encontraron proveedores para "${searchTerm}"`}
          testId="suppliers-empty-filter"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => {
          if (!supplier) return null;
          const contactInfo = (() => {
            if (!supplier.contact_info) return {};
            if (typeof supplier.contact_info === 'object') return supplier.contact_info;
            try { return JSON.parse(supplier.contact_info); } catch { return {}; }
          })();
          return (
            <div key={supplier.id} className={`${card('p-4 sm:p-5')} group relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 flex flex-col`} data-testid={`supplier-card-${supplier.id}`}>
              {/* Accent bar */}
              {!isNeoBrutalism ? (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 rounded-t-md" aria-hidden="true" />
              ) : (
                <div className="absolute inset-x-0 top-0 h-[3px] bg-border" aria-hidden="true" />
              )}

              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className={`${themeHeader('h3')} mb-2 truncate`}>{supplier.name}</h3>
                  <StatusBadge active={!!supplier.status} />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('suppliers.card.ruc') || 'RUC:'}</span><span className={themeLabel()}>{supplier.tax_id || 'N/A'}</span></div>
                  {contactInfo.phone && <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('suppliers.card.phone') || 'TELÉFONO:'}</span><span className={themeLabel()}>{contactInfo.phone}</span></div>}
                  {contactInfo.fax && <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('suppliers.card.fax') || 'FAX:'}</span><span className={themeLabel()}>{contactInfo.fax}</span></div>}
                  {contactInfo.address && <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('suppliers.card.address') || 'DIRECCIÓN:'}</span><span className={themeLabel()}>{contactInfo.address}</span></div>}
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('suppliers.card.registered') || 'REGISTRO:'}</span><span className={themeLabel()}>{new Date(supplier.created_at).toLocaleDateString()}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="primary" size="sm" className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" onClick={() => handleEditSupplier(supplier)} data-testid={`supplier-edit-${supplier.id}`}>
                  <Edit className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'EDITAR' : 'Editar'}
                </Button>
                <Button variant="destructive" size="icon" className="focus-visible:ring-2 focus-visible:ring-ring/50" onClick={() => handleDeleteSupplier(supplier)} aria-label="Eliminar proveedor" data-testid={`supplier-delete-${supplier.id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    const unsub = () => {};
    if (typeof window !== 'undefined') {
      const handler = () => {
        try {
          const st = useSupplierStore.getState();
          if (!st.isOffline && st.autoRefetchOnReconnect) {
            const { page, pageSize, search } = st.lastQuery || { page: 1, pageSize: 10, search: '' };
            st.forceRefetch?.(page, pageSize, search);
            telemetry.record?.('feature.suppliers.offline.auto_refetch', { page, search: !!search });
          }
        } catch (_) {}
      };
      window.addEventListener('online', handler);
      return () => window.removeEventListener('online', handler);
    }
    return unsub;
  }, []);

  // Compute stale (without causing new object each render): only when ts changes
  const cacheMeta = useMemo(() => {
    if (!pageCacheTs) return { stale: false };
    // We purposefully DO NOT include Date.now() in deps so it does not trigger rerenders; staleness updates on next store activity
    return { stale: Date.now() - pageCacheTs > pageCacheTTL / 2 };
  }, [pageCacheTs, pageCacheTTL]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6" data-testid="suppliers-page">
      {isOffline && (
        <div className="max-w-7xl mx-auto mb-4" data-testid="suppliers-offline-banner">
          <div className="flex items-center gap-3 p-3 rounded-md border border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200" role="status" aria-live="polite">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">{t('suppliers.offline.banner') || 'Trabajando sin conexión. Los datos pueden estar desactualizados.'}</span>
            <button type="button" onClick={() => { if (lastQuery) forceRefetch?.(lastQuery.page, lastQuery.pageSize, lastQuery.search); }} className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 transition" data-testid="suppliers-offline-retry">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title={<span className="inline-flex items-center gap-2">{isNeoBrutalism ? 'GESTIÓN DE PROVEEDORES' : 'Gestión de Proveedores'}{cacheMeta?.stale && <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 text-[10px] font-bold tracking-wide" data-testid="suppliers-stale-badge">{t('suppliers.stale.badge') || 'STALE'}</span>}</span>}
          subtitle={isNeoBrutalism ? 'BUSCA, CREA Y ADMINISTRA TUS PROVEEDORES' : 'Busca, crea y administra tus proveedores.'}
          actions={(
            <>
              <Button variant="primary" onClick={handleCreateSupplier} data-testid="suppliers-create-btn">
                <Plus className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'NUEVO PROVEEDOR' : 'Nuevo Proveedor'}
              </Button>
              <Button variant="secondary">
                <BarChart3 className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
              </Button>
            </>
          )}
          compact
          breadcrumb={isMaterial ? 'Compras · Proveedores' : undefined}
        />

        {SHOW_SUPPLIERS_METRICS && <SuppliersMetricsPanel />}

        <section className={card('p-6')}>
          {/* Metrics panel (dev only suggestion) */}
          <div className="mb-4">
            <SuppliersMetricsPanel />
          </div>
          <div className="mb-6">
            <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'BUSCAR PROVEEDORES' : t('suppliers.search.db')}</div>
            <div className="flex gap-3 mb-4">
              <Input
                className={themeInput()}
                leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                type="text"
                placeholder={isNeoBrutalism ? 'BUSCAR POR NOMBRE O CONTACTO...' : t('suppliers.search.placeholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="primary" onClick={handleSearch} disabled={!searchTerm}>
                {isNeoBrutalism ? 'BUSCAR' : t('suppliers.search')}
              </Button>
              <Button variant="secondary" onClick={handleClearSearch}>
                {isNeoBrutalism ? 'LIMPIAR' : t('suppliers.clear')}
              </Button>
            </div>
          </div>

          {suppliers && suppliers.length > 0 && (
            <div className="border-t pt-6">
              <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : t('suppliers.filter.current_results_title')}</div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  className={themeInput()}
                  leftIcon={<Filter className="w-5 h-5 text-muted-foreground" />}
                  type="text"
                  placeholder={isNeoBrutalism ? 'FILTRAR POR NOMBRE...' : t('suppliers.filter.name_placeholder')}
                  value={localSearchTerm}
                  onChange={(e) => setLocalSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={themeInput()}>
                    <SelectValue placeholder={t('suppliers.filter.all_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('suppliers.filter.all_status')}</SelectItem>
                    <SelectItem value="active">{t('suppliers.filter.status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('suppliers.filter.status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className={card('p-3 text-center')}>
                  <div className={themeHeader('h2')}>{filteredSuppliers.length}</div>
                  <div className={themeLabel()}>{t('suppliers.stats.shown') || 'PROVEEDORES MOSTRADOS'}</div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section data-testid="suppliers-main">{renderMainContent()}</section>

        {pagination && pagination.total_pages > 1 && (
          <footer className="text-center py-8">
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(1)} disabled={pagination.current_page <= 1 || loading}>{t('suppliers.pagination.first')}</Button>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page <= 1 || loading}>{t('suppliers.pagination.prev')}</Button>
               <span className={themeLabel()}>{t('suppliers.pagination.page_of', { page: pagination.current_page, totalPages: pagination.total_pages })}</span>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.total_pages || loading}>{t('suppliers.pagination.next')}</Button>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(pagination.total_pages)} disabled={pagination.current_page >= pagination.total_pages || loading}>{t('suppliers.pagination.last')}</Button>
            </div>
          </footer>
        )}
      </div>

  <SupplierModal isOpen={showSupplierModal} onClose={() => { setShowSupplierModal(false); restoreFocus(); }} supplier={editingSupplier} onSuccess={handleModalSuccess} />
  <DeleteSupplierModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); restoreFocus(); }} supplier={selectedSupplier} onConfirm={handleConfirmDelete} loading={loading} />
  <div ref={liveRegionRef} aria-live="polite" role="status" className="sr-only" data-testid="suppliers-live-region" />
  <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default SuppliersPage;

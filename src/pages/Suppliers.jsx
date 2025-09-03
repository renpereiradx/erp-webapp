import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import useSupplierStore from '../store/useSupplierStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DataState from '../components/ui/DataState';
import { ConfirmationModal } from '../components/ui/EnhancedModal';
import SupplierListItem from '../components/suppliers/SupplierListItem';
import SupplierModal from '../components/suppliers/SupplierModal';
import SupplierDetailModal from '../components/suppliers/SupplierDetailModal';
import { telemetry } from '../utils/telemetry';

const SuppliersPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const { suppliers, loading, error, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, clearError, searchSuppliers, searchResults, lastSearchTerm, reactivateSupplier } = useSupplierStore();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [reactivatingItem, setReactivatingItem] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [localFilter, setLocalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Telemetría de errores del store
  useEffect(() => {
    if (error) {
      telemetry.record('suppliers.error.store', { message: error });
    }
  }, [error]);

  // Detectar tipo de búsqueda (ID vs nombre)
  const detectSearchType = (term) => {
    if (!term) return 'none';
    const trimmed = term.trim();
    const looksLikeId = /^\d+$/.test(trimmed) && trimmed.length >= 1;
    return looksLikeId ? 'id' : 'name';
  };
  const searchType = detectSearchType(apiSearchTerm);

  // Aplicar filtros locales
  const applyLocalFilters = (base) => {
    let arr = [...base];
    if (localFilter.trim()) {
      const lf = localFilter.toLowerCase();
      arr = arr.filter(s =>
        (s.name || '').toLowerCase().includes(lf) ||
        (s.contact_info?.email || '').toLowerCase().includes(lf) ||
        (s.contact_info?.phone || '').toLowerCase().includes(lf) ||
        (s.contact_info?.address || '').toLowerCase().includes(lf) ||
        (s.tax_id || '').toLowerCase().includes(lf)
      );
    }
    if (statusFilter === 'active') {
      arr = arr.filter(s => s.status !== false);
    } else if (statusFilter === 'inactive') {
      arr = arr.filter(s => s.status === false);
    }
    return arr;
  };

  const baseResults = searchResults.length > 0 ? searchResults : suppliers;
  const filteredSuppliers = applyLocalFilters(baseResults);
  const displaySuppliers = showFilters ? filteredSuppliers : baseResults;

  // Manejar búsqueda por API
  const handleApiSearch = async (e) => {
    e.preventDefault();
    const trimmed = apiSearchTerm.trim();
    const minLength = searchType === 'id' ? 1 : 2;
    if (!trimmed || trimmed.length < minLength) return;
    setIsSearching(true); setSearchError(null);
    try {
      const results = await searchSuppliers(trimmed);
      setShowFilters(results.length > 1);
      setLocalFilter('');
      setStatusFilter('active');
    } catch (err) {
      setSearchError({ term: trimmed, type: searchType, message: err.message || 'Error' });
      setShowFilters(false);
    } finally { setIsSearching(false); }
  };

  const clearFilters = () => {
    setLocalFilter('');
    setStatusFilter('active');
    // Limpiar resultados de búsqueda
    if (searchResults.length > 0) {
      useSupplierStore.setState({ searchResults: [], lastSearchTerm: '' });
      setApiSearchTerm('');
    }
  };

  useEffect(() => { if (!apiSearchTerm.trim()) { clearFilters(); } }, [apiSearchTerm]);

  const handleCreate = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      const result = await deleteSupplier(deletingItem.id);
      if (result.success) {
        setShowDeleteModal(false);
        setDeletingItem(null);
        // Solo refrescar si había una búsqueda activa
        if (lastSearchTerm) {
          searchSuppliers(lastSearchTerm).catch(() => {});
        }
      }
    }
  };

  const handleReactivate = (supplier) => {
    setReactivatingItem(supplier);
    setShowReactivateModal(true);
  };

  const handleConfirmReactivate = async () => {
    if (reactivatingItem) {
      const result = await reactivateSupplier(reactivatingItem.id);
      if (result.success) {
        setShowReactivateModal(false);
        setReactivatingItem(null);
        // Solo refrescar si había una búsqueda activa
        if (lastSearchTerm) {
          searchSuppliers(lastSearchTerm).catch(() => {});
        }
      }
    }
  };

  if (loading && suppliers.length === 0 && searchResults.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return <DataState variant="error" title={t('supplier.error.title', 'Error al cargar proveedores')} message={error} onRetry={() => { clearError(); fetchSuppliers(); }} />;
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>{t('supplier.title', 'Proveedores')}</h1>
        <Button onClick={handleCreate} variant="primary"><Plus className="w-4 h-4 mr-2" />{t('supplier.action.create', 'Nuevo Proveedor')}</Button>
      </div>

      {/* Búsqueda API */}
      <div className="space-y-4">
        <form onSubmit={handleApiSearch} className="flex gap-2 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchType === 'id' ? 'Buscar por ID de proveedor...' : 'Buscar por nombre (min 2 caracteres)...'}
              value={apiSearchTerm}
              onChange={(e) => { setApiSearchTerm(e.target.value); if (searchError) setSearchError(null); }}
              className={`pl-10 ${styles.input()}`}
            />
            {apiSearchTerm && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className={`text-xs px-2 py-1 rounded-full ${searchType === 'id' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                  {searchType === 'id' ? 'ID' : 'Nombre'}
                </span>
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={!apiSearchTerm.trim() || apiSearchTerm.trim().length < (searchType === 'id' ? 1 : 2) || isSearching}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { fetchSuppliers(); setApiSearchTerm(''); clearFilters(); }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Listar Todos'}
          </Button>
        </form>
        {apiSearchTerm && !searchError && (
          <div className="text-xs text-muted-foreground">
            {searchType === 'id' ? `🔍 Detectado como ID (${apiSearchTerm.length}/1+)` : `🔍 Búsqueda por nombre (${apiSearchTerm.length}/2+)`}
          </div>
        )}
        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 max-w-xl">
            Error buscando "{searchError.term}": {searchError.message}
            <button onClick={() => setSearchError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}
      </div>

      {displaySuppliers.length === 0 ? (
        <DataState 
          variant="empty" 
          title={lastSearchTerm ? t('supplier.search.empty', 'No se encontraron proveedores') : t('supplier.empty.title', 'No hay proveedores cargados')} 
          message={lastSearchTerm ? t('supplier.search.message', 'Intenta con otros términos de búsqueda') : t('supplier.empty.message', 'Usa "Buscar" o "Listar Todos" para cargar proveedores.')} 
          actionLabel={t('supplier.action.create', 'Crear Proveedor')} 
          onAction={handleCreate} 
        />
      ) : (
        <>
          {/* Filtros locales */}
          {showFilters && (
            <div className={styles.card('p-4 mb-6')}>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Filtrar resultados ({filteredSuppliers.length} de {baseResults.length})</span>
                </div>
                {(localFilter || statusFilter !== 'active') && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" /> Limpiar filtros
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Buscar en resultados</label>
                  <Input value={localFilter} onChange={(e) => setLocalFilter(e.target.value)} placeholder="Texto..." className={`text-sm ${styles.input()}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Estado</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`text-sm ${styles.input()} cursor-pointer`}>
                    <option value="active">Solo activos</option>
                    <option value="inactive">Solo inactivos</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Listado */}
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {displaySuppliers
              .filter(s => s && s.id)
              .map(supplier => (
                <SupplierListItem 
                  key={supplier.id} 
                  supplier={supplier} 
                  onEdit={handleEdit} 
                  onDelete={handleDelete} 
                  onView={setViewingSupplier}
                  onReactivate={handleReactivate} 
                />
              ))}
          </div>
        </>
      )}

      <SupplierModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        supplier={editingItem}
        onSuccess={() => {
          // No refrescar automáticamente - el usuario debe usar "Buscar" o "Listar Todos"
          // Solo refrescar si hay una búsqueda activa específica
          if (lastSearchTerm) {
            searchSuppliers(lastSearchTerm).catch(() => {});
          }
        }}
      />

      {viewingSupplier && (
        <SupplierDetailModal supplier={viewingSupplier} onClose={() => setViewingSupplier(null)} />
      )}

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={t('supplier.delete.title', 'Eliminar Proveedor')}
        message={deletingItem ? 
          t('supplier.delete.message', 'Esta acción eliminará permanentemente al proveedor "{name}" y no se puede deshacer.').replace('{name}', deletingItem.name) :
          ''
        }
        confirmText={t('supplier.delete.confirm', 'Eliminar Proveedor')}
        cancelText={t('modal.cancel', 'Cancelar')}
        variant="error"
        loading={loading}
      />

      <ConfirmationModal
        isOpen={showReactivateModal}
        onClose={() => setShowReactivateModal(false)}
        onConfirm={handleConfirmReactivate}
        title={t('supplier.reactivate.title', 'Reactivar Proveedor')}
        message={reactivatingItem ? 
          t('supplier.reactivate.message', 'Esta acción reactivará al proveedor "{name}" y estará disponible nuevamente.').replace('{name}', reactivatingItem.name) :
          ''
        }
        confirmText={t('supplier.reactivate.confirm', 'Reactivar Proveedor')}
        cancelText={t('modal.cancel', 'Cancelar')}
        variant="default"
        loading={loading}
      />
    </div>
  );
};

export default SuppliersPage;

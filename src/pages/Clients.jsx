import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DataState from '../components/ui/DataState';
import EnhancedModal, { ConfirmationModal } from '../components/ui/EnhancedModal';
import ClientListItem from '../components/clients/ClientListItem';
import ClientDetailModal from '../components/clients/ClientDetailModal';
import ClientForm from '../components/clients/ClientForm';
import { useI18n } from '../lib/i18n';
import useClientStore from '../store/useClientStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { telemetry } from '../utils/telemetry';

const ClientsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const {
    clients, loading, error, fetchClients, createClient, updateClient, deleteClient, clearError, searchClients, searchResults, lastSearchTerm
  } = useClientStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tax_id: '' });
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [localFilter, setLocalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // active|inactive|all
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  // Removido: fetchClients automático al montar - ahora las llamadas son explícitas
  // useEffect(() => {
  //   fetchClients();
  // }, [fetchClients]);

  // Telemetría de errores del store
  useEffect(() => {
    if (error) {
      telemetry.record('clients.error.store', { message: error });
    }
  }, [error]);

  // Detectar tipo (ID vs nombre) similar a productos
  const detectSearchType = (term) => {
    if (!term) return 'none';
    const trimmed = term.trim();
    const looksLikeId = /^[a-zA-Z0-9_-]{8,30}$/.test(trimmed) && !/\s/.test(trimmed) && trimmed.length >= 8;
    return looksLikeId ? 'id' : 'name';
  };
  const searchType = detectSearchType(apiSearchTerm);

  const applyLocalFilters = (base) => {
    let arr = [...base];
    if (localFilter.trim()) {
      const lf = localFilter.toLowerCase();
      arr = arr.filter(c =>
        (c.name || '').toLowerCase().includes(lf) ||
        (c.contact?.email || '').toLowerCase().includes(lf) ||
        (c.contact?.phone || '').toLowerCase().includes(lf) ||
        (c.address?.city || '').toLowerCase().includes(lf) ||
        (c.metadata?.type || '').toLowerCase().includes(lf)
      );
    }
    if (statusFilter === 'active') {
      arr = arr.filter(c => c.status !== false);
    } else if (statusFilter === 'inactive') {
      arr = arr.filter(c => c.status === false);
    }
    return arr;
  };

  const baseResults = searchResults.length > 0 ? searchResults : clients;
  const filteredClients = applyLocalFilters(baseResults);
  const displayClients = showFilters ? filteredClients : baseResults;

  const handleApiSearch = async (e) => {
    e.preventDefault();
    const trimmed = apiSearchTerm.trim();
    const minLength = searchType === 'id' ? 8 : 2;
    if (!trimmed || trimmed.length < minLength) return;
    setIsSearching(true); setSearchError(null);
    try {
      const results = await searchClients(trimmed);
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
    // También limpiar resultados de búsqueda para volver al estado inicial
    if (searchResults.length > 0) {
      useClientStore.setState({ searchResults: [], lastSearchTerm: '' });
      setApiSearchTerm('');
    }
  };

  useEffect(() => { if (!apiSearchTerm.trim()) { clearFilters(); } }, [apiSearchTerm]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', email: '', phone: '', tax_id: '' });
    setShowEditModal(true);
  };
  
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      email: item.contact?.email || '',
      phone: item.contact?.phone || '',
      tax_id: item.tax_id || ''
    });
    setShowEditModal(true);
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    const clientData = { name: formData.name, contact: { email: formData.email, phone: formData.phone }, tax_id: formData.tax_id };
    if (editingItem) {
      await updateClient(editingItem.id, clientData);
    } else {
      await createClient(clientData);
    }
    setShowEditModal(false);
  };
  
  const handleDelete = (item) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingItem) {
      await deleteClient(deletingItem.id);
      setShowDeleteModal(false);
      setDeletingItem(null);
    }
  };

  if (loading && clients.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return <DataState variant="error" title={t('client.error.title', 'Error al cargar clientes')} message={error} onRetry={() => { clearError(); fetchClients(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>{t('client.title', 'Clientes')}</h1>
        <Button onClick={handleCreate} variant="primary"><Plus className="w-4 h-4 mr-2" />{t('client.action.create', 'Nuevo Cliente')}</Button>
      </div>

      {/* Búsqueda API */}
      <div className="space-y-4">
        <form onSubmit={handleApiSearch} className="flex gap-2 max-w-2xl">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchType === 'id' ? 'Buscar por ID de cliente...' : 'Buscar por nombre (min 2 caracteres)...'}
              value={apiSearchTerm}
              onChange={(e) => { setApiSearchTerm(e.target.value); if (searchError) setSearchError(null); }}
              className={`pl-10 ${styles.input()}`}
            />
            {apiSearchTerm && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <span className={`text-xs px-2 py-1 rounded-full ${searchType === 'id' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{searchType === 'id' ? 'ID' : 'Nombre'}</span>
              </div>
            )}
          </div>
          <Button
            type="submit"
            variant="secondary"
            disabled={!apiSearchTerm.trim() || apiSearchTerm.trim().length < (searchType === 'id' ? 8 : 2) || isSearching}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => { fetchClients(); setApiSearchTerm(''); clearFilters(); }}
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Listar Todos'}
          </Button>
        </form>
        {apiSearchTerm && !searchError && (
          <div className="text-xs text-muted-foreground">
            {searchType === 'id' ? `🔍 Detectado como ID (${apiSearchTerm.length}/8+)` : `🔍 Búsqueda por nombre (${apiSearchTerm.length}/2+)`}
          </div>
        )}
        {searchError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 max-w-xl">
            Error buscando "{searchError.term}": {searchError.message}
            <button onClick={() => setSearchError(null)} className="ml-2 underline">Cerrar</button>
          </div>
        )}
      </div>

      {displayClients.length === 0 ? (
        <DataState 
          variant="empty" 
          title={lastSearchTerm ? t('client.search.empty', 'No se encontraron clientes') : t('client.empty.title', 'No hay clientes cargados')} 
          message={lastSearchTerm ? t('client.search.message', 'Intenta con otros términos de búsqueda') : t('client.empty.message', 'Usa "Buscar" o "Listar Todos" para cargar clientes.')} 
          actionLabel={t('client.action.create', 'Crear Cliente')} 
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
                  <span className="text-sm font-medium">Filtrar resultados ({filteredClients.length} de {baseResults.length})</span>
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
              {(localFilter || statusFilter !== 'active') && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {localFilter && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Texto: "{localFilter}"
                      <button onClick={() => setLocalFilter('')} className="hover:bg-blue-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                  {statusFilter !== 'active' && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Estado: {statusFilter === 'all' ? 'Todos' : 'Inactivos'}
                      <button onClick={() => setStatusFilter('active')} className="hover:bg-green-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Listado */}
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {displayClients
              .filter(c => c && (c.id || c.name))
              .map(client => (
                <ClientListItem key={client._key || client.id || client.name} client={client} onEdit={handleEdit} onDelete={handleDelete} onView={setViewingClient} />
              ))}
          </div>
        </>
      )}

      {viewingClient && (
        <ClientDetailModal client={viewingClient} onClose={() => setViewingClient(null)} />
      )}

      <EnhancedModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={editingItem ? t('client.modal.edit', 'Editar Cliente') : t('client.modal.create', 'Crear Cliente')}
        subtitle={editingItem ? 
          t('client.modal.edit_subtitle', 'Modifica la información del cliente') : 
          t('client.modal.create_subtitle', 'Ingresa los datos del nuevo cliente')
        }
        variant="default"
        size="md"
        loading={loading}
        testId="client-modal"
      >
        <ClientForm 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSave}
          handleCancel={() => setShowEditModal(false)}
          loading={loading}
          isEditing={!!editingItem}
        />
      </EnhancedModal>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={t('client.delete.title', 'Eliminar Cliente')}
        message={deletingItem ? 
          t('client.delete.message', 'Esta acción eliminará permanentemente al cliente "{name}" y no se puede deshacer.').replace('{name}', deletingItem.name) :
          ''
        }
        confirmText={t('client.delete.confirm', 'Eliminar Cliente')}
        cancelText={t('modal.cancel', 'Cancelar')}
        variant="error"
        loading={loading}
      />
    </div>
  );
};

export default ClientsPage;

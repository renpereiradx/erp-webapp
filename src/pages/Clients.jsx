import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Package,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  BarChart3
} from 'lucide-react';
import useClientStore from '@/store/useClientStore';
import ClientModal from '@/components/ClientModal';
import DeleteClientModal from '@/components/DeleteClientModal';
import ClientDetailModal from '@/components/ClientDetailModal';
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

// Unificado: badge de estado por tokens
// const getBadgeStyles = (theme, isActive) => {
//   const isNeoBrutalism = theme?.includes('neo-brutalism');
//   const background = isActive ? 'var(--success)' : 'var(--destructive)';
//   const color = isActive ? 'var(--primary-foreground)' : 'var(--destructive-foreground)';
//   return {
//     background,
//     color,
//     border: isNeoBrutalism ? '3px solid var(--border)' : 'none',
//     borderRadius: isNeoBrutalism ? '0px' : '9999px',
//     textTransform: isNeoBrutalism ? 'uppercase' : 'none',
//     fontWeight: isNeoBrutalism ? 900 : 600,
//     fontSize: '0.75rem',
//     padding: isNeoBrutalism ? '8px 12px' : '4px 10px',
//     display: 'inline-flex',
//     alignItems: 'center',
//     gap: '6px',
//     minWidth: 'fit-content',
//   };
// };

const ClientsPage = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const {
    searchClients, clearClients, clients, loading, error, clearError, totalPages, currentPage, loadPage, totalClients, lastSearchTerm, pageSize, changePageSize, deleteClient
  } = useClientStore();

  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');

  const { t } = useI18n();

  // Emitir toast cuando el store exponga un error
  useEffect(() => {
    if (error) {
      errorFrom(new Error(error));
      telemetry.record('clients.error.store', { message: error });
    }
  }, [error, errorFrom]);

  const filteredClients = (clients || []).filter(client => {
    const search = localSearchTerm.toLowerCase();
    const fullName = `${client.name || ''} ${client.last_name || ''}`.toLowerCase();
    const matchesSearch = fullName.includes(search) || (client.document_id || '').toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && client.status === true) || (statusFilter === 'inactive' && client.status === false);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    // Limpiar clientes al montar la página
    clearClients();
    // clearClients es estable en nuestro store, se ignora warning por diseño
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApiSearch = () => {
    if (apiSearchTerm.trim() !== '') {
      const t = telemetry.startTimer('clients.search');
      searchClients(apiSearchTerm, 1, pageSize)
        .then(() => {
          const ms = telemetry.endTimer(t, { term: apiSearchTerm });
          telemetry.record('clients.search.success', { ms });
        })
        .catch((err) => {
          telemetry.endTimer(t);
          telemetry.record('clients.search.error', { message: err?.message });
        });
      setLocalSearchTerm(''); // Limpiar el filtro local al realizar una búsqueda API
    }
  };
  const handleClearSearch = () => { setApiSearchTerm(''); setLocalSearchTerm(''); clearClients(); };
  const handlePageChange = (page) => loadPage(page);
  const handlePageSizeChange = (size) => changePageSize(parseInt(size));

  const handleCreateClient = () => { setEditingClient(null); setShowClientModal(true); };
  const handleEditClient = (client) => { setEditingClient(client); setShowClientModal(true); };
  const handleViewClient = (client) => { setSelectedClient(client); setShowDetailModal(true); };
  const handleDeleteClient = (client) => { setSelectedClient(client); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!selectedClient) return;
    try {
      await deleteClient(selectedClient.id);
      setShowDeleteModal(false);
      success('Cliente eliminado');
  telemetry.record('clients.delete.success', { id: selectedClient.id });
    } catch (err) {
  telemetry.record('clients.delete.error', { id: selectedClient.id, message: err?.message });
      errorFrom(err, { fallback: 'Error al eliminar cliente' });
    }
  };

  const handleModalSuccess = () => {
    setShowClientModal(false);
    success('Operación de cliente completada.');
  telemetry.record('clients.modal.success');
  };

  // Reemplazamos la implementación previa por DataState para estandarizar estados
  const renderMainContent = () => {
    if (loading) {
  return <DataState variant="loading" skeletonVariant="list" testId="clients-loading" skeletonProps={{ count: 6 }} />;
    }

    if (error) {
      return (
        <DataState
          variant="error"
          title={isNeoBrutalism ? 'ERROR' : 'Error'}
          message={error}
          onRetry={() => searchClients(lastSearchTerm)}
          testId="clients-error"
        />
      );
    }

    if ((clients || []).length === 0 && apiSearchTerm.trim() === '') {
      return (
        <DataState
          variant="empty"
          title={isNeoBrutalism ? 'INICIA UNA BÚSQUEDA' : 'Inicia una Búsqueda'}
          description={isNeoBrutalism ? 'UTILIZA LA BARRA SUPERIOR PARA ENCONTRAR CLIENTES' : 'Utiliza la barra superior para encontrar clientes.'}
          actionLabel={isNeoBrutalism ? 'NUEVO CLIENTE' : 'Nuevo Cliente'}
          onAction={handleCreateClient}
          testId="clients-empty-initial"
        />
      );
    }

    if (filteredClients.length === 0) {
      return (
        <DataState
          variant="empty"
          title={isNeoBrutalism ? 'SIN RESULTADOS' : 'Sin Resultados'}
          description={isNeoBrutalism ? 'NO SE ENCONTRARON CLIENTES PARA TU FILTRO' : 'No se encontraron clientes para tu filtro'}
          testId="clients-empty-filter"
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className={`${card('p-4 sm:p-5')} group relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 flex flex-col`} data-testid={`client-card-${client.id}`}>
            {/* Accent bar */}
            {!isNeoBrutalism ? (
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 rounded-t-md" aria-hidden="true" />
            ) : (
              <div className="absolute inset-x-0 top-0 h-[3px] bg-border" aria-hidden="true" />
            )}

            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className={`${themeHeader('h3')} mb-2 truncate`}>{client.name} {client.last_name || ''}</h3>
                <StatusBadge active={!!client.status} />
              </div>
              <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('clients.card.document') || 'DOCUMENTO:'}</span><span className={themeLabel()}>{client.document_id || 'N/A'}</span></div>
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('clients.card.contact') || 'CONTACTO:'}</span><span className={themeLabel()}>{client.contact || 'N/A'}</span></div>
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>{t('clients.card.registered') || 'REGISTRO:'}</span><span className={themeLabel()}>{new Date(client.created_at).toLocaleDateString()}</span></div>
                </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={() => handleViewClient(client)} variant="secondary" size="sm" className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" data-testid={`client-view-${client.id}`}><Eye className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'VER' : 'Ver'}</Button>
              <Button onClick={() => handleEditClient(client)} variant="primary" size="sm" className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" data-testid={`client-edit-${client.id}`}><Edit className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'EDITAR' : 'Editar'}</Button>
              <Button onClick={() => handleDeleteClient(client)} variant="destructive" size="icon" className="focus-visible:ring-2 focus-visible:ring-ring/50" aria-label="Eliminar cliente" data-testid={`client-delete-${client.id}`}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6" data-testid="clients-page">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title={isNeoBrutalism ? 'GESTIÓN DE CLIENTES' : t('clients.title', { default: 'Gestión de Clientes' })}
          subtitle={isNeoBrutalism ? 'BUSCA, CREA Y ADMINISTRA TUS CLIENTES EFICIENTEMENTE' : t('clients.subtitle', { default: 'Busca, crea y administra tus clientes eficientemente.' })}
          actions={(
            <>
              <Button variant="primary" onClick={handleCreateClient}>
                <Plus className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'NUEVO CLIENTE' : 'Nuevo Cliente'}
              </Button>
              <Button variant="secondary">
                <BarChart3 className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}
              </Button>
            </>
          )}
          compact
          breadcrumb={isMaterial ? 'CRM · Clientes' : undefined}
        />

        <section className={card('p-6')}>
          <div className="mb-6">
            <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'BUSCAR EN BASE DE DATOS' : t('clients.search.db')}</div>
            <div className="flex gap-3 mb-4">
              <Input
                className={themeInput()}
                leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                type="text"
                placeholder={isNeoBrutalism ? 'BUSCAR POR NOMBRE, DOCUMENTO O ID...' : t('clients.search.placeholder')}
                value={apiSearchTerm}
                onChange={(e) => setApiSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApiSearch()}
              />
              <Button variant="primary" onClick={handleApiSearch} disabled={!apiSearchTerm}>{isNeoBrutalism ? 'BUSCAR' : t('clients.search')}</Button>
              <Button variant="secondary" onClick={handleClearSearch}>{isNeoBrutalism ? 'LIMPIAR' : t('clients.clear')}</Button>
            </div>
            <div className="flex items-center gap-3"><label htmlFor="pageSize" className={themeLabel()}>{isNeoBrutalism ? 'CLIENTES POR PÁGINA:' : t('clients.page_size_label')}</label><select id="pageSize" value={pageSize} onChange={(e) => handlePageSizeChange(e.target.value)} className={`px-3 py-2 bg-background ${themeInput()}`} style={isNeoBrutalism ? { border: '3px solid var(--border)', borderRadius: '0px', textTransform: 'uppercase', fontWeight: '600' } : {}}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div>
          </div>

          {clients && clients.length > 0 && (
            <div className="border-t pt-6">
              <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : t('clients.filter.current_results_title')}</div>
              <div className="grid md:grid-cols-3 gap-4">
              <Input
                className={themeInput()}
                  leftIcon={<Filter className="w-5 h-5 text-muted-foreground" />}
                type="text"
                  placeholder={isNeoBrutalism ? 'FILTRAR POR NOMBRE...' : t('clients.filter.name_placeholder')}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`
                    flex h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none
                    focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
                    ${isNeoBrutalism ? 'border-[3px] border-[var(--border)] rounded-none uppercase font-semibold' : 'border-input'}
                  `}>
                    <SelectValue placeholder={t('clients.filter.all_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('clients.filter.all_status')}</SelectItem>
                    <SelectItem value="active">{t('clients.filter.status.active')}</SelectItem>
                    <SelectItem value="inactive">{t('clients.filter.status.inactive')}</SelectItem>
                  </SelectContent>
                </Select>
                <div className={card('p-3 text-center')}><div className={themeHeader('h2')}>{filteredClients.length}</div><div className={themeLabel()}>{t('clients.stats.shown') || 'CLIENTES MOSTRADOS'}</div></div>
              </div>
            </div>
          )}
        </section>

        <section data-testid="clients-main">{renderMainContent()}</section>

        {totalClients > 0 && totalPages > 1 && (
          <footer className="text-center py-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4"><div className={themeLabel()}>{t('clients.pagination.showing_page_count', { shown: filteredClients.length, total: totalClients })}</div></div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(1)} disabled={currentPage <= 1 || loading}>{t('clients.pagination.first')}</Button>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>{t('clients.pagination.prev')}</Button>
              <span className={themeLabel()}>{t('clients.pagination.page_of', { page: currentPage, totalPages })}</span>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || loading}>{t('clients.pagination.next')}</Button>
              <Button variant="secondary" size="sm" onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages || loading}>{t('clients.pagination.last')}</Button>
            </div>
          </footer>
        )}
      </div>

      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} client={editingClient} onSuccess={handleModalSuccess} />
      <DeleteClientModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} client={selectedClient} onConfirm={handleConfirmDelete} loading={loading} />
      <ClientDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} client={selectedClient} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ClientsPage;

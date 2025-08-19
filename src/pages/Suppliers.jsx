import React, { useState, useEffect } from 'react';
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
  BarChart3
} from 'lucide-react';
import useSupplierStore from '@/store/useSupplierStore';
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

const SuppliersPage = () => {
  const { theme } = useTheme();
  const { button: themeButton, input: themeInput, card, header: themeHeader, label: themeLabel } = useThemeStyles();
  const { toasts, success, error: showError, errorFrom, removeToast } = useToast();
  const {
    suppliers, loading, error, pagination,
    fetchSuppliers, deleteSupplier, clearSuppliers
  } = useSupplierStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);

  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');

  const { t } = useI18n();

  // Emitir toast cuando el store expone un error
  useEffect(() => {
    if (error) {
      errorFrom(new Error(error));
      telemetry.record('suppliers.error.store', { message: error });
    }
  }, [error, errorFrom]);

  const filteredSuppliers = (suppliers || []).filter(supplier => {
    const search = localSearchTerm.toLowerCase();
    const matchesSearch = (supplier.name || '').toLowerCase().includes(search) || 
                          (supplier.tax_id || '').toLowerCase().includes(search) ||
                          (typeof supplier.contact_info === 'string' && supplier.contact_info.toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && supplier.status) || (statusFilter === 'inactive' && !supplier.status);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    // Limpiar proveedores al montar la página
    clearSuppliers();
    // clearSuppliers es estable en nuestro store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim() !== '') {
      const t = telemetry.startTimer('suppliers.search');
      Promise.resolve(fetchSuppliers(1, 10, searchTerm))
        .then(() => {
          const ms = telemetry.endTimer(t, { term: searchTerm });
          telemetry.record('suppliers.search.success', { ms });
        })
        .catch((err) => {
          telemetry.endTimer(t);
          telemetry.record('suppliers.search.error', { message: err?.message });
        });
    }
  };
  
  const handleClearSearch = () => { 
    setSearchTerm(''); 
    clearSuppliers(); 
  };

  const handlePageChange = (page) => fetchSuppliers(page, pagination.per_page, searchTerm);

  const handleCreateSupplier = () => { setEditingSupplier(null); setShowSupplierModal(true); };
  const handleEditSupplier = (supplier) => { setEditingSupplier(supplier); setShowSupplierModal(true); };
  const handleDeleteSupplier = (supplier) => { setSelectedSupplier(supplier); setShowDeleteModal(true); };

  const handleConfirmDelete = async () => {
    if (!selectedSupplier) return;
    try {
      await deleteSupplier(selectedSupplier.id);
      setShowDeleteModal(false);
      success('Proveedor eliminado');
  telemetry.record('suppliers.delete.success', { id: selectedSupplier.id });
    } catch (err) {
  telemetry.record('suppliers.delete.error', { id: selectedSupplier.id, message: err?.message });
      errorFrom(err, { fallback: 'Error al eliminar proveedor' });
    }
  };

  const handleModalSuccess = () => {
    setShowSupplierModal(false);
    fetchSuppliers(pagination.current_page || 1, pagination.per_page || 10, searchTerm);
    success('Operación de proveedor completada.');
  telemetry.record('suppliers.modal.success');
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
          message={error}
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

  return (
    <div className="min-h-screen bg-background text-foreground p-6" data-testid="suppliers-page">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          title={isNeoBrutalism ? 'GESTIÓN DE PROVEEDORES' : 'Gestión de Proveedores'}
          subtitle={isNeoBrutalism ? 'BUSCA, CREA Y ADMINISTRA TUS PROVEEDORES' : 'Busca, crea y administra tus proveedores.'}
          actions={(
            <>
              <Button variant="primary" onClick={handleCreateSupplier}>
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

        <section className={card('p-6')}>
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

      <SupplierModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} supplier={editingSupplier} onSuccess={handleModalSuccess} />
      <DeleteSupplierModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} supplier={selectedSupplier} onConfirm={handleConfirmDelete} loading={loading} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default SuppliersPage;

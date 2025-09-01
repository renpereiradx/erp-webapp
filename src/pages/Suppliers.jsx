import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import useSupplierStore from '../store/useSupplierStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DataState from '../components/ui/DataState';
import EnhancedModal from '../components/ui/EnhancedModal';
import SupplierListItem from '../components/suppliers/SupplierListItem';
import SupplierForm from '../components/suppliers/SupplierForm';

const SuppliersPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const { suppliers, loading, error, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, clearError } = useSupplierStore();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tax_id: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filtrar proveedores localmente
  const filteredSuppliers = suppliers.filter(supplier =>
    (supplier.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.contact?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.metadata?.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({ name: '', email: '', phone: '', tax_id: '' });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      email: item.contact?.email || '',
      phone: item.contact?.phone || '',
      tax_id: item.tax_id || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const supplierData = { name: formData.name, contact: { email: formData.email, phone: formData.phone }, tax_id: formData.tax_id };
    if (editingItem) {
      await updateSupplier(editingItem.id, supplierData);
    } else {
      await createSupplier(supplierData);
    }
    setShowModal(false);
  };

  const handleDelete = (item) => {
    if (window.confirm(`¿Eliminar proveedor ${item.name}?`)) {
      deleteSupplier(item.id);
    }
  };

  if (loading && suppliers.length === 0) {
    return <DataState variant="loading" skeletonVariant="list" />;
  }

  if (error) {
    return <DataState variant="error" title={t('supplier.error.title', 'Error al cargar proveedores')} message={error} onRetry={() => { clearError(); fetchSuppliers(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={styles.header('h1')}>{t('supplier.title', 'Proveedores')}</h1>
        <Button onClick={handleCreate} variant="primary"><Plus className="w-4 h-4 mr-2" />{t('supplier.action.create', 'Nuevo Proveedor')}</Button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('supplier.search.placeholder', 'Buscar por nombre, email, ciudad o categoría...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${styles.input()}`}
        />
      </div>

      {suppliers.length === 0 ? (
        <DataState variant="empty" title={t('supplier.empty.title', 'No hay proveedores')} message={t('supplier.empty.message', 'Crea tu primer proveedor para empezar.')} actionLabel={t('supplier.action.create', 'Crear Proveedor')} onAction={handleCreate} />
      ) : (
        <>
          {/* Estadísticas rápidas */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-primary">{filteredSuppliers.length}</div>
              <div className="text-sm text-muted-foreground">
                {searchTerm ? `Encontrados (${suppliers.length} total)` : 'Total Proveedores'}
              </div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-green-600">{filteredSuppliers.filter(s => s.metadata?.priority === 'high').length}</div>
              <div className="text-sm text-muted-foreground">Alta Prioridad</div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-blue-600">{new Set(filteredSuppliers.map(s => s.address?.city)).size}</div>
              <div className="text-sm text-muted-foreground">Ciudades</div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-purple-600">{new Set(filteredSuppliers.map(s => s.metadata?.category)).size}</div>
              <div className="text-sm text-muted-foreground">Categorías</div>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {filteredSuppliers.length === 0 ? (
            <DataState 
              variant="empty" 
              title={t('supplier.search.empty', 'No se encontraron proveedores')} 
              message={t('supplier.search.message', 'Intenta con otros términos de búsqueda')} 
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredSuppliers.map(supplier => (
                <SupplierListItem key={supplier.id} supplier={supplier} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}

      <EnhancedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingItem ? t('supplier.modal.edit', 'Editar Proveedor') : t('supplier.modal.create', 'Crear Proveedor')}
        subtitle={editingItem ? 
          t('supplier.modal.edit_subtitle', 'Modifica los datos del proveedor') : 
          t('supplier.modal.create_subtitle', 'Registra un nuevo proveedor en el sistema')
        }
        variant="default"
        size="md"
        loading={loading}
        testId="supplier-modal"
      >
        <SupplierForm 
          formData={formData}
          setFormData={setFormData}
          handleSubmit={handleSave}
          handleCancel={() => setShowModal(false)}
          loading={loading}
          isEditing={!!editingItem}
        />
      </EnhancedModal>
    </div>
  );
};

export default SuppliersPage;

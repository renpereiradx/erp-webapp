import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import useSupplierStore from '../store/useSupplierStore';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DataState from '../components/ui/DataState';
import SupplierListItem from '../components/suppliers/SupplierListItem';
import SupplierForm from '../components/suppliers/SupplierForm';

const SuppliersPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const { suppliers, loading, error, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier, clearError } = useSupplierStore();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tax_id: '' });

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

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
        <Button onClick={handleCreate} className={styles.button('primary')}><Plus className="w-4 h-4 mr-2" />{t('supplier.action.create', 'Nuevo Proveedor')}</Button>
      </div>

      {suppliers.length === 0 ? (
        <DataState variant="empty" title={t('supplier.empty.title', 'No hay proveedores')} message={t('supplier.empty.message', 'Crea tu primer proveedor para empezar.')} actionLabel={t('supplier.action.create', 'Crear Proveedor')} onAction={handleCreate} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map(supplier => (
            <SupplierListItem key={supplier.id} supplier={supplier} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`p-6 max-w-md w-full ${styles.card()}`}>
            <h2 className={styles.header('h2')}>{editingItem ? t('supplier.modal.edit', 'Editar Proveedor') : t('supplier.modal.create', 'Crear Proveedor')}</h2>
            <div className="mt-4">
              <SupplierForm 
                formData={formData}
                setFormData={setFormData}
                handleSubmit={handleSave}
                handleCancel={() => setShowModal(false)}
                loading={loading}
                isEditing={!!editingItem}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;

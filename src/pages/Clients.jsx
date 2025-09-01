import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
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
    clients, loading, error, fetchClients, createClient, updateClient, deleteClient, clearError
  } = useClientStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tax_id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Telemetría de errores del store
  useEffect(() => {
    if (error) {
      telemetry.record('clients.error.store', { message: error });
    }
  }, [error]);

  // Filtrar clientes localmente para funcionalidad rica
  const filteredClients = clients.filter(client =>
    (client.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.contact?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.address?.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.metadata?.type || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

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

      {/* Búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('client.search.placeholder', 'Buscar por nombre, email, ciudad o tipo...')}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className={`pl-10 ${styles.input()}`}
        />
      </div>

      {clients.length === 0 ? (
        <DataState variant="empty" title={t('client.empty.title', 'No hay clientes')} message={t('client.empty.message', 'Crea tu primer cliente para empezar.')} actionLabel={t('client.action.create', 'Crear Cliente')} onAction={handleCreate} />
      ) : (
        <>
          {/* Estadísticas rápidas */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-primary">{filteredClients.length}</div>
              <div className="text-sm text-muted-foreground">
                {searchTerm ? `Encontrados (${clients.length} total)` : 'Total Clientes'}
              </div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-red-600">{filteredClients.filter(c => c.metadata?.priority === 'high').length}</div>
              <div className="text-sm text-muted-foreground">Alta Prioridad</div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-blue-600">{new Set(filteredClients.map(c => c.address?.city)).size}</div>
              <div className="text-sm text-muted-foreground">Ciudades</div>
            </div>
            <div className={`${styles.card('p-4 text-center')}`}>
              <div className="text-2xl font-bold text-purple-600">{new Set(filteredClients.map(c => c.metadata?.type)).size}</div>
              <div className="text-sm text-muted-foreground">Tipos</div>
            </div>
          </div>

          {/* Resultados de búsqueda */}
          {filteredClients.length === 0 ? (
            <DataState 
              variant="empty" 
              title={t('client.search.empty', 'No se encontraron clientes')} 
              message={t('client.search.message', 'Intenta con otros términos de búsqueda')} 
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredClients.map(client => (
                <ClientListItem key={client.id} client={client} onEdit={handleEdit} onDelete={handleDelete} onView={setViewingClient} />
              ))}
            </div>
          )}
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

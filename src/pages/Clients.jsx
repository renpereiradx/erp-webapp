import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import DataState from '../components/ui/DataState';
import Pagination from '../components/ui/Pagination';
import ClientListItem from '../components/clients/ClientListItem';
import ClientDetailModal from '../components/clients/ClientDetailModal';
import ClientForm from '../components/clients/ClientForm';
import { useI18n } from '../lib/i18n';
import useClientStore from '../store/useClientStore';
import ClientStats from '../components/ClientStats';

const ClientsPage = () => {
  const { t } = useI18n();
  const {
    clients, loading, error, fetchClients, createClient, updateClient, deleteClient, clearError,
    page, totalPages, setPage, searchTerm, setSearchTerm, search
  } = useClientStore();
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', tax_id: '' });

  useEffect(() => {
    fetchClients();
  }, []); // Carga inicial

  const handleSearch = (e) => {
    e.preventDefault();
    search();
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
    const result = editingItem ? await updateClient(editingItem.id, clientData) : await createClient(clientData);
    if (result.success) {
      setShowEditModal(false);
    }
  };
  
  const handleDelete = async (item) => {
    if (window.confirm(`¿Eliminar ${item.name}?`)) {
      await deleteClient(item.id);
    }
  };

  if (error) {
    return <DataState variant="error" title={t('client.error.title', 'Error')} message={error} onRetry={() => { clearError(); fetchClients(); }} />;
  }

  return (
    <div className="space-y-6">
      <ClientStats />
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black uppercase tracking-wide">{t('client.title', 'Clientes')}</h1>
        <Button onClick={handleCreate} className="bg-lime-400 text-black font-bold"><Plus className="w-4 h-4 mr-2" />{t('client.action.create', 'Nuevo Cliente')}</Button>
      </div>
      
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder={t('client.search.placeholder', 'Buscar por nombre...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 max-w-md"
        />
        <Button type="submit" variant="outline" className="border-2 border-black font-bold">{t('action.search', 'Buscar')}</Button>
      </form>

      {loading && clients.length === 0 ? (
        <DataState variant="loading" skeletonVariant="list" />
      ) : clients.length === 0 ? (
        <DataState variant="empty" title={t('client.empty.title', 'No se encontraron clientes')} message={t('client.empty.message', 'Intenta con otra búsqueda o crea un nuevo cliente.')} actionLabel={t('client.action.create', 'Crear Cliente')} onAction={handleCreate} />
      ) : (
        <>
          <div className="grid gap-4">
            {clients.map(client => (
              <ClientListItem 
                key={client.id} 
                client={client} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onView={setViewingClient} 
              />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
      
      {viewingClient && (
        <ClientDetailModal client={viewingClient} onClose={() => setViewingClient(null)} />
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-black mb-4">{editingItem ? t('client.modal.edit', 'EDITAR CLIENTE') : t('client.modal.create', 'CREAR CLIENTE')}</h2>
            <ClientForm 
              formData={formData} 
              setFormData={setFormData} 
              handleSubmit={handleSave} 
              handleCancel={() => setShowEditModal(false)} 
              loading={loading} 
              isEditing={!!editingItem} 
            />
            {error && <p className="text-red-600 text-sm mt-2 font-bold">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;


import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Plus, Search, Edit, Trash2, User, Users, Briefcase } from 'lucide-react';
import useClientStore from '@/store/useClientStore';
import useSupplierStore from '@/store/useSupplierStore';
import ClientModal from '@/components/ClientModal';
import DeleteClientModal from '@/components/DeleteClientModal';
import SupplierModal from '@/components/SupplierModal';
import DeleteSupplierModal from '@/components/DeleteSupplierModal';
import ToastContainer from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ManagementPage = () => {
  const { theme } = useTheme();
  const { toasts, success, error: showError, removeToast } = useToast();

  // Estados para Clientes
  const { clients, loading: loadingClients, error: errorClients, fetchClients, deleteClient } = useClientStore();
  const [clientSearch, setClientSearch] = useState('');
  const [localClientSearch, setLocalClientSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [editingClient, setEditingClient] = useState(null);

  // Estados para Proveedores
  const { suppliers, loading: loadingSuppliers, error: errorSuppliers, fetchSuppliers, deleteSupplier } = useSupplierStore();
  const [supplierSearch, setSupplierSearch] = useState('');
  const [localSupplierSearch, setLocalSupplierSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showDeleteSupplierModal, setShowDeleteSupplierModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchSuppliers();
  }, [fetchClients, fetchSuppliers]);

  const renderContent = (type, data, loading, error, apiSearchTerm, setApiSearchTerm, localSearchTerm, setLocalSearchTerm, fetchFunction, openCreateModal) => {
    const handleApiSearch = () => {
      fetchFunction({ search: apiSearchTerm });
    };

    const handleClearSearch = () => {
      setApiSearchTerm('');
      setLocalSearchTerm('');
      fetchFunction();
    };

    const dataAsArray = Array.isArray(data) ? data : [];
    const currentData = dataAsArray.filter(item => {
      const searchTerm = localSearchTerm.toLowerCase();
      return (
        (item.name && item.name.toLowerCase().includes(searchTerm)) ||
        (item.last_name && item.last_name.toLowerCase().includes(searchTerm)) ||
        (item.document_id && item.document_id.toLowerCase().includes(searchTerm)) ||
        (item.contact && item.contact.toLowerCase().includes(searchTerm))
      );
    });

    if (loading) return <div className="text-center py-20"><Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" /><p>Cargando...</p></div>;
    if (error) return <div className="text-center py-20 text-destructive"><p>Error: {error}</p></div>;

    return (
      <>
        <div className="p-4 bg-card border-b border-border">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-4">
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder={`Buscar ${type} por nombre, documento o contacto...`}
                value={apiSearchTerm}
                onChange={(e) => setApiSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleApiSearch} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
                Buscar
              </button>
              <button onClick={handleClearSearch} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md">
                Limpiar
              </button>
              <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
                <Plus className="w-4 h-4" />
                Agregar {type}
              </button>
            </div>
          </div>
          {(data || []).length > 0 && (
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder={`Filtrar ${type} localmente...`}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
              />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {currentData.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p>No se encontraron {type}.</p>
            </div>
          ) : (
            currentData.map(item => (
              <div key={item.id} className="p-6 bg-card border border-border rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                      {type === 'Clientes' ? <User className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold">{item.name} {item.last_name || ''}</h3>
                      <p className="text-sm text-muted-foreground">{item.document_id || item.contact}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${item.status ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => type === 'Clientes' ? setEditingClient(item) & setShowClientModal(true) : setEditingSupplier(item) & setShowSupplierModal(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md">
                    <Edit className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => type === 'Clientes' ? setSelectedClient(item) & setShowDeleteClientModal(true) : setSelectedSupplier(item) & setShowDeleteSupplierModal(true)} className="flex items-center justify-center px-3 py-1.5 text-sm border border-destructive text-destructive rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-primary mb-4 text-4xl font-bold">Gestión de Clientes y Proveedores</h1>
        </header>
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          </TabsList>
          <TabsContent value="clients">
            {renderContent(
              'Clientes',
              clients,
              loadingClients,
              errorClients,
              clientSearch,
              setClientSearch,
              localClientSearch,
              setLocalClientSearch,
              fetchClients,
              () => setShowClientModal(true)
            )}
          </TabsContent>
          <TabsContent value="suppliers">
            {renderContent(
              'Proveedores',
              suppliers,
              loadingSuppliers,
              errorSuppliers,
              supplierSearch,
              setSupplierSearch,
              localSupplierSearch,
              setLocalSupplierSearch,
              fetchSuppliers,
              () => setShowSupplierModal(true)
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modales */}
      <ClientModal isOpen={showClientModal} onClose={() => setShowClientModal(false)} client={editingClient} onSuccess={() => { fetchClients(); setShowClientModal(false); success('Cliente guardado'); }} />
      <DeleteClientModal isOpen={showDeleteClientModal} onClose={() => setShowDeleteClientModal(false)} client={selectedClient} onConfirm={async () => { await deleteClient(selectedClient.id); fetchClients(); setShowDeleteClientModal(false); success('Cliente eliminado'); }} loading={loadingClients} />
      <SupplierModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} supplier={editingSupplier} onSuccess={() => { fetchSuppliers(); setShowSupplierModal(false); success('Proveedor guardado'); }} />
      <DeleteSupplierModal isOpen={showDeleteSupplierModal} onClose={() => setShowDeleteSupplierModal(false)} supplier={selectedSupplier} onConfirm={async () => { await deleteSupplier(selectedSupplier.id); fetchSuppliers(); setShowDeleteSupplierModal(false); success('Proveedor eliminado'); }} loading={loadingSuppliers} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
};

export default ManagementPage;

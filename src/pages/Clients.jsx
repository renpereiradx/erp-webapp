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

const getButtonStyles = (theme, variant = 'primary') => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    if (isNeoBrutalism) return { primary: { background: 'var(--brutalist-lime)', color: '#000000', border: '3px solid var(--border)', borderRadius: '0px', padding: '12px 24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.025em', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', transition: 'all 150ms ease', cursor: 'pointer' }, secondary: { background: 'var(--background)', color: 'var(--foreground)', border: '3px solid var(--border)', borderRadius: '0px', padding: '12px 24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.025em', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', transition: 'all 150ms ease', cursor: 'pointer' } }[variant];
    return { padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: variant === 'primary' ? 'none' : '1px solid var(--border)', background: variant === 'primary' ? 'var(--primary)' : 'var(--background)', color: variant === 'primary' ? 'var(--primary-foreground)' : 'var(--foreground)', transition: 'all 150ms ease' };
};
const getBadgeStyles = (theme, status) => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    const backgroundColor = status === true ? (isNeoBrutalism ? 'var(--brutalist-lime)' : 'var(--success)') : (isNeoBrutalism ? 'var(--brutalist-pink)' : 'var(--destructive)');
    return { background: backgroundColor, color: isNeoBrutalism ? '#000000' : 'white', border: isNeoBrutalism ? '2px solid var(--border)' : 'none', borderRadius: isNeoBrutalism ? '0px' : '4px', textTransform: isNeoBrutalism ? 'uppercase' : 'none', fontWeight: isNeoBrutalism ? 'bold' : '500', fontSize: '0.75rem', padding: isNeoBrutalism ? '8px 12px' : '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: '80px', textAlign: 'center' };
};

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

  const handleButtonHover = (e) => { if (isNeoBrutalism) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)'; } };
  const handleButtonLeave = (e) => { if (isNeoBrutalism) { e.target.style.transform = 'translate(0px, 0px)'; e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'; } };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <div className={`text-muted-foreground ${themeHeader('h2')}`}>
            {isNeoBrutalism ? 'BUSCANDO...' : 'Buscando...'}
          </div>
        </div>
      );
    }

  if (error) {
      return (
        <div className={card('text-center py-20 p-6')}>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <p className={`text-destructive mb-4 ${themeHeader('h2')}`}>{isNeoBrutalism ? 'ERROR' : 'Error'}</p>
          <p className={`text-muted-foreground mb-4 ${themeLabel()}`}>{error}</p>
          <button className={themeButton('primary')} onClick={() => searchClients(lastSearchTerm)} style={getButtonStyles(theme, 'primary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'REINTENTAR' : 'Reintentar'}</button>
        </div>
      );
    }

    if (clients.length === 0 && apiSearchTerm.trim() === '') {
      return (
        <div className={card('text-center py-20 p-6')}>
          <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className={`text-muted-foreground mb-4 ${themeHeader('h2')}`}>{isNeoBrutalism ? 'INICIA UNA BÚSQUEDA' : 'Inicia una Búsqueda'}</p>
          <p className={`text-muted-foreground ${themeLabel()}`}>{isNeoBrutalism ? 'UTILIZA LA BARRA SUPERIOR PARA ENCONTRAR CLIENTES' : 'Utiliza la barra superior para encontrar clientes.'}</p>
        </div>
      );
    }

    if (filteredClients.length === 0) {
        return (
            <div className={card('text-center py-20 p-6')}>
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className={`text-muted-foreground mb-4 ${themeHeader('h2')}`}>{isNeoBrutalism ? 'SIN RESULTADOS' : 'Sin Resultados'}</p>
                <p className={`text-muted-foreground ${themeLabel()}`}>{isNeoBrutalism ? `NO SE ENCONTRARON CLIENTES PARA TU FILTRO` : `No se encontraron clientes para tu filtro`}</p>
            </div>
        );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className={card('hover:shadow-lg transition-shadow p-6 flex flex-col justify-between')}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className={`${themeHeader('h3')} mb-2 truncate`}>{client.name} {client.last_name || ''}</h3>
                                <div style={getBadgeStyles(theme, !!client.status)}>{!!client.status ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}<span>{!!client.status ? (isNeoBrutalism ? 'ACTIVO' : 'Activo') : (isNeoBrutalism ? 'INACTIVO' : 'Inactivo')}</span></div>
              </div>
              <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>DOCUMENTO:</span><span className={themeLabel()}>{client.document_id || 'N/A'}</span></div>
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>CONTACTO:</span><span className={themeLabel()}>{client.contact || 'N/A'}</span></div>
                  <div className="flex justify-between text-sm"><span className={`text-muted-foreground ${themeLabel()}`}>REGISTRO:</span><span className={themeLabel()}>{new Date(client.created_at).toLocaleDateString()}</span></div>
                </div>
            </div>
            <div className="flex gap-2 mt-auto">
              <button onClick={() => handleViewClient(client)} style={{ ...getButtonStyles(theme, 'secondary'), flex: 1, padding: '8px 12px', fontSize: '0.75rem' }} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><Eye className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'VER' : 'Ver'}</button>
              <button onClick={() => handleEditClient(client)} style={{ ...getButtonStyles(theme, 'primary'), flex: 1, padding: '8px 12px', fontSize: '0.75rem' }} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><Edit className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'EDITAR' : 'Editar'}</button>
              <button onClick={() => handleDeleteClient(client)} style={{ ...getButtonStyles(theme, 'secondary'), background: 'var(--destructive)', color: 'var(--destructive-foreground)', padding: '8px 12px' }} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center py-8">
          <h1 className={`${themeHeader('h1')} text-primary mb-4`}>{isNeoBrutalism ? 'GESTIÓN DE CLIENTES' : 'Gestión de Clientes'}</h1>
          <p className={`text-muted-foreground max-w-2xl mx-auto mb-8 ${themeLabel()}`}>{isNeoBrutalism ? 'BUSCA, CREA Y ADMINISTRA TUS CLIENTES EFICIENTEMENTE' : 'Busca, crea y administra tus clientes eficientemente.'}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className={themeButton('primary')} style={getButtonStyles(theme, 'primary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave} onClick={handleCreateClient}><Plus className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'NUEVO CLIENTE' : 'Nuevo Cliente'}</button>
            <button className={themeButton('secondary')} style={getButtonStyles(theme, 'secondary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><BarChart3 className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}</button>
          </div>
        </header>

        <section className={card('p-6')}>
          <div className="mb-6">
            <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'BUSCAR EN BASE DE DATOS' : 'Buscar en Base de Datos'}</div>
            <div className="flex gap-3 mb-4">
              <Input
                className={themeInput()}
                leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                type="text"
                placeholder={isNeoBrutalism ? 'BUSCAR POR NOMBRE, DOCUMENTO O ID...' : 'Buscar por nombre, documento o ID...'}
                value={apiSearchTerm}
                onChange={(e) => setApiSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleApiSearch()}
              />
              <button className={themeButton('primary')} onClick={handleApiSearch} disabled={!apiSearchTerm} style={{...getButtonStyles(theme, 'primary'), padding: '12px 24px'}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'BUSCAR' : 'Buscar'}</button>
              <button className={themeButton('secondary')} onClick={handleClearSearch} style={{...getButtonStyles(theme, 'secondary'), padding: '12px 24px'}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'LIMPIAR' : 'Limpiar'}</button>
            </div>
            <div className="flex items-center gap-3"><label htmlFor="pageSize" className={themeLabel()}>CLIENTES POR PÁGINA:</label><select id="pageSize" value={pageSize} onChange={(e) => handlePageSizeChange(e.target.value)} className={`px-3 py-2 bg-background ${themeInput()}`} style={isNeoBrutalism ? { border: '3px solid var(--border)', borderRadius: '0px', textTransform: 'uppercase', fontWeight: '600' } : {}}><option value="10">10</option><option value="20">20</option><option value="50">50</option></select></div>
          </div>

          {clients && clients.length > 0 && (
            <div className="border-t pt-6">
              <div className={`${themeHeader('h3')} mb-3`}>{isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : 'Filtrar Resultados Actuales'}</div>
              <div className="grid md:grid-cols-3 gap-4">
              <Input
                className={themeInput()}
                  leftIcon={<Filter className="w-5 h-5 text-muted-foreground" />}
                type="text"
                  placeholder={isNeoBrutalism ? 'FILTRAR POR NOMBRE...' : 'Filtrar por nombre...'}
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className={`
                    flex h-9 w-full min-w-0 rounded-md border bg-background px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none
                    focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
                    ${isNeoBrutalism ? 'border-[3px] border-[var(--border)] rounded-none uppercase font-semibold' : 'border-input'}
                  `}>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los Estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-center p-3" style={isNeoBrutalism ? {border: '3px solid var(--border)'} : {}}><div className={themeHeader('h2')}>{filteredClients.length}</div><div className={themeLabel()}>CLIENTES MOSTRADOS</div></div>
              </div>
            </div>
          )}
        </section>

        <section>{renderMainContent()}</section>

        {totalClients > 0 && totalPages > 1 && (
          <footer className="text-center py-8">
            <div className="flex flex-wrap justify-center gap-4 mb-4"><div className={themeLabel()}>{`Mostrando ${filteredClients.length} de ${totalClients} clientes`}</div></div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <button className={themeButton('secondary')} onClick={() => handlePageChange(1)} disabled={currentPage <= 1 || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 12px', opacity: currentPage <= 1 ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Primera</button>
              <button className={themeButton('secondary')} onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 16px', opacity: currentPage <= 1 ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Anterior</button>
              <span className={themeLabel()}>{`Página ${currentPage} de ${totalPages}`}</span>
              <button className={themeButton('secondary')} onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 16px', opacity: currentPage >= totalPages ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Siguiente</button>
              <button className={themeButton('secondary')} onClick={() => handlePageChange(totalPages)} disabled={currentPage >= totalPages || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 12px', opacity: currentPage >= totalPages ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Última</button>
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

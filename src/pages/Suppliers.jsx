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
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// NOTE: Styling functions are kept consistent with other pages like Clients.jsx
const getCardStyles = (theme) => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    if (isNeoBrutalism) return { background: 'var(--background)', border: '4px solid var(--border)', borderRadius: '0px', boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)', transition: 'all 200ms ease', overflow: 'hidden', padding: '24px' };
    return { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)', transition: 'all 200ms ease', overflow: 'hidden', padding: '24px' };
};
const getTypographyStyles = (theme, level = 'base') => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    if (isNeoBrutalism) return { title: { fontSize: '3.5rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '1.1', textShadow: '3px 3px 0px rgba(0,0,0,0.8)', marginBottom: '1.5rem' }, heading: { fontSize: '1.875rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.025em', lineHeight: '1.2', marginBottom: '1rem' }, subheading: { fontSize: '1.25rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.025em', marginBottom: '0.5rem' }, base: { fontSize: '1rem', fontWeight: '600', letterSpacing: '0.01em' }, small: { fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.01em' } }[level] || { fontSize: '1rem', fontWeight: '600' };
    return { title: { fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }, heading: { fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.75rem' }, subheading: { fontSize: '1.125rem', fontWeight: '500', marginBottom: '0.5rem' }, base: { fontSize: '0.875rem', fontWeight: '400' }, small: { fontSize: '0.75rem', fontWeight: '400' } }[level] || { fontSize: '0.875rem' };
};
const getButtonStyles = (theme, variant = 'primary') => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    if (isNeoBrutalism) return { primary: { background: 'var(--brutalist-lime)', color: '#000000', border: '3px solid var(--border)', borderRadius: '0px', padding: '12px 24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.025em', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', transition: 'all 150ms ease', cursor: 'pointer' }, secondary: { background: 'var(--background)', color: 'var(--foreground)', border: '3px solid var(--border)', borderRadius: '0px', padding: '12px 24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.025em', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', transition: 'all 150ms ease', cursor: 'pointer' } }[variant];
    return { padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', border: variant === 'primary' ? 'none' : '1px solid var(--border)', background: variant === 'primary' ? 'var(--primary)' : 'var(--background)', color: variant === 'primary' ? 'var(--primary-foreground)' : 'var(--foreground)', transition: 'all 150ms ease' };
};
const getBadgeStyles = (theme, status) => {
    const isNeoBrutalism = theme?.includes('neo-brutalism');
    const backgroundColor = status ? (isNeoBrutalism ? 'var(--brutalist-lime)' : 'var(--success)') : (isNeoBrutalism ? 'var(--brutalist-pink)' : 'var(--destructive)');
    return { background: backgroundColor, color: isNeoBrutalism ? '#000000' : 'white', border: isNeoBrutalism ? '2px solid var(--border)' : 'none', borderRadius: isNeoBrutalism ? '0px' : '4px', textTransform: isNeoBrutalism ? 'uppercase' : 'none', fontWeight: isNeoBrutalism ? 'bold' : '500', fontSize: '0.75rem', padding: isNeoBrutalism ? '8px 12px' : '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: '80px', textAlign: 'center' };
};

const SuppliersPage = () => {
  const { theme } = useTheme();
  const { toasts, success, error: showError, removeToast } = useToast();
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

  const filteredSuppliers = (suppliers || []).filter(supplier => {
    const search = localSearchTerm.toLowerCase();
    const matchesSearch = (supplier.name || '').toLowerCase().includes(search) || 
                          (supplier.tax_id || '').toLowerCase().includes(search) ||
                          (typeof supplier.contact_info === 'string' && supplier.contact_info.toLowerCase().includes(search));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && supplier.status) || (statusFilter === 'inactive' && !supplier.status);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    clearSuppliers();
  }, []);

  const handleSearch = () => {
    if (searchTerm.trim() !== '') {
      fetchSuppliers(1, 10, searchTerm);
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
    await deleteSupplier(selectedSupplier.id);
    setShowDeleteModal(false);
    success('Proveedor eliminado');
  };

  const handleModalSuccess = () => {
    setShowSupplierModal(false);
    fetchSuppliers(pagination.current_page || 1, pagination.per_page || 10, searchTerm);
    success('Operación de proveedor completada.');
  };

  const handleButtonHover = (e) => { if (isNeoBrutalism) { e.target.style.transform = 'translate(-2px, -2px)'; e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)'; } };
  const handleButtonLeave = (e) => { if (isNeoBrutalism) { e.target.style.transform = 'translate(0px, 0px)'; e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)'; } };

  const renderMainContent = () => {
    if (loading && !suppliers.length) {
      return (
        <div className="text-center py-20"><Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground animate-pulse" /><p style={getTypographyStyles(theme, 'heading')}>{isNeoBrutalism ? 'CARGANDO...' : 'Cargando...'}</p></div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 p-6" style={getCardStyles(theme)}>
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4" style={getTypographyStyles(theme, 'heading')}>{isNeoBrutalism ? 'ERROR' : 'Error'}</p>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button onClick={handleSearch} style={getButtonStyles(theme, 'primary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'REINTENTAR' : 'Reintentar'}</button>
        </div>
      );
    }

    if (suppliers.length === 0 && searchTerm.trim() === '') {
      return (
        <div className="text-center py-20 p-6" style={getCardStyles(theme)}>
          <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4" style={getTypographyStyles(theme, 'heading')}>{isNeoBrutalism ? 'SIN PROVEEDORES' : 'Sin Proveedores'}</p>
          <p className="text-muted-foreground" style={getTypographyStyles(theme, 'base')}>{isNeoBrutalism ? 'REALIZA UNA BÚSQUEDA PARA EMPEZAR' : 'Realiza una búsqueda para empezar.'}</p>
        </div>
      );
    }
    
    if (filteredSuppliers.length === 0 && searchTerm) {
        return (
            <div className="text-center py-20 p-6" style={getCardStyles(theme)}>
                <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4" style={getTypographyStyles(theme, 'heading')}>{isNeoBrutalism ? 'SIN RESULTADOS' : 'Sin Resultados'}</p>
                <p className="text-muted-foreground" style={getTypographyStyles(theme, 'base')}>{isNeoBrutalism ? `NO SE ENCONTRARON PROVEEDORES PARA "${searchTerm.toUpperCase()}"` : `No se encontraron proveedores para "${searchTerm}"`}</p>
            </div>
        );
    }

    const parseContactInfo = (contactInfo) => {
      if (!contactInfo) return {};
      if (typeof contactInfo === 'object') return contactInfo;
      try {
        return JSON.parse(contactInfo);
      } catch (error) {
        return {};
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => {
          if (!supplier) return null;
          const contactInfo = parseContactInfo(supplier.contact_info);
          return (
            <div key={supplier.id} style={{...getCardStyles(theme), display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}} className="hover:shadow-lg transition-shadow">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold mb-2 truncate" style={getTypographyStyles(theme, 'subheading')}>{supplier.name}</h3>
                  <div style={getBadgeStyles(theme, supplier.status)}>{supplier.status ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}<span>{supplier.status ? (isNeoBrutalism ? 'ACTIVO' : 'Activo') : (isNeoBrutalism ? 'INACTIVO' : 'Inactivo')}</span></div>
                </div>
                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm"><span className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>RUC:</span><span style={getTypographyStyles(theme, 'small')}>{supplier.tax_id || 'N/A'}</span></div>
                  {contactInfo.phone && <div className="flex justify-between text-sm"><span className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>TELÉFONO:</span><span style={getTypographyStyles(theme, 'small')}>{contactInfo.phone}</span></div>}
                  {contactInfo.fax && <div className="flex justify-between text-sm"><span className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>FAX:</span><span style={getTypographyStyles(theme, 'small')}>{contactInfo.fax}</span></div>}
                  {contactInfo.address && <div className="flex justify-between text-sm"><span className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>DIRECCIÓN:</span><span style={getTypographyStyles(theme, 'small')}>{contactInfo.address}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>REGISTRO:</span><span style={getTypographyStyles(theme, 'small')}>{new Date(supplier.created_at).toLocaleDateString()}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleEditSupplier(supplier)} style={{ ...getButtonStyles(theme, 'primary'), flex: 1, padding: '8px 12px', fontSize: '0.75rem' }} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><Edit className="w-4 h-4 mr-1" />{isNeoBrutalism ? 'EDITAR' : 'Editar'}</button>
                <button onClick={() => handleDeleteSupplier(supplier)} style={{ ...getButtonStyles(theme, 'secondary'), background: 'var(--destructive)', color: 'var(--destructive-foreground)', padding: '8px 12px' }} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center py-8">
          <h1 className="text-primary mb-4" style={getTypographyStyles(theme, 'title')}>{isNeoBrutalism ? 'GESTIÓN DE PROVEEDORES' : 'Gestión de Proveedores'}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8" style={getTypographyStyles(theme, 'base')}>{isNeoBrutalism ? 'BUSCA, CREA Y ADMINISTRA TUS PROVEEDORES' : 'Busca, crea y administra tus proveedores.'}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button style={getButtonStyles(theme, 'primary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave} onClick={handleCreateSupplier}><Plus className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'NUEVO PROVEEDOR' : 'Nuevo Proveedor'}</button>
            <button style={getButtonStyles(theme, 'secondary')} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}><BarChart3 className="w-5 h-5 mr-2" />{isNeoBrutalism ? 'ANALYTICS' : 'Analytics'}</button>
          </div>
        </header>

        <section className="p-6" style={getCardStyles(theme)}>
          <div className="mb-6">
            <div className="mb-3" style={getTypographyStyles(theme, 'subheading')}>{isNeoBrutalism ? 'BUSCAR PROVEEDORES' : 'Buscar Proveedores'}</div>
            <div className="flex gap-3 mb-4">
              <Input
                leftIcon={<Search className="w-5 h-5 text-muted-foreground" />}
                type="text"
                placeholder={isNeoBrutalism ? 'BUSCAR POR NOMBRE O CONTACTO...' : 'Buscar por nombre o contacto...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} disabled={!searchTerm} style={{...getButtonStyles(theme, 'primary'), padding: '12px 24px'}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'BUSCAR' : 'Buscar'}</button>
              <button onClick={handleClearSearch} style={{...getButtonStyles(theme, 'secondary'), padding: '12px 24px'}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>{isNeoBrutalism ? 'LIMPIAR' : 'Limpiar'}</button>
            </div>
          </div>

          {suppliers && suppliers.length > 0 && (
            <div className="border-t pt-6">
              <div className="mb-3" style={getTypographyStyles(theme, 'subheading')}>{isNeoBrutalism ? 'FILTRAR RESULTADOS ACTUALES' : 'Filtrar Resultados Actuales'}</div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
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
                <div className="text-center p-3" style={isNeoBrutalism ? {border: '3px solid var(--border)'} : {}}><div style={getTypographyStyles(theme, 'heading')}>{filteredSuppliers.length}</div><div style={getTypographyStyles(theme, 'small')}>PROVEEDORES MOSTRADOS</div></div>
              </div>
            </div>
          )}
        </section>

        <section>{renderMainContent()}</section>

        {pagination && pagination.total_pages > 1 && (
          <footer className="text-center py-8">
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <button onClick={() => handlePageChange(1)} disabled={pagination.current_page <= 1 || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 12px', opacity: pagination.current_page <= 1 ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Primera</button>
              <button onClick={() => handlePageChange(pagination.current_page - 1)} disabled={pagination.current_page <= 1 || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 16px', opacity: pagination.current_page <= 1 ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Anterior</button>
              <span style={getTypographyStyles(theme, 'small')}>{`Página ${pagination.current_page} de ${pagination.total_pages}`}</span>
              <button onClick={() => handlePageChange(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.total_pages || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 16px', opacity: pagination.current_page >= pagination.total_pages ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Siguiente</button>
              <button onClick={() => handlePageChange(pagination.total_pages)} disabled={pagination.current_page >= pagination.total_pages || loading} style={{...getButtonStyles(theme, 'secondary'), padding: '8px 12px', opacity: pagination.current_page >= pagination.total_pages ? 0.5 : 1}} onMouseEnter={handleButtonHover} onMouseLeave={handleButtonLeave}>Última</button>
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

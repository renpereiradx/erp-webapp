/**
 * Página de Clientes del sistema ERP - Multi-tema
 * Soporte para Neo-Brutalism, Material Design y Fluent Design
 * Incluye listado, filtros, búsqueda y gestión de clientes
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Building,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useClientStore from '@/store/useClientStore';

const Clients = () => {
  const { theme } = useTheme();
  const {
    clients,
    loading,
    error,
    pagination,
    filters,
    fetchClients,
    deleteClient,
    setFilters,
    clearError,
  } = useClientStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedClients, setSelectedClients] = useState([]);

  // Determinar el tema activo
  const isNeoBrutalist = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  // Helper functions para generar clases según el tema activo
  const getTitleClass = (size = 'title') => {
    if (isNeoBrutalist) {
      switch(size) {
        case 'display': return 'font-black uppercase tracking-wide text-4xl';
        case 'large-title': return 'font-black uppercase tracking-wide text-3xl';
        case 'title': return 'font-black uppercase tracking-wide text-xl';
        case 'subtitle': return 'font-black uppercase tracking-wide text-lg';
        case 'body-large': return 'font-bold uppercase tracking-wide text-base';
        case 'body': return 'font-bold uppercase tracking-wide text-sm';
        case 'caption': return 'font-bold uppercase tracking-wide text-xs';
        default: return 'font-black uppercase tracking-wide';
      }
    }
    if (isFluent) {
      switch(size) {
        case 'display': return 'fluent-display';
        case 'large-title': return 'fluent-large-title';
        case 'title': return 'fluent-title';
        case 'subtitle': return 'fluent-subtitle';
        case 'body-large': return 'fluent-body-large';
        case 'body': return 'fluent-body';
        case 'caption': return 'fluent-caption';
        case 'caption-strong': return 'fluent-caption-strong';
        default: return 'fluent-title';
      }
    }
    if (isMaterial) {
      switch(size) {
        case 'display': return 'material-display';
        case 'large-title': return 'material-headline-large';
        case 'title': return 'material-headline-medium';
        case 'subtitle': return 'material-headline-small';
        case 'body-large': return 'material-body-large';
        case 'body': return 'material-body-medium';
        case 'caption': return 'material-body-small';
        default: return 'material-headline-medium';
      }
    }
    return 'font-bold';
  };

  const getCardClass = () => {
    if (isNeoBrutalist) return 'border-4 border-foreground shadow-neo-brutal';
    if (isFluent) return 'fluent-elevation-2 fluent-radius-medium fluent-motion-standard';
    if (isMaterial) return 'material-card-elevated';
    return 'border border-border rounded-lg shadow-lg';
  };

  const getButtonClass = () => {
    if (isFluent) return 'fluent-elevation-2 fluent-radius-small';
    if (isMaterial) return 'material-button-elevated';
    return '';
  };

  const getInputClass = () => {
    if (isFluent) return 'fluent-radius-small';
    if (isMaterial) return 'material-input';
    return '';
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Datos para las estadísticas (usar los clientes del store)
  const statsData = {
    total: pagination.total || 0,
    active: clients.filter(c => c.status === 'active').length,
    companies: clients.filter(c => c.type === 'empresa').length,
    individuals: clients.filter(c => c.type === 'particular').length,
  };

  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
    fetchClients({ search: searchTerm });
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { [filterName]: value };
    setFilters(newFilters);
    fetchClients(newFilters);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        await deleteClient(clientId);
        // Mostrar notificación de éxito
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
      }
    }
  };

  const getClientTypeIcon = (type) => {
    return type === 'empresa' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getStatusBadge = (status) => {
    if (isFluent) {
      const activeClass = status === 'active' 
        ? 'fluent-radius-small text-white'
        : 'fluent-radius-small text-white';
      const bgStyle = status === 'active' 
        ? { backgroundColor: 'var(--fluent-success-primary)' }
        : { backgroundColor: 'var(--fluent-neutral-grey-100)' };
      return (
        <span 
          className={`px-2 py-1 text-xs font-medium ${activeClass} ${getTitleClass('caption')}`}
          style={bgStyle}
        >
          {status === 'active' ? 'Activo' : 'Inactivo'}
        </span>
      );
    }
    
    const baseClasses = `px-2 py-1 rounded-full text-xs font-medium ${getTitleClass('caption')}`;
    if (status === 'active') {
      return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Activo</span>;
    }
    return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`}>Inactivo</span>;
  };

  const ClientCard = ({ client }) => (
    <Card className={`hover:shadow-lg transition-shadow duration-200 ${getCardClass()}`}>
      <CardContent className="p-6 pt-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className={`w-14 h-14 bg-gray-200 flex-shrink-0 flex items-center justify-center ${
            isFluent ? 'fluent-radius-circular fluent-elevation-1' : 'rounded-full'
          }`}>
            {getClientTypeIcon(client.type)}
          </div>
          
          {/* Información del cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className={`leading-tight mb-1 ${getTitleClass('subtitle')}`}>{client.name}</h3>
                {client.company && (
                  <p className={`text-muted-foreground mb-2 ${getTitleClass('body')}`}>{client.company}</p>
                )}
                <div className="space-y-1.5">
                  <div className={`flex items-center text-muted-foreground ${getTitleClass('caption')}`}>
                    <Mail className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className={`flex items-center text-muted-foreground ${getTitleClass('caption')}`}>
                    <Phone className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className={`flex items-center text-muted-foreground ${getTitleClass('caption')}`}>
                    <MapPin className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate">{client.address}</span>
                  </div>
                </div>
              </div>
              
              {/* Estado */}
              <div className="ml-3 flex-shrink-0 flex items-center">
                {getStatusBadge(client.status)}
              </div>
            </div>
            
            {/* Estadísticas y acciones */}
            <div className={`flex items-center justify-between pt-3 ${
              isFluent ? 'border-t' : 'border-t border-gray-100 dark:border-gray-700'
            }`} style={isFluent ? { borderColor: 'var(--fluent-neutral-grey-30)' } : {}}>
              <div className={`space-y-1 ${getTitleClass('caption')}`}>
                <p className="text-muted-foreground flex items-center">
                  <strong className="text-foreground mr-1">{client.totalOrders}</strong> pedidos
                </p>
                <p className="text-muted-foreground flex items-center">
                  <strong className="text-foreground mr-1">${client.totalSpent.toLocaleString()}</strong> gastado
                </p>
              </div>
              
              {/* Acciones */}
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" className={`h-8 w-8 p-0 flex items-center justify-center ${getButtonClass()}`}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className={`h-8 w-8 p-0 flex items-center justify-center ${getButtonClass()}`}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`h-8 w-8 p-0 flex items-center justify-center ${getButtonClass()}`}
                  onClick={() => handleDeleteClient(client.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className={`text-center ${getTitleClass('body-large')}`}>
          Cargando clientes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center text-red-500 min-h-screen flex items-center justify-center ${getTitleClass('body-large')}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={`text-foreground ${getTitleClass('large-title')}`}>
            Clientes
          </h1>
          <p className={`mt-2 text-muted-foreground ${getTitleClass('body-large')}`}>
            Gestiona tu base de clientes y sus datos
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="green" size="lg" className={getButtonClass()}>
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Total Clientes</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`h-8 w-8 flex items-center justify-center ${
                isFluent ? 'fluent-radius-small' : 'rounded-lg'
              } bg-green-100 text-green-600`}>
                <User className="h-5 w-5" />
              </div>
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Activos</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Empresas</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.companies}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={getCardClass()}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-muted-foreground" />
              <div className="ml-4">
                <p className={`text-muted-foreground ${getTitleClass('caption-strong')}`}>Particulares</p>
                <p className={`text-2xl text-foreground ${getTitleClass('title')}`}>{statsData.individuals}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card className={getCardClass()}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  className={`pl-10 ${getInputClass()}`}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={getButtonClass()}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className={`mt-4 p-4 border-t ${
              isFluent ? '' : 'border-gray-200 dark:border-gray-700'
            }`} style={isFluent ? { borderColor: 'var(--fluent-neutral-grey-30)' } : {}}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={`block mb-2 ${getTitleClass('caption-strong')}`}>Estado</label>
                  <select
                    className={`w-full p-2 border rounded-md bg-background text-foreground ${getInputClass()}`}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-2 ${getTitleClass('caption-strong')}`}>Tipo</label>
                  <select
                    className={`w-full p-2 border rounded-md bg-background text-foreground ${getInputClass()}`}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="empresa">Empresas</option>
                    <option value="particular">Particulares</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.currentPage === 1}
            onClick={() => fetchClients({ page: pagination.currentPage - 1 })}
            className={getButtonClass()}
          >
            Anterior
          </Button>
          <span className={`px-4 py-2 ${getTitleClass('body')}`}>
            Página {pagination.currentPage} de {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => fetchClients({ page: pagination.currentPage + 1 })}
            className={getButtonClass()}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
};

export default Clients;

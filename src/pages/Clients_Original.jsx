/**
 * Página de Clientes del sistema ERP
 * Demuestra el uso del store de clientes y componentes responsive
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

  // Determinar si estamos en tema neo-brutalista
  const isNeoBrutalist = theme?.includes('neo-brutalism');

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
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    if (status === 'active') {
      return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`}>Activo</span>;
    }
    return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200`}>Inactivo</span>;
  };

  const ClientCard = ({ client }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6 pt-4">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
            {getClientTypeIcon(client.type)}
          </div>
          
          {/* Información del cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg leading-tight mb-1">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground mb-2">{client.company}</p>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
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
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm space-y-1">
                <p className="text-muted-foreground flex items-center">
                  <strong className="text-foreground mr-1">{client.totalOrders}</strong> pedidos
                </p>
                <p className="text-muted-foreground flex items-center">
                  <strong className="text-foreground mr-1">${client.totalSpent.toLocaleString()}</strong> gastado
                </p>
              </div>
              
              {/* Acciones */}
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 flex items-center justify-center">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0 flex items-center justify-center"
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

  return (
    <div className="clients-page space-y-6" data-component="clients-page" data-testid="clients-page">
      {/* Header */}
      <div className="clients-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" data-component="clients-header" data-testid="clients-header">
        <div className="clients-title-section" data-component="clients-title" data-testid="clients-title">
          <h1 className={`clients-title text-3xl tracking-tight ${
            isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-bold'
          }`} data-testid="clients-title-text" style={{ color: 'var(--foreground)' }}>Clientes</h1>
          <p className={`clients-subtitle text-muted-foreground ${
            isNeoBrutalist ? 'font-bold uppercase tracking-wide' : 'font-normal'
          }`} data-testid="clients-subtitle" style={{ color: 'var(--muted-foreground)' }}>
            Gestiona tu base de clientes
          </p>
        </div>
        <Button className="clients-new-btn w-full sm:w-auto" data-testid="new-client-btn">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <Card className="clients-search-section" data-component="clients-search" data-testid="clients-search">
        <CardContent className="p-4">
          <div className="clients-search-controls flex flex-col sm:flex-row gap-4" data-component="search-controls" data-testid="search-controls">
            {/* Búsqueda */}
            <div className="clients-search-input-section flex-1" data-component="search-input-section" data-testid="search-input-section">
              <Input
                placeholder="Buscar clientes por nombre, email o empresa..."
                leftIcon={<Search className="h-4 w-4" />}
                onChange={(e) => handleSearch(e.target.value)}
                className="clients-search-input"
                data-testid="clients-search-input"
              />
            </div>
            {/* Botón de filtros */}
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="clients-filters-btn w-full sm:w-auto"
              data-testid="filters-toggle-btn"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
          
          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="clients-filters-panel mt-4 pt-4 border-t grid gap-4 sm:grid-cols-3" data-component="filters-panel" data-testid="filters-panel">
              <div className="clients-filter-type" data-component="filter-type" data-testid="filter-type">
                <label className={`clients-filter-label block text-sm font-medium mb-2 ${
                  isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'
                }`} style={{ color: 'var(--foreground)' }}>Tipo</label>
                <select 
                  className="clients-filter-select w-full p-2 border rounded-md"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--input)', 
                    color: 'var(--foreground)', 
                    border: '1px solid var(--border)' 
                  }}
                  data-testid="type-filter"
                >
                  <option value="">Todos los tipos</option>
                  <option value="individual">Individual</option>
                  <option value="empresa">Empresa</option>
                </select>
              </div>
              
              <div className="clients-filter-status" data-component="filter-status" data-testid="filter-status">
                <label className={`clients-filter-label block text-sm font-medium mb-2 ${
                  isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'
                }`} style={{ color: 'var(--foreground)' }}>Estado</label>
                <select 
                  className="clients-filter-select w-full p-2 border rounded-md"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--input)', 
                    color: 'var(--foreground)', 
                    border: '1px solid var(--border)' 
                  }}
                  data-testid="status-filter"
                >
                  <option value="">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              
              <div className="clients-filter-sort" data-component="filter-sort" data-testid="filter-sort">
                <label className={`clients-filter-label block text-sm font-medium mb-2 ${
                  isNeoBrutalist ? 'font-black uppercase tracking-wide' : 'font-medium'
                }`} style={{ color: 'var(--foreground)' }}>Ordenar por</label>
                <select 
                  className="clients-filter-select w-full p-2 border rounded-md"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  style={{ 
                    backgroundColor: 'var(--input)', 
                    color: 'var(--foreground)', 
                    border: '1px solid var(--border)' 
                  }}
                  data-testid="sort-filter"
                >
                  <option value="name">Nombre</option>
                  <option value="totalSpent">Total gastado</option>
                  <option value="totalOrders">Número de pedidos</option>
                  <option value="lastOrder">Último pedido</option>
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      <div className="clients-stats-grid">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : pagination.total}
                </p>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : statsData.individuals}
                </p>
                <p className="text-sm text-muted-foreground">Individuales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : statsData.companies}
                </p>
                <p className="text-sm text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {loading ? '...' : statsData.active}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span>Cargando clientes...</span>
              </div>
            ) : error ? (
              <div className="text-center p-8 text-destructive">
                Error: {error}
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                No se encontraron clientes
              </div>
            ) : (
              <div className="space-y-4">
                {clients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {clients.length} de {pagination.total} clientes
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled={pagination.page <= 1}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Clients;


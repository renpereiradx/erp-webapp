/**
 * Página de Clientes del sistema ERP
 * Demuestra el uso del store de clientes y componentes responsive
 * Incluye listado, filtros, búsqueda y gestión de clientes
 */

import React, { useEffect, useState } from 'react';
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

  // Datos de ejemplo para demostración
  const mockClients = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+34 612 345 678',
      company: 'Empresa ABC S.L.',
      type: 'empresa',
      status: 'active',
      address: 'Calle Mayor 123, Madrid',
      totalOrders: 15,
      totalSpent: 12450.50,
      lastOrder: '2024-01-15',
      avatar: null,
    },
    {
      id: 2,
      name: 'María García',
      email: 'maria.garcia@gmail.com',
      phone: '+34 687 654 321',
      company: null,
      type: 'individual',
      status: 'active',
      address: 'Avenida de la Paz 45, Barcelona',
      totalOrders: 8,
      totalSpent: 3250.75,
      lastOrder: '2024-01-20',
      avatar: null,
    },
    {
      id: 3,
      name: 'Carlos Rodríguez',
      email: 'carlos@techsolutions.com',
      phone: '+34 654 987 123',
      company: 'Tech Solutions Ltd.',
      type: 'empresa',
      status: 'active',
      address: 'Polígono Industrial Norte, Valencia',
      totalOrders: 25,
      totalSpent: 28750.00,
      lastOrder: '2024-01-22',
      avatar: null,
    },
    {
      id: 4,
      name: 'Ana Martínez',
      email: 'ana.martinez@hotmail.com',
      phone: '+34 698 765 432',
      company: null,
      type: 'individual',
      status: 'inactive',
      address: 'Plaza del Sol 8, Sevilla',
      totalOrders: 3,
      totalSpent: 890.25,
      lastOrder: '2023-12-10',
      avatar: null,
    },
    {
      id: 5,
      name: 'Roberto Silva',
      email: 'roberto@constructora.es',
      phone: '+34 611 222 333',
      company: 'Constructora Silva',
      type: 'empresa',
      status: 'active',
      address: 'Calle de la Construcción 77, Bilbao',
      totalOrders: 42,
      totalSpent: 85600.00,
      lastOrder: '2024-01-25',
      avatar: null,
    },
  ];

  useEffect(() => {
    // En una aplicación real, esto cargaría datos de la API
    // fetchClients();
    console.log('Cargando clientes...');
  }, []);

  const handleSearch = (searchTerm) => {
    setFilters({ search: searchTerm });
    // fetchClients({ search: searchTerm });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ [filterName]: value });
    // fetchClients({ [filterName]: value });
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
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
            {getClientTypeIcon(client.type)}
          </div>
          
          {/* Información del cliente */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{client.name}</h3>
                {client.company && (
                  <p className="text-sm text-muted-foreground">{client.company}</p>
                )}
                <div className="mt-1 space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 mr-1" />
                    {client.email}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 mr-1" />
                    {client.phone}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {client.address}
                  </div>
                </div>
              </div>
              
              {/* Estado */}
              <div className="ml-2">
                {getStatusBadge(client.status)}
              </div>
            </div>
            
            {/* Estadísticas y acciones */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">
                <p><strong>{client.totalOrders}</strong> pedidos</p>
                <p><strong>${client.totalSpent.toLocaleString()}</strong> gastado</p>
              </div>
              
              {/* Acciones */}
              <div className="flex space-x-1">
                <Button size="sm" variant="ghost">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
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
            isNeoBrutalism ? 'font-bold uppercase tracking-wide' : 'font-normal'
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
                  isNeoBrutalism ? 'font-black uppercase tracking-wide' : 'font-medium'
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
                  isNeoBrutalism ? 'font-black uppercase tracking-wide' : 'font-medium'
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
                  isNeoBrutalism ? 'font-black uppercase tracking-wide' : 'font-medium'
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{mockClients.length}</p>
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
                  {mockClients.filter(c => c.type === 'individual').length}
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
                  {mockClients.filter(c => c.type === 'empresa').length}
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
                  {mockClients.filter(c => c.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-4">
        {/* Vista de escritorio - Tabla */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Cliente</th>
                      <th className="text-left p-2">Contacto</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Pedidos</th>
                      <th className="text-left p-2">Total Gastado</th>
                      <th className="text-left p-2">Estado</th>
                      <th className="text-left p-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockClients.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="p-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {getClientTypeIcon(client.type)}
                            </div>
                            <div>
                              <p className="font-medium">{client.name}</p>
                              {client.company && (
                                <p className="text-sm text-muted-foreground">{client.company}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 text-sm">
                          <div>
                            <p>{client.email}</p>
                            <p className="text-muted-foreground">{client.phone}</p>
                          </div>
                        </td>
                        <td className="p-2 text-sm capitalize">{client.type}</td>
                        <td className="p-2 text-sm">{client.totalOrders}</td>
                        <td className="p-2 text-sm font-medium">${client.totalSpent.toLocaleString()}</td>
                        <td className="p-2">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDeleteClient(client.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vista móvil y tablet - Cards */}
        <div className="lg:hidden space-y-4">
          {mockClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {mockClients.length} de {mockClients.length} clientes
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Clients;


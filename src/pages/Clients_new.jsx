/**
 * Página Clients con soporte multi-tema
 * Sistema de gestión de clientes con soporte para Neo-Brutalism, Material Design y Fluent Design
 * Utiliza helpers centralizados para consistencia entre temas
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Plus, 
  Search, 
  Users,
  Building,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useClientStore from '@/store/useClientStore';
import { 
  getThemeTypography, 
  getThemeCardStyles, 
  getThemeButtonStyles, 
  getThemeInputStyles,
  getThemeGridLayout 
} from '@/utils/themeUtils';

const Clients = () => {
  const { theme } = useTheme();
  const { clients, loading, error, fetchClients } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Helper function para obtener estilos de hover según el tema
  const getHoverEffects = () => {
    const isNeoBrutalist = theme?.includes('neo-brutalism');
    const isMaterial = theme?.includes('material');
    
    if (isNeoBrutalist) {
      return {
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = 'translate(-3px, -3px)';
          e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = 'translate(0px, 0px)';
          e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
        }
      };
    } else if (isMaterial) {
      return {
        onMouseEnter: (e) => {
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          e.currentTarget.style.transform = 'translateY(0px)';
        }
      };
    } else {
      return {
        onMouseEnter: (e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        }
      };
    }
  };

  // Filtrar clientes basado en búsqueda
  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p style={getThemeTypography('base', theme)}>Cargando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p style={getThemeTypography('heading', theme)} className="text-red-600 mb-4">Error al cargar clientes</p>
          <p style={getThemeTypography('base', theme)} className="text-muted-foreground">{error}</p>
          <Button 
            onClick={() => fetchClients()}
            style={getThemeButtonStyles('primary', theme)}
            className="mt-4"
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="space-y-6">
        
        {/* Header */}
        <section className="text-center space-y-4">
          <h1 
            style={getThemeTypography('title', theme)}
            className="text-4xl font-bold"
          >
            {theme?.includes('neo-brutalism') ? 'GESTIÓN DE CLIENTES' : 'Gestión de clientes'}
          </h1>
          <p 
            style={getThemeTypography('subtitle', theme)}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            {theme?.includes('neo-brutalism') 
              ? 'ADMINISTRA TU BASE DE CLIENTES CON FACILIDAD'
              : 'Administra tu base de clientes con facilidad'
            }
          </p>
        </section>

        {/* Barra de búsqueda y botón agregar */}
        <section className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={theme?.includes('neo-brutalism') ? 'BUSCAR CLIENTES...' : 'Buscar clientes...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={getThemeInputStyles(theme)}
              className="pl-10"
            />
          </div>
          
          <Button
            style={getThemeButtonStyles('primary', theme)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            {theme?.includes('neo-brutalism') ? 'NUEVO CLIENTE' : 'Nuevo cliente'}
          </Button>
        </section>

        {/* Lista de clientes */}
        <section>
          <h2 
            style={getThemeTypography('heading', theme)}
            className="text-2xl font-semibold mb-6 flex items-center gap-2"
          >
            <Users className="w-6 h-6" />
            {theme?.includes('neo-brutalism') ? 'CLIENTES REGISTRADOS' : 'Clientes registrados'}
          </h2>
          
          <div style={getThemeGridLayout(theme)} className="space-y-4">
            {filteredClients.length > 0 ? (
              filteredClients.map((client, index) => (
                <div
                  key={client.id || index}
                  style={{
                    ...getThemeCardStyles(theme),
                    transition: 'all 0.2s ease-in-out'
                  }}
                  className="p-6 space-y-4 cursor-pointer"
                  {...getHoverEffects()}
                >
                  {/* Header del cliente */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 
                        className="text-lg font-semibold"
                        style={getThemeTypography('subtitle', theme)}
                      >
                        {client.name || `Cliente ${index + 1}`}
                      </h3>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span style={getThemeTypography('small', theme)}>
                          {client.company || 'Empresa no especificada'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de contacto */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.email || `cliente${index + 1}@ejemplo.com`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.phone || '+1 (555) 000-0000'}
                      </span>
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.address || 'Dirección no especificada'}
                      </span>
                    </div>
                  </div>

                  {/* Footer con acciones */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="text-xs text-muted-foreground">
                      <span style={getThemeTypography('caption', theme)}>
                        Cliente desde: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'Fecha no disponible'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        style={getThemeButtonStyles('secondary', theme)}
                      >
                        {theme?.includes('neo-brutalism') ? 'EDITAR' : 'Editar'}
                      </Button>
                      <Button
                        size="sm"
                        style={getThemeButtonStyles('primary', theme)}
                      >
                        {theme?.includes('neo-brutalism') ? 'VER DETALLES' : 'Ver detalles'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 
                  style={getThemeTypography('heading', theme)}
                  className="text-lg font-semibold mb-2"
                >
                  {theme?.includes('neo-brutalism') ? 'NO HAY CLIENTES' : 'No hay clientes'}
                </h3>
                <p 
                  style={getThemeTypography('base', theme)}
                  className="text-muted-foreground mb-6"
                >
                  {searchTerm
                    ? theme?.includes('neo-brutalism')
                      ? 'NO SE ENCONTRARON CLIENTES CON ESTE CRITERIO'
                      : 'No se encontraron clientes con este criterio'
                    : theme?.includes('neo-brutalism')
                      ? 'AGREGA TU PRIMER CLIENTE PARA COMENZAR'
                      : 'Agrega tu primer cliente para comenzar'
                  }
                </p>
                <button
                  style={getThemeButtonStyles('primary', theme)}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  {theme?.includes('neo-brutalism') ? 'AGREGAR CLIENTE' : 'Agregar cliente'}
                </button>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Clients;

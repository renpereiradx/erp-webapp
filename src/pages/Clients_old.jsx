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
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }
      };
    } else {
      return {
        onMouseEnter: (e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.12)';
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
        }
      };
    }
  };

  const filteredClients = clients.filter(client => 
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p style={getThemeTypography('base', theme)}>Cargando clientes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <p style={getThemeTypography('heading', theme)} className="text-red-600 mb-4">Error al cargar clientes</p>
            <p style={getThemeTypography('base', theme)}>{error}</p>
            <button 
              style={getThemeButtonStyles('primary', theme)}
              className="mt-4"
              onClick={() => fetchClients()}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getThemeTypography('title', theme)}
          >
            {theme?.includes('neo-brutalism') ? 'GESTIÓN DE CLIENTES' : 'Gestión de clientes'}
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto"
            style={getThemeTypography('base', theme)}
          >
            {theme?.includes('neo-brutalism') 
              ? 'ADMINISTRA TU BASE DE CLIENTES CON FACILIDAD'
              : 'Administra tu base de clientes con facilidad'
            }
          </p>
        </header>

        <section className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder={theme?.includes('neo-brutalism') ? 'BUSCAR CLIENTES...' : 'Buscar clientes...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                style={{
                  ...getThemeInputStyles(theme),
                  width: '100%'
                }}
              />
            </div>
          </div>
          
          <button
            style={getThemeButtonStyles('primary', theme)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {theme?.includes('neo-brutalism') ? 'NUEVO CLIENTE' : 'Nuevo cliente'}
          </button>
        </section>

        <section>
          <h2 
            className="text-primary mb-6"
            style={getThemeTypography('heading', theme)}
          >
            {theme?.includes('neo-brutalism') ? 'CLIENTES REGISTRADOS' : 'Clientes registrados'}
            <span className="text-muted-foreground ml-2">({filteredClients.length})</span>
          </h2>
          
          <div style={getThemeGridLayout(theme)}>
            {filteredClients.length === 0 ? (
              <div 
                className="col-span-full text-center py-20"
                style={getThemeCardStyles(theme)}
              >
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 
                  className="text-foreground mb-2"
                  style={getThemeTypography('heading', theme)}
                >
                  {theme?.includes('neo-brutalism') ? 'NO HAY CLIENTES' : 'No hay clientes'}
                </h3>
                <p 
                  className="text-muted-foreground mb-4"
                  style={getThemeTypography('base', theme)}
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
            ) : (
              filteredClients.map((client, index) => (
                <div
                  key={client.id || index}
                  className="p-6"
                  style={getThemeCardStyles(theme)}
                  {...getHoverEffects()}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 bg-primary text-primary-foreground flex items-center justify-center"
                        style={{
                          borderRadius: theme?.includes('neo-brutalism') ? '0px' : theme?.includes('material') ? '50%' : '8px',
                          border: theme?.includes('neo-brutalism') ? '2px solid var(--border)' : 'none'
                        }}
                      >
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 
                          className="text-foreground font-semibold"
                          style={getThemeTypography('subtitle', theme)}
                        >
                          {client.name || \`Cliente \${index + 1}\`}
                        </h3>
                        <p 
                          className="text-muted-foreground"
                          style={getThemeTypography('small', theme)}
                        >
                          {client.type || 'Regular'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.company || 'Empresa no especificada'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.email || \`cliente\${index + 1}@ejemplo.com\`}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.phone || '+1 234 567 8900'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span style={getThemeTypography('small', theme)}>
                        {client.address || 'Dirección no especificada'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <button
                      style={{...getThemeButtonStyles('secondary', theme), padding: '8px 12px'}}
                      className="text-sm"
                    >
                      {theme?.includes('neo-brutalism') ? 'EDITAR' : 'Editar'}
                    </button>
                    <button
                      style={{...getThemeButtonStyles('secondary', theme), padding: '8px 12px'}}
                      className="text-sm"
                    >
                      {theme?.includes('neo-brutalism') ? 'CONTACTAR' : 'Contactar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Clients;

/**
 * Página Clients optimizada para Neo-Brutalism
 * Sistema de gestión de clientes con diseño brutal, grid responsivo y componentes interactivos
 * Incluye helper functions específicas para estilo Neo-Brutalist
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Building,
  Calendar,
  DollarSign,
  Star,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import useClientStore from '@/store/useClientStore';

const Clients = () => {
  const { theme } = useTheme();
  const { clients, loading, error, fetchClients, deleteClient } = useClientStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');
  const isFluent = theme?.includes('fluent');

  // Helper functions específicas para Neo-Brutalism
  const getBrutalistCardStyles = () => ({
    background: 'var(--background)',
    border: '4px solid var(--border)',
    borderRadius: '0px',
    boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
    transition: 'all 200ms ease',
    overflow: 'hidden'
  });

  const getBrutalistHeaderStyles = () => ({
    background: 'var(--brutalist-lime)',
    color: '#000000',
    padding: '16px',
    border: 'none',
    borderBottom: '4px solid var(--border)',
    margin: '-1px -1px 0 -1px'
  });

  const getBrutalistTypography = (level = 'base') => {
    const styles = {
      title: {
        fontSize: '3rem',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: '1.1',
        textShadow: '2px 2px 0px rgba(0,0,0,0.8)'
      },
      heading: {
        fontSize: '1.5rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        lineHeight: '1.2'
      },
      subheading: {
        fontSize: '1.125rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      base: {
        fontSize: '0.875rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      },
      small: {
        fontSize: '0.75rem',
        fontWeight: '600',
        letterSpacing: '0.01em'
      }
    };
    return styles[level] || styles.base;
  };

  const getBrutalistBadgeStyles = (type) => {
    const badges = {
      vip: {
        background: 'var(--brutalist-orange)',
        color: '#000000',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      regular: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      },
      premium: {
        background: 'var(--brutalist-purple)',
        color: '#ffffff',
        border: '2px solid var(--border)',
        padding: '4px 8px',
        borderRadius: '0px',
        fontSize: '0.75rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em'
      }
    };
    return badges[type] || badges.regular;
  };

  const getBrutalistButtonStyles = (variant = 'primary') => {
    const buttons = {
      primary: {
        background: 'var(--brutalist-lime)',
        color: '#000000',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      secondary: {
        background: 'var(--brutalist-blue)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      },
      danger: {
        background: 'var(--brutalist-pink)',
        color: '#ffffff',
        border: '3px solid var(--border)',
        borderRadius: '0px',
        padding: '8px 16px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.025em',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        transition: 'all 150ms ease',
        cursor: 'pointer'
      }
    };
    return buttons[variant] || buttons.primary;
  };

  const getBrutalistInputStyles = () => ({
    background: 'var(--background)',
    border: '3px solid var(--border)',
    borderRadius: '0px',
    padding: '12px 16px',
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
    transition: 'all 150ms ease'
  });

  const getBrutalistGridLayout = () => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '2rem',
    padding: '2rem 0'
  });

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Filtrar clientes basado en búsqueda y filtro
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedFilter === 'all') return matchesSearch;
    if (selectedFilter === 'vip') return matchesSearch && client.type === 'VIP';
    if (selectedFilter === 'regular') return matchesSearch && client.type === 'Regular';
    if (selectedFilter === 'premium') return matchesSearch && client.type === 'Premium';
    
    return matchesSearch;
  });

  const handleCardHover = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(-3px, -3px)';
      e.currentTarget.style.boxShadow = '9px 9px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleCardLeave = (e) => {
    if (isNeoBrutalism) {
      e.currentTarget.style.transform = 'translate(0px, 0px)';
      e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonHover = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(-2px, -2px)';
      e.target.style.boxShadow = '6px 6px 0px 0px rgba(0,0,0,1)';
    }
  };

  const handleButtonLeave = (e) => {
    if (isNeoBrutalism) {
      e.target.style.transform = 'translate(0px, 0px)';
      e.target.style.boxShadow = '4px 4px 0px 0px rgba(0,0,0,1)';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div 
              className="text-primary"
              style={getBrutalistTypography('heading')}
            >
              CARGANDO CLIENTES...
            </div>
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
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <div 
              className="text-red-500 mb-4"
              style={getBrutalistTypography('heading')}
            >
              ERROR AL CARGAR
            </div>
            <p style={getBrutalistTypography('base')}>
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Neo-Brutalist */}
        <header className="text-center py-8">
          <h1 
            className="text-primary mb-4"
            style={getBrutalistTypography('title')}
          >
            GESTIÓN DE CLIENTES
          </h1>
          <p 
            className="text-muted-foreground max-w-2xl mx-auto mb-8"
            style={getBrutalistTypography('base')}
          >
            ADMINISTRA TU BASE DE CLIENTES CON ESTILO NEO-BRUTALIST
          </p>
          
          {/* Botón principal */}
          <button
            style={getBrutalistButtonStyles('primary')}
            onMouseEnter={handleButtonHover}
            onMouseLeave={handleButtonLeave}
          >
            <Plus className="w-5 h-5 mr-2" />
            AÑADIR CLIENTE
          </button>
        </header>

        {/* Barra de búsqueda y filtros */}
        <section 
          className="p-6"
          style={getBrutalistCardStyles()}
        >
          <div className="grid md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="BUSCAR CLIENTES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12"
                style={{
                  ...getBrutalistInputStyles(),
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}
                onFocus={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(-2px, -2px)';
                    e.target.style.boxShadow = '5px 5px 0px 0px rgba(0,0,0,1)';
                  }
                }}
                onBlur={(e) => {
                  if (isNeoBrutalism) {
                    e.target.style.transform = 'translate(0px, 0px)';
                    e.target.style.boxShadow = '3px 3px 0px 0px rgba(0,0,0,1)';
                  }
                }}
              />
            </div>

            {/* Filtro por tipo */}
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              style={{
                ...getBrutalistInputStyles(),
                textTransform: 'uppercase',
                fontWeight: '600'
              }}
            >
              <option value="all">TODOS LOS CLIENTES</option>
              <option value="vip">CLIENTES VIP</option>
              <option value="premium">CLIENTES PREMIUM</option>
              <option value="regular">CLIENTES REGULARES</option>
            </select>

            {/* Estadísticas rápidas */}
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getBrutalistTypography('heading')}
                >
                  {filteredClients.length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('small')}
                >
                  TOTAL
                </div>
              </div>
              <div className="text-center">
                <div 
                  className="text-foreground"
                  style={getBrutalistTypography('heading')}
                >
                  {filteredClients.filter(c => c.type === 'VIP').length}
                </div>
                <div 
                  className="text-muted-foreground"
                  style={getBrutalistTypography('small')}
                >
                  VIP
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grid de clientes con estilo Neo-Brutalist */}
        <section style={getBrutalistGridLayout()}>
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <div 
                className="text-muted-foreground"
                style={getBrutalistTypography('heading')}
              >
                NO SE ENCONTRARON CLIENTES
              </div>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="cursor-pointer"
                style={getBrutalistCardStyles()}
                onMouseEnter={handleCardHover}
                onMouseLeave={handleCardLeave}
              >
                {/* Header de la card */}
                <div style={getBrutalistHeaderStyles()}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          background: '#000000',
                          color: 'var(--brutalist-lime)',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--border)',
                          borderRadius: '0px'
                        }}
                      >
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 style={getBrutalistTypography('subheading')}>
                          {client.name}
                        </h3>
                        <div style={getBrutalistBadgeStyles(client.type.toLowerCase())}>
                          {client.type}
                        </div>
                      </div>
                    </div>
                    <button
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#000000',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Contenido de la card */}
                <div className="p-6 space-y-4">
                  
                  {/* Información de contacto */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          background: 'var(--brutalist-blue)',
                          color: '#ffffff',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--border)',
                          borderRadius: '0px'
                        }}
                      >
                        <Building className="w-4 h-4" />
                      </div>
                      <span style={getBrutalistTypography('base')}>
                        {client.company}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          background: 'var(--brutalist-pink)',
                          color: '#ffffff',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--border)',
                          borderRadius: '0px'
                        }}
                      >
                        <Mail className="w-4 h-4" />
                      </div>
                      <span style={getBrutalistTypography('base')}>
                        {client.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          background: 'var(--brutalist-orange)',
                          color: '#ffffff',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--border)',
                          borderRadius: '0px'
                        }}
                      >
                        <Phone className="w-4 h-4" />
                      </div>
                      <span style={getBrutalistTypography('base')}>
                        {client.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div 
                        style={{
                          background: 'var(--brutalist-purple)',
                          color: '#ffffff',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid var(--border)',
                          borderRadius: '0px'
                        }}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span style={getBrutalistTypography('base')}>
                        {client.address}
                      </span>
                    </div>
                  </div>

                  {/* Métricas del cliente */}
                  <div 
                    className="grid grid-cols-2 gap-3 pt-4"
                    style={{
                      borderTop: '2px solid var(--border)'
                    }}
                  >
                    <div className="text-center">
                      <div 
                        className="text-foreground"
                        style={getBrutalistTypography('subheading')}
                      >
                        ${client.totalSpent?.toLocaleString() || '0'}
                      </div>
                      <div 
                        className="text-muted-foreground"
                        style={getBrutalistTypography('small')}
                      >
                        TOTAL GASTADO
                      </div>
                    </div>
                    <div className="text-center">
                      <div 
                        className="text-foreground"
                        style={getBrutalistTypography('subheading')}
                      >
                        {client.orders || 0}
                      </div>
                      <div 
                        className="text-muted-foreground"
                        style={getBrutalistTypography('small')}
                      >
                        PEDIDOS
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4">
                    <button
                      style={getBrutalistButtonStyles('secondary')}
                      onMouseEnter={handleButtonHover}
                      onMouseLeave={handleButtonLeave}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      EDITAR
                    </button>
                    <button
                      style={getBrutalistButtonStyles('danger')}
                      onMouseEnter={handleButtonHover}
                      onMouseLeave={handleButtonLeave}
                      onClick={() => deleteClient(client.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* Footer de acciones */}
        <footer className="text-center py-8">
          <div className="flex flex-wrap justify-center gap-4">
            <button
              style={getBrutalistButtonStyles('secondary')}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <Filter className="w-5 h-5 mr-2" />
              FILTROS AVANZADOS
            </button>
            <button
              style={{...getBrutalistButtonStyles('primary'), background: 'var(--brutalist-purple)'}}
              onMouseEnter={handleButtonHover}
              onMouseLeave={handleButtonLeave}
            >
              <DollarSign className="w-5 h-5 mr-2" />
              REPORTE DE VENTAS
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default Clients;

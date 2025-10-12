/**
 * Selector de Servicios de Canchas para Reservas
 * Utiliza el endpoint /products/enriched/service-courts según la especificación API
 * Optimizado con sistema multi-theme (Neo-Brutalism, Material Design, Fluent Design)
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, CheckCircle, Loader2, AlertCircle, Star, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import useProductStore from '@/store/useProductStore';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { 
  getThemeTypography, 
  getThemeCardStyles, 
  getThemeInputStyles, 
  getThemeButtonStyles,
  getThemeGridLayout,
  getThemeHoverEffects 
} from '@/utils/themeUtils';

const ServiceCourtSelector = ({ onServiceSelect, onClose }) => {
  const { t } = useI18n();
  const { styles, theme } = useThemeStyles();
  const { 
    products, 
    loading, 
    error, 
    fetchServiceCourts 
  } = useProductStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Estilos dinámicos basados en tema
  const titleTypography = getThemeTypography('subtitle', theme);
  const headingTypography = getThemeTypography('heading', theme);
  const baseTypography = getThemeTypography('base', theme);
  const cardStyles = getThemeCardStyles(theme);
  const inputStyles = getThemeInputStyles(theme);
  const gridLayout = getThemeGridLayout(theme);
  const hoverEffects = getThemeHoverEffects(theme);

  // Cargar servicios de canchas al montar el componente
  useEffect(() => {
    const loadServices = async () => {
      try {
        await fetchServiceCourts();
      } catch (error) {
        console.error('Error loading service courts:', error);
      }
    };

    loadServices();
  }, [fetchServiceCourts]);

  // Filtrar servicios según el término de búsqueda
  const filteredServices = products.filter(service => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      service.name?.toLowerCase().includes(term) ||
      service.category_name?.toLowerCase().includes(term) ||
      service.description?.toLowerCase().includes(term)
    );
  });

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    onServiceSelect(service);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-6" />
          {theme?.includes('neo-brutalism') && (
            <div className="absolute inset-0 w-12 h-12 border-4 border-black border-dashed animate-pulse" />
          )}
        </div>
        <h3 
          style={{
            ...headingTypography,
            color: 'var(--foreground)',
            marginBottom: '8px'
          }}
        >
          {theme?.includes('neo-brutalism') ? 'CARGANDO CANCHAS' : 'Cargando servicios de canchas'}
        </h3>
        <p style={{
          ...baseTypography,
          color: 'var(--muted-foreground)',
          textAlign: 'center'
        }}>
          Obteniendo información de canchas deportivas disponibles...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative mb-6">
          <AlertCircle className="w-12 h-12 text-red-600" />
          {theme?.includes('neo-brutalism') && (
            <div className="absolute -inset-2 border-4 border-red-600 border-dashed animate-pulse" />
          )}
        </div>
        <h3 style={{
          ...headingTypography,
          color: 'var(--destructive)',
          marginBottom: '12px'
        }}>
          {theme?.includes('neo-brutalism') ? 'ERROR DE CONEXIÓN' : 'Error al cargar servicios'}
        </h3>
        <p style={{
          ...baseTypography,
          color: 'var(--destructive)',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {error}
        </p>
        <Button 
          onClick={() => fetchServiceCourts()} 
          variant="outline"
          size="sm"
          style={getThemeButtonStyles('secondary', theme)}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          {theme?.includes('neo-brutalism') ? 'REINTENTAR AHORA' : 'Reintentar'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con estilo temático */}
      <div className="text-center pb-4 border-b" style={{
        borderColor: theme?.includes('neo-brutalism') ? 'var(--border)' : 'var(--border)',
        borderWidth: theme?.includes('neo-brutalism') ? '3px' : '1px',
        borderStyle: theme?.includes('neo-brutalism') ? 'solid' : 'solid'
      }}>
        <h2 style={{
          ...titleTypography,
          color: 'var(--foreground)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <MapPin className={`w-6 h-6 ${theme?.includes('neo-brutalism') ? 'animate-bounce' : ''}`} />
          {theme?.includes('neo-brutalism') ? 'CANCHAS DEPORTIVAS' : 'Servicios de Canchas'}
        </h2>
        <p style={{
          ...baseTypography,
          color: 'var(--muted-foreground)'
        }}>
          {filteredServices.length} {theme?.includes('neo-brutalism') ? 'OPCIONES DISPONIBLES' : 'opciones disponibles'}
        </p>
      </div>

      {/* Búsqueda mejorada */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
          <Search className={`w-5 h-5 ${theme?.includes('neo-brutalism') ? 'text-black' : 'text-gray-400'}`} />
        </div>
        <Input
          type="text"
          placeholder={theme?.includes('neo-brutalism') ? 'BUSCAR CANCHAS...' : 'Buscar servicios de canchas...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 pr-4"
          style={{
            ...inputStyles,
            fontSize: theme?.includes('neo-brutalism') ? '1rem' : '0.9rem'
          }}
        />
        {theme?.includes('neo-brutalism') && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Lista de servicios con grid temático */}
      <div 
        className="max-h-96 overflow-y-auto"
        style={{
          ...gridLayout,
          maxHeight: '400px',
          padding: '0'
        }}
      >
        {filteredServices.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm 
                ? `No se encontraron servicios para "${searchTerm}"`
                : 'No hay servicios de canchas disponibles'
              }
            </p>
          </div>
        ) : (
          filteredServices.map((service) => (
            <Card 
              key={service.id} 
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedService?.id === service.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
              onClick={() => handleServiceSelect(service)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {service.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {service.category_name}
                        </p>
                      </div>
                    </div>
                    
                    {/* Información del precio */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {service.price_formatted || `PYG ${service.purchase_price || 'A consultar'}/hora`}
                        </span>
                      </div>
                      
                      {/* Estados del servicio */}
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={service.has_valid_price ? 'default' : 'secondary'}
                        >
                          {service.has_valid_price ? 'Precio válido' : 'Sin precio'}
                        </Badge>
                        <Badge 
                          variant={service.state ? 'default' : 'destructive'}
                        >
                          {service.state ? 'Activo' : 'Inactivo'}
                        </Badge>
                        <Badge variant="outline">
                          {service.stock_status === 'no_stock_tracking' 
                            ? 'Sin control stock' 
                            : service.stock_status
                          }
                        </Badge>
                      </div>
                    </div>

                    {/* Descripción si existe */}
                    {service.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Indicador de selección */}
                  {selectedService?.id === service.id && (
                    <CheckCircle className="w-6 h-6 text-blue-600 ml-3 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botones de acción mejorados */}
      <div 
        className="flex justify-between items-center pt-6 mt-6"
        style={{
          borderTop: `${theme?.includes('neo-brutalism') ? '3px' : '1px'} solid var(--border)`,
          gap: '16px'
        }}
      >
        <Button 
          variant="outline" 
          onClick={onClose}
          style={{
            ...getThemeButtonStyles('secondary', theme),
            minWidth: '120px'
          }}
        >
          {theme?.includes('neo-brutalism') ? 'CANCELAR' : 'Cancelar'}
        </Button>
        
        {selectedService && (
          <div 
            className="flex-1 text-center p-3 rounded"
            style={{
              backgroundColor: theme?.includes('neo-brutalism') 
                ? 'var(--primary)' 
                : 'var(--accent)',
              border: theme?.includes('neo-brutalism') ? '2px solid var(--border)' : 'none',
              borderRadius: theme?.includes('neo-brutalism') ? '0' : '8px'
            }}
          >
            <p style={{
              ...baseTypography,
              color: theme?.includes('neo-brutalism') ? 'var(--primary-foreground)' : 'var(--foreground)',
              fontWeight: theme?.includes('neo-brutalism') ? '800' : '600',
              fontSize: '0.9rem',
              margin: '0'
            }}>
              {theme?.includes('neo-brutalism') ? '✓ SELECCIONADO:' : '✓ Seleccionado:'} {selectedService.name}
            </p>
          </div>
        )}
        
        <Button 
          variant="primary"
          disabled={!selectedService}
          onClick={() => selectedService && onServiceSelect(selectedService)}
          style={{
            ...getThemeButtonStyles('primary', theme),
            minWidth: '160px',
            opacity: !selectedService ? 0.5 : 1,
            cursor: !selectedService ? 'not-allowed' : 'pointer'
          }}
        >
          <div className="flex items-center gap-2">
            {selectedService && <CheckCircle className="w-4 h-4" />}
            <span>
              {selectedService 
                ? (theme?.includes('neo-brutalism') ? 'CONTINUAR AHORA' : 'Continuar con este servicio')
                : (theme?.includes('neo-brutalism') ? 'SELECCIONA UNA CANCHA' : 'Selecciona un servicio')
              }
            </span>
          </div>
        </Button>
      </div>
    </div>
  );
};

export default ServiceCourtSelector;

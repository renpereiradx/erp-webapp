/**
 * @fileoverview Componente ClientCard - Tarjeta individual de cliente
 * Wave 3A: React Performance Optimizations
 * 
 * Features:
 * - React.memo para evitar re-renders innecesarios
 * - useMemo para cálculos costosos
 * - useCallback para handlers estables
 * - Diseño responsive
 * - Accesibilidad completa
 * - Soporte para todos los themes
 */

import React, { memo, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';

/**
 * Tarjeta de cliente individual con acciones - Optimizada con React.memo
 * @param {Object} props - Props del componente
 * @param {Object} props.client - Datos del cliente
 * @param {Function} props.onView - Handler para ver detalles
 * @param {Function} props.onEdit - Handler para editar
 * @param {Function} props.onDelete - Handler para eliminar
 * @param {string} props.className - Clases CSS adicionales
 */
const ClientCard = ({ 
  client, 
  onView, 
  onEdit, 
  onDelete,
  className = ''
}) => {
  const { theme } = useTheme();
  const { card, themeHeader, themeLabel } = useThemeStyles();
  const { t } = useI18n();
  
  // Memoizar valores calculados costosos
  const computedValues = useMemo(() => {
    if (!client) return null;

    const isNeoBrutalism = theme?.includes('neo-brutalism');
    const fullName = `${client.name} ${client.last_name || ''}`.trim();
    const registrationDate = client.created_at 
      ? new Date(client.created_at).toLocaleDateString()
      : 'N/A';
    
    return {
      isNeoBrutalism,
      fullName,
      registrationDate
    };
  }, [client, theme]);

  // Handlers estables con useCallback
  const handleKeyPress = useCallback((event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  }, []); // Sin dependencias porque action viene como parámetro

  const handleViewClick = useCallback(() => {
    onView?.(client);
  }, [onView, client]);

  const handleEditClick = useCallback(() => {
    onEdit?.(client);
  }, [onEdit, client]);

  const handleDeleteClick = useCallback(() => {
    onDelete?.(client);
  }, [onDelete, client]);

  // Early return si no hay cliente
  if (!client || !computedValues) {
    return null;
  }

  const { isNeoBrutalism, fullName, registrationDate } = computedValues;

  return (
    <div 
      className={`${card('p-4 sm:p-5')} group relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 flex flex-col ${className}`}
      data-testid={`client-card-${client.id}`}
      role="article"
      aria-label={`Cliente ${fullName}`}
    >
      {/* Accent bar */}
      {!isNeoBrutalism ? (
        <div 
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80 rounded-t-md" 
          aria-hidden="true" 
        />
      ) : (
        <div 
          className="absolute inset-x-0 top-0 h-[3px] bg-border" 
          aria-hidden="true" 
        />
      )}

      {/* Content */}
      <div className="flex-1">
        {/* Header con nombre y estado */}
        <div className="flex justify-between items-start mb-4">
          <h3 
            className={`${themeHeader('h3')} mb-2 truncate`}
            title={fullName}
          >
            {fullName}
          </h3>
          <StatusBadge 
            active={!!client.status} 
            aria-label={client.status ? 'Cliente activo' : 'Cliente inactivo'}
          />
        </div>

        {/* Info grid */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <span className={`${themeLabel} font-medium`}>Email:</span>
            <span className="text-muted-foreground truncate">{client.email || 'Sin email'}</span>
          </div>
          
          {client.phone && (
            <div className="flex items-center space-x-2">
              <span className={`${themeLabel} font-medium`}>Teléfono:</span>
              <span className="text-muted-foreground">{client.phone}</span>
            </div>
          )}
          
          {client.address && (
            <div className="flex items-center space-x-2">
              <span className={`${themeLabel} font-medium`}>Dirección:</span>
              <span className="text-muted-foreground truncate" title={client.address}>
                {client.address}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 pt-1">
            <span className={`${themeLabel} font-medium text-xs`}>Registro:</span>
            <span className="text-muted-foreground text-xs">{registrationDate}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3" role="group" aria-label="Acciones del cliente">
        <Button 
          onClick={handleViewClick}
          onKeyPress={(e) => handleKeyPress(e, handleViewClick)}
          variant="secondary" 
          size="sm" 
          className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" 
          data-testid={`client-view-${client.id}`}
          aria-label={`Ver detalles de ${fullName}`}
        >
          <Eye className="w-4 h-4 mr-1" aria-hidden="true" />
          {isNeoBrutalism ? 'VER' : 'Ver'}
        </Button>
        
        <Button 
          onClick={handleEditClick}
          onKeyPress={(e) => handleKeyPress(e, handleEditClick)}
          variant="primary" 
          size="sm" 
          className="flex-1 text-xs focus-visible:ring-2 focus-visible:ring-ring/50" 
          data-testid={`client-edit-${client.id}`}
          aria-label={`Editar ${fullName}`}
        >
          <Edit className="w-4 h-4 mr-1" aria-hidden="true" />
          {isNeoBrutalism ? 'EDITAR' : 'Editar'}
        </Button>
        
        <Button 
          onClick={handleDeleteClick}
          onKeyPress={(e) => handleKeyPress(e, handleDeleteClick)}
          variant="destructive" 
          size="icon" 
          className="focus-visible:ring-2 focus-visible:ring-ring/50" 
          aria-label={`Eliminar ${fullName}`}
          data-testid={`client-delete-${client.id}`}
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
};

// Función de comparación para React.memo - optimiza re-renders
const arePropsEqual = (prevProps, nextProps) => {
  // Comparar propiedades primitivas
  if (prevProps.className !== nextProps.className) return false;
  
  // Comparar cliente por ID y propiedades clave
  if (!prevProps.client && !nextProps.client) return true;
  if (!prevProps.client || !nextProps.client) return false;
  
  const prevClient = prevProps.client;
  const nextClient = nextProps.client;
  
  return (
    prevClient.id === nextClient.id &&
    prevClient.name === nextClient.name &&
    prevClient.last_name === nextClient.last_name &&
    prevClient.email === nextClient.email &&
    prevClient.phone === nextClient.phone &&
    prevClient.status === nextClient.status &&
    prevClient.created_at === nextClient.created_at &&
    // Handlers son estables si se usan useCallback correctamente
    prevProps.onView === nextProps.onView &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete
  );
};

// Aplicar comparación personalizada
ClientCard.displayName = 'ClientCard';

export default memo(ClientCard, arePropsEqual);

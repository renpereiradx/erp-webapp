/**
 * @fileoverview Componente ClientCard - Tarjeta individual de cliente
 * Seguimiento Wave 1: Arquitectura Base Sólida
 * 
 * Features:
 * - Diseño responsive
 * - Accesibilidad completa
 * - Soporte para todos los themes
 * - Acciones inline
 * - Estados visuales claros
 */

import React from 'react';
import { useTheme } from 'next-themes';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import StatusBadge from '@/components/ui/StatusBadge';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';

/**
 * Tarjeta de cliente individual con acciones
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
  
  const isNeoBrutalism = theme?.includes('neo-brutalism');

  if (!client) {
    return null;
  }

  // Construir nombre completo
  const fullName = `${client.name} ${client.last_name || ''}`.trim();
  
  // Formatear fecha de registro
  const registrationDate = client.created_at 
    ? new Date(client.created_at).toLocaleDateString()
    : 'N/A';

  const handleKeyPress = (event, action) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

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

        {/* Información del cliente */}
        <div className="space-y-2 mb-4" role="list" aria-label="Información del cliente">
          <div className="flex justify-between text-sm" role="listitem">
            <span className={`text-muted-foreground ${themeLabel()}`}>
              {t('clients.card.document') || 'DOCUMENTO:'}
            </span>
            <span className={themeLabel()} title={client.document_id || 'Sin documento'}>
              {client.document_id || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm" role="listitem">
            <span className={`text-muted-foreground ${themeLabel()}`}>
              {t('clients.card.contact') || 'CONTACTO:'}
            </span>
            <span className={themeLabel()} title={client.contact || 'Sin contacto'}>
              {client.contact || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between text-sm" role="listitem">
            <span className={`text-muted-foreground ${themeLabel()}`}>
              {t('clients.card.registered') || 'REGISTRO:'}
            </span>
            <span className={themeLabel()} title={registrationDate}>
              {registrationDate}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3" role="group" aria-label="Acciones del cliente">
        <Button 
          onClick={() => onView?.(client)}
          onKeyPress={(e) => handleKeyPress(e, () => onView?.(client))}
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
          onClick={() => onEdit?.(client)}
          onKeyPress={(e) => handleKeyPress(e, () => onEdit?.(client))}
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
          onClick={() => onDelete?.(client)}
          onKeyPress={(e) => handleKeyPress(e, () => onDelete?.(client))}
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

export default ClientCard;

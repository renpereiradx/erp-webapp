import React from 'react';
import { Button } from '../ui/Button';
import { Edit, Trash2, Mail, Phone, FileText, MapPin, Building2, Eye, Star } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const ClientListItem = ({ client, onEdit, onDelete, onView }) => {
  const { styles, isNeoBrutalism } = useThemeStyles();
  
  // Obtener prioridad con color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener tipo de cliente con icono
  const getClientTypeIcon = (type) => {
    switch (type) {
      case 'corporate': return <Building2 className="w-3 h-3" />;
      case 'retail': return <Star className="w-3 h-3" />;
      case 'wholesale': return <Building2 className="w-3 h-3" />;
      default: return <Building2 className="w-3 h-3" />;
    }
  };

  return (
    <div className={`${styles.card('p-6 transition-all hover:shadow-lg cursor-pointer')} group`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 
              className={`${styles.header('h3')} mb-1 group-hover:text-primary transition-colors cursor-pointer`}
              onClick={() => onView(client)}
              title="Ver detalles del cliente"
            >
              {client.name}
            </h3>
            {client.metadata?.priority && (
              <span className={`px-2 py-1 text-xs font-bold rounded-md border ${getPriorityColor(client.metadata.priority)} ${isNeoBrutalism ? 'border-2 border-black' : ''}`}>
                {client.metadata.priority.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Información de contacto */}
          <div className="space-y-2 mb-4">
            {client.contact?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{client.contact.email}</span>
              </div>
            )}
            {client.contact?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{client.contact.phone}</span>
              </div>
            )}
            {client.address?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{client.address.city}, {client.address.country || 'México'}</span>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="flex flex-wrap gap-2 items-center">
            {client.tax_id && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                <FileText className="w-3 h-3" />
                <span className="font-mono">{client.tax_id}</span>
              </div>
            )}
            {client.metadata?.type && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                {getClientTypeIcon(client.metadata.type)}
                <span>{client.metadata.type}</span>
              </div>
            )}
          </div>

          {/* Notas si existen */}
          {client.metadata?.notes && (
            <div className="mt-3 p-2 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground italic">
                "{client.metadata.notes}"
              </p>
            </div>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onView(client); }} 
            className="w-8 h-8 text-xs hover:bg-primary/10 hover:text-primary"
            title="Ver detalles del cliente"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onEdit(client); }} 
            className={`${styles.button('secondary')} w-8 h-8 text-xs`}
            title="Editar Cliente"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.stopPropagation(); onDelete(client); }} 
            className="w-8 h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
            title="Eliminar Cliente"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer con fechas */}
      <div className="flex justify-between items-center pt-3 border-t border-muted/20 text-xs text-muted-foreground">
        <div>
          Creado: {new Date(client.created_at).toLocaleDateString('es-MX')}
        </div>
        <div>
          Actualizado: {new Date(client.updated_at).toLocaleDateString('es-MX')}
        </div>
      </div>
    </div>
  );
};

export default ClientListItem;
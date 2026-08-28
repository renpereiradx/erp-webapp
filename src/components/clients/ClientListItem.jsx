import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Mail, Phone, FileText, MapPin, Building2, Eye, Star } from 'lucide-react';

const ClientListItem = ({ client, onEdit, onDelete, onView }) => {
  // Prioridad con color (tokens semánticos + escala fija)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border';
      case 'low': return 'bg-green-500/10 text-green-700 border';
      default: return 'bg-muted text-muted-foreground border';
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
    <div className="bg-card text-card-foreground border rounded-lg shadow-sm p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-fluent-8 active:translate-y-0 active:shadow-fluent-2 group cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3
              className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors cursor-pointer"
              onClick={() => onView(client)}
              title="Ver detalles del cliente"
            >
              {client.displayName || client.name || client.document_id || 'Cliente'}
            </h3>
            {client.metadata?.priority && (
              <span className={`px-2 py-1 text-xs font-bold rounded-md ${getPriorityColor(client.metadata.priority)}`}>
                {client.metadata.priority.toUpperCase()}
              </span>
            )}
          </div>

          {/* Información de contacto */}
          <div className="space-y-2 mb-4">
            {client.contact?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-foreground">{client.contact.email}</span>
              </div>
            )}
            {client.contact?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-foreground">{client.contact.phone}</span>
              </div>
            )}
            {client.address?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-base text-foreground">{client.address.city}, {client.address.country || 'México'}</span>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="flex flex-wrap gap-2 items-center">
            {client.document_id && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-muted text-muted-foreground border-border">
                <FileText className="w-3 h-3" />
                <span>CI: {client.document_id}</span>
              </div>
            )}
            {client.metadata?.type && (
              <div className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary border-primary/20">
                {getClientTypeIcon(client.metadata.type)}
                <span>{client.metadata.type}</span>
              </div>
            )}
          </div>

          {/* Notas si existen */}
          {client.metadata?.notes && (
            <div className="mt-3 p-2 rounded-md bg-muted/30 rounded-md">
              <p className="text-sm italic text-base text-muted-foreground">
                "{client.metadata.notes}"
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onView(client); }}
            title="Ver detalles del cliente"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(client); }}
            title="Editar Cliente"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(client); }}
            title="Eliminar Cliente"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer con fechas */}
      <div className="flex justify-between items-center pt-3 text-xs border-t border-border text-base text-muted-foreground">
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

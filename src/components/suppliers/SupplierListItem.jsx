import React from 'react';
import { Button } from '../ui/Button';
import { Edit, Trash2, Mail, Phone, FileText, MapPin, Building2, Tag } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const SupplierListItem = ({ supplier, onEdit, onDelete }) => {
  const { styles, isNeoBrutalism } = useThemeStyles();
  
  // Obtener prioridad con color usando sistema de temas
  const getPriorityColor = (priority) => {
    const baseClasses = isNeoBrutalism ? 'border-2 border-black' : 'border';
    switch (priority) {
      case 'high': return `bg-destructive/10 text-destructive ${baseClasses}`;
      case 'medium': return `bg-yellow-500/10 text-yellow-700 ${baseClasses}`;
      case 'low': return `bg-green-500/10 text-green-700 ${baseClasses}`;
      default: return `bg-muted text-muted-foreground ${baseClasses}`;
    }
  };

  // Obtener categoría con icono
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'manufacturing': return <Building2 className="w-3 h-3" />;
      case 'technology': return <FileText className="w-3 h-3" />;
      case 'industrial': return <Building2 className="w-3 h-3" />;
      case 'logistics': return <MapPin className="w-3 h-3" />;
      case 'materials': return <Tag className="w-3 h-3" />;
      default: return <Building2 className="w-3 h-3" />;
    }
  };

  return (
    <div className={`${styles.card('p-6')} erp-hover-card group cursor-pointer`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className={`${styles.header('h3')} mb-1 group-hover:text-primary transition-colors`}>
              {supplier.name}
            </h3>
            {supplier.metadata?.priority && (
              <span className={`px-2 py-1 text-xs font-bold rounded-md border ${getPriorityColor(supplier.metadata.priority)} ${isNeoBrutalism ? 'border-2 border-black' : ''}`}>
                {supplier.metadata.priority.toUpperCase()}
              </span>
            )}
          </div>
          
          {/* Información de contacto */}
          <div className="space-y-2 mb-4">
            {supplier.contact?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{supplier.contact.email}</span>
              </div>
            )}
            {supplier.contact?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{supplier.contact.phone}</span>
              </div>
            )}
            {supplier.address?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className={styles.body()}>{supplier.address.city}, {supplier.address.country || 'México'}</span>
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className="flex flex-wrap gap-2 items-center">
            {supplier.tax_id && (
              <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                <FileText className="w-3 h-3" />
                <span className="font-mono">{supplier.tax_id}</span>
              </div>
            )}
            {supplier.metadata?.category && (
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                {getCategoryIcon(supplier.metadata.category)}
                <span>{supplier.metadata.category}</span>
              </div>
            )}
          </div>

          {/* Notas si existen */}
          {supplier.metadata?.notes && (
            <div className="mt-3 p-2 bg-muted/30 rounded-md">
              <p className="text-sm text-muted-foreground italic">
                "{supplier.metadata.notes}"
              </p>
            </div>
          )}
        </div>
        
        {/* Botones de acción */}
        <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onEdit(supplier); }} 
            title="Editar Proveedor"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onDelete(supplier); }} 
            title="Eliminar Proveedor"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer con fechas */}
      <div className="flex justify-between items-center pt-3 border-t border-muted/20 text-xs text-muted-foreground">
        <div>
          Creado: {new Date(supplier.created_at).toLocaleDateString('es-MX')}
        </div>
        <div>
          Actualizado: {new Date(supplier.updated_at).toLocaleDateString('es-MX')}
        </div>
      </div>
    </div>
  );
};

export default SupplierListItem;

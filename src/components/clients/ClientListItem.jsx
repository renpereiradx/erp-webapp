import React from 'react';
import { Button } from '../ui/Button';
import { Edit, Trash2, Mail, Phone, FileText } from 'lucide-react';

import { useThemeStyles } from '../../hooks/useThemeStyles';

const ClientListItem = ({ client, onEdit, onDelete, onView }) => {
  const { styles } = useThemeStyles();

  return (
    <div className={styles.card('transition-all hover:border-primary')}>
      <div className="flex justify-between items-start">
        {/* Client Info */}
        <div className="space-y-2">
          <h3 
            className="font-black text-lg uppercase tracking-wide cursor-pointer hover:text-primary transition-colors"
            onClick={() => onView(client)}
            title="Ver detalles del cliente"
          >
            {client.name}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground font-semibold">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>{client.contact?.email || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{client.contact?.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{client.tax_id || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onEdit(client)}
            className="border-2 border-black"
            title="Editar Cliente"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(client)}
            className="border-2 border-black hover:bg-red-100"
            title="Eliminar Cliente"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientListItem;
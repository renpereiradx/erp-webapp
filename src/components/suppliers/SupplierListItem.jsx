import React from 'react';
import { Button } from '../ui/Button';
import { Edit, Trash2, Mail, Phone, FileText } from 'lucide-react';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const SupplierListItem = ({ supplier, onEdit, onDelete }) => {
  const { styles } = useThemeStyles();
  return (
    <div className={styles.card('transition-all hover:border-primary')}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className={styles.header('h3')}>{supplier.name}</h3>
          <div className="space-y-1 text-sm text-muted-foreground font-semibold">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{supplier.contact?.email || 'N/A'}</span></div>
            <div className="flex items-center gap-2"><FileText className="w-4 h-4" /><span>{supplier.tax_id || 'N/A'}</span></div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(supplier)} title="Editar Proveedor"><Edit className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(supplier)} title="Eliminar Proveedor" className="hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierListItem;

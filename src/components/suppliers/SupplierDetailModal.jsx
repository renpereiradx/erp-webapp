import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Phone, FileText, MapPin, Hash, Clock, Building2 } from 'lucide-react';

import { useThemeStyles } from '../../hooks/useThemeStyles';

const DetailRow = ({ icon, label, value }) => {
  const { styles } = useThemeStyles();
  return (
    <div className={`flex items-start gap-2 py-2 ${styles.cardSeparator()}`}>
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className={`${styles.label()} text-xs text-muted-foreground`}>{label}</p>
        <p className={`font-semibold text-foreground text-sm ${styles.body()}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );
};

const SupplierDetailModal = ({ supplier, onClose }) => {
  const { styles } = useThemeStyles();
  if (!supplier) return null;

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  const contactInfo = supplier.contact_info || {};

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[75vh] flex flex-col ${styles.card()} shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
        <div className={`flex justify-between items-center p-4 border-b ${styles.cardHeader()}`}>
          <h2 className={styles.header('h2')}>Detalle del Proveedor</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className={styles.button('ghost')}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="space-y-3">
            <DetailRow icon={<Hash size={16} />} label="ID Proveedor" value={supplier.id} />
            <DetailRow icon={<Building2 size={16} />} label="Nombre" value={supplier.name} />
            <DetailRow icon={<FileText size={16} />} label="RUC/Tax ID" value={supplier.tax_id} />
            <DetailRow icon={<Hash size={16} />} label="Estado" value={supplier.status ? 'Activo' : 'Inactivo'} />
            
            <h3 className={`${styles.header('h3')} pt-3 pb-1 text-sm font-semibold`}>Información de Contacto</h3>
            <DetailRow icon={<Mail size={16} />} label="Email" value={contactInfo.email || 'No especificado'} />
            <DetailRow icon={<Phone size={16} />} label="Teléfono" value={contactInfo.phone || 'No especificado'} />
            <DetailRow icon={<MapPin size={16} />} label="Dirección" value={contactInfo.address || 'No especificada'} />
            {contactInfo.fax && (
              <DetailRow icon={<Phone size={16} />} label="Fax" value={contactInfo.fax} />
            )}

            <h3 className={`${styles.header('h3')} pt-3 pb-1 text-sm font-semibold`}>Sistema</h3>
            <DetailRow icon={<Clock size={16} />} label="Creado" value={formatDateTime(supplier.created_at)} />
            {supplier.updated_at && (
              <DetailRow icon={<Clock size={16} />} label="Actualizado" value={formatDateTime(supplier.updated_at)} />
            )}
            {supplier.user_id && (
              <DetailRow icon={<Hash size={16} />} label="Usuario" value={supplier.user_id} />
            )}
          </div>
        </div>

        <div className={`p-4 border-t ${styles.cardFooter()} text-right`}>
            <Button onClick={onClose} className={styles.button('primary')}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailModal;

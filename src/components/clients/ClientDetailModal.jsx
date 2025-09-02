import React from 'react';
import { Button } from '../ui/Button';
import { X, Mail, Phone, FileText, MapPin, Hash, Clock } from 'lucide-react';

import { useThemeStyles } from '../../hooks/useThemeStyles';

const DetailRow = ({ icon, label, value }) => {
  const { styles } = useThemeStyles();
  return (
    <div className={`flex items-start gap-3 py-3 ${styles.cardSeparator()}`}>
      <div className="text-muted-foreground mt-1">{icon}</div>
      <div className="flex-1">
        <p className={styles.label()}>{label}</p>
        <p className={`font-semibold text-foreground text-base ${styles.body()}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );
};

const ClientDetailModal = ({ client, onClose }) => {
  const { styles } = useThemeStyles();
  if (!client) return null;

  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-lg max-h-[90vh] flex flex-col ${styles.card()}`}>
        <div className={`flex justify-between items-center p-4 ${styles.cardHeader()}`}>
          <h2 className={styles.header('h2')}>Detalle del Cliente</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className={styles.button('ghost')}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <DetailRow icon={<Hash size={18} />} label="ID Cliente" value={client.id} />
            <DetailRow icon={<FileText size={18} />} label="Nombre" value={client.name} />
            {client.last_name && (
              <DetailRow icon={<FileText size={18} />} label="Apellido" value={client.last_name} />
            )}
            <DetailRow icon={<FileText size={18} />} label="Documento de Identidad (CI)" value={client.document_id} />
            <DetailRow icon={<Hash size={18} />} label="Estado" value={client.status ? 'Activo' : 'Inactivo'} />
            
            <h3 className={`${styles.header('h3')} pt-4`}>Contacto</h3>
            <DetailRow icon={<Mail size={18} />} label="Email" value={client.contact?.email || 'No especificado'} />
            <DetailRow icon={<Phone size={18} />} label="Teléfono" value={client.contact?.phone || 'No especificado'} />

            <h3 className={`${styles.header('h3')} pt-4`}>Sistema</h3>
            <DetailRow icon={<Clock size={18} />} label="Fecha de Creación" value={formatDateTime(client.created_at)} />
            {client.user_id && (
              <DetailRow icon={<Hash size={18} />} label="Creado por (User ID)" value={client.user_id} />
            )}
          </div>
        </div>

        <div className={`p-4 ${styles.cardFooter()} text-right`}>
            <Button onClick={onClose} className={styles.button('primary')}>Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;

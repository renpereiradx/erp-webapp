import React from 'react';
import { Button } from '../ui/Button';
import { X, Mail, Phone, FileText, MapPin, Hash, Clock } from 'lucide-react';

import { useThemeStyles } from '../../hooks/useThemeStyles';

const DetailRow = ({ icon, label, value }) => {
  const { styles } = useThemeStyles();
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/50">
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
        <div className="flex justify-between items-center p-4 border-b-2 border-border">
          <h2 className={styles.header('h2')}>Detalle del Cliente</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="border-2 border-black">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-4">
            <DetailRow icon={<Hash size={18} />} label="ID Cliente" value={client.id} />
            <DetailRow icon={<FileText size={18} />} label="Nombre Completo" value={client.name} />
            <DetailRow icon={<FileText size={18} />} label="RFC / ID Fiscal" value={client.tax_id} />
            
            <h3 className="text-lg font-black uppercase tracking-wide pt-4">Contacto</h3>
            <DetailRow icon={<Mail size={18} />} label="Email" value={client.contact?.email} />
            <DetailRow icon={<Phone size={18} />} label="Teléfono" value={client.contact?.phone} />

            <h3 className="text-lg font-black uppercase tracking-wide pt-4">Dirección</h3>
            <DetailRow icon={<MapPin size={18} />} label="Calle" value={client.address?.street} />
            <DetailRow icon={<MapPin size={18} />} label="Ciudad" value={client.address?.city} />
            <DetailRow icon={<MapPin size={18} />} label="País" value={client.address?.country} />

            <h3 className="text-lg font-black uppercase tracking-wide pt-4">Metadatos</h3>
            {client.metadata && Object.keys(client.metadata).length > 0 ? (
              Object.entries(client.metadata).map(([key, value]) => (
                <DetailRow key={key} icon={<Hash size={18} />} label={key} value={String(value)} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay metadatos.</p>
            )}

            <h3 className="text-lg font-black uppercase tracking-wide pt-4">Sistema</h3>
            <DetailRow icon={<Clock size={18} />} label="Fecha de Creación" value={formatDateTime(client.created_at)} />
            <DetailRow icon={<Clock size={18} />} label="Última Actualización" value={formatDateTime(client.updated_at)} />
          </div>
        </div>

        <div className="p-4 border-t-4 border-black text-right">
            <Button onClick={onClose} className="font-bold border-2 border-black">Cerrar</Button>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;

import React from 'react';
// useTheme removido para MVP - sin hooks problemáticos
import { X, User, Mail, Phone, Hash, Calendar, Info } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';

// Se asume que los helpers de estilo están disponibles o se importan
const getTypographyStyles = (theme, level) => { /* ... */ };
const getBadgeStyles = (theme, status) => { /* ... */ };

const ClientDetailModal = ({ isOpen, onClose, client }) => {
  // Para MVP - tema fijo sin hooks problemáticos
  const theme = 'default';
  const isNeoBrutalism = theme?.includes('neo-brutalism');

  if (!isOpen || !client) return null;

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      background: 'var(--card)',
      padding: isNeoBrutalism ? '32px' : '24px',
      borderRadius: isNeoBrutalism ? '0px' : '8px',
      border: isNeoBrutalism ? '4px solid var(--border)' : '1px solid var(--border)',
      boxShadow: isNeoBrutalism ? '8px 8px 0px 0px rgba(0,0,0,1)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
      position: 'relative',
    }
  };

  const DetailItem = ({ icon, label, value }) => (
    <div
      className="flex items-start space-x-4 py-3 border-b border-border"
      data-testid={"client-detail-item-" + String(label).replace(/\s+/g, '-').toLowerCase()}
    >
      <div className="text-primary">{icon}</div>
      <div>
        <p className="text-muted-foreground" style={getTypographyStyles(theme, 'small')}>{label}</p>
        <p
          style={getTypographyStyles(theme, 'base')}
          data-testid={"client-detail-item-value-" + String(label).replace(/\s+/g, '-').toLowerCase()}
        >
          {value || 'N/A'}
        </p>
      </div>
    </div>
  );

  return (
    <div
      style={modalStyles.overlay}
      onClick={onClose}
      data-testid="client-detail-modal-overlay"
    >
      <div
        style={modalStyles.content}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalles de cliente ${client.name}`}
        data-testid="client-detail-modal"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4"
          aria-label="Cerrar modal de cliente"
          data-testid="client-detail-modal-close"
        >
          <X />
        </Button>
        
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 rounded-full flex items-center justify-center bg-primary text-primary-foreground mr-4">
            <User size={32} />
          </div>
          <div>
            <h2 data-testid="client-detail-modal-title" style={getTypographyStyles(theme, 'heading')}>{client.name} {client.last_name}</h2>
            {/* Reemplazo de badge manual por StatusBadge */}
            <StatusBadge active={!!client.status} data-testid="client-detail-modal-status" />
          </div>
        </div>

        <div className="space-y-2">
          <DetailItem icon={<Hash size={20} />} label="ID de Cliente" value={client.id} />
          <DetailItem icon={<User size={20} />} label="Nombre Completo" value={`${client.name} ${client.last_name || ''}`} />
          <DetailItem icon={<Info size={20} />} label="Documento" value={client.document_id} />
          <DetailItem icon={<Mail size={20} />} label="Email/Contacto" value={client.contact} />
          <DetailItem icon={<Calendar size={20} />} label="Fecha de Registro" value={new Date(client.created_at).toLocaleString()} />
          <DetailItem icon={<User size={20} />} label="ID de Usuario Creador" value={client.user_id} />
        </div>

      </div>
    </div>
  );
};

export default ClientDetailModal;

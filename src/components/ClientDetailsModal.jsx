import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * ClientDetailsModal Component
 *
 * Modal for displaying client details in read-only mode
 * Following Fluent Design System 2
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.client - Client data to display
 */
export default function ClientDetailsModal({ isOpen, onClose, client }) {
  const { t } = useI18n();

  if (!isOpen || !client) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog--medium" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog__header">
          <h2 className="dialog__title">{t('clients.modal.title.details', 'Detalles del Cliente')}</h2>
          <button
            type="button"
            className="dialog__close"
            onClick={onClose}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="dialog__content">
          <div className="client-details">
            {/* First Row - ID and Status */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.id', 'ID')}</span>
                <span className="client-details__value">{client.id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.status', 'Estado')}</span>
                <span className="client-details__value">
                  <span className={`badge badge--${client.status ? 'success' : 'default'}`}>
                    {client.status 
                      ? t('clients.status.active', 'Activo') 
                      : t('clients.status.inactive', 'Inactivo')
                    }
                  </span>
                </span>
              </div>
            </div>

            {/* Second Row - Name and Last Name */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.name', 'Nombre')}</span>
                <span className="client-details__value">{client.name || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.last_name', 'Apellido')}</span>
                <span className="client-details__value">{client.last_name || '-'}</span>
              </div>
            </div>

            {/* Third Row - Document ID and Contact */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.document', 'Documento de Identidad')}</span>
                <span className="client-details__value">{client.document_id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.contact', 'Contacto')}</span>
                <span className="client-details__value">
                  {client.contact?.email || client.contact?.phone || client.contact?.raw || '-'}
                </span>
              </div>
            </div>

            {/* Fourth Row - Created By and Created At */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.created_by', 'Creado Por (ID Usuario)')}</span>
                <span className="client-details__value">{client.user_id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">{t('clients.modal.field.created_at', 'Fecha de Creación')}</span>
                <span className="client-details__value">{formatDate(client.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dialog__footer dialog__footer--single">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              {t('action.close', 'Cerrar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

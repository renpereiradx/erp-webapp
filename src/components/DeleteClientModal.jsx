import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

/**
 * DeleteClientModal Component
 * 
 * Confirmation modal for deleting a client.
 * Uses Fluent Design System 2 SCSS classes.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.client - Client to delete
 * @param {Function} props.onConfirm - Callback when delete is confirmed
 * @param {boolean} props.loading - Loading state for delete operation
 */
const DeleteClientModal = ({ isOpen, onClose, client, onConfirm, loading }) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog--small dialog--centered" onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className="dialog__icon dialog__icon--danger">
          <AlertTriangle size={48} />
        </div>

        {/* Content */}
        <div className="dialog__content">
          <h2 className="dialog__title dialog__title--centered">
            {t('common.confirm.delete.title', '¿Estás seguro?')}
          </h2>
          <p className="dialog__description dialog__description--centered">
            {t('clients.modal.delete.message', 'Estás a punto de eliminar al cliente "{name}". Esta acción no se puede deshacer.', { name: client?.name || '' })}
          </p>
        </div>

        {/* Footer */}
        <div className="dialog__footer dialog__footer--centered">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {t('action.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(client)}
            disabled={loading}
            loading={loading}
          >
            {loading 
              ? t('action.deleting', 'Eliminando...') 
              : t('action.delete', 'Eliminar')
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClientModal;

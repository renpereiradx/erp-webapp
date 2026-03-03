import { X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-xl shadow-fluent-16 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#d1d1d1]">
          <h2 className="text-xl font-black text-[#323130] uppercase tracking-tighter">
            {t('clients.modal.title.details', 'Detalles del Cliente')}
          </h2>
          <button
            type="button"
            className="p-2 text-[#616161] hover:bg-[#f3f4f6] hover:text-[#323130] rounded-md transition-all"
            onClick={onClose}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ID */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.id', 'ID')}
              </span>
              <span className="text-sm font-mono font-bold text-[#323130]">{client.id || '-'}</span>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.status', 'Estado')}
              </span>
              <div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest ${
                  client.status 
                    ? 'bg-[#dff6dd] text-[#107c10]' 
                    : 'bg-[#f3f4f6] text-[#616161]'
                }`}>
                  {client.status 
                    ? t('clients.status.active', 'Activo') 
                    : t('clients.status.inactive', 'Inactivo')
                  }
                </span>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.name', 'Nombre')}
              </span>
              <span className="text-sm font-bold text-[#323130]">{client.name || '-'}</span>
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.last_name', 'Apellido')}
              </span>
              <span className="text-sm font-bold text-[#323130]">{client.last_name || '-'}</span>
            </div>

            {/* Document ID */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.document', 'Documento de Identidad')}
              </span>
              <span className="text-sm font-mono font-bold text-[#323130]">{client.document_id || '-'}</span>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.contact', 'Contacto')}
              </span>
              <span className="text-sm font-medium text-[#323130]">
                {client.contact?.email || client.contact?.phone || client.contact?.raw || '-'}
              </span>
            </div>

            {/* Created By */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.created_by', 'Creado Por (ID Usuario)')}
              </span>
              <span className="text-sm font-bold text-[#323130]">{client.user_id || '-'}</span>
            </div>

            {/* Created At */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#616161] uppercase tracking-[0.15em] block">
                {t('clients.modal.field.created_at', 'Fecha de Creación')}
              </span>
              <span className="text-sm font-bold text-[#323130]">{formatDate(client.created_at)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-8 border-t border-[#f3f4f6]">
            <button
              type="button"
              className="px-8 py-2 border border-[#d1d1d1] text-[#323130] text-[11px] font-bold uppercase rounded shadow-sm hover:bg-[#f3f4f6] active:scale-[0.98] tracking-widest transition-all"
              onClick={onClose}
            >
              {t('action.close', 'Cerrar')}
            </button>
            
            <button
              type="button"
              className="flex items-center gap-2 px-8 py-2 bg-[#106ebe] text-white text-[11px] font-bold uppercase rounded shadow-sm hover:bg-[#005a9e] active:scale-[0.98] tracking-widest transition-all"
              onClick={() => {
                onClose();
                navigate(`/receivables/client-profile/${client.id || client._key || 'CLI-001'}`);
              }}
            >
              <ExternalLink size={14} />
              Análisis de Riesgo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

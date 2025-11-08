import { X } from 'lucide-react';

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
  if (!isOpen || !client) return null;

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
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
          <h2 className="dialog__title">Client Details</h2>
          <button
            type="button"
            className="dialog__close"
            onClick={onClose}
            aria-label="Close"
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
                <span className="client-details__label">ID</span>
                <span className="client-details__value">{client.id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">Status</span>
                <span className="client-details__value">
                  <span className={`badge badge--${client.status ? 'success' : 'default'}`}>
                    {client.status ? 'Active' : 'Inactive'}
                  </span>
                </span>
              </div>
            </div>

            {/* Second Row - Name and Last Name */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">Name</span>
                <span className="client-details__value">{client.name || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">Last Name</span>
                <span className="client-details__value">{client.last_name || '-'}</span>
              </div>
            </div>

            {/* Third Row - Document ID and Contact */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">Document ID</span>
                <span className="client-details__value">{client.document_id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">Contact</span>
                <span className="client-details__value">
                  {client.contact?.email || client.contact?.phone || client.contact?.raw || client.contact || '-'}
                </span>
              </div>
            </div>

            {/* Fourth Row - Created By and Created At */}
            <div className="client-details__row">
              <div className="client-details__field">
                <span className="client-details__label">Created By (User ID)</span>
                <span className="client-details__value">{client.user_id || '-'}</span>
              </div>
              <div className="client-details__field">
                <span className="client-details__label">Created At</span>
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
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

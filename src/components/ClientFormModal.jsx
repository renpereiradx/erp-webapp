import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useClientStore from '@/store/useClientStore';

/**
 * ClientFormModal Component
 *
 * Modal for creating and editing clients following Fluent Design System 2
 * Handles validation and integrates with Zustand store
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes (shouldRefresh)
 * @param {Object} props.client - Client to edit (null for create mode)
 */
export default function ClientFormModal({ isOpen, onClose, client = null }) {
  const { t } = useI18n();
  const { createClient, updateClient } = useClientStore();

  const isEditMode = client !== null;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    document_id: '',
    contact: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with client data in edit mode
  useEffect(() => {
    if (isOpen) {
      if (client) {
        // Parsear el nombre completo si viene como displayName
        let firstName = client.name || '';
        let lastName = client.last_name || '';

        // Si solo tenemos displayName, intentar separar
        if (client.displayName && !client.last_name) {
          const parts = client.displayName.split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        const newFormData = {
          name: firstName,
          last_name: lastName,
          document_id: client.document_id || client.tax_id || '',
          contact: client.contact?.phone || client.contact?.email || client.contact?.raw || '',
        };

        setFormData(newFormData);
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          last_name: '',
          document_id: '',
          contact: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, client]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('clients.modal.error.name_required', 'El nombre es requerido');
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = t('clients.modal.error.last_name_required', 'El apellido es requerido');
    }

    if (!formData.document_id.trim()) {
      newErrors.document_id = t('clients.modal.error.document_required', 'El documento es requerido');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para la API
      const clientData = {
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        document_id: formData.document_id.trim(),
        contact: formData.contact.trim() || undefined,
      };

      let result;
      if (isEditMode) {
        result = await updateClient(client.id, clientData);
      } else {
        result = await createClient(clientData);
      }

      if (result.success) {
        // Cerrar modal y refrescar lista
        onClose(true);
      } else {
        // Mostrar error
        setErrors({
          submit: result.error || t('clients.modal.error.generic', 'Error al guardar el cliente')
        });
      }
    } catch (error) {
      console.error('Error saving client:', error);
      setErrors({
        submit: error.message || t('clients.modal.error.generic', 'Error al guardar el cliente')
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={handleClose}>
      <div className="dialog dialog--medium" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog__header">
          <h2 className="dialog__title">
            {isEditMode ? 'Edit Client' : 'New Client'}
          </h2>
          <button
            type="button"
            className="dialog__close"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="dialog__content">
          {/* Nombre y Apellido - Grid de 2 columnas */}
          <div className="form-field-group form-field-group--grid-2">
            {/* Nombre */}
            <div className="form-field">
              <label htmlFor="name" className="form-field__label">
                Name <span className="form-field__required">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-field__input ${errors.name ? 'form-field__input--error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter first name"
              />
              {errors.name && (
                <span className="form-field__error">{errors.name}</span>
              )}
            </div>

            {/* Apellido */}
            <div className="form-field">
              <label htmlFor="last_name" className="form-field__label">
                Last Name <span className="form-field__required">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className={`form-field__input ${errors.last_name ? 'form-field__input--error' : ''}`}
                value={formData.last_name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <span className="form-field__error">{errors.last_name}</span>
              )}
            </div>
          </div>

          {/* Documento */}
          <div className="form-field">
            <label htmlFor="document_id" className="form-field__label">
              Document ID <span className="form-field__required">*</span>
            </label>
            <input
              id="document_id"
              name="document_id"
              type="text"
              className={`form-field__input ${errors.document_id ? 'form-field__input--error' : ''}`}
              value={formData.document_id}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Enter document ID"
            />
            {errors.document_id && (
              <span className="form-field__error">{errors.document_id}</span>
            )}
          </div>

          {/* Contacto */}
          <div className="form-field">
            <label htmlFor="contact" className="form-field__label">
              Contact
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              className="form-field__input"
              value={formData.contact}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder="Enter phone number or email"
            />
          </div>

          {/* Error general */}
          {errors.submit && (
            <div className="dialog__error">
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className="dialog__footer">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

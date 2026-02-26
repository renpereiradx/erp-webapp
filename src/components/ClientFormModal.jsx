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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-xl bg-white rounded-xl shadow-fluent-16 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#d1d1d1]">
          <h2 className="text-xl font-black text-[#323130] uppercase tracking-tighter">
            {isEditMode 
              ? t('clients.modal.title.edit', 'Editar Cliente') 
              : t('clients.modal.title.create', 'Nuevo Cliente')
            }
          </h2>
          <button
            type="button"
            className="p-2 text-[#616161] hover:bg-[#f3f4f6] hover:text-[#323130] rounded-md transition-all"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
          {/* Nombre y Apellido - Grid de 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-[10px] font-black text-[#616161] uppercase tracking-widest block">
                {t('clients.modal.field.name', 'Nombre')} <span className="text-[#a4262c]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`w-full h-10 px-3 bg-white border ${errors.name ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t('clients.modal.placeholder.name', 'Ingrese el nombre')}
              />
              {errors.name && (
                <span className="text-[10px] font-bold text-[#a4262c] uppercase">{errors.name}</span>
              )}
            </div>

            {/* Apellido */}
            <div className="space-y-2">
              <label htmlFor="last_name" className="text-[10px] font-black text-[#616161] uppercase tracking-widest block">
                {t('clients.modal.field.last_name', 'Apellido')} <span className="text-[#a4262c]">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className={`w-full h-10 px-3 bg-white border ${errors.last_name ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
                value={formData.last_name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t('clients.modal.placeholder.last_name', 'Ingrese el apellido')}
              />
              {errors.last_name && (
                <span className="text-[10px] font-bold text-[#a4262c] uppercase">{errors.last_name}</span>
              )}
            </div>
          </div>

          {/* Documento */}
          <div className="space-y-2">
            <label htmlFor="document_id" className="text-[10px] font-black text-[#616161] uppercase tracking-widest block">
              {t('clients.modal.field.document', 'Documento de Identidad')} <span className="text-[#a4262c]">*</span>
            </label>
            <input
              id="document_id"
              name="document_id"
              type="text"
              className={`w-full h-10 px-3 bg-white border ${errors.document_id ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
              value={formData.document_id}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.document', 'CI, RUC, etc.')}
            />
            {errors.document_id && (
              <span className="text-[10px] font-bold text-[#a4262c] uppercase">{errors.document_id}</span>
            )}
          </div>

          {/* Contacto */}
          <div className="space-y-2">
            <label htmlFor="contact" className="text-[10px] font-black text-[#616161] uppercase tracking-widest block">
              {t('clients.modal.field.contact', 'Contacto')}
            </label>
            <input
              id="contact"
              name="contact"
              type="text"
              className="w-full h-10 px-3 bg-white border border-[#d1d1d1] rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none"
              value={formData.contact}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.contact', 'Teléfono, email, etc.')}
            />
          </div>

          {/* Error general */}
          {errors.submit && (
            <div className="p-3 bg-[#a4262c]/10 border-l-4 border-[#a4262c] rounded text-[#a4262c] text-xs font-bold uppercase">
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#f3f4f6]">
            <button
              type="button"
              className="px-5 py-2 border border-[#d1d1d1] text-[#323130] text-xs font-bold uppercase rounded hover:bg-[#f3f4f6] transition-all"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('action.cancel', 'Cancelar')}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#106ebe] text-white text-xs font-black uppercase rounded shadow-sm hover:bg-[#005a9e] active:scale-[0.98] transition-all disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? t('action.saving', 'Guardando...') 
                : t('action.save', 'Guardar')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

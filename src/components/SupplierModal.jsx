import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Save, Loader, Building, FileText, Phone, MessageSquare, MapPin, ToggleLeft, ToggleRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import useSupplierStore from '@/store/useSupplierStore';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';

/**
 * SupplierModal Component
 * 
 * Modal for creating and editing suppliers.
 * Uses Fluent Design System 2 SCSS classes.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.supplier - Supplier to edit (null for create mode)
 * @param {Function} props.onSuccess - Callback when save is successful
 */
const SupplierModal = ({ isOpen, onClose, supplier, onSuccess }) => {
  const { t } = useI18n();
  const { createSupplier, updateSupplier, loading } = useSupplierStore();
  const { success, error: showError } = useToast();

  const isEditMode = supplier !== null;

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    contact_info: {
      phone: '',
      fax: '',
      address: ''
    },
    status: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        const contactInfo = supplier.contact_info 
          ? (typeof supplier.contact_info === 'object' ? supplier.contact_info : JSON.parse(supplier.contact_info)) 
          : {};
        setFormData({
          name: supplier.name || '',
          tax_id: supplier.tax_id || '',
          contact_info: {
            phone: contactInfo.phone || '',
            fax: contactInfo.fax || '',
            address: contactInfo.address || ''
          },
          status: supplier.status !== undefined ? supplier.status : true,
        });
      } else {
        setFormData({
          name: '',
          tax_id: '',
          contact_info: { phone: '', fax: '', address: '' },
          status: true
        });
      }
    }
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      contact_info: { ...prev.contact_info, [name]: value },
    }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({ ...prev, status: !prev.status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        contact_info: formData.contact_info
      };

      if (isEditMode) {
        await updateSupplier(supplier.id, dataToSend);
        success(t('suppliers.modal.success.update', 'Proveedor actualizado con éxito'));
      } else {
        await createSupplier(dataToSend);
        success(t('suppliers.modal.success.create', 'Proveedor creado con éxito'));
      }
      onSuccess();
    } catch (err) {
      showError(err.message || t('suppliers.modal.error.generic', 'Error al guardar el proveedor'));
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog dialog--medium" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dialog__header">
          <div className="dialog__title-wrapper">
            <Building className="dialog__title-icon" size={24} />
            <h2 className="dialog__title">
              {isEditMode 
                ? t('suppliers.modal.title.edit', 'Editar Proveedor') 
                : t('suppliers.modal.title.create', 'Nuevo Proveedor')
              }
            </h2>
          </div>
          <button
            type="button"
            className="dialog__close"
            onClick={onClose}
            disabled={loading}
            aria-label={t('action.close', 'Cerrar')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="dialog__content">
          <div className="form-field-group">
            {/* Name */}
            <div className="form-field">
              <label htmlFor="name" className="form-field__label">
                {t('suppliers.modal.field.name', 'Nombre del Proveedor')} <span className="form-field__required">*</span>
              </label>
              <div className="input-group">
                <span className="input-group__prepend">
                  <Building size={16} />
                </span>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder={t('suppliers.modal.placeholder.name', 'Ej: Tech Supplies Inc.')}
                  required
                />
              </div>
            </div>

            {/* Tax ID */}
            <div className="form-field">
              <label htmlFor="tax_id" className="form-field__label">
                {t('suppliers.modal.field.tax_id', 'RUC')}
              </label>
              <div className="input-group">
                <span className="input-group__prepend">
                  <FileText size={16} />
                </span>
                <input
                  id="tax_id"
                  name="tax_id"
                  type="text"
                  className="input"
                  value={formData.tax_id}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder={t('suppliers.modal.placeholder.tax_id', 'Ej: 12345678-9')}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-field">
              <label htmlFor="phone" className="form-field__label">
                {t('suppliers.modal.field.phone', 'Teléfono')}
              </label>
              <div className="input-group">
                <span className="input-group__prepend">
                  <Phone size={16} />
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  className="input"
                  value={formData.contact_info.phone}
                  onChange={handleContactInfoChange}
                  disabled={loading}
                  placeholder={t('suppliers.modal.placeholder.phone', 'Ej: +595 983 111 222')}
                />
              </div>
            </div>

            {/* Fax */}
            <div className="form-field">
              <label htmlFor="fax" className="form-field__label">
                {t('suppliers.modal.field.fax', 'Fax')}
              </label>
              <div className="input-group">
                <span className="input-group__prepend">
                  <MessageSquare size={16} />
                </span>
                <input
                  id="fax"
                  name="fax"
                  type="text"
                  className="input"
                  value={formData.contact_info.fax}
                  onChange={handleContactInfoChange}
                  disabled={loading}
                  placeholder={t('suppliers.modal.placeholder.fax', 'Ej: FAX-PAR-6356')}
                />
              </div>
            </div>

            {/* Address */}
            <div className="form-field">
              <label htmlFor="address" className="form-field__label">
                {t('suppliers.modal.field.address', 'Dirección')}
              </label>
              <div className="input-group">
                <span className="input-group__prepend">
                  <MapPin size={16} />
                </span>
                <input
                  id="address"
                  name="address"
                  type="text"
                  className="input"
                  value={formData.contact_info.address}
                  onChange={handleContactInfoChange}
                  disabled={loading}
                  placeholder={t('suppliers.modal.placeholder.address', 'Ej: Av. Mcal. López 1234')}
                />
              </div>
            </div>

            {/* Status Toggle */}
            <div className="form-field form-field--inline">
              <label className="form-field__label">
                {t('suppliers.modal.field.status', 'Estado')}
              </label>
              <div className="form-field__control">
                <StatusBadge active={!!formData.status} />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleStatusToggle}
                  aria-label={t('action.toggle_status', 'Alternar estado')}
                >
                  {formData.status ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="dialog__footer">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              loading={loading}
            >
              {loading ? (
                <><Loader className="animate-spin" size={16} /> {t('action.saving', 'Guardando...')}</>
              ) : (
                <><Save size={16} /> {isEditMode ? t('action.save_changes', 'Guardar Cambios') : t('action.create', 'Crear')}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SupplierModal;

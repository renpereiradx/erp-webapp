import { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useProductStore from '../store/useProductStore';
import BusinessManagementAPI from '../services/BusinessManagementAPI';

/**
 * ProductFormModal Component
 *
 * Modal for creating and editing products following Fluent Design System 2
 * Handles validation and integrates with Zustand store
 * Supports PHYSICAL, SERVICE, and PRODUCTION product types
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Callback when modal closes
 * @param {Object} props.product - Product to edit (null for create mode)
 */
export default function ProductFormModal({ isOpen, onClose, product = null }) {
  const { t } = useI18n();
  const { createProduct, updateProduct } = useProductStore();
  const apiClient = new BusinessManagementAPI();

  const isEditMode = product !== null;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    productType: 'PHYSICAL',
    description: '',
    barcode: '',
    brand: '',
    origin: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await apiClient.getCategories();

      // La API devuelve { categories: [...] }
      if (response && response.categories && Array.isArray(response.categories)) {
        setCategories(response.categories);
      } else if (Array.isArray(response)) {
        // Fallback: si devuelve array directo
        setCategories(response);
      } else if (response && response.data && Array.isArray(response.data)) {
        // Fallback adicional: por si viene en response.data
        setCategories(response.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize form with product data in edit mode
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // El objeto product del search YA tiene todos los campos que necesitamos
        // No necesitamos hacer otra llamada al API
        const newFormData = {
          name: product.product_name || product.name || '',
          category: product.category_id?.toString() || product.id_category?.toString() || '',
          productType: product.product_type || 'PHYSICAL',
          description: product.description || '',
          barcode: product.barcode || '',
          brand: product.brand || '',
          origin: product.origin || '',
        };

        setFormData(newFormData);
      } else {
        // Reset form for create mode
        setFormData({
          name: '',
          category: '',
          productType: 'PHYSICAL',
          description: '',
          barcode: '',
          brand: '',
          origin: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, product]);

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
      newErrors.name = t('products.modal.error.name_required');
    }

    if (!formData.category) {
      newErrors.category = t('products.modal.error.category_required');
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (formData.barcode && formData.barcode.length > 50) {
      newErrors.barcode = t('products.modal.error.barcode_too_long');
    }

    if (formData.brand && formData.brand.length > 100) {
      newErrors.brand = t('products.modal.error.brand_too_long');
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
      // Formato esperado por el backend
      const productData = {
        name: formData.name.trim(),
        id_category: parseInt(formData.category),
        description: formData.description.trim(), // Requerido
        product_type: formData.productType,
      };

      // Campos opcionales - solo agregar si tienen valor
      if (formData.barcode?.trim()) {
        productData.barcode = formData.barcode.trim();
      }
      if (formData.brand?.trim()) {
        productData.brand = formData.brand.trim();
      }
      if (formData.origin) {
        productData.origin = formData.origin;
      }

      let response;
      // En modo edición, agregar state
      if (isEditMode) {
        productData.state = true; // Siempre mantener activo al editar
        // Usar product_id (del API financiero) o id (del API estándar)
        const productId = product.product_id || product.id;
        response = await updateProduct(productId, productData);
      } else {
        response = await createProduct(productData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      // TODO: Show error notification
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="product-form-modal__backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-modal-title"
    >
      <div className="product-form-modal__container">
        {/* Header */}
        <div className="product-form-modal__header">
          <div className="product-form-modal__header-content">
            <h2 id="product-form-modal-title" className="product-form-modal__title">
              {isEditMode ? t('products.modal.edit.title') : t('products.modal.create.title')}
            </h2>
            <p className="product-form-modal__subtitle">
              {isEditMode ? t('products.modal.edit.subtitle') : t('products.modal.create.subtitle')}
            </p>
          </div>
          <button
            type="button"
            className="product-form-modal__close-button"
            onClick={onClose}
            aria-label={t('products.modal.action.close')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="product-form-modal__body">
            {/* Required Fields Section */}
            <div className="product-form-modal__section">
              <h3 className="product-form-modal__section-title">
                {t('products.modal.section.product_info')}
              </h3>
              <div className="product-form-modal__form-grid">
                {/* Product Name */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-name" className="product-form-modal__label">
                    {t('products.modal.field.product_name')}
                    <span className="product-form-modal__required">*</span>
                  </label>
                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    className="product-form-modal__input"
                    placeholder={t('products.modal.placeholder.product_name')}
                    value={formData.name}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && (
                    <p className="product-form-modal__error-text" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-category" className="product-form-modal__label">
                    {t('products.modal.field.category')}
                    <span className="product-form-modal__required">*</span>
                  </label>
                  <select
                    id="product-category"
                    name="category"
                    className="product-form-modal__select"
                    value={formData.category}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.category}
                    disabled={loadingCategories}
                  >
                    <option value="">
                      {loadingCategories ? 'Cargando categorías...' : t('products.modal.placeholder.category')}
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="product-form-modal__error-text" role="alert">
                      {errors.category}
                    </p>
                  )}
                </div>

                {/* Product Type */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-type" className="product-form-modal__label">
                    {t('products.modal.field.product_type')}
                  </label>
                  <select
                    id="product-type"
                    name="productType"
                    className="product-form-modal__select"
                    value={formData.productType}
                    onChange={handleChange}
                  >
                    <option value="PHYSICAL">{t('products.type.physical')}</option>
                    <option value="SERVICE">{t('products.type.service')}</option>
                    <option value="PRODUCTION">Producto Manufacturado (Producción)</option>
                  </select>
                </div>

                {/* Description */}
                <div className="product-form-modal__form-field product-form-modal__form-field--full-width">
                  <label htmlFor="product-description" className="product-form-modal__label">
                    {t('products.modal.field.description')}
                    <span className="product-form-modal__required">*</span>
                  </label>
                  <textarea
                    id="product-description"
                    name="description"
                    className="product-form-modal__textarea"
                    placeholder={t('products.modal.placeholder.description')}
                    value={formData.description}
                    onChange={handleChange}
                    aria-required="true"
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="product-form-modal__error-text" role="alert">
                      {errors.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="product-form-modal__section">
              <h3 className="product-form-modal__section-title">
                {t('products.modal.section.additional_details')}
              </h3>
              <div className="product-form-modal__form-grid">

                {/* Barcode */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-barcode" className="product-form-modal__label">
                    {t('products.modal.field.barcode')}
                  </label>
                  <input
                    id="product-barcode"
                    name="barcode"
                    type="text"
                    maxLength="50"
                    className="product-form-modal__input"
                    placeholder={t('products.modal.placeholder.barcode')}
                    value={formData.barcode}
                    onChange={handleChange}
                    aria-invalid={!!errors.barcode}
                  />
                  <p className="product-form-modal__helper-text">
                    {t('products.modal.helper.barcode')}
                  </p>
                  {errors.barcode && (
                    <p className="product-form-modal__error-text" role="alert">
                      {errors.barcode}
                    </p>
                  )}
                </div>

                {/* Brand */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-brand" className="product-form-modal__label">
                    {t('products.modal.field.brand')}
                  </label>
                  <input
                    id="product-brand"
                    name="brand"
                    type="text"
                    maxLength="100"
                    className="product-form-modal__input"
                    placeholder={t('products.modal.placeholder.brand')}
                    value={formData.brand}
                    onChange={handleChange}
                    aria-invalid={!!errors.brand}
                  />
                  <p className="product-form-modal__helper-text">
                    {t('products.modal.helper.brand')}
                  </p>
                  {errors.brand && (
                    <p className="product-form-modal__error-text" role="alert">
                      {errors.brand}
                    </p>
                  )}
                </div>

                {/* Origin */}
                <div className="product-form-modal__form-field">
                  <label htmlFor="product-origin" className="product-form-modal__label">
                    {t('products.modal.field.origin')}
                  </label>
                  <select
                    id="product-origin"
                    name="origin"
                    className="product-form-modal__select"
                    value={formData.origin}
                    onChange={handleChange}
                  >
                    <option value="">{t('products.modal.placeholder.origin')}</option>
                    <option value="NACIONAL">{t('products.origin.national')}</option>
                    <option value="IMPORTADO">{t('products.origin.imported')}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="product-form-modal__footer">
            <button
              type="button"
              className="product-form-modal__button product-form-modal__button--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('products.modal.action.cancel')}
            </button>
            <button
              type="submit"
              className="product-form-modal__button product-form-modal__button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('products.modal.action.saving') : t('products.modal.action.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

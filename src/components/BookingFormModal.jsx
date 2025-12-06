/**
 * Modal de Formulario de Reserva - MVP
 * Componente para crear/editar reservas
 * Basado en: specs/booking_management_dashboard/new_booking_form/
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import useReservationStore from '@/store/useReservationStore';
import useProductStore from '@/store/useProductStore';
import useClientStore from '@/store/useClientStore';

const BookingFormModal = ({ isOpen, onClose, onSuccess, editingReservation = null, initialData = null }) => {
  const { t } = useI18n();

  // Stores
  const { createReservation, updateReservation, loading } = useReservationStore();
  const { products } = useProductStore();
  const { searchClients, searchResults: clientSearchResults } = useClientStore();

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    client_id: '',
    start_time: '',
    duration: 1 // Duration in hours (1 hour default)
  });

  const [errors, setErrors] = useState({});
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // Helper: Convert ISO 8601 to datetime-local format
  const convertToDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    // Remove the 'Z' and milliseconds if present
    // Format: YYYY-MM-DDTHH:mm
    return isoString.replace(/\.\d{3}Z$/, '').replace('Z', '').slice(0, 16);
  };

  // Reset form when modal opens/closes or when editing changes
  useEffect(() => {
    if (isOpen && editingReservation) {
      // Load data for editing
      setFormData({
        product_id: editingReservation.product_id || '',
        client_id: editingReservation.client_id || '',
        start_time: convertToDatetimeLocal(editingReservation.start_time),
        duration: editingReservation.duration || 1
      });
      setSelectedClient(editingReservation.client_name ? {
        id: editingReservation.client_id,
        name: editingReservation.client_name
      } : null);
    } else if (isOpen && initialData) {
      // Load initial data from slot selection
      setFormData({
        product_id: initialData.product_id || '',
        client_id: '',
        start_time: convertToDatetimeLocal(initialData.start_time),
        duration: initialData.duration || 1
      });
      setSelectedClient(null);
      setClientSearchTerm('');
      setErrors({});
    } else if (isOpen) {
      // Reset for new reservation
      setFormData({
        product_id: '',
        client_id: '',
        start_time: '',
        duration: 1
      });
      setSelectedClient(null);
      setClientSearchTerm('');
      setErrors({});
    }
  }, [isOpen, editingReservation, initialData]);

  // Client search handler
  const handleClientSearch = async (term) => {
    setClientSearchTerm(term);
    if (term.length >= 3) {
      await searchClients(term);
      setShowClientDropdown(true);
    } else {
      setShowClientDropdown(false);
    }
  };

  // Select client from search results
  const handleSelectClient = (client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id }));
    setClientSearchTerm(client.name || client.displayName || '');
    setShowClientDropdown(false);
    setErrors(prev => ({ ...prev, client_id: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.product_id) {
      newErrors.product_id = t('booking.modal.error.product_required');
    }

    if (!formData.client_id) {
      newErrors.client_id = t('booking.modal.error.client_required');
    }

    if (!formData.start_time) {
      newErrors.start_time = t('booking.modal.error.start_time_required');
    }

    if (!formData.duration || formData.duration <= 0) {
      newErrors.duration = t('booking.modal.error.duration_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert datetime-local to ISO 8601 format for API
      const apiData = {
        ...formData,
        start_time: formData.start_time ? `${formData.start_time}:00Z` : ''
      };

      let result;

      if (editingReservation) {
        // Update existing reservation
        result = await updateReservation(editingReservation.id, apiData);
      } else {
        // Create new reservation
        result = await createReservation(apiData);
      }

      if (result && result.success) {
        // Close modal first
        onClose();
        // Then call onSuccess which will show notification and redirect
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Show API error
        setErrors({ submit: result?.error || t('booking.modal.error.generic') });
      }
    } catch (error) {
      setErrors({ submit: error.message || t('booking.modal.error.generic') });
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="booking-modal__header">
          <h2 className="booking-modal__title">
            {editingReservation
              ? t('booking.modal.edit_title')
              : t('booking.modal.create_title')}
          </h2>
          <button
            className="booking-modal__close"
            onClick={onClose}
            aria-label={t('action.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="booking-modal__form">
          {/* Product Select */}
          <div className="form-field">
            <label htmlFor="product" className="form-field__label">
              {t('booking.modal.product')}
            </label>
            {initialData ? (
              <input
                type="text"
                className="form-field__input"
                value={initialData.product_name || formData.product_id}
                disabled
                style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
              />
            ) : (
              <select
                id="product"
                className={`form-field__select ${errors.product_id ? 'form-field__select--error' : ''}`}
                value={formData.product_id}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, product_id: e.target.value }));
                  setErrors(prev => ({ ...prev, product_id: '' }));
                }}
              >
                <option value="">{t('booking.modal.select_product')}</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            )}
            {errors.product_id && (
              <p className="form-field__error">{errors.product_id}</p>
            )}
          </div>

          {/* Client Search */}
          <div className="form-field" style={{ position: 'relative' }}>
            <label htmlFor="client" className="form-field__label">
              {t('booking.modal.client')}
            </label>
            <div className="form-field__input-wrapper">
              <input
                id="client"
                type="text"
                className={`form-field__input ${errors.client_id ? 'form-field__input--error' : ''}`}
                placeholder={t('booking.modal.search_client_placeholder')}
                value={clientSearchTerm}
                onChange={(e) => handleClientSearch(e.target.value)}
                onFocus={() => {
                  if (clientSearchResults.length > 0) {
                    setShowClientDropdown(true);
                  }
                }}
              />
              <Search className="form-field__icon" size={20} />
            </div>

            {/* Client dropdown */}
            {showClientDropdown && clientSearchResults.length > 0 && (
              <div
                className="client-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% - 0.5rem)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 9999,
                  marginTop: '0.25rem'
                }}
              >
                {clientSearchResults.slice(0, 5).map(client => (
                  <button
                    key={client.id}
                    type="button"
                    className="client-dropdown__item"
                    onClick={() => handleSelectClient(client)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                    }}
                  >
                    <div
                      className="client-dropdown__name"
                      style={{
                        fontWeight: '500',
                        color: '#111827',
                        fontSize: '0.875rem',
                        marginBottom: client.document_id ? '0.25rem' : 0
                      }}
                    >
                      {client.name || client.displayName}
                    </div>
                    {client.document_id && (
                      <div
                        className="client-dropdown__doc"
                        style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}
                      >
                        {client.document_id}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {errors.client_id && (
              <p className="form-field__error">{errors.client_id}</p>
            )}
          </div>

          {/* Start Date/Time */}
          <div className="form-field">
            <label htmlFor="start_time" className="form-field__label">
              {t('booking.modal.start_time')}
            </label>
            <div className="form-field__input-wrapper">
              <input
                id="start_time"
                type="datetime-local"
                className={`form-field__input ${errors.start_time ? 'form-field__input--error' : ''}`}
                value={formData.start_time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, start_time: e.target.value }));
                  setErrors(prev => ({ ...prev, start_time: '' }));
                }}
                disabled={!!initialData}
                style={initialData ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
              />
              <Calendar className="form-field__icon" size={20} />
            </div>
            {errors.start_time && (
              <p className="form-field__error">{errors.start_time}</p>
            )}
          </div>

          {/* Duration */}
          <div className="form-field">
            <label htmlFor="duration" className="form-field__label">
              Horas
            </label>
            <input
              id="duration"
              type="number"
              min="1"
              step="1"
              className={`form-field__input ${errors.duration ? 'form-field__input--error' : ''}`}
              value={formData.duration}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }));
                setErrors(prev => ({ ...prev, duration: '' }));
              }}
              disabled={!!initialData}
              style={initialData ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
            />
            {errors.duration && (
              <p className="form-field__error">{errors.duration}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="form-field__error form-field__error--submit">
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div
            className="booking-modal__footer"
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid #e5e7eb'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                backgroundColor: '#ffffff',
                color: '#374151',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f9fafb';
                  e.currentTarget.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }
              }}
            >
              {t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: loading ? '#93c5fd' : '#3b82f6',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }
              }}
            >
              {loading
                ? t('booking.modal.creating')
                : (editingReservation
                    ? t('booking.modal.update')
                    : t('booking.modal.create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;

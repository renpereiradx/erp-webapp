import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'

const EMPTY_FORM = {
  name: '',
  taxId: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
}

const sanitizeContact = ({ email, phone, address }) => {
  const contact = {}
  if (email) contact.email = email
  if (phone) contact.phone = phone
  if (address) contact.address = address
  return Object.keys(contact).length > 0 ? contact : undefined
}

const parseAddressFromSupplier = supplier => {
  if (!supplier) return ''
  const { contact = {}, contact_info: contactInfo = {} } = supplier
  const source =
    contact.address ||
    contactInfo.address ||
    contact.addressLine ||
    contactInfo.addressLine
  if (typeof source === 'string') return source
  if (source && typeof source === 'object') {
    const { street, city, state, country } = source
    return [street, city, state, country].filter(Boolean).join(', ')
  }
  if (contact.city || contact.country || contact.street) {
    return [contact.street, contact.city, contact.country]
      .filter(Boolean)
      .join(', ')
  }
  return ''
}

const normalizeSupplierForForm = supplier => {
  if (!supplier) return { ...EMPTY_FORM }
  const contact = supplier.contact || supplier.contact_info || {}
  return {
    name: supplier.name || '',
    taxId: supplier.taxId || supplier.tax_id || '',
    contactEmail: contact.email || '',
    contactPhone: contact.phone || contact.phone_number || '',
    contactAddress: parseAddressFromSupplier(supplier),
  }
}

const SupplierDirectoryFormModal = ({ isOpen, onClose, supplier = null }) => {
  const { t } = useI18n()
  const toast = useToast()
  const { createSupplier, updateSupplier, refreshAfterMutation } =
    useSupplierDirectoryStore()

  const [formData, setFormData] = useState({ ...EMPTY_FORM })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = useMemo(() => Boolean(supplier && supplier.id), [supplier])

  useEffect(() => {
    if (!isOpen) return
    setFormData(normalizeSupplierForForm(supplier))
    setErrors({})
  }, [isOpen, supplier])

  const handleChange = event => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.name.trim()) {
      nextErrors.name = t(
        'supplier.form.error.name_required',
        'El nombre es obligatorio'
      )
    }
    if (!formData.taxId.trim()) {
      nextErrors.taxId = t(
        'supplier.form.error.tax_required',
        'El RFC/Tax ID es obligatorio'
      )
    }
    if (
      formData.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())
    ) {
      nextErrors.contactEmail = t(
        'supplier.form.error.email_invalid',
        'Correo electrónico inválido'
      )
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const buildPayload = () => {
    const payload = {
      name: formData.name.trim(),
      tax_id: formData.taxId.trim(),
    }

    const contactInfo = sanitizeContact({
      email: formData.contactEmail.trim(),
      phone: formData.contactPhone.trim(),
      address: formData.contactAddress.trim(),
    })

    if (contactInfo) {
      payload.contact_info = contactInfo
    }

    if (isEditMode && typeof supplier.status !== 'undefined') {
      payload.status = supplier.status
    }

    return payload
  }

  const handleSubmit = async event => {
    event.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const payload = buildPayload()
      let result
      if (isEditMode) {
        result = await updateSupplier(supplier.id, payload)
      } else {
        result = await createSupplier(payload)
      }

      if (result?.success) {
        toast.success(
          isEditMode
            ? t(
                'supplier.form.success.update',
                'Proveedor actualizado con éxito'
              )
            : t('supplier.form.success.create', 'Proveedor creado con éxito')
        )
        await refreshAfterMutation()
        onClose(true)
        return
      }

      const message =
        result?.error ||
        t('supplier.form.error.generic', 'No se pudo guardar el proveedor')
      setErrors(prev => ({ ...prev, submit: message }))
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit:
          error?.message ||
          t('supplier.form.error.generic', 'No se pudo guardar el proveedor'),
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    onClose(false)
  }

  if (!isOpen) return null

  return (
    <div className='dialog-overlay' onClick={handleClose}>
      <div
        className='dialog dialog--medium'
        onClick={event => event.stopPropagation()}
      >
        <div className='dialog__header'>
          <h2 className='dialog__title'>
            {isEditMode
              ? t('supplier.form.title.edit', 'Editar proveedor')
              : t('supplier.form.title.create', 'Nuevo proveedor')}
          </h2>
          <button
            type='button'
            className='dialog__close'
            onClick={handleClose}
            aria-label={t('action.close', 'Cerrar')}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='dialog__content'>
          <div className='form-field-group form-field-group--grid-2'>
            <div className='form-field'>
              <label htmlFor='name' className='form-field__label'>
                {t('supplier.form.field.name', 'Nombre del proveedor')}{' '}
                <span className='form-field__required'>*</span>
              </label>
              <input
                id='name'
                name='name'
                type='text'
                className={`form-field__input ${
                  errors.name ? 'form-field__input--error' : ''
                }`}
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.name',
                  'Ej. Distribuciones del Pacífico'
                )}
                autoFocus
              />
              {errors.name && (
                <span className='form-field__error'>{errors.name}</span>
              )}
            </div>

            <div className='form-field'>
              <label htmlFor='taxId' className='form-field__label'>
                {t('supplier.form.field.taxId', 'RFC / Tax ID')}{' '}
                <span className='form-field__required'>*</span>
              </label>
              <input
                id='taxId'
                name='taxId'
                type='text'
                className={`form-field__input ${
                  errors.taxId ? 'form-field__input--error' : ''
                }`}
                value={formData.taxId}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.taxId',
                  'Ej. ABC123456789'
                )}
              />
              {errors.taxId && (
                <span className='form-field__error'>{errors.taxId}</span>
              )}
            </div>
          </div>

          <div className='form-field-group form-field-group--grid-2'>
            <div className='form-field'>
              <label htmlFor='contactEmail' className='form-field__label'>
                {t('supplier.form.field.email', 'Correo de contacto')}
              </label>
              <input
                id='contactEmail'
                name='contactEmail'
                type='email'
                className={`form-field__input ${
                  errors.contactEmail ? 'form-field__input--error' : ''
                }`}
                value={formData.contactEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.email',
                  'correo@empresa.com'
                )}
              />
              {errors.contactEmail && (
                <span className='form-field__error'>{errors.contactEmail}</span>
              )}
            </div>

            <div className='form-field'>
              <label htmlFor='contactPhone' className='form-field__label'>
                {t('supplier.form.field.phone', 'Teléfono de contacto')}
              </label>
              <input
                id='contactPhone'
                name='contactPhone'
                type='text'
                className='form-field__input'
                value={formData.contactPhone}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.phone',
                  '+52 55 1234 5678'
                )}
              />
            </div>
          </div>

          <div className='form-field'>
            <label htmlFor='contactAddress' className='form-field__label'>
              {t('supplier.form.field.address', 'Dirección')}
            </label>
            <textarea
              id='contactAddress'
              name='contactAddress'
              className='form-field__textarea'
              value={formData.contactAddress}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t(
                'supplier.form.placeholder.address',
                'Calle, ciudad, país'
              )}
              rows={3}
            />
          </div>

          {errors.submit && (
            <div className='dialog__error'>{errors.submit}</div>
          )}

          <div className='dialog__footer'>
            <button
              type='button'
              className='btn btn--secondary'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('action.cancel', 'Cancelar')}
            </button>
            <button
              type='submit'
              className='btn btn--primary'
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('action.saving', 'Guardando...')
                : isEditMode
                ? t('action.save_changes', 'Guardar cambios')
                : t('action.create', 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierDirectoryFormModal

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'
import { Button } from '@/components/ui/button'

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
    <div 
      className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity' 
      onClick={handleClose}
    >
      <div
        className='w-full max-w-xl bg-white rounded-xl shadow-fluent-16 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200'
        onClick={event => event.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-[#d1d1d1]'>
          <h2 className='text-xl font-black text-[#323130] uppercase tracking-tighter'>
            {isEditMode
              ? t('supplier.form.title.edit', 'Editar proveedor')
              : t('supplier.form.title.create', 'Nuevo proveedor')}
          </h2>
          <button
            type='button'
            className='p-2 text-[#616161] hover:bg-[#f3f4f6] hover:text-[#323130] rounded-md transition-all'
            onClick={handleClose}
            aria-label={t('action.close', 'Cerrar')}
            disabled={isSubmitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className='p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label htmlFor='name' className='text-[10px] font-black text-[#616161] uppercase tracking-widest block'>
                {t('supplier.form.field.name', 'Nombre del proveedor')}{' '}
                <span className='text-[#a4262c]'>*</span>
              </label>
              <input
                id='name'
                name='name'
                type='text'
                className={`w-full h-10 px-3 bg-white border ${errors.name ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
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
                <span className='text-[10px] font-bold text-[#a4262c] uppercase'>{errors.name}</span>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='taxId' className='text-[10px] font-black text-[#616161] uppercase tracking-widest block'>
                {t('supplier.form.field.taxId', 'RFC / Tax ID')}{' '}
                <span className='text-[#a4262c]'>*</span>
              </label>
              <input
                id='taxId'
                name='taxId'
                type='text'
                className={`w-full h-10 px-3 bg-white border ${errors.taxId ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
                value={formData.taxId}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.taxId',
                  'Ej. ABC123456789'
                )}
              />
              {errors.taxId && (
                <span className='text-[10px] font-bold text-[#a4262c] uppercase'>{errors.taxId}</span>
              )}
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label htmlFor='contactEmail' className='text-[10px] font-black text-[#616161] uppercase tracking-widest block'>
                {t('supplier.form.field.email', 'Correo de contacto')}
              </label>
              <input
                id='contactEmail'
                name='contactEmail'
                type='email'
                className={`w-full h-10 px-3 bg-white border ${errors.contactEmail ? 'border-[#a4262c] ring-1 ring-[#a4262c]' : 'border-[#d1d1d1]'} rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none`}
                value={formData.contactEmail}
                onChange={handleChange}
                disabled={isSubmitting}
                placeholder={t(
                  'supplier.form.placeholder.email',
                  'correo@empresa.com'
                )}
              />
              {errors.contactEmail && (
                <span className='text-[10px] font-bold text-[#a4262c] uppercase'>{errors.contactEmail}</span>
              )}
            </div>

            <div className='space-y-2'>
              <label htmlFor='contactPhone' className='text-[10px] font-black text-[#616161] uppercase tracking-widest block'>
                {t('supplier.form.field.phone', 'Teléfono de contacto')}
              </label>
              <input
                id='contactPhone'
                name='contactPhone'
                type='text'
                className='w-full h-10 px-3 bg-white border border-[#d1d1d1] rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none'
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

          <div className='space-y-2'>
            <label htmlFor='contactAddress' className='text-[10px] font-black text-[#616161] uppercase tracking-widest block'>
              {t('supplier.form.field.address', 'Dirección')}
            </label>
            <textarea
              id='contactAddress'
              name='contactAddress'
              className='w-full p-3 bg-white border border-[#d1d1d1] rounded text-sm focus:border-[#106ebe] focus:ring-1 focus:ring-[#106ebe] transition-all outline-none resize-none'
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
            <div className='p-3 bg-[#a4262c]/10 border-l-4 border-[#a4262c] rounded text-[#a4262c] text-xs font-bold uppercase'>
              {errors.submit}
            </div>
          )}

          {/* Footer */}
          <div className='flex items-center justify-end gap-3 pt-6 border-t border-[#f3f4f6]'>
            <Button
              variant="outline"
              type='button'
              className='px-5 py-2'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t('action.cancel', 'Cancelar')}
            </Button>
            <Button
              type='submit'
              className='px-5 py-2 bg-[#106ebe] hover:bg-[#005a9e] text-white font-black uppercase text-xs'
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t('action.saving', 'Guardando...')
                : isEditMode
                ? t('action.save_changes', 'Guardar cambios')
                : t('action.create', 'Crear')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SupplierDirectoryFormModal

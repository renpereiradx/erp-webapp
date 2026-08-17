/**
 * QuickClientModal — registro rápido de cliente desde el checkout de venta.
 *
 * Solo campos mínimos (nombre, apellido, tipo y número de documento, teléfono
 * opcional); el resto se completa después desde el directorio. Al crear
 * devuelve el party al padre vía `onCreated` para autoseleccionarlo en el
 * wizard sin salir del POS.
 */
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'
import useClientStore, { normalizeClient } from '@/store/useClientStore'
import DocumentTypeSelect from './DocumentTypeSelect'
import { validateQuickClient, type QuickClientForm, type QuickClientErrors } from '@/domain/party/quickClient'

interface QuickClientModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (client: any) => void
}

const EMPTY_FORM: QuickClientForm = {
  first_name: '',
  last_name: '',
  document_type: 'CI',
  document_id: '',
  phone: '',
}

export function QuickClientModal({ isOpen, onClose, onCreated }: QuickClientModalProps) {
  const { t } = useI18n()
  const { createClient } = useClientStore()

  const [form, setForm] = useState<QuickClientForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<QuickClientErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: keyof QuickClientForm) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async () => {
    const validation = validateQuickClient(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        document_type: form.document_type,
        document_id: form.document_id.trim(),
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      }
      const result = await createClient(payload)
      if (result.success) {
        const created = normalizeClient(result.data)
        onCreated(created ?? result.data)
        setForm(EMPTY_FORM)
      } else {
        setErrors({ submit: result.error || t('party.quick_client.error.generic', 'Error al registrar el cliente') })
      }
    } catch (error: any) {
      setErrors({ submit: error.message || t('party.quick_client.error.generic', 'Error al registrar el cliente') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setErrors({})
    onClose()
  }

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('party.quick_client.title', 'Registro rápido de cliente')}
      subtitle={t('party.quick_client.subtitle', 'Datos mínimos para continuar la venta')}
      size="md"
      testId="quick-client-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('modal.cancel', 'Cancelar')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting
              ? t('party.quick_client.processing', 'Registrando...')
              : t('party.quick_client.submit', 'Registrar cliente')}
          </Button>
        </div>
      }
    >
      <form
        className="space-y-md"
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="qc-first-name" className="text-label-caps uppercase text-on-surface-variant">
              {t('party.quick_client.field.first_name', 'Nombre')} *
            </Label>
            <Input
              id="qc-first-name"
              type="text"
              value={form.first_name}
              onChange={e => handleChange('first_name')(e.target.value)}
              state={errors.first_name ? 'error' : ''}
              placeholder={t('party.quick_client.placeholder.first_name', 'Ingrese el nombre')}
              autoFocus
            />
            {errors.first_name && <p className="text-body-sm-bold text-error">{t(errors.first_name)}</p>}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="qc-last-name" className="text-label-caps uppercase text-on-surface-variant">
              {t('party.quick_client.field.last_name', 'Apellido')} *
            </Label>
            <Input
              id="qc-last-name"
              type="text"
              value={form.last_name}
              onChange={e => handleChange('last_name')(e.target.value)}
              state={errors.last_name ? 'error' : ''}
              placeholder={t('party.quick_client.placeholder.last_name', 'Ingrese el apellido')}
            />
            {errors.last_name && <p className="text-body-sm-bold text-error">{t(errors.last_name)}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <DocumentTypeSelect
            id="qc-document-type"
            value={form.document_type}
            onChange={handleChange('document_type')}
            error={errors.document_type ? t(errors.document_type) : undefined}
          />

          <div className="space-y-xs">
            <Label htmlFor="qc-document-id" className="text-label-caps uppercase text-on-surface-variant">
              {t('party.quick_client.field.document_id', 'Número de documento')} *
            </Label>
            <Input
              id="qc-document-id"
              type="text"
              value={form.document_id}
              onChange={e => handleChange('document_id')(e.target.value)}
              state={errors.document_id ? 'error' : ''}
              placeholder={t('party.quick_client.placeholder.document_id', 'Ej: 1234567')}
            />
            {errors.document_id && <p className="text-body-sm-bold text-error">{t(errors.document_id)}</p>}
          </div>
        </div>

        <div className="space-y-xs">
          <Label htmlFor="qc-phone" className="text-label-caps uppercase text-on-surface-variant">
            {t('party.quick_client.field.phone', 'Teléfono (opcional)')}
          </Label>
          <Input
            id="qc-phone"
            type="tel"
            value={form.phone}
            onChange={e => handleChange('phone')(e.target.value)}
            placeholder={t('party.quick_client.placeholder.phone', 'Ej: 0981 123 456')}
          />
        </div>

        {errors.submit && (
          <div className="rounded-md bg-error-container/50 p-3 text-body-sm-bold text-error flex items-center gap-2">
            <UserPlus className="h-4 w-4 shrink-0" />
            <span>{errors.submit}</span>
          </div>
        )}
      </form>
    </EnhancedModal>
  )
}

export default QuickClientModal

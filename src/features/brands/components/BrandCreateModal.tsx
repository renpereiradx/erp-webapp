/**
 * BrandCreateModal — alta rápida de marca desde el formulario de productos.
 *
 * Espejo de QuickSupplierModal para el campo Marca del ProductFormModal:
 * pide los datos mínimos (nombre + descripción opcional); el slug se deriva
 * server-side y el logo se completa después desde el directorio de marcas.
 * Al crear devuelve la marca al padre vía `onCreated` para autoseleccionarla
 * sin salir del formulario de producto.
 */
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { Tag } from 'lucide-react'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n'
import { brandService } from '@/services/brandService'
import { zodFieldErrors } from '@/domain/shared/zodErrors'

// Mensajes = claves i18n (se renderizan con t(key, fallback)). Límites espejo
// del validator del backend (internal/brand/dto.go: name max=150, description max=500).
export const brandCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'brands.quickCreate.error.name_required')
    .max(150, 'brands.quickCreate.error.name_too_long'),
  description: z.string().trim().max(500, 'brands.quickCreate.error.description_too_long'),
})

type BrandCreateValues = z.infer<typeof brandCreateSchema>

interface BrandCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (brand: { id: string | number; name: string }) => void
}

export function BrandCreateModal({ isOpen, onClose, onCreated }: BrandCreateModalProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState<BrandCreateValues>({ name: '', description: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus inicial en el nombre: EnhancedModal enfoca el contenedor al abrir
  // (efecto que corre después del autoFocus del input y se lo roba), así que
  // re-enfocamos con un tick (mismo patrón de QuickSupplierModal).
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => nameRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Reinicializar el formulario cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return
    setFormData({ name: '', description: '' })
    setFieldErrors({})
    setSubmitError(null)
  }, [isOpen])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async () => {
    const parsed = brandCreateSchema.safeParse(formData)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // description vacía se omite: el validator del backend acepta null/ausente.
      const payload: { name: string; description?: string } = { name: parsed.data.name }
      if (parsed.data.description) payload.description = parsed.data.description
      const created = await brandService.create(payload)
      if (!created?.id) {
        setSubmitError(t('brands.quickCreate.error.generic', 'No se pudo crear la marca'))
        return
      }
      setFormData({ name: '', description: '' })
      onCreated({ id: created.id, name: parsed.data.name })
    } catch (error: any) {
      // El backend responde { success: false, error: { code, message } } (writeAPIError).
      const backendMessage: unknown = error?.response?.data?.error?.message
      setSubmitError(
        typeof backendMessage === 'string' && backendMessage.trim()
          ? backendMessage
          : t('brands.quickCreate.error.generic', 'No se pudo crear la marca'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setFieldErrors({})
    setSubmitError(null)
    onClose()
  }

  const renderError = (field: keyof BrandCreateValues, fallback: string) =>
    fieldErrors[field] ? (
      <p className="text-body-sm-bold text-error">{t(fieldErrors[field], fallback)}</p>
    ) : null

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('brands.quickCreate.title', 'Nueva marca')}
      subtitle={t('brands.quickCreate.subtitle', 'Se creará y quedará seleccionada en el producto')}
      size="sm"
      testId="brand-create-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            {t('modal.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? t('brands.quickCreate.processing', 'Creando...')
              : t('brands.quickCreate.submit', 'Crear marca')}
          </Button>
        </div>
      }
    >
      <form
        autoComplete="off"
        className="space-y-md"
        onSubmit={e => {
          e.preventDefault()
          handleSubmit()
        }}
        noValidate
      >
        <div className="space-y-xs">
          <Label htmlFor="brand-create-name" className="text-body-md-bold text-foreground">
            {t('brands.quickCreate.field.name', 'Nombre de la marca')}{' '}
            <span className="text-error">*</span>
          </Label>
          <Input
            ref={nameRef}
            id="brand-create-name"
            name="name"
            type="text"
            state={fieldErrors.name ? 'error' : ''}
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder={t('brands.quickCreate.placeholder.name', 'Ej. Logitech')}
          />
          {renderError('name', 'El nombre de la marca es obligatorio')}
        </div>

        <div className="space-y-xs">
          <Label htmlFor="brand-create-description" className="text-body-md-bold text-foreground">
            {t('brands.quickCreate.field.description', 'Descripción (opcional)')}
          </Label>
          <Textarea
            id="brand-create-description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder={t('brands.quickCreate.placeholder.description', 'Ej. Periféricos y accesorios')}
            className="resize-none"
          />
          {renderError('description', 'La descripción no puede exceder 500 caracteres')}
        </div>

        {submitError && (
          <div
            className="rounded-md bg-error-container/50 p-3 text-body-sm-bold text-error flex items-center gap-2"
            role="alert"
          >
            <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}
      </form>
    </EnhancedModal>
  )
}

export default BrandCreateModal

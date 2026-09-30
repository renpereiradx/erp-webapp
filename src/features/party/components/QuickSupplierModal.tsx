/**
 * QuickSupplierModal — registro rápido de proveedor desde el wizard de compras.
 *
 * Espejo de QuickClientModal para el paso de proveedor del
 * PurchaseCheckoutWizard: solo campos mínimos (nombre, RUC/Tax ID y teléfono
 * opcional); el resto se completa después desde el directorio. Al crear
 * devuelve el proveedor al padre vía `onCreated` para autoseleccionarlo en el
 * wizard sin salir del flujo de compra.
 *
 * Reutiliza el schema y el payload builder del formulario completo
 * (domain/party/supplierForm) para que la validación y el contrato de API no
 * se divergan entre el alta rápida y el alta desde el directorio.
 */
import { useEffect, useRef, useState } from 'react'
import { Building } from 'lucide-react'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useI18n } from '@/lib/i18n'
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore'
import {
  buildSupplierPayload,
  supplierFormSchema,
  EMPTY_SUPPLIER_FORM,
  type SupplierFormValues,
} from '@/domain/party/supplierForm'
import { zodFieldErrors } from '@/domain/party/zodErrors'

interface QuickSupplierModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (supplier: any) => void
}

/**
 * Proveedor para autoselección inmediata en el wizard: garantiza id + nombre +
 * tax_id con las variantes de nombres que consumen getSupplierName y la
 * tarjeta de seleccionado (first_name/name, tax_id/taxId).
 */
const toSelectableSupplier = (created: any, values: SupplierFormValues) => {
  const raw: any = created ?? {}
  const id = raw.id ?? raw.supplier_id
  if (!id) return null
  return {
    ...raw,
    id,
    name: values.name.trim(),
    first_name: values.name.trim(),
    displayName: values.name.trim(),
    taxId: values.taxId.trim(),
    tax_id: values.taxId.trim(),
  }
}

export function QuickSupplierModal({ isOpen, onClose, onCreated }: QuickSupplierModalProps) {
  const { t } = useI18n()
  const { createSupplier, refreshAfterMutation } = useSupplierDirectoryStore()

  const [formData, setFormData] = useState<SupplierFormValues>({ ...EMPTY_SUPPLIER_FORM })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  // Focus inicial en el primer campo: EnhancedModal enfoca el contenedor al
  // abrir (efecto del padre, corre después del autoFocus del input y se lo
  // roba), así que re-enfocamos con un tick (patrón 60ms del wizard).
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => nameRef.current?.focus(), 60)
    return () => clearTimeout(timer)
  }, [isOpen])

  // Reinicializar el formulario cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return
    setFormData({ ...EMPTY_SUPPLIER_FORM })
    setFieldErrors({})
    setSubmitError(null)
  }, [isOpen])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async () => {
    const parsed = supplierFormSchema.safeParse(formData)
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error))
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = buildSupplierPayload(parsed.data)
      const result = await createSupplier(payload)

      if (result?.success) {
        await refreshAfterMutation()
        const created = toSelectableSupplier(result.data, parsed.data)
        setFormData({ ...EMPTY_SUPPLIER_FORM })
        onCreated(created)
        return
      }

      setSubmitError(
        result?.error ||
          t('party.quick_supplier.error.generic', 'Error al registrar el proveedor'),
      )
    } catch (error: any) {
      setSubmitError(
        error?.message ||
          t('party.quick_supplier.error.generic', 'Error al registrar el proveedor'),
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

  const renderError = (field: keyof SupplierFormValues, fallback: string) =>
    fieldErrors[field] ? (
      <p className="text-body-sm-bold text-error">{t(fieldErrors[field], fallback)}</p>
    ) : null

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('party.quick_supplier.title', 'Registro rápido de proveedor')}
      subtitle={t('party.quick_supplier.subtitle', 'Datos mínimos para continuar la compra')}
      size="md"
      testId="quick-supplier-modal"
      // Se abre apilado dentro del wizard de checkout (overlay z-[150]):
      // sin esto el modal monta DETRÁS y "Nuevo proveedor" parece muerto.
      // 200 > wizard, < toasts (1000) y < VariantSelectorModal (1200).
      // [--erp-overlay-inset:0px] cubre toda la pantalla (el wizard de abajo
      // ya es full-screen): el blur no deja la franja del sidebar sin tocar.
      overlayClassName="!z-[200] [--erp-overlay-inset:0px]"
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
              ? t('party.quick_supplier.processing', 'Registrando...')
              : t('party.quick_supplier.submit', 'Registrar proveedor')}
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
          <Label htmlFor="qs-name" className="text-body-md-bold text-foreground">
            {t('party.quick_supplier.field.name', 'Nombre del proveedor')}{' '}
            <span className="text-error">*</span>
          </Label>
          <Input
            ref={nameRef}
            id="qs-name"
            name="name"
            type="text"
            state={fieldErrors.name ? 'error' : ''}
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            placeholder={t('party.quick_supplier.placeholder.name', 'Ej. Distribuciones del Pacífico')}
          />
          {renderError('name', 'El nombre es obligatorio')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="qs-tax-id" className="text-body-md-bold text-foreground">
              {t('party.quick_supplier.field.taxId', 'RUC / Tax ID')}{' '}
              <span className="text-error">*</span>
            </Label>
            <Input
              id="qs-tax-id"
              name="taxId"
              type="text"
              state={fieldErrors.taxId ? 'error' : ''}
              value={formData.taxId}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('party.quick_supplier.placeholder.taxId', 'Ej. 80012345-6')}
            />
            {renderError('taxId', 'El RUC/Tax ID es obligatorio')}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="qs-phone" className="text-body-md-bold text-foreground">
              {t('party.quick_supplier.field.phone', 'Teléfono (opcional)')}
            </Label>
            <Input
              id="qs-phone"
              name="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('party.quick_supplier.placeholder.phone', 'Ej: 0981 123 456')}
            />
          </div>
        </div>

        {submitError && (
          <div className="rounded-md bg-error-container/50 p-3 text-body-sm-bold text-error flex items-center gap-2" role="alert">
            <Building className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}
      </form>
    </EnhancedModal>
  )
}

export default QuickSupplierModal

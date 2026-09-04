import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedModal from '@/components/ui/EnhancedModal';
import AddressFieldsGrid from '@/features/party/components/AddressFieldsGrid';
import {
  buildSupplierPayload,
  normalizeSupplierForForm,
  supplierFormSchema,
  type SupplierFormValues,
  type SupplierInput,
} from '@/domain/party/supplierForm';
import { zodFieldErrors } from '@/domain/party/zodErrors';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: (shouldRefresh?: boolean) => void;
  supplier?: SupplierInput | null;
}

const FORM_ID = 'supplier-form-modal';

const SupplierFormModal = ({ isOpen, onClose, supplier = null }: SupplierFormModalProps) => {
  const { t } = useI18n();
  const toast = useToast();
  const { createSupplier, updateSupplier, refreshAfterMutation } =
    useSupplierDirectoryStore();

  const isEditMode = Boolean(supplier && supplier.id);

  const [formData, setFormData] = useState<SupplierFormValues>(normalizeSupplierForForm(null));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reinicializar el formulario cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return;
    setFormData(normalizeSupplierForForm(supplier));
    setFieldErrors({});
    setSubmitError(null);
  }, [isOpen, supplier]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = supplierFormSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildSupplierPayload(parsed.data, supplier);
      const result = isEditMode
        ? await updateSupplier(supplier!.id as string, payload)
        : await createSupplier(payload);

      if (result?.success) {
        toast.success(
          isEditMode
            ? t('supplier.form.success.update', 'Proveedor actualizado con éxito')
            : t('supplier.form.success.create', 'Proveedor creado con éxito'),
        );
        await refreshAfterMutation();
        onClose(true);
        return;
      }

      setSubmitError(
        result?.error || t('supplier.form.error.generic', 'No se pudo guardar el proveedor'),
      );
    } catch (error) {
      setSubmitError(
        (error as Error).message ||
          t('supplier.form.error.generic', 'No se pudo guardar el proveedor'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    onClose(false);
  };

  const renderError = (field: keyof SupplierFormValues, fallback: string) =>
    fieldErrors[field] ? (
      <p className="text-body-md text-error">{t(fieldErrors[field], fallback)}</p>
    ) : null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isEditMode
          ? t('supplier.form.title.edit', 'Editar proveedor')
          : t('supplier.form.title.create', 'Nuevo proveedor')
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
            {t('action.cancel', 'Cancelar')}
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={isSubmitting}>
            {isSubmitting
              ? t('action.saving', 'Guardando...')
              : isEditMode
                ? t('action.save_changes', 'Guardar cambios')
                : t('action.create', 'Crear')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-md" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="supplier-name" className="text-body-md-bold text-foreground">
              {t('supplier.form.field.name', 'Nombre del proveedor')}{' '}
              <span className="text-error">*</span>
            </Label>
            <Input
              id="supplier-name"
              name="name"
              type="text"
              state={fieldErrors.name ? 'error' : ''}
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('supplier.form.placeholder.name', 'Ej. Distribuciones del Pacífico')}
              autoFocus
            />
            {renderError('name', 'El nombre es obligatorio')}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="supplier-tax-id" className="text-body-md-bold text-foreground">
              {t('supplier.form.field.taxId', 'RFC / Tax ID')}{' '}
              <span className="text-error">*</span>
            </Label>
            <Input
              id="supplier-tax-id"
              name="taxId"
              type="text"
              state={fieldErrors.taxId ? 'error' : ''}
              value={formData.taxId}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('supplier.form.placeholder.taxId', 'Ej. ABC123456789')}
            />
            {renderError('taxId', 'El RFC/Tax ID es obligatorio')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="supplier-email" className="text-body-md-bold text-foreground">
              {t('supplier.form.field.email', 'Correo de contacto')}
            </Label>
            <Input
              id="supplier-email"
              name="contactEmail"
              type="email"
              state={fieldErrors.contactEmail ? 'error' : ''}
              value={formData.contactEmail}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('supplier.form.placeholder.email', 'correo@empresa.com')}
            />
            {renderError('contactEmail', 'Correo electrónico inválido')}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="supplier-phone" className="text-body-md-bold text-foreground">
              {t('supplier.form.field.phone', 'Teléfono de contacto')}
            </Label>
            <Input
              id="supplier-phone"
              name="contactPhone"
              type="text"
              value={formData.contactPhone}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('supplier.form.placeholder.phone', '+52 55 1234 5678')}
            />
          </div>
        </div>

        <AddressFieldsGrid
          values={{
            street: formData.addressStreet,
            city: formData.addressCity,
            state: formData.addressState,
            zipCode: formData.addressZipCode,
            country: formData.addressCountry,
          }}
          onChange={(field, value) =>
            setFormData(prev => ({
              ...prev,
              [`address${field.charAt(0).toUpperCase()}${field.slice(1)}`]: value,
            }))
          }
          disabled={isSubmitting}
        />

        {submitError && (
          <div className="p-sm bg-error-container text-on-error-container text-body-md rounded-md" role="alert">
            {submitError}
          </div>
        )}
      </form>
    </EnhancedModal>
  );
};

export default SupplierFormModal;

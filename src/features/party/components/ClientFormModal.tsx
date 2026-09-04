import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import useClientStore from '@/store/useClientStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EnhancedModal from '@/components/ui/EnhancedModal';
import DocumentTypeSelect from '@/features/party/components/DocumentTypeSelect';
import CountrySelect from '@/features/party/components/CountrySelect';
import AddressFieldsGrid from '@/features/party/components/AddressFieldsGrid';
import {
  buildClientPayload,
  clientFormSchema,
  normalizeClientForForm,
  type ClientFormValues,
  type ClientInput,
} from '@/domain/party/clientForm';
import { zodFieldErrors } from '@/domain/party/zodErrors';

interface ClientFormModalProps {
  isOpen: boolean;
  /** onClose(shouldRefresh): la página refresca y muestra toast si es true. */
  onClose: (shouldRefresh?: boolean) => void;
  client?: ClientInput | null;
}

const FORM_ID = 'client-form-modal';

const ClientFormModal = ({ isOpen, onClose, client = null }: ClientFormModalProps) => {
  const { t } = useI18n();
  const { createClient, updateClient } = useClientStore();

  const isEditMode = client !== null;

  const [formData, setFormData] = useState<ClientFormValues>(normalizeClientForForm(null));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reinicializar el formulario cada vez que se abre.
  useEffect(() => {
    if (isOpen) {
      setFormData(normalizeClientForForm(client));
      setFieldErrors({});
      setSubmitError(null);
    }
  }, [isOpen, client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = clientFormSchema.safeParse(formData);
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);
    try {
      const clientData = buildClientPayload(parsed.data);
      const result = isEditMode
        ? await updateClient(client!.id as string, clientData)
        : await createClient(clientData);

      if (result.success) {
        onClose(true);
        return;
      }
      setSubmitError(result.error || t('clients.modal.error.generic', 'Error al guardar el cliente'));
    } catch (error) {
      setSubmitError(
        (error as Error).message || t('clients.modal.error.generic', 'Error al guardar el cliente'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) onClose(false);
  };

  const renderError = (field: keyof ClientFormValues, fallback: string) =>
    fieldErrors[field] ? (
      <p className="text-body-md text-error">{t(fieldErrors[field], fallback)}</p>
    ) : null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isEditMode
          ? t('clients.modal.title.edit', 'Editar Cliente')
          : t('clients.modal.title.create', 'Nuevo Cliente')
      }
      size="lg"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" type="button" onClick={handleClose} disabled={isSubmitting}>
            {t('action.cancel', 'Cancelar')}
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={isSubmitting}>
            {isSubmitting ? t('action.saving', 'Guardando...') : t('action.save', 'Guardar')}
          </Button>
        </div>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-md" noValidate>
        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="client-name" className="text-body-md-bold text-foreground">
              {t('clients.modal.field.name', 'Nombre')} <span className="text-error">*</span>
            </Label>
            <Input
              id="client-name"
              name="name"
              type="text"
              state={fieldErrors.name ? 'error' : ''}
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.name', 'Ingrese el nombre')}
            />
            {renderError('name', 'El nombre es requerido')}
          </div>

          <div className="space-y-xs">
            <Label htmlFor="client-last-name" className="text-body-md-bold text-foreground">
              {t('clients.modal.field.last_name', 'Apellido')} <span className="text-error">*</span>
            </Label>
            <Input
              id="client-last-name"
              name="last_name"
              type="text"
              state={fieldErrors.last_name ? 'error' : ''}
              value={formData.last_name}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.last_name', 'Ingrese el apellido')}
            />
            {renderError('last_name', 'El apellido es requerido')}
          </div>
        </div>

        {/* Documento: tipo + número */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <DocumentTypeSelect
            id="client-document-type"
            value={formData.document_type}
            onChange={value => setFormData(prev => ({ ...prev, document_type: value }))}
            disabled={isSubmitting}
          />
          <div className="space-y-xs">
            <Label htmlFor="client-document-id" className="text-body-md-bold text-foreground">
              {t('clients.modal.field.document', 'Documento de Identidad')}{' '}
              <span className="text-error">*</span>
            </Label>
            <Input
              id="client-document-id"
              name="document_id"
              type="text"
              state={fieldErrors.document_id ? 'error' : ''}
              value={formData.document_id}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.document', 'CI, RUC, etc.')}
            />
            {renderError('document_id', 'El documento es requerido')}
          </div>
        </div>

        {/* Contacto y nacionalidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="client-contact" className="text-body-md-bold text-foreground">
              {t('clients.modal.field.contact', 'Contacto')}
            </Label>
            <Input
              id="client-contact"
              name="contact"
              type="text"
              value={formData.contact}
              onChange={handleChange}
              disabled={isSubmitting}
              placeholder={t('clients.modal.placeholder.contact', 'Teléfono, email, etc.')}
            />
          </div>
          <CountrySelect
            id="client-nationality"
            value={formData.nationality}
            onChange={value => setFormData(prev => ({ ...prev, nationality: value }))}
            disabled={isSubmitting}
            label={t('party.field.nationality')}
          />
        </div>

        {/* Dirección estructurada */}
        <AddressFieldsGrid
          values={{
            street: formData.address_street,
            city: formData.address_city,
            state: formData.address_state,
            zipCode: formData.address_zip_code,
            country: formData.address_country,
          }}
          onChange={(field, value) =>
            setFormData(prev => ({
              ...prev,
              [`address_${field === 'zipCode' ? 'zip_code' : field}`]: value,
            }))
          }
          disabled={isSubmitting}
        />

        {/* Error general */}
        {submitError && (
          <div className="p-sm bg-error-container text-on-error-container text-body-md rounded-md" role="alert">
            {submitError}
          </div>
        )}
      </form>
    </EnhancedModal>
  );
};

export default ClientFormModal;

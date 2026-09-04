import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedModal from '@/components/ui/EnhancedModal';
import DetailField from '@/features/party/components/DetailField';
import { countryDisplayName } from '@/domain/party/identity';
import type { SupplierInput } from '@/domain/party/supplierForm';

interface SupplierDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: SupplierInput | null;
}

const formatDateTime = (value?: string, locale = 'es-MX') => {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return value;
  }
};

/**
 * Contenido interno: se monta SOLO con el modal abierto (sin hooks de Router,
 * pero el patrón mantiene el DOM liviano y el foco fresco por apertura).
 */
const SupplierDetailsContent = ({
  supplier,
  onClose,
}: {
  supplier: SupplierInput;
  onClose: () => void;
}) => {
  const { t, lang } = useI18n();
  const contact = supplier.contact || {};
  const isActive = supplier.status !== false;

  // Dirección estructurada (columnas address_*) con fallback al texto
  // legacy guardado en contact_info.address.
  const structuredAddress = [
    supplier.address_street,
    supplier.address_city,
    supplier.address_state,
    supplier.address_zip_code,
    supplier.address_country
      ? countryDisplayName(supplier.address_country, lang)
      : '',
  ]
    .filter(Boolean)
    .join(', ');
  const addressLine =
    structuredAddress ||
    contact.address ||
    supplier.address ||
    supplier.contactAddress ||
    '-';

  return (
    <EnhancedModal
      isOpen
      onClose={onClose}
      title={t('supplier.details.title', 'Detalle del proveedor')}
      size="md"
      footer={
        <div className="flex justify-center gap-sm">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('action.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <DetailField label="ID" value={supplier.id ?? '-'} mono />
        <DetailField label={t('supplier.details.status', 'Estado')}>
          <Badge variant={isActive ? 'success' : 'secondary'} size="sm" className="gap-xs w-max">
            <span
              className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-outline-fg'}`}
              aria-hidden="true"
            />
            {isActive
              ? t('supplier.status.active', 'Activo')
              : t('supplier.status.inactive', 'Inactivo')}
          </Badge>
        </DetailField>

        <DetailField label={t('supplier.details.name', 'Nombre')} value={supplier.name || '-'} />
        <DetailField
          label={t('supplier.details.taxId', 'RFC / Tax ID')}
          value={supplier.taxId || supplier.tax_id || '-'}
          mono
        />

        <DetailField
          label={t('supplier.details.email', 'Correo')}
          value={contact.email || '-'}
        />
        <DetailField
          label={t('supplier.details.phone', 'Teléfono')}
          value={contact.phone || '-'}
        />

        <div className="md:col-span-2">
          <DetailField label={t('supplier.details.address', 'Dirección')} value={addressLine} />
        </div>

        <DetailField
          label={t('supplier.details.createdBy', 'Creado por')}
          value={supplier.user_id || supplier.userId || '-'}
          mono
        />
        <DetailField
          label={t('supplier.details.createdAt', 'Creado')}
          value={formatDateTime(supplier.created_at || supplier.createdAt, lang)}
          mono
        />
        <DetailField
          label={t('supplier.details.updatedAt', 'Actualizado')}
          value={formatDateTime(supplier.updated_at || supplier.updatedAt, lang)}
          mono
        />
        <DetailField
          label={t('supplier.details.metadata', 'Notas')}
          value={supplier.metadata?.notes || '-'}
        />
      </div>
    </EnhancedModal>
  );
};

const SupplierDetailsModal = ({ isOpen, onClose, supplier }: SupplierDetailsModalProps) => {
  if (!isOpen || !supplier) return null;
  return <SupplierDetailsContent supplier={supplier} onClose={onClose} />;
};

export default SupplierDetailsModal;

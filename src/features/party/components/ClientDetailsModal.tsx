import { ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EnhancedModal from '@/components/ui/EnhancedModal';
import BiDrilldownButton from '@/components/bi/BiDrilldownButton';
import DetailField from '@/features/party/components/DetailField';
import CreditAccountSection from '@/features/party/components/CreditAccountSection';
import { countryDisplayName } from '@/domain/party/identity';
import type { ClientInput } from '@/domain/party/clientForm';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client?: ClientInput | null;
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

/**
 * Contenido interno: se monta SOLO con el modal abierto.
 */
const ClientDetailsContent = ({
  client,
  onClose,
}: {
  client: ClientInput;
  onClose: () => void;
}) => {
  const { t, lang } = useI18n();
  const isActive = client.status !== false && client.status !== 'inactive';
  const clientId = String(client.id ?? client._key ?? '');

  return (
    <EnhancedModal
      isOpen
      onClose={onClose}
      title={t('clients.modal.title.details', 'Detalles del Cliente')}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-sm">
          {/* F3: drill-down a "Productos que compra" (se oculta sin pack BI). */}
          {clientId ? (
            <BiDrilldownButton
              to={`/sales-analytics/customers/top-products?customer_id=${encodeURIComponent(clientId)}`}
              label={t('relationalAnalytics.actions.customerTop', 'Productos que compra')}
              icon={ShoppingBag}
              onBeforeNavigate={onClose}
              testId="client-details-bi-drilldown"
            />
          ) : null}
          <Button variant="secondary" type="button" onClick={onClose} className="whitespace-nowrap">
            {t('action.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <DetailField label={t('clients.modal.field.id', 'ID')} value={client.id || '-'} mono />
        <DetailField label={t('clients.modal.field.status', 'Estado')}>
          <Badge variant={isActive ? 'success' : 'secondary'} size="sm" className="gap-xs w-max">
            <span
              className={`size-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-outline-fg'}`}
              aria-hidden="true"
            />
            {isActive
              ? t('clients.status.active', 'Activo')
              : t('clients.status.inactive', 'Inactivo')}
          </Badge>
        </DetailField>

        <DetailField label={t('clients.modal.field.name', 'Nombre')} value={client.name || '-'} />
        <DetailField
          label={t('clients.modal.field.last_name', 'Apellido')}
          value={client.last_name || '-'}
        />

        <DetailField
          label={t('clients.modal.field.document', 'Documento de Identidad')}
          value={client.document_id || '-'}
          mono
        />
        <DetailField
          label={t('party.field.document_type', 'Tipo de documento')}
          value={
            client.document_type
              ? t(`party.document_type.${client.document_type}`, client.document_type)
              : '-'
          }
        />

        <DetailField
          label={t('party.field.nationality', 'Nacionalidad')}
          value={client.nationality ? countryDisplayName(client.nationality, lang) : '-'}
        />
        <DetailField
          label={t('clients.modal.field.contact', 'Contacto')}
          value={client.contact?.email || client.contact?.phone || client.contact?.raw || '-'}
        />

        <div className="md:col-span-2">
          <DetailField
            label={t('party.field.address_section', 'Dirección')}
            value={
              [
                client.address_street,
                client.address_city,
                client.address_state,
                client.address_zip_code,
                client.address_country ? countryDisplayName(client.address_country, lang) : '',
              ]
                .filter(Boolean)
                .join(', ') || '-'
            }
          />
        </div>

        <DetailField
          label={t('clients.modal.field.created_by', 'Creado Por (ID Usuario)')}
          value={client.user_id || '-'}
        />
        <DetailField
          label={t('clients.modal.field.created_at', 'Fecha de Creación')}
          value={formatDateTime(client.created_at)}
          mono
        />

        {/* Cuenta corriente: deuda con aging, saldo a favor y cobro a cuenta
            (PLAN_MONOROL_DESCUENTOS_CREDITO_CLIENTE C6) */}
        <CreditAccountSection clientId={String(client.id || '')} />
      </div>
    </EnhancedModal>
  );
};

const ClientDetailsModal = ({ isOpen, onClose, client }: ClientDetailsModalProps) => {
  if (!isOpen || !client) return null;
  return <ClientDetailsContent client={client} onClose={onClose} />;
};

export default ClientDetailsModal;

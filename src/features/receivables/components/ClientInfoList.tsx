import { MapPin, Phone, User } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

/**
 * Información de contacto del cliente (perfil de crédito).
 * Migración FASE 3: .tsx + tokens; icono Copy sin handler eliminado (§2.6).
 */

interface ClientInfoListProps {
  address?: string
  contact?: string
  phone?: string
  rep?: string
  taxId?: string
}

const ClientInfoList = ({ address = '', contact = '', phone = '', rep = '', taxId = '' }: ClientInfoListProps) => {
  const { t } = useI18n();

  return (
    <div className="bg-surface rounded-md border border-border-subtle p-md shadow-whisper flex-1">
      <h2 className="text-body-md-bold text-foreground mb-md uppercase tracking-tight">
        {t('bi.receivables.profile.info.title', 'Información', {})}
      </h2>
      <div className="space-y-md">
        <div className="flex items-start gap-sm">
          <div className="size-8 rounded-sm bg-surface-muted flex items-center justify-center text-on-surface-deep shrink-0 border border-border-subtle">
            <MapPin size={16} />
          </div>
          <div>
            <p className="text-label-caps uppercase text-on-surface-deep">
              {t('bi.receivables.profile.info.address', 'Dirección', {})}
            </p>
            <p className="text-body-md-bold text-foreground mt-0.5 whitespace-pre-wrap">
              {address || t('bi.receivables.profile.info.noAddress', 'Dirección no disponible', {})}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-sm">
          <div className="size-8 rounded-sm bg-surface-muted flex items-center justify-center text-on-surface-deep shrink-0 border border-border-subtle">
            <Phone size={16} />
          </div>
          <div>
            <p className="text-label-caps uppercase text-on-surface-deep">
              {t('bi.receivables.profile.info.contact', 'Contacto', {})}
            </p>
            <p className="text-body-md-bold text-foreground mt-0.5">
              {contact || t('bi.receivables.profile.info.noContact', 'Sin contacto definido', {})}
            </p>
            {phone && (
              <a href={`tel:${phone}`} className="text-body-sm-bold text-primary hover:underline mt-0.5 inline-block">
                {phone}
              </a>
            )}
          </div>
        </div>

        <div className="flex items-start gap-sm">
          <div className="size-8 rounded-sm bg-surface-muted flex items-center justify-center text-on-surface-deep shrink-0 border border-border-subtle">
            <User size={16} />
          </div>
          <div>
            <p className="text-label-caps uppercase text-on-surface-deep">
              {t('bi.receivables.profile.info.rep', 'Representante', {})}
            </p>
            <p className="text-body-md-bold text-foreground mt-0.5">
              {rep || t('bi.receivables.profile.info.noRep', 'No asignado', {})}
            </p>
          </div>
        </div>

        <div className="pt-md border-t border-border-subtle">
          <p className="text-label-caps uppercase text-on-surface-deep mb-sm">
            {t('bi.receivables.profile.info.taxId', 'Identificación Fiscal', {})}
          </p>
          <div className="flex items-center justify-between p-sm bg-surface-muted rounded-sm text-body-sm-bold font-data-mono text-data-mono text-foreground border border-border-subtle">
            <span>{taxId || t('bi.receivables.profile.info.noTaxId', 'No registrado', {})}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoList

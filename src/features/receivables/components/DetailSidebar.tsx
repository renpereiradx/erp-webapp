import { CreditCard } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ReceivableDetailData } from '../types';

/**
 * Sidebar del detalle: acción de cobro, contacto del cliente y timeline de
 * actividad. Migración FASE 3: .tsx + tokens. Fuera (§2.6): Recordatorio/
 * Disputa disabled, link Editar sin handler y el input de notas con
 * Publicar stub (toast not_implemented).
 */

interface DetailSidebarProps {
  client?: Partial<ReceivableDetailData['client']>
  activities?: ReceivableDetailData['activities']
  onRegisterPayment?: () => void
}

const DetailSidebar = ({ client = {}, activities = [], onRegisterPayment }: DetailSidebarProps) => {
  const { t } = useI18n();

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'PAYMENT': return 'bg-success';
      case 'NOTE': return 'bg-primary';
      default: return 'bg-on-surface-deep/40';
    }
  };

  return (
    <div className="flex flex-col gap-md">
      {/* Action Card */}
      <div className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md">
        <h3 className="text-title-md text-foreground mb-md">{t('receivables.detail.actions.title', 'Acciones Rápidas', {})}</h3>
        <button
          type="button"
          onClick={() => onRegisterPayment?.()}
          className="flex items-center justify-center gap-sm w-full h-11 rounded-button bg-primary text-on-primary text-body-md-bold transition-colors hover:bg-primary-container"
        >
          <CreditCard size={18} />
          {t('receivables.detail.actions.register_payment', 'Registrar Pago', {})}
        </button>
      </div>

      {/* Debtor Contact Info */}
      <div className="bg-surface rounded-md shadow-whisper border border-border-subtle p-md">
        <div className="flex justify-between items-center mb-md">
          <h3 className="text-title-md text-foreground">{t('receivables.detail.contact.title', 'Contacto del Cliente', {})}</h3>
        </div>
        <div className="flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <div className="size-10 rounded-full flex items-center justify-center bg-primary/10 text-primary text-body-md-bold border border-border-subtle">
              {client.contact?.charAt(0) || client.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="text-body-md-bold text-foreground">{client.contact || client.name}</p>
              <p className="text-body-sm-bold text-on-surface-deep">{t('receivables.profile.billing_manager', 'Gerente de Facturación', {})}</p>
            </div>
          </div>

          <div className="h-px bg-border-subtle w-full" />

          <div className="space-y-sm">
            {client.email && (
              <div className="flex items-center gap-sm text-body-md">
                <span className="material-symbols-outlined text-on-surface-deep" aria-hidden="true">mail</span>
                <a className="text-foreground hover:text-primary truncate" href={`mailto:${client.email}`}>
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-sm text-body-md">
                <span className="material-symbols-outlined text-on-surface-deep" aria-hidden="true">call</span>
                <a className="text-foreground hover:text-primary" href={`tel:${client.phone}`}>
                  {client.phone}
                </a>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-sm text-body-md">
                <span className="material-symbols-outlined text-on-surface-deep" aria-hidden="true">location_on</span>
                <span className="text-foreground truncate">{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col overflow-hidden">
        <div className="p-sm border-b border-border-subtle bg-surface-muted">
          <h3 className="text-body-md-bold text-foreground">{t('receivables.detail.activity.title', 'Actividad y Notas', {})}</h3>
        </div>
        <div className="p-sm flex flex-col gap-md max-h-[400px] overflow-y-auto">
          <div className="relative pl-md border-l border-border-subtle space-y-md">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div key={activity.id || index} className="relative">
                  <div
                    className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${getActivityColor(activity.type)} ring-4 ring-surface`}
                    aria-hidden="true"
                  />
                  <div className="flex flex-col gap-xs">
                    <p className="text-body-sm-bold text-on-surface-deep font-data-mono text-data-mono">
                      {new Date(activity.date).toLocaleDateString()} {activity.time || ''}
                    </p>
                    {activity.type === 'NOTE' ? (
                      <div className="bg-primary/10 p-sm rounded-sm rounded-tl-none">
                        <p className="text-body-md text-foreground">{activity.description}</p>
                        <p className="text-body-sm-bold text-primary mt-xs">- {activity.user}</p>
                      </div>
                    ) : (
                      <p className="text-body-md text-foreground">
                        {activity.type === 'SYSTEM' && (
                          <span className="font-bold text-primary">{t('bi.receivables.detail.system', 'Sistema', {})} </span>
                        )}
                        {activity.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-sm text-center">
                <p className="text-body-md text-on-surface-deep italic">
                  {t('common.no_activity', 'No hay actividad reciente', {})}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSidebar

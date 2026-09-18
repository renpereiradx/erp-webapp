import { useI18n } from '@/lib/i18n';
import type { ClientCreditProfileBundle } from '../types';

/**
 * Barra apilada de antigüedad del perfil de crédito.
 * Migración FASE 3: .tsx + tokens + i18n.
 */

interface AgingBarProps {
  aging?: ClientCreditProfileBundle['aging']
  totalAR?: number | string
}

const LEGEND = [
  { tone: 'bg-success', labelKey: 'bi.receivables.aging.current', label: 'Al Día' },
  { tone: 'bg-warning', labelKey: 'bi.receivables.aging.bar30', label: '1-30 Días' },
  { tone: 'bg-warning', labelKey: 'bi.receivables.aging.bar60', label: '31-60 Días' },
  { tone: 'bg-error', labelKey: 'bi.receivables.aging.over90', label: '> 90 Días' },
]

const AgingBar = ({ aging = [], totalAR = 0 }: AgingBarProps) => {
  const { t } = useI18n();
  const segments = Array.isArray(aging) ? aging : []

  return (
    <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-md gap-sm">
        <h2 className="text-body-md-bold text-foreground uppercase tracking-tight">
          {t('bi.receivables.aging.barTitle', 'Análisis de Antigüedad', {})}
        </h2>
        <div className="flex items-center gap-md text-label-caps uppercase text-on-surface-deep">
          {LEGEND.map((l) => (
            <div key={l.labelKey} className="flex items-center gap-xs">
              <span className={`size-2 rounded-full ${l.tone}`} aria-hidden="true" />
              {t(l.labelKey, l.label, {})}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full">
        {/* Visual Bar */}
        <div className="flex h-12 w-full rounded-sm overflow-hidden mb-xs border border-border-subtle bg-surface-muted">
          {segments.length > 0 ? (
            segments.map((segment, idx) => (
              <div
                key={idx}
                className={`${segment.colorClass || 'bg-on-surface-deep/40'} h-full flex items-center justify-center text-on-primary text-body-sm-bold transition-all hover:brightness-95`}
                style={{ width: segment.width || '0%' }}
                title={`${segment.label}: ${segment.amount}`}
              >
                {segment.width !== '0%' && segment.amount}
              </div>
            ))
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-deep text-body-sm-bold uppercase">
              {t('bi.receivables.aging.noData', 'Sin datos de antigüedad disponibles', {})}
            </div>
          )}
        </div>
        <div className="flex justify-between text-label-caps uppercase text-on-surface-deep mt-xs">
          <span>
            {t('bi.receivables.aging.totalBalance', 'Saldo Total', {})}:{' '}
            <span className="font-data-mono text-data-mono">{totalAR || '0'}</span>
          </span>
          {segments.some((s) => /90/.test(s.label) && s.width !== '0%') && (
            <span className="text-error">{t('bi.receivables.aging.alert90', 'Alerta: > 90 Días', {})}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgingBar

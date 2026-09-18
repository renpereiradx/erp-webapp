import { AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
// F1 (PLAN_ALINEACION_BI_FRONTEND): estilos de riesgo extraídos a domain
import { getRiskStyles } from '@/domain/receivables/risk';

/**
 * Gauge de riesgo del perfil de crédito.
 * Migración FASE 3: .tsx + tokens + i18n (los estilos viven en domain).
 */

interface RiskGaugeProps {
  score?: number | null
  level?: string
  recommendation?: string
}

const RiskGauge = ({ score = 0, level = 'Medium', recommendation = '' }: RiskGaugeProps) => {
  const { t } = useI18n();
  const styles = getRiskStyles(level);
  const hasScore = score != null && score !== undefined;

  return (
    <div className="bg-surface rounded-md border border-border-subtle p-md shadow-whisper">
      <div className="flex items-center justify-between mb-md">
        <h2 className="text-body-md-bold text-foreground uppercase tracking-tight">
          {t('bi.receivables.profile.risk.title', 'Perfil de Riesgo', {})}
        </h2>
      </div>
      <div className="flex flex-col items-center">
        {/* Radial Gauge (Reducido) */}
        <div className="relative size-32">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36" role="img" aria-label={styles.label}>
            <path className="text-surface-muted stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3" />
            {hasScore && (
              <path
                className={`${styles.color} stroke-current drop-shadow-sm`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeDasharray={`${score}, 100`}
                strokeLinecap="round"
                strokeWidth="3"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {hasScore ? (
              <span className="text-title-md font-data-mono text-data-mono text-foreground">{score}</span>
            ) : (
              <span className={`text-body-md-bold uppercase tracking-tight ${styles.color}`}>{styles.label}</span>
            )}
            <span className="text-body-sm-bold text-on-surface-deep uppercase leading-none">
              {hasScore ? t('bi.receivables.profile.risk.score', 'Score', {}) : t('bi.receivables.profile.risk.noScore', 'Sin score numérico', {})}
            </span>
          </div>
        </div>
        <div className="mt-sm text-center">
          <div className={`inline-flex items-center gap-xs px-sm py-0.5 rounded-full ${styles.bg} text-body-sm-bold mb-sm`}>
            <span className={`size-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
            {styles.label}
          </div>
        </div>

        <div className="w-full space-y-xs mt-xs">
          <div className="p-sm bg-error/5 rounded-sm border border-error/20">
            <div className="flex gap-sm">
              <AlertTriangle className="text-error size-4 shrink-0" />
              <p className="text-body-sm-bold text-error uppercase tracking-tight">
                {t('bi.receivables.profile.risk.recommendation', 'Recomendación', {})}
              </p>
            </div>
            <p className="text-body-sm text-error/90 mt-xs leading-relaxed">
              {recommendation || t('bi.receivables.profile.risk.defaultRecommendation', 'Monitorear de cerca. Solicitar pago parcial antes de liberar el próximo envío.', {})}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;

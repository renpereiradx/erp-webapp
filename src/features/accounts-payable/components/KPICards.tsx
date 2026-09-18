import { Wallet, AlertCircle, Calendar, Zap, TrendingUp, Info, type LucideIcon } from 'lucide-react';
import { formatNumber, formatPYG } from '@/utils/currencyUtils';
import type { PayablesKpiCard } from '@/domain/payables/dashboard';

/**
 * KPI Cards del dashboard de CxP (consumen domain/payables/dashboard).
 * Migración FASE 4: .tsx + tokens DESIGN.
 */

const ICON_MAP: Record<string, LucideIcon> = {
  account_balance_wallet: Wallet,
  priority_high: AlertCircle,
  calendar_today: Calendar,
  speed: Zap,
};

const KPICard = ({ kpi }: { kpi: PayablesKpiCard }) => {
  const { title, value, trend, trendType, subtitle, isPercentage, progress, critical, id } = kpi;
  const Icon = ICON_MAP[kpi.icon] || Info;

  const formatValue = (val: number | null | undefined) =>
    isPercentage ? `${formatNumber(val ?? 0)}%` : formatPYG(val ?? 0);

  const isDanger = Boolean(critical) || trendType === 'danger';
  const isSuccess = trendType === 'success';

  let iconBgClass = 'bg-primary/10';
  let iconTextClass = 'text-primary';
  if (isDanger) {
    iconBgClass = 'bg-error/10';
    iconTextClass = 'text-error';
  } else if (id === 'weekly-payments') {
    iconBgClass = 'bg-success/10';
    iconTextClass = 'text-success';
  }

  const baseCardClass =
    'bg-surface border border-border-subtle shadow-whisper p-md rounded-md flex flex-col justify-between h-full overflow-hidden transition-shadow hover:shadow-fluent-8';
  const cardClass = critical ? `${baseCardClass} border-l-4 border-l-error` : baseCardClass;

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-start gap-sm">
        <div className="flex-1 min-w-0">
          <p className="text-body-sm-bold text-on-surface-deep truncate uppercase">{title}</p>
          <h2
            className={`text-title-md font-data-mono text-data-mono mt-xs break-words tracking-tight leading-none ${
              critical ? 'text-error' : 'text-foreground'
            }`}
          >
            {formatValue(value)}
          </h2>
        </div>
        <div className={`shrink-0 p-sm rounded-md ${iconBgClass}`}>
          <Icon className={`w-5 h-5 ${iconTextClass}`} />
        </div>
      </div>

      {progress !== undefined ? (
        <div className="mt-md w-full bg-surface-muted h-2 rounded-full overflow-hidden">
          <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className="mt-md flex items-center text-label-caps uppercase leading-tight">
          {trend && (
            <span
              className={`flex items-center shrink-0 mr-xs px-xs py-0.5 rounded-xs font-data-mono text-data-mono ${
                isSuccess ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}
            >
              {isSuccess ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <AlertCircle className="w-3 h-3 mr-0.5" />}
              {trend}
            </span>
          )}
          <span className="text-on-surface-deep min-w-0">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

interface KPICardsProps {
  kpis?: PayablesKpiCard[]
}

const KPICards = ({ kpis = [] }: KPICardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md" data-testid="payables-kpi-cards">
    {kpis.map((kpi) => (
      <KPICard key={kpi.id} kpi={kpi} />
    ))}
  </div>
);

export default KPICards

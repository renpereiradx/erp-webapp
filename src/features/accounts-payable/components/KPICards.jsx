import React from 'react';
import { Wallet, AlertCircle, Calendar, Zap, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { formatPYG } from '@/utils/currencyUtils';

/**
 * KPI Cards for accounts payable dashboard.
 * Optimized font sizes for better visibility of long numeric values and labels.
 */
const KPICard = ({ title, value, currency, trend, trendType, icon: Icon, subtitle, isPercentage, progress, critical, id }) => {
  const formatValue = (val) => {
    if (isPercentage) return `${val}%`;
    return formatPYG(val);
  };

  const isDanger = critical || trendType === 'danger';
  const isSuccess = trendType === 'success';

  let iconBgClass = 'bg-primary/10';
  let iconTextClass = 'text-primary';
  if (isDanger) {
    iconBgClass = 'bg-red-50 dark:bg-red-900/20';
    iconTextClass = 'text-fluent-danger';
  } else if (id === 'weekly-payments') {
    iconBgClass = 'bg-fluent-success/10';
    iconTextClass = 'text-fluent-success';
  } else if (id === 'compliance-rate') {
    iconBgClass = 'bg-blue-50 dark:bg-blue-900/20';
    iconTextClass = 'text-primary';
  }

  const baseCardClass = "bg-white dark:bg-[#1b2633] border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] p-6 rounded-xl flex flex-col justify-between h-full overflow-hidden transition-all hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]";
  const cardClass = critical ? `${baseCardClass} border-l-4 border-l-fluent-danger` : baseCardClass;

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate tracking-tight uppercase">{title}</p>
          <h2 className={`text-xl xl:text-2xl font-bold mt-1.5 break-words tracking-tight leading-none ${critical ? 'text-fluent-danger' : 'text-slate-900 dark:text-white'}`}>
            {formatValue(value)}
          </h2>
        </div>
        <div className={`flex-shrink-0 p-2.5 rounded-xl ${iconBgClass} shadow-sm`}>
          <Icon className={`w-5 h-5 xl:w-6 xl:h-6 ${iconTextClass}`} />
        </div>
      </div>
      
      {progress !== undefined ? (
        <div className="mt-5 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden p-0.5">
          <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      ) : (
        <div className="mt-5 flex items-center text-[10px] xl:text-[11px] font-bold uppercase tracking-wider leading-tight">
          {trend && (
            <span className={`flex items-center flex-shrink-0 mr-2 px-1.5 py-0.5 rounded-md ${isSuccess ? 'bg-fluent-success/10 text-fluent-success' : 'bg-fluent-danger/10 text-fluent-danger'}`}>
              {isSuccess ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <AlertCircle className="w-3 h-3 mr-0.5" />}
              {trend}
            </span>
          )}
          <span className="text-slate-400 min-w-0">{subtitle}</span>
        </div>
      )}
    </div>
  );
};

const KPICards = ({ kpis = [] }) => {
  const iconMap = {
    'account_balance_wallet': Wallet,
    'priority_high': AlertCircle,
    'calendar_today': Calendar,
    'speed': Zap
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map(kpi => (
        <KPICard 
          key={kpi.id} 
          {...kpi} 
          icon={iconMap[kpi.icon] || Info}
        />
      ))}
    </div>
  );
};

export default KPICards;

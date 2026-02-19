import React from 'react';
import { Wallet, AlertCircle, Calendar, Zap, TrendingUp, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * KPI Cards for accounts payable dashboard.
 * Displays 4 main metrics: Total Pending, Overdue, Weekly Payments, and Compliance Rate.
 */
const KPICard = ({ title, value, currency, trend, trendType, icon: Icon, subtitle, isPercentage, progress, critical }) => {
  const formatValue = (val) => {
    if (isPercentage) return `${val}%`;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(val);
  };

  return (
    <Card className={`kpi-card ${critical ? 'kpi-card--critical' : ''}`}>
      <div className="kpi-card__header">
        <div>
          <p className="kpi-card__label">{title}</p>
          <h2 className={`kpi-card__value ${critical ? 'kpi-card__value--danger' : ''}`}>
            {formatValue(value)}
          </h2>
        </div>
        <div className={`kpi-card__icon ${critical ? 'kpi-card__icon--danger' : (trendType === 'success' ? 'kpi-card__icon--success' : '')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {progress !== undefined ? (
        <div className="mt-4 w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      ) : (
        <div className="kpi-card__trend">
          {trend && (
            <span className={trendType === 'success' ? 'kpi-card__trend--up' : 'kpi-card__trend--down'}>
              {trendType === 'success' ? <TrendingUp size={14} className="mr-0.5 inline" /> : <AlertCircle size={14} className="mr-0.5 inline" />}
              {trend}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </Card>
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
    <div className="payables-dashboard__kpi-grid">
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

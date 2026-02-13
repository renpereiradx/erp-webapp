import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

// Hooks
import { useAgingReport } from '@/features/receivables/hooks/useAgingReport';

// Componentes
import AgingOverviewCards from '@/features/receivables/components/AgingOverviewCards';
import AgingTrendChart from '@/features/receivables/components/AgingTrendChart';
import AgingByClientTable from '@/features/receivables/components/AgingByClientTable';

/**
 * Reporte de Antigüedad y Estadísticas de Cobranza.
 * Proporciona una visión global de la salud de las cuentas por cobrar.
 */
const AgingReport = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { data, loading, error } = useAgingReport('month');

  if (loading) {
    return (
      <div className="client-profile__loading">
        <div className="client-profile__spinner"></div>
        <p className="text-secondary">{t('receivables.loading.report')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="client-profile__error">
        <span className="material-symbols-outlined text-danger" style={{ fontSize: '48px' }}>error</span>
        <h3 className="text-danger">{t('receivables.error.report')}</h3>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  // Preparamos los datos para la barra de buckets
  const agingBuckets = [
    { label: t('receivables.aging.current'), amount: data.summary.current.amount, width: `${data.summary.current.percentage}%`, color: '#10b981' },
    { label: t('receivables.aging.1_30'), amount: data.summary.days_30_60.amount, width: `${data.summary.days_30_60.percentage}%`, color: '#fbbf24' },
    { label: t('receivables.aging.31_60'), amount: data.summary.days_60_90.amount, width: `${data.summary.days_60_90.percentage}%`, color: '#f97316' },
    { label: t('receivables.aging.90'), amount: data.summary.over_90_days.amount, width: `${data.summary.over_90_days.percentage}%`, color: '#ef4444' }
  ];

  return (
    <div className="aging-report">
      {/* Header */}
      <header className="aging-report__header">
        <nav className="client-profile__breadcrumb">
          <a href="#" className="client-profile__breadcrumb-link" onClick={() => navigate('/receivables')}>
            {t('receivables.breadcrumb.home')}
          </a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">Finanzas</span>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">{t('receivables.title')}</span>
        </nav>
        
        <div className="client-profile__title-row">
          <div className="client-profile__name-group">
            <h1 className="client-profile__title">{t('receivables.aging_report.title')}</h1>
            <p className="text-secondary">{t('receivables.aging_report.subtitle')}</p>
          </div>
          <div className="client-profile__actions">
            <Button variant="outline">
              <span className="material-symbols-outlined">calendar_today</span>
              <span>Oct 1, 2023 - Oct 31, 2023</span>
              <span className="material-symbols-outlined">expand_more</span>
            </Button>
            <Button variant="primary">
              <span className="material-symbols-outlined">download</span>
              <span>{t('receivables.profile.actions.export')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <AgingOverviewCards stats={data.statistics} />

      {/* Aging Buckets Breakdown */}
      <Card className="aging-report__buckets-card">
        <CardHeader>
          <CardTitle>{t('receivables.aging_report.buckets_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6 mb-6 text-xs font-bold text-secondary">
            {agingBuckets.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }}></span>
                <span>{seg.label}</span>
              </div>
            ))}
          </div>
          <div className="aging-report__stacked-bar">
            {agingBuckets.map((seg, i) => (
              <div 
                key={i} 
                className="aging-report__stacked-bar-segment" 
                style={{ width: seg.width, backgroundColor: seg.color }}
                title={seg.label}
              >
                {seg.width}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-mono text-tertiary">
            {agingBuckets.map((seg, i) => (
              <span key={i} style={{ width: seg.width }} className={i === agingBuckets.length - 1 ? 'text-right text-danger font-bold' : ''}>
                {formatPYG(seg.amount, { compact: true })}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Table & Chart */}
      <div className="aging-report__main-grid">
        <AgingByClientTable clientsData={data.detailed.by_client} />
        <AgingTrendChart trendData={data.statistics.collection_trend} />
      </div>
    </div>
  );
};

export default AgingReport;

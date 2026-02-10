import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Gráfico de resumen de envejecimiento (Aging Summary).
 */
const AgingSummaryChart = ({ agingData }) => {
  const { t } = useI18n();

  // Mapeamos los datos para la visualización de la lista
  const buckets = [
    { label: t('receivables.aging.current'), key: 'current', color: '#107c10' },
    { label: t('receivables.aging.1_30'), key: 'days_30_60', color: '#ffb900' },
    { label: t('receivables.aging.31_60'), key: 'days_60_90', color: '#d83b01' },
    { label: t('receivables.aging.90'), key: 'over_90_days', color: '#a80000' }
  ];

  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>{t('receivables.aging_report.buckets_title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="chart-card__aging-list">
          {buckets.map((bucket, i) => {
            const data = agingData[bucket.key] || { amount: 0, percentage: 0 };
            return (
              <div key={i} className="chart-card__aging-item">
                <div className="chart-card__aging-header">
                  <span className="chart-card__aging-label">{bucket.label}</span>
                  <span className={`chart-card__aging-amount ${bucket.key === 'over_90_days' ? 'chart-card__aging-amount--danger' : ''}`}>
                    {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', notation: 'compact' }).format(data.amount)}
                  </span>
                </div>
                <div className="chart-card__aging-track">
                  <div 
                    className="chart-card__aging-fill" 
                    style={{ width: `${data.percentage}%`, backgroundColor: bucket.color }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingSummaryChart;

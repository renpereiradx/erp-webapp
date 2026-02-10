import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la tendencia de facturación vs cobranza.
 */
const AgingTrendChart = ({ trendData }) => {
  const { t } = useI18n();

  // Mapeamos los datos para la visualización
  // trendData es un array de { date, billed, collected, balance }
  const displayData = trendData || [];

  return (
    <Card className="xl:w-[400px]">
      <CardHeader>
        <CardTitle>{t('receivables.aging_report.trend_title')}</CardTitle>
        <p className="text-tertiary" style={{ fontSize: '12px', marginTop: '-8px' }}>
          {t('receivables.aging_report.trend_subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <div className="aging-trend">
          <div className="aging-trend__chart">
            {displayData.map((item, i) => {
              const billedHeight = Math.min(100, (item.billed / 8000000) * 100);
              const collectedHeight = Math.min(100, (item.collected / 8000000) * 100);
              
              return (
                <div key={i} className="aging-trend__column-group">
                  <div className="aging-trend__bars">
                    <div 
                      className="aging-trend__bar aging-trend__bar--billed" 
                      style={{ height: `${billedHeight}%` }}
                      title={`${t('receivables.aging_report.billed')}: ${item.billed}`}
                    ></div>
                    <div 
                      className="aging-trend__bar aging-trend__bar--collected" 
                      style={{ height: `${collectedHeight}%` }}
                      title={`${t('receivables.aging_report.collected')}: ${item.collected}`}
                    ></div>
                  </div>
                  <span className="aging-trend__date">
                    {new Date(item.date).toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
          
          <div className="aging-trend__legend">
            <div className="aging-trend__legend-item">
              <span className="aging-trend__legend-dot aging-trend__legend-dot--billed"></span>
              <span>{t('receivables.aging_report.billed')}</span>
            </div>
            <div className="aging-trend__legend-item">
              <span className="aging-trend__legend-dot aging-trend__legend-dot--collected"></span>
              <span>{t('receivables.aging_report.collected')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingTrendChart;

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra la barra de análisis de antigüedad.
 */
const AgingBar = ({ aging, totalAR }) => {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('receivables.aging.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aging-bar">
          <div className="aging-bar__header">
            <div className="aging-bar__legend">
              <div className="aging-bar__legend-item">
                <span className="aging-bar__legend-dot aging-bar__legend-dot--current"></span>
                <span>{t('receivables.aging.current')}</span>
              </div>
              <div className="aging-bar__legend-item">
                <span className="aging-bar__legend-dot aging-bar__legend-dot--1-30"></span>
                <span>{t('receivables.aging.1_30')}</span>
              </div>
              <div className="aging-bar__legend-item">
                <span className="aging-bar__legend-dot aging-bar__legend-dot--31-60"></span>
                <span>{t('receivables.aging.31_60')}</span>
              </div>
              <div className="aging-bar__legend-item">
                <span className="aging-bar__legend-dot aging-bar__legend-dot--90"></span>
                <span>{t('receivables.aging.90')}</span>
              </div>
            </div>
          </div>
          
          <div className="aging-bar__container">
            {aging.map((seg, i) => (
              <div 
                key={i} 
                className={`aging-bar__segment ${seg.colorClass}`} 
                style={{ width: seg.width }}
                title={seg.title}
              >
                {seg.amount}
              </div>
            ))}
          </div>
          <div className="aging-bar__footer">
            <span>{t('receivables.aging.total_ar')}: {totalAR}</span>
            <span>{t('receivables.aging.max_alert')}: {t('receivables.aging.90')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingBar;

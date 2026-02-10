import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

/**
 * Componente que muestra el indicador de riesgo circular.
 */
const RiskGauge = ({ score, level, recommendation }) => {
  const { t } = useI18n();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('receivables.risk.title')}</CardTitle>
        <CardAction>
          <Button variant="link" size="sm">
            {t('receivables.risk.full_analysis')}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="risk-gauge">
          <div className="risk-gauge__container">
            <svg className="risk-gauge__svg" viewBox="0 0 36 36">
              <path className="risk-gauge__bg-circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
              <path className="risk-gauge__value-circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray={`${score}, 100`} strokeLinecap="round" strokeWidth="3"></path>
            </svg>
            <div className="risk-gauge__score">
              <span className="risk-gauge__score-value">{score}</span>
              <span className="risk-gauge__score-label">{t('receivables.risk.score')}</span>
            </div>
          </div>
          
          <div className="risk-gauge__badge">
            <span className="risk-gauge__badge-dot"></span>
            {level}
          </div>

          <div className="risk-gauge__recommendation">
            <div className="risk-gauge__recommendation-header">
              <span className="material-symbols-outlined">warning</span>
              <p className="risk-gauge__recommendation-title">{t('receivables.risk.recommendation.title')}</p>
            </div>
            <p className="risk-gauge__recommendation-text">{recommendation}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RiskGauge;

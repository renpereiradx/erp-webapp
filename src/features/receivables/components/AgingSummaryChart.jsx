import React from 'react';
import { useI18n } from '@/lib/i18n';

/**
 * Gráfico de resumen de envejecimiento (Aging Summary).
 * Pulido al 100% para coincidir con el diseño de Stitch (en español).
 */
const AgingSummaryChart = ({ agingData }) => {
  const { t } = useI18n();

  // Mapeamos los datos con los colores y etiquetas exactas de Stitch en español
  const buckets = [
    { label: 'Corriente', key: 'current', color: 'bg-primary' },
    { label: '1-30 Días', key: 'days_1_30', color: 'bg-[#60a5fa]' },
    { label: '31-60 Días', key: 'days_31_60', color: 'bg-yellow-400' },
    { label: '61-90 Días', key: 'days_61_90', color: 'bg-orange-400' },
    { label: '+90 Días', key: 'over_90_days', color: 'bg-semantic-danger' }
  ];

  return (
    <div className="flex flex-col rounded-xl bg-white dark:bg-surface-dark p-6 shadow-card border border-gray-100 dark:border-gray-800 h-full overflow-hidden">
      <div className="mb-6">
        <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">Resumen de Antigüedad</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Pendientes por tramos de días</p>
      </div>
      <div className="flex flex-col flex-1 justify-center gap-6">
        {buckets.map((bucket, i) => {
          const data = agingData[bucket.key] || { amount: 0, percentage: 0 };
          const isCritical = bucket.key === 'over_90_days';
          
          return (
            <div key={i} className="group">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                  {bucket.label}
                </span>
                <span className={`font-mono ${isCritical ? 'text-semantic-danger font-bold' : 'text-text-secondary-light dark:text-text-secondary-dark'}`}>
                  {new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', notation: 'compact' }).format(data.amount)}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${bucket.color}`}
                  style={{ width: `${data.percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgingSummaryChart;

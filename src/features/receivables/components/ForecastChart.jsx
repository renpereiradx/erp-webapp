import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

/**
 * Gráfico de flujo de caja proyectado (Forecast).
 */
const ForecastChart = ({ forecastData }) => {
  const { t } = useI18n();

  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Cash Flow Forecast</CardTitle>
        <div className="chart-card__legend">
          <div className="chart-card__legend-item">
            <span className="chart-card__legend-dot" style={{ backgroundColor: '#137fec' }}></span>
            <span>Projected</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="chart-card__grid">
          {/* Visualización simplificada con CSS para demo */}
          <div className="flex items-end justify-between h-48 w-full gap-2">
            {[60, 85, 45, 90, 70, 55].map((h, i) => (
              <div key={i} className="flex-1 bg-primary rounded-t-sm" style={{ height: `${h}%`, opacity: 0.8 }}></div>
            ))}
          </div>
          <div className="chart-card__x-axis mt-4">
            <span>Week 1</span>
            <span>Week 2</span>
            <span>Week 3</span>
            <span>Week 4</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ForecastChart;

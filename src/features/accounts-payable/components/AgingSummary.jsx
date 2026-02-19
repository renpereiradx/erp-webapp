import React from 'react';
import { Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * Aging Summary Chart for the Dashboard.
 * Displays aging bars (0-30, 31-60, 61-90, 90+ days).
 */
const AgingSummary = ({ aging = [], stats = {} }) => {
  return (
    <Card className="aging-summary-card h-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg">Resumen de Antigüedad (Aging)</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Cifras en USD</span>
          <Info className="text-slate-300 w-4 h-4" />
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="aging-chart__bar-container">
          {aging.map((item, index) => {
            let fillClass = 'aging-chart__fill--primary';
            if (item.critical) fillClass = 'aging-chart__fill--danger';
            else if (item.label.includes('61')) fillClass = 'aging-chart__fill--warning';
            else if (item.label.includes('31')) fillClass = 'aging-chart__fill--primary-light';

            return (
              <div key={index} className="aging-chart__bar-row">
                <div className="aging-chart__bar-label">
                  <span className={`aging-chart__label-text ${item.critical ? 'aging-chart__label-text--danger' : ''}`}>
                    {item.label}
                  </span>
                  <span className={`aging-chart__label-value ${item.critical ? 'aging-chart__label-value--danger' : ''}`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      maximumFractionDigits: 0
                    }).format(item.amount)}
                  </span>
                </div>
                <div className="aging-chart__track">
                  <div 
                    className={`aging-chart__fill ${fillClass}`}
                    style={{ width: `${item.percentage}%` }}
                  >
                    {item.percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="aging-chart__stats">
          <div className="aging-chart__stat-item">
            <p className="aging-chart__stat-label">Total</p>
            <p className="aging-chart__stat-value">{stats.total}</p>
          </div>
          <div className="aging-chart__stat-item">
            <p className="aging-chart__stat-label">Al Corriente</p>
            <p className="aging-chart__stat-value aging-chart__stat-value--success">{stats.onTime}</p>
          </div>
          <div className="aging-chart__stat-item">
            <p className="aging-chart__stat-label">Vencimiento Crítico</p>
            <p className="aging-chart__stat-value aging-chart__stat-value--danger">{stats.critical}</p>
          </div>
          <div className="aging-chart__stat-item">
            <p className="aging-chart__stat-label">Prom. Días Pago</p>
            <p className="aging-chart__stat-value">{stats.avgDays}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AgingSummary;

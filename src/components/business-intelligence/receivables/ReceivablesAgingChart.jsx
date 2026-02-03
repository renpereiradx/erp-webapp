import React from 'react';

/**
 * Receivables Aging Chart
 * Réplica exacta del componente Aging Summary de Stitch
 */
const ReceivablesAgingChart = ({ agingData }) => {
  // Mock data strictly matching Stitch receivables_dashboard.html
  const buckets = [
      { label: 'Current', amount: '$850k', color: 'var(--rec-primary)', percentage: 75 },
      { label: '1-30 Days', amount: '$180k', color: '#60a5fa', percentage: 25 },
      { label: '31-60 Days', amount: '$120k', color: '#facc15', percentage: 15 },
      { label: '61-90 Days', amount: '$55k', color: '#fb923c', percentage: 8 },
      { label: '90+ Days', amount: '$35k', color: 'var(--rec-danger)', percentage: 5, isDanger: true },
  ];

  return (
    <div className="chart-card">
      <header className="chart-card__header">
        <div>
            <h3 className="chart-card__title">Aging Summary</h3>
            <p className="chart-card__subtitle">Outstanding by Days</p>
        </div>
      </header>
      
      <div className="chart-card__aging-list">
        {buckets.map((bucket, idx) => (
            <div key={idx} className="chart-card__aging-item">
                <div className="chart-card__aging-header">
                    <span className="chart-card__aging-label">{bucket.label}</span>
                    <span className={`chart-card__aging-amount ${bucket.isDanger ? 'chart-card__aging-amount--danger' : ''}`}>
                        {bucket.amount}
                    </span>
                </div>
                <div className="chart-card__aging-track">
                    <div 
                        className="chart-card__aging-fill" 
                        style={{ width: `${bucket.percentage}%`, backgroundColor: bucket.color }}
                    ></div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default ReceivablesAgingChart;
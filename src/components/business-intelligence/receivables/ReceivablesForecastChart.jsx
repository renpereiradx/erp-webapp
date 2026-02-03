import React from 'react';

/**
 * Receivables Forecast Chart
 * Réplica exacta del componente Collection Trend de Stitch con leyenda
 */
const ReceivablesForecastChart = ({ forecastData }) => {
  return (
    <div className="chart-card">
      <header className="chart-card__header">
        <div>
          <h3 className="chart-card__title">Collection Trend</h3>
          <p className="chart-card__subtitle">Last 6 Months Performance</p>
        </div>
        <div className="text-right">
          <p className="chart-card__value">$4.2M</p>
          <p className="chart-card__subtitle chart-card__subtitle--xs text-success font-medium">Total Collected</p>
        </div>
      </header>

      {/* Legend matching Stitch exactly */}
      <div className="chart-card__legend">
        <div className="chart-card__legend-item">
          <span className="chart-card__legend-dot" style={{ backgroundColor: 'var(--rec-primary)' }}></span>
          <span>Projected</span>
        </div>
        <div className="chart-card__legend-item">
          <span className="chart-card__legend-dot" style={{ backgroundColor: '#cbd5e1' }}></span>
          <span>Previous</span>
        </div>
      </div>

      <div className="chart-card__grid">
        <div className="chart-card__y-axis">
          <div className="chart-card__grid-line">1000k</div>
          <div className="chart-card__grid-line">750k</div>
          <div className="chart-card__grid-line">500k</div>
          <div className="chart-card__grid-line">250k</div>
          <div className="chart-card__grid-line">0</div>
        </div>
        
        <svg className="chart-card__svg" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--rec-primary)" stopOpacity="0.2"></stop>
              <stop offset="100%" stopColor="var(--rec-primary)" stopOpacity="0"></stop>
            </linearGradient>
          </defs>
          <path d="M0,80 Q10,75 20,60 T40,55 T60,30 T80,35 T100,10 V100 H0 Z" fill="url(#chartGradient)"></path>
          <path d="M0,80 Q10,75 20,60 T40,55 T60,30 T80,35 T100,10" fill="none" stroke="var(--rec-primary)" strokeLinecap="round" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
          
          {[
            {cx:0, cy:80}, {cx:20, cy:60}, {cx:40, cy:55}, 
            {cx:60, cy:30}, {cx:80, cy:35}, {cx:100, cy:10}
          ].map((pt, i) => (
            <circle key={i} cx={pt.cx} cy={pt.cy} fill="#ffffff" r="3" stroke="var(--rec-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke"></circle>
          ))}
        </svg>
        
        {/* Tooltip Simulation */}
        <div className="chart-card__tooltip" style={{ top: '20%', right: '18%' }}>
          <span className="font-bold">$920k</span>
          <span style={{ color: '#9ba6b5', fontSize: '0.625rem' }}>Sep</span>
        </div>
      </div>

      <div className="chart-card__x-axis">
        <span>May</span>
        <span>Jun</span>
        <span>Jul</span>
        <span>Aug</span>
        <span>Sep</span>
        <span>Oct</span>
      </div>
    </div>
  );
};

export default ReceivablesForecastChart;
import React from 'react';

/**
 * Receivables Summary Cards
 * Réplica exacta del contenido y estructura del Dashboard de Stitch
 */
const ReceivablesSummaryCards = ({ summaryData }) => {
  if (!summaryData) return null;

  return (
    <div className="receivables-dashboard__kpi-grid">
      {/* Total Pending */}
      <div className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Total Pending</p>
          <div className="kpi-card__icon kpi-card__icon--blue">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
        </div>
        <p className="kpi-card__value">$1,240,500</p>
        <div className="kpi-card__trend is-good">
          <span className="material-symbols-outlined">trending_up</span>
          <span>+2.5%</span>
          <span className="kpi-card__trend-label">vs last month</span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className="kpi-card kpi-card--danger">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Total Overdue</p>
          <div className="kpi-card__icon kpi-card__icon--red">
            <span className="material-symbols-outlined">warning</span>
          </div>
        </div>
        <p className="kpi-card__value">$320,000</p>
        <div className="kpi-card__trend is-bad">
          <span className="material-symbols-outlined">trending_up</span>
          <span>+1.2%</span>
          <span className="kpi-card__trend-label">increase in overdue</span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Collection Rate</p>
          <div className="kpi-card__icon kpi-card__icon--green">
            <span className="material-symbols-outlined">percent</span>
          </div>
        </div>
        <p className="kpi-card__value">92%</p>
        <div className="kpi-card__trend is-good">
          <span className="material-symbols-outlined">arrow_upward</span>
          <span>+0.8%</span>
          <span className="kpi-card__trend-label">efficiency gain</span>
        </div>
      </div>

      {/* Avg Days (DSO) */}
      <div className="kpi-card">
        <div className="kpi-card__header">
          <p className="kpi-card__label">Avg Days (DSO)</p>
          <div className="kpi-card__icon kpi-card__icon--orange">
            <span className="material-symbols-outlined">calendar_clock</span>
          </div>
        </div>
        <p className="kpi-card__value">45 Days</p>
        <div className="kpi-card__trend is-good">
          <span className="material-symbols-outlined">arrow_downward</span>
          <span>-2 days</span>
          <span className="kpi-card__trend-label">improvement</span>
        </div>
      </div>
    </div>
  );
};

export default ReceivablesSummaryCards;
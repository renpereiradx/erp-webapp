import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { receivablesService } from '@/services/receivablesService';

const OverdueAccounts = () => {
  const [data, setData] = useState({
    stats: {
      totalOverdue: '$145,200',
      atRisk: '12',
      efficiency: '68',
      promises: '$32,450'
    },
    accounts: [
      { id: 'INV-2023-001', client: 'Acme Corp', code: 'AC', color: 'blue', amount: '$12,500.00', days: '45 Days', priority: 'High', lastContact: 'Oct 24', contactVia: 'Via Email' },
      { id: 'INV-2023-089', client: 'Global Ind.', code: 'GI', color: 'purple', amount: '$8,240.00', days: '32 Days', priority: 'Medium', lastContact: 'Oct 20', contactVia: 'Call (No Answer)' },
      { id: 'INV-2023-112', client: 'Tech Sol', code: 'TS', color: 'teal', amount: '$2,100.00', days: '15 Days', priority: 'Low', lastContact: 'Yesterday', contactVia: 'Promise to pay' },
      { id: 'INV-2023-104', client: 'Blue Moon', code: 'BM', color: 'pink', amount: '$15,700.00', days: '62 Days', priority: 'High', lastContact: 'Oct 05', contactVia: 'Left Voicemail' },
      { id: 'INV-2023-118', client: 'Delta Logistics', code: 'DL', color: 'orange', amount: '$4,320.00', days: '35 Days', priority: 'Medium', lastContact: 'Oct 18', contactVia: 'Promised to call back' }
    ],
    isLoading: false
  });

  return (
    <div className="overdue-accounts">
      <div className="max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="receivables-master__header">
          <div className="flex flex-col gap-2">
            <h1 className="receivables-master__title">Overdue Accounts & Collections</h1>
            <p className="receivables-master__subtitle">Manage outstanding debts, track priority accounts, and execute collection tasks efficiently.</p>
          </div>
          <div className="receivables-master__actions">
            <button className="fluent-btn fluent-btn--outline py-2.5">
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Export Report</span>
            </button>
            <button className="fluent-btn fluent-btn--primary py-2.5">
              <span className="material-symbols-outlined text-lg">add_task</span>
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="receivables-dashboard__kpi-grid">
          {/* Card 1 */}
          <div className="kpi-card" style={{ border: '1px solid var(--rec-border)' }}>
            <p className="kpi-card__label">Total Overdue</p>
            <div className="flex items-end gap-2">
              <h3 className="kpi-card__value">{data.stats.totalOverdue}</h3>
              <span className="kpi-card__trend kpi-card__trend--up">
                <span className="material-symbols-outlined">arrow_upward</span> 5.2%
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="kpi-card" style={{ border: '1px solid var(--rec-border)' }}>
            <p className="kpi-card__label">Accounts at Risk (&gt;90 Days)</p>
            <div className="flex items-end gap-2">
              <h3 className="kpi-card__value">{data.stats.atRisk}</h3>
              <span className="kpi-card__trend is-bad">
                <span className="material-symbols-outlined">arrow_upward</span> 2
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="kpi-card" style={{ border: '1px solid var(--rec-border)' }}>
            <p className="kpi-card__label">Collection Efficiency</p>
            <div className="flex items-end gap-2">
              <h3 className="kpi-card__value">{data.stats.efficiency}%</h3>
              <span className="text-xs text-secondary font-medium" style={{ marginBottom: '0.25rem' }}>Target: 75%</span>
            </div>
            <div className="receivable-detail__progress">
              <div className="receivable-detail__progress-fill" style={{ width: `${data.stats.efficiency}%` }}></div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="kpi-card" style={{ border: '1px solid var(--rec-border)' }}>
            <p className="kpi-card__label">Promises to Pay</p>
            <div className="flex items-end gap-2">
              <h3 className="kpi-card__value">{data.stats.promises}</h3>
              <span className="text-xs text-secondary font-medium" style={{ marginBottom: '0.25rem' }}>Due this week</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="overdue-accounts__grid">
          {/* Left: Table Area */}
          <div className="overdue-accounts__main-content">
            <div className="rec-filter-panel">
              <div className="rec-filter-panel__row" style={{ alignItems: 'center' }}>
                <div className="rec-input-group" style={{ flex: 2 }}>
                  <div className="rec-input-group__wrapper">
                    <div className="rec-input-group__icon">
                      <span className="material-symbols-outlined text-lg">search</span>
                    </div>
                    <input className="rec-input" placeholder="Search by client name, invoice ID..." />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="fluent-btn fluent-btn--outline fluent-btn--sm h-10">
                    <span>Priority: All</span>
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </button>
                  <button className="fluent-btn fluent-btn--outline fluent-btn--sm h-10">
                    <span>Status: Unresolved</span>
                    <span className="material-symbols-outlined text-lg">expand_more</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="rec-card p-0 overflow-hidden">
              <table className="rec-table">
                <thead>
                  <tr>
                    <th className="w-12"><input type="checkbox" className="rounded" /></th>
                    <th>Client / Invoice</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Overdue</th>
                    <th>Status</th>
                    <th>Last Contact</th>
                    <th className="text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.accounts.map((acc, idx) => (
                    <tr key={idx} className="group">
                      <td><input type="checkbox" className="rounded" /></td>
                      <td>
                        <div className="overdue-accounts__client-cell">
                          <div 
                            className="overdue-accounts__avatar"
                            style={{ backgroundColor: acc.bgColor, color: acc.textColor }}
                          >
                            {acc.code}
                          </div>
                          <div className="overdue-accounts__client-info">
                            <span className="overdue-accounts__client-info-name">{acc.client}</span>
                            <span className="overdue-accounts__client-info-id">{acc.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right font-bold text-sm">{acc.amount}</td>
                      <td className="text-center">
                        <span className={`status-pill ${acc.priority === 'High' ? 'status-pill--overdue' : 'status-pill--warning'}`}>
                          {acc.days}
                        </span>
                      </td>
                      <td>
                        <span className={`rec-badge ${acc.priority === 'High' ? 'rec-badge--danger' : acc.priority === 'Medium' ? 'rec-badge--warning' : 'rec-badge--success'}`}>
                          {acc.priority} Priority
                        </span>
                      </td>
                      <td>
                        <p className="text-sm font-medium">{acc.lastContact}</p>
                        <p className="text-xs text-secondary">{acc.contactVia}</p>
                      </td>
                      <td className="text-right">
                        <div className="overdue-accounts__row-actions">
                          <button className="overdue-accounts__action-btn" title="Call">
                            <span className="material-symbols-outlined text-lg">call</span>
                          </button>
                          <button className="overdue-accounts__action-btn overdue-accounts__action-btn--success" title="WhatsApp">
                            <span className="material-symbols-outlined text-lg">chat</span>
                          </button>
                          <button className="overdue-accounts__action-btn overdue-accounts__action-btn--info" title="Email">
                            <span className="material-symbols-outlined text-lg">mail</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Sidebar */}
          <aside className="overdue-accounts__sidebar">
            <div className="rec-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="rec-card__title mb-0">Today's Tasks</h3>
                <button className="text-primary text-xs font-medium hover:underline">View Calendar</button>
              </div>
              
              <div className="task-widget">
                <div className="task-widget__donut">
                  <div className="task-widget__donut-inner">
                    <span className="task-widget__value">28</span>
                    <span className="task-widget__label">Total</span>
                  </div>
                </div>
                
                <div className="task-widget__stats">
                  <div className="task-widget__stat-box">
                    <p className="text-xs text-secondary mb-1">Completed</p>
                    <p className="font-bold text-primary text-lg">14</p>
                  </div>
                  <div className="task-widget__stat-box">
                    <p className="text-xs text-secondary mb-1">Pending</p>
                    <p className="font-bold text-lg">14</p>
                  </div>
                </div>
              </div>
              
              <button className="fluent-btn fluent-btn--outline fluent-btn--full mt-4" style={{ backgroundColor: '#eff6ff', color: 'var(--rec-primary)', borderColor: 'transparent' }}>
                Start Calling Session
              </button>
            </div>

            <div className="rec-card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="rec-card__title mb-0">Top Debtors</h3>
                <button className="text-secondary hover:text-primary">
                    <span className="material-symbols-outlined text-xl">more_horiz</span>
                </button>
              </div>
              
              <div className="debtor-list">
                {[
                  { name: 'Global Industries', amount: '$52k', width: '90%', color: '#ef4444' },
                  { name: 'Blue Moon Ltd', amount: '$38k', width: '70%', color: '#f59e0b' },
                  { name: 'Acme Corp', amount: '$25k', width: '45%', color: '#3b82f6' },
                  { name: 'Zenith Partners', amount: '$12k', width: '25%', color: '#3b82f6' }
                ].map((debtor, i) => (
                  <div key={i} className="debtor-list__item">
                    <div className="debtor-list__info">
                      <span className="debtor-list__name">{i+1}. {debtor.name}</span>
                      <span className="debtor-list__amount">{debtor.amount}</span>
                    </div>
                    <div className="debtor-list__track">
                      <div className="debtor-list__fill" style={{ width: debtor.width, backgroundColor: debtor.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <a href="#" className="mt-5 block text-center text-sm text-primary font-medium hover:underline">View Full Ranking</a>
            </div>
            
            {/* Promo Card */}
            <div className="promo-card">
                <div className="promo-card__bg-blur"></div>
                <div className="promo-card__content">
                    <div className="promo-card__icon">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <h4 className="promo-card__title">AI Insights</h4>
                    <p className="promo-card__desc">Optimize your collection strategy with predictive analytics.</p>
                    <button className="promo-card__btn">Try Beta</button>
                </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OverdueAccounts;
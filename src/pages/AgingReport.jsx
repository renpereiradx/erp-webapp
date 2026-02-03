import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { receivablesService } from '@/services/receivablesService';

const AgingReport = () => {
  const [data, setData] = useState({
    stats: {
      totalOutstanding: '$1,250,000',
      dso: '42 Days',
      efficiency: '94%'
    },
    aging: [
      { label: 'Current', amount: '$562,500', width: '45%', color: 'var(--rec-primary)' },
      { label: '1-30 Days', amount: '$312,500', width: '25%', color: 'var(--rec-primary)', opacity: 0.7 },
      { label: '31-60 Days', amount: '$187,500', width: '15%', color: '#facc15' },
      { label: '61-90 Days', amount: '$125,000', width: '10%', color: '#f97316' },
      { label: '> 90 Days', amount: '$62,500', width: '5%', color: 'var(--rec-danger)' }
    ],
    debtors: [
      { name: 'Acme Corp', id: '#9201', total: '$124,500.00', overdue: '$12,000.00', risk: 'Medium', lastPayment: 'Oct 12, 2023' },
      { name: 'Globex Inc.', id: '#8821', total: '$89,200.00', overdue: '$0.00', risk: 'Low', lastPayment: 'Oct 28, 2023' },
      { name: 'Soylent Ind.', id: '#7732', total: '$215,000.00', overdue: '$45,000.00', risk: 'High', lastPayment: 'Sep 05, 2023' },
      { name: 'Umbrella Corp', id: '#1002', total: '$54,320.00', overdue: '$0.00', risk: 'Low', lastPayment: 'Nov 01, 2023' },
      { name: 'Massive Ind.', id: '#5512', total: '$32,100.00', overdue: '$5,400.00', risk: 'Medium', lastPayment: 'Oct 15, 2023' }
    ]
  });

  return (
    <div className="aging-report">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 text-sm text-secondary">
            <a href="#" className="hover:text-primary">Home</a>
            <span>/</span>
            <span>Finance</span>
            <span>/</span>
            <span className="font-bold text-primary">AR Dashboard</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Aging Report & Collection Stats</h1>
              <p className="text-secondary text-base">Detailed analysis of accounts receivable and collection performance.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button className="fluent-btn fluent-btn--outline">
                <span className="material-symbols-outlined text-lg">calendar_today</span>
                <span>Oct 1, 2023 - Oct 31, 2023</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <button className="fluent-btn fluent-btn--primary">
                <span className="material-symbols-outlined text-lg">download</span>
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rec-card">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-secondary">Total Outstanding</p>
              <span className="material-symbols-outlined text-secondary">account_balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.stats.totalOutstanding}</p>
              <span className="text-xs font-bold text-danger bg-red-50 px-2 py-0.5 rounded-full">+2.5%</span>
            </div>
            <p className="text-xs text-secondary mt-2">Vs. previous 30 days</p>
          </div>
          <div className="rec-card">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-secondary">DSO</p>
              <span className="material-symbols-outlined text-secondary">schedule</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.stats.dso}</p>
              <span className="text-xs font-bold text-success bg-green-50 px-2 py-0.5 rounded-full">-1.2 days</span>
            </div>
            <p className="text-xs text-secondary mt-2">Vs. industry average of 45 days</p>
          </div>
          <div className="rec-card">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-secondary">Collection Efficiency</p>
              <span className="material-symbols-outlined text-secondary">pie_chart</span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{data.stats.efficiency}</p>
              <span className="text-xs font-bold text-success bg-green-50 px-2 py-0.5 rounded-full">+0.5%</span>
            </div>
            <p className="text-xs text-secondary mt-2">Collection Index (CEI)</p>
          </div>
        </div>

        {/* Hero Aging Bar */}
        <div className="rec-card">
          <h3 className="rec-card__title">Aging Buckets Breakdown</h3>
          <div className="flex flex-wrap gap-6 mb-6 text-xs font-bold text-secondary">
            {data.aging.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color, opacity: seg.opacity || 1 }}></span>
                <span>{seg.label}</span>
              </div>
            ))}
          </div>
          <div className="aging-report__stacked-bar">
            {data.aging.map((seg, i) => (
              <div 
                key={i} 
                className="aging-report__stacked-bar-segment" 
                style={{ width: seg.width, backgroundColor: seg.color, opacity: seg.opacity || 1 }}
                title={seg.label}
              >
                {seg.width}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs font-mono text-secondary">
            {data.aging.map((seg, i) => (
              <span key={i} style={{ width: seg.width }} className={i === data.aging.length - 1 ? 'text-right text-danger font-bold' : ''}>
                {seg.amount}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Top Debtors Table */}
          <div className="flex-1 rec-card p-0 overflow-hidden">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="rec-card__title mb-0">Top Debtors</h3>
                <span className="rec-badge rec-badge--danger">High Risk</span>
              </div>
              <button className="p-1 text-secondary"><span className="material-symbols-outlined">filter_list</span></button>
            </div>
            <table className="rec-table">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th className="text-right">Total O/S</th>
                  <th className="text-right text-danger">&gt; 90 Days</th>
                  <th className="text-center">Risk</th>
                  <th>Last Payment</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.debtors.map((debtor, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold">{debtor.name}</span>
                        <span className="text-xs text-secondary">ID: {debtor.id}</span>
                      </div>
                    </td>
                    <td className="text-right font-mono font-bold">{debtor.total}</td>
                    <td className="text-right font-mono text-danger font-bold">{debtor.overdue}</td>
                    <td className="text-center">
                      <span className={`rec-badge ${debtor.risk === 'High' ? 'rec-badge--danger' : debtor.risk === 'Medium' ? 'rec-badge--warning' : 'rec-badge--success'}`}>
                        {debtor.risk}
                      </span>
                    </td>
                    <td className="text-secondary">{debtor.lastPayment}</td>
                    <td><button className="text-primary font-bold text-xs">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Trend Chart (CSS Visual) */}
          <div className="xl:w-[400px] rec-card">
            <h3 className="rec-card__title">Billing vs. Collections</h3>
            <p className="text-xs text-secondary -mt-2 mb-6">Last 6 Months Trend</p>
            <div className="relative h-64 flex items-end justify-between gap-2 px-2 mt-auto">
              {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="flex items-end gap-1 h-48 w-full">
                    <div className="w-3 bg-gray-200 rounded-t-sm" style={{ height: `${40 + Math.random() * 50}%` }}></div>
                    <div className="w-3 bg-primary rounded-t-sm" style={{ height: `${30 + Math.random() * 60}%` }}></div>
                  </div>
                  <span className="text-[10px] text-secondary font-bold">{month}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-gray-200"></span>
                <span className="text-xs text-secondary font-bold">Billed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary"></span>
                <span className="text-xs text-secondary font-bold">Collected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgingReport;
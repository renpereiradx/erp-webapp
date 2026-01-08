/**
 * Dashboard Page - Executive BI Dashboard
 * Designed with Fluent Design System
 */

import React, { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import useDashboardStore from '../store/useDashboardStore';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  TrendingDown, 
  LineChart, 
  Receipt, 
  Calendar, 
  Download, 
  ChevronDown,
  Package,
  CreditCard,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';

const Dashboard = () => {
  const { t } = useI18n();
  const { summary, alerts, activities, loading, error, fetchDashboardData } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Mock data for the Revenue vs Expenses chart (matching the path shape roughly)
  // TODO: Use real trend data when available in API
  const chartData = [
    { name: 'Jan 1', revenue: 4000, expenses: 2400 },
    { name: 'Jan 5', revenue: 3000, expenses: 1398 },
    { name: 'Jan 10', revenue: 2000, expenses: 9800 },
    { name: 'Jan 15', revenue: 2780, expenses: 3908 },
    { name: 'Jan 20', revenue: 1890, expenses: 4800 },
    { name: 'Jan 25', revenue: 2390, expenses: 3800 },
    { name: 'Jan 30', revenue: 3490, expenses: 4300 },
  ];

  if (loading && !summary) {
    return (
      <div className="dashboard">
        <div className="dashboard__loading">
          <div className="dashboard__loading-spinner" />
          <p className="dashboard__loading-text">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard__error">
          <h2 className="dashboard__error-title">
            {t('dashboard.error.title', 'Error al cargar el Dashboard')}
          </h2>
          <p className="dashboard__error-message">{error}</p>
          <button className="dashboard__error-retry" onClick={fetchDashboardData}>
            {t('common.retry', 'Reintentar')}
          </button>
        </div>
      </div>
    );
  }

  const formattedValue = (value) => (typeof value === 'number' ? value.toLocaleString() : value || 0);

  // Helper to interpret API values safely
  const salesTotal = summary?.sales?.total || 0;
  const salesCount = summary?.sales?.count || 0;
  
  const purchasesTotal = summary?.purchases?.total || 0;
  
  const netProfit = summary?.profit?.gross || 0;
  const profitMargin = summary?.profit?.margin_percentage || 0;
  
  // Daily transactions proxy (using sales count for now effectively)
  const dailyTransactions = summary?.sales?.count || 0; // Or better metric from API if available

  const inventoryValue = summary?.inventory?.total_value || 0;
  const lowStockCount = summary?.inventory?.low_stock_count || 0;
  
  const cashBalance = summary?.cash_registers?.total_balance || 0;
  
  const receivablesTotal = summary?.receivables?.total_pending || 0;
  const payablesTotal = summary?.payables?.total_pending || 0;
  const overdueInvoices = summary?.receivables?.overdue_count || 0;

  // Recent activity helper
  const renderActivityIcon = (type, severity) => {
    // Mapping activity types or severity to icons
    if (severity === 'critical') return <div className="activity-item__icon activity-item__icon--error"><AlertCircle size={18} /></div>;
    if (severity === 'success') return <div className="activity-item__icon activity-item__icon--success"><CheckCircle2 size={18} /></div>;
    return <div className="activity-item__icon activity-item__icon--info"><Info size={18} /></div>;
  };

  return (
    <div className="dashboard">
      {/* Page Heading & Filters */}
      <div className="dashboard__header">
        <div className="dashboard__titles">
          <h1 className="dashboard__title">Executive Summary</h1>
          <p className="dashboard__subtitle">Real-time overview of key performance indicators</p>
        </div>
        <div className="dashboard__actions">
          <button className="btn btn--outline btn--icon-right">
            <Calendar size={18} />
            <span>Last 30 Days</span>
            <ChevronDown size={18} />
          </button>
          <button className="btn btn--primary btn--icon">
            <Download size={18} />
            <span className="hidden-mobile">Export Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard__kpi-grid">
        {/* Total Sales */}
        <div className="card kpi-card">
          <div className="kpi-card__header">
            <div className="kpi-card__icon kpi-card__icon--blue">
              <DollarSign size={24} />
            </div>
            <span className="kpi-card__trend kpi-card__trend--up">
              <TrendingUp size={14} />
              12% {/* Trend data not yet in summary API, keeping static/placeholder */}
            </span>
          </div>
          <div className="kpi-card__content">
            <p className="kpi-card__label">Total Sales</p>
            <p className="kpi-card__value">${formattedValue(salesTotal)}</p>
          </div>
        </div>

        {/* Purchases */}
        <div className="card kpi-card">
          <div className="kpi-card__header">
            <div className="kpi-card__icon kpi-card__icon--orange">
              <ShoppingCart size={24} />
            </div>
            <span className="kpi-card__trend kpi-card__trend--down">
              <TrendingDown size={14} />
              5%
            </span>
          </div>
          <div className="kpi-card__content">
            <p className="kpi-card__label">Purchases</p>
            <p className="kpi-card__value">${formattedValue(purchasesTotal)}</p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="card kpi-card">
          <div className="kpi-card__header">
            <div className="kpi-card__icon kpi-card__icon--green">
              <LineChart size={24} />
            </div>
            <span className="kpi-card__trend kpi-card__trend--up">
              <TrendingUp size={14} />
              {profitMargin}%
            </span>
          </div>
          <div className="kpi-card__content">
            <p className="kpi-card__label">Net Profit (Gross)</p>
            <p className="kpi-card__value">${formattedValue(netProfit)}</p>
          </div>
        </div>

        {/* Daily Transactions */}
        <div className="card kpi-card">
          <div className="kpi-card__header">
            <div className="kpi-card__icon kpi-card__icon--purple">
              <Receipt size={24} />
            </div>
            <span className="kpi-card__trend kpi-card__trend--up">
              <TrendingUp size={14} />
              2%
            </span>
          </div>
          <div className="kpi-card__content">
            <p className="kpi-card__label">Daily Transactions</p>
            <p className="kpi-card__value">{formattedValue(dailyTransactions)}</p>
          </div>
        </div>
      </div>

      {/* Main Chart & Operations Grid */}
      <div className="dashboard__main-grid">
        {/* Revenue vs Expenses Chart (Spans 2 columns) */}
        <div className="card chart-card">
          <div className="chart-card__header">
            <div>
              <h3 className="card__title">Revenue vs Expenses</h3>
              <p className="card__subtitle">Performance over time</p>
            </div>
            <div className="chart-card__legend">
              <div className="chart-card__legend-item">
                <span className="dot" style={{ backgroundColor: '#0078d4' }}></span>
                <span className="label">Revenue</span>
              </div>
              <div className="chart-card__legend-item">
                <span className="dot" style={{ backgroundColor: '#cbd5e1' }}></span>
                <span className="label">Expenses</span>
              </div>
            </div>
          </div>
          <div className="chart-card__content">
            <div className="chart-card__container">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#617589' }}
                    dy={10}
                  />
                  
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0078d4" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#cbd5e1" 
                    strokeWidth={3} 
                    strokeDasharray="6 6"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Operations Stack (Inventory & Cash) */}
        <div className="operations-stack">
          {/* Inventory Card */}
          <div className="card operation-card">
            <div className="operation-card__deco operation-card__deco--orange"></div>
            <div className="operation-card__content">
              <div className="operation-card__header">
                <div className="operation-card__icon operation-card__icon--orange">
                  <Package size={24} />
                </div>
                <h4 className="operation-card__title">Inventory</h4>
              </div>
              <p className="card__subtitle">Total Valuation</p>
              <p className="card__title">${formattedValue(inventoryValue)}</p>
              
              {lowStockCount > 0 && (
                <div className="operation-card__alert">
                  <AlertTriangle size={20} />
                  <span>{lowStockCount} Items Low Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Cash Card */}
          <div className="card operation-card">
            <div className="operation-card__deco operation-card__deco--green"></div>
            <div className="operation-card__content">
              <div className="operation-card__header">
                <div className="operation-card__icon operation-card__icon--green">
                  <CreditCard size={24} />
                </div>
                <h4 className="operation-card__title">Cash Register</h4>
              </div>
              <p className="card__subtitle">Current Balance</p>
              <p className="card__title">${formattedValue(cashBalance)}</p>
              
              <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '6px', 
                  backgroundColor: '#f1f5f9', 
                  borderRadius: '99px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: '75%', // TODO: Calculate percentage based on target
                    height: '100%', 
                    backgroundColor: '#22c55e',
                    borderRadius: '99px'
                  }}></div>
                </div>
              </div>
              <p className="card__subtitle" style={{ textAlign: 'right', fontSize: '12px' }}>Target: $5,500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Receivables/Payables & Activity */}
      <div className="dashboard__bottom-grid">
        {/* Receivables vs Payables */}
        <div className="card">
          <div className="card__header">
            <h3 className="card__title">Finance Overview</h3>
            <button className="btn btn--text btn--sm">View Report</button>
          </div>
          <div className="card__body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Receivables */}
              <div className="finance-group">
                <div className="finance-group__header">
                  <div className="finance-group__info">
                    <span className="finance-group__label">Receivables</span>
                    <span className="finance-group__value">${formattedValue(receivablesTotal)}</span>
                  </div>
                  <span className="finance-group__trend finance-group__trend--positive">+8.5%</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f2f4', borderRadius: '99px' }}>
                  <div style={{ width: '65%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '99px' }}></div>
                </div>
              </div>
              
              {/* Payables */}
              <div className="finance-group">
                <div className="finance-group__header">
                  <div className="finance-group__info">
                    <span className="finance-group__label">Payables</span>
                    <span className="finance-group__value">${formattedValue(payablesTotal)}</span>
                  </div>
                  <span className="finance-group__trend finance-group__trend--neutral">Normal</span>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#f0f2f4', borderRadius: '99px' }}>
                  <div style={{ width: '40%', height: '100%', backgroundColor: '#fb923c', borderRadius: '99px' }}></div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '32px' }}>
                <div>
                  <p className="card__subtitle" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Net Cashflow</p>
                  <p className="card__title" style={{ fontSize: '18px' }}>
                    {formattedValue(receivablesTotal - payablesTotal)}
                  </p>
                </div>
                <div>
                  <p className="card__subtitle" style={{ textTransform: 'uppercase', fontSize: '12px', letterSpacing: '0.05em' }}>Overdue Invoices</p>
                  <p className="card__title" style={{ fontSize: '18px', color: '#dc2626' }}>{overdueInvoices}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity / Alerts */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card__header" style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f8fafc' }}>
            <h3 className="card__title">Recent Alerts & Activity</h3>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span className="card__subtitle" style={{ margin: 0 }}>Live</span>
            </div>
          </div>
          <div className="activity-list">
            
            {(alerts || []).map(alert => (
              <div key={alert.id} className="activity-item">
                <div className="activity-item__icon activity-item__icon--error">
                  <AlertCircle size={18} />
                </div>
                <div className="activity-item__content">
                  <div className="activity-item__header">
                    <span className="activity-item__title">{alert.title}</span>
                    <span className="activity-item__time">Now</span>
                  </div>
                  <p className="activity-item__desc">{alert.message}</p>
                </div>
              </div>
            ))}

            {(activities || []).map(activity => (
               <div key={activity.id} className="activity-item">
               <div className="activity-item__icon activity-item__icon--info">
                 <Info size={18} />
               </div>
               <div className="activity-item__content">
                 <div className="activity-item__header">
                   <span className="activity-item__title">{activity.description}</span>
                   <span className="activity-item__time">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                 </div>
                 <p className="activity-item__desc">User: {activity.user}</p>
               </div>
             </div>
            ))}
            
            {(!alerts?.length && !activities?.length) && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                No recent activity.
              </div>
            )}

          </div>
          <div className="card__footer" style={{ justifyContent: 'center', backgroundColor: '#f8fafc', padding: '12px' }}>
            <button className="btn btn--text btn--sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px' }}>View All Notifications</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

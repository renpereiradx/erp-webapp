import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { receivablesService } from '@/services/receivablesService';

/**
 * Client Credit Profile & Risk Analysis
 * Página que muestra el perfil de crédito detallado de un cliente,
 * incluyendo análisis de riesgo, métricas clave y facturas pendientes.
 */
const ClientCreditProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Datos iniciales/fallback basados en el diseño de Stitch
  const [data, setData] = useState({
    client: {
      name: 'Acme Corp Logistics',
      id: clientId || '8821',
      status: 'Active Account',
      address: '1200 Logistics Blvd, Suite 400, San Diego, CA 92101, USA',
      contact: 'Sarah Jenkins (CFO)',
      phone: '+1 (619) 555-0123',
      rep: 'Michael Ross',
      taxId: 'US-99-882145'
    },
    risk: {
      score: 72,
      level: 'Medium Risk',
      recommendation: 'Monitor closely. Request partial payment before releasing next shipment due to late payments in Q3.'
    },
    metrics: {
      outstanding: '$124,500',
      limit: '$150,000',
      avgDays: '45 Days',
      lastPayment: '$15,200',
      utilization: 83
    },
    aging: [
      { label: 'Current', amount: '$68k', width: '55%', colorClass: 'aging-report-bar__segment--current', title: 'Current: $68,475' },
      { label: '1-30 Days', amount: '$31k', width: '25%', colorClass: 'aging-report-bar__segment--1-30', title: '1-30 Days: $31,125' },
      { label: '31-60 Days', amount: '$14k', width: '12%', colorClass: 'aging-report-bar__segment--31-60', title: '31-60 Days: $14,940' },
      { label: '>90 Days', amount: '$10k', width: '8%', colorClass: 'aging-report-bar__segment--90', title: '>90 Days: $10,000' }
    ],
    invoices: [
      { id: 'INV-2023-001', date: 'Oct 12, 2023', due: 'Nov 12, 2023', amount: '$10,000.00', balance: '$10,000.00', status: 'Overdue >90' },
      { id: 'INV-2023-045', date: 'Dec 01, 2023', due: 'Jan 01, 2024', amount: '$14,940.00', balance: '$14,940.00', status: 'Overdue 30-60' },
      { id: 'INV-2024-002', date: 'Jan 15, 2024', due: 'Feb 15, 2024', amount: '$45,000.00', balance: '$31,125.00', status: 'Overdue 1-30' },
      { id: 'INV-2024-012', date: 'Feb 10, 2024', due: 'Mar 10, 2024', amount: '$68,475.00', balance: '$68,475.00', status: 'Current' }
    ]
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await receivablesService.getClientProfile(clientId);
        if (response.success && response.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error('Error fetching client profile:', err);
        setError('No se pudo cargar el perfil del cliente.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [clientId]);

  if (loading) {
    return (
      <div className="client-profile flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-secondary font-medium">Cargando perfil de crédito...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="client-profile p-8">
        <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center">
          <span className="material-symbols-outlined text-danger text-4xl mb-2">error</span>
          <h3 className="text-lg font-bold text-red-800">{error}</h3>
          <button 
            className="fluent-btn fluent-btn--outline mt-4"
            onClick={() => window.location.reload()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="client-profile">
      {/* Header & Breadcrumbs */}
      <header className="client-profile__header">
        <nav className="client-profile__breadcrumb">
          <a href="#" className="client-profile__breadcrumb-link" onClick={() => navigate('/receivables')}>Home</a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <a href="#" className="client-profile__breadcrumb-link">Clients</a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">{data.client.name}</span>
        </nav>
        
        <div className="client-profile__title-row">
          <div className="client-profile__name-group">
            <h1 className="client-profile__title">{data.client.name}</h1>
            <div className="client-profile__subtitle">
              <span>Client ID: #{data.client.id}</span>
              <span className="size-1 bg-gray-300 rounded-full"></span>
              <span className="status-pill status-pill--success">Active Account</span>
            </div>
          </div>
          <div className="client-profile__actions">
            <button className="fluent-btn fluent-btn--outline">
              <span className="material-symbols-outlined">edit_note</span>
              <span>Add Note</span>
            </button>
            <button className="fluent-btn fluent-btn--outline text-danger">
              <span className="material-symbols-outlined">block</span>
              <span>Suspend Credit</span>
            </button>
            <button className="fluent-btn fluent-btn--primary">
              <span className="material-symbols-outlined">download</span>
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content Grid */}
      <div className="client-profile__main-grid">
        {/* Left Column: Risk & Info */}
        <aside className="client-profile__left-col">
          {/* Risk Profile Card */}
          <section className="rec-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="rec-card__title mb-0">Risk Profile</h2>
              <button className="text-primary text-sm font-medium hover:underline">Full Analysis</button>
            </div>
            
            <div className="risk-gauge">
              <div className="risk-gauge__container">
                <svg className="risk-gauge__svg" viewBox="0 0 36 36">
                  <path className="risk-gauge__bg-circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                  <path className="risk-gauge__value-circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${data.risk.score}, 100`} strokeLinecap="round" strokeWidth="3"></path>
                </svg>
                <div className="risk-gauge__score">
                  <span className="risk-gauge__score-value">{data.risk.score}</span>
                  <span className="risk-gauge__score-label">SCORE</span>
                </div>
              </div>
              
              <div className="risk-gauge__badge">
                <span className="risk-gauge__badge-dot"></span>
                {data.risk.level}
              </div>

              <div className="risk-gauge__recommendation">
                <div className="risk-gauge__recommendation-header">
                  <span className="material-symbols-outlined text-danger">warning</span>
                  <p className="risk-gauge__recommendation-title">Analyst Recommendation</p>
                </div>
                <p className="risk-gauge__recommendation-text">{data.risk.recommendation}</p>
              </div>
            </div>
          </section>

          {/* Client Information Card */}
          <section className="rec-card flex-1">
            <h2 className="rec-card__title">Client Information</h2>
            <div className="client-info-card__list">
              <div className="client-info-card__item">
                <div className="client-info-card__icon-box">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div className="client-info-card__content">
                  <p className="client-info-card__label">Billing Address</p>
                  <p className="client-info-card__value">{data.client.address}</p>
                </div>
              </div>
              
              <div className="client-info-card__item">
                <div className="client-info-card__icon-box">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div className="client-info-card__content">
                  <p className="client-info-card__label">Primary Contact</p>
                  <p className="client-info-card__value">{data.client.contact}</p>
                  <a href={`tel:${data.client.phone}`} className="client-info-card__link">{data.client.phone}</a>
                </div>
              </div>

              <div className="client-info-card__item">
                <div className="client-info-card__icon-box">
                  <span className="material-symbols-outlined">badge</span>
                </div>
                <div className="client-info-card__content">
                  <p className="client-info-card__label">Assigned Rep</p>
                  <p className="client-info-card__value">{data.client.rep}</p>
                </div>
              </div>

              <div className="client-info-card__tax-id">
                <p className="client-info-card__label">Tax ID</p>
                <div className="client-info-card__tax-id-box">
                  <span>{data.client.taxId}</span>
                  <span className="material-symbols-outlined text-gray-400 cursor-pointer">content_copy</span>
                </div>
              </div>
            </div>
          </section>
        </aside>

        {/* Right Column: Metrics & Data */}
        <main className="client-profile__right-col">
          {/* Key Metrics Grid */}
          <div className="receivables-dashboard__kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card__header">
                <p className="kpi-card__label uppercase tracking-wide">Total Outstanding</p>
              </div>
              <p className="kpi-card__value">{data.metrics.outstanding}</p>
              <div className="kpi-card__trend kpi-card__trend--down is-bad">
                <span className="material-symbols-outlined">trending_up</span>
                <span>+12% vs last month</span>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-card__header">
                <p className="kpi-card__label uppercase tracking-wide">Credit Limit</p>
              </div>
              <p className="kpi-card__value">{data.metrics.limit}</p>
              <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${data.metrics.utilization}%` }}></div>
              </div>
              <p className="text-xs text-secondary mt-1 text-right">{data.metrics.utilization}% Utilized</p>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-card__header">
                <p className="kpi-card__label uppercase tracking-wide">Avg Days to Pay</p>
              </div>
              <p className="kpi-card__value">{data.metrics.avgDays}</p>
              <div className="kpi-card__trend kpi-card__trend--down is-bad">
                <span className="material-symbols-outlined">warning</span>
                <span>Industry Avg: 30</span>
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-card__header">
                <p className="kpi-card__label uppercase tracking-wide">Last Payment</p>
              </div>
              <p className="kpi-card__value">{data.metrics.lastPayment}</p>
              <p className="text-xs text-secondary mt-2">Received: 2 days ago</p>
            </div>
          </div>

          {/* Aging Analysis Card */}
          <section className="rec-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h2 className="rec-card__title mb-0">Aging Analysis</h2>
              <div className="flex items-center gap-4 text-sm text-secondary">
                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success"></span>Current</div>
                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-yellow-400"></span>1-30 Days</div>
                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-orange-500"></span>31-60 Days</div>
                <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-danger"></span>&gt;90 Days</div>
              </div>
            </div>
            
            <div className="aging-report-bar">
              <div className="aging-report-bar__container">
                {data.aging.map((seg, i) => (
                  <div 
                    key={i} 
                    className={`aging-report-bar__segment ${seg.colorClass}`} 
                    style={{ width: seg.width }}
                    title={seg.title}
                  >
                    {seg.amount}
                  </div>
                ))}
              </div>
              <div className="aging-report-bar__footer">
                <span>Total AR: {data.metrics.outstanding}</span>
                <span>Max Alert: &gt;90 Days</span>
              </div>
            </div>
          </section>

          {/* Outstanding Invoices Table */}
          <section className="rec-card p-0 overflow-hidden flex-1 flex flex-col">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="rec-card__title mb-0">Outstanding Invoices</h2>
              <div className="flex gap-4">
                <button className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined">filter_list</span> Filter
                </button>
                <button className="text-sm font-medium text-secondary hover:text-primary transition-colors flex items-center gap-1">
                  <span className="material-symbols-outlined">sort</span> Sort
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="rec-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Balance</th>
                    <th className="text-right">Status</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.invoices.map((inv, idx) => (
                    <tr key={idx} className="group">
                      <td className="font-bold text-primary">{inv.id}</td>
                      <td>{inv.date}</td>
                      <td>{inv.due}</td>
                      <td className="font-mono">{inv.amount}</td>
                      <td className="font-mono font-bold">{inv.balance}</td>
                      <td className="text-right">
                        <span className={`status-pill ${
                          inv.status === 'Current' ? 'status-pill--success' : 
                          inv.status.includes('>90') ? 'status-pill--danger' : 
                          'status-pill--warning'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-primary transition-opacity">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-border bg-gray-50/50 flex items-center justify-between">
              <p className="text-xs text-secondary">Showing 4 of 12 invoices</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-medium rounded bg-white border border-border text-secondary hover:text-primary transition-colors">Previous</button>
                <button className="px-3 py-1 text-xs font-medium rounded bg-white border border-border text-secondary hover:text-primary transition-colors">Next</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ClientCreditProfile;
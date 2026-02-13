import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivablesDashboard } from '@/features/receivables/hooks/useReceivablesDashboard';

// Sub-componentes
import SummaryCardsGrid from '@/features/receivables/components/SummaryCardsGrid';
import AgingSummaryChart from '@/features/receivables/components/AgingSummaryChart';
import ForecastChart from '@/features/receivables/components/ForecastChart';
import RecentInvoicesTable from '@/features/receivables/components/RecentInvoicesTable';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

/**
 * Accounts Receivable Overview Dashboard
 * Vista centralizada con KPIs ejecutivos, tendencias y resumen visual de aging.
 */
const ReceivablesDashboard = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { 
    summary, 
    aging, 
    forecast, 
    debtors, 
    loading, 
    error,
    refresh 
  } = useReceivablesDashboard();

  if (loading) {
    return (
      <div className="client-profile__loading">
        <div className="client-profile__spinner"></div>
        <p className="text-secondary">{t('receivables.loading.generic')}</p>
      </div>
    );
  }

  return (
    <div className="receivables-dashboard">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* Header */}
        <header className="receivables-dashboard__header">
          <div className="receivables-dashboard__title-group">
            <h1 className="receivables-dashboard__title">{t('receivables.master.title')} Overview</h1>
            <p className="receivables-dashboard__subtitle">Finanzas y Contabilidad</p>
          </div>
          
          <nav className="receivables-dashboard__nav">
            <a href="#" className="receivables-dashboard__nav-link receivables-dashboard__nav-link--active">Dashboard</a>
            <a href="#" className="receivables-dashboard__nav-link" onClick={() => navigate('/receivables/list')}>Facturas</a>
            <a href="#" className="receivables-dashboard__nav-link" onClick={() => navigate('/clientes')}>Clientes</a>
            <a href="#" className="receivables-dashboard__nav-link" onClick={() => navigate('/receivables/aging-report')}>Reportes</a>
          </nav>

          <div className="receivables-dashboard__actions">
            <Button variant="primary">
              <span className="material-symbols-outlined">add_chart</span>
              <span>{t('receivables.profile.actions.export')}</span>
            </Button>
            <Button variant="ghost" size="icon">
              <span className="material-symbols-outlined">notifications</span>
            </Button>
            <Button variant="ghost" size="icon">
              <span className="material-symbols-outlined">settings</span>
            </Button>
          </div>
        </header>

        {/* Barra de Filtros */}
        <div className="receivables-dashboard__filter-bar">
          <div className="receivables-dashboard__filters">
            <button className="receivables-dashboard__filter-btn">
                <span className="material-symbols-outlined">calendar_today</span>
                <span>Periodo: Últimos 30 Días</span>
                <span className="material-symbols-outlined">expand_more</span>
            </button>
            <button className="receivables-dashboard__filter-btn">
                <span className="material-symbols-outlined">domain</span>
                <span>Entidad: Todas las Regiones</span>
                <span className="material-symbols-outlined">expand_more</span>
            </button>
            <button className="receivables-dashboard__filter-btn">
                <span className="material-symbols-outlined">payments</span>
                <span>Moneda: PYG</span>
                <span className="material-symbols-outlined">expand_more</span>
            </button>
          </div>
          <div className="receivables-dashboard__meta">
            <span className="material-symbols-outlined">sync</span>
            <p>Generado el: {new Date().toLocaleString('es-ES')}</p>
          </div>
        </div>

        <DashboardNav />

        {/* KPIs */}
        <SummaryCardsGrid summary={summary} />

        {/* Gráficos */}
        <div className="receivables-dashboard__charts-grid">
          <ForecastChart forecastData={forecast} />
          <AgingSummaryChart agingData={aging} />
        </div>

        {/* Facturas Recientes */}
        <section className="recent-invoices">
            <header className="recent-invoices__header">
                <h3 className="recent-invoices__title">Facturas Recientes</h3>
                <a href="#" className="recent-invoices__link" onClick={() => navigate('/receivables/list')}>Ver Todas</a>
            </header>
            <RecentInvoicesTable debtorsData={debtors} />
        </section>
      </div>
    </div>
  );
};

export default ReceivablesDashboard;

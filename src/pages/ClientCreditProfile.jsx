import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Hooks y Datos
import { useClientCreditProfile } from '@/features/receivables/hooks/useClientCreditProfile';
import { clientProfileMock } from '@/features/receivables/data/mockData';

// Sub-componentes modulares
import RiskGauge from '@/features/receivables/components/RiskGauge';
import ClientInfoList from '@/features/receivables/components/ClientInfoList';
import KPIStatsGrid from '@/features/receivables/components/KPIStatsGrid';
import AgingBar from '@/features/receivables/components/AgingBar';
import InvoicesTable from '@/features/receivables/components/InvoicesTable';

/**
 * Client Credit Profile & Risk Analysis
 * Página principal que orquesta los componentes modulares del perfil de crédito.
 */
const ClientCreditProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  // Usamos el hook personalizado para la lógica de datos
  const { data: remoteData, loading, error } = useClientCreditProfile(clientId);
  
  // Usamos mock data si no hay datos remotos (para propósitos de diseño/demo)
  const data = remoteData || clientProfileMock;

  if (loading && !remoteData) {
    return (
      <div className="client-profile__loading">
        <div className="client-profile__spinner"></div>
        <p className="text-secondary">{t('receivables.loading.profile')}</p>
      </div>
    );
  }

  if (error && !remoteData) {
    return (
      <div className="client-profile__error">
        <span className="material-symbols-outlined text-danger" style={{ fontSize: '48px' }}>error</span>
        <h3 className="text-danger">{t('receivables.error.loading')}</h3>
        <Button 
          variant="secondary"
          onClick={() => window.location.reload()}
        >
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="client-profile">
      {/* Header & Breadcrumbs */}
      <header className="client-profile__header">
        <nav className="client-profile__breadcrumb">
          <a href="#" className="client-profile__breadcrumb-link" onClick={() => navigate('/receivables')}>
            {t('receivables.breadcrumb.home')}
          </a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <a href="#" className="client-profile__breadcrumb-link">
            {t('receivables.breadcrumb.clients')}
          </a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">{data.client.name}</span>
        </nav>
        
        <div className="client-profile__title-row">
          <div className="client-profile__name-group">
            <h1 className="client-profile__title">{data.client.name}</h1>
            <div className="client-profile__subtitle">
              <span>{t('receivables.profile.client_id')}: #{data.client.id}</span>
              <span className="status-pill status-pill--success">
                {t('receivables.profile.status.active')}
              </span>
            </div>
          </div>
          <div className="client-profile__actions">
            <Button variant="outline">
              <span className="material-symbols-outlined">edit_note</span>
              <span>{t('receivables.profile.actions.add_note')}</span>
            </Button>
            <Button variant="outline" className="text-danger">
              <span className="material-symbols-outlined">block</span>
              <span>{t('receivables.profile.actions.suspend_credit')}</span>
            </Button>
            <Button variant="primary">
              <span className="material-symbols-outlined">download</span>
              <span>{t('receivables.profile.actions.export')}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content Grid */}
      <div className="client-profile__main-grid">
        {/* Left Column: Risk & Info */}
        <aside className="client-profile__left-col">
          <RiskGauge 
            score={data.risk.score} 
            level={data.risk.level} 
            recommendation={data.risk.recommendation} 
          />
          <ClientInfoList 
            address={data.client.address}
            contact={data.client.contact}
            phone={data.client.phone}
            rep={data.client.rep}
            taxId={data.client.taxId}
          />
        </aside>

        {/* Right Column: Metrics & Data */}
        <main className="client-profile__right-col">
          <KPIStatsGrid metrics={data.metrics} />
          
          <AgingBar 
            aging={data.aging} 
            totalAR={data.metrics.outstanding} 
          />

          <InvoicesTable 
            invoices={data.invoices} 
            outstandingAmount={data.metrics.outstanding} 
          />
        </main>
      </div>
    </div>
  );
};

export default ClientCreditProfile;

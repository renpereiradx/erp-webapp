import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { RefreshCw, AlertCircle, Download } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

// Hooks y Datos
import { useClientCreditProfile } from '@/features/receivables/hooks/useClientCreditProfile';

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
  
  const { data, loading, error } = useClientCreditProfile(clientId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-text-secondary">{t('receivables.loading.profile')}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-100 rounded-full text-error mb-4">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-text-main">{t('receivables.error.loading')}</h2>
        <Button variant="primary" onClick={() => window.location.reload()}>
          {t('receivables.error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col gap-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate('/receivables')} className="cursor-pointer text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 hover:text-primary transition-colors">
                  {t('receivables.breadcrumb.home')}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-20" />
              <BreadcrumbItem>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">{t('receivables.breadcrumb.clients')}</span>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="opacity-20" />
              <BreadcrumbItem>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-main">{data.client.name}</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="size-16 rounded-xl bg-blue-50 flex items-center justify-center text-primary font-black text-2xl shadow-sm border border-blue-100">
                {data.client.name?.charAt(0)}
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">{data.client.name}</h1>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-text-secondary opacity-60 uppercase tracking-widest">{t('receivables.profile.client_id')}: #{data.client.id}</span>
                  <Badge className="bg-success text-white px-3 py-0.5 text-[10px] font-black uppercase tracking-widest">
                    {t('receivables.profile.status.active')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="md" className="shadow-sm border border-border-subtle bg-white dark:bg-slate-800 text-text-main font-semibold text-sm hover:bg-slate-100 transition-colors">
                <span className="material-symbols-outlined text-[18px] mr-2">edit_note</span>
                <span>{t('receivables.profile.actions.add_note')}</span>
              </Button>
              <Button variant="secondary" size="md" className="shadow-sm border border-border-subtle bg-white dark:bg-slate-800 text-error hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold text-sm transition-colors">
                <span className="material-symbols-outlined text-[18px] mr-2">block</span>
                <span>{t('receivables.profile.actions.suspend_credit')}</span>
              </Button>
              <Button variant="primary" size="md" className="shadow-sm font-semibold text-sm">
                <Download size={18} className="mr-2" />
                <span>{t('receivables.profile.actions.export')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 pb-10">
          {/* Left Column: Risk & Info */}
          <aside className="xl:col-span-4 space-y-6">
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
          <main className="xl:col-span-8 flex flex-col gap-6">
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
    </div>
  );
};

export default ClientCreditProfile;

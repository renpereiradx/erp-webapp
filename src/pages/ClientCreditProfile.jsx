import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { RefreshCw, AlertCircle, Download, ChevronRight, Home, Edit3, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import ToastContainer from '@/components/ui/ToastContainer';

// Hooks y Datos
import { useClientCreditProfile } from '@/features/receivables/hooks/useClientCreditProfile';

// Sub-componentes modulares (Refactorizados para fidelidad Stitch)
import RiskGauge from '@/features/receivables/components/RiskGauge';
import ClientInfoList from '@/features/receivables/components/ClientInfoList';
import KPIStatsGrid from '@/features/receivables/components/KPIStatsGrid';
import AgingBar from '@/features/receivables/components/AgingBar';
import InvoicesTable from '@/features/receivables/components/InvoicesTable';

/**
 * Perfil de Crédito del Cliente y Análisis de Riesgo
 * Página principal refactorizada para fidelidad 100% con Stitch.
 */
const ClientCreditProfile = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const toast = useToast();
  
  const { data, loading, error } = useClientCreditProfile(clientId);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-lg font-medium text-text-secondary">Cargando perfil del cliente...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="p-4 bg-red-100 rounded-full text-error mb-4">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-text-main">Error al cargar el perfil</h2>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Breadcrumbs & Heading */}
      <div className="flex flex-col gap-4">
        <nav className="flex items-center gap-2 text-sm text-[#617589]">
          <a className="hover:text-primary transition-colors flex items-center gap-1" href="#" onClick={() => navigate('/dashboard')}>
            <Home size={14} /> Inicio
          </a>
          <ChevronRight size={14} className="text-slate-300" />
          <a className="hover:text-primary transition-colors" href="#" onClick={() => navigate('/clientes')}>Clientes</a>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-[#111418] dark:text-white font-medium">{data.client.name}</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#111418] dark:text-white tracking-tight uppercase">
              {data.client.name}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[#617589] font-medium text-sm">ID de Cliente: #{data.client.id}</span>
              <span className="size-1 bg-gray-300 rounded-full"></span>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-none px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                Cuenta Activa
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-lg text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70 h-10"
            >
              <Edit3 size={18} />
              {t('receivables.profile.action.add_note', 'Añadir Nota')}
            </Button>
            <Button 
              variant="outline" 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 rounded-lg text-sm font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-70 h-10"
            >
              <Ban size={18} />
              {t('receivables.profile.action.suspend_credit', 'Suspender Crédito')}
            </Button>
            <Button 
              disabled
              onClick={() => toast.info(t('common.not_implemented'))}
              className="flex items-center gap-2 px-4 py-2 bg-primary/50 text-white rounded-lg text-sm font-bold cursor-not-allowed opacity-70 h-10 shadow-none border-none"
            >
              <Download size={18} />
              {t('action.export_report', 'Exportar Reporte')}
            </Button>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Risk & Info (Reducida a 3/12) */}
        <div className="xl:col-span-3 flex flex-col gap-6">
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
        </div>

        {/* Right Column: Metrics & Data (Ampliada a 9/12) */}
        <div className="xl:col-span-9 flex flex-col gap-6">
          <KPIStatsGrid metrics={data.metrics} />
          
          <AgingBar 
            aging={data.aging} 
            totalAR={data.metrics.outstanding} 
          />

          <InvoicesTable 
            invoices={data.invoices} 
            outstandingAmount={data.metrics.outstanding} 
          />
        </div>
      </div>

      <ToastContainer toasts={toast.toasts} onRemoveToast={toast.removeToast} />
    </div>
  );
};

export default ClientCreditProfile;
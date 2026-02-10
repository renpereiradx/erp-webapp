import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// Hooks
import { useReceivablesMasterList } from '@/features/receivables/hooks/useReceivablesMasterList';

// Sub-componentes
import MasterListFilters from '@/features/receivables/components/MasterListFilters';
import MasterListTable from '@/features/receivables/components/MasterListTable';

/**
 * Receivables Master List & Filters
 * Gestión masiva de cuentas por cobrar con filtros avanzados.
 */
const ReceivablesMasterList = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { 
    invoices, 
    loading, 
    filters, 
    handleFilterChange, 
    resetFilters,
    refresh 
  } = useReceivablesMasterList();

  return (
    <div className="receivables-master">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        
        {/* Breadcrumbs */}
        <nav className="client-profile__breadcrumb">
          <a href="#" className="client-profile__breadcrumb-link" onClick={() => navigate('/dashboard')}>
            {t('receivables.breadcrumb.home')}
          </a>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">Finanzas</span>
          <span className="material-symbols-outlined client-profile__breadcrumb-separator">chevron_right</span>
          <span className="client-profile__breadcrumb-current">{t('receivables.master.title')}</span>
        </nav>

        {/* Header */}
        <div className="receivables-master__header">
          <div>
            <h1 className="receivables-master__title">{t('receivables.master.title')}</h1>
            <p className="receivables-master__subtitle">{t('receivables.master.subtitle')}</p>
          </div>
          <div className="receivables-master__actions">
            <Button variant="outline">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>ios_share</span>
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button variant="primary">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              <span>{t('receivables.master.action.new')}</span>
            </Button>
          </div>
        </div>

        {/* Panel de Filtros */}
        <MasterListFilters 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={resetFilters} 
        />

        {/* Grid de Datos */}
        <MasterListTable 
          invoices={invoices} 
          loading={loading} 
          onRefresh={refresh}
        />
      </div>
    </div>
  );
};

export default ReceivablesMasterList;
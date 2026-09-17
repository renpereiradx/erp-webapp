import { useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

// Feature components
import SupplierHeader from '@/features/accounts-payable/components/SupplierAnalysis/SupplierHeader';
import DebtKpis from '@/features/accounts-payable/components/SupplierAnalysis/DebtKpis';
import AnalysisCards from '@/features/accounts-payable/components/SupplierAnalysis/AnalysisCards';
import ActiveObligationsTable from '@/features/accounts-payable/components/SupplierAnalysis/ActiveObligationsTable';

// Hooks
import { useSupplierAnalysis } from '@/features/accounts-payable/hooks/useSupplierAnalysis';

/**
 * Supplier Analysis and Debt Page.
 * 100% STITCH FIDELITY - RESPONSIVE OPTIMIZED
 * Auditoría BI 2A: la página estaba EN BLANCO con API 200 (destructuring
 * drift). Remapeada al contrato real; el gráfico de tendencia se eliminó
 * (no hay endpoint histórico). Estados error/empty honestos.
 */
const SupplierAnalysis = () => {
  const { t } = useI18n();
  const { id } = useParams();
  const { loading, supplier, tableStats, error } = useSupplierAnalysis(id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-on-surface-deep uppercase tracking-widest animate-pulse">{t('bi.supplier.loading', 'Cargando Análisis Inteligente...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-sm font-bold text-foreground">{t('bi.supplier.loadError', 'No se pudo cargar el análisis del proveedor.')}</p>
        <p className="text-[10px] text-on-surface-deep uppercase tracking-widest">{t('bi.common.checkConnection', 'Verifique la conexión e intente nuevamente')}</p>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-2">
        <p className="text-sm font-bold text-foreground">{t('bi.supplier.notFound', 'Proveedor no encontrado.')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      <SupplierHeader supplier={supplier} />
      <DebtKpis stats={supplier.stats} />
      <AnalysisCards rating={supplier.rating} terms={supplier.terms} />
      <ActiveObligationsTable invoices={supplier.invoices} summary={tableStats} />
    </div>
  );
};

export default SupplierAnalysis;

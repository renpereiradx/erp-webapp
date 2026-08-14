/**
 * Página contenedora "Movimientos de Stock".
 * Reemplaza a InventoryAdjustmentManual + InventoryManagement + InventoryAdjustments.
 *
 * Tres pestañas:
 *  - Registrar: formulario (POST /stock-transactions/) + historial en vivo del producto.
 *  - Historial: consulta por producto o por rango de fecha.
 *  - Resumen:   movement-summary + validate-consistency + discrepancy-report.
 *
 * Todo el estado de datos vive en useStockMovementsStore; aquí sólo estado de UI (pestaña activa).
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, History, PlusCircle, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import { MovementForm } from './MovementForm';
import { MovementsHistoryTable } from './MovementsHistoryTable';
import { MovementSummaryPanel } from './MovementSummaryPanel';

type Tab = 'register' | 'history' | 'summary';

export function StockMovementsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('register');
  const fetchTransactionTypes = useStockMovementsStore((s) => s.fetchTransactionTypes);

  // Carga los tipos de transacción una sola vez (para traducir la columna "tipo").
  useEffect(() => {
    void fetchTransactionTypes();
  }, [fetchTransactionTypes]);

  const tabs: { id: Tab; icon: typeof PlusCircle; key: string }[] = [
    { id: 'register', icon: PlusCircle, key: 'stockMovements.tabs.register' },
    { id: 'history', icon: History, key: 'stockMovements.tabs.history' },
    { id: 'summary', icon: BarChart3, key: 'stockMovements.tabs.summary' },
  ];

  return (
    <div className='p-4 md:p-6 max-w-[1280px] mx-auto w-full animate-in fade-in duration-200'>
      {/* Header */}
      <header className='flex items-center gap-4 mb-6'>
        <button
          className='p-2 text-text-secondary hover:bg-slate-100 rounded-lg transition-colors'
          onClick={() => navigate('/ajustes-producto')}
          title={t('common.back', 'Volver')}
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className='flex flex-col gap-1 border-l-4 border-primary pl-4'>
          <h1 className='text-2xl font-black text-text-main tracking-tighter uppercase flex items-center gap-2'>
            <ClipboardList size={24} />
            {t('stockMovements.title', 'Movimientos de Stock')}
          </h1>
          <p className='text-text-secondary text-xs font-medium uppercase tracking-widest'>
            {t('stockMovements.subtitle', 'Trazabilidad · /stock-transactions/')}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className='flex gap-1 p-1 bg-white rounded-xl shadow-fluent-2 border border-border-subtle mb-6 w-fit'>
        {tabs.map(({ id, icon: Icon, key }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 h-10 text-xs font-black uppercase rounded-lg transition-all ${
              tab === id ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-slate-50'
            }`}
          >
            <Icon size={16} />
            {t(key)}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'register' && (
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
          <div className='lg:col-span-5'>
            <MovementForm />
          </div>
          <div className='lg:col-span-7'>
            <MovementsHistoryTable />
          </div>
        </div>
      )}
      {tab === 'history' && <MovementsHistoryTable />}
      {tab === 'summary' && <MovementSummaryPanel />}
    </div>
  );
}

export default StockMovementsPage;

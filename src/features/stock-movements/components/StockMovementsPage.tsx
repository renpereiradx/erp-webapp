/**
 * Página contenedora "Movimientos de Stock".
 * Reemplaza a InventoryAdjustmentManual + InventoryManagement + InventoryAdjustments
 * y a la vieja página /ajustes-producto (eliminada).
 *
 * Tres pestañas:
 *  - Registrar: panel de registro por lotes (POST /stock-transactions/ 1..N filas).
 *  - Historial: consulta por producto o por rango de fecha.
 *  - Resumen:   movement-summary + validate-consistency + discrepancy-report.
 *
 * Todo el estado de datos vive en useStockMovementsStore; aquí sólo estado de UI (pestaña activa).
 */

import { useEffect, useState } from 'react';
import { History, PlusCircle, BarChart3 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import { MovementForm } from './MovementForm';
import { MovementsHistoryTable } from './MovementsHistoryTable';
import { MovementSummaryPanel } from './MovementSummaryPanel';

type Tab = 'register' | 'history' | 'summary';

export function StockMovementsPage() {
  const { t } = useI18n();
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
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* Header */}
        <header className="flex flex-col gap-1 border-l-4 border-primary pl-4 mb-lg">
          <h1 className="text-headline-lg font-headline-lg font-black text-foreground tracking-tight uppercase leading-none">
            {t('stockMovements.title', 'Movimientos de Stock')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t('stockMovements.subtitle', 'Trazabilidad · /stock-transactions/')}
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface rounded-md shadow-whisper border border-border-subtle mb-lg w-fit">
          {tabs.map(({ id, icon: Icon, key }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 h-10 rounded-button text-body-sm-bold uppercase transition-all ${
                tab === id
                  ? 'bg-primary text-on-primary'
                  : 'text-muted-foreground hover:bg-surface-muted'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(key)}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'register' && (
          <div className="grid grid-cols-1 gap-lg">
            <div className="w-full max-w-3xl mx-auto">
              <MovementForm />
            </div>
          </div>
        )}
        {tab === 'history' && <MovementsHistoryTable />}
        {tab === 'summary' && <MovementSummaryPanel />}
      </div>
    </div>
  );
}

export default StockMovementsPage;

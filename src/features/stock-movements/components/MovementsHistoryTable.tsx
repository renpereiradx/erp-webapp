/**
 * Tabla de historial de movimientos del ledger (/stock-transactions/*).
 * Soporta dos vistas:
 *  - Por producto: GET /stock-transactions/product/{id}
 *  - Por rango de fecha: GET /stock-transactions/by-date
 */

import { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/utils/currencyUtils';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import type { StockTransactionHistory } from '../types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function MovementsHistoryTable() {
  const { t } = useI18n();
  const history = useStockMovementsStore((s) => s.history);
  const dateMovements = useStockMovementsStore((s) => s.dateMovements);
  const transactionTypes = useStockMovementsStore((s) => s.transactionTypes);
  const loading = useStockMovementsStore((s) => s.loading);
  const error = useStockMovementsStore((s) => s.error);
  const fetchHistory = useStockMovementsStore((s) => s.fetchHistory);
  const fetchByDate = useStockMovementsStore((s) => s.fetchByDate);

  const [view, setView] = useState<'product' | 'date'>('product');
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  const rows = view === 'product' ? history : dateMovements;

  const run = async () => {
    if (view === 'product') {
      if (!productId.trim()) return;
      await fetchHistory(productId.trim(), 50, 0);
    } else {
      await fetchByDate({ startDate, endDate });
    }
  };

  const typeLabel = (tt: string) =>
    transactionTypes?.[tt] || t(`stockMovements.types.${tt}`, tt);

  return (
    <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle overflow-hidden'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-black uppercase text-text-main tracking-widest flex items-center gap-2'>
          <History size={16} /> {t('stockMovements.history.title', 'Historial de Movimientos')}
        </h2>
      </div>

      {/* Controles */}
      <div className='flex flex-wrap items-end gap-3 mb-4'>
        <div className='flex gap-1 p-1 bg-slate-100 rounded-lg'>
          {(['product', 'date'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 h-8 text-[11px] font-black uppercase rounded-md transition-all ${
                view === v ? 'bg-white shadow-sm text-text-main' : 'text-text-secondary'
              }`}
            >
              {t(`stockMovements.history.view.${v}`)}
            </button>
          ))}
        </div>

        {view === 'product' ? (
          <input
            type='text'
            placeholder={t('stockMovements.history.productIdPlaceholder', 'ID de producto')}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run()}
            className='h-10 px-3 border border-border-subtle rounded-lg bg-white text-sm flex-1 min-w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent outline-none'
          />
        ) : (
          <>
            <input
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className='h-10 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none'
            />
            <input
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className='h-10 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none'
            />
          </>
        )}

        <button
          onClick={run}
          disabled={loading}
          className='h-10 px-4 flex items-center gap-2 bg-primary text-white text-xs font-black uppercase rounded-lg hover:bg-primary-hover transition-all disabled:opacity-50'
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {t('stockMovements.history.refresh', 'Consultar')}
        </button>
      </div>

      {error && (
        <div className='bg-error/10 text-error p-3 rounded text-xs font-bold mb-3'>{error}</div>
      )}

      <div className='overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-left text-[10px] font-black uppercase text-slate-400 border-b border-border-subtle'>
              <th className='py-2 pr-3'>{t('stockMovements.history.col.date', 'Fecha')}</th>
              <th className='py-2 pr-3'>{t('stockMovements.history.col.type', 'Tipo')}</th>
              <th className='py-2 pr-3 text-right'>{t('stockMovements.history.col.delta', 'Δ')}</th>
              <th className='py-2 pr-3 text-right'>{t('stockMovements.history.col.balance', 'Saldo')}</th>
              <th className='py-2 pr-3'>{t('stockMovements.history.col.reason', 'Motivo')}</th>
              <th className='py-2'>{t('stockMovements.history.col.operator', 'Operador')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className='py-10 text-center text-text-secondary italic'>
                  {t('stockMovements.history.empty', 'Sin movimientos para mostrar.')}
                </td>
              </tr>
            ) : (
              rows.map((row: StockTransactionHistory) => (
                <tr key={row.id} className='border-b border-slate-50 hover:bg-slate-50/60'>
                  <td className='py-2 pr-3 text-xs text-text-secondary whitespace-nowrap'>
                    {new Date(row.created_at).toLocaleString('es-ES')}
                  </td>
                  <td className='py-2 pr-3'>
                    <span className='text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-100 text-text-main'>
                      {typeLabel(row.transaction_type)}
                    </span>
                  </td>
                  <td
                    className={`py-2 pr-3 text-right font-data-mono font-bold ${
                      row.quantity_change > 0 ? 'text-success' : 'text-error'
                    }`}
                  >
                    {row.quantity_change > 0 ? '+' : ''}
                    {formatNumber(row.quantity_change)}
                  </td>
                  <td className='py-2 pr-3 text-right font-data-mono'>
                    {row.balance_after !== undefined ? formatNumber(row.balance_after) : '—'}
                  </td>
                  <td className='py-2 pr-3 text-xs text-text-main max-w-[220px] truncate' title={row.reason ?? ''}>
                    {row.reason || '—'}
                  </td>
                  <td className='py-2 text-xs text-text-secondary'>
                    {(row.metadata as any)?.operator || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

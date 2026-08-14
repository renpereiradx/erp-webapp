/**
 * Panel de análisis del ledger:
 *  - GET /stock-transactions/movement-summary (resumen initial/final/net por producto)
 *  - GET /stock-transactions/validate-consistency (ledger vs snapshot)
 *  - GET /stock-transactions/discrepancy-report (discrepancias por rango)
 *
 * Estos tres endpoints fueron REPARADOS en el backend (H.4-ter). Si devuelven 500, escalar
 * al backend (no es un bug del FE).
 */

import { useState } from 'react';
import { BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber } from '@/utils/currencyUtils';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function MovementSummaryPanel() {
  const { t } = useI18n();
  const summary = useStockMovementsStore((s) => s.summary);
  const consistency = useStockMovementsStore((s) => s.consistency);
  const discrepancies = useStockMovementsStore((s) => s.discrepancies);
  const loading = useStockMovementsStore((s) => s.loading);
  const fetchSummary = useStockMovementsStore((s) => s.fetchSummary);
  const fetchConsistency = useStockMovementsStore((s) => s.fetchConsistency);
  const fetchDiscrepancies = useStockMovementsStore((s) => s.fetchDiscrepancies);

  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  const runSummary = () => fetchSummary(startDate, endDate);
  const runConsistency = () => fetchConsistency();
  const runDiscrepancies = () => fetchDiscrepancies(startDate, endDate);

  return (
    <div className='flex flex-col gap-6'>
      {/* Rango compartido */}
      <div className='bg-white p-4 rounded-xl shadow-fluent-2 border border-border-subtle flex flex-wrap items-end gap-3'>
        <div className='flex flex-col gap-1'>
          <label className='text-[10px] font-black uppercase text-slate-400'>
            {t('stockMovements.summary.from', 'Desde')}
          </label>
          <input
            type='date'
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className='h-10 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none'
          />
        </div>
        <div className='flex flex-col gap-1'>
          <label className='text-[10px] font-black uppercase text-slate-400'>
            {t('stockMovements.summary.to', 'Hasta')}
          </label>
          <input
            type='date'
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className='h-10 px-3 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none'
          />
        </div>
        <div className='flex gap-2'>
          <button
            onClick={runSummary}
            disabled={loading}
            className='h-10 px-3 bg-primary text-white text-xs font-black uppercase rounded-lg hover:bg-primary-hover disabled:opacity-50'
          >
            {t('stockMovements.summary.loadSummary', 'Resumen')}
          </button>
          <button
            onClick={runDiscrepancies}
            disabled={loading}
            className='h-10 px-3 border border-border-subtle text-xs font-black uppercase rounded-lg hover:bg-slate-50 disabled:opacity-50'
          >
            {t('stockMovements.summary.loadDiscrepancies', 'Discrepancias')}
          </button>
          <button
            onClick={runConsistency}
            disabled={loading}
            className='h-10 px-3 border border-border-subtle text-xs font-black uppercase rounded-lg hover:bg-slate-50 disabled:opacity-50'
          >
            {t('stockMovements.summary.loadConsistency', 'Consistencia')}
          </button>
        </div>
      </div>

      {/* Resumen de movimientos */}
      <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle'>
        <h3 className='text-sm font-black uppercase text-text-main tracking-widest mb-4 flex items-center gap-2'>
          <BarChart3 size={16} /> {t('stockMovements.summary.title', 'Resumen de Movimientos')}
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[10px] font-black uppercase text-slate-400 border-b border-border-subtle'>
                <th className='py-2 pr-3'>Producto</th>
                <th className='py-2 pr-3 text-right'>{t('stockMovements.summary.initial', 'Inicial')}</th>
                <th className='py-2 pr-3 text-right'>{t('stockMovements.summary.in', 'Entradas')}</th>
                <th className='py-2 pr-3 text-right'>{t('stockMovements.summary.out', 'Salidas')}</th>
                <th className='py-2 pr-3 text-right'>{t('stockMovements.summary.net', 'Neto')}</th>
                <th className='py-2 text-right'>{t('stockMovements.summary.final', 'Final')}</th>
              </tr>
            </thead>
            <tbody>
              {summary.length === 0 ? (
                <tr>
                  <td colSpan={6} className='py-8 text-center text-text-secondary italic'>
                    {t('stockMovements.summary.empty', 'Cargá el resumen para un rango.')}
                  </td>
                </tr>
              ) : (
                summary.map((s) => (
                  <tr key={s.product_id} className='border-b border-slate-50'>
                    <td className='py-2 pr-3 text-xs'>
                      <span className='font-mono text-primary font-bold'>{s.product_id}</span>
                      {s.product_name ? <span className='block text-text-secondary truncate'>{s.product_name}</span> : null}
                    </td>
                    <td className='py-2 pr-3 text-right font-mono'>{formatNumber(s.initial_stock)}</td>
                    <td className='py-2 pr-3 text-right font-mono text-success'>+{formatNumber(s.total_in)}</td>
                    <td className='py-2 pr-3 text-right font-mono text-error'>-{formatNumber(s.total_out)}</td>
                    <td
                      className={`py-2 pr-3 text-right font-mono font-bold ${
                        s.net_change >= 0 ? 'text-success' : 'text-error'
                      }`}
                    >
                      {s.net_change >= 0 ? '+' : ''}
                      {formatNumber(s.net_change)}
                    </td>
                    <td className='py-2 text-right font-mono font-bold'>{formatNumber(s.final_stock)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Consistencia ledger vs snapshot */}
      <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle'>
        <h3 className='text-sm font-black uppercase text-text-main tracking-widest mb-4 flex items-center gap-2'>
          <ShieldCheck size={16} /> {t('stockMovements.summary.consistency', 'Consistencia Ledger vs Snapshot')}
        </h3>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left text-[10px] font-black uppercase text-slate-400 border-b border-border-subtle'>
                <th className='py-2 pr-3'>Producto</th>
                <th className='py-2 pr-3 text-right'>Snapshot</th>
                <th className='py-2 pr-3 text-right'>Ledger</th>
                <th className='py-2 pr-3 text-right'>Δ</th>
                <th className='py-2'>Estado</th>
              </tr>
            </thead>
            <tbody>
              {consistency.length === 0 ? (
                <tr>
                  <td colSpan={5} className='py-8 text-center text-text-secondary italic'>
                    {t('stockMovements.summary.consistencyEmpty', 'Ejecutá "Consistencia".')}
                  </td>
                </tr>
              ) : (
                consistency.map((c) => (
                  <tr key={c.product_id} className='border-b border-slate-50'>
                    <td className='py-2 pr-3 text-xs font-mono text-primary font-bold'>{c.product_id}</td>
                    <td className='py-2 pr-3 text-right font-mono'>{formatNumber(c.snapshot_stock)}</td>
                    <td className='py-2 pr-3 text-right font-mono'>{formatNumber(c.ledger_stock)}</td>
                    <td className='py-2 pr-3 text-right font-mono'>{formatNumber(c.discrepancy)}</td>
                    <td className='py-2'>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          c.is_consistent
                            ? 'bg-success/10 text-success'
                            : 'bg-error/10 text-error'
                        }`}
                      >
                        {c.is_consistent
                          ? t('stockMovements.summary.consistent', 'Consistente')
                          : t('stockMovements.summary.inconsistent', 'Inconsistente')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discrepancias */}
      <div className='bg-white p-6 rounded-xl shadow-fluent-2 border border-border-subtle'>
        <h3 className='text-sm font-black uppercase text-text-main tracking-widest mb-4 flex items-center gap-2'>
          <AlertTriangle size={16} /> {t('stockMovements.summary.discrepancies', 'Discrepancias')}
        </h3>
        {discrepancies.length === 0 ? (
          <p className='py-8 text-center text-text-secondary italic'>
            {t('stockMovements.summary.discrepanciesEmpty', 'Sin discrepancias para el rango.')}
          </p>
        ) : (
          <ul className='text-sm space-y-1'>
            {discrepancies.map((d, i) => (
              <li key={`${d.product_id ?? i}-${i}`} className='py-1 border-b border-slate-50'>
                <span className='font-mono text-primary font-bold text-xs'>{d.product_id}</span>
                {d.product_name ? <span className='text-text-secondary'> — {String(d.product_name)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

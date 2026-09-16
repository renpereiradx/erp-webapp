import React from 'react';

/**
 * KPI Grid for Supplier Debt. Valores 100% reales del dto de análisis
 * (auditoría BI 2A: fuera chips "+12%"/"-3d", barra 75% y textos de sector
 * fabricados).
 */
const DebtKpis = ({ stats }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in">
      {/* Total Pendiente */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Pendiente</p>
        <h3 className="text-xl md:text-3xl font-mono font-black text-foreground tabular-nums">Gs. {stats.totalPending.toLocaleString('es-PY')}</h3>
        <p className="mt-4 text-[10px] text-on-surface-deep">{stats.activeInvoices} factura{stats.activeInvoices === 1 ? '' : 's'} con saldo pendiente</p>
      </div>

      {/* Total Vencido */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Vencido</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-mono font-black text-[#dc3545] tabular-nums">Gs. {stats.totalOverdue.toLocaleString('es-PY')}</h3>
          {stats.totalOverdue > 0 && (
            <span className="material-icons-round text-error text-xl">warning</span>
          )}
        </div>
        <p className="mt-4 text-[10px] text-on-surface-deep">{stats.overdueCount} factura{stats.overdueCount === 1 ? '' : 's'} supera{stats.overdueCount === 1 ? '' : 'n'} la fecha límite</p>
      </div>

      {/* DPO */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">DPO (Días Pago)</p>
        <h3 className="text-xl md:text-3xl font-mono font-black text-foreground tabular-nums">
          {stats.avgPaymentDays != null && stats.avgPaymentDays > 0 ? `${Math.round(stats.avgPaymentDays)} Días` : '—'}
        </h3>
        <p className="mt-4 text-[10px] text-on-surface-deep">Promedio histórico de pago al proveedor</p>
      </div>

      {/* Share % */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Share of Payables %</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-xl md:text-3xl font-mono font-black text-foreground tabular-nums">{stats.shareOfPayables}%</h3>
          <span className="material-icons-round text-slate-300 text-xl">pie_chart</span>
        </div>
        <p className="mt-4 text-[10px] text-on-surface-deep">Peso del proveedor en las cuentas por pagar</p>
      </div>
    </section>
  );
};

export default DebtKpis;

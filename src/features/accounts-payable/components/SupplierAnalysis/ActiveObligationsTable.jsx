import React from 'react';

/**
 * Main Data Grid: Active Obligations for a Supplier.
 * 100% STITCH FIDELITY - RESPONSIVE
 */
const ActiveObligationsTable = ({ invoices, summary }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Atrasado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 whitespace-nowrap">Atrasado</span>;
      case 'En Proceso':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 whitespace-nowrap">En Proceso</span>;
      case 'Parcialmente Pagado':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap">Parcial</span>;
      case 'Borrador':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 whitespace-nowrap">Borrador</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-800 dark:text-slate-700 dark:text-slate-300 whitespace-nowrap">{status}</span>;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in">
      <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-slate-50/50 dark:bg-slate-800/20 gap-4">
        <h4 className="text-base md:text-lg font-bold">Obligaciones Activas</h4>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 sm:border-none transition-colors">
            <span className="material-icons-round text-sm">filter_list</span> <span className="xs:inline">Filtrar</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 sm:border-none transition-colors">
            <span className="material-icons-round text-sm">download</span> <span className="xs:inline">Exportar</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 md:px-8 py-4">Factura</th>
              <th className="px-4 py-4">Emisión</th>
              <th className="px-4 py-4 text-right">Monto</th>
              <th className="px-4 py-4 text-right">Saldo</th>
              <th className="px-4 py-4">Vencimiento</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 md:px-8 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs md:text-sm">
            {invoices.map((invoice, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-4 md:px-8 py-4 font-medium text-[#137fec]">{invoice.id}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-400">{invoice.date}</td>
                <td className="px-4 py-4 text-right font-medium text-slate-700 dark:text-slate-300">Gs. {invoice.originalAmount.toLocaleString()}</td>
                <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-white">Gs. {invoice.pendingAmount.toLocaleString()}</td>
                <td className={`px-4 py-4 font-medium ${invoice.isOverdue ? 'text-[#dc3545]' : 'text-slate-600 dark:text-slate-400'}`}>
                  {invoice.dueDate}
                </td>
                <td className="px-4 py-4">
                  {getStatusBadge(invoice.status)}
                </td>
                <td className="px-4 md:px-8 py-4 text-center">
                  <button className="text-slate-400 hover:text-[#137fec] transition-colors"><span className="material-icons-round">more_horiz</span></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 md:px-8 py-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs md:text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800">
        <p>Mostrando {invoices.length} de {summary.total} facturas</p>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">Anterior</button>
          <button className="flex-1 sm:flex-none px-3 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">Siguiente</button>
        </div>
      </div>
    </section>
  );
};

export default ActiveObligationsTable;

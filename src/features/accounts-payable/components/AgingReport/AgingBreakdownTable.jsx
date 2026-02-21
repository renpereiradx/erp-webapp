import React from 'react';

/**
 * Main Data Grid: Analytical Breakdown per Provider.
 * 100% LITERAL STITCH REPRODUCTION
 */
const AgingBreakdownTable = ({ providers, totals, searchTerm, setSearchTerm }) => {
  const getRiskBadge = (risk) => {
    switch (risk) {
      case 'Mínimo':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#28a7451a] text-[#28a745] uppercase">Mínimo</span>;
      case 'Moderado':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffc1071a] text-[#ffc107] uppercase">Moderado</span>;
      case 'Crítico':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#dc35451a] text-[#dc3545] uppercase">Crítico</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">{risk}</span>;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
      <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span className="material-icons-round text-[#137fec]">list_alt</span>
          Desglose Analítico por Proveedor
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            <input 
              className="pl-10 pr-4 py-2 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-80 focus:ring-[#137fec] focus:border-[#137fec] outline-none" 
              placeholder="Buscar proveedor..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
            <button className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <span className="material-icons-round text-sm">view_list</span>
            </button>
            <button className="px-3 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="material-icons-round text-sm">grid_view</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1200px]">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
              <th className="px-8 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700">Proveedor</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">Corriente</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">31-60 Días</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">61-90 Días</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">+90 Días</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-right">Total Pendiente</th>
              <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 text-center">Riesgo</th>
              <th className="px-8 py-4 border-b border-slate-200 dark:border-slate-700 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {providers.map((p, idx) => {
              const isCritical = p.risk === 'Crítico';
              return (
                <tr 
                  key={idx} 
                  className={isCritical 
                    ? "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 transition-colors" 
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  }
                >
                  <td className={`px-8 py-5 sticky left-0 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 ${isCritical ? 'bg-[#fef2f2] dark:bg-[#1a1010]' : 'bg-white dark:bg-slate-900'}`}>
                    {p.name}
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-[#28a745]">${p.corriente.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`px-6 py-5 text-right font-medium ${p.v31_60 > 0 ? 'text-[#ffc107]' : ''}`}>${p.v31_60.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`px-6 py-5 text-right font-medium ${p.v61_90 > 0 ? 'text-[#fd7e14]' : ''}`}>${p.v61_90.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`px-6 py-5 text-right font-medium ${p.v91plus > 0 ? 'text-[#dc3545]' : ''}`}>${p.v91plus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className={`px-6 py-5 text-right font-bold ${isCritical ? 'text-[#dc3545]' : 'text-slate-900 dark:text-white'}`}>
                    ${p.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {getRiskBadge(p.risk)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-[#137fec] hover:bg-[#137fec0d] p-1 rounded transition-colors">
                      <span className="material-icons-round text-lg">more_horiz</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700">
            <tr>
              <td className="px-8 py-4 sticky left-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider">TOTALES</td>
              <td className="px-6 py-4 text-right text-sm">${totals.corriente.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4 text-right text-sm">${totals.v31_60.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4 text-right text-sm">${totals.v61_90.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4 text-right text-sm">${totals.v91plus.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4 text-right text-[#137fec] text-lg tracking-tight">${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="px-6 py-4"></td>
              <td className="px-8 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      
      <div className="px-8 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
        <p className="text-sm text-slate-500 font-medium">Mostrando {providers.length} de 142 proveedores</p>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 transition-opacity" disabled>
            <span className="material-icons-round text-sm">chevron_left</span>
          </button>
          <button className="px-3 py-1 bg-[#137fec] text-white rounded text-sm font-bold shadow-sm">1</button>
          <button className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-sm font-medium transition-colors">2</button>
          <button className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-sm font-medium transition-colors">3</button>
          <span className="px-2 text-slate-400 font-medium">...</span>
          <button className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-sm font-medium transition-colors">15</button>
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors">
            <span className="material-icons-round text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default AgingBreakdownTable;

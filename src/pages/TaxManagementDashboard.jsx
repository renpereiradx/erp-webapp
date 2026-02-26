import React from 'react';

/**
 * Tax Management Dashboard (Gestión de IVA y Resumen Fiscal)
 * 100% Faithful to Stitch Design
 */
const TaxManagementDashboard = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f7f8] dark:bg-[#101922] min-h-screen font-['Inter',sans-serif]">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Gestión de IVA y Resumen Fiscal</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="material-symbols-outlined text-sm text-slate-400">calendar_month</span>
            <p className="text-slate-500 text-sm">Periodo Fiscal: Octubre 2023 • Sistema E-KUATIA</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-all text-slate-700 dark:text-slate-200">
            <span className="material-symbols-outlined text-lg">file_download</span>
            Descargar Formulario 120
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all shadow-lg shadow-[#137fec]/20">
            <span className="material-symbols-outlined text-lg">publish</span>
            Presentar Declaración
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total IVA Débito</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gs. 15.250.000</h3>
          </div>
          <p className="text-emerald-500 text-xs font-semibold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span> +5.2% vs mes anterior
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total IVA Crédito</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gs. 12.100.000</h3>
          </div>
          <p className="text-rose-500 text-xs font-semibold mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_down</span> -2.1% vs mes anterior
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm ring-2 ring-[#137fec]/20">
          <p className="text-sm font-medium text-[#137fec]">Saldo IVA a Pagar</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gs. 3.150.000</h3>
          </div>
          <p className="text-slate-400 text-xs font-medium mt-2">Corresponde a liquidación mensual</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Crédito Acumulado</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gs. 0</h3>
          </div>
          <p className="text-slate-400 text-xs font-medium mt-2">Sin saldo a favor anterior</p>
        </div>
      </div>

      {/* Detailed Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* IVA Ventas Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#137fec]">outbox</span> IVA Ventas (Débito)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tasa</th>
                  <th className="px-6 py-4 font-semibold text-right">Base Imponible</th>
                  <th className="px-6 py-4 font-semibold text-right">IVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">IVA 10%</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 130.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 13.000.000</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">IVA 5%</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 45.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 2.250.000</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">Exento</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 12.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 0</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <td className="px-6 py-4 font-bold text-[#137fec]">TOTAL</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">Gs. 187.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-[#137fec] text-base">Gs. 15.250.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* IVA Compras Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">inbox</span> IVA Compras (Crédito)
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Tasa</th>
                  <th className="px-6 py-4 font-semibold text-right">Base Imponible</th>
                  <th className="px-6 py-4 font-semibold text-right">IVA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">IVA 10%</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 105.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 10.500.000</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">IVA 5%</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 32.000.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 1.600.000</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">Exento</td>
                  <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">Gs. 8.500.000</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">Gs. 0</td>
                </tr>
                <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                  <td className="px-6 py-4 font-bold text-emerald-600">TOTAL</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-700 dark:text-slate-300">Gs. 145.500.000</td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">Gs. 12.100.000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Trend Chart Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Tendencia Mensual: Débito vs Crédito</h4>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#137fec]"></span>
              <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">Débito</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-600"></span>
              <span className="text-xs text-slate-500 font-medium tracking-wide uppercase">Crédito</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
          {[
            { month: 'MAY', cr: '40%', db: '55%' },
            { month: 'JUN', cr: '45%', db: '60%' },
            { month: 'JUL', cr: '60%', db: '50%' },
            { month: 'AGO', cr: '35%', db: '40%' },
            { month: 'SEP', cr: '50%', db: '70%' },
            { month: 'OCT', cr: '65%', db: '85%', highlight: true },
          ].map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="w-full flex justify-center items-end gap-1 h-full relative">
                <div 
                  className={`w-1/3 bg-slate-200 dark:bg-slate-700 rounded-t-sm transition-all group-hover:bg-slate-300 dark:group-hover:bg-slate-600`} 
                  style={{ height: item.cr }}
                ></div>
                <div 
                  className={`w-1/3 ${item.highlight ? 'bg-[#137fec]' : 'bg-[#137fec]/40'} rounded-t-sm transition-all group-hover:bg-[#137fec]/60`} 
                  style={{ height: item.db }}
                ></div>
                {item.highlight && (
                  <div className="absolute -top-10 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10 border border-slate-700">
                    Oct: Gs. 15.25M
                  </div>
                )}
              </div>
              <span className={`text-[10px] ${item.highlight ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400 font-bold'}`}>
                {item.month}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaxManagementDashboard;

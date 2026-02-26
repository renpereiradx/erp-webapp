import React from 'react';

/**
 * Análisis de Rentabilidad y Márgenes
 * 100% Faithful to Stitch Design with rounded-xl corners
 */
const ProfitabilityAnalysis = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f6f7f8] dark:bg-[#101922] min-h-screen font-['Inter',sans-serif]">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4 mb-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <span className="hover:text-[#137fec] cursor-pointer transition-colors">Reportes</span>
          <span className="material-symbols-outlined !text-xs text-slate-400">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">Análisis de Rentabilidad</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Análisis de Rentabilidad y Márgenes</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Visualización detallada de márgenes por categoría y rendimiento de productos basado en BI.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
              <span className="material-symbols-outlined !text-lg">calendar_today</span>
              <span>Último Trimestre</span>
            </button>
            <button className="flex items-center gap-2 px-4 h-10 bg-[#137fec] text-white rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-[#137fec]/20">
              <span className="material-symbols-outlined !text-lg">picture_as_pdf</span>
              <span>Exportar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Revenue Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$450,000</p>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined !text-xs">arrow_upward</span>12%
            </span>
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Gross Profit</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">$125,000</p>
            <span className="text-rose-500 text-xs font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined !text-xs">arrow_downward</span>2%
            </span>
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-60" style={{ width: '45%' }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Margen Promedio</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">27.8%</p>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined !text-xs">arrow_upward</span>0.5%
            </span>
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-40" style={{ width: '28%' }}></div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Crecimiento Op.</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">+4.2%</p>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-0.5">
              <span className="material-symbols-outlined !text-xs">arrow_upward</span>1%
            </span>
          </div>
          <div className="mt-4 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-[#137fec] h-full rounded-full opacity-20" style={{ width: '15%' }}></div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tendencia de Márgenes vs Revenue</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">Comparativo histórico por mes (USD vs %)</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-[#137fec]"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Margen %</span>
            </div>
          </div>
        </div>
        <div className="h-72 w-full flex items-end justify-between gap-4 px-2 md:px-4">
          {[
            { label: 'ENE', rev: '60%', mar: '40%' },
            { label: 'FEB', rev: '70%', mar: '50%' },
            { label: 'MAR', rev: '65%', mar: '45%' },
            { label: 'ABR', rev: '85%', mar: '60%' },
            { label: 'MAY', rev: '80%', mar: '55%' },
            { label: 'JUN', rev: '95%', mar: '70%' },
          ].map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-3 group h-full">
              <div className="w-full flex items-end justify-center gap-1.5 h-full relative">
                <div className="w-1/3 bg-slate-100 dark:bg-slate-800 rounded-t-lg transition-all group-hover:bg-slate-200 dark:group-hover:bg-slate-700" style={{ height: d.mar }}></div>
                <div className="w-1/3 bg-[#137fec] rounded-t-lg transition-all group-hover:brightness-110 shadow-sm" style={{ height: d.rev }}></div>
              </div>
              <span className="text-[10px] text-slate-400 font-bold tracking-tighter uppercase">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Margin Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Márgenes por Categoría</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Ingresos (USD)</th>
                <th className="px-6 py-4">Costo (USD)</th>
                <th className="px-6 py-4">Ganancia Bruta</th>
                <th className="px-6 py-4">Margen %</th>
                <th className="px-6 py-4 text-right">Evolución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[
                { cat: 'Electrónica', rev: '$180,000', cost: '$120,000', gross: '$60,000', margin: '33.3%', evo: '+2.4%', pos: true },
                { cat: 'Hogar y Jardín', rev: '$95,000', cost: '$65,000', gross: '$30,000', margin: '31.6%', evo: '-0.8%', pos: false },
                { cat: 'Moda y Accesorios', rev: '$110,000', cost: '$85,000', gross: '$25,000', margin: '22.7%', evo: '+1.2%', pos: true },
                { cat: 'Alimentos', rev: '$65,000', cost: '$55,000', gross: '$10,000', margin: '15.4%', evo: '-4.5%', pos: false },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{row.cat}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{row.rev}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">{row.cost}</td>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{row.gross}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      parseFloat(row.margin) > 25 ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 
                      parseFloat(row.margin) > 20 ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                      'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                    }`}>
                      {row.margin}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${row.pos ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.evo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top & Least Profitable Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Top Profitable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500">trending_up</span>
              Top Rentables
            </h3>
            <button className="text-[#137fec] text-xs font-black uppercase tracking-wider hover:underline transition-all">Ver todos</button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[
                { name: 'Smartwatch Series X', sku: 'SW-X2024-B', margin: '48.5%', neto: '$42.50/ud' },
                { name: 'Auriculares ANC Pro', sku: 'AU-ANC-99', margin: '42.2%', neto: '$38.90/ud' },
                { name: 'Cámara 4K Vlog', sku: 'CAM-4K-V2', margin: '39.8%', neto: '$120.00/ud' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{p.margin} Margen</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.neto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Least Profitable */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/30">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-rose-500">trending_down</span>
              Menor Rentabilidad
            </h3>
            <button className="text-[#137fec] text-xs font-black uppercase tracking-wider hover:underline transition-all">Ver todos</button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[
                { name: 'Papelera Premium Steel', sku: 'HO-PA-04', margin: '4.2%', neto: '$1.20/ud' },
                { name: 'Cables USB-C (Pack 3)', sku: 'EL-CB-UC3', margin: '5.1%', neto: '$0.80/ud' },
                { name: 'Alfombrilla Mouse XL', sku: 'EL-AL-M02', margin: '6.8%', neto: '$2.15/ud' },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-2xl">inventory_2</span>
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">{p.margin} Margen</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{p.neto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitabilityAnalysis;

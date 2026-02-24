import React, { useState } from 'react';

/**
 * Cash Flow Analysis Dashboard (Analytical Cash Flow)
 * Refined to match Stitch 'Proyección de Pagos' aesthetic
 * Rounded corners, specific button styles, and typography
 */
const CashFlowAnalysisDashboard = () => {
  const [period, setPeriod] = useState('Último Mes');

  return (
    <div className="flex-1 w-full bg-[#f6f7f8] dark:bg-[#101922] font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Contabilidad</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span>Reportes</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#137fec] font-semibold">Flujo de Efectivo</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Flujo de Efectivo Analítico
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Análisis detallado de entradas y salidas de efectivo por actividades de operación, inversión y financiación.
            </p>
          </div>
          
          {/* Refined Buttons Group */}
          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-slate-100 dark:bg-slate-700 text-[#137fec] shadow-sm">
                {period}
              </button>
              <button 
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => setPeriod('Trimestre')}
              >
                Trimestre
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filtros
            </button>
            
            <button className="bg-[#137fec] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-[#137fec]/20">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Exportar
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Initial Balance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Saldo Inicial</p>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-400">
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$450,000</h3>
              <p className="text-xs text-slate-400 mt-2">Al 01 de Octubre</p>
            </div>
          </div>

          {/* Total Inflow */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-emerald-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Entradas Totales</p>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">+$124,500</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">+8.2%</span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
          </div>

          {/* Total Outflow */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-rose-500 border-y border-r border-y-slate-200 border-r-slate-200 dark:border-y-slate-800 dark:border-r-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Salidas Totales</p>
              <div className="p-1.5 bg-rose-50 dark:bg-rose-900/30 rounded text-rose-600">
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              </div>
            </div>
            <div>
              <h3 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">-$62,200</h3>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">-2.1%</span>
                <span className="text-xs text-slate-400">vs periodo anterior</span>
              </div>
            </div>
          </div>

          {/* Final Balance */}
          <div className="bg-[#137fec] p-6 rounded-xl shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="text-sm font-semibold text-blue-100 uppercase tracking-wider">Saldo Final</p>
              <div className="p-1.5 bg-white/20 rounded text-white">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold tracking-tight">$512,300</h3>
              <p className="text-xs text-blue-100/80 mt-2">Corte al día de hoy</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <span className="material-symbols-outlined text-[120px]">account_balance_wallet</span>
            </div>
          </div>
        </div>

        {/* Daily Cash Flow Visualization */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Tendencia de Flujo de Caja</h3>
              <p className="text-sm text-slate-500">Comportamiento diario de entradas vs. salidas</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Entradas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Salidas</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-[#137fec] border-dashed"></span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Saldo Neto</span>
              </div>
            </div>
          </div>
          
          {/* Bar Chart Implementation - Rounded Bars */}
          <div className="h-72 w-full flex items-end justify-between gap-4 px-2 relative mt-4">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border-t border-slate-900 dark:border-white h-px w-full"></div>
              ))}
            </div>

            {[
              { day: '01 Oct', in: 75, out: 40, bal: 80 },
              { day: '02 Oct', in: 55, out: 30, bal: 85 },
              { day: '03 Oct', in: 95, out: 55, bal: 92 },
              { day: '04 Oct', in: 40, out: 75, bal: 78 },
              { day: '05 Oct', in: 100, out: 35, bal: 100 },
              { day: '06 Oct', in: 65, out: 45, bal: 90 },
              { day: '07 Oct', in: 85, out: 50, bal: 95 },
            ].map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-3 z-10 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-2 h-full pb-2 relative">
                  {/* Bars with rounded tops */}
                  <div className="w-3 sm:w-5 bg-emerald-500/90 rounded-t-lg transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20" style={{ height: `${d.in}%` }}></div>
                  <div className="w-3 sm:w-5 bg-rose-500/90 rounded-t-lg transition-all hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-500/20" style={{ height: `${d.out}%` }}></div>
                  {/* Net Balance Marker */}
                  <div className="absolute w-3 sm:w-5 h-1 bg-[#137fec] rounded-full bottom-[var(--bal)] transition-all" style={{ bottom: `${d.bal}%` }}></div>
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wide">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Operating Activities - Refined Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">inventory_2</span>
                Actividades de Operación
              </h3>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Neto: +$62,300</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-6 py-4">Concepto</th>
                    <th className="px-6 py-4 text-right">Entradas</th>
                    <th className="px-6 py-4 text-right">Salidas</th>
                    <th className="px-6 py-4 text-center">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { concept: 'Ventas y Cobranzas', in: '$85,200', out: '-', var: '+12%', pos: true },
                    { concept: 'Pagos a Proveedores', in: '-', out: '-$22,100', var: '-5%', pos: false },
                    { concept: 'Salarios y Cargas', in: '-', out: '-$14,500', var: '0%', pos: null },
                    { concept: 'Gastos Operativos', in: '$1,200', out: '-$3,400', var: '-2%', pos: false },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{row.concept}</td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">{row.in}</td>
                      <td className="px-6 py-4 text-sm font-medium text-rose-600 text-right">{row.out}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.pos === true ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          row.pos === false ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {row.var}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Investment & Financing - Compact Panels */}
          <div className="space-y-6">
            {/* Investment */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">trending_up</span>
                  <h3 className="text-lg font-bold">Inversión</h3>
                </div>
                <span className="text-xs font-bold text-rose-500">-$9,500 Neto</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Adquisición Activos</span>
                  <span className="font-bold text-rose-600">-$12,000</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Venta de Equipo</span>
                  <span className="font-bold text-emerald-600">+$2,500</span>
                </div>
              </div>
            </div>

            {/* Financing */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-500">account_balance</span>
                  <h3 className="text-lg font-bold">Financiación</h3>
                </div>
                <span className="text-xs font-bold text-emerald-500">+$9,500 Neto</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Préstamos Recibidos</span>
                  <span className="font-bold text-emerald-600">+$35,600</span>
                </div>
                <div className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Amortización Deuda</span>
                  <span className="font-bold text-rose-600">-$26,100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default CashFlowAnalysisDashboard;

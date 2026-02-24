import React from 'react';

/**
 * Pantalla de Estado de Resultados (P&L)
 * Implementada según el diseño de Stitch (f543adb117a147a49bd19af42d6cb26f)
 * Refinamiento de pesos de fuente y estilos de botones para fidelidad 100%.
 */
const ProfitAndLoss = () => {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      {/* Header Section */}
      <section className="flex flex-wrap justify-between items-end gap-4 px-4 md:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black tracking-tight leading-tight">Estado de Resultados (P&L)</h1>
          <p className="text-slate-500 text-base font-medium">Period: current month vs previous period</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            May 2024
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-lg text-sm font-bold shadow-md hover:bg-[#137fec]/90 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar PDF
          </button>
        </div>
      </section>

      {/* Summary Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Revenue</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">$450,200.00</p>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>12.5%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Gross Profit</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">$280,150.00</p>
            <span className="text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_down</span>2.1%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Operating Income</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">$120,400.00</p>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>5.4%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Net Income</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">$95,200.00</p>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
              <span className="material-symbols-outlined text-sm">trending_up</span>8.2%
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Cálculo de Utilidad Bruta</h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amounts in USD</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left pb-3 uppercase tracking-wider text-xs">Concepto</th>
                    <th className="text-right pb-3 uppercase tracking-wider text-xs">Monto Actual</th>
                    <th className="text-right pb-3 uppercase tracking-wider text-xs">Periodo Ant.</th>
                    <th className="text-right pb-3 uppercase tracking-wider text-xs">Variación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  <tr>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-300">Ventas Brutas</td>
                    <td className="py-4 text-right font-bold">$510,000.00</td>
                    <td className="py-4 text-right text-slate-500">$480,000.00</td>
                    <td className="py-4 text-right text-emerald-600 font-bold">+6.2%</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-300">Devoluciones y Descuentos</td>
                    <td className="py-4 text-right font-bold text-rose-600">($59,800.00)</td>
                    <td className="py-4 text-right text-slate-500">($45,000.00)</td>
                    <td className="py-4 text-right text-rose-600 font-bold">+32.8%</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="py-4 font-black text-slate-900 dark:text-slate-100">Ventas Netas</td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-slate-100">$450,200.00</td>
                    <td className="py-4 text-right text-slate-500">$435,000.00</td>
                    <td className="py-4 text-right text-emerald-600 font-black">+3.5%</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-300">Costo de Ventas (COGS)</td>
                    <td className="py-4 text-right font-bold text-rose-600">($170,050.00)</td>
                    <td className="py-4 text-right text-slate-500">($162,000.00)</td>
                    <td className="py-4 text-right text-rose-600 font-bold">+4.9%</td>
                  </tr>
                  <tr className="border-t-2 border-[#137fec]/20 bg-[#137fec]/5">
                    <td className="py-5 font-black text-[#137fec] text-base tracking-tight">Utilidad Bruta</td>
                    <td className="py-5 text-right font-black text-[#137fec] text-base tracking-tight">$280,150.00</td>
                    <td className="py-5 text-right text-slate-500">$273,000.00</td>
                    <td className="py-5 text-right text-emerald-600 font-black">+2.6%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 uppercase text-sm tracking-widest">Variación por Categoría</h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 uppercase">Hardware & Accesorios</span>
                  <span className="text-slate-900 dark:text-slate-100">$185,000.00 (+14%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#137fec] rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 uppercase">Suscripciones Software</span>
                  <span className="text-slate-900 dark:text-slate-100">$210,000.00 (+8%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300 uppercase">Servicios Profesionales</span>
                  <span className="text-slate-900 dark:text-slate-100">$55,200.00 (-5%)</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase text-sm tracking-widest">Revenue Breakdown</h3>
            <div className="relative flex justify-center py-6">
              <div className="size-48 rounded-full border-[16px] border-slate-100 dark:border-slate-800 relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-[16px] border-[#137fec] border-t-transparent border-l-transparent rotate-45"></div>
                <div className="absolute inset-0 rounded-full border-[16px] border-emerald-500 border-b-transparent border-r-transparent -rotate-12"></div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">100%</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total Sales</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-[#137fec]"></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Software</span>
                </div>
                <span className="text-xs font-bold">46%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Hardware</span>
                </div>
                <span className="text-xs font-bold">41%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-amber-400"></div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">Services</span>
                </div>
                <span className="text-xs font-bold">13%</span>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase text-sm tracking-widest">Métodos de Pago</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined">credit_card</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Credit Card</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">65%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined">account_balance</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Bank Transfer</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">28%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600">
                  <span className="material-symbols-outlined">payments</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Other / Cash</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">7%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: '7%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-sm tracking-widest">Comparativa con Periodo Anterior</h3>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black tracking-widest">
              FAVORABLE
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Variación en Ingresos</p>
            <p className="text-2xl font-black text-emerald-600">+$15,200.00</p>
            <p className="text-[10px] text-slate-400 mt-1">Comparado con Abril 2024</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Optimización COGS</p>
            <p className="text-2xl font-black text-rose-600">+$8,050.00</p>
            <p className="text-[10px] text-slate-400 mt-1">Incremento en costos operativos</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Net Margin Gap</p>
            <p className="text-2xl font-black text-emerald-600">+1.2% pts</p>
            <p className="text-[10px] text-slate-400 mt-1">Eficiencia de margen neto</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfitAndLoss;

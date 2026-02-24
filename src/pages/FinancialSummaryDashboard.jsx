import React, { useState } from 'react';
import DashboardNav from '@/components/business-intelligence/DashboardNav';

/**
 * Financial Summary Dashboard (BI Assisted)
 * Optimized for Mobile & 100% Faithful to Stitch Design
 */
const FinancialSummaryDashboard = () => {
  const [period, setPeriod] = useState('Month');
  const [comparePrevious, setComparePrevious] = useState(true);

  return (
    <div className="flex-1 w-full bg-[#f6f7f8] dark:bg-[#101922] font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto w-full space-y-6 sm:space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight">
              Resumen Financiero
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base font-normal">
              Monitoreo de salud empresarial en tiempo real asistido por BI
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex h-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              {['Hoy', 'Semana', 'Mes', 'Año'].map((p) => {
                const value = p === 'Hoy' ? 'Today' : p === 'Semana' ? 'Week' : p === 'Mes' ? 'Month' : 'Year';
                const isSelected = period === value;
                return (
                  <label key={p} className="flex cursor-pointer h-full grow items-center justify-center rounded-md px-4 has-[:checked]:bg-white dark:has-[:checked]:bg-slate-700 has-[:checked]:shadow-sm text-slate-500 dark:text-slate-400 has-[:checked]:text-primary text-xs font-semibold uppercase tracking-wider transition-all">
                    <span>{p}</span>
                    <input 
                      className="hidden" 
                      type="radio" 
                      name="period" 
                      value={value} 
                      checked={isSelected} 
                      onChange={() => setPeriod(value)} 
                    />
                  </label>
                );
              })}
            </div>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white text-sm font-bold rounded-lg hover:bg-[#137fec]/90 transition-all shadow-md shadow-[#137fec]/20">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Exportar BI
            </button>
          </div>
        </div>

        {/* Comparison Toggle */}
        <div className="flex items-center justify-between bg-blue-50/50 dark:bg-[#137fec]/5 px-4 sm:px-6 py-3 rounded-xl border border-blue-100 dark:border-[#137fec]/10">
          <div className="flex items-center gap-3">
            <div className="size-2 rounded-full bg-[#137fec] animate-pulse flex-shrink-0"></div>
            <p className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">Comparar con el período anterior</p>
          </div>
          <label className={`relative flex h-[24px] w-[44px] sm:h-[28px] sm:w-[48px] cursor-pointer items-center rounded-full p-1 transition-colors flex-shrink-0 ${
            comparePrevious ? 'bg-[#137fec]' : 'bg-slate-300 dark:bg-slate-700'
          }`}>
            <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-white shadow-sm transition-transform ${
              comparePrevious ? 'translate-x-5' : 'translate-x-0'
            }`}></div>
            <input 
              className="hidden peer" 
              type="checkbox" 
              checked={comparePrevious} 
              onChange={() => setComparePrevious(!comparePrevious)} 
            />
          </label>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Revenue */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-600">
                <span className="material-symbols-outlined">trending_up</span>
              </div>
              <span className="flex items-center text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">+12.4%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Ingresos Totales</p>
            <h3 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black mt-1">$450,230.00</h3>
          </div>

          {/* Expenses */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="flex items-center text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-full">-3.2%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Gastos Operativos</p>
            <h3 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black mt-1">$212,400.00</h3>
          </div>

          {/* Net Income */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#137fec]/10 rounded-lg text-[#137fec]">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className="flex items-center text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">+8.1%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Utilidad Neta</p>
            <h3 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black mt-1">$237,830.00</h3>
          </div>

          {/* Cash Position */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600">
                <span className="material-symbols-outlined">savings</span>
              </div>
              <span className="flex items-center text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Estable</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">Posición de Caja</p>
            <h3 className="text-slate-900 dark:text-white text-xl sm:text-2xl font-black mt-1">$1.2M</h3>
          </div>
        </div>

        {/* Main Content Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Gauge & Health Score */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold">Salud Financiera</h2>
              {/* Gauge Visual */}
              <div className="relative flex items-center justify-center pt-4 scale-90 sm:scale-100">
                <svg className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" cx="80" cy="80" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="110" strokeWidth="12" fill="transparent" className="sm:cx-96 sm:cy-96 sm:r-80 sm:stroke-width-14 sm:stroke-dasharray-502 sm:stroke-dashoffset-125" style={{cx: '50%', cy: '50%'}}></circle>
                  <circle className="text-[#137fec]" cx="80" cy="80" r="70" stroke="currentColor" strokeDasharray="440" strokeDashoffset="154" strokeLinecap="round" strokeWidth="12" fill="transparent" className="sm:cx-96 sm:cy-96 sm:r-80 sm:stroke-width-14 sm:stroke-dasharray-502 sm:stroke-dashoffset-175" style={{cx: '50%', cy: '50%'}}></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">84</span>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-500 tracking-widest uppercase">Excelente</span>
                </div>
              </div>
              <div className="w-full bg-emerald-50 dark:bg-emerald-500/5 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                  <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                  <p className="text-[10px] sm:text-xs font-bold uppercase">Recomendación BI</p>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-left">
                  Tu flujo de caja es óptimo. Considera reinvertir el excedente del 15% en activos de alta liquidez para mejorar el Quick Ratio.
                </p>
              </div>
              <button className="w-full py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-800 hover:bg-[#137fec] hover:text-white text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all text-xs sm:text-sm">
                Ver Análisis Completo
              </button>
            </div>
          </div>

          {/* Financial Ratios */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-slate-900 dark:text-white text-lg sm:text-xl font-bold tracking-tight">Ratios Financieros Clave</h2>
              <span className="material-symbols-outlined text-slate-400">info</span>
            </div>
            <div className="space-y-6 sm:space-y-8 flex-1">
              {/* Ratio Item 1 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-slate-900 dark:text-white text-sm sm:text-base font-bold">Current Ratio</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Capacidad de pago a corto plazo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">2.45</p>
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-600">Saludable</p>
                  </div>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#137fec] rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              {/* Ratio Item 2 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-slate-900 dark:text-white text-sm sm:text-base font-bold">Quick Ratio</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Liquidez inmediata</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">1.82</p>
                    <p className="text-[10px] sm:text-xs font-bold text-emerald-600">Saludable</p>
                  </div>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#137fec] rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              {/* Ratio Item 3 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-slate-900 dark:text-white text-sm sm:text-base font-bold">Margen Bruto</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs">Rentabilidad operativa</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">42.5%</p>
                    <p className="text-[10px] sm:text-xs font-bold text-[#137fec]">Obj: 45%</p>
                  </div>
                </div>
                <div className="h-1.5 sm:h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#137fec] rounded-full" style={{ width: '42.5%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <p className="text-slate-400 text-[10px] italic">Sincronizado BI: Hace 4m</p>
              <a className="text-[#137fec] text-xs sm:text-sm font-bold flex items-center gap-1 hover:underline cursor-pointer">
                Detalle
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        {/* BI Insights Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#137fec]/30 to-transparent"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#137fec] font-bold tracking-widest text-[10px] uppercase">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Powered by Predictive BI
              </div>
              <h2 className="text-xl sm:text-2xl font-black">Pronóstico de Trimestre</h2>
              <p className="text-slate-400 max-w-xl text-sm sm:text-base leading-relaxed">
                Utilidad neta estimada de <span className="text-white font-bold">$742k</span> para cierre de Q3, un <span className="text-emerald-400 font-bold">14% superior</span>.
              </p>
            </div>
            <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors whitespace-nowrap text-sm sm:text-base w-full sm:w-auto">
              Generar Proyección
            </button>
          </div>
          <div className="absolute -bottom-12 -right-12 size-48 sm:size-64 bg-[#137fec]/10 rounded-full blur-3xl"></div>
        </div>

        {/* Footer */}
        <footer className="pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col xs:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-[10px] sm:text-xs font-medium text-center">© 2024 ERP Financial System • Versión 4.2.0-Fluent</p>
          <div className="flex gap-4">
            <a className="text-slate-400 hover:text-[#137fec] transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px] sm:text-[20px]">help_center</span></a>
            <a className="text-slate-400 hover:text-[#137fec] transition-colors cursor-pointer"><span className="material-symbols-outlined text-[18px] sm:text-[20px]">contact_support</span></a>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default FinancialSummaryDashboard;

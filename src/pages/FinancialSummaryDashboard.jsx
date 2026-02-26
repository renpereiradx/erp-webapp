import React, { useState } from 'react';
import DashboardNav from '@/components/business-intelligence/DashboardNav';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, ArrowRight } from 'lucide-react';

/**
 * Financial Summary Dashboard (BI Assisted)
 * Optimized for Mobile & 100% Faithful to Stitch Design
 */
const FinancialSummaryDashboard = () => {
  const [period, setPeriod] = useState('Month');
  const [comparePrevious, setComparePrevious] = useState(true);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-text-main tracking-tight uppercase">Resumen Financiero</h1>
          <p className="text-sm text-text-secondary font-medium">Monitoreo de salud empresarial en tiempo real asistido por BI</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface p-1 rounded-xl shadow-sm border border-border-subtle w-full sm:w-auto">
          <div className="flex h-9 items-center justify-center rounded-lg bg-slate-100 p-1 grow sm:grow-0">
            {['Hoy', 'Semana', 'Mes', 'Año'].map((p) => {
              const value = p === 'Hoy' ? 'Today' : p === 'Semana' ? 'Week' : p === 'Mes' ? 'Month' : 'Year';
              const isSelected = period === value;
              return (
                <label key={p} className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-4 transition-all text-[10px] font-black uppercase tracking-widest ${
                  isSelected ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'
                }`}>
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
          <div className="hidden sm:block h-6 w-px bg-slate-200 mx-1"></div>
          <Button variant="primary" size="md" className="shadow-md font-black uppercase tracking-widest text-[11px]">
            <Download size={18} className="mr-2" />
            Exportar BI
          </Button>
        </div>
      </div>

      <DashboardNav />

      {/* Comparison Toggle */}
      <div className="flex items-center justify-between bg-blue-50/50 px-6 py-4 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-primary animate-pulse flex-shrink-0"></div>
          <p className="text-text-main text-[10px] font-black uppercase tracking-[0.2em]">Comparar con el período anterior</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            className="sr-only peer" 
            checked={comparePrevious} 
            onChange={() => setComparePrevious(!comparePrevious)} 
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-green-50 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-success bg-green-50 px-2 py-1 rounded-full">+12.4%</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Ingresos Totales</p>
          <h3 className="text-2xl font-black text-text-main tracking-tight">$450,230.00</h3>
        </div>

        {/* Expenses */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-error bg-red-50 px-2 py-1 rounded-full">-3.2%</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Gastos Operativos</p>
          <h3 className="text-2xl font-black text-text-main tracking-tight">$212,400.00</h3>
        </div>

        {/* Net Income */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-success bg-green-50 px-2 py-1 rounded-full">+8.1%</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Utilidad Neta</p>
          <h3 className="text-2xl font-black text-text-main tracking-tight">$237,830.00</h3>
        </div>

        {/* Cash Position */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-1 rounded-full">Estable</span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-text-secondary mb-1">Posición de Caja</p>
          <h3 className="text-2xl font-black text-text-main tracking-tight">$1.2M</h3>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gauge & Health Score */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col items-center text-center">
          <h3 className="text-sm font-black text-text-main uppercase tracking-tight mb-8">Salud Financiera</h3>
          {/* Gauge Visual */}
          <div className="relative flex items-center justify-center mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle className="text-slate-100" cx="96" cy="96" r="80" stroke="currentColor" strokeDasharray="502" strokeDashoffset="125" strokeWidth="14" fill="transparent"></circle>
              <circle className="text-primary" cx="96" cy="96" r="80" stroke="currentColor" strokeDasharray="502" strokeDashoffset="175" strokeLinecap="round" strokeWidth="14" fill="transparent"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-text-main tracking-tight">84</span>
              <span className="text-[10px] font-black text-success tracking-widest uppercase mt-1">Excelente</span>
            </div>
          </div>
          <div className="w-full bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex items-center gap-2 text-success">
              <span className="material-symbols-outlined text-[18px]">lightbulb</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Recomendación BI</p>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed text-left font-medium">
              Tu flujo de caja es óptimo. Considera reinvertir el excedente del 15% en activos de alta liquidez para mejorar el Quick Ratio.
            </p>
          </div>
          <Button variant="ghost" className="w-full mt-6 h-11 text-[11px] font-black uppercase tracking-widest text-text-secondary hover:text-primary hover:bg-blue-50">
            Ver Análisis Completo
          </Button>
        </div>

        {/* Financial Ratios */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-text-main uppercase tracking-tight">Ratios Financieros Clave</h3>
            <span className="material-symbols-outlined text-slate-300">info</span>
          </div>
          <div className="space-y-10 flex-1">
            {/* Ratio Item 1 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-text-main uppercase tracking-tight">Current Ratio</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Capacidad de pago a corto plazo</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-text-main tracking-tight">2.45</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-success">Saludable</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            {/* Ratio Item 2 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-text-main uppercase tracking-tight">Quick Ratio</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Liquidez inmediata</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-text-main tracking-tight">1.82</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-success">Saludable</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            {/* Ratio Item 3 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-text-main uppercase tracking-tight">Margen Bruto</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60">Rentabilidad operativa</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-text-main tracking-tight">42.5%</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Obj: 45%</p>
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '42.5%' }}></div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-40 italic">Sincronizado BI: Hace 4m</p>
            <a className="text-primary text-[11px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline cursor-pointer">
              Detalle
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>

      {/* BI Insights Banner */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/30 to-transparent"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary font-black tracking-[0.2em] text-[10px] uppercase">
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              Powered by Predictive BI
            </div>
            <h2 className="text-2xl font-black tracking-tight uppercase">Pronóstico de Trimestre</h2>
            <p className="text-slate-400 max-w-2xl text-sm leading-relaxed font-medium">
              Utilidad neta estimada de <span className="text-white font-black">$742k</span> para cierre de Q3, un <span className="text-emerald-400 font-black uppercase">14% superior</span>.
            </p>
          </div>
          <Button variant="outline" className="bg-white text-slate-900 border-transparent h-12 px-8 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-colors whitespace-nowrap">
            Generar Proyección
          </Button>
        </div>
        <div className="absolute -bottom-12 -right-12 size-64 bg-primary/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default FinancialSummaryDashboard;

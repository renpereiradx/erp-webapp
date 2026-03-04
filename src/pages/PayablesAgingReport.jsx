import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  ChevronRight,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  AlertTriangle,
  MoreHorizontal,
  ChevronLeft
} from 'lucide-react';

/**
 * Reporte de Antigüedad de Deuda (Payables)
 * 100% Fidelity with Stitch and layout-guidelines.md
 */
const PayablesAgingReport = () => {

  useEffect(() => {
    document.title = 'Reporte de Antigüedad | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
          <Link to="/dashboard/payables" className="hover:text-primary transition-colors flex items-center gap-1">
            Finanzas
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <Link to="/dashboard/payables" className="hover:text-primary transition-colors">
            Cuentas por Pagar
          </Link>
          <ChevronRight size={12} className="mx-2 opacity-30" />
          <span className="text-slate-600 dark:text-slate-300">Reporte de Antigüedad</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="bg-primary/10 p-2.5 rounded-xl text-primary shadow-sm border border-primary/20 flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase truncate flex items-center gap-3">
                Reporte de Antigüedad de Deuda
              </h1>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                <Clock size={14} className="opacity-50" />
                <span>Corte al: <span className="text-slate-600 dark:text-slate-300">24 de Mayo, 2024</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              Filtrar
            </button>
            <button className="inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Download className="h-4 w-4 mr-2 text-slate-400" />
              Excel
            </button>
            <button className="inline-flex items-center px-4 py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 text-slate-600 dark:text-slate-300">
              <Printer className="h-4 w-4 mr-2 text-slate-400" />
              Imprimir
            </button>
            <div className="hidden lg:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="inline-flex items-center px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-md shadow-primary/20 active:scale-95">
              <Plus className="h-4 w-4 mr-1.5" />
              Nuevo Pago
            </button>
          </div>
        </div>
      </div>

      {/* Hero Visual Section: Stacked Bar */}
      <section className="bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)]">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Distribución Global por Vencimiento</h2>
            <p className="text-sm font-medium text-slate-500">Visualización del flujo de caja comprometido y deuda vencida.</p>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Deuda Total Consolidada</p>
            <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white break-words tracking-tight">{formatCurrency(4285120.45)}</p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        <div className="relative w-full h-12 md:h-16 flex rounded-xl overflow-hidden mb-6 shadow-inner">
          <div className="group relative bg-fluent-success h-full flex items-center justify-center transition-all cursor-pointer hover:brightness-110" style={{ width: '55%' }}>
            <span className="text-white text-xs font-bold hidden md:block">Corriente (55%)</span>
          </div>
          <div className="group relative bg-fluent-warning h-full flex items-center justify-center transition-all cursor-pointer hover:brightness-110" style={{ width: '20%' }}>
            <span className="text-slate-900 text-xs font-bold hidden md:block">31-60 d (20%)</span>
          </div>
          <div className="group relative bg-orange-500 h-full flex items-center justify-center transition-all cursor-pointer hover:brightness-110" style={{ width: '15%' }}>
            <span className="text-white text-xs font-bold hidden md:block">61-90 d (15%)</span>
          </div>
          <div className="group relative bg-fluent-danger h-full flex items-center justify-center transition-all cursor-pointer hover:brightness-110" style={{ width: '10%' }}>
            <span className="text-white text-xs font-bold hidden md:block">+90 d (10%)</span>
          </div>
        </div>

        {/* Chart Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-fluent-success shadow-sm shadow-fluent-success/50"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Corriente (0-30 d)</p>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(2356816.25)}</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-fluent-warning shadow-sm shadow-fluent-warning/50"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Vencido (31-60 d)</p>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(857024.09)}</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Vencido (61-90 d)</p>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(642768.07)}</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-fluent-danger shadow-sm shadow-fluent-danger/50"></div>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Crítico (+90 d)</p>
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(428512.04)}</p>
          </div>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* DPO Card */}
        <div className="bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">DPO (Días Promedio de Pago)</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">42 Días</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-fluent-success text-xs font-bold bg-fluent-success/10 px-2 py-0.5 rounded-md">
                  <TrendingUp size={14} className="mr-1" /> 2.4%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">vs. mes anterior (41 d)</span>
              </div>
            </div>
            <div className="bg-primary/10 p-3 rounded-xl flex-shrink-0 text-primary shadow-sm border border-primary/10">
              <Clock size={20} />
            </div>
          </div>
          <div className="mt-8 h-12 w-full flex items-end gap-1.5 opacity-60">
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[40%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[55%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[45%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[70%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[60%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[85%] transition-all group-hover:bg-primary/30"></div>
            <div className="flex-1 bg-primary rounded-t-sm h-[100%] shadow-[0_0_8px_rgba(19,127,236,0.4)]"></div>
          </div>
        </div>

        {/* % Overdue Card */}
        <div className="bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-orange-500 transition-colors">% de Deuda Vencida</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">15.4%</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-fluent-danger text-xs font-bold bg-fluent-danger/10 px-2 py-0.5 rounded-md">
                  <TrendingUp size={14} className="mr-1" /> 1.2%
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objetivo: &lt; 10%</span>
              </div>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-xl flex-shrink-0 text-orange-500 shadow-sm border border-orange-500/10">
              <AlertCircle size={20} />
            </div>
          </div>
          {/* Circular progress mini simulation */}
          <div className="absolute right-8 bottom-8 w-16 h-16 border-[6px] border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center shadow-inner">
            <div className="absolute top-0 left-0 w-full h-full border-[6px] border-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(249,115,22,0.4)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}></div>
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest z-10">ALTO</span>
          </div>
        </div>

        {/* Critical Risk Card */}
        <div className="bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-fluent-danger transition-colors">Monto en Riesgo Crítico</p>
              <h3 className="text-3xl font-black text-fluent-danger tracking-tight break-words">{formatCurrency(450000)}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center text-fluent-success text-xs font-bold bg-fluent-success/10 px-2 py-0.5 rounded-md">
                  <TrendingDown size={14} className="mr-1" /> $12k
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">en recuperación activa</span>
              </div>
            </div>
            <div className="bg-fluent-danger/10 p-3 rounded-xl flex-shrink-0 text-fluent-danger shadow-sm border border-fluent-danger/10">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <span className="text-[9px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md uppercase tracking-widest border border-slate-200 dark:border-slate-700">8 PROVEEDORES</span>
            <div className="flex -space-x-2 overflow-hidden">
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#1b2633] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-300">JD</div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#1b2633] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-300">AC</div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#1b2633] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-black text-slate-600 dark:text-slate-300">ML</div>
              <div className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-[#1b2633] bg-slate-800 flex items-center justify-center text-[9px] font-black text-white shadow-sm">+5</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Data Grid */}
      <section className="bg-white dark:bg-[#1b2633] rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)] overflow-hidden">
        <div className="px-6 md:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-lg font-extrabold flex items-center gap-2 tracking-tight text-slate-900 dark:text-white">
            Desglose Analítico por Proveedor
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input 
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary/30 outline-none transition-all font-medium" 
                placeholder="Buscar proveedor..." 
                type="text"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 sticky left-0 bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur z-10">Proveedor</th>
                <th className="px-4 py-4 text-right">Corriente</th>
                <th className="px-4 py-4 text-right">31-60 Días</th>
                <th className="px-4 py-4 text-right">61-90 Días</th>
                <th className="px-4 py-4 text-right">+90 Días</th>
                <th className="px-4 py-4 text-right">Total Pendiente</th>
                <th className="px-4 py-4 text-center">Riesgo</th>
                <th className="px-6 py-4 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-[13px]">
              
              {/* Row 1 */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                <td className="px-6 py-4 sticky left-0 bg-white dark:bg-[#1b2633] group-hover:bg-slate-50/80 dark:group-hover:bg-[#1f2b38] transition-colors z-10 font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                  Global Tech Solutions S.A.
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-fluent-success">{formatCurrency(142500)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(142500)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-black bg-fluent-success/10 text-fluent-success uppercase tracking-widest border border-fluent-success/20">Mínimo</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                <td className="px-6 py-4 sticky left-0 bg-white dark:bg-[#1b2633] group-hover:bg-slate-50/80 dark:group-hover:bg-[#1f2b38] transition-colors z-10 font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                  Constructora del Norte & Cía
                </td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{formatCurrency(85200)}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-fluent-warning">{formatCurrency(124000)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(209200)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-black bg-fluent-warning/10 text-fluent-warning uppercase tracking-widest border border-fluent-warning/20">Moderado</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
              
              {/* Row 3 (Critical) */}
              <tr className="bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-colors group cursor-pointer border-y border-red-100 dark:border-red-900/30">
                <td className="px-6 py-4 sticky left-0 bg-red-50/50 dark:bg-[#1f1e24] group-hover:bg-red-50/80 dark:group-hover:bg-[#251f25] transition-colors z-10 font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                  Insumos Industriales MX
                </td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{formatCurrency(12000)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">{formatCurrency(15400)}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-orange-500">{formatCurrency(88900)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-fluent-danger">{formatCurrency(310000)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-fluent-danger">{formatCurrency(426300)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-black bg-fluent-danger/10 text-fluent-danger uppercase tracking-widest border border-fluent-danger/20 shadow-sm">Crítico</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 opacity-0 group-hover:opacity-100 text-fluent-danger hover:text-red-700 transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
              
              {/* Row 4 */}
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer">
                <td className="px-6 py-4 sticky left-0 bg-white dark:bg-[#1b2633] group-hover:bg-slate-50/80 dark:group-hover:bg-[#1f2b38] transition-colors z-10 font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                  Logística Express Internacional
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-fluent-success">{formatCurrency(320000)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-medium text-slate-500">{formatCurrency(0)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-slate-900 dark:text-white">{formatCurrency(320000)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2.5 py-1 rounded-md text-[9px] font-black bg-fluent-success/10 text-fluent-success uppercase tracking-widest border border-fluent-success/20">Mínimo</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all">
                    <MoreHorizontal size={16} />
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td className="px-6 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  TOTALES
                </td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(2356816.25)}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(857024.09)}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(642768.07)}</td>
                <td className="px-4 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(428512.04)}</td>
                <td className="px-4 py-4 text-right font-mono font-black text-primary text-sm">{formatCurrency(4285120.45)}</td>
                <td className="px-4 py-4"></td>
                <td className="px-6 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="px-6 md:px-8 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#1b2633]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mostrando 4 de 142 proveedores</p>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-30" disabled>
              <ChevronLeft size={16} />
            </button>
            <button className="size-8 rounded-xl bg-primary text-white text-xs font-black shadow-lg shadow-primary/20">1</button>
            <button className="size-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors">2</button>
            <button className="size-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors">3</button>
            <span className="px-1 text-slate-400 font-bold">...</span>
            <button className="size-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors">15</button>
            <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer Visual Section: Trend & Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <div className="lg:col-span-3 bg-white dark:bg-[#1b2633] p-6 md:p-8 rounded-2xl border border-[#edebe9] dark:border-[#2d3d4f] shadow-[0_1.6px_3.6px_0_rgba(0,0,0,0.132),_0_0.3px_0.9px_0_rgba(0,0,0,0.108)]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">Evolución de Morosidad 12 Meses</h3>
              <p className="text-xs font-medium text-slate-500">Tendencia histórica de Deuda Total vs. Deuda Vencida (+30 días)</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded-full bg-fluent-danger shadow-sm shadow-fluent-danger/50"></div>
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Vencida</span>
              </div>
            </div>
          </div>

          {/* Mock Area Chart */}
          <div className="relative h-56 md:h-64 w-full">
            {/* Chart Vertical Axis Labels */}
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-slate-400 z-10 bg-white/50 dark:bg-[#1b2633]/50 pr-2">
              <span>$1.5M</span>
              <span>$1.0M</span>
              <span>$500K</span>
              <span>$0</span>
            </div>
            
            {/* Chart Horizontal Grid Lines */}
            <div className="absolute inset-x-8 top-0 bottom-8 flex flex-col justify-between pointer-events-none opacity-50">
              <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
              <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
              <div className="w-full border-t border-slate-200 dark:border-slate-700/50"></div>
              <div className="w-full border-b border-slate-300 dark:border-slate-600"></div>
            </div>

            {/* SVG Chart Line Mock */}
            <div className="absolute inset-x-8 top-0 bottom-8">
              <svg className="w-full h-full" preserveAspectRatio="none">
                <path d="M 0 100 Q 20% 80, 40% 90 T 80% 60 L 100% 65" fill="none" stroke="#137fec" strokeLinecap="round" strokeWidth="3" className="drop-shadow-sm"></path>
                <path d="M 0 200 Q 20% 190, 40% 210 T 80% 180 L 100% 180" fill="none" stroke="#d13438" strokeDasharray="6,6" strokeLinecap="round" strokeWidth="3"></path>
              </svg>
            </div>

            {/* X-Axis Labels */}
            <div className="absolute bottom-0 inset-x-8 flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest pt-2">
              <span>Jun '23</span>
              <span>Ago '23</span>
              <span>Oct '23</span>
              <span>Dic '23</span>
              <span>Feb '24</span>
              <span>Abr '24</span>
              <span className="text-primary">May '24</span>
            </div>
          </div>
        </div>

        {/* Executive Summary Card */}
        <div className="lg:col-span-1 bg-primary text-white p-6 md:p-8 rounded-2xl shadow-xl shadow-primary/20 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-black mb-3 tracking-tight">Resumen Ejecutivo</h3>
            <p className="text-white/80 text-sm font-medium leading-relaxed mb-6">
              La morosidad se ha incrementado un <span className="font-bold text-white underline decoration-white/50 underline-offset-2">5.2%</span> respecto al trimestre anterior, impulsado principalmente por el retraso en el sector de Insumos.
            </p>
            <ul className="space-y-5">
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shadow-sm border border-white/10">
                  <AlertCircle size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Alerta de Liquidez</p>
                  <p className="text-xs text-white/70 font-medium mt-0.5">8 cuentas superan los 90 días.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shadow-sm border border-white/10">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Flujo Optimizado</p>
                  <p className="text-xs text-white/70 font-medium mt-0.5">DPO superior al promedio del sector.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <button className="w-full mt-8 bg-white text-primary font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-slate-50 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 relative z-10">
            Descargar PDF
          </button>
        </div>
      </section>

    </div>
  );
};

export default PayablesAgingReport;

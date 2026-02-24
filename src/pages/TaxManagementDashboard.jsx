import React, { useState } from 'react';

/**
 * Tax Management Dashboard (Gestión de IVA y Resumen Fiscal)
 * 100% Faithful to Stitch Enterprise Design
 * Optimized for Desktop & Mobile
 */
const TaxManagementDashboard = () => {
  const [period, setPeriod] = useState('Mes Actual');

  return (
    <div className="flex-1 w-full bg-[#f6f7f8] dark:bg-[#101922] font-['Inter',sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <main className="flex-1 p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">
        
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Contabilidad</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span>Impuestos</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-[#137fec] font-semibold">Resumen Fiscal</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <h1 className="text-slate-900 dark:text-white text-3xl font-bold tracking-tight">
              Gestión de IVA y Resumen Fiscal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Consolidado de obligaciones tributarias, IVA crédito y débito fiscal con proyección de liquidación mensual.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button className="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-slate-100 dark:bg-slate-700 text-[#137fec] shadow-sm">
                {period}
              </button>
              <button 
                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                onClick={() => setPeriod('Anual')}
              >
                Anual
              </button>
            </div>
            
            <button className="bg-[#137fec] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg shadow-[#137fec]/20">
              <span className="material-symbols-outlined text-[20px]">description</span>
              Generar Formulario
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* IVA Débito (Ventas) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">IVA Débito (Ventas)</p>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 rounded text-[#137fec]">
                <span className="material-symbols-outlined text-[20px]">trending_up</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">$85,420.00</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Basado en facturación del mes</p>
          </div>

          {/* IVA Crédito (Compras) */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">IVA Crédito (Compras)</p>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded text-emerald-600">
                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">$62,150.00</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">84% deducible este periodo</p>
          </div>

          {/* Retenciones */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Retenciones</p>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 rounded text-amber-600">
                <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
              </div>
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">$4,200.00</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">A favor del contribuyente</p>
          </div>

          {/* Saldo Fiscal a Pagar/Favor */}
          <div className="bg-slate-900 dark:bg-primary p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <p className="text-blue-100/80 text-sm font-semibold uppercase tracking-wider">Saldo Fiscal Proyectado</p>
              <div className="p-1.5 bg-white/10 rounded text-white">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold tracking-tight">$19,070.00</h3>
              <p className="text-xs text-blue-100/70 mt-2 font-medium uppercase tracking-widest">Saldo a Pagar</p>
            </div>
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <span className="material-symbols-outlined text-[120px]">policy</span>
            </div>
          </div>
        </div>

        {/* Main Tax Breakdown & Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Historical Tax Trend */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Evolución de IVA (6 meses)</h3>
                <p className="text-sm text-slate-500">Comparativa mensual de Débito vs. Crédito Fiscal</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#137fec]"></span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-widest">Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-widest">Compras</span>
                </div>
              </div>
            </div>
            
            {/* Chart Area */}
            <div className="h-72 w-full flex items-end justify-between gap-6 px-2 relative mt-4">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
                {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-900 dark:border-white h-px w-full"></div>)}
              </div>

              {[
                { month: 'Ene', db: 70, cr: 50 },
                { month: 'Feb', db: 85, cr: 65 },
                { month: 'Mar', db: 60, cr: 45 },
                { month: 'Abr', db: 95, cr: 70 },
                { month: 'May', db: 80, cr: 60 },
                { month: 'Jun', db: 90, cr: 55 },
              ].map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 z-10 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-2 h-full pb-2">
                    <div className="w-4 sm:w-6 bg-[#137fec] rounded-t-md transition-all group-hover:opacity-80" style={{ height: `${d.db}%` }}></div>
                    <div className="w-4 sm:w-6 bg-emerald-500 rounded-t-md transition-all group-hover:opacity-80" style={{ height: `${d.cr}%` }}></div>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{d.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tax Distribution by Rate */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Distribución por Tasas</h3>
            <div className="space-y-6 flex-1">
              {/* Tasa 10% */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Gravado 10%</span>
                  <span className="font-bold text-slate-900 dark:text-white">72%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#137fec] h-full w-[72%] rounded-full"></div>
                </div>
              </div>
              {/* Tasa 5% */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Gravado 5%</span>
                  <span className="font-bold text-slate-900 dark:text-white">18%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[18%] rounded-full"></div>
                </div>
              </div>
              {/* Exentas */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Exentas</span>
                  <span className="font-bold text-slate-900 dark:text-white">10%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full w-[10%] rounded-full"></div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 font-medium">Última validación ante SET: Hace 15 min</p>
            </div>
          </div>
        </div>

        {/* Detailed Transactions Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#137fec]">list_alt</span>
              <h3 className="text-lg font-bold">Detalle de Operaciones Gravadas</h3>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-sm font-semibold text-slate-500 hover:text-[#137fec] transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">filter_alt</span>
                Filtrar
              </button>
              <button className="text-sm font-semibold text-slate-500 hover:text-[#137fec] transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Libro IVA
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-[0.1em]">
                  <th className="px-8 py-4">Fecha</th>
                  <th className="px-8 py-4">Tipo Doc.</th>
                  <th className="px-8 py-4">Razón Social</th>
                  <th className="px-8 py-4 text-right">Base Imponible</th>
                  <th className="px-8 py-4 text-center">Tasa</th>
                  <th className="px-8 py-4 text-right">IVA Liquidado</th>
                  <th className="px-8 py-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { date: '14 Oct 2023', type: 'Factura Venta', entity: 'Distribuidora Central S.A.', amount: '$12,500.00', rate: '10%', tax: '$1,250.00', status: 'Validado', pos: true },
                  { date: '12 Oct 2023', type: 'Factura Compra', entity: 'Suministros Industriales MX', amount: '$8,400.00', rate: '10%', tax: '$840.00', status: 'Validado', pos: false },
                  { date: '10 Oct 2023', type: 'Nota de Crédito', entity: 'Retail Logistics Inc.', amount: '$1,200.00', rate: '5%', tax: '$60.00', status: 'Pendiente', pos: true },
                  { date: '08 Oct 2023', type: 'Factura Venta', entity: 'Corporativo Horizonte', amount: '$25,000.00', rate: '10%', tax: '$2,500.00', status: 'Validado', pos: true },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-medium text-slate-600 dark:text-slate-400">{row.date}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-700 dark:text-slate-200">{row.type}</td>
                    <td className="px-8 py-5 text-sm font-semibold text-[#137fec]">{row.entity}</td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white text-right">{row.amount}</td>
                    <td className="px-8 py-5 text-sm font-bold text-center">{row.rate}</td>
                    <td className={`px-8 py-5 text-sm font-bold text-right ${row.pos ? 'text-blue-600' : 'text-emerald-600'}`}>
                      {row.pos ? '+' : '-'}{row.tax}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'Validado' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};

export default TaxManagementDashboard;

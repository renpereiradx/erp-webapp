import React, { useEffect } from 'react';
import { useFinancialReports } from '../hooks/useFinancialReports';
import { formatPYG } from '../utils/currencyUtils';

/**
 * Pantalla de Estado de Resultados (P&L)
 * Integrada con hook y React Best Practices
 */
const ProfitAndLoss = () => {
  const { loading, incomeStatement, fetchIncomeStatement } = useFinancialReports();

  // 1. Effects for browser synchronization
  useEffect(() => {
    document.title = 'Estado de Resultados | ERP System';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 2. Initial Data Fetching
  useEffect(() => {
    fetchIncomeStatement('month', true);
  }, [fetchIncomeStatement]);

  if (loading && !incomeStatement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#137fec]"></div>
        <span className="ml-3 font-bold text-slate-500 uppercase tracking-widest text-xs">Cargando estado de resultados...</span>
      </div>
    );
  }

  // Si no hay datos todavía
  if (!incomeStatement) return null;

  const {
    revenue,
    cost_of_sales,
    gross_profit,
    operating_income,
    net_income,
    comparison
  } = incomeStatement;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <section className="flex flex-wrap justify-between items-end gap-4 px-4 md:px-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-black tracking-tight leading-tight">Estado de Resultados (P&L)</h1>
          <p className="text-slate-500 text-base font-medium">Periodo: mes actual vs periodo anterior</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Mes Actual
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#137fec] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#137fec]/90 transition-colors">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar PDF
          </button>
        </div>
      </section>

      {/* Summary Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-0">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Ingresos Totales</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">{formatPYG(revenue.net_sales)}</p>
            {comparison?.revenue_change_pct && (
              <span className={`text-xs font-bold flex items-center ${comparison.revenue_change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <span className="material-symbols-outlined text-sm">{comparison.revenue_change_pct >= 0 ? 'trending_up' : 'trending_down'}</span>
                {Math.abs(comparison.revenue_change_pct)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Utilidad Bruta</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">{formatPYG(gross_profit.amount)}</p>
            {comparison?.gross_profit_change_pct && (
              <span className={`text-xs font-bold flex items-center ${comparison.gross_profit_change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <span className="material-symbols-outlined text-sm">{comparison.gross_profit_change_pct >= 0 ? 'trending_up' : 'trending_down'}</span>
                {Math.abs(comparison.gross_profit_change_pct)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Utilidad Operativa</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">{formatPYG(operating_income)}</p>
            {comparison?.operating_income_change_pct && (
              <span className={`text-xs font-bold flex items-center ${comparison.operating_income_change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <span className="material-symbols-outlined text-sm">{comparison.operating_income_change_pct >= 0 ? 'trending_up' : 'trending_down'}</span>
                {Math.abs(comparison.operating_income_change_pct)}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Utilidad Neta</p>
          <div className="flex items-baseline gap-2">
            <p className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight">{formatPYG(net_income)}</p>
            {comparison?.net_income_change_pct && (
              <span className={`text-xs font-bold flex items-center ${comparison.net_income_change_pct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                <span className="material-symbols-outlined text-sm">{comparison.net_income_change_pct >= 0 ? 'trending_up' : 'trending_down'}</span>
                {Math.abs(comparison.net_income_change_pct)}%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Cálculo de Utilidad Bruta</h3>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Montos en Guaraníes</span>            </div>
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
                    <td className="py-4 text-right font-bold">{formatPYG(revenue.gross_sales)}</td>
                    <td className="py-4 text-right text-slate-500">-</td>
                    <td className="py-4 text-right text-emerald-600 font-bold">-</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-300">Devoluciones y Descuentos</td>
                    <td className="py-4 text-right font-bold text-rose-600">({formatPYG(revenue.returns + revenue.discounts, { showSymbol: false })})</td>
                    <td className="py-4 text-right text-slate-500">-</td>
                    <td className="py-4 text-right text-rose-600 font-bold">-</td>
                  </tr>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                    <td className="py-4 font-black text-slate-900 dark:text-slate-100">Ventas Netas</td>
                    <td className="py-4 text-right font-black text-slate-900 dark:text-slate-100">{formatPYG(revenue.net_sales)}</td>
                    <td className="py-4 text-right text-slate-500">{formatPYG(comparison?.previous_period?.net_sales || 0)}</td>
                    <td className="py-4 text-right text-emerald-600 font-black">+{comparison?.revenue_change_pct}%</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-medium text-slate-700 dark:text-slate-300">Costo de Ventas (COGS)</td>
                    <td className="py-4 text-right font-bold text-rose-600">({formatPYG(cost_of_sales.cost_of_goods_sold, { showSymbol: false })})</td>
                    <td className="py-4 text-right text-slate-500">({formatPYG(comparison?.previous_period?.cost_of_goods_sold || 0, { showSymbol: false })})</td>
                    <td className="py-4 text-right text-rose-600 font-bold">-</td>
                  </tr>
                  <tr className="border-t-2 border-[#137fec]/20 bg-[#137fec]/5">
                    <td className="py-5 font-black text-[#137fec] text-base tracking-tight">Utilidad Bruta</td>
                    <td className="py-5 text-right font-black text-[#137fec] text-base tracking-tight">{formatPYG(gross_profit.amount)}</td>
                    <td className="py-5 text-right text-slate-500">{formatPYG(comparison?.previous_period?.gross_profit || 0)}</td>
                    <td className="py-5 text-right text-emerald-600 font-black">{comparison?.gross_profit_change_pct >= 0 ? '+' : ''}{comparison?.gross_profit_change_pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Variación por Categoría */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 uppercase text-sm tracking-widest">Variación por Categoría</h3>
            <div className="space-y-6">
              {revenue.by_category?.map((cat, index) => {
                const colors = ['bg-[#137fec]', 'bg-emerald-500', 'bg-rose-500'];
                return (
                  <div key={cat.category_id || index} className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300 uppercase">{cat.category_name}</span>
                      <span className="text-slate-900 dark:text-slate-100">{formatPYG(cat.amount)} ({cat.percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${colors[index % colors.length]} rounded-full`} style={{ width: `${cat.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-8">
          {/* Revenue Breakdown */}
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
              {revenue.by_category?.map((cat, index) => {
                const colors = ['bg-[#137fec]', 'bg-emerald-500', 'bg-amber-400'];
                return (
                  <div key={cat.category_id || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`size-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{cat.category_name}</span>
                    </div>
                    <span className="text-xs font-bold">{cat.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase text-sm tracking-widest">Métodos de Pago</h3>
            <div className="space-y-6">
              {revenue.by_payment_method?.map((method, index) => {
                const icons = ['credit_card', 'account_balance', 'payments'];
                const bgColors = ['bg-blue-50 dark:bg-blue-900/30', 'bg-emerald-50 dark:bg-emerald-900/30', 'bg-slate-50 dark:bg-slate-800'];
                const textColors = ['text-blue-600', 'text-emerald-600', 'text-slate-600'];
                const barColors = ['bg-blue-500', 'bg-emerald-500', 'bg-slate-400'];
                
                return (
                  <div key={method.method || index} className="flex items-center gap-4">
                    <div className={`size-10 rounded-lg ${bgColors[index % bgColors.length]} flex items-center justify-center ${textColors[index % textColors.length]}`}>
                      <span className="material-symbols-outlined">{icons[index % icons.length]}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{method.method}</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{method.percentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${barColors[index % barColors.length]} rounded-full`} style={{ width: `${method.percentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Comparison Bottom Section */}
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
            <p className="text-2xl font-black text-emerald-600">+{formatPYG(comparison?.revenue_change || 0)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Impacto general</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Variación COGS</p>
            <p className="text-2xl font-black text-rose-600">+{formatPYG(comparison?.cogs_change || 0)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Incremento en costos operativos</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Net Margin Gap</p>
            <p className="text-2xl font-black text-emerald-600">+{comparison?.net_margin_gap || 0}% pts</p>
            <p className="text-[10px] text-slate-400 mt-1">Eficiencia de margen neto</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfitAndLoss;

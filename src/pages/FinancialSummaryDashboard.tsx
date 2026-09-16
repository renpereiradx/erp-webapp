import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { useFinancialReports } from '../hooks/useFinancialReports';
import { formatPYG } from '../utils/currencyUtils';

/** Bloques de GET /financial-reports/income-statement que consume esta página. */
interface IncomeStatementData {
  revenue?: { net_sales?: number | string };
  cost_of_sales?: { cost_of_goods_sold?: number | string };
  net_income?: number | string;
  comparison?: {
    revenue_change_pct?: number | null;
    expense_change_pct?: number | null;
    net_income_change_pct?: number | null;
  };
}

/** GET /financial-reports/cash-flow (solo ending_cash se muestra aquí). */
interface CashFlowData {
  ending_cash?: number | string | null;
}

/** GET /financial-reports/health-score. */
interface HealthScoreData {
  score?: number | string | null;
  rating?: string;
  working_capital?: number | string | null;
  current_ratio?: number | null;
  quick_ratio?: number | null;
  net_margin?: number | null;
}

const RATING_LABELS: Record<string, string> = {
  EXCELLENT: 'Excelente',
  GOOD: 'Buena',
  FAIR: 'Aceptable',
  POOR: 'En riesgo',
};

/**
 * Financial Summary Dashboard (BI Assisted)
 * Datos reales: income-statement, health-score y cash-flow del BE
 * (auditoría BI 2H: fuera caja $1.2M, score 84, ratios y pronóstico
 * "$742k Predictive BI" hardcodeados — sin endpoint no se muestra).
 */
const FinancialSummaryDashboard = () => {
  const [period, setPeriod] = useState('Month');
  const [comparePrevious, setComparePrevious] = useState(true);

  const {
    loading,
    incomeStatement,
    fetchIncomeStatement,
    cashFlow,
    fetchCashFlow,
    healthScore,
    fetchHealthScore,
  } = useFinancialReports() as {
    loading: boolean;
    incomeStatement: IncomeStatementData | null;
    fetchIncomeStatement: (period?: string, compare?: boolean) => Promise<unknown>;
    cashFlow: CashFlowData | null;
    fetchCashFlow: (period?: string) => Promise<unknown>;
    healthScore: HealthScoreData | null;
    fetchHealthScore: (period?: string) => Promise<unknown>;
  };

  useEffect(() => {
    const p = period.toLowerCase();
    fetchIncomeStatement(p, comparePrevious);
    fetchCashFlow(p);
    fetchHealthScore(p);
  }, [period, comparePrevious, fetchIncomeStatement, fetchCashFlow, fetchHealthScore]);

    if (loading && !incomeStatement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <span className="ml-3 font-bold text-on-surface-deep uppercase tracking-widest text-xs">Cargando Resumen Financiero...</span>
      </div>
    );
  }

  const score = healthScore?.score != null ? Math.round(Number(healthScore.score)) : null;
  const ratingLabel = (healthScore?.rating && RATING_LABELS[healthScore.rating]) ?? null;
  const pct = (v: number | null | undefined) => (v == null ? '—' : `${v >= 0 ? '+' : ''}${v}%`);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Resumen Financiero</h1>
          <p className="text-sm text-on-surface-deep font-medium">Monitoreo de salud empresarial en tiempo real asistido por BI</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface p-1 rounded-xl shadow-sm border border-border-subtle w-full sm:w-auto">
          <div className="flex h-9 items-center justify-center rounded-lg bg-surface-muted p-1 grow sm:grow-0">
            {['Hoy', 'Semana', 'Mes', 'Año'].map((p) => {
              const value = p === 'Hoy' ? 'Today' : p === 'Semana' ? 'Week' : p === 'Mes' ? 'Month' : 'Year';
              const isSelected = period === value;
              return (
                <label key={p} className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-4 transition-all text-[10px] font-black uppercase tracking-widest ${
                  isSelected ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-deep hover:text-foreground'
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
        </div>
      </div>

      {/* Comparison Toggle */}
      <div className="flex items-center justify-between bg-primary/5 px-6 py-4 rounded-xl border border-primary/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-primary animate-pulse shrink-0"></div>
          <p className="text-foreground text-[10px] font-black uppercase tracking-[0.2em]">Comparar con el período anterior</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={comparePrevious}
            onChange={() => setComparePrevious(!comparePrevious)}
          />
          <div className="w-11 h-6 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border-subtle after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded-full">
              {pct(incomeStatement?.comparison?.revenue_change_pct)}
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-deep mb-1">Ingresos Totales</p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">{formatPYG(incomeStatement?.revenue?.net_sales || 0)}</h3>
        </div>

        {/* Expenses */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-error bg-error/10 px-2 py-1 rounded-full">
              {pct(incomeStatement?.comparison?.expense_change_pct)}
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-deep mb-1">Gastos Operativos</p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">{formatPYG(incomeStatement?.cost_of_sales?.cost_of_goods_sold || 0)}</h3>
        </div>

        {/* Net Income */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
            <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded-full">
              {pct(incomeStatement?.comparison?.net_income_change_pct)}
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-deep mb-1">Utilidad Neta</p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">{formatPYG(incomeStatement?.net_income || 0)}</h3>
        </div>

        {/* Cash Position (real: ending_cash del cash-flow) */}
        <div className="bg-surface p-6 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="size-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-deep mb-1">Posición de Caja</p>
          <h3 className="text-2xl font-black text-foreground tracking-tight">
            {cashFlow?.ending_cash != null ? formatPYG(cashFlow.ending_cash) : '—'}
          </h3>
        </div>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gauge & Health Score (real: /financial-reports/health-score) */}
        <div className="lg:col-span-1 bg-surface p-8 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col items-center text-center">
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight mb-8">Salud Financiera</h3>
          <div className="relative flex items-center justify-center mb-8">
            <svg className="w-48 h-48 transform -rotate-90">
              <circle className="text-surface-subtle" cx="96" cy="96" r="80" stroke="currentColor" strokeDasharray="502" strokeWidth="14" fill="transparent"></circle>
              {score != null && (
                <circle
                  className={score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-error'}
                  cx="96" cy="96" r="80" stroke="currentColor" strokeDasharray="502"
                  strokeDashoffset={502 - (Math.min(score, 100) / 100) * 502}
                  strokeLinecap="round" strokeWidth="14" fill="transparent"
                ></circle>
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-foreground tracking-tight">{score ?? '—'}</span>
              {ratingLabel && (
                <span className={`text-[10px] font-black tracking-widest uppercase mt-1 ${(score ?? 0) >= 70 ? 'text-success' : (score ?? 0) >= 40 ? 'text-warning' : 'text-error'}`}>{ratingLabel}</span>
              )}
            </div>
          </div>
          {healthScore?.working_capital != null && (
            <div className="w-full bg-success/5 p-5 rounded-xl border border-success/20 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-deep">Capital de Trabajo</p>
              <p className="text-lg font-black text-foreground">{formatPYG(healthScore.working_capital)}</p>
            </div>
          )}
        </div>

        {/* Financial Ratios (reales del health-score) */}
        <div className="lg:col-span-2 bg-surface p-8 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Ratios Financieros Clave</h3>
            <span className="material-symbols-outlined text-on-surface-deep">info</span>
          </div>
          <div className="space-y-10 flex-1">
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground uppercase tracking-tight">Current Ratio</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-deep opacity-60">Capacidad de pago a corto plazo</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-foreground tracking-tight">{healthScore?.current_ratio != null ? healthScore.current_ratio.toFixed(2) : '—'}</p>
                  {healthScore?.current_ratio != null && (
                    <p className={`text-[10px] font-black uppercase tracking-widest ${healthScore.current_ratio >= 1 ? 'text-success' : 'text-error'}`}>
                      {healthScore.current_ratio >= 1 ? 'Saludable' : 'Revisar'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground uppercase tracking-tight">Quick Ratio</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-deep opacity-60">Liquidez inmediata</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-foreground tracking-tight">{healthScore?.quick_ratio != null ? healthScore.quick_ratio.toFixed(2) : '—'}</p>
                  {healthScore?.quick_ratio != null && (
                    <p className={`text-[10px] font-black uppercase tracking-widest ${healthScore.quick_ratio >= 1 ? 'text-success' : 'text-error'}`}>
                      {healthScore.quick_ratio >= 1 ? 'Saludable' : 'Revisar'}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground uppercase tracking-tight">Margen Neto</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-deep opacity-60">Rentabilidad operativa</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-foreground tracking-tight">{healthScore?.net_margin != null ? `${healthScore.net_margin.toFixed(1)}%` : '—'}</p>
                </div>
              </div>
              {healthScore?.net_margin != null && (
                <div className="h-2 w-full bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min(Math.max(healthScore.net_margin, 0), 100)}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-subtle flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-deep opacity-40 italic">Fuente: API</span>
            <Link to="/finance/profit-and-loss" className="text-primary text-[11px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
              Detalle
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummaryDashboard;

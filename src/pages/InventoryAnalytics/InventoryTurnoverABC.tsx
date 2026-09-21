import React, { useState, useEffect } from 'react';
import { inventoryAnalyticsService } from '@/services/bi/inventoryAnalyticsService';
import { SummaryCard } from '../../components/InventoryAnalytics/SummaryCard';
import { CategoryTurnoverTable } from '../../components/InventoryAnalytics/CategoryTurnoverTable';
import { ABCParetoChart } from '../../components/InventoryAnalytics/ABCParetoChart';
import { formatNumber } from '../../utils/currencyUtils';
import { ABCProduct, TurnoverCategory } from '../../data/mockInventoryABCData';

// El backend solo acepta estos tokens en ?period= (parsePeriodQuery):
// hoy/semana/mes/año son etiquetas de display, nunca viajan al API.
const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
] as const;

type ApiPeriod = (typeof PERIOD_OPTIONS)[number]['value'];

interface TurnoverResponse {
  overall?: {
    turnover_rate?: number;
    days_of_inventory?: number;
  };
  by_category?: TurnoverCategory[];
}

interface ABCResponse {
  summary?: {
    class_a_value_pct?: number;
    class_b_value_pct?: number;
    class_c_value_pct?: number;
  };
  class_a?: ABCProduct[];
}

export const InventoryTurnoverABC: React.FC = () => {
  const [period, setPeriod] = useState<ApiPeriod>('month');
  const [turnover, setTurnover] = useState<TurnoverResponse | null>(null);
  const [abc, setAbc] = useState<ABCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        // La rotación y el ABC viven en endpoints distintos: la página
        // renderiza ambos pero solo consultaba turnover.
        const [turnoverRes, abcRes] = await Promise.all([
          inventoryAnalyticsService.getTurnover({ period }),
          inventoryAnalyticsService.getABC({ period }),
        ]);
        if (turnoverRes.success) {
          setTurnover(turnoverRes.data);
        }
        if (abcRes.success) {
          setAbc(abcRes.data);
        }
      } catch (err) {
        console.error('Error fetching turnover/ABC data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  if (loading) {
    return <div className="p-8 text-center">Cargando análisis de rotación y ABC...</div>;
  }

  if (error || !turnover) {
    return <div className="p-8 text-center text-error">Error al cargar los datos.</div>;
  }

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period;

  return (
    <div className="w-full max-w-[1200px] px-6 flex flex-col gap-8 mx-auto py-8 font-display">
      {/* Page Title & Period Control */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-foreground text-3xl font-black tracking-tight uppercase">Análisis de Rotación y ABC</h1>
          <p className="text-on-surface-deep text-base font-medium">Análisis detallado de rotación por categoría y valorización ABC en Guaraníes (Gs.)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-10 items-center rounded-lg bg-surface-subtle/50 p-1 shadow-sm font-mono" role="group" aria-label="Período">
            {PERIOD_OPTIONS.map((p) => (
              <label key={p.value} className="flex cursor-pointer h-full items-center justify-center rounded px-4 text-sm font-bold text-on-surface-deep hover:text-foreground transition-all has-[:checked]:bg-surface has-[:checked]:text-primary has-[:checked]:shadow-sm">
                <span>{p.label}</span>
                <input
                  className="hidden"
                  name="periodo"
                  type="radio"
                  value={p.value}
                  checked={period === p.value}
                  onChange={() => setPeriod(p.value)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SummaryCard
          title="Tasa Promedio de Rotación"
          icon="sync_alt"
          value={`${formatNumber(turnover.overall?.turnover_rate ?? 0)}x`}
          changeDescription={`Vs. periodo anterior (${periodLabel})`}
          isPositiveGood={true}
        />
        <SummaryCard
          title="Días Promedio de Inventario"
          icon="calendar_today"
          value={`${Math.round(turnover.overall?.days_of_inventory ?? 0)} días`}
          changeDescription="Eficiencia en la gestión de stock"
          isPositiveGood={false}
        />
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CategoryTurnoverTable categories={turnover.by_category ?? []} />
        <ABCParetoChart
          classAProducts={abc?.class_a ?? []}
          classAPct={abc?.summary?.class_a_value_pct}
          classBPct={abc?.summary?.class_b_value_pct}
          classCPct={abc?.summary?.class_c_value_pct}
        />
      </div>
    </div>
  );
};

export default InventoryTurnoverABC;

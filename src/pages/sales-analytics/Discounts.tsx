import { useEffect, useMemo, useState } from 'react';
import { Calendar, Percent, RefreshCw } from 'lucide-react';

import salesAnalyticsService from '@/services/bi/salesAnalyticsService';
import { useI18n } from '@/lib/i18n';

type GroupBy = 'seller' | 'applier' | 'branch';

interface DiscountSummaryRow {
  group_key: string;
  group_name: string;
  discount_count: number;
  total_discount: number;
}

interface DiscountLine {
  sale_id: string;
  sale_date: string;
  branch_id: number | null;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price_original: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number | null;
  discount_reason: string | null;
  discount_applied_by: string;
  applied_by_name: string;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(value);
}

/** Reporte "quién descontó cuánto" (gate reports:read — BE y nav). */
export default function Discounts() {
  const { t } = useI18n() as unknown as { t: (key: string, fallback?: string, vars?: Record<string, unknown>) => string };
  const today = useMemo(() => new Date(), []);
  const monthAgo = useMemo(() => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), []);
  const [startDate, setStartDate] = useState(toISODate(monthAgo));
  const [endDate, setEndDate] = useState(toISODate(today));
  const [groupBy, setGroupBy] = useState<GroupBy>('seller');
  const [summary, setSummary] = useState<DiscountSummaryRow[]>([]);
  const [lines, setLines] = useState<DiscountLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const groupByOptions: Array<{ value: GroupBy; label: string }> = [
    { value: 'seller', label: t('bi.discounts.groupBySeller', 'Por vendedor') },
    { value: 'applier', label: t('bi.discounts.groupByApplier', 'Por aplicador') },
    { value: 'branch', label: t('bi.discounts.groupByBranch', 'Por sucursal') },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, linesRes] = await Promise.all([
        salesAnalyticsService.getDiscountsSummary({ start_date: startDate, end_date: endDate, group_by: groupBy }),
        salesAnalyticsService.getDiscounts({ start_date: startDate, end_date: endDate }),
      ]);
      setSummary(summaryRes?.success ? (summaryRes.data ?? []) : []);
      setLines(linesRes?.success ? (linesRes.data ?? []) : []);
    } catch (err: any) {
      console.error('Error fetching discounts report:', err);
      setError(err?.message || t('bi.discounts.loadError', 'Error al cargar el reporte de descuentos'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy]);

  return (
    <div className="flex flex-col gap-lg animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div className="space-y-xs">
          <h1 className="text-title-xl font-black tracking-tight text-foreground uppercase leading-none flex items-center gap-sm">
            <Percent className="text-primary" size={28} />
            {t('bi.discounts.title', 'Descuentos en Ventas')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t('bi.discounts.subtitle', 'Quién descontó cuánto, por vendedor, aplicador y sucursal.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <label className="sr-only" htmlFor="discounts-start">
            {t('bi.discounts.startDate', 'Fecha desde')}
          </label>
          <input
            id="discounts-start"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 rounded-md border border-border-subtle bg-surface px-sm text-body-sm text-foreground"
          />
          <label className="sr-only" htmlFor="discounts-end">
            {t('bi.discounts.endDate', 'Fecha hasta')}
          </label>
          <input
            id="discounts-end"
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 rounded-md border border-border-subtle bg-surface px-sm text-body-sm text-foreground"
          />
          <button
            onClick={() => void fetchData()}
            className="h-9 inline-flex items-center gap-xs rounded-md bg-primary px-md text-body-sm-bold text-primary-foreground shadow-fluent-2 hover:bg-primary/90 transition-colors"
          >
            <Calendar size={16} />
            {t('common.apply', 'Aplicar')}
          </button>
        </div>
      </div>

      {/* Group-by toggle */}
      <div role="tablist" aria-label={t('bi.discounts.groupByLabel', 'Agrupar descuentos')} className="inline-flex rounded-md border border-border-subtle bg-surface-muted p-xs gap-xs self-start">
        {groupByOptions.map((opt) => (
          <button
            key={opt.value}
            role="tab"
            aria-selected={groupBy === opt.value}
            onClick={() => setGroupBy(opt.value)}
            className={`px-md py-xs rounded text-body-sm-bold transition-colors ${
              groupBy === opt.value ? 'bg-surface text-foreground shadow-whisper' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-md rounded-md border border-destructive/30 bg-destructive/10 text-body-md text-destructive" role="alert">
          {error}
        </div>
      )}

      {/* Summary */}
      <section className="rounded-lg border border-border-subtle bg-surface shadow-fluent-2 overflow-hidden">
        <h2 className="text-label-caps uppercase text-muted-foreground p-md pb-sm">{t('bi.discounts.summaryTitle', 'Resumen')}</h2>
        {loading ? (
          <p className="p-md text-body-md text-muted-foreground flex items-center gap-sm">
            <RefreshCw className="animate-spin" size={16} />
            {t('common.loading', 'Cargando…')}
          </p>
        ) : summary.length === 0 ? (
          <p className="p-md text-body-md text-muted-foreground">{t('bi.discounts.empty', 'Sin descuentos en el período seleccionado.')}</p>
        ) : (
          <table className="w-full text-body-md">
            <thead>
              <tr className="border-b border-border-subtle bg-surface-muted">
                <th className="text-left text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colGroup', 'Grupo')}</th>
                <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colCount', 'Descuentos')}</th>
                <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colTotal', 'Total descontado')}</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((row) => (
                <tr key={row.group_key} className="border-b border-border-subtle last:border-0">
                  <td className="py-sm px-md text-body-md-bold text-foreground">{row.group_name || row.group_key}</td>
                  <td className="py-sm px-md text-right font-data-mono text-data-mono text-muted-foreground">{row.discount_count}</td>
                  <td className="py-sm px-md text-right font-data-mono text-data-mono text-primary">{formatCurrency(row.total_discount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Lines detail */}
      <section className="rounded-lg border border-border-subtle bg-surface shadow-fluent-2 overflow-hidden">
        <h2 className="text-label-caps uppercase text-muted-foreground p-md pb-sm">{t('bi.discounts.linesTitle', 'Líneas con descuento')}</h2>
        {!loading && lines.length === 0 ? (
          <p className="p-md text-body-md text-muted-foreground">{t('bi.discounts.empty', 'Sin descuentos en el período seleccionado.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-md">
              <thead>
                <tr className="border-b border-border-subtle bg-surface-muted">
                  <th className="text-left text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colSale', 'Venta')}</th>
                  <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colQty', 'Cant.')}</th>
                  <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colOriginal', 'Precio original')}</th>
                  <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colFinal', 'Precio final')}</th>
                  <th className="text-right text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colDiscount', 'Descuento')}</th>
                  <th className="text-left text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colAppliedBy', 'Aplicado por')}</th>
                  <th className="text-left text-label-caps uppercase text-muted-foreground py-sm px-md">{t('bi.discounts.colReason', 'Motivo')}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={`${line.sale_id}-${idx}`} className="border-b border-border-subtle last:border-0 hover:bg-surface-muted transition-colors">
                    <td className="py-sm px-md font-data-mono text-data-mono text-foreground">{line.sale_id}</td>
                    <td className="py-sm px-md text-right font-data-mono text-data-mono text-muted-foreground">x{line.quantity}</td>
                    <td className="py-sm px-md text-right font-data-mono text-data-mono text-muted-foreground">{formatCurrency(line.unit_price_original)}</td>
                    <td className="py-sm px-md text-right font-data-mono text-data-mono text-muted-foreground">{formatCurrency(line.unit_price)}</td>
                    <td className="py-sm px-md text-right font-data-mono text-data-mono text-primary">
                      {formatCurrency(line.discount_amount)}
                      {line.discount_percent != null && (
                        <span className="ml-xs text-label-caps text-muted-foreground">({line.discount_percent}%)</span>
                      )}
                    </td>
                    <td className="py-sm px-md text-body-sm text-foreground">{line.applied_by_name}</td>
                    <td className="py-sm px-md text-body-sm text-muted-foreground">{line.discount_reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

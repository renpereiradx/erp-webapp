/**
 * Panel de análisis del ledger:
 *  - GET /stock-transactions/movement-summary (resumen initial/final/net por producto)
 *  - GET /stock-transactions/validate-consistency (ledger vs snapshot)
 *  - GET /stock-transactions/discrepancy-report (discrepancias por rango)
 * Diseño: DESIGN.md (tokens, Table ui/, DataState).
 */

import { useState } from 'react';
import { BarChart3, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatNumber } from '@/utils/currencyUtils';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function MovementSummaryPanel() {
  const { t } = useI18n();
  const summary = useStockMovementsStore((s) => s.summary);
  const consistency = useStockMovementsStore((s) => s.consistency);
  const discrepancies = useStockMovementsStore((s) => s.discrepancies);
  const loading = useStockMovementsStore((s) => s.loading);
  const fetchSummary = useStockMovementsStore((s) => s.fetchSummary);
  const fetchConsistency = useStockMovementsStore((s) => s.fetchConsistency);
  const fetchDiscrepancies = useStockMovementsStore((s) => s.fetchDiscrepancies);

  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  const runSummary = () => fetchSummary(startDate, endDate);
  const runConsistency = () => fetchConsistency();
  const runDiscrepancies = () => fetchDiscrepancies(startDate, endDate);

  return (
    <div className="flex flex-col gap-lg">
      {/* Rango compartido */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle p-lg flex flex-wrap items-end gap-3">
        <div className="space-y-xs">
          <Label htmlFor="s-from" className="text-body-sm-bold text-muted-foreground uppercase">
            {t('stockMovements.summary.from', 'Desde')}
          </Label>
          <Input id="s-from" type="date" className="h-10" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-xs">
          <Label htmlFor="s-to" className="text-body-sm-bold text-muted-foreground uppercase">
            {t('stockMovements.summary.to', 'Hasta')}
          </Label>
          <Input id="s-to" type="date" className="h-10" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="primary" onClick={runSummary} disabled={loading}>
            {t('stockMovements.summary.loadSummary', 'Resumen')}
          </Button>
          <Button variant="secondary" onClick={runDiscrepancies} disabled={loading}>
            {t('stockMovements.summary.loadDiscrepancies', 'Discrepancias')}
          </Button>
          <Button variant="secondary" onClick={runConsistency} disabled={loading}>
            {t('stockMovements.summary.loadConsistency', 'Consistencia')}
          </Button>
        </div>
      </div>

      {/* Resumen de movimientos */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
        <h3 className="text-title-md text-foreground font-bold flex items-center gap-2 p-lg pb-md">
          <BarChart3 className="w-5 h-5 text-primary" />
          {t('stockMovements.summary.title', 'Resumen de Movimientos')}
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-muted">
              <TableRow>
                <TableHead className="text-label-caps uppercase text-muted-foreground">Producto</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">{t('stockMovements.summary.initial', 'Inicial')}</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">{t('stockMovements.summary.in', 'Entradas')}</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">{t('stockMovements.summary.out', 'Salidas')}</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">{t('stockMovements.summary.net', 'Neto')}</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">{t('stockMovements.summary.final', 'Final')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <p className="text-muted-foreground italic">
                      {t('stockMovements.summary.empty', 'Cargá el resumen para un rango.')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                summary.map((s) => (
                  <TableRow key={s.product_id} className="hover:bg-surface-muted transition-colors duration-150">
                    <TableCell>
                      <span className="font-data-mono text-primary font-bold">{s.product_id}</span>
                      {s.product_name ? <span className="block text-body-sm-bold text-muted-foreground">{s.product_name}</span> : null}
                    </TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">{formatNumber(s.initial_stock)}</TableCell>
                    <TableCell className="text-right font-data-mono text-success">+{formatNumber(s.total_in)}</TableCell>
                    <TableCell className="text-right font-data-mono text-error">-{formatNumber(s.total_out)}</TableCell>
                    <TableCell className={`text-right font-data-mono font-bold ${s.net_change >= 0 ? 'text-success' : 'text-error'}`}>
                      {s.net_change >= 0 ? '+' : ''}
                      {formatNumber(s.net_change)}
                    </TableCell>
                    <TableCell className="text-right font-data-mono font-bold text-foreground">{formatNumber(s.final_stock)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Consistencia ledger vs snapshot */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
        <h3 className="text-title-md text-foreground font-bold flex items-center gap-2 p-lg pb-md">
          <ShieldCheck className="w-5 h-5 text-primary" />
          {t('stockMovements.summary.consistency', 'Consistencia Ledger vs Snapshot')}
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-muted">
              <TableRow>
                <TableHead className="text-label-caps uppercase text-muted-foreground">Producto</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">Snapshot</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">Ledger</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">Δ</TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consistency.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-14 text-center">
                    <p className="text-muted-foreground italic">
                      {t('stockMovements.summary.consistencyEmpty', 'Ejecutá "Consistencia".')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                consistency.map((c) => (
                  <TableRow key={c.product_id} className="hover:bg-surface-muted transition-colors duration-150">
                    <TableCell className="text-body-md font-data-mono text-primary font-bold">{c.product_id}</TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">{formatNumber(c.snapshot_stock)}</TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">{formatNumber(c.ledger_stock)}</TableCell>
                    <TableCell className="text-right font-data-mono text-foreground">{formatNumber(c.discrepancy)}</TableCell>
                    <TableCell>
                      <Badge variant={c.is_consistent ? 'success' : 'destructive'} size="sm">
                        {c.is_consistent
                          ? t('stockMovements.summary.consistent', 'Consistente')
                          : t('stockMovements.summary.inconsistent', 'Inconsistente')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Discrepancias */}
      <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden p-lg">
        <h3 className="text-title-md text-foreground font-bold flex items-center gap-2 pb-md">
          <AlertTriangle className="w-5 h-5 text-primary" />
          {t('stockMovements.summary.discrepancies', 'Discrepancias')}
        </h3>
        {discrepancies.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground italic">
            {t('stockMovements.summary.discrepanciesEmpty', 'Sin discrepancias para el rango.')}
          </p>
        ) : (
          <ul className="text-body-md space-y-1">
            {discrepancies.map((d, i) => (
              <li key={`${d.product_id ?? i}-${i}`} className="py-1 border-b border-divider">
                <span className="font-data-mono text-primary font-bold text-body-sm-bold">{d.product_id}</span>
                {d.product_name ? <span className="text-muted-foreground"> — {String(d.product_name)}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * Tabla de historial de movimientos del ledger (/stock-transactions/*).
 * Soporta dos vistas:
 *  - Por producto: GET /stock-transactions/product/{id} (incluye las variantes del producto).
 *  - Por rango de fecha: GET /stock-transactions/by-date
 * Diseño: DESIGN.md (tokens, DataState, Table ui/).
 */

import { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
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
import DataState from '@/components/ui/DataState';
import { formatNumber } from '@/utils/currencyUtils';
import { useStockMovementsStore } from '@/store/useStockMovementsStore';
import type { StockTransactionHistory } from '../types';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function MovementsHistoryTable() {
  const { t } = useI18n();
  const history = useStockMovementsStore((s) => s.history);
  const dateMovements = useStockMovementsStore((s) => s.dateMovements);
  const transactionTypes = useStockMovementsStore((s) => s.transactionTypes);
  const loading = useStockMovementsStore((s) => s.loading);
  const error = useStockMovementsStore((s) => s.error);
  const fetchHistory = useStockMovementsStore((s) => s.fetchHistory);
  const fetchByDate = useStockMovementsStore((s) => s.fetchByDate);

  const [view, setView] = useState<'product' | 'date'>('product');
  const [productId, setProductId] = useState('');
  const [startDate, setStartDate] = useState(daysAgoISO(30));
  const [endDate, setEndDate] = useState(todayISO());

  const rows = view === 'product' ? history : dateMovements;

  const run = async () => {
    if (view === 'product') {
      if (!productId.trim()) return;
      await fetchHistory(productId.trim(), 50, 0);
    } else {
      await fetchByDate({ startDate, endDate });
    }
  };

  const typeLabel = (tt: string) =>
    transactionTypes?.[tt] || t(`stockMovements.types.${tt}`, tt);

  const isDeltaPositive = (n: number) => n > 0;

  return (
    <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
      <div className="p-lg pb-0">
        <h2 className="text-title-md text-foreground font-bold flex items-center gap-2 mb-md">
          <History className="w-5 h-5 text-primary" />
          {t('stockMovements.history.title', 'Historial de Movimientos')}
        </h2>
      </div>

      {/* Controles */}
      <div className="px-lg pb-lg flex flex-wrap items-end gap-3">
        <div className="flex gap-1 p-1 bg-surface-muted rounded-md">
          {(['product', 'date'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 h-8 rounded-button text-body-sm-bold uppercase transition-all ${
                view === v ? 'bg-surface shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t(`stockMovements.history.view.${v}`)}
            </button>
          ))}
        </div>

        {view === 'product' ? (
          <div className="flex-1 min-w-[220px] space-y-xs">
            <Label htmlFor="h-product-id" className="text-body-sm-bold text-muted-foreground uppercase">
              {t('stockMovements.history.productIdLabel', 'ID de producto')}
            </Label>
            <Input
              id="h-product-id"
              type="text"
              className="h-10"
              placeholder={t('stockMovements.history.productIdPlaceholder', 'ID de producto')}
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
            />
          </div>
        ) : (
          <>
            <div className="space-y-xs">
              <Label htmlFor="h-from" className="text-body-sm-bold text-muted-foreground uppercase">
                {t('stockMovements.summary.from', 'Desde')}
              </Label>
              <Input
                id="h-from"
                type="date"
                className="h-10"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-xs">
              <Label htmlFor="h-to" className="text-body-sm-bold text-muted-foreground uppercase">
                {t('stockMovements.summary.to', 'Hasta')}
              </Label>
              <Input
                id="h-to"
                type="date"
                className="h-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        <Button variant="primary" onClick={run} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {t('stockMovements.history.refresh', 'Consultar')}
        </Button>
      </div>

      {/* Estados de datos */}
      {loading ? (
        <div className="px-lg pb-lg">
          <DataState variant="loading" skeletonProps={{ count: 5, variant: 'list' }} testId="history-loading" />
        </div>
      ) : error ? (
        <div className="px-lg pb-lg">
          <DataState variant="error" title={t('stockMovements.history.errorTitle', 'Error al cargar')} message={error} onRetry={run} testId="history-error" />
        </div>
      ) : rows.length === 0 ? (
        <div className="px-lg pb-lg">
          <DataState
            variant="empty"
            title={t('stockMovements.history.empty', 'Sin movimientos para mostrar.')}
            description={t('stockMovements.history.emptyHint', 'Consultá por producto o rango de fechas.')}
            testId="history-empty"
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-surface-muted">
              <TableRow>
                <TableHead className="text-label-caps uppercase text-muted-foreground">
                  {t('stockMovements.history.col.date', 'Fecha')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground">
                  {t('stockMovements.history.col.type', 'Tipo')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                  {t('stockMovements.history.col.delta', 'Δ')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                  {t('stockMovements.history.col.balance', 'Saldo')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground">
                  {t('stockMovements.history.col.reason', 'Motivo')}
                </TableHead>
                <TableHead className="text-label-caps uppercase text-muted-foreground">
                  {t('stockMovements.history.col.operator', 'Operador')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row: StockTransactionHistory) => (
                <TableRow key={row.id} className="hover:bg-surface-muted transition-colors duration-150">
                  <TableCell className="text-body-md text-muted-foreground whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" size="sm">
                      {typeLabel(row.transaction_type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-data-mono font-bold ${
                      isDeltaPositive(row.quantity_change) ? 'text-success' : 'text-error'
                    }`}
                  >
                    {row.quantity_change > 0 ? '+' : ''}
                    {formatNumber(row.quantity_change)}
                  </TableCell>
                  <TableCell className="text-right font-data-mono text-foreground">
                    {row.balance_after !== undefined ? formatNumber(row.balance_after) : '—'}
                  </TableCell>
                  <TableCell className="text-body-md text-foreground max-w-[220px] truncate" title={row.reason ?? ''}>
                    {row.reason || '—'}
                  </TableCell>
                  <TableCell className="text-body-md text-muted-foreground">
                    {(row.metadata as any)?.operator || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

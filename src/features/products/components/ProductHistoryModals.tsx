import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { formatCurrency } from '@/utils/currencyUtils';
import { cn } from '@/lib/utils';
import { usePriceTransactions } from '@/hooks/usePriceTransactions';
import { useCostTransactions } from '@/hooks/useCostTransactions';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';

interface CommonModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Chip que identifica a qué variante pertenece una transacción de precio.
 * Las variantes conviven con el padre en price_transactions (mismo
 * product_id), así que sin esta etiqueta el historial es ambiguo.
 */
const VariantTag: React.FC<{ name?: string; id?: string | null }> = ({ name, id }) => (
  <span className="text-body-sm-bold rounded-full px-2 py-0.5 bg-primary-fixed text-on-primary-fixed whitespace-nowrap">
    {name || id || '?'}
  </span>
);

const historyHeadClass = 'text-label-caps uppercase text-on-surface-deep bg-surface-muted';

/** Estado de carga con forma de tabla (§6.7). */
const HistorySkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-md p-md" aria-busy="true">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-8 w-full bg-surface-muted" />
    ))}
  </div>
);

const HistoryError: React.FC<{ message: string }> = ({ message }) => (
  <div className="p-lg text-center bg-error-container text-on-error-container rounded-md" role="alert">
    <ShieldAlert className="mx-auto mb-sm" size={32} />
    <p className="text-body-md-bold">{message}</p>
  </div>
);

const HistoryEmpty: React.FC<{ message: string }> = ({ message }) => (
  <p className="text-center py-xl text-body-md text-on-surface-deep">{message}</p>
);

// ----------------------------------------------------------------------------
// 1. ProductPriceHistoryDialog
// ----------------------------------------------------------------------------
export function ProductPriceHistoryDialog({ productId, productName, isOpen, onClose, variantNameById }: CommonModalProps & {
  // Mapa variant_id → nombre para etiquetar filas de variantes (opcional:
  // sin mapa se muestra el id crudo).
  variantNameById?: Record<string, string>;
}) {
  const { t } = useI18n();
  const { getProductHistory, loading, error, formatTransactionType } = usePriceTransactions();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && productId) {
      getProductHistory(productId, 0, 50)
        .then((res: any) => {
          setHistory(res?.history || res || []);
        })
        .catch(err => console.error("Error loading price history:", err));
    }
  }, [isOpen, productId, getProductHistory]);

  if (!isOpen) return null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('products.history.price.title', 'Historial de Precios de Venta')}
      subtitle={productName}
      variant="default"
      size="lg"
      className="rounded-xl flex flex-col"
      testId="price-history-modal"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('action.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <HistoryError message={error} />
      ) : history.length === 0 ? (
        <HistoryEmpty message={t('products.history.empty_prices', 'No hay cambios de precio registrados para este producto.')} />
      ) : (
        <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className={historyHeadClass}>{t('products.history.table.date', 'Fecha')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.type', 'Tipo')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.change', 'Cambio')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.user', 'Usuario')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.reason', 'Motivo')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item: any, i: number) => {
                const priceChange = item.price_change || (item.new_price - item.old_price);
                const isIncrease = priceChange > 0;
                const variantId: string | null = item.variant_id || item.metadata?.variant_id || null;
                return (
                  <TableRow key={item.transaction_id || i} className="hover:bg-surface-muted transition-colors duration-150">
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep whitespace-nowrap">
                      {new Date(item.transaction_date || item.effective_date).toLocaleDateString('es-PY', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="text-body-md text-foreground whitespace-nowrap">
                      <div className="flex flex-col gap-xs">
                        <span>{formatTransactionType(item.transaction_type)}</span>
                        {variantId && (
                          <VariantTag id={variantId} name={variantNameById?.[variantId]} />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-xs">
                        <span className="text-data-mono font-data-mono text-foreground">
                          {formatCurrency(item.old_price)} → {formatCurrency(item.new_price)}
                        </span>
                        <span className={cn(
                          'flex items-center gap-xs text-data-mono font-data-mono',
                          isIncrease ? 'text-success' : priceChange < 0 ? 'text-error' : 'text-on-surface-deep'
                        )}>
                          {isIncrease ? <TrendingUp className="w-4 h-4" /> : priceChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                          {isIncrease ? '+' : ''}{formatCurrency(priceChange)}
                          {item.price_change_percent != null && ` (${isIncrease ? '+' : ''}${item.price_change_percent.toFixed(1)}%)`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-body-md text-foreground">
                      {item.user_name || item.user_id || t('products.history.system', 'Sistema')}
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep max-w-xs truncate" title={item.reason}>
                      {item.reason || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </EnhancedModal>
  );
}

// ----------------------------------------------------------------------------
// 2. ProductCostHistoryDialog
// ----------------------------------------------------------------------------
export function ProductCostHistoryDialog({ productId, productName, isOpen, onClose }: CommonModalProps) {
  const { t } = useI18n();
  const { getCostTransactionHistory, loading, error } = useCostTransactions();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && productId) {
      getCostTransactionHistory(productId, { limit: 50 })
        .then((res: any) => {
          setHistory(res?.history || res?.data || res || []);
        })
        .catch(err => console.error("Error loading cost history:", err));
    }
  }, [isOpen, productId, getCostTransactionHistory]);

  if (!isOpen) return null;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('products.history.cost.title', 'Historial de Costos de Compra')}
      subtitle={productName}
      variant="default"
      size="lg"
      className="rounded-xl flex flex-col"
      testId="cost-history-modal"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            {t('action.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <HistoryError message={error} />
      ) : history.length === 0 ? (
        <HistoryEmpty message={t('products.history.empty_costs', 'No hay transacciones de costo registradas para este producto.')} />
      ) : (
        <div className="rounded-md bg-surface shadow-whisper border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className={historyHeadClass}>{t('products.history.table.date', 'Fecha')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.details.table.unit')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.cost', 'Costo')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.source', 'Fuente')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.user', 'Usuario')}</TableHead>
                <TableHead className={historyHeadClass}>{t('products.history.table.reason', 'Motivo')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item: any, i: number) => {
                const costChange = item.price_change || (item.new_price - item.old_price) || 0;
                const isIncrease = costChange > 0;
                const costVal = item.cost_per_unit || item.new_price;
                const sourceText = item.source || (item.metadata?.source === 'demo_mode' ? 'DEMO' : 'MANUAL');
                return (
                  <TableRow key={item.id || item.transaction_id || i} className="hover:bg-surface-muted transition-colors duration-150">
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep whitespace-nowrap">
                      {(() => {
                        const dateVal = item.transaction_date || item.created_at || item.effective_from;
                        return dateVal ? new Date(dateVal).toLocaleString('es-PY', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-';
                      })()}
                    </TableCell>
                    <TableCell className="text-body-md text-foreground whitespace-nowrap">
                      {item.unit || 'unit'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex flex-col gap-xs">
                        <span className="text-data-mono font-data-mono text-foreground">
                          {formatCurrency(costVal)}
                        </span>
                        {item.old_price != null && item.new_price != null && (
                          <span className={cn(
                            'flex items-center gap-xs text-data-mono font-data-mono',
                            isIncrease ? 'text-error' : costChange < 0 ? 'text-success' : 'text-on-surface-deep'
                          )}>
                            {isIncrease ? <TrendingUp className="w-4 h-4" /> : costChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                            {isIncrease ? '+' : ''}{formatCurrency(costChange)}
                            {item.price_change_percent != null && ` (${isIncrease ? '+' : ''}${item.price_change_percent.toFixed(1)}%)`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={cn(
                          'text-body-sm-bold rounded-full px-2 py-0.5',
                          sourceText === 'PURCHASE'
                            ? 'bg-primary-fixed text-on-primary-fixed'
                            : 'bg-secondary-fixed text-on-secondary-fixed'
                        )}
                      >
                        {sourceText}
                      </span>
                    </TableCell>
                    <TableCell className="text-body-md text-foreground">
                      {item.created_by || item.user_name || t('products.history.system', 'Sistema')}
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep max-w-xs truncate" title={item.reason || item.metadata?.reason}>
                      {item.reason || item.metadata?.reason || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </EnhancedModal>
  );
}

// ----------------------------------------------------------------------------
// 3. ProductPriceAdjustmentDialog
// ----------------------------------------------------------------------------
interface AdjustmentProps extends CommonModalProps {
  currentPriceOrCost: number;
  unit: string;
  // Cuando el ajuste viene de una fila de VARIANTE de la tabla de precios,
  // viaja variant_id: sin él el backend upsertea la fila del producto padre
  // (owner report 2026-09-14).
  variantId?: string | null;
  variantName?: string;
  onSuccess?: () => void;
}

export function ProductPriceAdjustmentDialog({ productId, productName, currentPriceOrCost, unit, variantId, variantName, isOpen, onClose, onSuccess }: AdjustmentProps) {
  const { t } = useI18n();
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [costFactor, setCostFactor] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  // El write va directo por priceAdjustmentService (no lanza): el error se
  // guarda local para que el modal NO se cierre ante un fallo.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPrice('');
      setReason('');
      setCostFactor('');
      setMarginPercent('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || parseFloat(newPrice) <= 0) return;

    setLoading(true);
    setError(null);
    try {
      // /manual_adjustment/price (no /price-transactions): es el único write
      // path variant-aware — registra el ajuste Y su price_transaction.
      const result = await priceAdjustmentService.createPriceAdjustment({
        product_id: productId,
        variant_id: variantId || undefined,
        new_price: parseFloat(newPrice),
        unit: unit || 'unit',
        reason: reason || 'Ajuste manual desde ficha',
        adjustment_type: 'MANUAL_ADJUSTMENT',
        old_price: currentPriceOrCost,
        metadata: {
          source: 'product_details',
          ...(costFactor ? { cost_factor: parseFloat(costFactor) } : {}),
          ...(marginPercent ? { margin_percent: parseFloat(marginPercent) } : {})
        }
      });
      if (!result.success) {
        throw new Error(result.error || 'Error al registrar el ajuste');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentVal = parseFloat(newPrice) || 0;
  const diff = currentVal ? currentVal - currentPriceOrCost : 0;
  const pct = currentPriceOrCost ? (diff / currentPriceOrCost) * 100 : 0;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('products.adjust.price.title', 'Ajustar Precio de Venta')}
      subtitle={productName}
      variant="default"
      size="md"
      closeOnOverlayClick={false}
      className="rounded-xl flex flex-col"
      testId="price-adjustment-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('products.modal.action.cancel')}
          </Button>
          <Button type="submit" form="price-adjustment-form" variant="primary" loading={loading} disabled={loading || !newPrice}>
            {loading ? t('products.modal.action.saving') : t('products.adjust.action.save', 'Guardar Cambio')}
          </Button>
        </div>
      }
    >
      <form id="price-adjustment-form" onSubmit={handleSubmit} className="space-y-md">
        {error && (
          <div className="p-sm bg-error-container text-on-error-container rounded-md text-body-md" role="alert">
            {error}
          </div>
        )}

        <div className="p-sm bg-primary-fixed text-on-primary-fixed rounded-md flex justify-between text-body-md-bold">
          <span>
            {t('products.adjust.current_price', 'Precio Actual:')}
            {variantId && (
              <span className="block text-body-sm-bold opacity-80">
                {t('products.details.table.variant_tag', 'Variante')}: {variantName || variantId}
              </span>
            )}
          </span>
          <span className="text-data-mono font-data-mono">{formatCurrency(currentPriceOrCost)} / {unit}</span>
        </div>

        <div className="space-y-xs">
          <Label htmlFor="new_price" className="text-body-md-bold text-foreground">{t('products.adjust.new_price', 'Nuevo Precio')}</Label>
          <Input
            id="new_price"
            type="number"
            step="0.01"
            min="0.01"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="0.00"
            required
            className="text-data-mono font-data-mono"
          />
          {newPrice && (
            <span className={cn(
              'text-body-sm-bold block',
              diff >= 0 ? 'text-success' : 'text-error'
            )}>
              {t('products.adjust.difference', { value: `${diff >= 0 ? '+' : ''}${formatCurrency(diff)} (${diff >= 0 ? '+' : ''}${pct.toFixed(2)}%)` })}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="cost_factor" className="text-body-md-bold text-foreground">{t('products.adjust.cost_factor', 'Factor Costo (0 - 1)')}</Label>
            <Input
              id="cost_factor"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={costFactor}
              onChange={(e) => setCostFactor(e.target.value)}
              placeholder="0.65"
              className="text-data-mono font-data-mono"
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor="margin_percent" className="text-body-md-bold text-foreground">{t('products.adjust.margin_percent', 'Margen %')}</Label>
            <Input
              id="margin_percent"
              type="number"
              step="0.1"
              min="0"
              value={marginPercent}
              onChange={(e) => setMarginPercent(e.target.value)}
              placeholder="35.0"
              className="text-data-mono font-data-mono"
            />
          </div>
        </div>

        <div className="space-y-xs">
          <Label htmlFor="adjust-price-reason" className="text-body-md-bold text-foreground">{t('products.adjust.reason', 'Motivo del Ajuste')}</Label>
          <Textarea
            id="adjust-price-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('products.adjust.placeholder.reason_price', 'Ej. Análisis de precios de mercado, incremento del costo de envío...')}
            rows={2}
            required
            className=""
          />
        </div>
      </form>
    </EnhancedModal>
  );
}

// ----------------------------------------------------------------------------
// 4. ProductCostAdjustmentDialog
// ----------------------------------------------------------------------------
export function ProductCostAdjustmentDialog({ productId, productName, currentPriceOrCost, unit, isOpen, onClose, onSuccess }: AdjustmentProps) {
  const { t } = useI18n();
  const { registerManualCostAdjustment, loading, error, clearError } = useCostTransactions();
  const [newCost, setNewCost] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewCost('');
      setReason('');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost || parseFloat(newCost) < 0 || !reason.trim()) return;

    try {
      await registerManualCostAdjustment({
        product_id: productId,
        unit: unit || 'unit',
        new_cost: parseFloat(newCost),
        reason: reason.trim(),
        metadata: {
          source: 'product_details'
        }
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const currentVal = parseFloat(newCost) || 0;
  const diff = currentVal ? currentVal - currentPriceOrCost : 0;
  const pct = currentPriceOrCost ? (diff / currentPriceOrCost) * 100 : 0;

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('products.adjust.cost.title', 'Ajustar Costo de Compra')}
      subtitle={productName}
      variant="default"
      size="md"
      closeOnOverlayClick={false}
      className="rounded-xl flex flex-col"
      testId="cost-adjustment-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('products.modal.action.cancel')}
          </Button>
          <Button type="submit" form="cost-adjustment-form" variant="primary" loading={loading} disabled={loading || !newCost || !reason.trim()}>
            {loading ? t('products.modal.action.saving') : t('products.adjust.action.save', 'Guardar Cambio')}
          </Button>
        </div>
      }
    >
      <form id="cost-adjustment-form" onSubmit={handleSubmit} className="space-y-md">
        {error && (
          <div className="p-sm bg-error-container text-on-error-container rounded-md text-body-md" role="alert">
            {error}
          </div>
        )}

        <div className="p-sm bg-secondary-fixed text-on-secondary-fixed rounded-md flex justify-between text-body-md-bold">
          <span>{t('products.adjust.current_cost', 'Costo Actual:')}</span>
          <span className="text-data-mono font-data-mono">{formatCurrency(currentPriceOrCost)} / {unit}</span>
        </div>

        <div className="space-y-xs">
          <Label htmlFor="new_cost" className="text-body-md-bold text-foreground">{t('products.adjust.new_cost', 'Nuevo Costo por Unidad')}</Label>
          <Input
            id="new_cost"
            type="number"
            step="0.01"
            min="0.00"
            value={newCost}
            onChange={(e) => setNewCost(e.target.value)}
            placeholder="0.00"
            required
            className="text-data-mono font-data-mono"
          />
          {newCost && (
            <span className={cn(
              'text-body-sm-bold block',
              diff >= 0 ? 'text-error' : 'text-success'
            )}>
              {t('products.adjust.difference', { value: `${diff >= 0 ? '+' : ''}${formatCurrency(diff)} (${diff >= 0 ? '+' : ''}${pct.toFixed(2)}%)` })}
            </span>
          )}
        </div>

        <div className="space-y-xs">
          <Label htmlFor="adjust-cost-reason" className="text-body-md-bold text-foreground">{t('products.adjust.reason_required', 'Motivo del Ajuste (Requerido)')}</Label>
          <Textarea
            id="adjust-cost-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('products.adjust.placeholder.reason_cost', 'Ej. Actualización de tarifas del distribuidor local, ajuste por depreciación...')}
            rows={3}
            required
            className=""
          />
        </div>
      </form>
    </EnhancedModal>
  );
}

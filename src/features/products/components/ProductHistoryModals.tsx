import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/utils/currencyUtils';
import { usePriceTransactions } from '@/hooks/usePriceTransactions';
import { useCostTransactions } from '@/hooks/useCostTransactions';

interface CommonModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

// ----------------------------------------------------------------------------
// 1. ProductPriceHistoryDialog
// ----------------------------------------------------------------------------
export function ProductPriceHistoryDialog({ productId, productName, isOpen, onClose }: CommonModalProps) {
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Historial de Precios de Venta</h3>
            <p className="text-xs text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#106ebe]"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cargando auditoría...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 bg-red-50 rounded-xl border border-red-100">
              <ShieldAlert className="mx-auto mb-2 text-red-500" size={32} />
              <p className="font-semibold">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No hay cambios de precio registrados para este producto.</p>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Tipo</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Cambio</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Usuario</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {history.map((item: any, i: number) => {
                    const priceChange = item.price_change || (item.new_price - item.old_price);
                    const isIncrease = priceChange > 0;
                    return (
                      <tr key={item.transaction_id || i} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
                          {new Date(item.transaction_date || item.effective_date).toLocaleDateString('es-PY', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formatTransactionType(item.transaction_type)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {formatCurrency(item.old_price)} → {formatCurrency(item.new_price)}
                            </span>
                            <span className={`flex items-center gap-0.5 font-bold mt-0.5 ${isIncrease ? 'text-green-600' : priceChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                              {isIncrease ? <TrendingUp size={12} /> : priceChange < 0 ? <TrendingDown size={12} /> : null}
                              {isIncrease ? '+' : ''}{formatCurrency(priceChange)}
                              {item.price_change_percent != null && ` (${isIncrease ? '+' : ''}${item.price_change_percent.toFixed(1)}%)`}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {item.user_name || item.user_id || 'Sistema'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate" title={item.reason}>
                          {item.reason || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} className="border-gray-200 text-gray-700 px-6" variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. ProductCostHistoryDialog
// ----------------------------------------------------------------------------
export function ProductCostHistoryDialog({ productId, productName, isOpen, onClose }: CommonModalProps) {
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Historial de Costos de Compra</h3>
            <p className="text-xs text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#106ebe]"></div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cargando auditoría...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 bg-red-50 rounded-xl border border-red-100">
              <ShieldAlert className="mx-auto mb-2 text-red-500" size={32} />
              <p className="font-semibold">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No hay transacciones de costo registradas para este producto.</p>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Fecha</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Unidad</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Costo</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Fuente</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Usuario</th>
                    <th className="py-2.5 px-4 text-[10px] font-bold text-gray-500 uppercase">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {history.map((item: any, i: number) => {
                    const costChange = item.price_change || (item.new_price - item.old_price) || 0;
                    const isIncrease = costChange > 0;
                    const costVal = item.cost_per_unit || item.new_price;
                    const sourceText = item.source || (item.metadata?.source === 'demo_mode' ? 'DEMO' : 'MANUAL');
                    return (
                      <tr key={item.id || item.transaction_id || i} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 text-gray-600 font-medium whitespace-nowrap">
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
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                          {item.unit || 'unit'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800">
                              {formatCurrency(costVal)}
                            </span>
                            {item.old_price != null && item.new_price != null && (
                              <span className={`flex items-center gap-0.5 font-bold mt-0.5 ${isIncrease ? 'text-red-600' : costChange < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                {isIncrease ? <TrendingUp size={12} /> : costChange < 0 ? <TrendingDown size={12} /> : null}
                                {isIncrease ? '+' : ''}{formatCurrency(costChange)}
                                {item.price_change_percent != null && ` (${isIncrease ? '+' : ''}${item.price_change_percent.toFixed(1)}%)`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sourceText === 'PURCHASE' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {sourceText}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">
                          {item.created_by || item.user_name || 'Sistema'}
                        </td>
                        <td className="py-3 px-4 text-gray-500 italic max-w-xs truncate" title={item.reason || item.metadata?.reason}>
                          {item.reason || item.metadata?.reason || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <Button onClick={onClose} className="border-gray-200 text-gray-700 px-6" variant="outline">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 3. ProductPriceAdjustmentDialog
// ----------------------------------------------------------------------------
interface AdjustmentProps extends CommonModalProps {
  currentPriceOrCost: number;
  unit: string;
  onSuccess?: () => void;
}

export function ProductPriceAdjustmentDialog({ productId, productName, currentPriceOrCost, unit, isOpen, onClose, onSuccess }: AdjustmentProps) {
  const { registerTransaction, loading, error, clearError } = usePriceTransactions();
  const [newPrice, setNewPrice] = useState('');
  const [reason, setReason] = useState('');
  const [costFactor, setCostFactor] = useState('');
  const [marginPercent, setMarginPercent] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewPrice('');
      setReason('');
      setCostFactor('');
      setMarginPercent('');
      clearError();
    }
  }, [isOpen, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || parseFloat(newPrice) <= 0) return;

    try {
      await registerTransaction({
        product_id: productId,
        transaction_type: 'MANUAL_ADJUSTMENT',
        new_price: parseFloat(newPrice),
        unit: unit || 'unit',
        price_type: 'SELLING_PRICE',
        reason: reason || 'Ajuste manual desde ficha',
        cost_factor: costFactor ? parseFloat(costFactor) : undefined,
        margin_percent: marginPercent ? parseFloat(marginPercent) : undefined,
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

  const currentVal = parseFloat(newPrice) || 0;
  const diff = currentVal ? currentVal - currentPriceOrCost : 0;
  const pct = currentPriceOrCost ? (diff / currentPriceOrCost) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Ajustar Precio de Venta</h3>
            <p className="text-xs text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between text-xs text-blue-900 font-bold">
            <span>Precio Actual:</span>
            <span>{formatCurrency(currentPriceOrCost)} / {unit}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new_price" className="">Nuevo Precio</Label>
            <Input
              id="new_price"
              type="number"
              step="0.01"
              min="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              required
              className=""
            />
            {newPrice && (
              <span className={`text-[10px] font-bold block mt-1 ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                Diferencia: {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{pct.toFixed(2)}%)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cost_factor" className="">Factor Costo (0 - 1)</Label>
              <Input
                id="cost_factor"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={costFactor}
                onChange={(e) => setCostFactor(e.target.value)}
                placeholder="0.65"
                className=""
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="margin_percent" className="">Margen %</Label>
              <Input
                id="margin_percent"
                type="number"
                step="0.1"
                min="0"
                value={marginPercent}
                onChange={(e) => setMarginPercent(e.target.value)}
                placeholder="35.0"
                className=""
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason" className="">Motivo del Ajuste</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Análisis de precios de mercado, incremento del costo de envío..."
              rows={2}
              required
              className=""
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-gray-200 text-gray-700">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#106ebe] hover:bg-[#005a9e] text-white" disabled={loading || !newPrice}>
              {loading ? 'Guardando...' : 'Guardar Cambio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 4. ProductCostAdjustmentDialog
// ----------------------------------------------------------------------------
export function ProductCostAdjustmentDialog({ productId, productName, currentPriceOrCost, unit, isOpen, onClose, onSuccess }: AdjustmentProps) {
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
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Ajustar Costo de Compra</h3>
            <p className="text-xs text-gray-500">{productName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex justify-between text-xs text-purple-900 font-bold">
            <span>Costo Actual:</span>
            <span>{formatCurrency(currentPriceOrCost)} / {unit}</span>
          </div>

          <div className="space-y-1">
            <Label htmlFor="new_cost" className="">Nuevo Costo por Unidad</Label>
            <Input
              id="new_cost"
              type="number"
              step="0.01"
              min="0.00"
              value={newCost}
              onChange={(e) => setNewCost(e.target.value)}
              placeholder="0.00"
              required
              className=""
            />
            {newCost && (
              <span className={`text-[10px] font-bold block mt-1 ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                Diferencia: {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diff >= 0 ? '+' : ''}{pct.toFixed(2)}%)
              </span>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="reason" className="">Motivo del Ajuste (Requerido)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Actualización de tarifas del distribuidor local, ajuste por depreciación..."
              rows={3}
              required
              className=""
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" onClick={onClose} variant="outline" className="flex-1 border-gray-200 text-gray-700">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-[#106ebe] hover:bg-[#005a9e] text-white" disabled={loading || !newCost || !reason.trim()}>
              {loading ? 'Guardando...' : 'Guardar Cambio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  User,
  Package,
  Calculator,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { budgetService } from '@/services/budgetService';
import { productService } from '@/services/productService';
import { CreateBudgetRequest } from '@/types';
import { calculateSaleTotals } from '@/domain/sale/calculations/saleCalculator';
import { resolveApplicableRateFraction } from '@/domain/tax/resolveApplicableRate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SearchableDropdown, type SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import useClientStore from '@/store/useClientStore';
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import ToastContainer from '@/components/ui/ToastContainer';

/** Cliente normalizado por useClientStore (name/displayName garantizados). */
interface BudgetClientOption extends SearchableDropdownItem {
  displayName?: string;
  document_id?: string;
}

/** Línea del presupuesto — keyed por producto+variante (pueden convivir). */
interface BudgetItem {
  key: string;
  product_id: string;
  variant_id?: string | null;
  name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  /** Unidad base del producto (viaja en el payload de la línea). */
  base_unit?: string;
  /** Fracción IVA (0.10 / 0.05 / 0) resuelta del producto, informativo. */
  tax_rate: number;
}

const unitKey = (productId: string, variantId?: string | null) =>
  `${productId}|${variantId ?? 'base'}`;

const BudgetCreate: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useI18n();
  const searchClients = useClientStore((s) => s.searchClients);

  // --- Estado del Presupuesto ---
  const [selectedClient, setSelectedClient] = useState<BudgetClientOption | null>(null);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // --- Búsqueda de Productos ---
  // Búsqueda plana (granularity=variant) — mismo camino que la página de
  // /ventas: una fila por unidad vendible (variante + fila base), con precio
  // (variante-primero) y stock propios, y matcheo por SKU/código de variante.
  // La cadena legacy por-producto queda como fallback solo si el endpoint falla.

  // Totales calculados. Convención Paraguay (backend create_budget_order):
  // el precio de línea YA incluye IVA, el total es la suma de líneas sin IVA
  // aditivo. El IVA se muestra desglosado por extracción (informativo).
  const totals = useMemo(() => {
    const domainItems = items.map(item => ({
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      tax_rate: item.tax_rate !== undefined ? Number(item.tax_rate) : undefined,
      price_includes_tax: true,
    }));
    const result = calculateSaleTotals(domainItems);
    return { subtotal: result.subtotal, tax: result.tax_amount, total: result.total };
  }, [items]);

  const addItem = async (unit: SellableUnitOption) => {
    const key = unitKey(unit.id, unit.variant_id);
    if (items.some(i => i.key === key)) {
      setItems(items.map(i => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)));
      return;
    }
    // La fila plana no viaja con tasa de IVA: se resuelve del producto
    // (applicable_tax_rate) para el desglose informativo; el backend resuelve
    // el tax_rate_id por jerarquía al guardar. Sin respuesta → default 10%.
    let taxRate = resolveApplicableRateFraction(null);
    try {
      const info = await productService.getInfo(unit.id);
      taxRate = resolveApplicableRateFraction(info);
    } catch (error) {
      console.warn('Could not resolve product tax rate, using default', error);
    }
    setItems([
      ...items,
      {
        key,
        product_id: unit.id,
        variant_id: unit.variant_id ?? null,
        name: unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name,
        sku: unit.sku ?? null,
        quantity: 1,
        unit_price: unit.price,
        base_unit: unit.base_unit || 'unit',
        tax_rate: taxRate,
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter(i => i.key !== key));
  };

  const updateQuantity = (key: string, qty: number) => {
    if (qty < 1) return;
    setItems(items.map(i => (i.key === key ? { ...i, quantity: qty } : i)));
  };

  const handleSave = async () => {
    if (!selectedClient) {
      addToast('Debes seleccionar un cliente', 'error');
      return;
    }
    if (items.length === 0) {
      addToast('Debes añadir al menos un producto', 'error');
      return;
    }

    try {
      // Contrato canónico POST /budgets (BUDGET_API_GUIDE.md 2026-08-17):
      // { budget: {...}, details: [...] }. valid_until en ISO 8601 (el
      // backend deserializa time.Time RFC3339). Los precios incluyen IVA y el
      // backend resuelve tax_rate_id por jerarquía si no se envía.
      const request: CreateBudgetRequest = {
        budget: {
          client_id: selectedClient.id,
          valid_until: validUntil ? `${validUntil}T00:00:00Z` : undefined,
          notes,
        },
        details: items.map(i => ({
          product_id: i.product_id,
          // El backend hoy persiste a nivel producto (budget_order_details no
          // tiene variant_id y el procedure ignora la clave); se envía para
          // dejar el contrato listo y sin ambigüedad de precio por variante.
          variant_id: i.variant_id ?? undefined,
          quantity: i.quantity,
          // Unidad real del producto: el procedure crea_budget_order persiste
          // la unidad por línea y convert_budget_to_sale la propaga a la venta
          // (mandar 'unit' fijo vendía kg como unidades — PLAN_UNITS_FRONTEND).
          unit: i.base_unit || 'unit',
          unit_price: i.unit_price,
        })),
      };
      await budgetService.createBudget(request);
      addToast('Presupuesto creado con éxito', 'success');
      navigate('/comercial/presupuestos');
    } catch (error: any) {
      addToast(error.message || 'Error al guardar presupuesto', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-display pb-20">
      <ToastContainer />
      
      {/* Header Fijo/Sticky (Glass Acrylic) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between glass-acrylic sticky top-0 z-50 py-4 px-6 md:px-8 border-b border-border-subtle rounded-xl shadow-sm mb-2 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-main leading-none">Nueva Cotización</h1>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-1.5">Módulo Comercial • Proyección de Venta</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="font-bold border-border-base px-6 text-xs hover:bg-slate-50 transition-all">Cancelar</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white font-bold px-8 shadow-fluent-8 text-xs transition-all">
            <Save size={16} className="mr-2" /> Guardar Presupuesto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Datos y Productos */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECCIÓN 1: CLIENTE — sin overflow-hidden: el dropdown del
              buscador es absolute y se recortaría contra la tarjeta. Las
              esquinas redondeadas del header van vía rounded-t-xl. */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2">
            <div className="bg-surface-muted border-b border-border-subtle px-6 py-4 rounded-t-xl">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <User size={16} /> Identificación del Cliente
              </h3>
            </div>
            <div className="p-6">
              {!selectedClient ? (
                <SearchableDropdown<BudgetClientOption>
                  onSelect={setSelectedClient}
                  onSearch={async (term) => {
                    // El store normaliza los clientes crudos del backend
                    // (name/displayName garantizados, ítems sin id
                    // descartados) — mismo camino que ClientStep/OrderBuilder.
                    const clients = await searchClients(term);
                    return clients.map((c: any) => ({
                      ...c,
                      id: String(c.id),
                      name: String(c.displayName || c.name),
                    }));
                  }}
                  placeholder={t('budgets.client.searchPlaceholder', 'Escribe el nombre o RUC del cliente para buscar...')}
                  renderItem={(c) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User size={14} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-text-main truncate">{c.displayName || c.name}</p>
                        {c.document_id && (
                          <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">{c.document_id}</p>
                        )}
                      </div>
                    </div>
                  )}
                  emptyMessage={t('budgets.client.empty', 'No se encontraron clientes')}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center justify-between bg-surface-muted border border-border-subtle p-5 rounded-xl">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20">
                      {(selectedClient.displayName || selectedClient.name || '?').charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-base text-text-main leading-none">{selectedClient.displayName || selectedClient.name}</p>
                      <p className="text-[11px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">{selectedClient.document_id || 'RUC: NO APLICA'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-error hover:bg-error/10 rounded-full transition-colors">
                    <X size={20} />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: PRODUCTOS */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 overflow-hidden min-h-[400px] flex flex-col">
            <div className="bg-[#f3f2f1]/50 border-b border-border-subtle px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Package size={16} /> Detalle de la Oferta
              </h3>
              <div className="w-full sm:w-72">
                <SearchableDropdown<SellableUnitOption>
                  onSelect={addItem}
                  onSearch={searchSellableUnitsFlat}
                  placeholder={t('products.search.sellable_placeholder', 'Buscar producto por nombre, SKU o variante...')}
                  renderItem={(u) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-text-main truncate">
                          {u.variant_name ? `${u.name} · ${u.variant_name}` : u.name}
                        </p>
                        <p className="text-[11px] text-text-secondary font-mono mt-0.5 flex items-center gap-2">
                          {u.sku && <span>SKU: {u.sku}</span>}
                          <span className={u.stock > 0 ? 'text-success' : 'text-error'}>
                            {t('products.search.stock_label', 'Stock: {stock} {unit}', { stock: u.stock, unit: u.base_unit || 'unit' })}
                          </span>
                        </p>
                      </div>
                      <span className="font-mono font-black text-primary text-xs shrink-0">
                        {formatPYG(u.price)}
                      </span>
                    </div>
                  )}
                  emptyMessage={t('products.search.no_results', 'No se encontraron productos')}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex-1 bg-white">
              {items.length === 0 ? (
                <div className="p-20 flex flex-col items-center justify-center text-center opacity-60 h-full">
                  <div className="size-16 bg-[#f3f2f1] rounded-full flex items-center justify-center mb-4 border border-border-subtle">
                    <Calculator size={32} className="text-slate-400" />
                  </div>
                  <h3 className="font-bold text-text-secondary">No hay productos añadidos</h3>
                  <p className="text-xs text-slate-400 max-w-[200px] mt-2 font-medium">Busca productos en la barra superior para agregarlos al presupuesto.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-border-subtle text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="py-4 px-6 w-12"></th>
                        <th className="py-4 px-4">Producto</th>
                        <th className="py-4 px-4 text-center">Cantidad</th>
                        <th className="py-4 px-4 text-right">Precio Unit.</th>
                        <th className="py-4 px-6 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {items.map(item => (
                        <tr key={item.key} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-center">
                            <button onClick={() => removeItem(item.key)} className="text-slate-300 hover:text-error transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-sm text-text-main">{item.name}</p>
                            <p className="text-[10px] text-text-secondary font-mono mt-0.5">{item.sku ? `SKU: ${item.sku}` : `ID: ${item.product_id}`}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center">
                              <input 
                                type="number" 
                                min="1"
                                className="w-20 h-9 text-center font-mono font-bold text-sm bg-[#f3f2f1] border border-border-subtle rounded focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.key, parseInt(e.target.value))}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-semibold text-sm text-text-secondary">
                            {formatPYG(item.unit_price)}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-black text-sm text-primary">
                            {formatPYG(item.unit_price * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Configuración y Totales */}
        <div className="lg:col-span-4 space-y-8">
          
          <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 overflow-hidden">
            <div className="bg-[#f3f2f1]/50 border-b border-border-subtle px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Calendar size={16} /> Vigencia y Notas
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Válido hasta:</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    type="date" 
                    className="pl-10 h-10 font-bold border-border-base text-sm bg-white focus:ring-2 focus:ring-primary/20 transition-all" 
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Notas Comerciales:</label>
                <textarea 
                  className="w-full min-h-[120px] p-4 text-sm bg-white border border-border-base rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none"
                  placeholder="Instrucciones especiales para el cliente o detalles de la oferta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CUADRO DE TOTALES (Ancla Visual) */}
          <div className="bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] text-white rounded-xl shadow-2xl shadow-blue-900/20 overflow-hidden relative">
            <div className="absolute -top-10 -right-10 size-40 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 size-32 bg-primary/20 rounded-full blur-xl"></div>
            <div className="p-8 relative z-10 space-y-5">
              <div className="flex justify-between items-center text-blue-200/80 font-bold text-xs uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="font-mono">{formatPYG(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-blue-200/80 font-bold text-xs uppercase tracking-widest">
                <span>IVA Incluido</span>
                <span className="font-mono">{formatPYG(totals.tax)}</span>
              </div>
              <div className="h-px bg-white/10 my-1" />
              <div className="flex justify-between items-end pt-2">
                <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] leading-none mb-2 truncate">Total Presupuesto</p>
                    <h2 className="text-4xl font-black tracking-tighter font-mono text-white truncate">
                        {formatPYG(totals.total)}
                    </h2>
                </div>
                <div className="shrink-0">
                  <Calculator size={40} className="text-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-[#fff4ce] border border-[#fff4ce] rounded-xl flex gap-4 shadow-sm">
            <AlertCircle className="text-warning shrink-0" size={20} />
            <p className="text-xs text-warning font-medium leading-relaxed">
              Los precios en el presupuesto se reservan según la vigencia seleccionada. Pasada la fecha, el sistema requerirá actualización de precios.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BudgetCreate;

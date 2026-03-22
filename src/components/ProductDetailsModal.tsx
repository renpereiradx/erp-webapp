import { useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { X, Edit, Package, Info, Layout, Activity, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { ProductOperationInfoResponse } from '../types';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductOperationInfoResponse | any;
  onEdit?: () => void;
}

/**
 * ProductDetailsModal Component
 * Rediseñado con Tailwind CSS siguiendo Fluent Design System 2
 */
export default function ProductDetailsModal({ isOpen, onClose, product, onEdit }: ProductDetailsModalProps) {
  const { t } = useI18n();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const productId = product.product_id || product.id;
  const productName = product.product_name || product.name;
  const barcode = product.barcode;
  const brand = product.brand;
  const origin = product.origin;
  const categoryName = product.category_name || product.category?.name;
  const productType = product.product_type || product.productType;
  const description = product.description;
  const unitPrices = product.unit_prices || [];
  const unitCostsSummary = product.unit_costs_summary || [];
  const stockQuantity = product.stock_quantity ?? product.stock ?? 0;
  const stockStatus = product.stock_status || (stockQuantity < 10 ? 'low_stock' : 'in_stock');
  const financialHealth = product.financial_health || {};
  const hasPrices = financialHealth.has_prices || product.has_valid_prices;
  const hasCosts = financialHealth.has_costs || product.has_valid_costs;
  const hasStock = financialHealth.has_stock || product.has_valid_stock;
  const bestMarginUnit = product.best_margin_unit;
  const bestMarginPercent = product.best_margin_percent;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 text-[#106ebe]">
              <Package size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#242424] leading-tight">{productName}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('products.details.product_id')}:</span>
                <span className="text-sm font-medium text-gray-600 tabular-nums">{productId || 'N/A'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Main Content Area (8/12) */}
            <div className="lg:col-span-8 p-8 space-y-10 border-r border-gray-50">
              
              {/* General Info Grid */}
              <section>
                <div className="flex items-center gap-2 mb-6 text-[#106ebe]">
                  <Info size={18} />
                  <h3 className="font-semibold text-xs uppercase tracking-widest">{t('products.details.section.general_info')}</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-6">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('products.modal.field.category')}</label>
                    <p className="text-sm font-semibold text-gray-800">{categoryName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('products.modal.field.product_type')}</label>
                    <p className="text-sm font-semibold text-gray-800 capitalize">{(productType || 'PHYSICAL').toLowerCase()}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('products.modal.field.barcode')}</label>
                    <p className="text-sm font-semibold text-gray-800 tabular-nums">{barcode || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('products.modal.field.brand')}</label>
                    <p className="text-sm font-semibold text-gray-800">{brand || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t('products.modal.field.origin')}</label>
                    <p className="text-sm font-semibold text-gray-800">
                      {origin === 'IMPORTADO' ? t('products.origin.imported') : origin === 'NACIONAL' ? t('products.origin.national') : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Impuesto (IVA)</label>
                    <p className="text-sm font-semibold text-[#106ebe]">
                      {product.tax?.rate?.tax_name || product.applicable_tax_rate?.tax_name || 'No especificado'}
                      {product.tax?.rate?.rate != null ? ` (${product.tax.rate.rate}%)` : ''}
                    </p>
                  </div>
                </div>
                {description && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">{t('products.modal.field.description')}</label>
                    <p className="text-sm text-gray-600 leading-relaxed italic">{description}</p>
                  </div>
                )}
              </section>

              {/* Unit Prices Table */}
              {unitPrices.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#106ebe]">
                    <Layout size={18} />
                    <h3 className="font-semibold text-xs uppercase tracking-widest">{t('products.details.section.unit_prices')}</h3>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">{t('products.details.table.unit')}</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">{t('products.details.table.price')}</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase text-right">Vigencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {unitPrices.map((up) => (
                          <tr key={up.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 text-sm font-semibold text-gray-700">{up.unit || '-'}</td>
                            <td className="py-3 px-4 text-sm font-bold text-[#106ebe] tabular-nums">${up.price_per_unit?.toFixed(2) || '0.00'}</td>
                            <td className="py-3 px-4 text-xs text-gray-400 text-right">
                              {up.effective_date ? new Date(up.effective_date).toLocaleDateString('es') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* Costs Table */}
              {unitCostsSummary.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4 text-[#106ebe]">
                    <Activity size={18} />
                    <h3 className="font-semibold text-xs uppercase tracking-widest">Resumen de Costos</h3>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Unidad</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Último Costo</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase">Promedio 6m</th>
                          <th className="py-3 px-4 text-[11px] font-bold text-gray-500 uppercase text-right">Variación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {unitCostsSummary.map((cs, i) => (
                          <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-3 px-4 text-sm font-semibold text-gray-700">{cs.unit || '-'}</td>
                            <td className="py-3 px-4 text-sm font-medium text-gray-800 tabular-nums">${cs.last_cost?.toFixed(2) || '0.00'}</td>
                            <td className="py-3 px-4 text-sm text-gray-500 tabular-nums">${cs.weighted_avg_cost_6m?.toFixed(2) || '0.00'}</td>
                            <td className={`py-3 px-4 text-xs font-bold text-right ${cs.cost_variance_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {cs.cost_variance_percent != null ? `${cs.cost_variance_percent > 0 ? '+' : ''}${cs.cost_variance_percent.toFixed(1)}%` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Stats Area (4/12) */}
            <div className="lg:col-span-4 bg-gray-50/30 p-8 space-y-8">
              
              {/* Inventory Card */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">{t('products.details.section.inventory')}</h3>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#106ebe]">
                      <Package size={20} />
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      stockStatus === 'in_stock' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {stockStatus === 'in_stock' ? 'Disponible' : 'Stock Bajo'}
                    </span>
                  </div>
                  <div className="text-3xl font-black text-gray-800 tabular-nums">{stockQuantity}</div>
                  <p className="text-xs text-gray-400 mt-1 font-medium">Unidades totales en stock</p>
                </div>
              </div>

              {/* Profit Margin Card */}
              {bestMarginUnit && (
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">Rendimiento</h3>
                  <div className="bg-white p-6 rounded-2xl border-l-4 border-l-green-500 border-y border-r border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TrendingUp size={18} />
                      <span className="text-[10px] font-black uppercase tracking-wider">Mejor Margen</span>
                    </div>
                    <div className="text-2xl font-black text-green-600 tabular-nums">{bestMarginPercent?.toFixed(2)}%</div>
                    <p className="text-xs text-gray-400 mt-1 font-medium uppercase">Basado en unidad: {bestMarginUnit}</p>
                  </div>
                </div>
              )}

              {/* Configuration Checklist */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-widest text-gray-500">Configuración</h3>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  {[
                    { label: t('products.details.health.has_prices'), checked: hasPrices, icon: <Layout size={14} /> },
                    { label: t('products.details.health.has_costs'), checked: hasCosts, icon: <Activity size={14} /> },
                    { label: 'Inventario Base', checked: hasStock, icon: <Package size={14} /> }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md ${item.checked ? 'text-gray-400' : 'text-gray-300'}`}>
                          {item.icon}
                        </div>
                        <span className={`text-xs font-semibold ${item.checked ? 'text-gray-600' : 'text-gray-400 line-through'}`}>{item.label}</span>
                      </div>
                      {item.checked ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-orange-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Health Status */}
              <div className="pt-4 border-t border-gray-100">
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  hasPrices && hasCosts ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-orange-50 text-orange-800 border border-orange-100'
                }`}>
                  <ShieldCheck size={20} />
                  <div className="text-xs font-bold leading-tight">
                    {hasPrices && hasCosts ? 'Producto con configuración financiera completa' : 'Requiere revisión de configuración financiera'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3 bg-white sticky bottom-0">
          <Button variant="outline" onClick={onClose} className="border-gray-200 text-gray-700 px-6">
            {t('products.modal.action.cancel')}
          </Button>
          {onEdit && (
            <Button 
              onClick={() => { onClose(); onEdit(product); }}
              className="bg-[#106ebe] hover:bg-[#005a9e] text-white px-8 font-bold shadow-md"
            >
              <Edit size={18} className="mr-2" />
              {t('products.details.action.edit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

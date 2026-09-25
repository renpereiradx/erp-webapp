/**
 * Nueva Requisición (/logistica/requisiciones/nueva).
 *
 * Proveedor y productos usan el SearchableDropdown compartido: el proveedor
 * viene normalizado del store de directorio (name/taxId garantizados) y los
 * productos usan la búsqueda plana por unidad vendible (granularity=variant,
 * helper compartido con presupuestos) — precio/stock propios por variante.
 */
import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  Package,
  Truck,
  X,
  Tags
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { useBranch } from '@/contexts/BranchContext';
import { purchaseRequisitionService } from '@/services/purchaseRequisitionService';
import { isDecimalUnit } from '@/constants/units';
import { CreatePurchaseRequisitionRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableDropdown, type SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import useSupplierDirectoryStore from '@/store/useSupplierDirectoryStore';
import { searchSellableUnitsFlat, type SellableUnitOption } from '@/features/catalog/sellableUnitSearch';
import { useI18n } from '@/lib/i18n';
import ToastContainer from '@/components/ui/ToastContainer';

/** Proveedor normalizado por useSupplierDirectoryStore. */
interface RequisitionSupplierOption extends SearchableDropdownItem {
  displayName?: string;
  tax_id?: string;
}

/** Línea de la requisición — keyed por producto+variante (pueden convivir). */
interface RequisitionItem {
  key: string;
  product_id: string;
  variant_id?: string | null;
  name: string;
  sku?: string | null;
  base_unit: string;
  quantity: number;
  priority: string;
  notes: string;
}

const unitKey = (productId: string, variantId?: string | null) =>
  `${productId}|${variantId ?? 'base'}`;

const PurchaseRequisitionCreate: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { currentBranchId } = useBranch();
  const searchSuppliers = useSupplierDirectoryStore((s) => s.searchSuppliers);

  // --- Estado de la Requisición ---
  const [selectedSupplier, setSelectedSupplier] = useState<RequisitionSupplierOption | null>(null);
  const [items, setItems] = useState<RequisitionItem[]>([]);
  const [notes, setNotes] = useState('');

  const addItem = (unit: SellableUnitOption) => {
    const key = unitKey(unit.id, unit.variant_id);
    if (items.some(i => i.key === key)) {
      setItems(items.map(i => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)));
      return;
    }
    const allowDecimal = isDecimalUnit(unit.base_unit || 'unit');
    setItems([
      ...items,
      {
        key,
        product_id: unit.id,
        variant_id: unit.variant_id ?? null,
        name: unit.variant_name ? `${unit.name} · ${unit.variant_name}` : unit.name,
        sku: unit.sku ?? null,
        base_unit: unit.base_unit || 'unit',
        quantity: allowDecimal ? 0.01 : 1,
        priority: 'MEDIUM',
        notes: '',
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems(items.filter(i => i.key !== key));
  };

  const updateItem = (key: string, field: string, value: any) => {
    setItems(items.map(i => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      addToast('Debes añadir al menos un producto', 'error');
      return;
    }

    try {
      const request: CreatePurchaseRequisitionRequest = {
        supplier_id: selectedSupplier?.id,
        branch_id: currentBranchId || undefined,
        notes,
        details: items.map(i => ({
          product_id: i.product_id,
          // El backend hoy persiste a nivel producto (la tabla de detalles no
          // tiene variant_id y lo ignora); se envía para dejar el contrato listo.
          variant_id: i.variant_id ?? undefined,
          quantity: i.quantity,
          // El backend persiste la unidad (purchase_requisition_details.unit);
          // sin ella la requisición de un producto por kg llegaba en "unidad".
          unit: i.base_unit || 'unit',
          priority: i.priority,
          notes: i.notes
        }))
      };
      await purchaseRequisitionService.createRequisition(request);
      addToast('Solicitud enviada a revisión', 'success');
      navigate('/logistica/requisiciones');
    } catch (error: any) {
      addToast(error.message || 'Error al crear requisición', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-20">
      <ToastContainer />
      
      {/* Header Fijo */}
      <div className="flex items-center justify-between bg-background-base/80 backdrop-blur-md sticky top-0 z-50 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-main">Nueva Requisición</h1>
            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mt-1">Suministros e Inventario • Flujo de Compra</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="font-bold border-border-base px-6">Cancelar</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white font-bold px-8 shadow-fluent-8">
            <Save size={18} className="mr-2" /> Enviar Solicitud
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECCIÓN 1: PROVEEDOR SUGERIDO */}
          <Card className="border-border-subtle shadow-fluent-2">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle py-4">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Truck size={16} /> Proveedor Sugerido (Opcional)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedSupplier ? (
                <SearchableDropdown<RequisitionSupplierOption>
                  onSelect={setSelectedSupplier}
                  onSearch={async (term) => {
                    // El store normaliza (name garantizado aunque el backend
                    // devuelva first_name) y matchea por ID numérico.
                    return (await searchSuppliers(term)) as RequisitionSupplierOption[];
                  }}
                  placeholder={t('suppliers.search.placeholder', 'Buscar proveedor...')}
                  renderItem={(s) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{s.displayName || s.name}</p>
                        {s.tax_id && (
                          <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">{s.tax_id}</p>
                        )}
                      </div>
                    </div>
                  )}
                  emptyMessage={t('supplier.search.no_results', 'No se encontraron proveedores con ese criterio')}
                  className="w-full"
                />
              ) : (
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Truck className="text-primary" size={20} />
                    <span className="font-bold text-sm">{selectedSupplier.displayName || selectedSupplier.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedSupplier(null)} className="h-8 w-8">
                    <X size={16} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECCIÓN 2: PRODUCTOS REQUERIDOS */}
          <Card className="border-border-subtle shadow-fluent-2 overflow-hidden min-h-[500px]">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Package size={16} /> Ítems Solicitados
              </CardTitle>
              <div className="w-64">
                <SearchableDropdown<SellableUnitOption>
                  onSelect={addItem}
                  onSearch={searchSellableUnitsFlat}
                  placeholder={t('products.search.sellable_placeholder', 'Buscar producto por nombre, SKU o variante...')}
                  renderItem={(u) => (
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">
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
                        {u.price > 0
                          ? u.price.toLocaleString('es-PY', { style: 'currency', currency: 'PYG', minimumFractionDigits: 0 })
                          : null}
                      </span>
                    </div>
                  )}
                  emptyMessage={t('products.search.no_results', 'No se encontraron productos')}
                  className="w-full"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-32 flex flex-col items-center text-center opacity-30">
                  <Package size={64} className="mb-4" />
                  <h3 className="font-bold">No hay ítems en la solicitud</h3>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="py-4 px-6 text-left">Producto</th>
                        <th className="py-4 px-4 text-center">Cantidad</th>
                        <th className="py-4 px-4 text-center">Prioridad</th>
                        <th className="py-4 px-4 text-left">Observaciones</th>
                        <th className="py-4 px-6 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(item => (
                        <tr key={item.key} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.sku ? `SKU: ${item.sku}` : item.product_id}</p>
                          </td>
                          <td className="py-4 px-4">
                            <Input
                              type="number"
                              className="w-20 mx-auto text-center font-bold h-9 border-none bg-slate-100 rounded-lg"
                              step={isDecimalUnit(item.base_unit || 'unit') ? "0.01" : "1"}
                              value={item.quantity}
                              onChange={(e) => updateItem(item.key, 'quantity', e.target.value)}
                              onBlur={(e) => {
                                let val = parseFloat(e.target.value) || 0;
                                if (!isDecimalUnit(item.base_unit || 'unit')) val = Math.floor(val);
                                updateItem(item.key, 'quantity', val);
                              }}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Select
                              value={item.priority}
                              onValueChange={(val) => updateItem(item.key, 'priority', val)}
                            >
                              <SelectTrigger className="w-32 h-9 text-[10px] font-bold uppercase border-none bg-slate-100">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LOW" className="text-[10px] font-bold">BAJA</SelectItem>
                                <SelectItem value="MEDIUM" className="text-[10px] font-bold">MEDIA</SelectItem>
                                <SelectItem value="HIGH" className="text-[10px] font-bold text-red-600">ALTA</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-4 px-4">
                             <Input
                                placeholder="Nota interna..."
                                className="h-9 text-xs bg-transparent border-dashed border-slate-200"
                                value={item.notes}
                                onChange={(e) => updateItem(item.key, 'notes', e.target.value)}
                             />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => removeItem(item.key)} className="text-slate-300 hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="border-border-subtle shadow-fluent-2">
              <CardHeader className="bg-slate-50/50 border-b py-4">
                <CardTitle className="text-xs font-black uppercase text-slate-500">Justificación</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <textarea 
                   className="w-full min-h-[150px] p-4 text-sm bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                   placeholder="Explica brevemente la necesidad de este pedido..."
                   value={notes}
                   onChange={(e) => setNotes(e.target.value)}
                 />
                 <div className="bg-blue-50 p-4 rounded-xl flex gap-3 border border-blue-100">
                    <Tags className="text-primary shrink-0" size={20} />
                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                        Las requisiciones son revisadas por el departamento de compras. Una vez aprobadas, se consolidarán en órdenes de compra globales.
                    </p>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequisitionCreate;

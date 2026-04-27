import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  AlertCircle,
  Truck,
  X,
  PlusCircle,
  Tags
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { purchaseRequisitionService } from '@/services/purchaseRequisitionService';
import { productService } from '@/services/productService';
import supplierService from '@/services/supplierService';
import { Product, CreatePurchaseRequisitionRequest } from '@/types';
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
import ToastContainer from '@/components/ui/ToastContainer';

const PurchaseRequisitionCreate: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // --- Estado de la Requisición ---
  const [selectedSupplier, setSelectedSupplier] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');

  // --- Búsqueda de Productos ---
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  
  // --- Búsqueda de Proveedores ---
  const [supplierSearch, setSupplierSearch] = useState('');
  const [foundSuppliers, setFoundSuppliers] = useState<any[]>([]);

  const handleSearchSupplier = async (term: string) => {
    setSupplierSearch(term);
    if (term.length < 3) return;
    try {
      const results = await supplierService.searchByName(term);
      setFoundSuppliers(results || []);
    } catch (err) {}
  };

  const handleSearchProduct = async (term: string) => {
    setProductSearch(term);
    if (term.length < 2) return;
    try {
      const results = await productService.searchProductsByName(term);
      setFoundProducts(results || []);
    } catch (err) {}
  };

  const addItem = (product: Product) => {
    const existing = items.find(i => i.product_id === product.id);
    if (existing) {
      setItems(items.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        product_id: product.id,
        name: product.name,
        quantity: 1,
        priority: 'MEDIUM',
        notes: ''
      }]);
    }
    setProductSearch('');
    setFoundProducts([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.product_id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.product_id === id ? { ...i, [field]: value } : i));
  };

  const handleSave = async () => {
    if (items.length === 0) {
      addToast('Debes añadir al menos un producto', 'error');
      return;
    }

    try {
      const request: CreatePurchaseRequisitionRequest = {
        supplier_id: selectedSupplier?.id,
        notes,
        details: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Buscar proveedor..." 
                    className="pl-10 h-11 bg-slate-50 border-slate-200"
                    value={supplierSearch}
                    onChange={(e) => handleSearchSupplier(e.target.value)}
                  />
                  {foundSuppliers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 z-50">
                      {foundSuppliers.map(s => (
                        <div 
                          key={s.id} 
                          className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                          onClick={() => {
                            setSelectedSupplier(s);
                            setFoundSuppliers([]);
                            setSupplierSearch('');
                          }}
                        >
                          <span className="font-bold text-sm">{s.name}</span>
                          <PlusCircle size={16} className="text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border">
                  <div className="flex items-center gap-3">
                    <Truck className="text-primary" size={20} />
                    <span className="font-bold text-sm">{selectedSupplier.name}</span>
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
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Añadir producto..." 
                  className="pl-8 h-9 text-xs"
                  value={productSearch}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                />
                {foundProducts.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-lg shadow-fluent-16 z-50 max-h-60 overflow-y-auto">
                    {foundProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs border-b last:border-0"
                        onClick={() => addItem(p)}
                      >
                        <span className="font-bold">{p.name}</span>
                        <Badge variant="outline" className="text-[9px]">{p.category_name}</Badge>
                      </div>
                    ))}
                  </div>
                )}
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
                        <tr key={item.product_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-sm">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.product_id}</p>
                          </td>
                          <td className="py-4 px-4">
                            <Input 
                              type="number" 
                              className="w-20 mx-auto text-center font-bold h-9 border-none bg-slate-100 rounded-lg"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.product_id, 'quantity', parseFloat(e.target.value))}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <Select 
                              value={item.priority} 
                              onValueChange={(val) => updateItem(item.product_id, 'priority', val)}
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
                                onChange={(e) => updateItem(item.product_id, 'notes', e.target.value)}
                             />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => removeItem(item.product_id)} className="text-slate-300 hover:text-red-500">
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
                    <Tags className="text-blue-600 flex-shrink-0" size={20} />
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

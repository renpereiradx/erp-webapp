import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  User, 
  Package, 
  Calculator,
  Calendar,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { budgetService } from '@/services/budgetService';
import { productService } from '@/services/productService';
import { clientService } from '@/services/clientService';
import { Product, Client, CreateBudgetRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPYG } from '@/utils/currencyUtils';
import ToastContainer from '@/components/ui/ToastContainer';

const BudgetCreate: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // --- Estado del Presupuesto ---
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // --- Búsqueda de Productos ---
  const [productSearch, setProductSearch] = useState('');
  const [foundProducts, setFoundProducts] = useState<Product[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);

  // --- Búsqueda de Clientes ---
  const [clientSearch, setClientSearch] = useState('');
  const [foundClients, setFoundClients] = useState<Client[]>([]);
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Totales calculados
  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const tax = subtotal * 0.10; // Simplificado IVA 10%
    return { subtotal, tax, total: subtotal + tax };
  }, [items]);

  const handleSearchClient = async (term: string) => {
    setClientSearch(term);
    if (term.length < 3) {
      setFoundClients([]);
      return;
    }
    setIsSearchingClient(true);
    try {
      const results = await clientService.searchByName(term);
      setFoundClients(results || []);
    } catch (error) {
      console.error("Error searching client:", error);
    } finally {
      setIsSearchingClient(false);
    }
  };

  const handleSearchProduct = async (term: string) => {
    setProductSearch(term);
    if (term.length < 2) {
      setFoundProducts([]);
      return;
    }
    setIsSearchingProduct(true);
    try {
      const results = await productService.searchProductsByName(term);
      setFoundProducts(results || []);
    } catch (error) {
      console.error("Error searching product:", error);
    } finally {
      setIsSearchingProduct(false);
    }
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
        unit_price: product.price || 0,
        tax_rate_id: 1 // Default IVA 10%
      }]);
    }
    setProductSearch('');
    setFoundProducts([]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.product_id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty < 1) return;
    setItems(items.map(i => i.product_id === id ? { ...i, quantity: qty } : i));
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
      const request: CreateBudgetRequest = {
        client_id: selectedClient.id,
        valid_until: validUntil,
        notes,
        items: items.map(i => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: i.unit_price
        }))
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
          
          {/* SECCIÓN 1: CLIENTE */}
          <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 overflow-hidden">
            <div className="bg-[#f3f2f1]/50 border-b border-border-subtle px-6 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <User size={16} /> Identificación del Cliente
              </h3>
            </div>
            <div className="p-6">
              {!selectedClient ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Escribe el nombre o RUC del cliente para buscar..." 
                    className="pl-10 h-12 text-sm bg-slate-50 border-border-subtle focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                    value={clientSearch}
                    onChange={(e) => handleSearchClient(e.target.value)}
                  />
                  {isSearchingClient && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  )}
                  {foundClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-subtle rounded-xl shadow-fluent-16 z-50 max-h-60 overflow-y-auto">
                      {foundClients.map(c => (
                        <div 
                          key={c.id} 
                          className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-border-subtle last:border-0 transition-colors"
                          onClick={() => {
                            setSelectedClient(c);
                            setFoundClients([]);
                            setClientSearch('');
                          }}
                        >
                          <div>
                            <p className="font-bold text-sm text-text-main">{c.name} {c.last_name}</p>
                            <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider mt-0.5">{c.document_id || 'Sin documento'}</p>
                          </div>
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Plus size={16} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-[#f3f2f1] border border-border-subtle p-5 rounded-xl">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-lg border border-primary/20">
                      {selectedClient.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-base text-text-main leading-none">{selectedClient.name} {selectedClient.last_name}</p>
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
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Buscar producto por nombre..." 
                  className="pl-9 h-9 text-xs bg-white border-border-base focus:ring-2 focus:ring-primary/20 font-medium"
                  value={productSearch}
                  onChange={(e) => handleSearchProduct(e.target.value)}
                />
                {isSearchingProduct && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                )}
                {foundProducts.length > 0 && (
                   <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-subtle rounded-xl shadow-fluent-16 z-50 max-h-60 overflow-y-auto">
                    {foundProducts.map(p => (
                      <div 
                        key={p.id} 
                        className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-xs border-b border-border-subtle last:border-0 transition-colors"
                        onClick={() => addItem(p)}
                      >
                        <span className="font-bold text-text-main">{p.name}</span>
                        <span className="font-mono font-black text-primary">{formatPYG(p.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                        <tr key={item.product_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 text-center">
                            <button onClick={() => removeItem(item.product_id)} className="text-slate-300 hover:text-error transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-sm text-text-main">{item.name}</p>
                            <p className="text-[10px] text-text-secondary font-mono mt-0.5">ID: {item.product_id}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center">
                              <input 
                                type="number" 
                                min="1"
                                className="w-20 h-9 text-center font-mono font-bold text-sm bg-[#f3f2f1] border border-border-subtle rounded focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
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
                <span>Subtotal Neto</span>
                <span className="font-mono">{formatPYG(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-blue-200/80 font-bold text-xs uppercase tracking-widest">
                <span>IVA Estimado (10%)</span>
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
                <div className="flex-shrink-0">
                  <Calculator size={40} className="text-white/10" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 bg-[#fff4ce] border border-[#fff4ce] rounded-xl flex gap-4 shadow-sm">
            <AlertCircle className="text-[#794500] flex-shrink-0" size={20} />
            <p className="text-xs text-[#794500] font-medium leading-relaxed">
              Los precios en el presupuesto se reservan según la vigencia seleccionada. Pasada la fecha, el sistema requerirá actualización de precios.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BudgetCreate;

import React, { useState, useEffect, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    if (term.length < 3) return;
    setIsSearchingClient(true);
    try {
      const results = await clientService.searchByName(term);
      setFoundClients(results || []);
    } finally {
      setIsSearchingClient(false);
    }
  };

  const handleSearchProduct = async (term: string) => {
    setProductSearch(term);
    if (term.length < 2) return;
    setIsSearchingProduct(true);
    try {
      const results = await productService.searchProductsByName(term);
      setFoundProducts(results || []);
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
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto pb-20">
      <ToastContainer />
      
      {/* Header Fijo/Sticky */}
      <div className="flex items-center justify-between bg-background-base/80 backdrop-blur-md sticky top-0 z-50 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full hover:bg-slate-100">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-text-main leading-none">Nueva Cotización</h1>
            <p className="text-[11px] text-text-secondary font-bold uppercase tracking-widest mt-1">Módulo Comercial • Proyección de Venta</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)} className="font-bold border-border-base px-6">Cancelar</Button>
          <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover text-white font-bold px-8 shadow-fluent-8">
            <Save size={18} className="mr-2" /> Guardar Presupuesto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Datos y Productos */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECCIÓN 1: CLIENTE */}
          <Card className="border-border-subtle shadow-fluent-2 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle py-4">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <User size={16} /> Identificación del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedClient ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <Input 
                    placeholder="Escribe el nombre o RUC del cliente para buscar..." 
                    className="pl-10 h-12 text-base bg-slate-50 focus:bg-white border-slate-200 transition-all"
                    value={clientSearch}
                    onChange={(e) => handleSearchClient(e.target.value)}
                  />
                  {foundClients.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 z-50 max-h-60 overflow-y-auto">
                      {foundClients.map(c => (
                        <div 
                          key={c.id} 
                          className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                          onClick={() => {
                            setSelectedClient(c);
                            setFoundClients([]);
                            setClientSearch('');
                          }}
                        >
                          <div>
                            <p className="font-bold text-sm">{c.name} {c.last_name}</p>
                            <p className="text-xs text-slate-500 font-medium">{c.document_id || 'Sin documento'}</p>
                          </div>
                          <Plus size={16} className="text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                      {selectedClient.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-lg text-primary leading-none">{selectedClient.name} {selectedClient.last_name}</p>
                      <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{selectedClient.document_id || 'RUC: NO APLICA'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-red-500 rounded-full">
                    <X size={20} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECCIÓN 2: PRODUCTOS */}
          <Card className="border-border-subtle shadow-fluent-2 overflow-hidden min-h-[400px]">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Package size={16} /> Detalle de la Oferta
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <Input 
                  placeholder="Añadir producto..." 
                  className="pl-8 h-9 text-xs bg-white border-slate-200"
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
                        <span className="font-mono font-black text-primary">{formatPYG(p.price || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {items.length === 0 ? (
                <div className="p-20 flex flex-col items-center text-center opacity-50">
                  <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <Calculator size={32} className="text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-500">No hay productos añadidos</h3>
                  <p className="text-xs max-w-[200px] mt-2">Busca productos en la barra superior para agregarlos al presupuesto.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50/30 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <tr>
                        <th className="py-3 px-6 text-left">Producto</th>
                        <th className="py-3 px-4 text-center">Cantidad</th>
                        <th className="py-3 px-4 text-right">Precio Unit.</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                        <th className="py-3 px-6 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map(item => (
                        <tr key={item.product_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-bold text-sm text-text-main">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">ID: {item.product_id}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center">
                              <input 
                                type="number" 
                                className="w-16 h-8 text-center font-black text-sm bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-primary/20"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                              />
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-bold text-sm">
                            {formatPYG(item.unit_price)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-sm text-primary">
                            {formatPYG(item.unit_price * item.quantity)}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button onClick={() => removeItem(item.product_id)} className="text-slate-300 hover:text-red-500 transition-colors">
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

        {/* Columna Derecha: Configuración y Totales */}
        <div className="lg:col-span-4 space-y-8">
          
          <Card className="border-border-subtle shadow-fluent-2">
            <CardHeader className="bg-slate-50/50 border-b border-border-subtle py-4">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-slate-500">
                <Calendar size={16} /> Vigencia y Notas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Válido hasta:</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    type="date" 
                    className="pl-10 font-bold border-slate-200" 
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notas Comerciales:</label>
                <textarea 
                  className="w-full min-h-[120px] p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="Instrucciones especiales para el cliente o detalles de la oferta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* CUADRO DE TOTALES */}
          <Card className="bg-gradient-to-br from-[#003966] via-[#004578] to-[#0f6cbd] text-white border-none shadow-2xl shadow-blue-900/20 overflow-hidden">
            <CardContent className="p-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-blue-200/80 font-bold text-xs uppercase tracking-[0.2em]">
                    <span>Subtotal Neto</span>
                    <span className="font-mono">{formatPYG(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-blue-200/80 font-bold text-xs uppercase tracking-[0.2em]">
                    <span>IVA Estimado (10%)</span>
                    <span className="font-mono">{formatPYG(totals.tax)}</span>
                  </div>
                  <div className="h-px bg-white/10 my-4" />
                  <div className="flex justify-between items-end">
                    <div>
                        <p className="text-xs font-black text-blue-100 uppercase tracking-widest leading-none mb-2">Total Presupuesto</p>
                        <h2 className="text-4xl font-black tracking-tighter font-mono">
                            {formatPYG(totals.total)}
                        </h2>
                    </div>
                    <Calculator size={40} className="text-white/20" />
                  </div>
               </div>
            </CardContent>
          </Card>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
            <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
              Los precios en el presupuesto se reservan según la vigencia seleccionada. Pasada la fecha, el sistema requerirá actualización de precios.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BudgetCreate;

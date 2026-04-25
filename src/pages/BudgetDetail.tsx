import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  CheckCircle2, 
  XCircle, 
  ArrowRightLeft,
  Calendar,
  User,
  Clock,
  FileText,
  MoreVertical,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { budgetService } from '@/services/budgetService';
import { Budget, BudgetItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatPYG } from '@/utils/currencyUtils';
import DataState from '@/components/ui/DataState';
import ToastContainer from '@/components/ui/ToastContainer';

const BudgetDetail: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [data, setData] = useState<{ budget: Budget; items: BudgetItem[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await budgetService.getBudgetById(id);
      setData(response);
    } catch (error) {
      addToast('Error al cargar el detalle del presupuesto', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: Budget['status']) => {
    if (!id) return;
    try {
      await budgetService.updateBudgetStatus(id, { status: newStatus });
      addToast(`Estado actualizado a ${newStatus}`, 'success');
      fetchDetail();
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  const handleConvertToSale = async () => {
    if (!id) return;
    try {
      const result = await budgetService.convertToSale(id);
      if (result.success) {
        addToast('Presupuesto convertido a venta', 'success');
        fetchDetail();
      }
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  if (isLoading) return <div className="p-20"><DataState variant="loading" /></div>;
  if (!data) return <div className="p-20"><DataState variant="empty" title="No se encontró el presupuesto" /></div>;

  const { budget, items } = data;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-20">
      <ToastContainer />
      
      {/* Header Acciones */}
      <div className="flex items-center justify-between py-4 border-b border-border-subtle bg-background-base/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft size={24} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black tracking-tight text-text-main">Presupuesto #{budget.budget_number}</h1>
                <Badge className={
                    budget.status === 'CONVERTED' ? 'bg-blue-100 text-blue-700' :
                    budget.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    'bg-amber-100 text-amber-700'
                }>
                    {budget.status}
                </Badge>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sucursal: {budget.branch_id} • Creado el {new Date(budget.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold border-border-base">
            <Printer size={18} className="mr-2" /> Imprimir
          </Button>
          <Button variant="outline" className="font-bold border-border-base">
            <Download size={18} className="mr-2" /> PDF
          </Button>
          
          {budget.status === 'PENDING' && (
             <Button onClick={() => handleStatusChange('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white font-bold px-6">
                Aprobar Presupuesto
             </Button>
          )}

          {budget.status === 'APPROVED' && (
             <Button onClick={handleConvertToSale} className="bg-primary hover:bg-primary-hover text-white font-bold px-6 shadow-fluent-8 animate-pulse">
                <ArrowRightLeft size={18} className="mr-2" /> Convertir en Venta
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lado Izquierdo: Items */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border-subtle shadow-fluent-2 overflow-hidden">
             <div className="bg-slate-50/50 p-4 border-b border-border-subtle flex justify-between items-center">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                    <FileText size={14} /> Detalle de Productos
                </span>
                <span className="text-xs font-bold text-slate-400">{items.length} items registrados</span>
             </div>
             <table className="w-full">
                <thead className="bg-white border-b border-border-subtle">
                   <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-4 px-6 text-left">Descripción del Item</th>
                      <th className="py-4 px-4 text-center">Cantidad</th>
                      <th className="py-4 px-4 text-right">Precio Unit.</th>
                      <th className="py-4 px-6 text-right">Subtotal</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {items.map(item => (
                      <tr key={item.id} className="text-sm">
                         <td className="py-4 px-6">
                            <p className="font-bold text-text-main">{item.product_name || 'Producto ID: ' + item.product_id}</p>
                            <p className="text-[10px] text-slate-400 font-mono">Cód: {item.product_id}</p>
                         </td>
                         <td className="py-4 px-4 text-center font-bold text-slate-600">
                            {item.quantity}
                         </td>
                         <td className="py-4 px-4 text-right font-mono font-medium">
                            {formatPYG(item.unit_price)}
                         </td>
                         <td className="py-4 px-6 text-right font-mono font-black text-primary">
                            {formatPYG(item.unit_price * item.quantity)}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             <div className="p-8 bg-slate-50/30 flex flex-col items-end gap-3 border-t border-border-subtle">
                <div className="flex justify-between w-64 text-sm font-bold text-slate-500">
                    <span>Subtotal Neto:</span>
                    <span className="font-mono">{formatPYG(budget.total_amount - budget.tax_amount)}</span>
                </div>
                <div className="flex justify-between w-64 text-sm font-bold text-slate-500">
                    <span>IVA (10%):</span>
                    <span className="font-mono">{formatPYG(budget.tax_amount)}</span>
                </div>
                <div className="flex justify-between w-64 text-xl font-black text-primary pt-2 border-t border-slate-200">
                    <span>Total Final:</span>
                    <span className="font-mono">{formatPYG(budget.total_amount)}</span>
                </div>
             </div>
          </Card>

          {budget.notes && (
            <Card className="border-border-subtle bg-amber-50/30">
               <CardContent className="p-6 flex gap-4">
                  <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                  <div>
                     <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider mb-2">Notas y Observaciones</p>
                     <p className="text-sm text-amber-900 font-medium leading-relaxed">{budget.notes}</p>
                  </div>
               </CardContent>
            </Card>
          )}
        </div>

        {/* Lado Derecho: Información de Contexto */}
        <div className="lg:col-span-4 space-y-6">
           <Card className="border-border-subtle shadow-fluent-2">
              <CardContent className="p-6 space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">Información del Cliente</label>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-border-subtle">
                       <div className="size-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                          <User size={18} />
                       </div>
                       <div>
                          <p className="font-black text-sm text-text-main">{budget.client_name || 'Consumidor Final'}</p>
                          <p className="text-[10px] font-bold text-slate-400">ID: {budget.client_id}</p>
                       </div>
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">Vigencia Comercial</label>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-border-subtle">
                       <div className="size-10 rounded-full bg-white flex items-center justify-center text-amber-500 shadow-sm">
                          <Clock size={18} />
                       </div>
                       <div>
                          <p className="font-black text-sm text-text-main">Válido hasta el {new Date(budget.valid_until).toLocaleDateString()}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pasada esta fecha la oferta caduca</p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full justify-start font-bold gap-3 text-slate-600 h-11">
                       <MoreVertical size={16} /> Historial de Cambios
                    </Button>
                    {budget.status !== 'REJECTED' && budget.status !== 'CONVERTED' && (
                        <Button variant="ghost" onClick={() => handleStatusChange('REJECTED')} className="w-full justify-start font-bold gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 h-11">
                            <XCircle size={16} /> Rechazar Oferta
                        </Button>
                    )}
                 </div>
              </CardContent>
           </Card>

           <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                 <ShieldCheck className="text-emerald-400" size={24} />
                 <h3 className="font-black text-sm uppercase tracking-widest">Seguridad SIFEN</h3>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                 Este presupuesto ha sido registrado bajo las normativas de pre-facturación electrónica. Al convertirse en venta, se generará el documento tributario correspondiente.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetDetail;

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Calendar, 
  Package, 
  AlertTriangle,
  MoreVertical,
  Printer,
  History,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { purchaseRequisitionService } from '@/services/purchaseRequisitionService';
import { PurchaseRequisition, PurchaseRequisitionDetail } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import DataState from '@/components/ui/DataState';
import ToastContainer from '@/components/ui/ToastContainer';

const PurchaseRequisitionDetailView: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [data, setData] = useState<{ requisition: PurchaseRequisition; details: PurchaseRequisitionDetail[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const response = await purchaseRequisitionService.getRequisitionById(id);
      setData(response.data);
    } catch (error) {
      addToast('Error al cargar la requisición', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await purchaseRequisitionService.updateStatus(id, { new_status: newStatus });
      addToast(`Solicitud ${newStatus}`, 'success');
      fetchDetail();
    } catch (error: any) {
      addToast(error.message, 'error');
    }
  };

  if (isLoading) return <div className="p-20"><DataState variant="loading" /></div>;
  if (!data) return <div className="p-20"><DataState variant="empty" title="No se encontró la solicitud" /></div>;

  const { requisition, details } = data;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return <Badge className="bg-red-100 text-red-700 border-red-200 font-black text-[9px] px-2 py-0">ALTA</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-black text-[9px] px-2 py-0">MEDIA</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 border-slate-200 font-black text-[9px] px-2 py-0">BAJA</Badge>;
    }
  };

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
                <h1 className="text-2xl font-black tracking-tight text-text-main">Requisición #{requisition.id.substring(0, 8)}</h1>
                <Badge className={
                    requisition.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    requisition.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                }>
                    {requisition.status}
                </Badge>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Solicitado por {requisition.user_name} • Sucursal: {requisition.branch_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="font-bold border-border-base"><Printer size={18} className="mr-2" /> Imprimir</Button>
          
          {requisition.status === 'PENDING' && (
             <>
               <Button variant="ghost" onClick={() => handleStatusChange('REJECTED')} className="text-red-500 font-bold px-6 border border-red-100 hover:bg-red-50">Rechazar</Button>
               <Button onClick={() => handleStatusChange('APPROVED')} className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 shadow-fluent-8">Aprobar Solicitud</Button>
             </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-border-subtle shadow-fluent-2 overflow-hidden">
             <div className="bg-slate-50/50 p-4 border-b border-border-subtle flex justify-between items-center text-xs font-black uppercase text-slate-500 tracking-wider">
                <span><Package size={14} className="inline mr-2" /> Ítems en Solicitud</span>
                <span>{details.length} líneas</span>
             </div>
             <table className="w-full">
                <thead className="bg-white border-b border-border-subtle">
                   <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="py-4 px-6 text-left">Producto</th>
                      <th className="py-4 px-4 text-center">Cantidad</th>
                      <th className="py-4 px-4 text-center">Prioridad</th>
                      <th className="py-4 px-6 text-left">Notas</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {details.map(item => (
                      <tr key={item.id} className="text-sm hover:bg-slate-50/30 transition-colors">
                         <td className="py-4 px-6">
                            <p className="font-bold text-text-main">{item.product_name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{item.product_id}</p>
                         </td>
                         <td className="py-4 px-4 text-center font-black text-slate-700">
                            {item.quantity} {item.unit || 'uds'}
                         </td>
                         <td className="py-4 px-4 text-center">
                            {getPriorityBadge(item.priority)}
                         </td>
                         <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                            {item.notes || '—'}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </Card>

          {requisition.notes && (
            <Card className="border-border-subtle bg-slate-50/50">
               <CardContent className="p-6">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Observaciones del Solicitante</p>
                  <p className="text-sm text-text-secondary font-medium leading-relaxed">{requisition.notes}</p>
               </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
           <Card className="border-border-subtle shadow-fluent-2">
              <CardContent className="p-6 space-y-6">
                 <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-3">Contexto de Solicitud</label>
                    <div className="space-y-3">
                       <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-border-subtle">
                          <User size={16} className="text-primary" />
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Usuario</p>
                             <p className="text-xs font-black text-text-main truncate">{requisition.user_name}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-border-subtle">
                          <Calendar size={16} className="text-primary" />
                          <div className="flex-1 min-w-0">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Fecha Creación</p>
                             <p className="text-xs font-black text-text-main truncate">{new Date(requisition.created_at).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full justify-start font-bold gap-3 text-slate-600 h-11 border-border-base">
                       <History size={16} /> Ver Historial de Estados
                    </Button>
                    <Button variant="outline" className="w-full justify-start font-bold gap-3 text-slate-600 h-11 border-border-base">
                       <FileText size={16} /> Exportar como PDF
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex gap-4 shadow-sm">
              <BadgeAlert className="text-amber-600 flex-shrink-0" size={24} />
              <div>
                 <h4 className="text-xs font-black uppercase text-amber-700 tracking-wider mb-1">Revisión de Compras</h4>
                 <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                    Asegúrese de verificar la disponibilidad en otros depósitos antes de aprobar una compra externa.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseRequisitionDetailView;

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  User, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Filter,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { purchaseRequisitionService } from '@/services/purchaseRequisitionService';
import { useBranch } from '@/contexts/BranchContext';
import { PurchaseRequisition } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import DataState from '@/components/ui/DataState';
import ToastContainer from '@/components/ui/ToastContainer';

/**
 * PurchaseRequisitionList - Listado administrativo de requisiciones de compra (Fluent 2.0)
 * Permite gestionar el flujo interno de solicitudes de stock entre sucursales y compras.
 */
const PurchaseRequisitionList: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentBranchId } = useBranch();
  
  // Estados de datos
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [page, setPage] = useState(1);

  const fetchRequisitions = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page, page_size: 15 };
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      
      const response = await purchaseRequisitionService.getRequisitions(filters);
      setRequisitions(response.data || []);
    } catch (error) {
      addToast(t('common.error.load', 'Error al cargar requisiciones'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [page, statusFilter, currentBranchId]);

  const filteredRequisitions = useMemo(() => {
    if (!searchTerm) return requisitions;
    const lowerTerm = searchTerm.toLowerCase();
    return requisitions.filter(r => 
      r.id.toLowerCase().includes(lowerTerm) || 
      r.user_name.toLowerCase().includes(lowerTerm) ||
      (r.supplier_name || '').toLowerCase().includes(lowerTerm)
    );
  }, [requisitions, searchTerm]);

  const getStatusBadge = (status: PurchaseRequisition['status']) => {
    switch (status) {
      case 'DRAFT':
        return <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent">BORRADOR</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent bg-[#fff4ce] text-[#794500]"><span className="size-1.5 rounded-full bg-[#794500]" /> PENDIENTE</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent bg-[#dff6dd] text-[#107c10]"><span className="size-1.5 rounded-full bg-[#107c10]" /> APROBADO</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent bg-[#fde7e9] text-[#a4262c]"><span className="size-1.5 rounded-full bg-[#a4262c]" /> RECHAZADO</span>;
      case 'CANCELLED':
        return <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent">CANCELADO</span>;
      default:
        return <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent">{status}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-display">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            {t('logistics.requisitions.title', 'Requisiciones de Compra')}
          </h1>
          <p className="text-text-secondary text-base font-medium mt-1.5">
            Gestiona las solicitudes de mercadería y suministros de la sucursal.
          </p>
        </div>
      </div>

      {/* Grid de Datos Alta Densidad Fluent 2 */}
      <div className="bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden">
        {/* Barra de Herramientas y Filtros (Integrada) */}
        <div className="px-8 py-5 border-b border-border-subtle bg-[#f3f2f1]/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por ID, usuario o proveedor..." 
              className="pl-10 h-10 bg-white border-border-base focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1 rounded-lg border border-border-base shadow-sm">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${
                            statusFilter === status 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        {status === 'ALL' ? 'Todos' : status}
                    </button>
                ))}
            </div>
            
            <div className="h-8 w-px bg-border-base hidden md:block"></div>

            <Button 
                className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase rounded shadow-sm transition-all px-5 py-2 h-auto"
                onClick={() => navigate('/logistica/requisiciones/nueva')}
            >
                <Plus size={14} className="mr-1.5" />
                Nueva Solicitud
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No hay requisiciones pendientes" /></div>
        ) : (
          <Table className="w-full text-left">
            <TableHeader className="bg-white border-b border-border-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 pl-8 text-[11px] font-bold uppercase text-slate-400 tracking-wider w-[140px]">ID Solicitud</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Solicitante</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Estado</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Proveedor Sugerido</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Fecha</TableHead>
                <TableHead className="py-5 pr-8 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredRequisitions.map((req) => (
                <TableRow 
                  key={req.id} 
                  className="hover:bg-slate-50/80 group transition-colors cursor-pointer border-none"
                  onClick={() => navigate(`/logistica/requisiciones/${req.id}`)}
                >
                  <TableCell className="py-5 pl-8">
                    <span className="font-mono font-black text-primary text-sm">#{req.id.substring(0, 8)}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full border border-border-subtle bg-[#f3f2f1] flex items-center justify-center font-bold text-text-secondary">
                        <User size={18} />
                      </div>
                      <span className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">{req.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    {getStatusBadge(req.status)}
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="text-xs font-bold text-text-main">{req.supplier_name || 'Sin asignar'}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-slate-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                          <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-fluent-16 rounded-xl border-border-subtle">
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => navigate(`/logistica/requisiciones/${req.id}`)}>
                          <span className="material-symbols-outlined text-lg text-text-secondary">description</span> Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-lg">add_shopping_cart</span> Generar Orden de Compra
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border-subtle" />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-error hover:bg-error/5 hover:text-error rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-lg">cancel</span> Cancelar Solicitud
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default PurchaseRequisitionList;

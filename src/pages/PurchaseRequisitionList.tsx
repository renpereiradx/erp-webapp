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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter">BORRADOR</Badge>;
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><Clock size={12}/> PENDIENTE</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><CheckCircle2 size={12}/> APROBADO</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><XCircle size={12}/> RECHAZADO</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-slate-200 text-slate-400 border-slate-300 gap-1.5 font-black uppercase text-[10px] tracking-tighter">CANCELADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main flex items-center gap-3">
            <ClipboardList className="text-primary" size={32} />
            {t('logistics.requisitions.title', 'Requisiciones de Compra')}
          </h1>
          <p className="text-text-secondary font-medium mt-1">
            Gestiona las solicitudes de mercadería y suministros de la sucursal.
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-hover text-white font-bold h-11 px-6 shadow-fluent-8"
          onClick={() => navigate('/logistica/requisiciones/nueva')}
        >
          <Plus size={20} className="mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Herramientas y Filtros */}
      <Card className="border-border-subtle shadow-fluent-2 bg-surface overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por ID, usuario o proveedor..." 
              className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-md transition-all ${
                            statusFilter === status 
                            ? 'bg-white text-primary shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {status === 'ALL' ? 'Todos' : status}
                    </button>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Requisiciones */}
      <div className="bg-white rounded-xl shadow-fluent-8 border border-border-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredRequisitions.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No hay requisiciones pendientes" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border-subtle">
              <TableRow>
                <TableHead className="w-[120px] font-black text-[10px] uppercase text-slate-400 py-5 pl-8">ID Solicitud</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Solicitante</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5 text-center">Estado</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Proveedor Sugerido</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Fecha</TableHead>
                <TableHead className="w-[80px] py-5 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequisitions.map((req) => (
                <TableRow 
                  key={req.id} 
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/logistica/requisiciones/${req.id}`)}
                >
                  <TableCell className="py-4 pl-8">
                    <span className="font-mono font-black text-primary text-sm">#{req.id.substring(0, 8)}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-sm text-text-main">{req.user_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {getStatusBadge(req.status)}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-xs font-bold text-slate-600">{req.supplier_name || 'Sin asignar'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(req.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-fluent-16">
                        <DropdownMenuItem className="gap-3 text-xs font-bold">
                          <FileText size={14} className="text-slate-400" /> Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-primary bg-primary/5">
                          <ArrowRight size={14} /> Generar Orden de Compra
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-red-600">
                          <XCircle size={14} /> Cancelar Solicitud
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

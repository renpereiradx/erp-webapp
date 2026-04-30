import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  User, 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileSearch,
  Printer,
  Download,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { budgetService } from '@/services/budgetService';
import { useBranch } from '@/contexts/BranchContext';
import { Budget, PaginatedResponse } from '@/types';
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
import { formatPYG } from '@/utils/currencyUtils';
import DataState from '@/components/ui/DataState';
import ToastContainer from '@/components/ui/ToastContainer';

/**
 * BudgetManagement - Interfaz para gestión de cotizaciones y presupuestos (Fluent 2.0)
 * Permite seguimiento del ciclo de vida comercial desde la oferta hasta la conversión en venta.
 */
const BudgetManagement: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { currentBranchId } = useBranch();
  
  // Estados de datos
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBudgets = async () => {
    setIsLoading(true);
    try {
      const filters: any = { page, page_size: 15 };
      if (statusFilter !== 'ALL') filters.status = statusFilter;
      
      const response = await budgetService.getBudgets(filters);
      setBudgets(response.data || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      addToast(t('common.error.load', 'Error al cargar presupuestos'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [page, statusFilter, currentBranchId]);

  // Filtrado local para búsqueda por texto
  const filteredBudgets = useMemo(() => {
    if (!searchTerm) return budgets;
    const lowerTerm = searchTerm.toLowerCase();
    return budgets.filter(b => 
      b.budget_number.toLowerCase().includes(lowerTerm) || 
      (b.client_name || '').toLowerCase().includes(lowerTerm)
    );
  }, [budgets, searchTerm]);

  const getStatusBadge = (status: Budget['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><Clock size={12}/> PENDIENTE</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><CheckCircle2 size={12}/> APROBADO</Badge>;
      case 'CONVERTED':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><ArrowRightLeft size={12}/> VENDIDO</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-red-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><XCircle size={12}/> RECHAZADO</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-slate-100 text-slate-500 border-slate-200 gap-1.5 font-black uppercase text-[10px] tracking-tighter"><AlertCircle size={12}/> EXPIRADO</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleConvertToSale = async (id: string) => {
    try {
      const result = await budgetService.convertToSale(id);
      if (result.success) {
        addToast(t('budget.success.converted', 'Presupuesto convertido a venta exitosamente'), 'success');
        fetchBudgets(); // Recargar lista
        // Redirigir al detalle de la venta (opcional)
        // navigate(`/cobros-ventas/${result.sale_id}`);
      }
    } catch (error: any) {
      addToast(error.message || 'Error al convertir presupuesto', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-display">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            {t('commercial.budgets.title', 'Presupuestos y Cotizaciones')}
          </h1>
          <p className="text-text-secondary text-base font-medium mt-1.5">
            Gestiona las ofertas comerciales y conviértelas en ventas firmes.
          </p>
        </div>
      </div>

      {/* Tabla de Datos de Alta Densidad (Fluent 2) */}
      <div className="bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden">
        {/* Barra de Herramientas y Filtros (Integrada) */}
        <div className="px-8 py-5 border-b border-border-subtle bg-[#f3f2f1]/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por Nº o cliente..." 
              className="pl-10 h-10 bg-white border-border-base focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white p-1 rounded-lg border border-border-base shadow-sm">
                {['ALL', 'PENDING', 'APPROVED', 'CONVERTED'].map((status) => (
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

            <Button variant="outline" size="sm" className="bg-white border border-border-base text-[10px] font-bold uppercase rounded hover:bg-slate-50 transition-all px-4 py-1.5 h-auto">
                <Printer size={14} className="mr-1.5" />
                Imprimir
            </Button>
            <Button 
                className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase rounded shadow-sm transition-all px-5 py-2 h-auto"
                onClick={() => navigate('/comercial/presupuestos/nuevo')}
            >
                <Plus size={14} className="mr-1.5" />
                Nueva Cotización
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No se encontraron presupuestos" /></div>
        ) : (
          <Table className="w-full text-left">
            <TableHeader className="bg-white border-b border-border-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 pl-8 text-[11px] font-bold uppercase text-slate-400 tracking-wider w-[140px]">Presupuesto</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Cliente</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Estado</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Total</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Validez</TableHead>
                <TableHead className="py-5 pr-8 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredBudgets.map((budget) => (
                <TableRow 
                  key={budget.id} 
                  className="hover:bg-slate-50/80 group transition-colors cursor-pointer border-none"
                  onClick={() => navigate(`/comercial/presupuestos/${budget.id}`)}
                >
                  <TableCell className="py-5 pl-8">
                    <span className="font-mono font-black text-primary text-sm">#{budget.budget_number}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full border border-border-subtle bg-[#f3f2f1] flex items-center justify-center font-bold text-text-secondary">
                        <User size={18} />
                      </div>
                      <span className="font-bold text-sm text-text-main group-hover:text-primary transition-colors">{budget.client_name || 'Consumidor Final'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    {getStatusBadge(budget.status)}
                  </TableCell>
                  <TableCell className="py-5 text-right">
                    <span className="font-mono font-black text-sm text-text-main">{formatPYG(budget.total_amount)}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(budget.valid_until).toLocaleDateString()}
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
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => navigate(`/comercial/presupuestos/${budget.id}`)}>
                          <span className="material-symbols-outlined text-lg text-text-secondary">search</span> Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-lg text-text-secondary">print</span> Imprimir PDF
                        </DropdownMenuItem>
                        {budget.status === 'APPROVED' && (
                            <DropdownMenuItem className="gap-3 text-xs font-bold text-primary hover:bg-primary/5 rounded-lg cursor-pointer" onClick={() => handleConvertToSale(budget.id)}>
                                <span className="material-symbols-outlined text-lg">swap_horiz</span> Convertir en Venta
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator className="bg-border-subtle" />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-error hover:bg-error/5 hover:text-error rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-lg">cancel</span> Cancelar Presupuesto
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Paginación */}
        {filteredBudgets.length > 0 && !isLoading && (
            <div className="px-8 py-5 border-t border-border-subtle bg-slate-50/50 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="h-8 font-bold text-[10px] uppercase border-border-base bg-white hover:bg-slate-50 px-4"
                >
                    Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="h-8 font-bold text-[10px] uppercase border-border-base bg-white hover:bg-slate-50 px-4"
                >
                    Siguiente
                </Button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default BudgetManagement;

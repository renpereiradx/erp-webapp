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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main flex items-center gap-3">
            <FileText className="text-primary" size={32} />
            {t('commercial.budgets.title', 'Presupuestos y Cotizaciones')}
          </h1>
          <p className="text-text-secondary font-medium mt-1">
            Gestiona las ofertas comerciales y conviértelas en ventas firmes.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="font-bold h-11 px-4 border-border-base">
                <Printer size={20} className="mr-2" />
                Imprimir Reporte
            </Button>
            <Button 
            className="bg-primary hover:bg-primary-hover text-white font-bold h-11 px-6 shadow-fluent-8"
            onClick={() => navigate('/comercial/presupuestos/nuevo')}
            >
            <Plus size={20} className="mr-2" />
            Nueva Cotización
            </Button>
        </div>
      </div>

      {/* Barra de Herramientas y Filtros */}
      <Card className="border-border-subtle shadow-fluent-2 bg-surface overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por Nº de presupuesto o cliente..." 
              className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                {['ALL', 'PENDING', 'APPROVED', 'CONVERTED'].map((status) => (
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

      {/* Tabla de Datos */}
      <div className="bg-white rounded-xl shadow-fluent-8 border border-border-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredBudgets.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No se encontraron presupuestos" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border-subtle">
              <TableRow>
                <TableHead className="w-[120px] font-black text-[10px] uppercase text-slate-400 py-5 pl-8">Presupuesto</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Cliente</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5 text-center">Estado</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5 text-right">Total</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Validez</TableHead>
                <TableHead className="w-[80px] py-5 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget) => (
                <TableRow 
                  key={budget.id} 
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/comercial/presupuestos/${budget.id}`)}
                >
                  <TableCell className="py-4 pl-8">
                    <span className="font-mono font-black text-primary text-sm">#{budget.budget_number}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="font-bold text-sm text-text-main">{budget.client_name || 'Consumidor Final'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    {getStatusBadge(budget.status)}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <span className="font-mono font-black text-sm text-text-main">{formatPYG(budget.total_amount)}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2 text-[11px] text-text-secondary font-medium">
                      <Calendar size={12} className="text-slate-400" />
                      {new Date(budget.valid_until).toLocaleDateString()}
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
                          <FileSearch size={14} className="text-slate-400" /> Ver Detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold">
                          <Printer size={14} className="text-slate-400" /> Imprimir PDF
                        </DropdownMenuItem>
                        {budget.status === 'APPROVED' && (
                            <DropdownMenuItem className="gap-3 text-xs font-bold text-primary bg-primary/5" onClick={() => handleConvertToSale(budget.id)}>
                                <ArrowRightLeft size={14} /> Convertir en Venta
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-red-600">
                          <XCircle size={14} /> Cancelar Presupuesto
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

      {/* Paginación */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-slate-500 font-medium">
          Mostrando página {page} de {totalPages}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="h-8 font-bold text-[10px] uppercase"
          >
            Anterior
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            disabled={page === totalPages}
            onClick={() => setPage(p => p + 1)}
            className="h-8 font-bold text-[10px] uppercase"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BudgetManagement;

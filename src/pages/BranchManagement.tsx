import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Building2, 
  Download, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  Receipt,
  Warehouse
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { branchService } from '@/features/branches/services/branchService';
import { Branch } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import DataState from '@/components/ui/DataState';
import ToastContainer from '@/components/ui/ToastContainer';
import BranchModal from '@/features/branches/components/BranchModal';

/**
 * BranchManagement - Página de gestión de sucursales (Fluent Design 2)
 */
const BranchManagement: React.FC = () => {
  const { t } = useI18n();
  const { addToast, toasts, removeToast } = useToast();
  const queryClient = useQueryClient();
  
  // Estados de datos
  const [searchTerm, setSearchTerm] = useState('');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'fiscal' | 'access'>('general');
  const [branchToDeactivate, setBranchToDeactivate] = useState<Branch | null>(null);

  // Mutations
  const updateBranchMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => branchService.updateBranch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      addToast(t('common.success.update', 'Cambios guardados correctamente'), 'success');
      setBranchToDeactivate(null);
    },
    onError: (error: any) => addToast(error.message || 'Error al actualizar', 'error')
  });

  const handleEdit = (branch: Branch, tab: 'general' | 'fiscal' | 'access' = 'general') => {
    setSelectedBranch(branch);
    setActiveTab(tab);
    setIsBranchModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setActiveTab('general');
    setIsBranchModalOpen(true);
  };

  const handleDeactivate = (branch: Branch) => {
    setBranchToDeactivate(branch);
  };

  const confirmDeactivate = () => {
    if (!branchToDeactivate) return;
    updateBranchMutation.mutate({ id: branchToDeactivate.id, data: { is_active: false } });
  };

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getBranches({ page_size: 100 }), // Aumentamos el límite para asegurar visibilidad
  });

  const branches = (response as any)?.branches || response?.data || [];

  useEffect(() => {
    if (isError) {
      addToast(t('common.error.load', 'Error al cargar sucursales'), 'error');
    }
  }, [isError, addToast, t]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b: any) => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  // Lógica de Exportación CSV
  const exportToCSV = () => {
    if (filteredBranches.length === 0) return;
    
    const headers = ['Código', 'Nombre', 'Razón Social', 'RUC', 'Tipo', 'Estado', 'Ciudad', 'Teléfono'];
    const rows = filteredBranches.map((b: any) => [
      b.code,
      b.name,
      b.legal_name || '',
      b.ruc || '',
      b.branch_type || '',
      b.is_active ? 'Activo' : 'Inactivo',
      b.city || '',
      b.phone || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sucursales_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-display">
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            {t('branch.management.title', 'Gestión de Sucursales')}
            <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
              {branches.length} en total
            </span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">{t('branch.management.subtitle', 'Configura y administra los puntos de venta, almacenes y sus parámetros fiscales.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-11 px-6 font-bold border-2 hover:bg-slate-50 gap-2"
            onClick={exportToCSV}
            disabled={filteredBranches.length === 0}
          >
            <Download size={18} />
            {t('common.export', 'Exportar')}
          </Button>
          <Button 
            className="h-11 px-8 font-black gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
            onClick={handleCreate}
          >
            <Plus size={20} />
            {t('branch.management.new', 'Nueva Sucursal')}
          </Button>
        </div>
      </div>

      {/* Controles de Tabla */}
      <div className="bg-white rounded-2xl shadow-fluent-lg border border-border-subtle overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/30">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <Input 
              placeholder={t('common.search', 'Buscar por nombre o código...')}
              className="pl-10 h-11 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex justify-center"><DataState type="loading" /></div>
        ) : isError ? (
          <div className="p-20 flex justify-center"><DataState type="error" /></div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-20 flex justify-center"><DataState type="empty" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-6 font-bold text-slate-600">{t('common.code', 'Código')}</TableHead>
                <TableHead className="py-4 px-6 font-bold text-slate-600">{t('common.name', 'Nombre')}</TableHead>
                <TableHead className="py-4 px-6 font-bold text-slate-600">{t('common.type', 'Tipo')}</TableHead>
                <TableHead className="py-4 px-6 font-bold text-slate-600">{t('common.status', 'Estado')}</TableHead>
                <TableHead className="py-4 px-6 text-right font-bold text-slate-600">{t('common.actions', 'Acciones')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch: any) => (
                <TableRow key={branch.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                  <TableCell className="py-5 px-6">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {branch.code}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        {branch.is_warehouse ? <Warehouse size={20} /> : <Building2 size={20} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{branch.name}</span>
                        <span className="text-xs text-slate-500">{branch.city || t('common.no_location', 'Sin ubicación')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <span className="text-sm font-medium text-slate-600 capitalize">
                      {branch.branch_type?.toLowerCase().replace('_', ' ') || 'Punto de Venta'}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      branch.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <div className={`size-1.5 rounded-full ${branch.is_active ? 'bg-success' : 'bg-slate-400'}`} />
                      {branch.is_active ? t('common.active', 'Activo') : t('common.inactive', 'Inactivo')}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0 rounded-full hover:bg-slate-200">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 font-display rounded-xl shadow-fluent-lg">
                        <DropdownMenuItem onClick={() => handleEdit(branch, 'general')} className="gap-2 py-2.5 cursor-pointer">
                          <Edit2 size={14} className="text-slate-500" />
                          <span className="font-medium">{t('common.edit', 'Editar Información')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(branch, 'fiscal')} className="gap-2 py-2.5 cursor-pointer">
                          <Receipt size={14} className="text-slate-500" />
                          <span className="font-medium">{t('branch.actions.fiscal', 'Configuración Fiscal')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(branch, 'access')} className="gap-2 py-2.5 cursor-pointer">
                          <Shield size={14} className="text-slate-500" />
                          <span className="font-medium">{t('branch.actions.access', 'Control de Accesos')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeactivate(branch)}
                          className="gap-2 py-2.5 text-error focus:text-error cursor-pointer"
                          disabled={!branch.is_active}
                        >
                          <Trash2 size={14} />
                          <span className="font-bold">{t('common.deactivate', 'Desactivar Sucursal')}</span>
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

      <div className="p-6 bg-[#f3f2f1] rounded-xl border border-border-subtle">
        <p className="text-xs text-slate-600 leading-relaxed italic">
          <strong className="font-bold">Nota de Configuración:</strong> Los cambios realizados en la configuración fiscal y los accesos tienen efecto inmediato tras el refresco del token de sesión por parte de los usuarios afectados.
        </p>
      </div>

      {isBranchModalOpen && (
        <BranchModal 
          isOpen={isBranchModalOpen} 
          onClose={() => setIsBranchModalOpen(false)} 
          branch={selectedBranch}
          initialTab={activeTab}
        />
      )}

      {/* Modal de Desactivar Sucursal */}
      {branchToDeactivate && (
        <Dialog open={!!branchToDeactivate} onOpenChange={() => setBranchToDeactivate(null)}>
          <DialogContent className="sm:max-w-md font-display p-6 sm:p-8 gap-6">
            <DialogHeader className="gap-3">
              <div className="size-12 rounded-full bg-error/10 flex items-center justify-center mb-2 mx-auto">
                <span className="material-symbols-outlined text-3xl text-error">warning</span>
              </div>
              <DialogTitle className="text-xl font-bold text-center text-slate-800">
                Desactivar Sucursal
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 text-center mt-2 px-2">
                ¿Estás seguro de que deseas desactivar la sucursal <strong className="font-bold text-slate-800">{branchToDeactivate.name}</strong>?<br/><br/>
                Esta acción evitará que se registren nuevas operaciones en esta sucursal, pero conservará el historial.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-3 mt-6 sm:justify-center w-full">
              <Button variant="ghost" className="h-11 px-6 font-bold text-slate-600" onClick={() => setBranchToDeactivate(null)}>Cancelar</Button>
              <Button variant="destructive" className="h-11 px-8 font-bold bg-error hover:bg-error/90 text-white shadow-lg shadow-error/20" onClick={confirmDeactivate}>
                Desactivar Sucursal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default BranchManagement;

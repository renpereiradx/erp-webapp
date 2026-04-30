import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  Receipt, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle,
  Clock,
  Warehouse,
  ChevronRight,
  Settings2,
  Trash2,
  Edit2
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { branchService } from '@/services/branchService';
import { Branch, UserBranchAccess, BranchFiscalConfig } from '@/types';
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
 * BranchManagement - Página administrativa de sucursales (Fluent 2.0)
 * Permite gestionar la estructura física y legal de la empresa.
 */
const BranchManagement: React.FC = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  
  // Estados de datos
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de modales (Controlado localmente para agilidad MVP)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'fiscal' | 'access'>('info');

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const response = await branchService.getBranches();
      setBranches(response.data || []);
    } catch (error) {
      addToast(t('common.error.load', 'Error al cargar sucursales'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    return branches.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      b.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [branches, searchTerm]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 font-display">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main">
            {t('settings.branches.title', 'Gestión de Sucursales')}
          </h1>
          <p className="text-text-secondary text-base font-medium mt-1.5">
            Administra las sedes físicas, depósitos y su configuración legal.
          </p>
        </div>
      </div>

      {/* Grid de Datos Alta Densidad Fluent 2 */}
      <div className="bg-white rounded-xl shadow-fluent-shadow border border-border-subtle overflow-hidden">
        {/* Barra de Herramientas / Filtros integrada (Alta Densidad) */}
        <div className="px-8 py-5 border-b border-border-subtle bg-[#f3f2f1]/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por nombre o código..." 
              className="pl-10 h-10 bg-white border-border-base focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="bg-white border border-border-base text-[10px] font-bold uppercase rounded hover:bg-slate-50 transition-all px-4 py-1.5 h-auto">
              Exportar CSV
            </Button>
            <Button 
              className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold uppercase rounded shadow-sm transition-all px-5 py-2 h-auto"
              onClick={() => {
                setSelectedBranch(null);
                setIsBranchModalOpen(true);
              }}
            >
              <Plus size={14} className="mr-1.5" />
              Nueva Sucursal
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No se encontraron sucursales" /></div>
        ) : (
          <Table className="w-full text-left">
            <TableHeader className="bg-white border-b border-border-subtle">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 pl-8 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Código</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Nombre / Razón Social</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Tipo</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Estado</TableHead>
                <TableHead className="py-5 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Contacto</TableHead>
                <TableHead className="py-5 pr-8 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 text-xs">
              {filteredBranches.map((branch) => (
                <TableRow key={branch.id} className="hover:bg-slate-50/80 group transition-colors cursor-pointer border-none" onClick={() => {
                  setSelectedBranch(branch);
                  setIsBranchModalOpen(true);
                }}>
                  <TableCell className="py-5 pl-8">
                    <span className="font-mono font-black text-primary text-sm">{branch.code}</span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full border border-border-subtle flex items-center justify-center font-bold ${branch.is_warehouse ? 'bg-amber-50 text-amber-700' : 'bg-[#f3f2f1] text-text-secondary'}`}>
                        {branch.is_warehouse ? <Warehouse size={18} /> : <Building2 size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-main leading-none mb-1 group-hover:text-primary transition-colors">{branch.name}</p>
                        <p className="text-[11px] text-text-secondary font-semibold uppercase tracking-tight">{branch.legal_name || 'Sin razón social'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent">
                      {branch.branch_type}
                    </span>
                  </TableCell>
                  <TableCell className="py-5 text-center">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase border border-transparent ${branch.is_active ? 'bg-[#dff6dd] text-[#107c10]' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`size-1.5 rounded-full ${branch.is_active ? 'bg-[#107c10]' : 'bg-slate-400'}`} />
                      {branch.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex flex-col gap-1.5">
                      {branch.phone && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                          <Phone size={14} className="text-slate-400" /> {branch.phone}
                        </div>
                      )}
                      {branch.address && (
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium truncate max-w-[200px]" title={branch.address}>
                          <MapPin size={14} className="text-slate-400" /> {branch.address}
                        </div>
                      )}
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
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('info');
                        }}>
                          <span className="material-symbols-outlined text-lg text-text-secondary">edit</span> Editar Información
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('fiscal');
                        }}>
                          <span className="material-symbols-outlined text-lg text-text-secondary">receipt_long</span> Configuración Fiscal
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-text-main hover:bg-slate-50 rounded-lg cursor-pointer" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('access');
                        }}>
                          <span className="material-symbols-outlined text-lg text-text-secondary">admin_panel_settings</span> Accesos de Usuario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border-subtle" />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-error hover:bg-error/5 hover:text-error rounded-lg cursor-pointer">
                          <span className="material-symbols-outlined text-lg">delete</span> Desactivar Sucursal
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
    </div>
  );
};

export default BranchManagement;

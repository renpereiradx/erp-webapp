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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <ToastContainer />
      
      {/* Header de Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-main flex items-center gap-3">
            <Building2 className="text-primary" size={32} />
            {t('settings.branches.title', 'Gestión de Sucursales')}
          </h1>
          <p className="text-text-secondary font-medium mt-1">
            Administra las sedes físicas, depósitos y su configuración legal.
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-hover text-white font-bold h-11 px-6 shadow-fluent-8"
          onClick={() => {
            setSelectedBranch(null);
            setIsBranchModalOpen(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Nueva Sucursal
        </Button>
      </div>

      {/* Barra de Herramientas / Filtros */}
      <Card className="border-border-subtle shadow-fluent-2 bg-surface overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Buscar por nombre o código..." 
              className="pl-10 h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase tracking-wider text-slate-600">
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Datos */}
      <div className="bg-white rounded-xl shadow-fluent-8 border border-border-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-20"><DataState variant="loading" /></div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-20"><DataState variant="empty" title="No se encontraron sucursales" /></div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-border-subtle">
              <TableRow>
                <TableHead className="w-[100px] font-black text-[10px] uppercase text-slate-400 py-5 pl-8">Código</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Nombre / Razón Social</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5 text-center">Tipo</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5 text-center">Estado</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-400 py-5">Contacto</TableHead>
                <TableHead className="w-[80px] py-5 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => (
                <TableRow key={branch.id} className="group hover:bg-slate-50/80 transition-colors cursor-pointer" onClick={() => {
                  setSelectedBranch(branch);
                  setIsBranchModalOpen(true);
                }}>
                  <TableCell className="py-4 pl-8">
                    <span className="font-mono font-black text-primary text-sm">{branch.code}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-lg flex items-center justify-center ${branch.is_warehouse ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {branch.is_warehouse ? <Warehouse size={20} /> : <Building2 size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-text-main leading-none mb-1">{branch.name}</p>
                        <p className="text-[11px] text-text-secondary font-medium">{branch.legal_name || 'Sin razón social'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-bold text-[10px]">
                      {branch.branch_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${branch.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      <span className={`size-1.5 rounded-full ${branch.is_active ? 'bg-green-600' : 'bg-slate-400'}`} />
                      {branch.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      {branch.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium">
                          <Phone size={12} className="text-slate-400" /> {branch.phone}
                        </div>
                      )}
                      {branch.address && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium truncate max-w-[200px]">
                          <MapPin size={12} className="text-slate-400" /> {branch.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-primary">
                          <MoreVertical size={18} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-fluent-16">
                        <DropdownMenuItem className="gap-3 text-xs font-bold" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('info');
                        }}>
                          <Edit2 size={14} className="text-slate-400" /> Editar Información
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('fiscal');
                        }}>
                          <Receipt size={14} className="text-slate-400" /> Configuración Fiscal
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 text-xs font-bold" onClick={() => {
                           setSelectedBranch(branch);
                           setIsBranchModalOpen(true);
                           setActiveTab('access');
                        }}>
                          <ShieldCheck size={14} className="text-slate-400" /> Accesos de Usuario
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-3 text-xs font-bold text-red-600">
                          <Trash2 size={14} /> Desactivar Sucursal
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

      <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
          <strong>Nota Administrativa:</strong> Los cambios realizados en la configuración fiscal y los accesos tienen efecto inmediato tras el refresco del token de sesión por parte de los usuarios afectados.
        </p>
      </div>
    </div>
  );
};

export default BranchManagement;

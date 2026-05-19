import React, { useState, useEffect } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { 
  Branch, 
  CreateBranchRequest, 
  UpdateBranchRequest, 
  BranchFiscalConfig, 
  UserBranchAccess,
  GrantBranchAccessRequest,
  CreateBranchFiscalConfigRequest
} from '@/types';
import { branchService } from '@/features/branches/services/branchService';
import { useToast } from '@/hooks/useToast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Building2, Plus, Trash2, ShieldCheck, Receipt, UserPlus, Loader2, Check } from 'lucide-react';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  initialTab?: 'info' | 'fiscal' | 'access';
}

const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, branch, initialTab = 'info' }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!branch;

  // --- ESTADOS DE UI ---
  const [showAddFiscal, setShowAddFiscal] = useState(false);
  const [showAddAccess, setShowAddAccess] = useState(false);

  // Formulario Información General
  const [formData, setFormData] = useState<Partial<CreateBranchRequest>>({
    code: '',
    name: '',
    branch_type: 'POINT_OF_SALE',
    legal_name: '',
    trade_name: '',
    ruc: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    is_warehouse: false,
  });

  // Formulario Nuevo Acceso
  const [accessForm, setAccessForm] = useState<GrantBranchAccessRequest>({
    user_id: '',
    access_type: 'FULL',
    is_default_branch: false
  });

  // Formulario Nueva Config Fiscal
  const [fiscalForm, setFiscalForm] = useState<CreateBranchFiscalConfigRequest>({
    establishment_code: '',
    expedition_point: '',
    document_type: 'FACTURA',
    timbrado: '',
    next_invoice_number: 1,
    is_active: true
  });

  useEffect(() => {
    if (branch) {
      setFormData(branch);
    } else {
      setFormData({
        code: '',
        name: '',
        branch_type: 'POINT_OF_SALE',
        legal_name: '',
        trade_name: '',
        ruc: '',
        address: '',
        city: '',
        phone: '',
        email: '',
        is_warehouse: false,
      });
    }
    setShowAddFiscal(false);
    setShowAddAccess(false);
  }, [branch, isOpen]);

  // --- QUERIES PARA CONFIG FISCAL Y ACCESOS ---
  const { data: fiscalConfigs, isLoading: loadingFiscal } = useQuery({
    queryKey: ['branch-fiscal', branch?.id],
    queryFn: () => branchService.getFiscalConfigs(branch!.id),
    enabled: isEditing && isOpen,
  });

  const { data: accessList, isLoading: loadingAccess } = useQuery({
    queryKey: ['branch-access', branch?.id],
    queryFn: () => branchService.getAccesses(branch!.id),
    enabled: isEditing && isOpen,
  });

  // --- MUTATIONS ---
  const saveMutation = useMutation({
    mutationFn: (data: CreateBranchRequest | UpdateBranchRequest) => {
      if (isEditing && branch?.id) {
        return branchService.updateBranch(branch.id, data as UpdateBranchRequest);
      }
      return branchService.createBranch(data as CreateBranchRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      addToast('Sucursal guardada exitosamente', 'success');
      if (!isEditing) onClose();
    },
    onError: (error: any) => {
      addToast(error.message || 'Error al guardar la sucursal', 'error');
    }
  });

  const grantAccessMutation = useMutation({
    mutationFn: (data: GrantBranchAccessRequest) => branchService.grantAccess(branch!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-access', branch?.id] });
      addToast('Acceso otorgado correctamente', 'success');
      setShowAddAccess(false);
      setAccessForm({ user_id: '', access_type: 'FULL', is_default_branch: false });
    },
    onError: (error: any) => addToast(error.message || 'Error al otorgar acceso', 'error')
  });

  const addFiscalMutation = useMutation({
    mutationFn: (data: CreateBranchFiscalConfigRequest) => branchService.createFiscalConfig(branch!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-fiscal', branch?.id] });
      addToast('Configuración fiscal agregada', 'success');
      setShowAddFiscal(false);
      setFiscalForm({ establishment_code: '', expedition_point: '', document_type: 'FACTURA', timbrado: '', next_invoice_number: 1, is_active: true });
    },
    onError: (error: any) => addToast(error.message || 'Error al guardar configuración', 'error')
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (userId: string) => branchService.revokeAccess(branch!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-access', branch?.id] });
      addToast('Acceso revocado correctamente', 'success');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      addToast('Nombre y código son requeridos', 'warning');
      return;
    }
    saveMutation.mutate(formData as CreateBranchRequest);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto font-display p-6 sm:p-8 gap-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Building2 size={20} />
            </div>
            {isEditing ? `Gestionar: ${branch.name}` : 'Nueva Sucursal'}
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1.5 text-sm">
            {isEditing ? 'Administre la información general, configuración fiscal y permisos de usuario para esta sucursal.' : 'Complete los campos obligatorios para registrar una nueva sucursal en el sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-lg">
            <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-2 rounded-md">
              Información General
            </TabsTrigger>
            <TabsTrigger value="fiscal" disabled={!isEditing} className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-2 rounded-md">
              Config. Fiscal
            </TabsTrigger>
            <TabsTrigger value="access" disabled={!isEditing} className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-2 rounded-md">
              Accesos
            </TabsTrigger>
          </TabsList>

          {/* TAB: INFORMACIÓN GENERAL */}
          <TabsContent value="info" className="pt-6 animate-in fade-in duration-300">
            <form id="branch-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Código de Sucursal *</label>
                  <Input 
                    value={formData.code || ''} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    disabled={isEditing}
                    className="font-mono font-bold h-11"
                    placeholder="Ej: MATRIZ"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Nombre Comercial *</label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Sucursal Central"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Tipo de Sucursal</label>
                  <select 
                    className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors"
                    value={formData.branch_type || 'POINT_OF_SALE'}
                    onChange={(e) => setFormData({...formData, branch_type: e.target.value})}
                  >
                    <option value="POINT_OF_SALE">Punto de Venta</option>
                    <option value="WAREHOUSE">Depósito / Almacén</option>
                    <option value="HEADQUARTERS">Casa Central</option>
                    <option value="DISTRIBUTION_CENTER">Centro de Distribución</option>
                  </select>
                </div>
                <div className="flex items-start gap-3 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                  <input 
                    type="checkbox" 
                    id="is_warehouse"
                    className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20"
                    checked={formData.is_warehouse || false}
                    onChange={(e) => setFormData({...formData, is_warehouse: e.target.checked})}
                  />
                  <label htmlFor="is_warehouse" className="text-sm font-medium text-amber-900 cursor-pointer leading-tight">
                    Esta ubicación opera como depósito físico y mantiene inventario
                  </label>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Razón Social</label>
                  <Input 
                    value={formData.legal_name || ''} 
                    onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                    placeholder="Empresa S.A."
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">RUC</label>
                  <Input 
                    value={formData.ruc || ''} 
                    onChange={(e) => setFormData({...formData, ruc: e.target.value})}
                    placeholder="80000000-0"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Dirección Física</label>
                  <Input 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Calle Principal 123"
                    className="h-11"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Teléfono</label>
                    <Input 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-11"
                      placeholder="+595 900 000000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Email</label>
                    <Input 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-11"
                      placeholder="info@empresa.com"
                    />
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* TAB: CONFIGURACIÓN FISCAL */}
          <TabsContent value="fiscal" className="pt-6 animate-in fade-in duration-300 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Receipt size={18} className="text-primary" /> Timbrados y Puntos de Expedición
              </h3>
              <Button 
                size="sm" 
                className="h-9 px-4 text-xs font-bold uppercase bg-primary hover:bg-primary-hover shadow-sm"
                onClick={() => setShowAddFiscal(!showAddFiscal)}
              >
                {showAddFiscal ? 'Cancelar' : <><Plus size={16} className="mr-1.5" /> Nuevo Timbrado</>}
              </Button>
            </div>

            {showAddFiscal && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Establecimiento</label>
                    <Input 
                      placeholder="001" 
                      className="text-sm h-11 font-mono" 
                      value={fiscalForm.establishment_code}
                      onChange={(e) => setFiscalForm({...fiscalForm, establishment_code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Punto de Expedición</label>
                    <Input 
                      placeholder="001" 
                      className="text-sm h-11 font-mono"
                      value={fiscalForm.expedition_point}
                      onChange={(e) => setFiscalForm({...fiscalForm, expedition_point: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Número de Timbrado</label>
                    <Input 
                      placeholder="12345678" 
                      className="text-sm h-11 font-mono"
                      value={fiscalForm.timbrado}
                      onChange={(e) => setFiscalForm({...fiscalForm, timbrado: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                   <Button size="sm" variant="ghost" className="h-10 text-xs font-bold" onClick={() => setShowAddFiscal(false)}>Descartar</Button>
                   <Button 
                    size="sm" 
                    className="h-10 text-xs font-bold px-6 bg-primary text-white shadow-sm" 
                    onClick={() => addFiscalMutation.mutate(fiscalForm)}
                    disabled={addFiscalMutation.isPending}
                   >
                     {addFiscalMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                   </Button>
                </div>
              </div>
            )}

            {loadingFiscal ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
            ) : !fiscalConfigs?.configs?.length && !fiscalConfigs?.data?.length ? (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
                <div className="mx-auto size-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="text-slate-400 size-6" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sin configuraciones fiscales</p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">Define los puntos de expedición para habilitar la facturación electrónica en esta sucursal.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Establ. / Punto</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Tipo</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Timbrado</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Validez</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {(fiscalConfigs?.configs || fiscalConfigs?.data || []).map((cfg: BranchFiscalConfig) => (
                      <TableRow key={cfg.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-4 font-bold text-slate-700">{cfg.establishment_code}-{cfg.expedition_point}</TableCell>
                        <TableCell className="py-4 px-4 text-slate-600 font-medium">{cfg.document_type}</TableCell>
                        <TableCell className="py-4 px-4 font-mono font-medium text-slate-600">{cfg.timbrado}</TableCell>
                        <TableCell className="py-4 px-4 text-slate-500">{cfg.valid_to ? new Date(cfg.valid_to).toLocaleDateString() : 'Indefinido'}</TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <Button variant="ghost" size="sm" className="size-8 p-0 text-slate-400 hover:text-error hover:bg-error/10">
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB: ACCESOS */}
          <TabsContent value="access" className="pt-6 animate-in fade-in duration-300 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck size={18} className="text-success" /> Usuarios Autorizados
              </h3>
              <Button 
                size="sm" 
                className="h-9 px-4 text-xs font-bold uppercase border-success text-success hover:bg-success/5 shadow-sm" 
                variant="outline"
                onClick={() => setShowAddAccess(!showAddAccess)}
              >
                {showAddAccess ? 'Cancelar' : <><UserPlus size={16} className="mr-1.5" /> Asignar Usuario</>}
              </Button>
            </div>

            {showAddAccess && (
              <div className="p-5 bg-success/5 border border-success/20 rounded-xl animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-success/70 tracking-wider">ID del Usuario</label>
                    <Input 
                      placeholder="Ej: usr_abc123" 
                      className="text-sm h-11 border-success/30 focus:border-success focus:ring-success/20 bg-white" 
                      value={accessForm.user_id}
                      onChange={(e) => setAccessForm({...accessForm, user_id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-success/70 tracking-wider">Nivel de Acceso</label>
                    <select 
                      className="w-full h-11 px-3 border border-success/30 rounded-md text-sm font-medium bg-white focus:ring-2 focus:ring-success/20 outline-none"
                      value={accessForm.access_type}
                      onChange={(e) => setAccessForm({...accessForm, access_type: e.target.value})}
                    >
                      <option value="FULL">Acceso Total (Gestión)</option>
                      <option value="LIMITED">Solo Transacciones (Operativo)</option>
                      <option value="READ_ONLY">Solo Lectura (Auditoría)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                   <Button size="sm" variant="ghost" className="h-10 text-xs font-bold text-slate-600 hover:text-slate-800" onClick={() => setShowAddAccess(false)}>Descartar</Button>
                   <Button 
                    size="sm" 
                    className="h-10 text-xs font-bold px-6 bg-success hover:bg-success/90 text-white shadow-sm"
                    onClick={() => grantAccessMutation.mutate(accessForm)}
                    disabled={grantAccessMutation.isPending}
                   >
                     {grantAccessMutation.isPending ? 'Procesando...' : 'Asignar Usuario'}
                   </Button>
                </div>
              </div>
            )}

            {loadingAccess ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-success size-8" /></div>
            ) : !accessList?.access?.length && !accessList?.data?.length ? (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
                <div className="mx-auto size-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="text-slate-400 size-6" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sin accesos configurados</p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">Actualmente solo los administradores globales tienen acceso a esta sucursal.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Usuario</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Nivel de Acceso</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">Otorgado el</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {(accessList?.access || accessList?.data || []).map((acc: UserBranchAccess) => (
                      <TableRow key={acc.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-4 font-bold text-slate-700 flex items-center gap-3">
                           <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">{acc.user_id.substring(0,2).toUpperCase()}</div>
                           <span className="font-mono text-xs">{acc.user_id}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                            acc.access_type === 'FULL' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                            acc.access_type === 'LIMITED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {acc.access_type}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-slate-500">{new Date(acc.granted_at).toLocaleDateString()}</TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="size-8 p-0 text-slate-400 hover:text-error hover:bg-error/10"
                            onClick={() => revokeAccessMutation.mutate(acc.user_id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 pt-6 border-t gap-3">
          <Button variant="ghost" onClick={onClose} className="text-sm h-11 px-6 font-bold text-slate-600">Cancelar</Button>
          <Button 
            type="submit" 
            form="branch-form" 
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-white text-sm h-11 px-8 font-bold shadow-lg shadow-primary/20"
          >
            {saveMutation.isPending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Sucursal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BranchModal;
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto font-display">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <div className="size-8 bg-primary/10 text-primary rounded flex items-center justify-center">
              <Building2 size={18} />
            </div>
            {isEditing ? `Gestionar: ${branch.name}` : 'Nueva Sucursal'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={initialTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100/50 p-1">
            <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
              Información General
            </TabsTrigger>
            <TabsTrigger value="fiscal" disabled={!isEditing} className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
              Config. Fiscal
            </TabsTrigger>
            <TabsTrigger value="access" disabled={!isEditing} className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
              Accesos
            </TabsTrigger>
          </TabsList>

          {/* TAB: INFORMACIÓN GENERAL */}
          <TabsContent value="info" className="py-6 animate-in fade-in duration-300">
            <form id="branch-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Código de Sucursal *</label>
                  <Input 
                    value={formData.code || ''} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    disabled={isEditing}
                    className="font-mono font-bold"
                    placeholder="Ej: MATRIZ"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Nombre Comercial *</label>
                  <Input 
                    value={formData.name || ''} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej: Sucursal Central"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tipo de Sucursal</label>
                  <select 
                    className="w-full h-10 px-3 border border-border-base rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    value={formData.branch_type || 'POINT_OF_SALE'}
                    onChange={(e) => setFormData({...formData, branch_type: e.target.value})}
                  >
                    <option value="POINT_OF_SALE">Punto de Venta</option>
                    <option value="WAREHOUSE">Depósito / Almacén</option>
                    <option value="HEADQUARTERS">Casa Central</option>
                    <option value="DISTRIBUTION_CENTER">Centro de Distribución</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <input 
                    type="checkbox" 
                    id="is_warehouse"
                    className="size-5 rounded border-slate-300 text-primary focus:ring-primary/20"
                    checked={formData.is_warehouse || false}
                    onChange={(e) => setFormData({...formData, is_warehouse: e.target.checked})}
                  />
                  <label htmlFor="is_warehouse" className="text-xs font-bold text-slate-600 cursor-pointer">
                    Esta ubicación opera como depósito físico
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Razón Social</label>
                  <Input 
                    value={formData.legal_name || ''} 
                    onChange={(e) => setFormData({...formData, legal_name: e.target.value})}
                    placeholder="Empresa S.A."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">RUC</label>
                  <Input 
                    value={formData.ruc || ''} 
                    onChange={(e) => setFormData({...formData, ruc: e.target.value})}
                    placeholder="80000000-0"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dirección Física</label>
                  <Input 
                    value={formData.address || ''} 
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Calle Principal 123"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Teléfono</label>
                    <Input 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</label>
                    <Input 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </form>
          </TabsContent>

          {/* TAB: CONFIGURACIÓN FISCAL */}
          <TabsContent value="fiscal" className="py-6 animate-in fade-in duration-300 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Receipt size={16} className="text-primary" /> Timbrados y Puntos de Expedición
              </h3>
              <Button 
                size="sm" 
                className="h-8 text-[10px] font-black uppercase bg-primary hover:bg-primary-hover"
                onClick={() => setShowAddFiscal(!showAddFiscal)}
              >
                {showAddFiscal ? 'Cerrar' : <><Plus size={14} className="mr-1" /> Nuevo Timbrado</>}
              </Button>
            </div>

            {showAddFiscal && (
              <div className="p-4 bg-slate-50 border rounded-xl animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-3 gap-3">
                  <Input 
                    placeholder="Establecimiento (001)" 
                    className="text-xs h-9" 
                    value={fiscalForm.establishment_code}
                    onChange={(e) => setFiscalForm({...fiscalForm, establishment_code: e.target.value})}
                  />
                  <Input 
                    placeholder="Punto Exped. (001)" 
                    className="text-xs h-9"
                    value={fiscalForm.expedition_point}
                    onChange={(e) => setFiscalForm({...fiscalForm, expedition_point: e.target.value})}
                  />
                  <Input 
                    placeholder="Número Timbrado" 
                    className="text-xs h-9"
                    value={fiscalForm.timbrado}
                    onChange={(e) => setFiscalForm({...fiscalForm, timbrado: e.target.value})}
                  />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                   <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold" onClick={() => setShowAddFiscal(false)}>Cancelar</Button>
                   <Button 
                    size="sm" 
                    className="h-8 text-[10px] font-bold px-4 bg-primary text-white border-none" 
                    onClick={() => addFiscalMutation.mutate(fiscalForm)}
                    disabled={addFiscalMutation.isPending}
                   >
                     {addFiscalMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                   </Button>
                </div>
              </div>
            )}

            {loadingFiscal ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : !fiscalConfigs?.configs?.length && !fiscalConfigs?.data?.length ? (
              <div className="p-10 border-2 border-dashed rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Sin configuraciones fiscales</p>
                <p className="text-[10px] text-slate-400">Define los puntos de expedición para facturación electrónica.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Establ. / Punto</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Tipo</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Timbrado</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Validez</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(fiscalConfigs?.configs || fiscalConfigs?.data || []).map((cfg: BranchFiscalConfig) => (
                      <TableRow key={cfg.id} className="text-xs">
                        <TableCell className="font-bold">{cfg.establishment_code}-{cfg.expedition_point}</TableCell>
                        <TableCell>{cfg.document_type}</TableCell>
                        <TableCell className="font-mono">{cfg.timbrado}</TableCell>
                        <TableCell className="text-slate-500">{cfg.valid_to ? new Date(cfg.valid_to).toLocaleDateString() : 'Indefinido'}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" className="size-8 p-0 text-slate-300 hover:text-error"><Trash2 size={14} /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* TAB: ACCESOS */}
          <TabsContent value="access" className="py-6 animate-in fade-in duration-300 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <ShieldCheck size={16} className="text-success" /> Usuarios Autorizados
              </h3>
              <Button 
                size="sm" 
                className="h-8 text-[10px] font-black uppercase border-success text-success hover:bg-success/5" 
                variant="outline"
                onClick={() => setShowAddAccess(!showAddAccess)}
              >
                {showAddAccess ? 'Cerrar' : <><UserPlus size={14} className="mr-1" /> Asignar Usuario</>}
              </Button>
            </div>

            {showAddAccess && (
              <div className="p-4 bg-slate-50 border rounded-xl animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">ID del Usuario</label>
                    <Input 
                      placeholder="Ej: usr_abc123" 
                      className="text-xs h-9" 
                      value={accessForm.user_id}
                      onChange={(e) => setAccessForm({...accessForm, user_id: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase text-slate-400">Nivel de Acceso</label>
                    <select 
                      className="w-full h-9 px-2 border rounded-md text-xs bg-white"
                      value={accessForm.access_type}
                      onChange={(e) => setAccessForm({...accessForm, access_type: e.target.value})}
                    >
                      <option value="FULL">Acceso Total</option>
                      <option value="LIMITED">Solo Transacciones</option>
                      <option value="READ_ONLY">Solo Lectura</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                   <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold" onClick={() => setShowAddAccess(false)}>Cancelar</Button>
                   <Button 
                    size="sm" 
                    className="h-8 text-[10px] font-bold px-4 bg-success hover:bg-success/90 text-white border-none"
                    onClick={() => grantAccessMutation.mutate(accessForm)}
                    disabled={grantAccessMutation.isPending}
                   >
                     {grantAccessMutation.isPending ? 'Procesando...' : 'Asignar Usuario'}
                   </Button>
                </div>
              </div>
            )}

            {loadingAccess ? (
              <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
            ) : !accessList?.access?.length && !accessList?.data?.length ? (
              <div className="p-10 border-2 border-dashed rounded-xl text-center space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase">Sin accesos configurados</p>
                <p className="text-[10px] text-slate-400">Los administradores globales siempre tienen acceso.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-bold uppercase">Usuario</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Nivel de Acceso</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Otorgado el</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(accessList?.access || accessList?.data || []).map((acc: UserBranchAccess) => (
                      <TableRow key={acc.id} className="text-xs">
                        <TableCell className="font-bold flex items-center gap-2">
                           <div className="size-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">{acc.user_id.substring(0,2).toUpperCase()}</div>
                           ID: {acc.user_id}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            acc.access_type === 'FULL' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {acc.access_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500">{new Date(acc.granted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="size-8 p-0 text-slate-300 hover:text-error"
                            onClick={() => revokeAccessMutation.mutate(acc.user_id)}
                          >
                            <Trash2 size={14} />
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

        <DialogFooter className="mt-6 pt-4 border-t gap-3">
          <Button variant="ghost" onClick={onClose} className="text-xs font-bold">Cancelar</Button>
          <Button 
            type="submit" 
            form="branch-form" 
            disabled={saveMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-8 shadow-lg shadow-primary/20"
          >
            {saveMutation.isPending ? 'Guardando...' : isEditing ? 'Actualizar Sucursal' : 'Crear Sucursal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BranchModal;
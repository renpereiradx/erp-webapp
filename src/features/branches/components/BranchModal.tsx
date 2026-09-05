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
import { userService } from '@/services/userService';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  timbradoValiditySeverity,
  daysUntilValidTo,
  normalizeSerie,
  isValidSerie,
  formatInvoiceNumber,
  TIMBRADO_VALIDITY_I18N,
  TIMBRADO_VALIDITY_BADGE,
} from '@/domain/fiscal/validity';
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
import { Building2, Plus, Trash2, ShieldCheck, Receipt, UserPlus, Loader2, Star } from 'lucide-react';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  initialTab?: 'info' | 'fiscal' | 'access';
}

const BranchModal: React.FC<BranchModalProps> = ({ isOpen, onClose, branch, initialTab = 'info' }) => {
  const { t } = useI18n();
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
  // Nota FE2: next_invoice_number es read-only (lo asigna el backend con
  // SELECT ... FOR UPDATE dentro de la tx de la venta); serie default AA.
  const [fiscalForm, setFiscalForm] = useState<CreateBranchFiscalConfigRequest>({
    establishment_code: '',
    expedition_point: '',
    document_type: 'FACTURA',
    timbrado: '',
    serie: 'AA',
    valid_from: '',
    valid_to: '',
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

  // D.1 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): marcar el acceso existente
  // de un usuario como sucursal por defecto. El backend limpia el default
  // anterior antes de escribir (índice único uk_user_default_branch).
  const setDefaultAccessMutation = useMutation({
    mutationFn: (userId: string) => branchService.updateAccess(branch!.id, userId, { is_default_branch: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-access', branch?.id] });
      addToast(t('branchAccess.setDefaultSuccess', 'Sucursal por defecto actualizada'), 'success');
    },
    onError: (error: any) => addToast(error.message || t('branchAccess.setDefaultError', 'Error al marcar sucursal por defecto'), 'error')
  });

  const addFiscalMutation = useMutation({
    mutationFn: (data: CreateBranchFiscalConfigRequest) => {
      // Normalizar: serie a 2 letras mayúsculas; fechas a ISO (el backend
      // parsea *time.Time con RFC3339 — "YYYY-MM-DD" solo no es válido).
      const payload: CreateBranchFiscalConfigRequest = {
        ...data,
        serie: normalizeSerie(data.serie || 'AA'),
        valid_from: data.valid_from ? new Date(`${data.valid_from}T00:00:00`).toISOString() : undefined,
        valid_to: data.valid_to ? new Date(`${data.valid_to}T00:00:00`).toISOString() : undefined,
      };
      return branchService.createFiscalConfig(branch!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-fiscal', branch?.id] });
      addToast(t('fiscal.branch.added', 'Configuración fiscal agregada'), 'success');
      setShowAddFiscal(false);
      setFiscalForm({ establishment_code: '', expedition_point: '', document_type: 'FACTURA', timbrado: '', serie: 'AA', valid_from: '', valid_to: '', is_active: true });
    },
    onError: (error: any) => addToast(error.message || t('fiscal.branch.saveError', 'Error al guardar configuración'), 'error')
  });

  // FE2: activación SIFEN por branch (D3 — arranque gradual). El flag
  // fiscal_enabled vive en branch_fiscal_config; el toggle lo conmuta.
  const setFiscalEnabledMutation = useMutation({
    mutationFn: ({ documentType, enabled }: { documentType: string; enabled: boolean }) =>
      branchService.setFiscalEnabled(branch!.id, documentType, enabled),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['branch-fiscal', branch?.id] });
      addToast(vars.enabled ? t('fiscal.branch.enabled', 'Emisión SIFEN activada') : t('fiscal.branch.disabled', 'Emisión SIFEN desactivada'), 'success');
    },
    onError: (error: any) => addToast(error.message || 'Error al cambiar emisión SIFEN', 'error')
  });

  const revokeAccessMutation = useMutation({
    mutationFn: (userId: string) => branchService.revokeAccess(branch!.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-access', branch?.id] });
      addToast('Acceso revocado correctamente', 'success');
    }
  });

  const deleteFiscalMutation = useMutation({
    mutationFn: (id: number) => branchService.deleteFiscalConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branch-fiscal', branch?.id] });
      addToast('Configuración fiscal eliminada', 'success');
    },
    onError: (error: any) => addToast(error.message || 'Error al eliminar configuración', 'error')
  });

  // Query para obtener usuarios (para el selector de accesos)
  const { data: usersResponse } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => userService.getUsers({ page_size: 100 }),
    enabled: isOpen && isEditing
  });
  const users = (usersResponse as any)?.users || usersResponse?.data || [];

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col font-display p-0 gap-0 border-none shadow-fluent-64">
        <DialogHeader className="p-6 sm:p-8 pb-4 border-b bg-white">
          <DialogTitle className="text-2xl font-black flex items-center gap-3 text-text-main">
            <div className="size-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <Building2 size={20} />
            </div>
            {isEditing ? `Gestionar: ${branch.name}` : 'Nueva Sucursal'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary mt-1.5 text-sm font-medium">
            {isEditing ? 'Administre la información general, configuración fiscal y permisos de usuario para esta sucursal.' : 'Complete los campos obligatorios para registrar una nueva sucursal en el sistema.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pt-4">

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
                <Receipt size={18} className="text-primary" /> {t('fiscal.branch.title', 'Timbrados y Puntos de Expedición')}
              </h3>
              <Button 
                size="sm" 
                className="h-9 px-4 text-xs font-bold uppercase bg-primary hover:bg-primary-hover shadow-sm"
                onClick={() => setShowAddFiscal(!showAddFiscal)}
              >
                {showAddFiscal ? t('fiscal.branch.cancel', 'Cancelar') : <><Plus size={16} className="mr-1.5" /> {t('fiscal.branch.new', 'Nuevo Timbrado')}</>}
              </Button>
            </div>

            {showAddFiscal && (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl animate-in slide-in-from-top-2 duration-300 shadow-sm">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.establishment', 'Establecimiento')}</label>
                    <Input 
                      placeholder="001" 
                      className="text-sm h-11 font-mono" 
                      value={fiscalForm.establishment_code}
                      onChange={(e) => setFiscalForm({...fiscalForm, establishment_code: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.expeditionPoint', 'Punto de Expedición')}</label>
                    <Input 
                      placeholder="001" 
                      className="text-sm h-11 font-mono"
                      value={fiscalForm.expedition_point}
                      onChange={(e) => setFiscalForm({...fiscalForm, expedition_point: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.timbrado', 'Número de Timbrado')}</label>
                    <Input 
                      placeholder="12345678" 
                      className="text-sm h-11 font-mono"
                      value={fiscalForm.timbrado}
                      onChange={(e) => setFiscalForm({...fiscalForm, timbrado: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.documentType', 'Tipo de Documento')}</label>
                    <select 
                      className="w-full h-11 px-3 border border-slate-200 rounded-md bg-white text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none hover:bg-slate-50 transition-colors"
                      value={fiscalForm.document_type}
                      onChange={(e) => setFiscalForm({...fiscalForm, document_type: e.target.value})}
                    >
                      <option value="FACTURA">{t('fiscal.docTypes.FACTURA', 'Factura Electrónica')}</option>
                      <option value="NCE">{t('fiscal.docTypes.NCE', 'Nota de Crédito Electrónica')}</option>
                      <option value="NDE">{t('fiscal.docTypes.NDE', 'Nota de Débito Electrónica')}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.serie', 'Serie')}</label>
                    <Input 
                      placeholder="AA" 
                      maxLength={2}
                      className="text-sm h-11 font-mono uppercase"
                      value={fiscalForm.serie}
                      onChange={(e) => setFiscalForm({...fiscalForm, serie: normalizeSerie(e.target.value)})}
                    />
                    <p className="text-[10px] text-slate-400 font-medium">{t('fiscal.branch.serieHint', '2 letras, p. ej. AA')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.validFrom', 'Vigencia desde')}</label>
                    <Input 
                      type="date" 
                      className="text-sm h-11"
                      value={fiscalForm.valid_from || ''}
                      onChange={(e) => setFiscalForm({...fiscalForm, valid_from: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{t('fiscal.branch.validTo', 'Vigencia hasta')}</label>
                    <Input 
                      type="date" 
                      className="text-sm h-11"
                      value={fiscalForm.valid_to || ''}
                      onChange={(e) => setFiscalForm({...fiscalForm, valid_to: e.target.value})}
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <p className="text-[11px] text-slate-400 italic font-medium">
                    {t('fiscal.branch.nextNumberHint', 'Lo asigna el backend automáticamente')}
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm" variant="ghost" className="h-10 text-xs font-bold" onClick={() => setShowAddFiscal(false)}>{t('fiscal.branch.discard', 'Descartar')}</Button>
                    <Button 
                      size="sm" 
                      className="h-10 text-xs font-bold px-6 bg-primary text-white shadow-sm" 
                      onClick={() => {
                        if (!isValidSerie(normalizeSerie(fiscalForm.serie || 'AA'))) {
                          addToast(t('fiscal.branch.serieHint', '2 letras, p. ej. AA'), 'warning');
                          return;
                        }
                        addFiscalMutation.mutate(fiscalForm);
                      }}
                      disabled={addFiscalMutation.isPending}
                    >
                      {addFiscalMutation.isPending ? t('fiscal.branch.saving', 'Guardando...') : t('fiscal.branch.save', 'Guardar Configuración')}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {loadingFiscal ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>
            ) : !(fiscalConfigs as any)?.configs?.length && !fiscalConfigs?.data?.length ? (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-3 bg-slate-50/50">
                <div className="mx-auto size-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="text-slate-400 size-6" />
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{t('fiscal.branch.empty.title', 'Sin configuraciones fiscales')}</p>
                <p className="text-sm text-slate-400 max-w-sm mx-auto">{t('fiscal.branch.empty.description', 'Define los puntos de expedición para habilitar la facturación electrónica en esta sucursal.')}</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.establPunto', 'Establ. / Punto')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.type', 'Tipo')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.serie', 'Serie')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.timbrado', 'Timbrado')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.validity', 'Validez')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.next', 'Próximo N°')}</TableHead>
                      <TableHead className="py-3 px-4 text-xs font-bold uppercase text-slate-500">{t('fiscal.branch.col.sifen', 'Emisión SIFEN')}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {((fiscalConfigs as any)?.configs || fiscalConfigs?.data || []).map((cfg: BranchFiscalConfig) => {
                      const validity = timbradoValiditySeverity(cfg.valid_to);
                      const days = daysUntilValidTo(cfg.valid_to);
                      const validityLabel = validity === 'warning'
                        ? t('fiscal.validity.warning', 'Vence en {days} día(s)', { days: String(days) })
                        : t(TIMBRADO_VALIDITY_I18N[validity]);
                      return (
                      <TableRow key={cfg.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-4 font-bold text-slate-700 font-mono">{cfg.establishment_code}-{cfg.expedition_point}</TableCell>
                        <TableCell className="py-4 px-4 text-slate-600 font-medium">{t(`fiscal.docTypes.${cfg.document_type}`, cfg.document_type)}</TableCell>
                        <TableCell className="py-4 px-4">
                          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">{cfg.serie || 'AA'}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-mono font-medium text-slate-600">{cfg.timbrado}</TableCell>
                        <TableCell className="py-4 px-4">
                          <Badge variant={TIMBRADO_VALIDITY_BADGE[validity]} dot>
                            {validityLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-4 font-mono text-slate-500">{formatInvoiceNumber(cfg.next_invoice_number)}</TableCell>
                        <TableCell className="py-4 px-4">
                          <Switch
                            checked={!!cfg.fiscal_enabled}
                            disabled={setFiscalEnabledMutation.isPending}
                            onCheckedChange={(checked: boolean) =>
                              setFiscalEnabledMutation.mutate({ documentType: cfg.document_type, enabled: checked })
                            }
                            aria-label={cfg.fiscal_enabled ? t('fiscal.branch.deactivate', 'Desactivar') : t('fiscal.branch.activate', 'Activar')}
                          />
                        </TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="size-8 p-0 text-on-surface-deep hover:text-error hover:bg-error/10"
                            onClick={() => {
                              if (window.confirm(t('fiscal.branch.deleteConfirm', '¿Estás seguro de eliminar esta configuración fiscal?'))) {
                                deleteFiscalMutation.mutate(cfg.id);
                              }
                            }}
                            disabled={deleteFiscalMutation.isPending}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })}
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
                    <label className="text-[11px] font-bold uppercase text-success/70 tracking-wider">Usuario</label>
                    <select 
                      className="w-full h-11 px-3 border border-success/30 rounded-md text-sm font-medium bg-white focus:ring-2 focus:ring-success/20 outline-none"
                      value={accessForm.user_id}
                      onChange={(e) => setAccessForm({...accessForm, user_id: e.target.value})}
                    >
                      <option value="">Seleccionar usuario...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.first_name} {user.last_name} ({user.username})
                        </option>
                      ))}
                    </select>
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
                <div className="col-span-2 flex items-start gap-3 p-3 bg-white/70 border border-success/20 rounded-lg">
                  <input
                    type="checkbox"
                    id="access-is-default"
                    className="mt-0.5 size-4 rounded border-border-subtle text-success focus:ring-success/20"
                    checked={accessForm.is_default_branch || false}
                    onChange={(e) => setAccessForm({ ...accessForm, is_default_branch: e.target.checked })}
                  />
                  <label htmlFor="access-is-default" className="text-sm font-medium text-foreground cursor-pointer leading-tight">
                    {t('branchAccess.isDefault', 'Sucursal por defecto')}
                    <span className="block text-xs text-on-surface-deep font-normal mt-0.5">
                      {t('branchAccess.isDefaultHint', 'La sesión de este usuario abrirá por defecto en esta sucursal. Marcar una nueva quita la marca de la anterior.')}
                    </span>
                  </label>
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
            ) : !(accessList as any)?.access?.length && !accessList?.data?.length ? (
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
                    {((accessList as any)?.access || accessList?.data || []).map((acc: UserBranchAccess) => (
                      <TableRow key={acc.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4 px-4 font-bold text-slate-700 flex items-center gap-3">
                           <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">{acc.user_id.substring(0,2).toUpperCase()}</div>
                           <span className="font-mono text-xs">{acc.user_id}</span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                              acc.access_type === 'FULL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              acc.access_type === 'LIMITED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {acc.access_type}
                            </span>
                            {acc.is_default_branch && (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-success/10 text-success border border-success/20 flex items-center gap-1">
                                <Star size={10} /> {t('branchAccess.defaultBadge', 'Por defecto')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-slate-500">{new Date(acc.granted_at).toLocaleDateString()}</TableCell>
                        <TableCell className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!acc.is_default_branch && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title={t('branchAccess.setDefault', 'Marcar como sucursal por defecto')}
                                aria-label={t('branchAccess.setDefault', 'Marcar como sucursal por defecto')}
                                className="size-8 p-0 text-on-surface-deep hover:text-primary hover:bg-primary/10"
                                onClick={() => setDefaultAccessMutation.mutate(acc.user_id)}
                                disabled={setDefaultAccessMutation.isPending}
                              >
                                <Star size={16} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="size-8 p-0 text-on-surface-deep hover:text-error hover:bg-error/10"
                              onClick={() => revokeAccessMutation.mutate(acc.user_id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>

        <DialogFooter className="p-6 sm:p-8 bg-[#f3f2f1]/50 border-t gap-3">
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
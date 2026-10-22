import React from 'react';
import { Building2, ChevronDown, Globe, Check, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { branchService } from '@/features/branches/services/branchService';
import { useBranch } from '@/contexts/BranchContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';

const BranchSwitcher = () => {
  const { currentBranchId, allowedBranches, changeBranch, canViewGlobal } = useBranch();
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Cargar información de sucursales para mostrar nombres reales
  const { data: branchesResponse, isLoading } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ page_size: 100 }),
    staleTime: 1000 * 60 * 5, // 5 minutos de caché
  });

  const branches = branchesResponse?.branches || [];

  const getBranchName = (id: number | null) => {
    if (!id) return t('branches.all', 'Todas las Sucursales');
    const branch = branches.find((b: any) => b.id === id);
    return branch ? branch.name : t('branches.withId', 'Sucursal {{id}}', { id });
  };

  const activeBranchLabel = getBranchName(currentBranchId);

  // Sin la opción "Todas las Sucursales" en el menú, una sesión que quedó en
  // vista global (branchView=global de versiones anteriores, o admin sin
  // sucursal en el JWT) se auto-ancla a la primera sucursal activa en cuanto
  // la lista carga. Con cero sucursales en la instalación no hace nada: ese
  // bootstrap usa la salida de emergencia de BranchSelection.
  React.useEffect(() => {
    if (!isLoading && currentBranchId === null && branches.length > 0) {
      changeBranch(branches[0].id);
    }
  }, [isLoading, currentBranchId, branches, changeBranch]);

  // Los enums de branch_type (HEADQUARTERS, POINT_OF_SALE…) nunca se exponen
  // crudos: se traducen siempre, y la ciudad solo se muestra si existe (sin
  // placeholder "Ubicación" que no dice nada).
  const formatBranchSubtitle = (branch: any) => {
    if (!branch) return t('branches.operations', 'Sucursal de Operaciones');
    const typeLabels: Record<string, string> = {
      HEADQUARTERS: t('branches.typeHeadquarters', 'Casa Central'),
      POINT_OF_SALE: t('branches.pointOfSale', 'Punto de Venta'),
      WAREHOUSE: t('branches.typeWarehouse', 'Depósito'),
      DISTRIBUTION_CENTER: t('branches.typeDistributionCenter', 'Centro de Distribución'),
    };
    const typeLabel = typeLabels[branch.branch_type] || t('branches.operations', 'Sucursal de Operaciones');
    return branch.city ? `${typeLabel} • ${branch.city}` : typeLabel;
  };

  // Determinar qué sucursales mostrar: si es admin, mostrar todas. Si no, solo las permitidas.
  const branchesToShow = canViewGlobal ? branches.map((b: any) => b.id) : allowedBranches;

  // Cerrar al hacer click fuera
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // D.5 (PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES): solo con `branches:switch`
  // (o admin). Sin el permiso, la sucursal la decide la terminal vinculada /
  // la asignación del encargado — no el usuario. Se mantiene el auto-ocultar
  // con ≤1 sucursal permitida.
  const canSwitchBranches = canViewGlobal || hasPermission('branches:switch');
  if (!canSwitchBranches || (allowedBranches.length <= 1 && !canViewGlobal)) {
    return null;
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('branches.select', 'Seleccionar Sucursal')}
        aria-expanded={isOpen}
        className={`flex items-center gap-xs px-sm py-xs rounded-button border border-border-subtle bg-surface shadow-whisper hover:shadow-fluent-8 transition-shadow duration-150 ${
          isOpen ? 'ring-2 ring-primary/20 border-primary/30' : ''
        }`}
      >
        <div className={`p-xs rounded-sm ${currentBranchId ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
          {currentBranchId ? <Building2 size={16} /> : <Globe size={16} />}
        </div>
        <div className="flex flex-col items-start gap-xs">
          <span className="text-label-caps uppercase text-on-surface-deep leading-none">
            {t('branches.active', 'Sucursal Activa')}
          </span>
          <span className="text-body-sm-bold text-foreground leading-none">
            {activeBranchLabel}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-on-surface-deep transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-sm w-64 bg-surface rounded-md shadow-fluent-8 border border-border-subtle overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-md border-b border-border-subtle bg-surface-muted">
            <p className="text-label-caps uppercase text-on-surface-deep">
              {t('branches.select', 'Seleccionar Sucursal')}
            </p>
          </div>

          <div className="p-xs max-h-64 overflow-y-auto custom-scrollbar">
            {/* Lista de Sucursales */}
            {isLoading ? (
              <div className="flex justify-center p-md"><Loader2 size={16} className="animate-spin text-primary" /></div>
            ) : (
              branchesToShow.map((branchId: number) => {
                const branch = branches.find((b: any) => b.id === branchId);
                return (
                  <button
                    key={branchId}
                    onClick={() => { changeBranch(branchId); setIsOpen(false); }}
                    className={`w-full flex items-center justify-between px-md py-sm rounded-sm text-body-md transition-colors duration-150 ${
                      currentBranchId === branchId
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-deep hover:bg-surface-muted hover:text-foreground'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-xs">
                      <span className="flex items-center gap-xs">
                         <Building2 size={14} />
                         <span className="text-body-md">{branch ? branch.name : t('branches.withId', 'Sucursal {{id}}', { id: branchId })}</span>
                      </span>
                      <span className="text-label-caps uppercase text-on-surface-deep pl-sm">
                        {formatBranchSubtitle(branch)}
                      </span>
                    </div>
                    {currentBranchId === branchId && <Check size={16} />}
                  </button>
                );
              })
            )}
          </div>

          <div className="p-sm border-t border-border-subtle bg-surface-muted">
            <p className="text-label-caps text-center text-on-surface-deep">
              {t('branches.globalNotice', 'El cambio afecta a todos los módulos')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;

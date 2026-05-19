import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { branchService } from '@/features/branches/services/branchService';
import { Branch } from '@/types';
import { Building2, Globe, ArrowRight, Loader2, LogOut } from 'lucide-react';

const BranchSelection = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { changeBranch, allowedBranches, canViewGlobal } = useBranch();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranchDetails = async () => {
      if (!allowedBranches || allowedBranches.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Obtener todas las sucursales para tener los nombres
        const response = await branchService.getBranches({ is_active: true, page_size: 100 });
        
        // Manejar diferentes formatos de respuesta (paginado o array directo)
        // La guía indica que la clave es 'branches'
        const allBranches = Array.isArray(response) 
          ? response 
          : (response && response.branches ? response.branches : (response && response.data ? response.data : []));
        
        console.log('Sucursales cargadas:', allBranches);
        console.log('Sucursales permitidas (IDs):', allowedBranches);
        
        // Filtrar solo las que el usuario tiene permitidas
        // Si es admin o tiene permiso global, mostramos todas las que devolvió la API
        let userBranches: Branch[] = [];
        const allowedIds = Array.isArray(allowedBranches) 
            ? allowedBranches.map(b => typeof b === 'object' ? (b as any).id : b) 
            : [];

        if (canViewGlobal || allowedIds.length === 0) {
          // Si es admin o por alguna razón no tiene IDs asignados, 
          // pero la API devolvió sucursales, mostramos todas como candidatos
          userBranches = allBranches;
        } else {
          userBranches = allBranches.filter(b => allowedIds.includes(b.id));
        }
        
        console.log('Sucursales finales a mostrar:', userBranches);
        setBranches(userBranches);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('No se pudieron cargar los detalles de las sucursales.');
      } finally {
        setLoading(false);
      }
    };

    fetchBranchDetails();
  }, [allowedBranches, canViewGlobal]);

  const handleSelectBranch = (branchId: number | null) => {
    changeBranch(branchId);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Cargando sucursales disponibles...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-[1200px] flex flex-col gap-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-5">
            <h1 className="text-3xl font-bold text-text-main tracking-tight">
              Seleccionar Punto de Venta
            </h1>
            <p className="text-text-secondary text-base font-medium">
              Bienvenido, {user?.first_name} {user?.last_name} &bull; Elige una sucursal para comenzar
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 border border-border-base text-text-main text-xs font-bold rounded hover:bg-slate-50 transition-all shadow-sm bg-white"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-4 p-5 rounded-lg bg-[#fde7e9] border border-[#fde7e9]">
            <span className="material-symbols-outlined text-error">error</span>
            <div>
              <h4 className="font-bold text-sm text-[#a4262c] leading-none">Error</h4>
              <p className="text-xs text-[#a4262c] mt-1.5 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Sucursales */}
          {branches.length > 0 ? (
            branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch.id)}
                className="group p-8 bg-white rounded-xl border border-border-subtle shadow-fluent-2 space-y-5 hover:shadow-fluent-8 hover:-translate-y-1 hover:border-primary/30 transition-all text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Building2 size={120} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="size-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center transition-colors mb-2">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      ID: {branch.code || branch.id}
                    </span>
                    <h3 className="text-xl font-bold tracking-tight text-text-main group-hover:text-primary transition-colors">
                      {branch.name}
                    </h3>
                  </div>
                  <p className="text-sm text-text-secondary font-medium mt-1 line-clamp-2">
                    {branch.address || 'Sin dirección registrada'} &bull; {branch.city || ''}
                  </p>
                  <div className="mt-8 flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Conectarse</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </button>
            ))
          ) : (
            !loading && !canViewGlobal && (
              <div className="col-span-full py-20 text-center bg-white rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-[#f3f2f1] rounded-full flex items-center justify-center mb-6">
                  <Building2 size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-text-main tracking-tight mb-2">
                  No tienes sucursales asignadas
                </h3>
                <p className="text-text-secondary text-sm font-medium max-w-md">
                  Contacta a un administrador para que te otorgue acceso a un punto de venta.
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
            ERP Webapp &bull; Core Engine v2.0.4
          </p>
          <div className="flex gap-6 opacity-60">
            <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-sm text-success">verified_user</span>
               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Security Active</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-sm text-info">cloud_done</span>
               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Synced to Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;

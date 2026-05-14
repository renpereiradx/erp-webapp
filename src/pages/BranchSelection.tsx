import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBranch } from '@/contexts/BranchContext';
import { branchService } from '@/services/branchService';
import { Branch } from '@/types';
import { Building2, Globe, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

const BranchSelection = () => {
  const { t } = useI18n();
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
        const allBranches = Array.isArray(response) 
          ? response 
          : (response && response.data ? response.data : []);
        
        console.log('Sucursales cargadas:', allBranches);
        console.log('Sucursales permitidas (IDs):', allowedBranches);
        
        // Filtrar solo las que el usuario tiene permitidas
        // Si es admin o tiene permiso global, mostramos todas las que devolvió la API
        let userBranches = [];
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
  }, [allowedBranches]);

  const handleSelectBranch = (branchId: number | null) => {
    changeBranch(branchId);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
          Cargando sucursales disponibles...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-display">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-2">
              Seleccionar Punto de Venta
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              Bienvenido, {user?.first_name} {user?.last_name} &bull; Elige una sucursal para comenzar
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500">error</span>
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Opción Global para Admins */}
          {canViewGlobal && (
            <button
              onClick={() => handleSelectBranch(null)}
              className="group relative bg-amber-500 rounded-2xl p-6 text-left shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden border-2 border-amber-400"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Globe size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center text-white mb-6 border border-white/30">
                  <Globe size={24} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight mb-2">
                  Visión Global
                </h3>
                <p className="text-white/80 text-xs font-bold uppercase tracking-widest mb-auto">
                  Acceso administrativo completo
                </p>
                <div className="mt-8 flex items-center gap-2 text-white font-black uppercase tracking-widest text-[10px]">
                  <span>Ingresar</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          )}

          {/* Sucursales */}
          {branches.length > 0 ? (
            branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleSelectBranch(branch.id)}
                className="group relative bg-white rounded-2xl p-6 text-left shadow-sm border border-slate-200 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 text-primary group-hover:scale-110 transition-transform duration-500">
                  <Building2 size={120} />
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="bg-slate-100 w-12 h-12 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-6 border border-slate-200 group-hover:border-primary/20">
                    <Building2 size={24} />
                  </div>
                  <div className="mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ID: {branch.code || branch.id}
                    </span>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">
                      {branch.name}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-auto line-clamp-2">
                    {branch.address || 'Sin dirección registrada'} &bull; {branch.city || ''}
                  </p>
                  <div className="mt-8 flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <span>Conectarse</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </button>
            ))
          ) : (
            !loading && !canViewGlobal && (
              <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Building2 size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                  No tienes sucursales asignadas
                </h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest max-w-md mx-auto">
                  Contacta a un administrador para que te otorgue acceso a un punto de venta.
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
            ERP Webapp &bull; Core Engine v2.0.4
          </p>
          <div className="flex gap-6 opacity-40">
            <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-sm">verified_user</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security Active</span>
            </div>
            <div className="flex items-center gap-1.5">
               <span className="material-symbols-outlined text-sm">cloud_done</span>
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Synced to Cloud</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchSelection;

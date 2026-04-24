import React from 'react';
import { useBranch } from '@/contexts/BranchContext';
import { Building2, ChevronDown, Globe, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BranchSwitcher = () => {
  const { currentBranchId, allowedBranches, changeBranch, canViewGlobal } = useBranch();
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  // Si no hay sucursales permitidas y no es admin, no mostrar nada
  if (allowedBranches.length <= 1 && !canViewGlobal) {
    return null;
  }

  const activeBranchLabel = currentBranchId 
    ? `Sucursal ${currentBranchId}` 
    : 'Visión Global';

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
          isOpen ? 'ring-2 ring-primary/20 border-primary/30' : ''
        }`}
      >
        <div className={`p-1 rounded-md ${currentBranchId ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-600'}`}>
          {currentBranchId ? <Building2 size={16} /> : <Globe size={16} />}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-0.5">
            Sucursal Activa
          </span>
          <span className="text-xs font-bold text-text-main leading-none">
            {activeBranchLabel}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-slate-50 bg-slate-50/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Seleccionar Sucursal
            </p>
          </div>
          
          <div className="p-1 max-h-64 overflow-y-auto custom-scrollbar">
            {/* Opción Global para Admins */}
            {canViewGlobal && (
              <button
                onClick={() => { changeBranch(null); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentBranchId === null 
                    ? 'bg-amber-50 text-amber-700' 
                    : 'text-text-secondary hover:bg-slate-50 hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe size={14} className={currentBranchId === null ? 'text-amber-600' : 'text-slate-400'} />
                  <span>Visión Global (Admin)</span>
                </div>
                {currentBranchId === null && <Check size={14} />}
              </button>
            )}

            {/* Lista de Sucursales */}
            {allowedBranches.map((branchId) => (
              <button
                key={branchId}
                onClick={() => { changeBranch(branchId); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  currentBranchId === branchId 
                    ? 'bg-primary/5 text-primary' 
                    : 'text-text-secondary hover:bg-slate-50 hover:text-text-main'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 size={14} className={currentBranchId === branchId ? 'text-primary' : 'text-slate-400'} />
                  <span>Sucursal {branchId}</span>
                </div>
                {currentBranchId === branchId && <Check size={14} />}
              </button>
            ))}
          </div>
          
          <div className="p-2 border-t border-slate-50 bg-slate-50/30">
            <p className="text-[9px] text-center text-slate-400 font-medium">
              El cambio afecta a todos los módulos
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchSwitcher;

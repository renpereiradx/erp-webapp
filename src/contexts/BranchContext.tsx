import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { decodeJWTPayload } from '@/utils/jwtUtils';

interface BranchContextType {
  currentBranchId: number | null;
  allowedBranches: number[];
  isGlobalView: boolean;
  changeBranch: (branchId: number | null) => void;
  canViewGlobal: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [allowedBranches, setAllowedBranches] = useState<number[]>([]);
  const [canViewGlobal, setCanViewGlobal] = useState(false);

  // Inicializar estado siguiendo la jerarquía de la guía
  useEffect(() => {
    if (isAuthenticated) {
      // 1. Prioridad: URL Query Param
      const urlParams = new URLSearchParams(window.location.search);
      const urlBranchId = urlParams.get('branch_id');
      
      // 2. Prioridad: LocalStorage (Sucursal guardada en sesión anterior)
      const savedBranch = localStorage.getItem('activeBranch');
      
      // 3 & 4. Prioridad: JWT Claims (Fallback final)
      let jwtBranchId: number | null = null;
      let jwtAllowedBranches: number[] = [];
      
      if (token) {
        const payload = decodeJWTPayload(token);
        if (payload) {
          jwtBranchId = payload.active_branch;
          jwtAllowedBranches = payload.allowed_branches || [];
        }
      }

      // Consolidar allowed_branches (priorizar objeto user, luego JWT, luego localStorage)
      const finalAllowedBranches = user?.allowed_branches || jwtAllowedBranches || JSON.parse(localStorage.getItem('allowedBranches') || '[]');
      setAllowedBranches(finalAllowedBranches);
      setCanViewGlobal(user?.role_id === 'admin');

      // Resolución de sucursal activa según jerarquía
      if (urlBranchId && !isNaN(parseInt(urlBranchId))) {
        const bid = parseInt(urlBranchId);
        setCurrentBranchId(bid);
        localStorage.setItem('activeBranch', bid.toString());
      } else if (savedBranch) {
        setCurrentBranchId(parseInt(savedBranch));
      } else if (jwtBranchId !== null) {
        setCurrentBranchId(jwtBranchId);
        localStorage.setItem('activeBranch', jwtBranchId.toString());
      } else if (finalAllowedBranches.length > 0) {
        // Fallback final: Primera sucursal disponible
        setCurrentBranchId(finalAllowedBranches[0]);
        localStorage.setItem('activeBranch', finalAllowedBranches[0].toString());
      }
    } else {
      setCurrentBranchId(null);
      setAllowedBranches([]);
      setCanViewGlobal(false);
    }
  }, [isAuthenticated, user, token]);

  const changeBranch = useCallback((branchId: number | null) => {
    setCurrentBranchId(branchId);
    if (branchId === null) {
      localStorage.removeItem('activeBranch');
    } else {
      localStorage.setItem('activeBranch', branchId.toString());
    }
    
    // Notificar cambio para que otros componentes puedan reaccionar si no usan el context directamente
    window.dispatchEvent(new CustomEvent('branch:changed', { detail: { branchId } }));
  }, []);

  const isGlobalView = currentBranchId === null;

  return (
    <BranchContext.Provider value={{
      currentBranchId,
      allowedBranches,
      isGlobalView,
      changeBranch,
      canViewGlobal
    }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};

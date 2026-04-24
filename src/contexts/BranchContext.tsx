import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface BranchContextType {
  currentBranchId: number | null;
  allowedBranches: number[];
  isGlobalView: boolean;
  changeBranch: (branchId: number | null) => void;
  canViewGlobal: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentBranchId, setCurrentBranchId] = useState<number | null>(null);
  const [allowedBranches, setAllowedBranches] = useState<number[]>([]);
  const [canViewGlobal, setCanViewGlobal] = useState(false);

  // Inicializar estado desde el usuario o localStorage
  useEffect(() => {
    if (isAuthenticated && user) {
      const savedBranch = localStorage.getItem('activeBranch');
      const branches = user.allowed_branches || [];
      
      setAllowedBranches(branches);
      setCanViewGlobal(user.role_id === 'admin');

      if (savedBranch) {
        setCurrentBranchId(parseInt(savedBranch));
      } else if (user.active_branch) {
        setCurrentBranchId(user.active_branch);
        localStorage.setItem('activeBranch', user.active_branch.toString());
      } else if (branches.length > 0) {
        setCurrentBranchId(branches[0]);
        localStorage.setItem('activeBranch', branches[0].toString());
      }
    } else {
      setCurrentBranchId(null);
      setAllowedBranches([]);
      setCanViewGlobal(false);
    }
  }, [isAuthenticated, user]);

  const changeBranch = useCallback((branchId: number | null) => {
    setCurrentBranchId(branchId);
    if (branchId === null) {
      localStorage.removeItem('activeBranch');
    } else {
      localStorage.setItem('activeBranch', branchId.toString());
    }
    
    // Opcional: Recargar datos globales o disparar evento
    console.log(`Sucursal cambiada a: ${branchId === null ? 'Global' : branchId}`);
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

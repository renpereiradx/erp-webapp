import { useEffect } from 'react';
import { useCashRegisterStore } from '@/store/useCashRegisterStore';

interface UseCashRegisterSessionOptions {
  /**
   * Also load the registers list, movements and audits. Only for views that
   * render them (legacy history page); the open/close session page skips
   * these requests entirely.
   */
  includeHistory?: boolean;
}

export function useCashRegisterSession({ includeHistory = false }: UseCashRegisterSessionOptions = {}) {
  const {
    activeCashRegister,
    activeCashRegisterError,
    cashRegisters,
    movements,
    audits,
    isActiveCashRegisterLoading,
    isCashRegistersLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    isRegisteringMovement,
    getActiveCashRegister,
    getCashRegisters,
    openCashRegister,
    closeCashRegister,
    registerMovement,
    getMovements,
    getAudits,
    getCashRegisterReport,
  } = useCashRegisterStore();

  useEffect(() => {
    getActiveCashRegister();
    if (includeHistory) getCashRegisters();
  }, [includeHistory, getActiveCashRegister, getCashRegisters]);

  useEffect(() => {
    if (includeHistory && activeCashRegister?.id) {
      getMovements(activeCashRegister.id);
      if (getAudits) getAudits(activeCashRegister.id);
    }
  }, [includeHistory, activeCashRegister?.id, getMovements, getAudits]);

  return {
    activeCashRegister,
    activeCashRegisterError,
    cashRegisters,
    movements,
    audits,
    isActiveCashRegisterLoading,
    isCashRegistersLoading,
    isOpeningCashRegister,
    isClosingCashRegister,
    isRegisteringMovement,
    refreshActive: getActiveCashRegister,
    refreshHistory: getCashRegisters,
    openCashRegister,
    closeCashRegister,
    registerMovement,
    getCashRegisterReport,
  };
}

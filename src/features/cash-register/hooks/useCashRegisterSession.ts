import { useEffect } from 'react';
import { useCashRegisterStore } from '@/store/useCashRegisterStore';

export function useCashRegisterSession() {
  const {
    activeCashRegister,
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
    getCashRegisters();
  }, [getActiveCashRegister, getCashRegisters]);

  useEffect(() => {
    if (activeCashRegister?.id) {
      getMovements(activeCashRegister.id);
      if (getAudits) getAudits(activeCashRegister.id);
    }
  }, [activeCashRegister?.id, getMovements, getAudits]);

  return {
    activeCashRegister,
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

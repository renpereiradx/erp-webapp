/**
 * Store de cajas registradoras - Gestión completa de efectivo y pagos
 * Integración con APIs de cash register management siguiendo patrón MVP
 * Funcionalidad: apertura/cierre de cajas, movimientos, integración con pagos
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { cashRegisterService } from '@/services/cashRegisterService'

export interface CashRegister {
  id: number;
  name: string;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at?: string;
  initial_balance: number;
  current_balance: number;
  location?: string;
  notes?: string;
}

export interface Movement {
  id: number;
  movement_id?: number;
  movement_type: 'INCOME' | 'EXPENSE' | 'ADJUSTMENT';
  amount: number;
  concept: string;
  description?: string;
  created_at: string;
  user_full_name?: string;
  created_by_name?: string;
  running_balance?: number;
  category?: string;
  notes?: string;
  voided_at?: string;
  void_reason?: string;
}

export interface Audit {
  id: number;
  cash_register_id: number;
  counted_amount: number;
  system_balance: number;
  difference: number;
  notes?: string;
  created_at: string;
  denominations?: any[];
}

export interface CashRegisterSummary {
  summary: {
    total_income: number;
    total_expenses: number;
    transaction_count: number;
    net_change: number;
  };
  by_category: Record<string, number>;
}

interface CashRegisterState {
  // Estado de caja registradora activa
  activeCashRegister: CashRegister | null;
  isActiveCashRegisterLoading: boolean;
  activeCashRegisterError: any | null;

  // Lista de cajas registradoras
  cashRegisters: CashRegister[];
  isCashRegistersLoading: boolean;
  cashRegistersError: any | null;

  // Movimientos de caja
  movements: Movement[];
  isMovementsLoading: boolean;
  movementsError: any | null;

  // Resumen de caja
  cashRegisterSummary: CashRegisterSummary | null;
  isSummaryLoading: boolean;
  summaryError: any | null;

  // Estados de operaciones
  isOpeningCashRegister: boolean;
  openCashRegisterError: any | null;
  isClosingCashRegister: boolean;
  closeCashRegisterError: any | null;
  isRegisteringMovement: boolean;
  registerMovementError: any | null;

  // Estados de auditoría
  audits: Audit[];
  isAuditsLoading: boolean;
  auditsError: any | null;
  isCreatingAudit: boolean;
  createAuditError: any | null;

  // Estados de pagos integrados
  isProcessingSalePayment: boolean;
  salePaymentError: any | null;
  isProcessingPurchasePayment: boolean;
  purchasePaymentError: any | null;

  // Estado de verificación
  integrationStatus: any | null;
  isVerifyingIntegration: boolean;
  verificationError: any | null;

  // Acciones
  getActiveCashRegister: () => Promise<CashRegister | null>;
  openCashRegister: (cashRegisterData: any) => Promise<CashRegister>;
  closeCashRegister: (cashRegisterId: number, closeData?: any) => Promise<CashRegister>;
  getCashRegisters: (filters?: any) => Promise<CashRegister[]>;
  registerMovement: (cashRegisterId: number, movementData: any) => Promise<Movement>;
  getMovements: (cashRegisterId: number, filters?: any) => Promise<Movement[]>;
  getCashRegisterReport: (cashRegisterId: number) => Promise<CashRegisterSummary>;
  getAudits: (cashRegisterId: number) => Promise<Audit[]>;
  createAudit: (auditData: any) => Promise<any>;
  processSalePaymentWithCashRegister: (paymentData: any) => Promise<any>;
  processPurchasePaymentWithCashRegister: (paymentData: any) => Promise<any>;
  verifyIntegration: () => Promise<any>;
  clearError: (errorType: string) => void;
  clearAllErrors: () => void;
  reset: () => void;
}

const initialState = {
  activeCashRegister: null,
  isActiveCashRegisterLoading: false,
  activeCashRegisterError: null,
  cashRegisters: [],
  isCashRegistersLoading: false,
  cashRegistersError: null,
  movements: [],
  isMovementsLoading: false,
  movementsError: null,
  cashRegisterSummary: null,
  isSummaryLoading: false,
  summaryError: null,
  isOpeningCashRegister: false,
  openCashRegisterError: null,
  isClosingCashRegister: false,
  closeCashRegisterError: null,
  isRegisteringMovement: false,
  registerMovementError: null,
  audits: [],
  isAuditsLoading: false,
  auditsError: null,
  isCreatingAudit: false,
  createAuditError: null,
  isProcessingSalePayment: false,
  salePaymentError: null,
  isProcessingPurchasePayment: false,
  purchasePaymentError: null,
  integrationStatus: null,
  isVerifyingIntegration: false,
  verificationError: null,
}

export const useCashRegisterStore = create<CashRegisterState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      getActiveCashRegister: async () => {
        set({
          isActiveCashRegisterLoading: true,
          activeCashRegisterError: null,
        })

        try {
          const activeCashRegister =
            await cashRegisterService.getActiveCashRegister()

          set({
            activeCashRegister,
            isActiveCashRegisterLoading: false,
          })
          return activeCashRegister
        } catch (error) {
          console.warn('Error loading active cash register:', error)
          set({
            activeCashRegisterError: error,
            isActiveCashRegisterLoading: false,
          })
          throw error
        }
      },

      openCashRegister: async (cashRegisterData) => {
        const validationErrors =
          cashRegisterService.validateOpenCashRegisterData(cashRegisterData)
        if (validationErrors.length > 0) {
          const error = new Error(
            `Datos inválidos: ${validationErrors.join(', ')}`
          )
          set({ openCashRegisterError: error })
          throw error
        }

        set({ isOpeningCashRegister: true, openCashRegisterError: null })

        try {
          const newCashRegister = await cashRegisterService.openCashRegister(
            cashRegisterData
          )

          const { cashRegisters } = get()
          set({
            activeCashRegister: newCashRegister,
            cashRegisters: [newCashRegister, ...(cashRegisters || [])],
            isOpeningCashRegister: false,
          })

          return newCashRegister
        } catch (error) {
          console.warn('Error opening cash register:', error)
          set({
            openCashRegisterError: error,
            isOpeningCashRegister: false,
          })
          throw error
        }
      },

      closeCashRegister: async (cashRegisterId, closeData = {}) => {
        set({ isClosingCashRegister: true, closeCashRegisterError: null })

        try {
          const closedCashRegister =
            await cashRegisterService.closeCashRegister(
              cashRegisterId,
              closeData
            )

          const { cashRegisters } = get()
          const updatedCashRegisters = (cashRegisters || []).map(cr =>
            cr.id === cashRegisterId ? closedCashRegister : cr
          )

          set({
            activeCashRegister: null,
            cashRegisters: updatedCashRegisters,
            isClosingCashRegister: false,
          })

          return closedCashRegister
        } catch (error) {
          console.warn('Error closing cash register:', error)
          set({
            closeCashRegisterError: error,
            isClosingCashRegister: false,
          })
          throw error
        }
      },

      getCashRegisters: async (filters = {}) => {
        set({ isCashRegistersLoading: true, cashRegistersError: null })

        try {
          const cashRegisters = await cashRegisterService.getCashRegisters(
            filters
          )
          set({
            cashRegisters: Array.isArray(cashRegisters) ? cashRegisters : [],
            isCashRegistersLoading: false,
          })
          return cashRegisters
        } catch (error) {
          console.warn('Error loading cash registers:', error)
          set({
            cashRegistersError: error,
            cashRegisters: [],
            isCashRegistersLoading: false,
          })
          throw error
        }
      },

      registerMovement: async (cashRegisterId, movementData) => {
        const validationErrors =
          cashRegisterService.validateMovementData(movementData)
        if (validationErrors.length > 0) {
          const error = new Error(
            `Datos inválidos: ${validationErrors.join(', ')}`
          )
          set({ registerMovementError: error })
          throw error
        }

        set({ isRegisteringMovement: true, registerMovementError: null })

        try {
          const movement = await cashRegisterService.registerMovement(
            cashRegisterId,
            movementData
          )

          const { movements } = get()
          set({
            movements: [movement, ...(movements || [])],
            isRegisteringMovement: false,
          })

          if (get().activeCashRegister?.id === cashRegisterId) {
            get().getActiveCashRegister()
          }

          return movement
        } catch (error) {
          console.warn('Error registering movement:', error)
          set({
            registerMovementError: error,
            isRegisteringMovement: false,
          })
          throw error
        }
      },

      getMovements: async (cashRegisterId, filters = {}) => {
        set({ isMovementsLoading: true, movementsError: null })

        try {
          const movements = await cashRegisterService.getMovements(
            cashRegisterId,
            filters
          )
          set({
            movements: Array.isArray(movements) ? movements : [],
            isMovementsLoading: false,
          })
          return movements
        } catch (error) {
          console.warn('Error loading movements:', error)
          set({
            movementsError: error,
            movements: [],
            isMovementsLoading: false,
          })
          throw error
        }
      },

      getCashRegisterReport: async (cashRegisterId) => {
        set({ isSummaryLoading: true, summaryError: null })

        try {
          const report = await cashRegisterService.getCashRegisterReport(
            cashRegisterId
          )
          set({
            cashRegisterSummary: report,
            isSummaryLoading: false,
          })
          return report
        } catch (error) {
          console.warn('Error loading cash register report:', error)
          set({
            summaryError: error,
            isSummaryLoading: false,
          })
          throw error
        }
      },

      getAudits: async (cashRegisterId) => {
        set({ isAuditsLoading: true, auditsError: null })
        try {
          const audits = await cashRegisterService.getAuditsByRegister(
            cashRegisterId
          )
          set({
            audits: Array.isArray(audits) ? audits : [],
            isAuditsLoading: false,
          })
          return audits
        } catch (error) {
          console.warn('Error loading audits:', error)
          set({
            auditsError: error,
            isAuditsLoading: false,
          })
          throw error
        }
      },

      createAudit: async (auditData) => {
        set({ isCreatingAudit: true, createAuditError: null })
        try {
          const { cashAuditService } = await import('@/services/cashAuditService')
          const result = await cashAuditService.createAudit(auditData)

          const { audits } = get()
          set({
            audits: [result, ...(audits || [])],
            isCreatingAudit: false,
          })

          return result
        } catch (error) {
          console.warn('Error creating audit:', error)
          set({
            createAuditError: error,
            isCreatingAudit: false,
          })
          throw error
        }
      },

      processSalePaymentWithCashRegister: async (paymentData) => {
        set({ isProcessingSalePayment: true, salePaymentError: null })

        try {
          const result =
            await cashRegisterService.processSalePaymentWithCashRegister(
              paymentData
            )

          if (get().activeCashRegister) {
            get().getActiveCashRegister()
          }

          set({ isProcessingSalePayment: false })
          return result
        } catch (error) {
          console.warn(
            'Error processing sale payment with cash register:',
            error
          )
          set({
            salePaymentError: error,
            isProcessingSalePayment: false,
          })
          throw error
        }
      },

      processPurchasePaymentWithCashRegister: async (paymentData) => {
        set({ isProcessingPurchasePayment: true, purchasePaymentError: null })

        try {
          const result =
            await cashRegisterService.processPurchasePaymentWithCashRegister(
              paymentData
            )

          if (get().activeCashRegister) {
            get().getActiveCashRegister()
          }

          set({ isProcessingPurchasePayment: false })
          return result
        } catch (error) {
          console.warn(
            'Error processing purchase payment with cash register:',
            error
          )
          set({
            purchasePaymentError: error,
            isProcessingPurchasePayment: false,
          })
          throw error
        }
      },

      verifyIntegration: async () => {
        set({ isVerifyingIntegration: true, verificationError: null })

        try {
          const integrationStatus =
            await cashRegisterService.verifyIntegration()
          set({
            integrationStatus,
            isVerifyingIntegration: false,
          })
          return integrationStatus
        } catch (error) {
          console.warn('Error verifying integration:', error)
          set({
            verificationError: error,
            isVerifyingIntegration: false,
          })
          throw error
        }
      },

      clearError: (errorType) => {
        set({ [`${errorType}Error`]: null } as any)
      },

      clearAllErrors: () => {
        set({
          activeCashRegisterError: null,
          cashRegistersError: null,
          movementsError: null,
          summaryError: null,
          openCashRegisterError: null,
          closeCashRegisterError: null,
          registerMovementError: null,
          salePaymentError: null,
          purchasePaymentError: null,
          verificationError: null,
        })
      },

      reset: () => {
        set(initialState)
      },
    }),
    {
      name: 'cash-register-store',
      version: 1,
    }
  )
)

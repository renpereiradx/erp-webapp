/**
 * Store de cajas registradoras - Gestión completa de efectivo y pagos
 * Integración con APIs de cash register management siguiendo patrón MVP
 * Funcionalidad: apertura/cierre de cajas, movimientos, integración con pagos
 */

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { cashRegisterService } from '@/services/cashRegisterService'

const initialState = {
  // Estado de caja registradora activa
  activeCashRegister: null,
  isActiveCashRegisterLoading: false,
  activeCashRegisterError: null,

  // Lista de cajas registradoras
  cashRegisters: [],
  isCashRegistersLoading: false,
  cashRegistersError: null,

  // Movimientos de caja
  movements: [],
  isMovementsLoading: false,
  movementsError: null,

  // Resumen de caja
  cashRegisterSummary: null,
  isSummaryLoading: false,
  summaryError: null,

  // Estados de operaciones
  isOpeningCashRegister: false,
  openCashRegisterError: null,
  isClosingCashRegister: false,
  closeCashRegisterError: null,
  isRegisteringMovement: false,
  registerMovementError: null,

  // Estados de pagos integrados
  isProcessingSalePayment: false,
  salePaymentError: null,
  isProcessingPurchasePayment: false,
  purchasePaymentError: null,

  // Estado de verificación
  integrationStatus: null,
  isVerifyingIntegration: false,
  verificationError: null,
}

export const useCashRegisterStore = create()(
  devtools(
    (set, get) => ({
      ...initialState,

      // =================== GESTIÓN DE CAJA ACTIVA ===================

      /**
       * Obtiene la caja registradora activa
       * El backend ahora envía current_balance calculado correctamente
       */
      getActiveCashRegister: async () => {
        set({
          isActiveCashRegisterLoading: true,
          activeCashRegisterError: null,
        })

        try {
          const activeCashRegister =
            await cashRegisterService.getActiveCashRegister()

          // El backend ahora calcula current_balance automáticamente
          // Solo lo logueamos para debugging
          if (activeCashRegister?.current_balance != null) {
            console.log(
              '✅ Backend envía current_balance:',
              activeCashRegister.current_balance
            )
          }

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

      /**
       * Abre una nueva caja registradora
       */
      openCashRegister: async cashRegisterData => {
        // Validar datos antes de enviar
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

          // Actualizar estado: nueva caja activa y agregar a lista
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

      /**
       * Cierra la caja registradora activa
       */
      closeCashRegister: async (cashRegisterId, closeData = {}) => {
        set({ isClosingCashRegister: true, closeCashRegisterError: null })

        try {
          const closedCashRegister =
            await cashRegisterService.closeCashRegister(
              cashRegisterId,
              closeData
            )

          // Actualizar estado: quitar caja activa y actualizar en lista
          const { cashRegisters } = get()
          const updatedCashRegisters = (cashRegisters || []).map(cr =>
            cr.id === cashRegisterId ? closedCashRegister : cr
          )

          set({
            activeCashRegister: null, // Ya no hay caja activa
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

      // =================== LISTA DE CAJAS ===================

      /**
       * Obtiene lista de cajas registradoras con filtros
       */
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
            cashRegisters: [], // Mantener array vacío en caso de error
            isCashRegistersLoading: false,
          })
          throw error
        }
      },

      // =================== MOVIMIENTOS DE EFECTIVO ===================

      /**
       * Registra un movimiento manual
       */
      registerMovement: async (cashRegisterId, movementData) => {
        // Validar datos de movimiento
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

          // Actualizar lista de movimientos
          const { movements } = get()
          set({
            movements: [movement, ...(movements || [])],
            isRegisteringMovement: false,
          })

          // Refrescar caja activa para actualizar balance
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

      /**
       * Obtiene movimientos de una caja
       */
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
            movements: [], // Mantener array vacío en caso de error
            isMovementsLoading: false,
          })
          throw error
        }
      },

      /**
       * Obtiene resumen de caja
       */
      getCashRegisterSummary: async cashRegisterId => {
        set({ isSummaryLoading: true, summaryError: null })

        try {
          const summary = await cashRegisterService.getCashRegisterSummary(
            cashRegisterId
          )
          set({
            cashRegisterSummary: summary,
            isSummaryLoading: false,
          })
          return summary
        } catch (error) {
          console.warn('Error loading cash register summary:', error)
          set({
            summaryError: error,
            isSummaryLoading: false,
          })
          throw error
        }
      },

      // =================== INTEGRACIÓN CON PAGOS ===================

      /**
       * Procesa pago de venta con integración automática de caja
       */
      processSalePaymentWithCashRegister: async paymentData => {
        set({ isProcessingSalePayment: true, salePaymentError: null })

        try {
          const result =
            await cashRegisterService.processSalePaymentWithCashRegister(
              paymentData
            )

          // Refrescar caja activa para actualizar balance
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

      /**
       * Procesa pago de compra con integración automática de caja
       */
      processPurchasePaymentWithCashRegister: async paymentData => {
        set({ isProcessingPurchasePayment: true, purchasePaymentError: null })

        try {
          const result =
            await cashRegisterService.processPurchasePaymentWithCashRegister(
              paymentData
            )

          // Refrescar caja activa para actualizar balance
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

      // =================== VERIFICACIÓN DE INTEGRIDAD ===================

      /**
       * Verifica la integridad de la integración
       */
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

      // =================== UTILIDADES DE ESTADO ===================

      /**
       * Limpia errores específicos
       */
      clearError: errorType => {
        set({ [`${errorType}Error`]: null })
      },

      /**
       * Limpia todos los errores
       */
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

      /**
       * Reset completo del store
       */
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

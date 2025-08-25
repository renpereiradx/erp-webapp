/**
 * UNIFIED PAYMENT ARCHITECTURE - ERP WEBAPP
 * Sistema de pagos unificado para Sales y Purchases
 * 
 * Enfoque: Service abstraction con adaptadores especializados
 * 
 * Architecture Pattern:
 * ```
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    Payment Orchestrator                     │
 * │           (Unified payment processing logic)                │
 * └─────────────────┬───────────────────────────┬───────────────┘
 *                   │                           │
 *          ┌────────▼─────────┐         ┌──────▼────────┐
 *          │  Sales Adapter   │         │Purchase Adapter│
 *          │ (Customer focus) │         │(Supplier focus)│
 *          └──────────────────┘         └───────────────┘
 * ```
 * 
 * Benefits:
 * - Code reusability between sales and purchases
 * - Consistent payment validation and processing
 * - Centralized error handling and logging
 * - Unified change calculation and analytics
 * - Easy extension for new payment contexts
 */

// Base Payment Types (Shared)
export const PAYMENT_TYPES = {
  CASH: 'cash',
  CARD: 'card', 
  TRANSFER: 'transfer',
  CHECK: 'check',
  CREDIT: 'credit',
  DEBIT: 'debit'
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Transaction Context Types
export const TRANSACTION_CONTEXTS = {
  SALE: 'sale',
  PURCHASE: 'purchase'
};

/**
 * @typedef {Object} PaymentRequest
 * @property {string} context - 'sale' | 'purchase' 
 * @property {string} transactionId - ID de la venta o compra
 * @property {number} amount - Monto a pagar
 * @property {string} paymentType - Tipo de pago
 * @property {number} [amountReceived] - Monto recibido (para calcular cambio)
 * @property {string} [currency='MXN'] - Moneda
 * @property {string} [userId] - Usuario que procesa el pago
 * @property {Object} [metadata] - Información adicional específica del contexto
 */

/**
 * @typedef {Object} PaymentResponse
 * @property {boolean} success
 * @property {string} message
 * @property {string} paymentId
 * @property {string} transactionId
 * @property {string} context
 * @property {number} amount
 * @property {number} [change] - Cambio calculado
 * @property {string} status
 * @property {string} processedAt
 * @property {Object} [details] - Detalles específicos del contexto
 */

/**
 * UNIFIED PAYMENT ARCHITECTURE IMPLEMENTATION PLAN
 * 
 * Wave 1: Core Unified Services (Days 1-3)
 * ==========================================
 * 
 * 1. Core Payment Orchestrator (paymentOrchestrator.js)
 *    - Unified payment processing logic
 *    - Change calculation algorithms
 *    - Payment validation rules
 *    - Error handling and categorization
 *    - Analytics and telemetry integration
 * 
 * 2. Sales Payment Adapter (salesPaymentAdapter.js)
 *    - Sales-specific payment logic
 *    - Customer receipt generation
 *    - Sales tax handling
 *    - Integration with sales workflow
 * 
 * 3. Purchase Payment Adapter (purchasePaymentAdapter.js)
 *    - Purchase-specific payment logic
 *    - Supplier payment tracking
 *    - Purchase invoice handling
 *    - Integration with purchase workflow
 * 
 * Wave 2: State Management (Days 4-5)
 * ====================================
 * 
 * 4. Unified Payment Store (usePaymentStore.js)
 *    - Shared payment state management
 *    - Context-aware state isolation
 *    - Payment history tracking
 *    - Cross-context analytics
 * 
 * 5. Sales Payment Store (useSalesPaymentStore.js)
 *    - Sales-specific payment state
 *    - Customer payment history
 *    - Sales analytics integration
 * 
 * 6. Purchase Payment Store (usePurchasePaymentStore.js)
 *    - Purchase-specific payment state
 *    - Supplier payment tracking
 *    - Purchase analytics integration
 * 
 * Wave 3: UI Components (Days 6-8)
 * =================================
 * 
 * 7. Unified Payment Components
 *    - PaymentMethodSelector.jsx (reusable)
 *    - PaymentAmountInput.jsx (with change calculation)
 *    - PaymentSummary.jsx (context-aware)
 *    - PaymentReceipt.jsx (unified template)
 * 
 * 8. Context-Specific Components
 *    - SalesPaymentForm.jsx (customer-focused)
 *    - PurchasePaymentForm.jsx (supplier-focused)
 *    - PaymentHistory.jsx (unified with filters)
 * 
 * Wave 4: Integration & Testing (Days 9-10)
 * ==========================================
 * 
 * 9. Integration Points
 *    - Update existing salesService.js to use unified payments
 *    - Update existing purchaseService.js to use unified payments
 *    - Maintain backward compatibility
 * 
 * 10. Comprehensive Testing
 *     - Unit tests for all payment services
 *     - Integration tests for both contexts
 *     - E2E payment flows
 * 
 * BENEFITS OF THIS ARCHITECTURE:
 * ==============================
 * 
 * ✅ Code Reusability
 * - Shared payment logic (validation, change calculation, etc.)
 * - Unified error handling and logging
 * - Consistent payment analytics
 * 
 * ✅ Maintainability
 * - Single source of truth for payment business rules
 * - Context-specific customizations through adapters
 * - Easy to add new payment contexts (invoices, expenses, etc.)
 * 
 * ✅ Consistency
 * - Same payment UX across sales and purchases
 * - Unified payment reporting and analytics
 * - Consistent error messages and validations
 * 
 * ✅ Scalability
 * - Easy to add new payment methods
 * - Support for multiple currencies
 * - Ready for payment gateway integrations
 * 
 * ✅ Enterprise Features
 * - Comprehensive audit trails
 * - Advanced analytics and reporting
 * - Compliance with payment standards
 * 
 * MIGRATION STRATEGY:
 * ===================
 * 
 * Phase 1: Create unified services (maintain existing APIs)
 * Phase 2: Migrate sales payments to use unified architecture
 * Phase 3: Migrate purchase payments to use unified architecture
 * Phase 4: Remove duplicate payment code
 * Phase 5: Enhanced features using unified foundation
 * 
 * This approach ensures zero downtime and gradual adoption
 * while building a robust, scalable payment system.
 */

export const UNIFIED_PAYMENT_ARCHITECTURE = {
  version: '1.0.0',
  contexts: Object.values(TRANSACTION_CONTEXTS),
  paymentTypes: Object.values(PAYMENT_TYPES),
  status: Object.values(PAYMENT_STATUS),
  
  // Configuration for different contexts
  contextConfig: {
    [TRANSACTION_CONTEXTS.SALE]: {
      name: 'Sales',
      entity: 'customer',
      endpoint: '/sale/{id}/payment',
      receiptTemplate: 'sales_receipt',
      analytics: 'sales_payment_analytics'
    },
    [TRANSACTION_CONTEXTS.PURCHASE]: {
      name: 'Purchases', 
      entity: 'supplier',
      endpoint: '/purchase/{id}/payment',
      receiptTemplate: 'purchase_receipt',
      analytics: 'purchase_payment_analytics'
    }
  }
};

export default UNIFIED_PAYMENT_ARCHITECTURE;

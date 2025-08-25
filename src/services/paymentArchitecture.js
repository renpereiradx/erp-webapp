/**
 * UNIFIED PAYMENT ARCHITECTURE CONSTANTS
 * Definiciones compartidas para el sistema de pagos unificado
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

// Configuration for different contexts
export const CONTEXT_CONFIG = {
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
};

export const UNIFIED_PAYMENT_ARCHITECTURE = {
  version: '1.0.0',
  contexts: Object.values(TRANSACTION_CONTEXTS),
  paymentTypes: Object.values(PAYMENT_TYPES),
  status: Object.values(PAYMENT_STATUS),
  contextConfig: CONTEXT_CONFIG
};

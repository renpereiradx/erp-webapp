/**
 * @typedef {Object} EnrichedCashMovement
 * @property {number} movement_id - ID único del movimiento
 * @property {'INCOME'|'EXPENSE'|'ADJUSTMENT'} movement_type - Tipo de movimiento
 * @property {number} amount - Monto del movimiento
 * @property {string} concept - Concepto/descripción del movimiento
 * @property {string} created_at - Timestamp ISO 8601
 * @property {number} running_balance - Balance acumulado después de este movimiento
 * @property {string} created_by - ID del usuario que creó el movimiento
 * @property {string|null} user_first_name - Nombre del usuario
 * @property {string|null} user_last_name - Apellido del usuario
 * @property {string|null} user_full_name - Nombre completo del usuario
 * @property {number|null} related_payment_id - ID del pago relacionado (si aplica)
 * @property {string|null} related_sale_id - ID de la venta relacionada (si aplica)
 * @property {number|null} related_purchase_id - ID de la compra relacionada (si aplica)
 * @property {number|null} sale_total - Total de la venta relacionada
 * @property {'PENDING'|'PARTIAL_PAYMENT'|'PAID'|'CANCELLED'|null} sale_status - Estado de la venta
 * @property {string|null} sale_client_name - Nombre completo del cliente de la venta
 * @property {string|null} sale_payment_method - Método de pago utilizado en la venta
 * @property {number|null} purchase_total - Total de la compra relacionada
 * @property {string|null} purchase_status - Estado de la compra
 * @property {string|null} purchase_supplier - Nombre del proveedor de la compra
 */

/**
 * @typedef {Object} CashRegister
 * @property {number} id - ID de la caja registradora
 * @property {string} name - Nombre descriptivo de la caja
 * @property {'OPEN'|'CLOSED'} status - Estado actual de la caja
 * @property {number} initial_balance - Balance inicial en efectivo
 * @property {number|null} current_balance - Balance actual (si está abierta)
 * @property {string} opened_at - Timestamp de apertura
 * @property {string} opened_by - ID del usuario que abrió la caja
 * @property {string|null} closed_at - Timestamp de cierre
 * @property {string|null} closed_by - ID del usuario que cerró la caja
 * @property {number|null} final_balance - Balance final reportado
 * @property {string|null} location - Ubicación física
 * @property {string|null} description - Descripción adicional
 * @property {string|null} notes - Notas del cierre
 * @property {number|null} variance - Diferencia entre balance calculado y final
 */

/**
 * @typedef {Object} OpenCashRegisterRequest
 * @property {string} name - Nombre descriptivo de la caja
 * @property {number} initial_balance - Balance inicial (debe ser > 0)
 * @property {string} [location] - Ubicación física (opcional)
 * @property {string} [description] - Descripción adicional (opcional)
 */

/**
 * @typedef {Object} CloseCashRegisterRequest
 * @property {number} [final_balance] - Balance final reportado (opcional)
 * @property {string} [notes] - Notas del cierre (opcional)
 */

/**
 * @typedef {Object} RegisterMovementRequest
 * @property {'INCOME'|'EXPENSE'|'ADJUSTMENT'} movement_type - Tipo de movimiento
 * @property {number} amount - Monto del movimiento (debe ser > 0)
 * @property {string} concept - Concepto del movimiento
 * @property {string} [notes] - Notas adicionales (opcional)
 */

/**
 * @typedef {Object} CashRegisterSummary
 * @property {Object} cash_register - Información de la caja
 * @property {number} cash_register.id - ID de la caja
 * @property {string} cash_register.name - Nombre de la caja
 * @property {string} cash_register.status - Estado de la caja
 * @property {string} cash_register.opened_at - Timestamp de apertura
 * @property {Object} financial_summary - Resumen financiero
 * @property {number} financial_summary.initial_balance - Balance inicial
 * @property {number} financial_summary.total_income - Total de ingresos
 * @property {number} financial_summary.total_expenses - Total de egresos
 * @property {number} financial_summary.current_balance - Balance actual
 * @property {number} financial_summary.calculated_balance - Balance calculado
 * @property {Object} movement_counts - Conteo de movimientos
 * @property {number} movement_counts.total_movements - Total de movimientos
 * @property {number} movement_counts.income_movements - Movimientos de ingreso
 * @property {number} movement_counts.expense_movements - Movimientos de egreso
 * @property {number} movement_counts.adjustment_movements - Movimientos de ajuste
 * @property {Object} period_summary - Resumen del período
 * @property {string} period_summary.start_time - Inicio del período
 * @property {number} period_summary.duration_hours - Duración en horas
 */

/**
 * @typedef {Object} PaymentCashSummary
 * @property {number} cash_received - Efectivo recibido
 * @property {number} amount_applied - Monto aplicado al pago
 * @property {number} change_given - Vuelto entregado
 * @property {number} net_cash_impact - Impacto neto en caja
 */

/**
 * @typedef {Object} SalePaymentWithCashRegisterResponse
 * @property {boolean} success - Indica si el pago fue exitoso
 * @property {number} payment_id - ID del pago registrado
 * @property {Object} payment_summary - Resumen del pago
 * @property {number} payment_summary.total_sale_amount - Monto total de la venta
 * @property {number} payment_summary.current_payment - Pago actual
 * @property {number} payment_summary.remaining_balance - Saldo restante
 * @property {string} payment_summary.sale_status - Estado de la venta
 * @property {PaymentCashSummary} cash_summary - Resumen de efectivo
 * @property {boolean} requires_change - Indica si requiere vuelto
 */

/**
 * @typedef {Object} IntegrationVerificationResult
 * @property {'FULLY_INTEGRATED'|'PARTIAL_INTEGRATION'|'INTEGRATION_ERROR'} integration_status - Estado de integración
 * @property {Object} verification_results - Resultados de verificación
 * @property {number} verification_results.total_payments - Total de pagos
 * @property {number} verification_results.total_movements - Total de movimientos
 * @property {number} verification_results.payments_with_movements - Pagos con movimientos
 * @property {number} verification_results.orphan_payments - Pagos huérfanos
 * @property {number} verification_results.orphan_movements - Movimientos huérfanos
 * @property {Object} integrity_check - Verificación de integridad
 * @property {boolean} integrity_check.passed - Indica si pasó la verificación
 * @property {string} integrity_check.formula - Fórmula de verificación
 * @property {number} integrity_check.total_income - Total de ingresos
 * @property {number} integrity_check.total_expenses - Total de egresos
 * @property {number} integrity_check.net_cash - Efectivo neto
 * @property {number} integrity_check.total_paid - Total pagado
 * @property {number} integrity_check.variance - Variación
 */

export {};

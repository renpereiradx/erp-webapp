/**
 * Traducciones de Movimientos de Caja en español
 * Incluye: registro de movimientos manuales, tipos, conceptos, filtros, anulación
 */

export const cashMovement = {
  // Breadcrumb (legacy)
  'cashMovement.breadcrumb.cashMovements': 'Movimientos de Caja',
  'cashMovement.breadcrumb.newMovement': 'Nuevo Registro',

  // Page Title
  'cashMovement.title': 'Registrar Movimiento Manual de Efectivo',
  'cashMovement.subtitle':
    'Complete el formulario para registrar una nueva transacción.',
  'cashMovement.pageTitle': 'Movimientos de Caja',
  'cashMovement.pageSubtitle': 'Caja activa',
  'cashMovement.currentBalance': 'Saldo',

  // Form Fields
  'cashMovement.field.movementType': 'Tipo de Movimiento',
  'cashMovement.field.cashRegister': 'Caja Registradora',
  'cashMovement.field.concept': 'Concepto',
  'cashMovement.field.amount': 'Monto',
  'cashMovement.field.notes': 'Notas',

  // Placeholders
  'cashMovement.placeholder.selectCashRegister': 'Seleccionar Caja',
  'cashMovement.placeholder.selectConcept': 'Seleccionar Concepto',
  'cashMovement.placeholder.notes':
    'Añada una descripción detallada si es necesario...',

  // Movement Types
  'cashMovement.type.income': 'Ingreso',
  'cashMovement.type.expense': 'Egreso',
  'cashMovement.type.adjustment': 'Ajuste',
  'cashMovement.type.transfer': 'Transferencia',

  // Concepts
  'cashMovement.concept.deposit': 'Depósito de efectivo',
  'cashMovement.concept.reposition': 'Reposición de caja',
  'cashMovement.concept.otherIncome': 'Otro ingreso',
  'cashMovement.concept.withdrawal': 'Retiro de efectivo',
  'cashMovement.concept.purchase': 'Compra de insumos',
  'cashMovement.concept.service': 'Pago de servicio',
  'cashMovement.concept.otherExpense': 'Otro egreso',
  'cashMovement.concept.difference': 'Ajuste por diferencia',
  'cashMovement.concept.correction': 'Corrección de saldo',

  // Actions
  'cashMovement.saveAndNew': 'Guardar y Nuevo',
  'cashMovement.newMovement': 'Nuevo Movimiento',
  'cashMovement.newMovement.title': 'Registrar Nuevo Movimiento',
  'cashMovement.newMovement.description':
    'Complete el formulario para registrar un movimiento manual de efectivo.',

  // Filters
  'cashMovement.filter.type': 'Tipo',
  'cashMovement.filter.allTypes': 'Todos',
  'cashMovement.filter.dateFrom': 'Desde',
  'cashMovement.filter.dateTo': 'Hasta',

  // Table headers
  'cashMovement.table.date': 'Fecha',
  'cashMovement.table.type': 'Tipo',
  'cashMovement.table.concept': 'Concepto',
  'cashMovement.table.amount': 'Monto',
  'cashMovement.table.balance': 'Balance',
  'cashMovement.table.user': 'Usuario',
  'cashMovement.table.details': 'Detalles',
  'cashMovement.table.actions': 'Acciones',

  // No cash register state
  'cashMovement.noCashRegister.title': 'No hay caja activa',
  'cashMovement.noCashRegister.description':
    'Debe abrir una caja registradora para ver y registrar movimientos.',
  'cashMovement.noCashRegister.action': 'Ir a Caja Registradora',

  // Empty states
  'cashMovement.noMovements': 'No hay movimientos registrados',
  'cashMovement.loadingMovements': 'Cargando movimientos...',

  // Void Movement
  'cashMovement.void.button': 'Anular',
  'cashMovement.void.title': 'Anular Movimiento',
  'cashMovement.void.description':
    'Esta acción creará un movimiento de reversión. No se puede deshacer.',
  'cashMovement.void.reason': 'Razón de anulación',
  'cashMovement.void.reasonPlaceholder':
    'Ingrese la razón de la anulación (mínimo 5 caracteres)',
  'cashMovement.void.reasonRequired':
    'La razón debe tener al menos 5 caracteres',
  'cashMovement.void.confirm': 'Anular',
  'cashMovement.void.success': 'Movimiento anulado correctamente',
  'cashMovement.void.error': 'Error al anular el movimiento',

  // Success Messages
  'cashMovement.success': 'Movimiento registrado con éxito.',
  'cashMovement.success.detail':
    'El ingreso se ha contabilizado en el saldo actual.',

  // Error Messages
  'cashMovement.error.generic': 'Error al registrar el movimiento',
  'cashMovement.error.title': 'No se pudo completar el registro',
  'cashMovement.error.noActiveCashRegister':
    'No hay caja registradora activa. Por favor, abra una caja primero.',
  'cashMovement.error.loadingCashRegister':
    'Error al cargar la caja registradora',
  'cashMovement.error.loadingMovements': 'Error al cargar los movimientos',
  'cashMovement.error.noCashRegister': 'Debe seleccionar una caja registradora',
  'cashMovement.error.noConcept': 'Debe seleccionar un concepto',
  'cashMovement.error.invalidAmount': 'El monto debe ser mayor a 0',
}

/**
 * Traducciones de Movimientos de Caja en español
 * Incluye: registro de movimientos manuales, tipos, conceptos
 */

export const cashMovement = {
  // Breadcrumb
  'cashMovement.breadcrumb.cashMovements': 'Movimientos de Caja',
  'cashMovement.breadcrumb.newMovement': 'Nuevo Registro',

  // Page Title
  'cashMovement.title': 'Registrar Movimiento Manual de Efectivo',
  'cashMovement.subtitle':
    'Complete el formulario para registrar una nueva transacción.',

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

  // Actions
  'cashMovement.saveAndNew': 'Guardar y Nuevo',

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
  'cashMovement.error.noCashRegister': 'Debe seleccionar una caja registradora',
  'cashMovement.error.noConcept': 'Debe seleccionar un concepto',
  'cashMovement.error.invalidAmount': 'El monto debe ser mayor a 0',
}

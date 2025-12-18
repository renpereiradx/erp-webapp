/**
 * Traducciones de Movimientos de Caja en español
 * Incluye: registro de movimientos manuales, tipos, conceptos
 */

export const cashMovement = {
  // Breadcrumb
  'cashMovement.breadcrumb.movements': 'Movimientos de Caja',
  'cashMovement.breadcrumb.new': 'Nuevo Registro',

  // Page Title
  'cashMovement.title': 'Registrar Movimiento Manual de Efectivo',

  // Form Fields
  'cashMovement.field.movementType': 'Tipo de Movimiento',
  'cashMovement.field.cashRegister': 'Caja Registradora',
  'cashMovement.field.concept': 'Concepto',
  'cashMovement.field.concept.placeholder': 'Seleccionar Concepto',
  'cashMovement.field.amount': 'Monto',
  'cashMovement.field.notes': 'Notas (Opcional)',
  'cashMovement.field.notes.placeholder': 'Añada una descripción detallada si es necesario...',

  // Movement Types
  'cashMovement.type.income': 'Ingreso',
  'cashMovement.type.expense': 'Egreso',
  'cashMovement.type.adjustment': 'Ajuste',

  // Actions
  'cashMovement.action.saveAndNew': 'Guardar y Nuevo',

  // Success Messages
  'cashMovement.success': 'Movimiento registrado con éxito.',

  // Error Messages
  'cashMovement.error.generic': 'Error al registrar el movimiento',
  'cashMovement.error.noActiveCashRegister': 'No hay caja registradora activa. Por favor, abra una caja primero.',
  'cashMovement.error.loadingCashRegister': 'Error al cargar la caja registradora',
  'cashMovement.error.noCashRegister': 'Debe seleccionar una caja registradora',
  'cashMovement.error.noConcept': 'Debe seleccionar un concepto',
  'cashMovement.error.invalidAmount': 'El monto debe ser mayor a 0',
}

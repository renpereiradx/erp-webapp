/**
 * Traducciones de Gestión de Cajas en español
 * Incluye: apertura/cierre de cajas, movimientos, formularios
 */

export const cashRegister = {
  // Títulos y secciones
  'cashRegister.title': 'Gestión de Cajas Registradoras',
  'cashRegister.subtitle': 'Abre o cierra una caja para registrar los movimientos de efectivo.',
  'cashRegister.tab.open': 'Abrir Caja',
  'cashRegister.tab.close': 'Cerrar Caja',

  // Formulario de Apertura
  'cashRegister.open.title': 'Abrir Nueva Caja Registradora',
  'cashRegister.open.name': 'Nombre de la Caja',
  'cashRegister.open.name.placeholder': 'Ej: Caja Principal - Turno Mañana',
  'cashRegister.open.location': 'Ubicación',
  'cashRegister.open.location.placeholder': 'Ej: Punto de Venta 1',
  'cashRegister.open.cashier': 'Cajero',
  'cashRegister.open.cashier.placeholder': 'Seleccionar cajero',
  'cashRegister.open.register': 'Caja',
  'cashRegister.open.register.placeholder': 'Seleccionar caja',
  'cashRegister.open.openingDate': 'Fecha de Apertura',
  'cashRegister.open.initialBalance': 'Saldo Inicial',
  'cashRegister.open.initialBalance.placeholder': '0.00',
  'cashRegister.open.openingNotes': 'Notas de Apertura',
  'cashRegister.open.openingNotes.placeholder': 'Añadir una descripción o nota (opcional)',
  'cashRegister.open.action': 'Abrir Caja',

  // Formulario de Cierre
  'cashRegister.close.title': 'Cerrar Caja Registradora',
  'cashRegister.close.cashier': 'Cajero',
  'cashRegister.close.register': 'Caja',
  'cashRegister.close.closingDate': 'Fecha de Cierre',
  'cashRegister.close.finalBalance': 'Saldo Final',
  'cashRegister.close.finalBalance.placeholder': '0.00',
  'cashRegister.close.systemBalance': 'Saldo del Sistema',
  'cashRegister.close.difference': 'Diferencia',
  'cashRegister.close.closingNotes': 'Notas de Cierre',
  'cashRegister.close.closingNotes.placeholder': 'Observaciones del cierre (opcional)',
  'cashRegister.close.action': 'Cerrar Caja',
  'cashRegister.close.summary': 'Resumen del Cierre',
  'cashRegister.close.totalSales': 'Total Ventas',
  'cashRegister.close.totalExpenses': 'Total Gastos',
  'cashRegister.close.totalMovements': 'Total Movimientos',

  // Estados
  'cashRegister.status.active': 'Activa',
  'cashRegister.status.closed': 'Cerrada',
  'cashRegister.status.noActive': 'No hay caja activa',
  'cashRegister.empty.title': 'Sin cajas registradoras',
  'cashRegister.empty.message': 'No hay cajas registradas. Abre una nueva caja para comenzar.',

  // Errores
  'cashRegister.error.title': 'Error al cargar cajas',
  'cashRegister.error.generic': 'Error al procesar la solicitud. Intente nuevamente.',
  'cashRegister.error.opening': 'Error al abrir la caja registradora',
  'cashRegister.error.closing': 'Error al cerrar la caja registradora',
  'cashRegister.error.invalidBalance': 'El saldo inicial debe ser mayor a 0',
  'cashRegister.error.noName': 'Debe ingresar un nombre para la caja',
  'cashRegister.error.noCashier': 'Debe seleccionar un cajero',
  'cashRegister.error.noRegister': 'Debe seleccionar una caja',

  // Mensajes de éxito
  'cashRegister.success.opened': 'Caja registradora abierta exitosamente',
  'cashRegister.success.closed': 'Caja registradora cerrada exitosamente',

  // Campos comunes
  'cashRegister.field.cashier': 'Cajero',
  'cashRegister.field.register': 'Caja',
  'cashRegister.field.date': 'Fecha',
  'cashRegister.field.balance': 'Saldo',
  'cashRegister.field.notes': 'Notas',
  'cashRegister.field.currency': '₲',

  // Loading states
  'cashRegister.loading': 'Cargando...',
  'cashRegister.opening': 'Abriendo caja...',
  'cashRegister.closing': 'Cerrando caja...',
}

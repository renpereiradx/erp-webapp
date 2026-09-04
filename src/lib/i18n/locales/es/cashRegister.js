/**
 * Traducciones de Gestión de Cajas en español
 * Incluye: apertura/cierre de cajas, movimientos, formularios
 */

export const cashRegister = {
  // Títulos y secciones
  'cashRegister.title': 'Gestión de Cajas Registradoras',
  'cashRegister.subtitle':
    'Abre o cierra una caja para registrar los movimientos de efectivo.',
  'cashRegister.openClose': 'Apertura y Cierre',
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
  'cashRegister.open.openingNotes.placeholder':
    'Añadir una descripción o nota (opcional)',
  'cashRegister.open.action': 'Abrir Caja',

  // Formulario de Cierre
  'cashRegister.close.title': 'Cerrar Caja Registradora',
  'cashRegister.close.cashier': 'Cajero',
  'cashRegister.close.register': 'Caja',
  'cashRegister.close.location': 'Ubicación',
  'cashRegister.close.closingDate': 'Fecha de Cierre',
  'cashRegister.close.finalBalance': 'Saldo Final',
  'cashRegister.close.finalBalance.placeholder': '0.00',
  'cashRegister.close.systemBalance': 'Saldo del Sistema',
  'cashRegister.close.difference': 'Diferencia',
  'cashRegister.close.closingNotes': 'Notas de Cierre',
  'cashRegister.close.closingNotes.placeholder':
    'Observaciones del cierre (opcional)',
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
  'cashRegister.empty.message':
    'No hay cajas registradas. Abre una nueva caja para comenzar.',

  // Errores
  'cashRegister.error.title': 'Error al cargar cajas',
  'cashRegister.error.generic':
    'Error al procesar la solicitud. Intente nuevamente.',
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
  'cashRegister.field.name': 'Caja',
  'cashRegister.field.date': 'Fecha',
  'cashRegister.field.balance': 'Saldo actual',
  'cashRegister.field.openedAt': 'Abierta desde',
  'cashRegister.field.notes': 'Notas',
  'cashRegister.field.currency': '₲',

  // Advertencias
  'cashRegister.warning.alreadyOpen': 'Ya tienes una caja abierta',
  'cashRegister.warning.closeFirst':
    'Debes cerrar la caja actual antes de abrir una nueva.',

  // Loading states
  'cashRegister.loading': 'Cargando...',
  'cashRegister.opening': 'Abriendo caja...',
  'cashRegister.closing': 'Cerrando caja...',

  // Página de jornada (/caja-registradora)
  'cashRegister.page.title': 'Jornada de caja',
  'cashRegister.page.subtitle':
    'Control de apertura y cierre de terminales de punto de venta.',
  'cashRegister.loadingSession': 'Cargando jornada...',
  'cashRegister.action.seeMovements': 'Ver movimientos',
  'cashRegister.tab.openPanel': 'Apertura de caja',
  'cashRegister.tab.closePanel': 'Cierre de caja',

  // Tarjeta de sesión activa
  'cashRegister.session.activeTerminal': 'Terminal activa',
  'cashRegister.session.noActiveTerminal': 'Sin terminal activa',
  'cashRegister.session.noActiveTerminalDesc':
    'No hay una jornada abierta. Inicie la apertura para registrar movimientos.',
  'cashRegister.session.systemBalance': 'Saldo en sistema',
  'cashRegister.session.notDefined': 'No definida',
  'cashRegister.action.closeJourney': 'Cerrar jornada',

  // Formulario de apertura (jornada)
  'cashRegister.open.identifier': 'Nombre identificador',
  'cashRegister.open.identifierPlaceholder': 'Ej: CAJA-01 Turno Mañana',
  'cashRegister.open.effectiveDate': 'Fecha efectiva',
  'cashRegister.open.initialFloat': 'Fondo inicial de maniobra',
  'cashRegister.open.auditNotes': 'Notas de auditoría',
  'cashRegister.open.auditNotesPlaceholder':
    'Añada detalles sobre el estado inicial del efectivo o novedades...',
  'cashRegister.open.restrictionTitle': 'Restricción de operación',
  'cashRegister.open.restrictionDesc':
    'Ya existe una sesión activa para este terminal. Debe finalizar la jornada actual antes de iniciar una nueva apertura de fondos.',

  // Formulario de cierre (jornada)
  'cashRegister.close.countRequired': 'Arqueo requerido',
  'cashRegister.close.countHelp':
    'Ingrese el efectivo total contado físicamente en {name}.',
  'cashRegister.close.physicalFinal': 'Balance físico final',
  'cashRegister.close.auditDifference': 'Diferencia de auditoría',
  'cashRegister.close.balanced': 'Balance cuadrado',
  'cashRegister.close.needsJustification': 'Requiere justificación',
  'cashRegister.close.observations': 'Observaciones de cierre',
  'cashRegister.close.observationsPlaceholder':
    'Describa el motivo de cualquier discrepancia detectada o novedades durante el turno...',
  'cashRegister.close.finalize': 'Finalizar y cerrar caja',
  'cashRegister.close.noTerminalTitle': 'No hay terminal activa',
  'cashRegister.close.noTerminalDesc':
    'Debe existir una jornada operativa abierta para poder realizar el cierre.',
  'cashRegister.close.goToOpen': 'Ir a Apertura',

  // Campos comunes de jornada
  'cashRegister.field.identifier': 'Identificador',
  'cashRegister.field.initialFloat': 'Fondo inicial',

  // Errores de jornada
  'cashRegister.error.noActiveSession': 'No hay caja activa',
  'cashRegister.error.noSessionId':
    'No se pudo identificar la caja activa para cerrarla',
  'cashRegister.error.invalidFinalBalance': 'El saldo ingresado no es válido',
}

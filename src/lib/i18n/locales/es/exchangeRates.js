/**
 * Traducciones de Tipos de Cambio (Exchange Rates) en español
 * Módulo: Configuración Financiera > Tipos de Cambio
 */

export const exchangeRates = {
  // Títulos y subtítulos
  'exchangeRates.title': 'Tipos de Cambio',
  'exchangeRates.subtitle':
    'Visualice y administre las tasas de cambio diarias y pares de divisas.',

  // Acciones
  'exchangeRates.action.create': 'Nueva Tasa',
  'exchangeRates.action.edit': 'Editar Tasa',
  'exchangeRates.action.delete': 'Eliminar Tasa',
  'exchangeRates.action.export': 'Exportar CSV',

  // Búsqueda y filtros
  'exchangeRates.search.placeholder': 'Buscar moneda (ej. USD, EUR)',
  'exchangeRates.filter.from': 'Desde',
  'exchangeRates.filter.to': 'Hasta',
  'exchangeRates.filter.fromCurrency': 'Moneda origen',
  'exchangeRates.filter.toCurrency': 'Moneda destino',
  'exchangeRates.filter.dateRange': 'Rango de fechas',
  'exchangeRates.placeholder.source': 'Ingrese la fuente (ej. Banco Central)',

  // Modos de vista
  'exchangeRates.view.latest': 'Recientes',
  'exchangeRates.view.historical': 'Histórico',

  // Tabla
  'exchangeRates.table.currencyPair': 'Par de Moneda',
  'exchangeRates.table.rate': 'Tasa',
  'exchangeRates.table.source': 'Fuente',
  'exchangeRates.table.createdAt': 'Fecha de Creación',
  'exchangeRates.table.status': 'Estado',
  'exchangeRates.table.actions': 'Acciones',

  // Fuentes
  'exchangeRates.source.manual': 'Manual',
  'exchangeRates.source.centralBank': 'Banco Central',
  'exchangeRates.source.forexApi': 'Forex API',
  'exchangeRates.source.system': 'Sistema',

  // Estados
  'exchangeRates.status.active': 'Activo',
  'exchangeRates.status.inactive': 'Inactivo',

  // Paginación
  'exchangeRates.pagination.rowsPerPage': 'Filas por página:',
  'exchangeRates.pagination.showing': '{start}-{end} de {total}',

  // Modal
  'exchangeRates.modal.create_title': 'Nueva Tasa de Cambio',
  'exchangeRates.modal.edit_title': 'Editar Tasa de Cambio',
  'exchangeRates.modal.delete_title': 'Eliminar Tasa de Cambio',
  'exchangeRates.modal.delete_confirm':
    '¿Estás seguro de que deseas eliminar esta tasa de cambio? Esta acción no se puede deshacer.',

  // Campos del formulario
  'exchangeRates.field.currency': 'Moneda',
  'exchangeRates.field.rate': 'Tasa',
  'exchangeRates.field.effectiveDate': 'Fecha Efectiva',
  'exchangeRates.field.source': 'Fuente',

  // Validaciones
  'exchangeRates.validation.currency_required': 'La moneda es requerida',
  'exchangeRates.validation.rate_required': 'La tasa es requerida',
  'exchangeRates.validation.rate_positive': 'La tasa debe ser mayor a 0',

  // Estados vacíos
  'exchangeRates.empty.title': 'Sin tipos de cambio',
  'exchangeRates.empty.message': 'No hay tipos de cambio registrados',
  'exchangeRates.empty.search':
    'No se encontraron tipos de cambio con ese criterio',

  // Errores
  'exchangeRates.error.title': 'Error',
  'exchangeRates.error.load': 'Error al cargar los tipos de cambio',
  'exchangeRates.error.save': 'Error al guardar el tipo de cambio',
  'exchangeRates.error.delete': 'Error al eliminar el tipo de cambio',

  // Menú de navegación
  'nav.exchange_rates': 'Tipos de Cambio',
}

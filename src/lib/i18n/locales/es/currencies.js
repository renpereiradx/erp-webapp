/**
 * Traducciones de Monedas (Currencies) en español
 * Módulo: Configuración Financiera > Monedas
 */

export const currencies = {
  // Títulos y subtítulos
  'currencies.title': 'Gestión de Monedas',
  'currencies.subtitle':
    'Administre el catálogo de divisas habilitadas para las transacciones del sistema ERP.',

  // Acciones
  'currencies.action.create': 'Nueva Moneda',
  'currencies.action.edit': 'Editar Moneda',
  'currencies.action.delete': 'Eliminar Moneda',
  'currencies.action.export': 'Exportar',

  // Búsqueda y filtros
  'currencies.search.placeholder': 'Buscar por código ISO o nombre...',
  'currencies.search.label': 'Buscar monedas',
  'currencies.filter.all': 'Todas',
  'currencies.filter.enabled': 'Habilitadas',
  'currencies.filter.disabled': 'Deshabilitadas',

  // Tabla
  'currencies.table.code': 'Código ISO',
  'currencies.table.name': 'Nombre',
  'currencies.table.symbol': 'Símbolo',
  'currencies.table.status': 'Estado',
  'currencies.table.actions': 'Acciones',
  'currencies.table.exchange_rate': 'Tasa de Cambio',

  // Estados
  'currencies.status.enabled': 'Habilitada',
  'currencies.status.disabled': 'Deshabilitada',
  'currencies.status.active': 'Activa',
  'currencies.status.inactive': 'Inactiva',
  'currencies.badge.base': 'Base',

  // Campos del formulario
  'currencies.field.code': 'Código ISO',
  'currencies.field.name': 'Nombre',
  'currencies.field.symbol': 'Símbolo',
  'currencies.field.decimals': 'Decimales',
  'currencies.field.flag': 'Bandera (emoji)',
  'currencies.field.exchange_rate': 'Tasa de Cambio',
  'currencies.field.enabled': 'Moneda habilitada para transacciones',

  // Placeholders
  'currencies.placeholder.name': 'Dólar Estadounidense',

  // Hints
  'currencies.hint.exchange_rate': 'Equivalente en moneda base',

  // Validaciones
  'currencies.validation.code_required': 'El código ISO es requerido',
  'currencies.validation.code_length': 'El código debe tener 3 caracteres',
  'currencies.validation.name_required': 'El nombre es requerido',
  'currencies.validation.symbol_required': 'El símbolo es requerido',

  // Modal
  'currencies.modal.create_title': 'Nueva Moneda',
  'currencies.modal.edit_title': 'Editar Moneda',
  'currencies.modal.delete_title': 'Eliminar Moneda',
  'currencies.modal.delete_confirm':
    '¿Estás seguro de que deseas eliminar la moneda "{name}"? Esta acción no se puede deshacer.',

  // Panel de detalle
  'currencies.detail.title': 'Detalles de Moneda',
  'currencies.detail.last_update': 'Última actualización:',
  'currencies.detail.no_update': 'Sin actualización',
  'currencies.detail.warning':
    'Esta es la moneda base del sistema. Algunos campos no pueden modificarse.',

  // Advertencias
  'currencies.warning.base_currency':
    'Esta es la moneda base del sistema. Algunos campos no pueden modificarse.',

  // Estados vacíos
  'currencies.empty.message': 'No hay monedas configuradas',
  'currencies.empty.search': 'No se encontraron monedas con ese criterio',

  // Errores
  'currencies.error.title': 'Error',
  'currencies.error.load': 'Error al cargar las monedas',
  'currencies.error.save': 'Error al guardar la moneda',
  'currencies.error.delete': 'Error al eliminar la moneda',
  'currencies.error.generic': 'Ha ocurrido un error inesperado',

  // Resultados
  'currencies.results': 'Mostrando {count} de {total} resultados',

  // Menú de navegación
  'nav.financial_config': 'Config. Financiera',
  'nav.currencies': 'Monedas',
  'nav.payment_methods': 'Métodos de Pago',
}

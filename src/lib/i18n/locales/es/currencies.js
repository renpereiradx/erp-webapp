/**
 * Traducciones de Monedas (Currencies) en español
 * Módulo: Configuración Financiera > Monedas
 */

export const currencies = {
  // Títulos y subtítulos
  'currencies.page.title': 'Configuración de Moneda y Pagos',
  'currencies.page.subtitle':
    'Administre monedas activas, configure tasas de cambio contra su moneda base y controle las pasarelas de pago.',

  // Acciones
  'currencies.action.create': 'Agregar Nueva Moneda',
  'currencies.action.edit': 'Editar Moneda',
  'currencies.action.delete': 'Eliminar Moneda',
  'currencies.action.export': 'Exportar',
  'currencies.action.refresh': 'Actualizar Datos',

  // Búsqueda y filtros
  'currencies.search.placeholder': 'Buscar por código ISO o nombre...',
  'currencies.search.label': 'Buscar monedas',
  'currencies.filter.all': 'Todas',
  'currencies.filter.enabled': 'Habilitadas',
  'currencies.filter.disabled': 'Deshabilitadas',

  // Tabla
  'currencies.table.code': 'CÓDIGO ISO',
  'currencies.table.name': 'NOMBRE',
  'currencies.table.symbol': 'SÍMBOLO',
  'currencies.table.status': 'ESTADO',
  'currencies.table.actions': 'ACCIONES',
  'currencies.table.exchange_rate': 'TASA DE CAMBIO',
  'currencies.table.last_updated': 'ÚLT. ACTUALIZACIÓN',

  // Estados
  'currencies.status.enabled': 'Habilitada',
  'currencies.status.disabled': 'Deshabilitada',
  'currencies.status.active': 'Activo',
  'currencies.status.inactive': 'Inactivo',
  'currencies.badge.base': 'BASE',

  // Widget de moneda base
  'currencies.widget.base_currency': 'MONEDA BASE',
  'currencies.widget.change': 'Cambiar',

  // Tabs
  'currencies.tabs.currencies': 'Monedas',
  'currencies.tabs.payment_methods': 'Métodos de Pago',
  'currencies.tabs.settings': 'Configuración',

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

  // Métodos de Pago Tab
  'currencies.payment_methods.table.type': 'TIPO',
  'currencies.payment_methods.type.simple': 'Simple',
  'currencies.payment_methods.type.complex': 'Complejo (Info extra)',
  'currencies.payment_methods.action.edit_disabled': 'Edición deshabilitada',

  // Configuración Tab
  'currencies.settings.general.title': 'Configuración General',
  'currencies.settings.general.description': 'Opciones generales para la gestión de pagos y monedas.',
  'currencies.settings.field.number_format': 'Formato de números',
  'currencies.settings.field.number_format.es_py': 'Español (Paraguay) - 1.234.567',
  'currencies.settings.field.number_format.en_us': 'Inglés (US) - 1,234,567.00',
  'currencies.settings.hint.number_format': 'El formato visual de los montos en la aplicación.',
  'currencies.settings.field.show_symbols': 'Mostrar símbolos de moneda',
  'currencies.settings.field.auto_update': 'Actualización automática de tasas (Próximamente)',
}

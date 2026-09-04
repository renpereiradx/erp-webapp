/**
 * Traducciones de Categorías en español
 * Módulo: Logística e Inventario > Categorías
 */

export const categories = {
  'categories.title': 'Categorías',
  'categories.subtitle': 'Administra las categorías de productos',

  'categories.page.title': 'Categorías e Impuestos',
  'categories.page.subtitle': 'Organiza el catálogo y su configuración fiscal',
  'categories.search.placeholder': 'Buscar categorías...',
  'categories.count': '{count} categorías',
  'categories.welcome_title': 'Sin categoría seleccionada',
  'categories.welcome_description':
    'Selecciona una categoría del árbol para editar su detalle y clasificación fiscal, o crea una nueva.',

  'categories.management.title': 'Gestión de Categorías',
  'categories.management.subtitle': 'Crea, edita y elimina categorías de productos',
  'categories.management.new': 'Nueva Categoría',
  'categories.management.search.placeholder': 'Buscar categoría...',
  'categories.management.empty': 'No se encontraron categorías',

  'categories.section.title': 'Categorías de Producto',

  'categories.drawer.new_title': 'Nueva Categoría',
  'categories.drawer.edit_title': 'Editar Categoría',

  'categories.field.name': 'Nombre',
  'categories.field.name.placeholder': 'Ej: Electrónicos',
  'categories.field.name.required': 'El nombre es requerido',
  'categories.field.description': 'Descripción',
  'categories.field.description.placeholder': 'Breve descripción...',
  'categories.field.tax_rate': 'Tasa de IVA por Defecto',
  'categories.field.tax_rate.placeholder': 'Seleccionar tasa...',
  'categories.field.parent': 'Categoría Padre',
  'categories.field.parent.none': 'Ninguna (Raíz)',
  'categories.field.parent.none_short': 'Ninguna',
  'categories.field.is_active': 'Categoría Activa',

  'categories.tax_rate.general': 'General (10%)',
  'categories.tax_rate.id': 'ID: {id}',

  'categories.table.name': 'Nombre',
  'categories.table.description': 'Descripción',
  'categories.table.tax_rate': 'IVA Defecto',
  'categories.table.status': 'Estado',
  'categories.table.actions': 'Acciones',

  'categories.status.active': 'Activo',
  'categories.status.inactive': 'Inactivo',

  'categories.action.save': 'Guardar Categoría',
  'categories.action.cancel': 'Cancelar',
  'categories.action.edit': 'Editar {name}',
  'categories.action.delete': 'Eliminar {name}',

  'categories.delete.title': 'Eliminar categoría',
  'categories.delete.description': '¿Estás seguro de que quieres eliminar la categoría "{name}"? Esta acción no se puede deshacer.',
  'categories.delete.confirm': 'Eliminar',
  'categories.delete.deleting': 'Eliminando...',

  'categories.toast.created': 'Categoría creada correctamente',
  'categories.toast.updated': 'Categoría actualizada correctamente',
  'categories.toast.deleted': 'Categoría eliminada correctamente',
  'categories.toast.create_error': 'Error al guardar la categoría',
  'categories.toast.delete_error': 'Error al eliminar la categoría',
  'categories.toast.load_error': 'Error al cargar las categorías',

  'products.modal.category.manage': 'Gestionar categorías…',

  // Árbol de categorías (página dedicada)
  'categories.tree.title': 'Árbol de Categorías',
  'categories.tree.add': 'Nueva categoría',
  'categories.tree.empty': 'No hay categorías',
  'categories.tree.empty_description': 'Crea la primera categoría del catálogo.',

  // Formulario de detalle (página dedicada)
  'categories.form.editing': 'Editando Categoría',
  'categories.form.creating': 'Nueva Categoría',
  'categories.form.select_empty_title': 'Sin categoría seleccionada',
  'categories.form.select_empty': 'Selecciona una categoría del árbol o crea una nueva',
  'categories.form.name_placeholder': 'Ej. Deportivo',
  'categories.form.description_placeholder': 'Descripción de la categoría',
  'categories.form.tax_none': 'Sin asignar',
  'categories.form.delete': 'Eliminar',
  'categories.form.save': 'Guardar Cambios',

  // Panel de tasas de IVA y clasificación SIFEN
  'categories.tax.title': 'Tasas de IVA y Clasificación SIFEN',
  'categories.tax.subtitle': 'Administra los impuestos y su relación con facturación electrónica.',
  'categories.tax.config_title': 'Configuración Fiscal: {name}',
  'categories.tax.badge_classified': 'SIFEN: {code}',
  'categories.tax.badge_checking': 'Verificando...',
  'categories.tax.badge_unclassified': 'Sin Clasificación',
  'categories.tax.default_rate': 'Tasa Default: {rate}%',
  'categories.tax.no_rate': 'Sin Tasa',
  'categories.tax.select_label': 'Clasificación SIFEN para Productos',
  'categories.tax.select_placeholder': 'Seleccionar clasificación...',
  'categories.tax.action_update': 'Actualizar Clasificación',
  'categories.tax.action_apply': 'Auto-Clasificar Productos',
  'categories.tax.applied_note':
    'Esta categoría ya tiene aplicada la clasificación {code}. Puedes volver a clasificar si añadiste nuevos productos sin asignar o si deseas cambiar el código impositivo para todo el grupo.',
  'categories.tax.pending_note':
    'La auto-clasificación aplicará masivamente el código SIFEN y la tasa impositiva correspondiente a todos los productos actuales de la categoría {name}.',
  'categories.tax.empty_no_category': 'Sin categoría seleccionada',
  'categories.tax.empty_no_category_desc':
    'Selecciona una categoría del árbol para gestionar su clasificación fiscal SIFEN y aplicar tasas de IVA a sus productos.',
  'categories.tax.rates_title': 'Tasas Registradas en el Sistema',
  'categories.tax.table.code': 'Código SIFEN',
  'categories.tax.table.name': 'Nombre del Impuesto',
  'categories.tax.table.rate': 'Tasa',
  'categories.tax.table.status': 'Estado',
  'categories.tax.table.empty': 'No hay tasas de IVA configuradas.',
  'categories.tax.table.empty_description':
    'Las tasas de IVA se registran desde la configuración financiera.',
  'categories.tax.badge_default_cat': 'Default Cat.',
  'categories.tax.status_exempt': 'Exento',
  'categories.tax.status_taxed': 'Gravado',
  'categories.tax.sync_title': 'Sincronización Automática SIFEN',
  'categories.tax.sync_desc':
    'Las tasas de IVA configuradas en este panel se mapearán automáticamente a los códigos oficiales de la SET al emitir Documentos Electrónicos (KUDE). Asegúrate de que los porcentajes coincidan con las normativas vigentes.',
  'categories.tax.confirm.title': 'Confirmar Auto-Clasificación',
  'categories.tax.confirm.body':
    '¿Deseas aplicar la clasificación fiscal {code} a todos los productos de la categoría {name}?',
  'categories.tax.confirm.warning':
    'Esta operación actualizará la clasificación SIFEN y la tasa impositiva de manera irreversible para los productos bajo esta categoría.',
  'categories.tax.confirm.apply': 'Confirmar y Aplicar',
  'categories.tax.toast.applied':
    'Clasificación {code} aplicada con éxito a {count} productos.',
  'categories.tax.toast.executed': 'Clasificación {code} ejecutada para la categoría.',
  'categories.tax.toast.apply_error': 'Error al aplicar clasificación fiscal a la categoría',
  'categories.tax.toast.load_codes_error': 'Error al cargar códigos SIFEN',

  // Gestor de atributos por categoría (drawer / modal)
  'categories.attributesPanel.title': 'Atributos de la Categoría',
  'categories.attributesPanel.subtitle':
    'Estos atributos se aplicarán a todos los productos de esta categoría.',
  'categories.attributesPanel.empty': 'No hay atributos definidos para esta categoría',
  'categories.attributesPanel.new_title': 'Nuevo Atributo',
  'categories.attributesPanel.name_placeholder': 'Nombre (ej. Talla)',
  'categories.attributesPanel.code_placeholder': 'Código (ej. talla)',
  'categories.attributesPanel.options_placeholder': 'Opciones (ej. S, M, L)',
  'categories.attributesPanel.options_label': 'Opciones:',
  'categories.attributesPanel.code_label': 'Código:',
  'categories.attributesPanel.variant': 'Variante',
  'categories.attributesPanel.variant_hint': 'Usar para generar variantes (ej. Talla, Color)',
  'categories.attributesPanel.create': 'Crear Atributo',
  'categories.attributesPanel.data_type.STRING': 'Texto Corto (String)',
  'categories.attributesPanel.data_type.NUMBER': 'Número',
  'categories.attributesPanel.data_type.BOOLEAN': 'Si/No (Booleano)',
  'categories.attributesPanel.data_type.DATE': 'Fecha',
  'categories.attributesPanel.data_type.LIST': 'Lista (Una opción)',
  'categories.attributesPanel.data_type.MULTI_SELECT': 'Multi Selección',
  'categories.attributesPanel.delete.title': 'Eliminar atributo de la categoría',
  'categories.attributesPanel.delete.description':
    '¿Estás seguro de eliminar el atributo "{name}"? Afectará a todos los productos de esta categoría.',
  'categories.attributesPanel.toast.load_error': 'Error al cargar los atributos de la categoría',
  'categories.attributesPanel.toast.name_code_required': 'Nombre y código son requeridos',
  'categories.attributesPanel.toast.options_required': 'Debe proveer opciones separadas por coma',
  'categories.attributesPanel.toast.created': 'Atributo creado exitosamente',
  'categories.attributesPanel.toast.deleted': 'Atributo eliminado',
  'categories.attributesPanel.toast.create_error': 'Error al crear atributo',
  'categories.attributesPanel.toast.delete_error': 'Error al eliminar atributo',
}

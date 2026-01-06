/**
 * Traducciones de clientes en español
 * Módulo: Gestión de clientes, CRM, contactos
 */

export const clients = {
  // Títulos y navegación
  'clients.title': 'Clientes',
  'clients.subtitle': 'Administra, filtra y visualiza todos los clientes del sistema.',
  'clients.loading': 'Cargando clientes...',
  'clients.action.primary': 'Nuevo Cliente',
  'clients.action.create': 'Nuevo Cliente',

  // Búsqueda y filtros
  'clients.search': 'Buscar',
  'clients.search.db': 'Buscar en Base de Datos',
  'clients.search.label': 'Buscar clientes',
  'clients.search.placeholder': 'Buscar por nombre, documento o ID...',
  'clients.clear': 'Limpiar',
  'clients.filter.current_results_title': 'Filtrar Resultados Actuales',
  'clients.filter.name_placeholder': 'Filtrar por nombre...',
  'clients.filter.all_status': 'Todos los estados',
  'clients.filter.status.active': 'Activos',
  'clients.filter.status.inactive': 'Inactivos',

  // Paginación
  'clients.page_size_label': 'Clientes por página:',
  'clients.pagination.showing_page_count': 'Mostrando {shown} de {total} clientes',
  'clients.pagination.first': 'Primera',
  'clients.pagination.prev': 'Anterior',
  'clients.pagination.next': 'Siguiente',
  'clients.pagination.last': 'Última',
  'clients.pagination.page_of': 'Página {page} de {totalPages}',

  // Tabla
  'clients.table.name': 'NOMBRE DEL CLIENTE',
  'clients.table.document': 'DOCUMENTO',
  'clients.table.contact': 'CONTACTO',
  'clients.table.status': 'ESTADO',

  // Estados
  'clients.status.active': 'Activo',
  'clients.status.inactive': 'Inactivo',

  // Mensajes vacíos
  'clients.empty.title': 'Buscar Clientes',
  'clients.empty.message': 'Usa la barra de búsqueda para encontrar clientes por nombre o documento',
  'clients.search.no_results': 'Sin resultados',
  'clients.search.no_results_message': 'No se encontraron clientes con ese criterio de búsqueda',

  // Errores
  'clients.error.title': 'Error al cargar clientes',
  'clients.error.generic': 'Error al procesar la solicitud. Por favor, intente nuevamente.',

  // Modales
  'client.modal.edit': 'EDITAR CLIENTE',
  'client.modal.create': 'CREAR CLIENTE',
  'client.modal.edit_subtitle': 'Modifica la información del cliente',
  'client.modal.create_subtitle': 'Ingresa los datos del nuevo cliente',
  'clients.modal.title.details': 'Detalles del Cliente',
  'clients.modal.title.create': 'Nuevo Cliente',
  'clients.modal.title.edit': 'Editar Cliente',
  'clients.modal.field.id': 'ID',
  'clients.modal.field.status': 'Estado',
  'clients.modal.field.created_by': 'Creado Por (ID Usuario)',
  'clients.modal.field.created_at': 'Fecha de Creación',

  'clients.modal.field.name': 'Nombre',
  'clients.modal.field.last_name': 'Apellido',
  'clients.modal.field.document': 'Documento de Identidad',
  'clients.modal.field.contact': 'Contacto',
  'clients.modal.placeholder.name': 'Ingrese el nombre',
  'clients.modal.placeholder.last_name': 'Ingrese el apellido',
  'clients.modal.placeholder.document': 'CI, RUC, etc.',
  'clients.modal.placeholder.contact': 'Teléfono, email, etc.',
  'clients.modal.hint.contact': 'Opcional. Puede incluir teléfono, email o cualquier información de contacto.',
  'clients.modal.error.name_required': 'El nombre es requerido',
  'clients.modal.error.last_name_required': 'El apellido es requerido',
  'clients.modal.error.document_required': 'El documento es requerido',
  'clients.modal.error.generic': 'Error al guardar el cliente',

  // Eliminar cliente
  'clients.confirm_delete': '¿Está seguro de eliminar este cliente?',
  'client.delete.title': 'Eliminar Cliente',
  'client.delete.message': 'Esta acción eliminará permanentemente al cliente "{name}" y no se puede deshacer.',
  'client.delete.confirm': 'Eliminar Cliente',

  // Tarjetas de información
  'clients.card.document': 'DOCUMENTO:',
  'clients.card.contact': 'CONTACTO:',
  'clients.card.registered': 'REGISTRO:',

  // Estadísticas
  'clients.stats.shown': 'CLIENTES MOSTRADOS',
}

/**
 * Traducciones comunes en español
 * Incluye: validaciones, acciones, campos, estados, errores generales
 */

export const common = {
  // Validaciones
  'validation.required': 'Requerido',
  'validation.price.invalid': 'Precio inválido',
  'validation.price.invalid.short': 'Inválido',
  'validation.stock.invalid': 'Stock inválido',
  'validation.stock.invalid.short': 'Inválido',

  // Campos comunes
  'field.name': 'Nombre',
  'field.price': 'Precio',
  'field.unit_price': 'Precio/Unidad:',
  'field.stock': 'Stock',
  'field.no_name': 'Sin nombre',
  'field.code': 'Código',
  'field.id': 'ID',
  'field.category': 'Categoría',

  // Acciones comunes
  'action.view': 'Ver',
  'action.edit': 'Editar',
  'action.delete': 'Eliminar',
  'action.save': 'Guardar',
  'action.cancel': 'Cancelar',
  'action.confirm': 'Confirmar',
  'action.close': 'Cerrar',
  'action.search': 'Buscar',
  'action.clear': 'Limpiar',
  'action.filter': 'Filtrar',
  'action.export': 'Exportar',
  'action.import': 'Importar',
  'action.print': 'Imprimir',
  'action.email': 'Enviar por Email',
  'action.download': 'Descargar',
  'action.upload': 'Subir',
  'action.refresh': 'Actualizar',
  'action.back': 'Volver',
  'action.next': 'Siguiente',
  'action.previous': 'Anterior',
  'action.submit': 'Enviar',
  'action.reset': 'Restablecer',
  'action.inline': 'Inline',
  'action.create': 'Crear',
  'action.update': 'Actualizar',
  'action.saving': 'Guardando...',
  'action.deleting': 'Eliminando...',
  'action.more': 'Más opciones',
  'action.retry': 'Reintentar',
  'action.select_all': 'Seleccionar todos',
  'action.select_item': 'Seleccionar item',
  'action.delete_product': 'Eliminar producto',
  'action.open_menu': 'Abrir menú de acciones',
  'action.logout': 'Cerrar Sesión',

  // Modales
  'modal.cancel': 'Cancelar',
  'modal.processing': 'Procesando...',

  // Estados comunes
  'status.active': 'Activo',
  'status.inactive': 'Inactivo',
  'status.pending': 'Pendiente',
  'status.completed': 'Completado',
  'status.cancelled': 'Cancelado',
  'status.draft': 'Borrador',
  'status.published': 'Publicado',

  // Mensajes comunes
  'common.home': 'Inicio',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.optional': 'Opcional',
  'common.loading': 'Cargando...',
  'common.saving': 'Guardando...',
  'common.searching': 'Buscando...',
  'common.no_results': 'No se encontraron resultados',
  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.warning': 'Advertencia',
  'common.info': 'Información',
  'common.all': 'Todos',
  'common.none': 'Ninguno',
  'common.select': 'Seleccionar',
  'common.selected': 'Seleccionado',
  'common.total': 'Total',
  'common.subtotal': 'Subtotal',
  'common.user': 'Usuario',
  'common.normal': 'Normal',
  'common.payments': 'Pagos',
  'common.financeConfig': 'Configuración Financiera',

  // Filtros
  'common.filters': 'Filtros',
  'common.apply': 'Aplicar',
  'common.clear': 'Limpiar',
  'common.processing': 'Procesando...',

  // Badges
  'badge.low_stock': 'Bajo stock',
  'badge.low_stock.upper': 'BAJO STOCK',
  'badge.new': 'Nuevo',
  'badge.popular': 'Popular',
  'badge.sale': 'Oferta',

  // Hints de error (mensajes técnicos)
  'errors.hint.INTERNAL': 'Error interno del servidor, intenta más tarde.',
  'errors.hint.NETWORK': 'Revisa tu conexión a internet.',
  'errors.hint.UNAUTHORIZED':
    'Por favor inicia sesión nuevamente para continuar.',
  'errors.hint.NOT_FOUND': 'El recurso no existe o fue eliminado.',
  'errors.hint.VALIDATION': 'Por favor corrige los errores en el formulario.',
  'errors.hint.TIMEOUT': 'La solicitud tardó demasiado tiempo.',

  // Acciones adicionales
  'common.action.view_detail': 'Ver Detalle',
  'common.action.clear_filters': 'Limpiar Filtros',
  'common.action.apply_filters': 'Aplicar Filtros',

  // Paginación
  'common.pagination.previous': 'Anterior',
  'common.pagination.next': 'Siguiente',
  'common.pagination.showing': 'Mostrando',
  'common.pagination.of': 'de',

  // Settings - Atajos de teclado
  'settings.title': 'Configuración',
  'settings.subtitle': 'Personaliza tu experiencia en la aplicación',
  'settings.theme.title': 'Tema de Apariencia',
  'settings.theme.description': 'Selecciona entre modo claro u oscuro.',
  'settings.theme.light': 'Claro',
  'settings.theme.dark': 'Oscuro',
  'settings.language.title': 'Idioma',
  'settings.language.description': 'Selecciona el idioma de la interfaz.',
  'settings.language.coming_soon': 'Próximamente: Opciones de idioma.',
  'settings.notifications.title': 'Notificaciones',
  'settings.notifications.description':
    'Gestiona tus preferencias de notificaciones.',
  'settings.notifications.coming_soon':
    'Próximamente: Ajustes de notificaciones.',
  'settings.shortcuts.title': 'Atajos de Teclado',
  'settings.shortcuts.description':
    'Personaliza los atajos de teclado para navegar más rápido.',
  'settings.shortcuts.reset_all': 'Restaurar todos',
  'settings.shortcuts.reset': 'Restaurar',
  'settings.shortcuts.press_keys': 'Presiona las teclas...',
  'settings.shortcuts.hint':
    'Haz clic en el icono de editar y presiona la combinación de teclas deseada.',
  'settings.shortcuts.category.purchases': 'Compras',
  'settings.shortcuts.category.sales': 'Ventas',
  'settings.shortcuts.category.general': 'General',
  'settings.shortcuts.purchases.add_product': 'Agregar producto (Ctrl+A)',
  'settings.shortcuts.purchases.process': 'Guardar compra (Ctrl+G)',
  'settings.shortcuts.purchases.history': 'Ver historial (Ctrl+Shift+H)',
  'settings.shortcuts.sales.add_product': 'Agregar producto (Ctrl+A)',
  'settings.shortcuts.sales.process': 'Guardar venta (Ctrl+G)',
  'settings.shortcuts.sales.history': 'Ver historial (Ctrl+Shift+H)',
  'settings.shortcuts.general.close_modal': 'Cerrar modal',
  'settings.shortcuts.general.save': 'Guardar',
}

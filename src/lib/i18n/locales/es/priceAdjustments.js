/**
 * Traducciones de ajustes de precios en español
 * Módulo: Gestión de ajustes de precios, historial, plantillas de razones
 */

export const priceAdjustments = {
  // Títulos y acciones principales
  'priceAdjustment.title': 'Ajustes de Precios',
  'priceAdjustment.action.create': 'Crear Ajuste',
  'priceAdjustment.action.creating': 'Creando...',
  'priceAdjustment.action.viewHistory': 'Ver Historial',

  // Estados
  'priceAdjustment.empty.title': 'Sin ajustes de precios',
  'priceAdjustment.empty.message': 'No hay ajustes de precios registrados',
  'priceAdjustment.error.title': 'Error al cargar ajustes',
  'priceAdjustment.error.noProduct': 'Seleccione un producto',

  // Modales
  'priceAdjustment.modal.create': 'CREAR AJUSTE DE PRECIO',
  'priceAdjustment.modal.history': 'HISTORIAL DE AJUSTES',

  // Búsqueda
  'priceAdjustment.search.placeholder':
    'Buscar por producto, razón o usuario...',

  // Campos del formulario
  'priceAdjustment.field.product': 'PRODUCTO',
  'priceAdjustment.field.product.placeholder':
    'Buscar producto por ID, nombre o código...',
  'priceAdjustment.field.newPrice': 'NUEVO PRECIO',
  'priceAdjustment.field.unit': 'UNIDAD',
  'priceAdjustment.field.reason': 'RAZÓN DEL AJUSTE',
  'priceAdjustment.field.reason.placeholder':
    'Explique la razón del ajuste de precio...',

  // Layout - Tabs
  'priceAdjustment.layout.title': 'Gestión de Ajustes de Precios',
  'priceAdjustment.layout.description':
    'Administra los precios de tus productos y consulta el historial de cambios',
  'priceAdjustment.tabs.newAdjustment': 'Nuevo Ajuste',
  'priceAdjustment.tabs.history': 'Historial Global',

  // Nuevo Ajuste - Búsqueda y selección de productos
  'priceAdjustmentNew.title': 'Búsqueda y Selección de Productos',
  'priceAdjustmentNew.search.placeholder':
    'Buscar por nombre o ID de producto...',
  'priceAdjustmentNew.search.hint': 'Escribe al menos 4 caracteres para buscar',
  'priceAdjustmentNew.loading': 'Cargando productos...',
  'priceAdjustmentNew.action.retry': 'Reintentar',
  'priceAdjustmentNew.table.name': 'Nombre del Producto',
  'priceAdjustmentNew.table.id': 'ID del Producto',
  'priceAdjustmentNew.table.price': 'Precio Actual',
  'priceAdjustmentNew.table.actions': 'Acción',
  'priceAdjustmentNew.action.select': 'Seleccionar',
  'priceAdjustmentNew.pagination.showing': 'Mostrando',
  'priceAdjustmentNew.pagination.to': 'a',
  'priceAdjustmentNew.pagination.of': 'de',
  'priceAdjustmentNew.pagination.results': 'resultados',
  'priceAdjustmentNew.pagination.previous': 'Anterior',
  'priceAdjustmentNew.pagination.next': 'Siguiente',
  'priceAdjustmentNew.empty.title': 'Sin resultados',
  'priceAdjustmentNew.empty.message': 'No se encontraron productos',
  'priceAdjustmentNew.error.title': 'Error al cargar productos',

  // Detalle - Ajuste de precio para un producto
  'priceAdjustmentDetail.title': 'Ajuste de Precio para',
  'priceAdjustmentDetail.currentPrice': 'Precio Actual',
  'priceAdjustmentDetail.formTitle': 'Registrar Nuevo Ajuste',
  'priceAdjustmentDetail.field.newPrice': 'Nuevo Precio ($)',
  'priceAdjustmentDetail.field.newPrice.placeholder': 'ej., 21.50',
  'priceAdjustmentDetail.field.unit': 'Unidad de Medida',
  'priceAdjustmentDetail.field.reasonTemplate': 'Plantilla de Razón',
  'priceAdjustmentDetail.field.reason': 'Razón del Ajuste',
  'priceAdjustmentDetail.field.reason.placeholder':
    'Escriba la razón personalizada del ajuste de precio...',
  'priceAdjustmentDetail.field.reason.hintCustom': '(Personalizada)',
  'priceAdjustmentDetail.field.reason.hintAuto': '(Generada automáticamente)',
  'priceAdjustmentDetail.field.reason.characters': 'caracteres',
  'priceAdjustmentDetail.field.reason.selectTemplate':
    'Seleccione una plantilla arriba para generar la razón automáticamente',
  'priceAdjustmentDetail.field.metadata': 'Metadata Adicional (JSON)',
  'priceAdjustmentDetail.unit.unit': 'unidad',
  'priceAdjustmentDetail.unit.kg': 'kg',
  'priceAdjustmentDetail.unit.meter': 'metro',
  'priceAdjustmentDetail.unit.pack': 'paquete',
  'priceAdjustmentDetail.action.submit': 'Registrar Cambio',
  'priceAdjustmentDetail.action.saving': 'Guardando...',
  'priceAdjustmentDetail.error.price': 'Precio inválido',
  'priceAdjustmentDetail.error.reason': 'Mínimo 10 caracteres requeridos',
  'priceAdjustmentDetail.error.metadata': 'JSON inválido',
  'priceAdjustmentDetail.historyTitle': 'Historial de Ajustes',
  'priceAdjustmentDetail.table.date': 'Fecha',
  'priceAdjustmentDetail.table.oldPrice': 'Precio Anterior',
  'priceAdjustmentDetail.table.newPrice': 'Nuevo Precio',
  'priceAdjustmentDetail.table.change': 'Cambio',
  'priceAdjustmentDetail.table.reason': 'Razón',
  'priceAdjustmentDetail.table.user': 'Usuario',
  'priceAdjustmentDetail.table.actions': 'Acciones',
  'priceAdjustmentDetail.action.viewDetails': 'Ver Detalles',
  'priceAdjustmentDetail.history.empty':
    'No hay historial de ajustes disponible',

  // Plantillas de razón
  'priceAdjustmentDetail.reasonTemplate.select': 'Seleccionar plantilla...',
  'priceAdjustmentDetail.reasonTemplate.market':
    'Ajuste por condiciones del mercado',
  'priceAdjustmentDetail.reasonTemplate.costIncrease':
    'Aumento de costos de proveedor',
  'priceAdjustmentDetail.reasonTemplate.costDecrease':
    'Reducción de costos de proveedor',
  'priceAdjustmentDetail.reasonTemplate.promotional':
    'Precio promocional temporal',
  'priceAdjustmentDetail.reasonTemplate.competitive': 'Ajuste por competencia',
  'priceAdjustmentDetail.reasonTemplate.clearance': 'Liquidación de inventario',
  'priceAdjustmentDetail.reasonTemplate.quality':
    'Ajuste por calidad del producto',
  'priceAdjustmentDetail.reasonTemplate.seasonal': 'Ajuste estacional',
  'priceAdjustmentDetail.reasonTemplate.bulk': 'Descuento por volumen',
  'priceAdjustmentDetail.reasonTemplate.error': 'Corrección de error previo',
  'priceAdjustmentDetail.reasonTemplate.management': 'Decisión gerencial',
  'priceAdjustmentDetail.reasonTemplate.supplier':
    'Renegociación con proveedor',
  'priceAdjustmentDetail.reasonTemplate.currency': 'Fluctuación cambiaria',
  'priceAdjustmentDetail.reasonTemplate.initial': 'Carga inicial de inventario',
  'priceAdjustmentDetail.reasonTemplate.custom': 'Razón personalizada...',

  // Textos de razón auto-generados
  'priceAdjustmentDetail.reasonText.market':
    'Ajuste de precio por condiciones actuales del mercado',
  'priceAdjustmentDetail.reasonText.costIncrease':
    'Aumento de precio debido al incremento en costos de proveedor',
  'priceAdjustmentDetail.reasonText.costDecrease':
    'Reducción de precio por disminución en costos de proveedor',
  'priceAdjustmentDetail.reasonText.promotional':
    'Precio promocional temporal para impulsar ventas',
  'priceAdjustmentDetail.reasonText.competitive':
    'Ajuste de precio para mantener competitividad en el mercado',
  'priceAdjustmentDetail.reasonText.clearance':
    'Precio reducido para liquidación de inventario',
  'priceAdjustmentDetail.reasonText.quality':
    'Ajuste de precio por cambios en la calidad del producto',
  'priceAdjustmentDetail.reasonText.seasonal':
    'Ajuste estacional por demanda del período',
  'priceAdjustmentDetail.reasonText.bulk':
    'Descuento aplicado por compra en volumen',
  'priceAdjustmentDetail.reasonText.error':
    'Corrección de error en precio anterior',
  'priceAdjustmentDetail.reasonText.management':
    'Ajuste autorizado por decisión gerencial',
  'priceAdjustmentDetail.reasonText.supplier':
    'Nuevo precio por renegociación con proveedor',
  'priceAdjustmentDetail.reasonText.currency':
    'Ajuste por fluctuaciones en tipo de cambio',
  'priceAdjustmentDetail.reasonText.initial':
    'Declaración de precio inicial para carga de inventario',

  // Historial Global
  'priceAdjustmentHistory.title': 'Historial de Ajustes Manuales',
  'priceAdjustmentHistory.description':
    'Consulta todos los ajustes de precios recientes aplicados a los productos.',
  'priceAdjustmentHistory.actions.refresh': 'Actualizar',
  'priceAdjustmentHistory.actions.export': 'Exportar',
  'priceAdjustmentHistory.filters.title': 'Filtros de Búsqueda',
  'priceAdjustmentHistory.filters.product': 'Producto',
  'priceAdjustmentHistory.filters.productPlaceholder':
    'Buscar por nombre o SKU',
  'priceAdjustmentHistory.filters.user': 'Usuario',
  'priceAdjustmentHistory.filters.userPlaceholder': 'Buscar por nombre o ID',
  'priceAdjustmentHistory.filters.unit': 'Unidad',
  'priceAdjustmentHistory.filters.unitPlaceholder': 'Seleccionar unidad',
  'priceAdjustmentHistory.filters.adjustmentType': 'Tipo de Ajuste',
  'priceAdjustmentHistory.filters.adjustmentTypePlaceholder':
    'Seleccionar tipo',
  'priceAdjustmentHistory.filters.dateRange': 'Rango de Fechas',
  'priceAdjustmentHistory.filters.dateFromPlaceholder': 'Fecha de inicio',
  'priceAdjustmentHistory.filters.dateToPlaceholder': 'Fecha de fin',
  'priceAdjustmentHistory.filters.clear': 'Limpiar Filtros',
  'priceAdjustmentHistory.filters.apply': 'Aplicar Filtros',
  'priceAdjustmentHistory.results.showing': 'Mostrando',
  'priceAdjustmentHistory.results.to': 'a',
  'priceAdjustmentHistory.results.of': 'de',
  'priceAdjustmentHistory.results.results': 'resultados',
  'priceAdjustmentHistory.table.adjustmentId': 'ID Ajuste',
  'priceAdjustmentHistory.table.product': 'Producto',
  'priceAdjustmentHistory.table.oldPrice': 'Precio Anterior',
  'priceAdjustmentHistory.table.newPrice': 'Precio Nuevo',
  'priceAdjustmentHistory.table.user': 'Usuario',
  'priceAdjustmentHistory.table.dateTime': 'Fecha/Hora',
  'priceAdjustmentHistory.table.unit': 'Unidad',
  'priceAdjustmentHistory.table.type': 'Tipo',
  'priceAdjustmentHistory.type.decrease': 'Descuento',
  'priceAdjustmentHistory.type.increase': 'Aumento',
  'priceAdjustmentHistory.type.correction': 'Corrección',
  'priceAdjustmentHistory.pagination.page': 'Página',
  'priceAdjustmentHistory.pagination.of': 'de',
  'priceAdjustmentHistory.pagination.previous': 'Anterior',
  'priceAdjustmentHistory.pagination.next': 'Siguiente',
  'priceAdjustmentHistory.empty.title': 'No se encontraron resultados',
  'priceAdjustmentHistory.empty.description':
    'Prueba a cambiar o eliminar algunos filtros para encontrar lo que buscas.',
  'priceAdjustmentHistory.error.title': 'Error al cargar historial',
  'priceAdjustmentHistory.error.loading':
    'No se pudo cargar el historial de ajustes',
}

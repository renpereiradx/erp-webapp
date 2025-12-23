/**
 * Traducciones en Español - Gestión de Inventarios (Ajuste Masivo)
 */

export const inventoryManagement = {
  // Page header
  'inventoryManagement.title': 'Gestión de Inventarios',
  'inventoryManagement.subtitle': 'Crea, visualiza e invalida inventarios de stock.',

  // Toolbar
  'inventoryManagement.toolbar.filter': 'Filtrar',
  'inventoryManagement.toolbar.calendar': 'Seleccionar fecha',
  'inventoryManagement.toolbar.download': 'Descargar reporte',
  'inventoryManagement.toolbar.search': 'Buscar por ID, ubicación u operador...',
  'inventoryManagement.toolbar.createNew': 'Crear Nuevo Inventario',

  // Table headers
  'inventoryManagement.table.id': 'ID Inventario',
  'inventoryManagement.table.status': 'Estado',
  'inventoryManagement.table.createdAt': 'Fecha de Creación',
  'inventoryManagement.table.location': 'Ubicación',
  'inventoryManagement.table.operator': 'Operador',
  'inventoryManagement.table.origin': 'Origen',
  'inventoryManagement.table.actions': 'Acciones',

  // Table states
  'inventoryManagement.table.loading': 'Cargando inventarios...',
  'inventoryManagement.table.noData': 'No hay inventarios registrados',
  'inventoryManagement.table.noResults': 'No se encontraron resultados para tu búsqueda',

  // Actions
  'inventoryManagement.actions.menu': 'Menú de acciones',
  'inventoryManagement.actions.view': 'Ver',
  'inventoryManagement.actions.edit': 'Editar',
  'inventoryManagement.actions.delete': 'Eliminar',

  // Pagination
  'inventoryManagement.pagination.showing': 'Mostrando {{start}} - {{end}} de {{total}} registros',
  'inventoryManagement.pagination.page': 'Página {{current}} de {{total}}',

  // Delete Confirmation Modal
  'inventoryManagement.deleteModal.title': 'Confirmar Eliminación',
  'inventoryManagement.deleteModal.message': '¿Estás seguro de que deseas invalidar este inventario? Esta acción revertirá todos los ajustes de stock asociados.',
  'inventoryManagement.deleteModal.inventoryId': 'ID de Inventario',
  'inventoryManagement.deleteModal.cancel': 'Cancelar',
  'inventoryManagement.deleteModal.confirm': 'Invalidar Inventario',

  // View Details Modal
  'inventoryManagement.viewModal.title': 'Detalles del Inventario',
  'inventoryManagement.viewModal.generalInfo': 'Información General',
  'inventoryManagement.viewModal.id': 'ID',
  'inventoryManagement.viewModal.status': 'Estado',
  'inventoryManagement.viewModal.date': 'Fecha de Creación',
  'inventoryManagement.viewModal.location': 'Ubicación',
  'inventoryManagement.viewModal.operator': 'Operador',
  'inventoryManagement.viewModal.origin': 'Origen',
  'inventoryManagement.viewModal.method': 'Método de Conteo',
  'inventoryManagement.viewModal.verification': 'Verificación',
  'inventoryManagement.viewModal.items': 'Productos Inventariados',
  'inventoryManagement.viewModal.product': 'Producto',
  'inventoryManagement.viewModal.previousQuantity': 'Cantidad Anterior',
  'inventoryManagement.viewModal.quantityChecked': 'Cantidad Contada',
  'inventoryManagement.viewModal.difference': 'Diferencia',
  'inventoryManagement.viewModal.close': 'Cerrar',

  // Create Modal
  'inventoryManagement.createModal.title': 'Crear Nuevo Inventario',
  'inventoryManagement.createModal.subtitle': 'Registra un nuevo conteo de inventario',
  'inventoryManagement.createModal.cancel': 'Cancelar',
  'inventoryManagement.createModal.create': 'Crear Inventario',
  'inventoryManagement.createModal.metadata': 'Información del Inventario',
  'inventoryManagement.createModal.operator': 'Operador',
  'inventoryManagement.createModal.operatorPlaceholder': 'Nombre del operador',
  'inventoryManagement.createModal.location': 'Ubicación',
  'inventoryManagement.createModal.locationPlaceholder': 'Ej: Almacén Central',
  'inventoryManagement.createModal.countingMethod': 'Método de Conteo',
  'inventoryManagement.createModal.methodManual': 'Manual',
  'inventoryManagement.createModal.methodScanner': 'Escáner de Códigos',
  'inventoryManagement.createModal.methodRFID': 'RFID',
  'inventoryManagement.createModal.verification': 'Verificación',
  'inventoryManagement.createModal.verificationSingle': 'Conteo Simple',
  'inventoryManagement.createModal.verificationDouble': 'Doble Verificación',
  'inventoryManagement.createModal.notes': 'Notas (opcional)',
  'inventoryManagement.createModal.notesPlaceholder': 'Observaciones adicionales...',
  'inventoryManagement.createModal.products': 'Productos Inventariados',
  'inventoryManagement.createModal.addProduct': 'Agregar Producto',
  'inventoryManagement.createModal.searchProduct': 'Buscar producto por ID, nombre o código de barras...',
  'inventoryManagement.createModal.searchingProducts': 'Buscando productos...',
  'inventoryManagement.createModal.noResultsFound': 'No se encontraron productos',
  'inventoryManagement.createModal.productId': 'ID del Producto',
  'inventoryManagement.createModal.productName': 'Nombre',
  'inventoryManagement.createModal.currentQuantity': 'Cantidad Actual',
  'inventoryManagement.createModal.productIdPlaceholder': 'Ej: PROD_ABC_001',
  'inventoryManagement.createModal.quantityCounted': 'Cantidad Contada',
  'inventoryManagement.createModal.remove': 'Eliminar',
  'inventoryManagement.createModal.noProducts': 'No hay productos agregados. Busca y selecciona productos para comenzar.',
  'inventoryManagement.createModal.validationError': 'Por favor completa todos los campos requeridos',
  'inventoryManagement.createModal.minOneProduct': 'Debe agregar al menos un producto',

  // Filters
  'inventoryManagement.filters.title': 'Filtros',
  'inventoryManagement.filters.dateFrom': 'Fecha Desde',
  'inventoryManagement.filters.dateTo': 'Fecha Hasta',
  'inventoryManagement.filters.status': 'Estado',
  'inventoryManagement.filters.statusAll': 'Todos',
  'inventoryManagement.filters.statusActive': 'Activo',
  'inventoryManagement.filters.statusInvalid': 'Inválido',
  'inventoryManagement.filters.statusReverted': 'Revertido',
  'inventoryManagement.filters.location': 'Ubicación',
  'inventoryManagement.filters.locationPlaceholder': 'Buscar por ubicación...',
  'inventoryManagement.filters.apply': 'Aplicar Filtros',
  'inventoryManagement.filters.clear': 'Limpiar',
}

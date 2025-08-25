/**
 * Internationalization System - Wave 4 UX & Accessibility
 * Sistema de internacionalización con React i18next
 * 
 * @since Wave 4 - UX & Accessibility Enterprise
 * @author Sistema ERP
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Traducciones en español
const esTranslations = {
  common: {
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    search: 'Buscar',
    filter: 'Filtrar',
    reset: 'Restablecer',
    close: 'Cerrar',
    open: 'Abrir',
    yes: 'Sí',
    no: 'No',
    ok: 'Aceptar',
    back: 'Volver',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    required: 'Requerido',
    optional: 'Opcional',
    select: 'Seleccionar',
    none: 'Ninguno',
    all: 'Todos',
    clear: 'Limpiar'
  },
  
  navigation: {
    home: 'Inicio',
    dashboard: 'Panel de Control',
    purchases: 'Compras',
    sales: 'Ventas',
    products: 'Productos',
    suppliers: 'Proveedores',
    reports: 'Reportes',
    settings: 'Configuración',
    profile: 'Perfil',
    logout: 'Cerrar Sesión'
  },
  
  purchases: {
    title: 'Gestión de Compras',
    subtitle: 'Administra las compras de tu empresa',
    create: 'Nueva Compra',
    edit: 'Editar Compra',
    delete: 'Eliminar Compra',
    view: 'Ver Detalles',
    list: 'Lista de Compras',
    search: 'Buscar compras...',
    
    fields: {
      supplier: 'Proveedor',
      date: 'Fecha',
      total: 'Total',
      status: 'Estado',
      description: 'Descripción',
      items: 'Artículos',
      quantity: 'Cantidad',
      price: 'Precio',
      subtotal: 'Subtotal',
      tax: 'Impuesto',
      discount: 'Descuento'
    },
    
    status: {
      pending: 'Pendiente',
      confirmed: 'Confirmada',
      delivered: 'Entregada',
      cancelled: 'Cancelada',
      paid: 'Pagada'
    },
    
    messages: {
      created: 'Compra creada exitosamente',
      updated: 'Compra actualizada exitosamente',
      deleted: 'Compra eliminada exitosamente',
      error: 'Error al procesar la compra',
      notFound: 'Compra no encontrada',
      loading: 'Cargando compras...',
      empty: 'No hay compras registradas',
      deleteConfirm: '¿Estás seguro de que deseas eliminar esta compra?'
    },
    
    filters: {
      title: 'Filtros',
      dateRange: 'Rango de Fechas',
      supplier: 'Proveedor',
      status: 'Estado',
      minAmount: 'Monto Mínimo',
      maxAmount: 'Monto Máximo',
      clear: 'Limpiar Filtros',
      apply: 'Aplicar Filtros'
    }
  },
  
  accessibility: {
    skipToContent: 'Saltar al contenido principal',
    skipToNavigation: 'Saltar a la navegación',
    menuButton: 'Menú de navegación',
    closeMenu: 'Cerrar menú',
    openMenu: 'Abrir menú',
    searchButton: 'Buscar',
    filterButton: 'Filtrar resultados',
    sortButton: 'Ordenar',
    loadingContent: 'Cargando contenido',
    errorMessage: 'Mensaje de error',
    successMessage: 'Mensaje de éxito',
    warningMessage: 'Mensaje de advertencia',
    infoMessage: 'Mensaje informativo',
    
    modals: {
      openModal: 'Abrir modal de {{type}}',
      closeModal: 'Cerrar modal',
      modalTitle: 'Modal de {{type}}',
      confirmDelete: 'Confirmar eliminación',
      modalOpened: 'Modal abierto: {{title}}',
      modalClosed: 'Modal cerrado',
      trapFocus: 'Foco capturado en modal',
      restoreFocus: 'Foco restaurado al elemento anterior'
    },
    
    forms: {
      required: 'Campo requerido',
      invalid: 'Campo inválido',
      validationError: 'Error de validación',
      fieldHelp: 'Ayuda para el campo {{field}}',
      characterCount: '{{current}} de {{max}} caracteres',
      formSaved: 'Formulario guardado exitosamente',
      formHasErrors: 'El formulario tiene {{count}} error{{plural}}',
      requiredField: 'Campo {{field}} es requerido',
      invalidFormat: 'El formato de {{field}} es inválido',
      fieldTooShort: '{{field}} debe tener al menos {{min}} caracteres',
      fieldTooLong: '{{field}} no puede tener más de {{max}} caracteres',
      fieldUpdated: 'Campo {{field}} actualizado'
    },
    
    navigation: {
      breadcrumb: 'Navegación de migas de pan',
      pagination: 'Navegación de páginas',
      currentPage: 'Página actual: {{page}}',
      goToPage: 'Ir a la página {{page}}',
      nextPage: 'Página siguiente',
      previousPage: 'Página anterior',
      firstPage: 'Primera página',
      lastPage: 'Última página',
      navigatedTo: 'Navegando a {{location}}',
      pageChanged: 'Página cambiada a {{page}} de {{total}}',
      itemsPerPage: '{{count}} elementos por página',
      totalItems: '{{count}} elementos en total'
    },
    
    tables: {
      table: 'Tabla de {{type}}',
      sortColumn: 'Ordenar por {{column}}',
      sortAscending: 'Ordenar ascendente',
      sortDescending: 'Ordenar descendente',
      selectRow: 'Seleccionar fila {{index}}',
      selectAll: 'Seleccionar todas las filas',
      actions: 'Acciones para {{item}}',
      tableUpdated: 'Tabla actualizada con {{count}} elementos',
      noData: 'No hay datos disponibles en la tabla',
      rowSelected: 'Fila {{index}} seleccionada',
      rowDeselected: 'Fila {{index}} deseleccionada',
      allRowsSelected: 'Todas las filas seleccionadas',
      allRowsDeselected: 'Todas las filas deseleccionadas',
      sortChanged: 'Tabla ordenada por {{column}} en orden {{direction}}'
    },
    
    status: {
      loading: 'Cargando',
      loaded: 'Contenido cargado',
      saving: 'Guardando',
      saved: 'Guardado exitosamente',
      error: 'Error ocurrido',
      warning: 'Advertencia',
      info: 'Información',
      success: 'Operación exitosa',
      processing: 'Procesando',
      completed: 'Completado',
      cancelled: 'Cancelado',
      pending: 'Pendiente'
    },
    
    actions: {
      edit: 'Editar {{item}}',
      delete: 'Eliminar {{item}}',
      view: 'Ver detalles de {{item}}',
      create: 'Crear nuevo {{item}}',
      save: 'Guardar {{item}}',
      cancel: 'Cancelar acción',
      confirm: 'Confirmar acción',
      download: 'Descargar {{item}}',
      upload: 'Subir {{item}}',
      search: 'Buscar {{item}}',
      filter: 'Filtrar {{item}}',
      export: 'Exportar {{item}}',
      import: 'Importar {{item}}',
      refresh: 'Actualizar {{item}}'
    },
    
    keyboard: {
      enterToActivate: 'Presiona Enter para activar',
      spaceToSelect: 'Presiona Espacio para seleccionar',
      escapeToClose: 'Presiona Escape para cerrar',
      tabToNavigate: 'Usa Tab para navegar',
      arrowsToMove: 'Usa las flechas para moverte',
      homeEnd: 'Usa Inicio/Fin para ir al principio/final',
      pageUpDown: 'Usa Re Pág/Av Pág para navegar por páginas'
    },
    
    regions: {
      main: 'Contenido principal',
      navigation: 'Navegación',
      banner: 'Encabezado',
      contentinfo: 'Información de contenido',
      complementary: 'Contenido complementario',
      search: 'Búsqueda',
      form: 'Formulario',
      application: 'Aplicación'
    }
  },
  
  clients: {
    title: 'Gestión de Clientes',
    subtitle: 'Administra los clientes de tu empresa',
    create: 'Nuevo Cliente',
    edit: 'Editar Cliente',
    delete: 'Eliminar Cliente',
    view: 'Ver Detalles',
    list: 'Lista de Clientes',
    search: 'Buscar clientes...',
    
    fields: {
      name: 'Nombre',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      company: 'Empresa',
      address: 'Dirección',
      city: 'Ciudad',
      country: 'País',
      status: 'Estado',
      notes: 'Notas',
      createdAt: 'Fecha de Creación',
      updatedAt: 'Última Actualización',
      contactPerson: 'Persona de Contacto',
      taxId: 'NIF/CIF',
      website: 'Sitio Web'
    },
    
    status: {
      active: 'Activo',
      inactive: 'Inactivo',
      pending: 'Pendiente',
      suspended: 'Suspendido',
      archived: 'Archivado'
    },
    
    messages: {
      created: 'Cliente creado exitosamente',
      updated: 'Cliente actualizado exitosamente',
      deleted: 'Cliente eliminado exitosamente',
      error: 'Error al procesar el cliente',
      notFound: 'Cliente no encontrado',
      loading: 'Cargando clientes...',
      empty: 'No hay clientes registrados',
      deleteConfirm: '¿Estás seguro de que deseas eliminar este cliente?',
      searchResults: 'Se encontraron {{count}} cliente{{plural}}',
      noResults: 'No se encontraron clientes que coincidan con tu búsqueda',
      filtered: 'Mostrando {{count}} de {{total}} clientes',
      loadingMore: 'Cargando más clientes...'
    },
    
    filters: {
      title: 'Filtros',
      status: 'Estado',
      company: 'Empresa',
      city: 'Ciudad',
      country: 'País',
      dateRange: 'Rango de Fechas',
      clear: 'Limpiar Filtros',
      apply: 'Aplicar Filtros',
      activeFilters: '{{count}} filtro{{plural}} activo{{plural}}'
    },
    
    actions: {
      addClient: 'Agregar Cliente',
      editClient: 'Editar Cliente',
      deleteClient: 'Eliminar Cliente',
      viewClient: 'Ver Cliente',
      exportClients: 'Exportar Clientes',
      importClients: 'Importar Clientes',
      searchClients: 'Buscar Clientes',
      filterClients: 'Filtrar Clientes',
      refreshClients: 'Actualizar Lista'
    },
    
    accessibility: {
      clientCard: 'Tarjeta de cliente {{name}}',
      clientList: 'Lista de clientes',
      searchInput: 'Campo de búsqueda de clientes',
      filterButton: 'Botón de filtros de clientes',
      addButton: 'Botón para agregar nuevo cliente',
      editButton: 'Editar cliente {{name}}',
      deleteButton: 'Eliminar cliente {{name}}',
      viewButton: 'Ver detalles del cliente {{name}}',
      statusBadge: 'Estado del cliente: {{status}}',
      clientSelected: 'Cliente {{name}} seleccionado',
      clientDeselected: 'Cliente {{name}} deseleccionado',
      loadingClients: 'Cargando lista de clientes',
      clientsLoaded: '{{count}} cliente{{plural}} cargado{{plural}}',
      searchStarted: 'Búsqueda iniciada para: {{term}}',
      searchCompleted: 'Búsqueda completada. {{count}} resultado{{plural}}',
      filterApplied: 'Filtros aplicados. {{count}} cliente{{plural}} mostrado{{plural}}',
      clientCreated: 'Nuevo cliente {{name}} creado exitosamente',
      clientUpdated: 'Cliente {{name}} actualizado exitosamente',
      clientDeleted: 'Cliente {{name}} eliminado exitosamente',
      nameRequired: 'El nombre es requerido',
      nameMinLength: 'El nombre debe tener al menos 2 caracteres',
      emailRequired: 'El email es requerido',
      emailInvalid: 'El email tiene un formato inválido',
      headerActions: 'Acciones del encabezado',
      searchInProgress: 'Búsqueda en progreso',
      searching: 'Buscando...',
      searchAndFilters: 'Búsqueda y filtros',
      searchHelp: 'Escribe para buscar clientes por nombre, email o empresa',
      statusFilter: 'Filtrar por estado',
      resultsCounter: 'Contador de resultados',
      showingResults: 'Mostrando {{count}} de {{total}} resultado{{plural}}',
      statisticsSection: 'Sección de estadísticas',
      clientGrid: 'Cuadrícula de clientes'
    },
    
    stats: {
      total: 'Total',
      filtered: 'Filtrados',
      title: 'Estadísticas'
    }
  },
  
  themes: {
    title: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    highContrast: 'Alto Contraste',
    enterprise: 'Corporativo',
    followSystem: 'Seguir sistema',
    
    descriptions: {
      light: 'Tema claro con colores suaves, ideal para uso diurno',
      dark: 'Tema oscuro que reduce el cansancio visual en entornos con poca luz',
      highContrast: 'Tema de alto contraste para máxima accesibilidad visual',
      enterprise: 'Tema corporativo personalizable con colores de marca'
    }
  },
  
  errors: {
    general: 'Ha ocurrido un error inesperado',
    network: 'Error de conexión de red',
    validation: 'Error de validación',
    unauthorized: 'No autorizado',
    forbidden: 'Acceso prohibido',
    notFound: 'Recurso no encontrado',
    serverError: 'Error del servidor',
    timeout: 'Tiempo de espera agotado',
    
    retry: 'Intentar de nuevo',
    goHome: 'Ir al inicio',
    contact: 'Contactar soporte'
  },
  
  performance: {
    loading: 'Optimizando performance...',
    virtualScrolling: 'Scroll virtual activado para {{count}} elementos',
    cacheUpdate: 'Cache actualizado',
    offline: 'Modo offline activo',
    online: 'Conexión restaurada',
    backgroundSync: 'Sincronización en segundo plano'
  }
};

// Traducciones en inglés
const enTranslations = {
  common: {
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    search: 'Search',
    filter: 'Filter',
    reset: 'Reset',
    close: 'Close',
    open: 'Open',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    required: 'Required',
    optional: 'Optional',
    select: 'Select',
    none: 'None',
    all: 'All',
    clear: 'Clear'
  },
  
  navigation: {
    home: 'Home',
    dashboard: 'Dashboard',
    purchases: 'Purchases',
    sales: 'Sales',
    products: 'Products',
    suppliers: 'Suppliers',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout'
  },
  
  purchases: {
    title: 'Purchase Management',
    subtitle: 'Manage your company purchases',
    create: 'New Purchase',
    edit: 'Edit Purchase',
    delete: 'Delete Purchase',
    view: 'View Details',
    list: 'Purchase List',
    search: 'Search purchases...',
    
    fields: {
      supplier: 'Supplier',
      date: 'Date',
      total: 'Total',
      status: 'Status',
      description: 'Description',
      items: 'Items',
      quantity: 'Quantity',
      price: 'Price',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount'
    },
    
    status: {
      pending: 'Pending',
      confirmed: 'Confirmed',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      paid: 'Paid'
    },
    
    messages: {
      created: 'Purchase created successfully',
      updated: 'Purchase updated successfully',
      deleted: 'Purchase deleted successfully',
      error: 'Error processing purchase',
      notFound: 'Purchase not found',
      loading: 'Loading purchases...',
      empty: 'No purchases registered',
      deleteConfirm: 'Are you sure you want to delete this purchase?'
    },
    
    filters: {
      title: 'Filters',
      dateRange: 'Date Range',
      supplier: 'Supplier',
      status: 'Status',
      minAmount: 'Minimum Amount',
      maxAmount: 'Maximum Amount',
      clear: 'Clear Filters',
      apply: 'Apply Filters'
    }
  },
  
  accessibility: {
    skipToContent: 'Skip to main content',
    skipToNavigation: 'Skip to navigation',
    menuButton: 'Navigation menu',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    searchButton: 'Search',
    filterButton: 'Filter results',
    sortButton: 'Sort',
    loadingContent: 'Loading content',
    errorMessage: 'Error message',
    successMessage: 'Success message',
    warningMessage: 'Warning message',
    infoMessage: 'Information message',
    
    modals: {
      openModal: 'Open {{type}} modal',
      closeModal: 'Close modal',
      modalTitle: '{{type}} modal',
      confirmDelete: 'Confirm deletion'
    },
    
    forms: {
      required: 'Required field',
      invalid: 'Invalid field',
      validationError: 'Validation error',
      fieldHelp: 'Help for {{field}} field',
      characterCount: '{{current}} of {{max}} characters'
    },
    
    navigation: {
      breadcrumb: 'Breadcrumb navigation',
      pagination: 'Page navigation',
      currentPage: 'Current page: {{page}}',
      goToPage: 'Go to page {{page}}',
      nextPage: 'Next page',
      previousPage: 'Previous page',
      firstPage: 'First page',
      lastPage: 'Last page'
    },
    
    tables: {
      table: '{{type}} table',
      sortColumn: 'Sort by {{column}}',
      sortAscending: 'Sort ascending',
      sortDescending: 'Sort descending',
      selectRow: 'Select row {{index}}',
      selectAll: 'Select all rows',
      actions: 'Actions for {{item}}'
    }
  },
  
  themes: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark',
    highContrast: 'High Contrast',
    enterprise: 'Enterprise',
    followSystem: 'Follow system',
    
    descriptions: {
      light: 'Light theme with soft colors, ideal for daytime use',
      dark: 'Dark theme that reduces eye strain in low-light environments',
      highContrast: 'High contrast theme for maximum visual accessibility',
      enterprise: 'Customizable corporate theme with brand colors'
    }
  },
  
  errors: {
    general: 'An unexpected error occurred',
    network: 'Network connection error',
    validation: 'Validation error',
    unauthorized: 'Unauthorized',
    forbidden: 'Access forbidden',
    notFound: 'Resource not found',
    serverError: 'Server error',
    timeout: 'Request timeout',
    
    retry: 'Try again',
    goHome: 'Go home',
    contact: 'Contact support'
  },
  
  performance: {
    loading: 'Optimizing performance...',
    virtualScrolling: 'Virtual scrolling enabled for {{count}} items',
    cacheUpdate: 'Cache updated',
    offline: 'Offline mode active',
    online: 'Connection restored',
    backgroundSync: 'Background synchronization'
  }
};

// Traducciones en portugués (básicas)
const ptTranslations = {
  common: {
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    info: 'Informação',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    create: 'Criar',
    search: 'Buscar',
    filter: 'Filtrar',
    reset: 'Redefinir',
    close: 'Fechar',
    open: 'Abrir'
  },
  
  navigation: {
    home: 'Início',
    dashboard: 'Painel',
    purchases: 'Compras',
    sales: 'Vendas',
    products: 'Produtos',
    suppliers: 'Fornecedores',
    reports: 'Relatórios',
    settings: 'Configurações'
  },
  
  purchases: {
    title: 'Gestão de Compras',
    subtitle: 'Gerencie as compras da sua empresa',
    create: 'Nova Compra',
    edit: 'Editar Compra',
    delete: 'Excluir Compra'
  }
};

// Configuración de i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslations },
      en: { translation: enTranslations },
      pt: { translation: ptTranslations }
    },
    
    fallbackLng: 'es',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'erp-language'
    },
    
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: lng === 'es' ? 'EUR' : 'USD'
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(value);
        }
        return value;
      }
    },
    
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n;

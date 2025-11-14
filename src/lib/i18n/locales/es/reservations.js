/**
 * Traducciones de reservas en español
 * Módulo: Gestión de reservas, servicios, horarios
 */

export const reservations = {
  // Títulos y navegación
  'reservations.title': 'Reservas',
  'reservations.subtitle': 'Gestiona reservas y horarios de servicios',
  'reservations.new_reservation': 'Nueva Reserva',
  'reservations.calendar': 'Calendario de Reservas',

  // Formulario
  'reservations.service': 'Servicio',
  'reservations.client': 'Cliente',
  'reservations.duration': 'Duración (horas)',
  'reservations.select_service': 'Seleccionar servicio...',
  'reservations.select_client': 'Seleccionar cliente...',
  'reservations.available_times': 'Horarios Disponibles',
  'reservations.start_datetime': 'Fecha y Hora de Inicio',
  'reservations.create': 'Crear Reserva',
  'reservations.cancel': 'Cancelar',
  'reservations.confirm_cancel': '¿Cancelar esta reserva?',

  // Tabs
  'reservations.tab.calendar': 'Calendario',
  'reservations.tab.list': 'Lista de Reservas',

  // Estados vacíos
  'reservations.empty.title': 'Sin reservas',
  'reservations.empty.message': 'No hay reservas registradas',
  'reservations.no_services_available': 'No hay servicios disponibles',
  'reservations.no_clients_available': 'No hay clientes disponibles',
  'reservations.no_schedules_available': 'Sin horarios disponibles',
  'reservations.no_schedules_help': 'Prueba seleccionando otra fecha, producto o contacta al administrador para generar horarios.',

  // Errores
  'reservations.error.title': 'Error',
  'reservations.error.api_unavailable': 'No se pudo conectar con el servidor. Verifique su conexión a internet y que el servidor esté funcionando.',
  'reservations.error.endpoint_not_implemented': 'Los servicios de productos aún no están configurados en el servidor. Contacte al administrador del sistema para completar la configuración de la API.',
  'reservations.error.endpoint_not_found': 'Algunas funcionalidades aún no están disponibles. El sistema está en proceso de configuración.',

  // Búsqueda
  'reservations.search.placeholder': 'Buscar reservas...',

  // Modales
  'reservations.modal.edit': 'Editar Reserva',
  'reservations.modal.create': 'Crear Reserva',

  // Estados
  'reservations.status.confirmed': 'Confirmada',
  'reservations.status.cancelled': 'Cancelada',
  'reservations.status.pending': 'Pendiente',
  'reservations.status.reserved': 'Reservada',

  // Bienvenida
  'reservations.welcome.title': 'Sistema de Reservas',
  'reservations.welcome.description': 'Este sistema te permite gestionar reservas y horarios de servicios. Para comenzar, necesitas cargar los datos desde la API.',
  'reservations.welcome.loading': 'Cargando...',
  'reservations.welcome.load_data': 'Cargar Datos del Sistema',

  // Horarios (Schedules)
  'schedules.title': 'Gestión de Horarios',
  'schedules.subtitle': 'Administra la disponibilidad de horarios para servicios',
  'schedules.search.placeholder': 'Buscar horarios...',
  'schedules.filter.all_products': 'Todos los servicios',
  'schedules.filter.date': 'Filtrar por fecha',
  'schedules.generate': 'Generar Horarios',
  'schedules.empty.title': 'Sin horarios',
  'schedules.empty.message': 'No hay horarios registrados para los filtros actuales',
  'schedules.error.title': 'Error',
  'schedules.status.available': 'Disponible',
  'schedules.status.unavailable': 'No Disponible',
  'schedules.disable': 'Deshabilitar',
  'schedules.enable': 'Habilitar',
  'schedules.modal.generate': 'Generar Horarios',
  'schedules.generate_type': 'Tipo de Generación',
  'schedules.generate.daily': 'Horarios diarios automáticos',
  'schedules.generate.date': 'Para fecha específica',
  'schedules.generate.next_days': 'Próximos N días',
  'schedules.target_date': 'Fecha Objetivo',
  'schedules.days_count': 'Número de Días',
  'schedules.tab.management': 'Gestión de Horarios',
  'schedules.generate.title': 'Generar Horarios',
  'schedules.available.title': 'Horarios del Día',
  'schedules.no_schedules': 'Sin horarios para esta fecha',
  'schedules.generate_help': 'Utiliza el panel de la izquierda para generar horarios o contacta al administrador del sistema',
  'schedules.select_service_date': 'Selecciona servicio y fecha',
  'schedules.select_help': 'Elige un servicio y una fecha para ver y gestionar los horarios disponibles',
}

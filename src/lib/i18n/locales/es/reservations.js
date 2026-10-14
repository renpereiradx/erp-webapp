/**
 * Traducciones del módulo de Reservas / Gestión de Agenda (/gestion-agenda).
 * Las claves 'reservations.title', 'reservations.subtitle' y
 * 'reservations.moduleDisabled' viven en common.js (las comparte el gate de
 * ruta en App.tsx).
 */

export const reservations = {
  // ─── Acciones de página ───
  'reservations.new': 'Nueva Reserva',

  // ─── Card de controles (recurso / fecha / generar) ───
  'reservations.controls.description': 'Elegí el recurso y la fecha para ver su disponibilidad.',
  'reservations.controls.resource': 'Recurso',
  'reservations.controls.resourcePlaceholder': 'Seleccione un recurso',
  'reservations.controls.loadingResources': 'Cargando recursos...',
  'reservations.controls.date': 'Fecha',
  'reservations.controls.generate': 'Generar horarios',

  // ─── Cronograma ───
  'reservations.timeline.title': 'Disponibilidad del día',
  'reservations.timeline.hint': 'Hacé clic en un horario libre para reservar',
  'reservations.legend.free': 'Libre',
  'reservations.legend.busy': 'Ocupado',

  // ─── Estados de slot ───
  'reservations.slot.available': 'Disponible',
  'reservations.slot.start': 'Inicio',
  'reservations.slot.included': 'Incluido',
  'reservations.slot.conflict': 'Conflicto',
  'reservations.slot.unavailable': 'No disponible',

  // ─── Estados de reserva ───
  'reservations.status.RESERVED': 'Reservado',
  'reservations.status.CONFIRMED': 'Confirmado',
  'reservations.status.CANCELLED': 'Anulado',
  'reservations.status.COMPLETED': 'Completado',
  'reservations.status.PENDING': 'Pendiente',

  // ─── Tarjeta de reserva (grupo de slots) ───
  'reservations.group.reserveId': 'Reserva #{id}',
  'reservations.group.hours': '{n} h',
  'reservations.group.cancelledNote': 'Esta reserva fue anulada',
  'reservations.actions.confirm': 'Confirmar',
  'reservations.actions.invoice': 'Facturar',
  'reservations.actions.cancel': 'Anular reserva',
  'reservations.actions.viewDetail': 'Ver información de la reserva',

  // ─── Empty / error de la agenda ───
  'reservations.empty.title': 'Sin horarios para esta fecha',
  'reservations.empty.description':
    'Este recurso no tiene bloques generados para la fecha seleccionada. Generá los horarios para habilitar las reservas.',
  'reservations.empty.generate': 'Generar horarios',
  'reservations.errors.loadTitle': 'No se pudieron cargar los horarios',

  // ─── Confirmación de anulación ───
  'reservations.cancelConfirm.title': '¿Anular esta reserva?',
  'reservations.cancelConfirm.message': 'El turno volverá a estar disponible para otros clientes.',

  // ─── Modal: nueva reserva ───
  'reservations.form.title': 'Nueva Reserva',
  'reservations.form.subtitle': 'Completá los datos para registrar el turno.',
  'reservations.form.client': 'Cliente',
  'reservations.form.clientPlaceholder': 'Buscar por nombre o documento (mín. 2 caracteres)...',
  'reservations.form.clientEmpty': 'Sin resultados de clientes',
  'reservations.form.clearClient': 'Quitar cliente seleccionado',
  'reservations.form.schedule': 'Horario',
  'reservations.form.scheduleHint': 'Tocá una hora libre para cambiar el inicio del turno.',
  'reservations.form.scheduleEmpty': 'No hay horarios generados para esta fecha.',
  'reservations.form.type': 'Tipo de turno',
  'reservations.type.normal': 'Normal',
  'reservations.type.training': 'Entrenamiento',
  'reservations.type.match': 'Partido',
  'reservations.type.event': 'Evento especial',
  'reservations.form.duration': 'Duración',
  'reservations.form.durationHours': '{n} h',
  'reservations.form.rateLine': 'Tarifa base ({duration} h × {rate}/h)',
  'reservations.form.lightingFee': 'Recargo iluminación',
  'reservations.form.total': 'Total a pagar',
  'reservations.form.confirm': 'Confirmar reserva',

  // ─── Modal: detalle de reserva ───
  'reservations.detail.title': 'Detalle de la reserva',
  'reservations.detail.dateTime': 'Fecha y hora',
  'reservations.detail.duration': 'Duración',
  'reservations.detail.clientId': 'ID de cliente',
  'reservations.detail.infoPending':
    'El turno está reservado y pendiente de confirmación para la fecha indicada.',
  'reservations.detail.infoConfirmed': 'El turno está confirmado para la fecha indicada.',
  'reservations.detail.invoiceNow': 'Cobrar ahora',
  'reservations.detail.invoiceService': 'Facturar servicio',
  'reservations.detail.confirm': 'Confirmar reserva',
  'reservations.detail.cancel': 'Anular reserva',
  'reservations.detail.close': 'Cerrar',

  // ─── Card: ventana de generación ───
  'reservations.settings.title': 'Ventana de generación',
  'reservations.settings.description':
    'Define el horario operativo con el que se generan los turnos de este recurso.',
  'reservations.settings.startHour': 'Hora de apertura',
  'reservations.settings.endHour': 'Hora de cierre',
  'reservations.settings.timezone': 'Zona horaria',
  'reservations.settings.tzPY': 'UTC-4 (PY)',
  'reservations.settings.tzBOG': 'UTC-5 (BOG/LIM)',
  'reservations.settings.active': 'Recurso activo',
  'reservations.settings.save': 'Guardar cambios',

  // ─── Errores (hook) ───
  'reservations.errors.noSchedules': 'No hay horarios generados para este recurso en la fecha seleccionada.',
  'reservations.errors.loadSchedules': 'Error al cargar horarios',
  'reservations.errors.generate': 'Error al generar horarios',
  'reservations.errors.config': 'Error al actualizar la configuración',
  'reservations.errors.create': 'Error al crear la reserva',
  'reservations.errors.confirm': 'Error al confirmar la reserva',
  'reservations.errors.cancel': 'Error al anular la reserva',

  // ─── Toasts ───
  'reservations.toasts.selectSlotTitle': 'Seleccione un horario',
  'reservations.toasts.selectSlotDesc': 'Hacé clic en un horario disponible para crear una nueva reserva.',
  'reservations.toasts.slotUnavailableTitle': 'Horario no disponible',
  'reservations.toasts.slotUnavailableDesc': 'El horario seleccionado ya no está disponible.',
  'reservations.toasts.createdTitle': 'Reserva registrada',
  'reservations.toasts.createdDesc': 'El turno quedó registrado correctamente.',
  'reservations.toasts.actionError': 'No se pudo completar la operación.',
  'reservations.toasts.confirmedTitle': 'Reserva confirmada',
  'reservations.toasts.confirmedDesc': 'El turno quedó marcado como confirmado.',
  'reservations.toasts.cancelledTitle': 'Reserva anulada',
  'reservations.toasts.cancelledDesc': 'El turno volvió a estar disponible.',
  'reservations.toasts.configSavedTitle': 'Configuración actualizada',
};

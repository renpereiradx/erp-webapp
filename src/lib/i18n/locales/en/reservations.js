/**
 * English translations for the Reservations / Schedule module (/gestion-agenda).
 * Keys 'reservations.title', 'reservations.subtitle' and
 * 'reservations.moduleDisabled' live in common.js (shared with the route gate
 * in App.tsx).
 */

export const reservations = {
  // ─── Page actions ───
  'reservations.new': 'New Reservation',

  // ─── Controls card (resource / date / generate) ───
  'reservations.controls.description': 'Pick the resource and date to see its availability.',
  'reservations.controls.resource': 'Resource',
  'reservations.controls.resourcePlaceholder': 'Select a resource',
  'reservations.controls.loadingResources': 'Loading resources...',
  'reservations.controls.date': 'Date',
  'reservations.controls.generate': 'Generate schedules',

  // ─── Timeline ───
  'reservations.timeline.title': 'Daily availability',
  'reservations.timeline.hint': 'Click a free slot to book it',
  'reservations.legend.free': 'Free',
  'reservations.legend.busy': 'Busy',

  // ─── Slot states ───
  'reservations.slot.available': 'Available',
  'reservations.slot.start': 'Start',
  'reservations.slot.included': 'Included',
  'reservations.slot.conflict': 'Conflict',
  'reservations.slot.unavailable': 'Unavailable',

  // ─── Reservation statuses ───
  'reservations.status.RESERVED': 'Reserved',
  'reservations.status.CONFIRMED': 'Confirmed',
  'reservations.status.CANCELLED': 'Cancelled',
  'reservations.status.COMPLETED': 'Completed',
  'reservations.status.PENDING': 'Pending',

  // ─── Reservation card (slot group) ───
  'reservations.group.reserveId': 'Reservation #{id}',
  'reservations.group.hours': '{n} h',
  'reservations.group.cancelledNote': 'This reservation was cancelled',
  'reservations.actions.confirm': 'Confirm',
  'reservations.actions.invoice': 'Invoice',
  'reservations.actions.cancel': 'Cancel reservation',
  'reservations.actions.viewDetail': 'View reservation details',

  // ─── Schedule empty / error ───
  'reservations.empty.title': 'No schedules for this date',
  'reservations.empty.description':
    'This resource has no generated blocks for the selected date. Generate the schedules to enable bookings.',
  'reservations.empty.generate': 'Generate schedules',
  'reservations.errors.loadTitle': 'Could not load schedules',

  // ─── Cancellation confirmation ───
  'reservations.cancelConfirm.title': 'Cancel this reservation?',
  'reservations.cancelConfirm.message': 'The slot will become available to other clients again.',

  // ─── Modal: new reservation ───
  'reservations.form.title': 'New Reservation',
  'reservations.form.subtitle': 'Fill in the details to book the slot.',
  'reservations.form.client': 'Client',
  'reservations.form.clientPlaceholder': 'Search by name or document (min. 2 characters)...',
  'reservations.form.clientEmpty': 'No client results',
  'reservations.form.clearClient': 'Remove selected client',
  'reservations.form.startTime': 'Start time',
  'reservations.form.type': 'Shift type',
  'reservations.type.normal': 'Normal',
  'reservations.type.training': 'Training',
  'reservations.type.match': 'Match',
  'reservations.type.event': 'Special event',
  'reservations.form.duration': 'Estimated duration',
  'reservations.form.durationHours': '{n} h',
  'reservations.form.durationMax': '{max} h max.',
  'reservations.form.durationWarning': 'Not enough consecutive free slots for {max} h.',
  'reservations.form.rateLine': 'Base rate ({duration} h × {rate}/h)',
  'reservations.form.lightingFee': 'Lighting fee',
  'reservations.form.total': 'Total to pay',
  'reservations.form.confirm': 'Confirm reservation',

  // ─── Modal: reservation detail ───
  'reservations.detail.title': 'Reservation details',
  'reservations.detail.dateTime': 'Date and time',
  'reservations.detail.duration': 'Duration',
  'reservations.detail.clientId': 'Client ID',
  'reservations.detail.infoPending': 'The slot is reserved and pending confirmation for the indicated date.',
  'reservations.detail.infoConfirmed': 'The slot is confirmed for the indicated date.',
  'reservations.detail.invoiceNow': 'Charge now',
  'reservations.detail.invoiceService': 'Invoice service',
  'reservations.detail.confirm': 'Confirm reservation',
  'reservations.detail.cancel': 'Cancel reservation',
  'reservations.detail.close': 'Close',

  // ─── Card: generation window ───
  'reservations.settings.title': 'Generation window',
  'reservations.settings.description':
    'Defines the operating hours used to generate this resource’s slots.',
  'reservations.settings.startHour': 'Opening hour',
  'reservations.settings.endHour': 'Closing hour',
  'reservations.settings.timezone': 'Timezone',
  'reservations.settings.tzPY': 'UTC-4 (PY)',
  'reservations.settings.tzBOG': 'UTC-5 (BOG/LIM)',
  'reservations.settings.active': 'Active resource',
  'reservations.settings.save': 'Save changes',

  // ─── Errors (hook) ───
  'reservations.errors.noSchedules': 'No schedules generated for this resource on the selected date.',
  'reservations.errors.loadSchedules': 'Error loading schedules',
  'reservations.errors.generate': 'Error generating schedules',
  'reservations.errors.config': 'Error updating the configuration',
  'reservations.errors.create': 'Error creating the reservation',
  'reservations.errors.confirm': 'Error confirming the reservation',
  'reservations.errors.cancel': 'Error cancelling the reservation',

  // ─── Toasts ───
  'reservations.toasts.selectSlotTitle': 'Select a time slot',
  'reservations.toasts.selectSlotDesc': 'Click an available slot to create a new reservation.',
  'reservations.toasts.slotUnavailableTitle': 'Slot unavailable',
  'reservations.toasts.slotUnavailableDesc': 'The selected slot is no longer available.',
  'reservations.toasts.createdTitle': 'Reservation created',
  'reservations.toasts.createdDesc': 'The slot was registered successfully.',
  'reservations.toasts.actionError': 'The operation could not be completed.',
  'reservations.toasts.confirmedTitle': 'Reservation confirmed',
  'reservations.toasts.confirmedDesc': 'The slot was marked as confirmed.',
  'reservations.toasts.cancelledTitle': 'Reservation cancelled',
  'reservations.toasts.cancelledDesc': 'The slot is available again.',
  'reservations.toasts.configSavedTitle': 'Configuration updated',
};

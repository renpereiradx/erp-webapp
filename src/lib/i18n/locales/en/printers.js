/**
 * English translations for the ticket printers feature (backend documents
 * context — /api/v1/printers). Flat 'printers.*' keys.
 */
export const printers = {
  'printers.nav': 'Ticket printers',
  'settings.printers.title': 'Ticket printers',
  'settings.printers.desc': 'Network thermal receipt printers (58/80 mm)',

  'printers.title': 'Ticket printers',
  'printers.subtitle': 'Thermal printers for POS tickets (network, port 9100)',
  'printers.list.count': '{count} printer(s)',
  'printers.list.searchPlaceholder': 'Search by name or host…',
  'printers.list.noResults': 'No results for this search',

  'printers.empty.title': 'No printers configured',
  'printers.empty.description':
    'Register a network printer to print tickets from the POS',
  'printers.empty.action': 'New printer',

  'printers.col.name': 'Name',
  'printers.col.purpose': 'Purpose',
  'printers.col.address': 'Address',
  'printers.col.width': 'Paper',
  'printers.col.status': 'Status',

  'printers.purpose.RECEIPT': 'Receipts',
  'printers.purpose.KITCHEN': 'Kitchen',
  'printers.purpose.BAR': 'Bar',

  'printers.width.58': '58 mm (32 col.)',
  'printers.width.80': '80 mm (48 col.)',

  'printers.status.active': 'Active',
  'printers.status.inactive': 'Inactive',

  'printers.form.newTitle': 'New printer',
  'printers.form.editTitle': 'Edit printer',
  'printers.form.name': 'Name',
  'printers.form.namePlaceholder': 'Register 1',
  'printers.form.nameRequired': 'Name is required',
  'printers.form.purpose': 'Purpose',
  'printers.form.host': 'Host / IP',
  'printers.form.hostPlaceholder': '192.168.1.50',
  'printers.form.hostRequired': 'Host is required',
  'printers.form.port': 'Port',
  'printers.form.portInvalid': 'Port out of range (1-65535)',
  'printers.form.width': 'Paper width',
  'printers.form.widthInvalid': 'Invalid width: use 58 or 80',
  'printers.form.codePage': 'Code page',
  'printers.form.branch': 'Branch',
  'printers.form.branchAny': 'All branches',
  'printers.form.kickDrawer': 'Open cash drawer when printing',
  'printers.form.isDefault': 'Default for receipts',
  'printers.form.isActive': 'Active',
  'printers.form.test': 'Test page',
  'printers.form.save': 'Save',
  'printers.form.saving': 'Saving…',
  'printers.form.cancel': 'Cancel',
  'printers.form.delete': 'Delete',

  'printers.delete.title': 'Delete printer',
  'printers.delete.confirm':
    'Delete printer "{name}"? This action cannot be undone.',

  'printers.toast.created': 'Printer created',
  'printers.toast.updated': 'Printer updated',
  'printers.toast.deleted': 'Printer deleted',
  'printers.toast.testSent': 'Test page sent',
  'printers.toast.error': 'Operation could not be completed',
  'printers.error.load': 'Could not load printers',
}

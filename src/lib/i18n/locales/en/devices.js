/**
 * English translations for the POS terminals registry (devices feature).
 */

export const devices = {
  // Nav / Settings
  'settings.devices.title': 'Terminals',
  'settings.devices.desc': 'Manage the business terminals: branch and linking code for each one',

  // Page
  'devices.title': 'Terminals',
  'devices.subtitle': 'Registry of the business terminals: branch and linking code.',
  'devices.empty.action': 'New terminal',
  'devices.empty.title': 'No terminals registered',
  'devices.empty.description': 'Register a terminal and link its code from Settings → This device.',
  'devices.error.load': 'Could not load the terminals',

  // RN-BIPACK-10: terminal limit per branch by edition
  'devices.limit.notice':
    'Edition without the Premium pack: each branch can operate 1 active terminal. The Premium pack (BI) enables additional terminals per branch.',

  // List
  'devices.list.searchPlaceholder': 'Search by name or code…',
  'devices.list.count': '{count} terminals',
  'devices.list.noResults': 'No results for the search',
  'devices.list.copied': 'Code copied',
  'devices.list.neverSeen': 'Never',
  'devices.list.copyCode': 'Copy code for {name}',
  'devices.col.name': 'Name',
  'devices.col.branch': 'Branch',
  'devices.col.code': 'Code',
  'devices.col.lastSeen': 'Last activity',
  'devices.col.status': 'Status',
  'devices.status.active': 'Active',
  'devices.status.inactive': 'Inactive',

  // Form
  'devices.form.newTitle': 'New terminal',
  'devices.form.editTitle': 'Edit terminal',
  'devices.form.name': 'Name',
  'devices.form.namePlaceholder': 'Register 1',
  'devices.form.nameRequired': 'The terminal name is required',
  'devices.form.branch': 'Terminal branch',
  'devices.form.branchPlaceholder': 'Select a branch…',
  'devices.form.branchRequired': 'The terminal branch is required',
  'devices.form.branchHint':
    'People using this terminal without branch-switch permission will enter directly into the selected branch.',
  'devices.form.pairingCode': 'Linking code',
  'devices.form.pairingHint': 'On the terminal computer: Settings → This device → Register.',
  'devices.form.regenerateCode': 'Generate a new code on save',
  'devices.form.isActive': 'Active',
  'devices.form.delete': 'Delete',
  'devices.form.cancel': 'Cancel',
  'devices.form.save': 'Save',
  'devices.form.saving': 'Saving…',
  'devices.delete.title': 'Delete terminal',
  'devices.delete.confirm': 'Delete terminal "{name}"? This action cannot be undone.',

  // Toasts
  'devices.toast.error': 'Could not complete the operation',
  'devices.toast.created': 'Terminal registered',
  'devices.toast.updated': 'Terminal updated',
  'devices.toast.deleted': 'Terminal deleted',
};

/**
 * English translations for other modules (login block surfaced by the
 * redesigned Login page). Remaining login/dashboard/settings keys still
 * fall back to Spanish via the `...es` spread in index.js.
 */

export const other = {
  'settings.footer.brand': 'Business Management System',
  'login.footer.brand': 'Business Management System',
  'login.validation.username.required': 'Email or username is required',
  'login.validation.username.min': 'Must be at least 3 characters',
  'login.validation.password.required': 'Password is required',
  'login.validation.password.min': 'Password must be at least 6 characters',

  // This device (D.3/D.4/D.5 — linking and branch-switch gating)
  'settings.terminal.title': 'This device',
  'settings.terminal.desc': 'Link this computer or tablet to a branch',
  'terminal.title': 'This device',
  'terminal.subtitle': 'Link this computer or tablet to a branch so anyone using it goes straight into it, without choosing one at every sign-in.',
  'terminal.statusTitle': 'Status of this device',
  'terminal.pairedBadge': 'Linked',
  'terminal.unpairedBadge': 'Not linked',
  'terminal.unpairedHint': 'This device is not linked to any branch.',
  'terminal.unpair': 'Unlink this device',
  'terminal.unpairSuccess': 'Device unlinked',
  'terminal.pairSuccess': 'Device linked to {name}',
  'terminal.effectHint': 'People operating from this device without branch-switch permission will go straight into the linked branch.',
  'terminal.pickTitle': 'Choose the branch for this device',
  'terminal.loading': 'Loading branches…',
  'terminal.noCity': 'No city',
  'terminal.localHint': 'Linking without a code is stored only in this browser.',
  'terminal.registeredLockHint': 'This device is already registered: its branch is managed from Settings → Terminals. To change it here, unlink and register the device again.',
  // FASE E: registering this device in the backend
  'terminal.registeredBadge': 'Registered (#{id})',
  'terminal.staleRegistration': 'The registration of this device no longer exists (it was deleted in Settings → Terminals). Unlink it and register it again.',
  'terminal.registerTitle': 'Register this device',
  'terminal.registerHint': 'Enter the linking code of the terminal (shown in Settings → Terminals).',
  'terminal.registerPlaceholder': 'Code (e.g. ABCD2345)',
  'terminal.register': 'Register',
  'terminal.registering': 'Registering…',
  'terminal.registerSuccess': 'Device registered: {name} → {branch}',
  'terminal.registerError': 'Invalid linking code',
};

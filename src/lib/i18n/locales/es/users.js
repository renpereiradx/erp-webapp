/**
 * Traducciones de usuarios en español
 * Módulo: Administración de usuarios, roles y perfiles
 */

export const users = {
  'users.title': 'Usuarios',
  'users.subtitle': 'Gestión de identidad',
  'users.total': 'Total',
  'users.searchPlaceholder': 'Buscar usuarios, correos, ID...',
  'users.addUser': 'Agregar usuario',
  'users.export': 'Exportar',
  'users.manageRolesSubtitle': 'Asigne o remueva privilegios para',
  'users.filterRole': 'Rol: Todos',
  'users.filterStatus': 'Estado: Activo',
  'users.filterLastActive': 'Última actividad',
  'users.clearAll': 'Borrar todo',
  'users.selectedUsers': '{{count}} usuarios seleccionados',
  'users.activate': 'Activar',
  'users.deactivate': 'Desactivar',
  'users.delete': 'Eliminar',
  'users.confirmDelete': '¿Estás seguro de eliminar a {{name}}? Esta acción es irreversible.',
  'users.notFound': 'Usuario no encontrado',
  'users.backToList': 'Volver a la lista',
  'users.noRoles': 'No hay roles asignados a este usuario.',
  
  // Acciones
  'users.actions.view': 'Ver',
  'users.actions.edit': 'Editar',
  'users.actions.delete': 'Eliminar',
  'users.actions.assign': 'Asignar',
  'users.actions.remove': 'Remover',
  'users.actions.changePassword': 'Reiniciar Contraseña',
  'users.actions.manageRoles': 'Gestionar Roles',
  
  // Tabla
  'users.rowsPerPage': 'Filas por página:',
  'users.showing': 'Mostrando',
  'users.of': 'de',
  'users.page': 'Página',
  'users.table.user': 'Usuario',
  'users.table.role': 'Rol',
  'users.table.status': 'Estado',
  'users.table.lastActive': 'Última actividad',
  'users.table.id': 'ID de Usuario',
  'users.table.createdAt': 'Fecha de Registro',
  
  // Estados
  'users.status.active': 'Activo',
  'users.status.inactive': 'Inactivo',
  'users.status.pending': 'Pendiente',
  'users.status.suspended': 'Suspendido',
  
  // Perfil
  'users.profile.summary': 'Resumen de Usuario',
  'users.profile.quickActions': 'Gestión Rápida',
  'users.profile.securitySummary': 'Resumen de Seguridad',
  'users.profile.activeSessions': 'Sesiones Activas',
  'users.profile.failedAttempts': 'Intentos Fallidos',
  'users.profile.activeRoles': 'Roles Activos',
  'users.profile.availableRoles': 'Roles Disponibles',
  'users.profile.permissionPreview': 'Vista Previa de Permisos',
  
  // Roles
  'users.roles.adminDesc': 'Acceso Total a la Instancia',
  'users.roles.defaultDesc': 'Permisos de Usuario Estándar',
  'users.roles.adminFull': 'Acceso total al sistema, gestión de facturación y aprovisionamiento de usuarios.',
  'users.roles.standardFull': 'Acceso operativo estándar.',
  'users.roles.admin': 'Administrador de Organización',
  'users.roles.securityManager': 'Gerente de Seguridad',
  'users.roles.billingContributor': 'Contribuyente de Facturación',
  'users.roles.contentEditor': 'Editor de Contenido',
  'users.roles.editor': 'Editor',
  'users.roles.viewer': 'Espectador',
  'users.roles.billingManager': 'Gerente de Facturación',
  
  // Formulario
  'users.form.createTitle': 'Crear Nuevo Usuario',
  'users.form.editTitle': 'Editar Usuario',
  'users.form.createDescription': 'Configure un nuevo perfil organizacional con roles específicos y credenciales de seguridad.',
  'users.form.editDescription': 'Modifique los detalles del perfil y la configuración de acceso del usuario.',
  'users.form.personalInfo': 'Información Personal',
  'users.form.contactInfo': 'Información de Contacto',
  'users.form.firstName': 'Nombre',
  'users.form.firstNamePlaceholder': 'ej. Alex',
  'users.form.lastName': 'Apellido',
  'users.form.lastNamePlaceholder': 'ej. Morgan',
  'users.form.username': 'Nombre de Usuario',
  'users.form.usernamePlaceholder': 'ej. amorgan',
  'users.form.credentials': 'Credenciales de Cuenta',
  'users.form.email': 'Correo Laboral',
  'users.form.emailPlaceholder': 'alex.morgan@company.com',
  'users.form.emailAvailable': 'Disponible',
  'users.form.phone': 'Teléfono',
  'users.form.password': 'Contraseña Inicial',
  'users.form.showPassword': 'Mostrar Contraseña',
  'users.form.hidePassword': 'Ocultar Contraseña',
  'users.form.strength': 'Fortaleza:',
  'users.form.strengthStrong': 'Fuerte',
  'users.form.strengthMedium': 'Media',
  'users.form.strengthWeak': 'Débil',
  'users.form.strengthMessage': 'Al menos 4 caracteres.',
  'users.form.accessControl': 'Control de Acceso',
  'users.form.role': 'Rol Asignado',
  'users.form.rolePlaceholder': 'Seleccionar un rol organizacional',
  'users.form.roleHelp': 'Los editores pueden crear y gestionar contenido, pero no pueden modificar la configuración del sistema.',
  'users.form.discard': 'Descartar Cambios',
  'users.form.createButton': 'Crear Perfil de Usuario',
  'users.form.saveButton': 'Guardar Cambios',
  'users.form.createSuccess': 'Usuario creado correctamente',
  'users.form.updateSuccess': 'Usuario actualizado correctamente',
  'users.form.createError': 'Error al crear el usuario',
  'users.form.updateError': 'Error al actualizar el usuario',
  
  // Errores
  'users.errors.cannotRemoveLastRole': 'El usuario debe tener al menos un rol.',

  // Encabezado y página
  'users.description': 'Administra accesos, roles y seguridad de la plataforma.',
  'users.lastActiveNever': 'Nunca',
  'users.records': 'registros',
  'users.exportSoon': 'La exportación estará disponible pronto.',
  'users.resetPassword': 'Restablecer contraseña',
  'users.resetPasswordSoon': 'El restablecimiento de contraseña estará disponible pronto.',
  'users.memberSince': 'Miembro desde',
  'users.lastAccess': 'Último Acceso',
  'users.systemId': 'ID del Sistema',
  'users.rolesPermissions': 'Roles y Permisos',
  'users.securityActivity': 'Actividad de Seguridad',

  // Filtros
  'users.filter.roleAll': 'Todos los roles',
  'users.filter.statusAll': 'Todos los estados',

  // Acciones en bloque
  'users.bulk.activate': 'Activar',
  'users.bulk.deactivate': 'Desactivar',
  'users.bulk.delete': 'Eliminar',
  'users.bulk.activateSuccess': '{{count}} usuario(s) activado(s)',
  'users.bulk.deactivateSuccess': '{{count}} usuario(s) desactivado(s)',
  'users.bulk.deleteSuccess': '{{count}} usuario(s) eliminado(s)',
  'users.bulk.partialError': 'Algunas operaciones no pudieron completarse',

  // Confirmaciones (modal §6.6)
  'users.deleteTitle': 'Eliminar usuario',
  'users.deleteDescription': 'Esta acción es irreversible y no se puede deshacer.',
  'users.deleteConfirm': 'Eliminar',
  'users.deleteSuccess': 'Usuario eliminado correctamente',
  'users.deleteError': 'Error al eliminar el usuario',
  'users.bulkDeleteTitle': 'Eliminar usuarios seleccionados',
  'users.bulkDeleteDescription':
    'Se eliminarán {{count}} usuario(s). Esta acción es irreversible.',

  // Estados de datos (§6.7)
  'users.empty.title': 'Sin usuarios',
  'users.empty.description': 'Crea el primer usuario para comenzar a gestionar accesos.',
  'users.empty.searchTitle': 'Sin resultados',
  'users.empty.searchDescription': 'Ajusta la búsqueda o los filtros e inténtalo de nuevo.',
  'users.error.title': 'Error al cargar usuarios',

  // Roles (gestión)
  'users.roles.manageDescription': 'Asigna o remueve los roles de este usuario.',
  'users.roles.searchPlaceholder': 'Buscar roles…',
  'users.roles.lastActiveAt': 'Última actividad',
  'users.roles.activeNow': 'Activo ahora',
  'users.roles.permission.orgConfig': 'Gestiona configuraciones a nivel de organización',
  'users.roles.permission.inviteMembers': 'Invita y desactiva miembros del equipo',
  'users.roles.permission.securitySSO': 'Configura seguridad y proveedores SSO',
  'users.roles.saveChanges': 'Guardar Cambios',
  'users.roles.allAssigned': 'Todos los roles ya están asignados.',
}

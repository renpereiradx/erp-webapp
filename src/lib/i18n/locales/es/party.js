/**
 * Traducciones del dominio Party (campos compartidos entre clientes y
 * proveedores): tipo de documento, nacionalidad y dirección estructurada.
 */

export const party = {
  // Campos compartidos
  'party.field.document_type': 'Tipo de documento',
  'party.field.nationality': 'Nacionalidad',
  'party.field.address_section': 'Dirección',
  'party.field.address_street': 'Calle y número',
  'party.field.address_city': 'Ciudad',
  'party.field.address_state': 'Departamento / Estado',
  'party.field.address_zip_code': 'Código postal',
  'party.field.address_country': 'País',
  'party.select.placeholder': 'Sin especificar',

  // Registro rápido de cliente (POS)
  'party.quick_client.title': 'Registro rápido de cliente',
  'party.quick_client.subtitle': 'Datos mínimos para continuar la venta',
  'party.quick_client.action': 'Nuevo cliente',
  'party.quick_client.empty_cta': '¿No lo encontrás? Registralo como nuevo cliente',
  'party.quick_client.field.first_name': 'Nombre',
  'party.quick_client.field.last_name': 'Apellido',
  'party.quick_client.field.document_id': 'Número de documento',
  'party.quick_client.field.phone': 'Teléfono (opcional)',
  'party.quick_client.placeholder.first_name': 'Ingrese el nombre',
  'party.quick_client.placeholder.last_name': 'Ingrese el apellido',
  'party.quick_client.placeholder.document_id': 'Ej: 1234567',
  'party.quick_client.placeholder.phone': 'Ej: 0981 123 456',
  'party.quick_client.submit': 'Registrar cliente',
  'party.quick_client.processing': 'Registrando...',
  'party.quick_client.error.first_name': 'El nombre es requerido',
  'party.quick_client.error.last_name': 'El apellido es requerido',
  'party.quick_client.error.document_type': 'El tipo de documento es requerido',
  'party.quick_client.error.document_id': 'El número de documento es requerido',
  'party.quick_client.error.generic': 'Error al registrar el cliente',

  // Tipos de documento (whitelist del backend, en mayúsculas)
  'party.document_type.CI': 'Cédula de Identidad',
  'party.document_type.RUC': 'RUC',
  'party.document_type.PASSPORT': 'Pasaporte',
  'party.document_type.CPF': 'CPF (Brasil)',
  'party.document_type.CNPJ': 'CNPJ (Brasil)',
  'party.document_type.DNI': 'DNI (Argentina)',
  'party.document_type.CUIT': 'CUIT (Argentina)',
  'party.document_type.SSN': 'SSN (EE.UU.)',
  'party.document_type.EIN': 'EIN (EE.UU.)',
  'party.document_type.ID_CARD': 'Carné de identidad',
  'party.document_type.TIN': 'TIN',
  'party.document_type.OTHER': 'Otro',
}

import { z } from 'zod';
import { normalizeDocumentType } from './identity';

/**
 * Formulario de cliente (creación/edición desde el directorio).
 * Los mensajes del schema son claves i18n; el dominio no conoce el idioma.
 */
export const clientFormSchema = z.object({
  name: z.string().min(1, 'clients.modal.error.name_required'),
  last_name: z.string().min(1, 'clients.modal.error.last_name_required'),
  document_id: z.string().min(1, 'clients.modal.error.document_required'),
  document_type: z.string(),
  contact: z.string(),
  nationality: z.string(),
  address_street: z.string(),
  address_city: z.string(),
  address_state: z.string(),
  address_zip_code: z.string(),
  address_country: z.string(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

/** Cliente tal como llega del store/backend (campos con variantes legacy). */
export interface ClientInput {
  id?: string | number;
  _key?: string | number;
  name?: string;
  last_name?: string;
  displayName?: string;
  document_type?: string;
  document_id?: string;
  tax_id?: string;
  nationality?: string;
  user_id?: string;
  created_at?: string;
  status?: boolean | string;
  contact?: { phone?: string; email?: string; raw?: string };
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
}

export const EMPTY_CLIENT_FORM: ClientFormValues = {
  name: '',
  last_name: '',
  document_type: '',
  document_id: '',
  contact: '',
  nationality: '',
  address_street: '',
  address_city: '',
  address_state: '',
  address_zip_code: '',
  address_country: '',
};

export const normalizeClientForForm = (client?: ClientInput | null): ClientFormValues => {
  if (!client) return { ...EMPTY_CLIENT_FORM };

  // Si solo tenemos displayName, intentar separar nombre y apellido.
  let firstName = client.name || '';
  let lastName = client.last_name || '';
  if (client.displayName && !client.last_name) {
    const parts = client.displayName.split(' ');
    firstName = parts[0] || '';
    lastName = parts.slice(1).join(' ') || '';
  }

  return {
    name: firstName,
    last_name: lastName,
    document_type: normalizeDocumentType(client.document_type) || '',
    document_id: client.document_id || client.tax_id || '',
    contact: client.contact?.phone || client.contact?.email || client.contact?.raw || '',
    nationality: client.nationality || '',
    address_street: client.address_street || '',
    address_city: client.address_city || '',
    address_state: client.address_state || '',
    address_zip_code: client.address_zip_code || '',
    address_country: client.address_country || '',
  };
};

/**
 * Payload para la API. Los campos extendidos (document_type, nationality,
 * address_*) solo se envían con valor: en create el backend los valida, y en
 * update nil = dejar sin cambiar.
 */
export const buildClientPayload = (values: ClientFormValues): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    last_name: values.last_name.trim(),
    document_id: values.document_id.trim(),
    contact: values.contact.trim() || undefined,
  };

  if (values.document_type) payload.document_type = values.document_type;
  if (values.nationality) payload.nationality = values.nationality;

  const address: Record<string, string> = {
    address_street: values.address_street.trim(),
    address_city: values.address_city.trim(),
    address_state: values.address_state.trim(),
    address_zip_code: values.address_zip_code.trim(),
    address_country: values.address_country,
  };
  for (const [key, value] of Object.entries(address)) {
    if (value) payload[key] = value;
  }

  return payload;
};

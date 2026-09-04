import { z } from 'zod';

/**
 * Formulario de proveedor (creación/edición desde el directorio).
 * Los mensajes del schema son claves i18n; el dominio no conoce el idioma.
 */
export const supplierFormSchema = z.object({
  name: z.string().min(1, 'supplier.form.error.name_required'),
  taxId: z.string().min(1, 'supplier.form.error.tax_required'),
  contactEmail: z
    .string()
    .refine(
      (value) => !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
      'supplier.form.error.email_invalid',
    ),
  contactPhone: z.string(),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressZipCode: z.string(),
  addressCountry: z.string(),
});

export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

/** Proveedor tal como llega del store/backend (campos con variantes legacy). */
export interface SupplierInput {
  id?: string | number;
  _key?: string | number;
  name?: string;
  status?: boolean;
  taxId?: string;
  tax_id?: string;
  user_id?: string;
  userId?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  metadata?: { notes?: string };
  contact?: { email?: string; phone?: string; phone_number?: string; address?: string; addressLine?: string; street?: string; city?: string; country?: string };
  contact_info?: SupplierInput['contact'];
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_zip_code?: string;
  address_country?: string;
  address?: string;
  contactAddress?: string;
}

export const EMPTY_SUPPLIER_FORM: SupplierFormValues = {
  name: '',
  taxId: '',
  contactEmail: '',
  contactPhone: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressZipCode: '',
  addressCountry: '',
};

const EMPTY_SUPPLIER_FORM_ADDRESS = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
};

const parseAddressTextFromSupplier = (supplier: SupplierInput): string => {
  const contact = supplier.contact || {};
  const contactInfo = supplier.contact_info || {};
  // En runtime address puede ser string u objeto (según el origen del dato).
  const source: any =
    contact.address ||
    contactInfo.address ||
    contact.addressLine ||
    contactInfo.addressLine;
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object') {
    const { street, city, state, country } = source as Record<string, string>;
    return [street, city, state, country].filter(Boolean).join(', ');
  }
  if (contact.city || contact.country || contact.street) {
    return [contact.street, contact.city, contact.country]
      .filter(Boolean)
      .join(', ');
  }
  return '';
};

/**
 * Dirección estructurada desde las columnas address_* del party; si el
 * proveedor legacy solo tiene texto en contact_info.address, va a la calle.
 */
export const resolveAddressFromSupplier = (supplier?: SupplierInput | null) => {
  if (!supplier) return { ...EMPTY_SUPPLIER_FORM_ADDRESS };
  return {
    street: supplier.address_street || parseAddressTextFromSupplier(supplier),
    city: supplier.address_city || '',
    state: supplier.address_state || '',
    zipCode: supplier.address_zip_code || '',
    country: supplier.address_country || '',
  };
};

export const normalizeSupplierForForm = (supplier?: SupplierInput | null): SupplierFormValues => {
  if (!supplier) return { ...EMPTY_SUPPLIER_FORM };
  const contact = supplier.contact || supplier.contact_info || {};
  const address = resolveAddressFromSupplier(supplier);
  return {
    name: supplier.name || '',
    taxId: supplier.taxId || supplier.tax_id || '',
    contactEmail: contact.email || '',
    contactPhone: contact.phone || contact.phone_number || '',
    addressStreet: address.street,
    addressCity: address.city,
    addressState: address.state,
    addressZipCode: address.zipCode,
    addressCountry: address.country,
  };
};

const sanitizeContact = ({ email, phone }: { email: string; phone: string }) => {
  const contact: Record<string, string> = {};
  if (email) contact.email = email;
  if (phone) contact.phone = phone;
  return Object.keys(contact).length > 0 ? contact : undefined;
};

/**
 * Payload para la API. La dirección estructurada solo envía claves con valor
 * (vacío = no enviar; en update nil = dejar sin cambiar).
 */
export const buildSupplierPayload = (
  values: SupplierFormValues,
  supplier?: SupplierInput | null,
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    tax_id: values.taxId.trim(),
  };

  const contactInfo = sanitizeContact({
    email: values.contactEmail.trim(),
    phone: values.contactPhone.trim(),
  });
  if (contactInfo) payload.contact_info = contactInfo;

  const address: Record<string, string> = {
    address_street: values.addressStreet.trim(),
    address_city: values.addressCity.trim(),
    address_state: values.addressState.trim(),
    address_zip_code: values.addressZipCode.trim(),
    address_country: values.addressCountry,
  };
  for (const [key, value] of Object.entries(address)) {
    if (value) payload[key] = value;
  }

  if (supplier && typeof supplier.status !== 'undefined') {
    payload.status = supplier.status;
  }

  return payload;
};

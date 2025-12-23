import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import supplierService from '@/services/supplierService'
import { telemetry } from '@/utils/telemetry'

const parseMaybeJson = value => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const normalizeContact = rawContact => {
  const parsed = parseMaybeJson(rawContact) || {}
  if (typeof parsed !== 'object') {
    return {
      raw: rawContact,
    }
  }

  const { address: addressRaw, location, ...rest } = parsed

  const contact = {
    email: rest.email || rest.mail || rest.emailAddress || '',
    phone:
      rest.phone ||
      rest.phone_number ||
      rest.telefono ||
      rest.contact_phone ||
      '',
    secondaryPhone: rest.secondary_phone || rest.mobile || '',
    raw: rawContact,
  }

  const addressSource =
    addressRaw || location || rest.addressLine || rest.address
  if (typeof addressSource === 'string') {
    contact.address = addressSource
  } else if (addressSource && typeof addressSource === 'object') {
    const { street, street1, street2, city, state, country, zip } =
      addressSource
    contact.address = [street, street1, street2, city, state, zip, country]
      .filter(Boolean)
      .join(', ')
    contact.street = street || street1 || ''
    contact.city = city || ''
    contact.state = state || ''
    contact.country = country || ''
    contact.zip = zip || ''
  } else {
    contact.address = [rest.street, rest.city, rest.country]
      .filter(Boolean)
      .join(', ')
    contact.street = rest.street || ''
    contact.city = rest.city || ''
    contact.country = rest.country || ''
  }

  return contact
}

const normalizeSupplier = supplier => {
  if (!supplier || typeof supplier !== 'object') return null

  const lowerEntries = Object.fromEntries(
    Object.entries(supplier).map(([key, value]) => [key.toLowerCase(), value])
  )

  const id =
    supplier.id ??
    supplier.ID ??
    supplier.supplier_id ??
    lowerEntries.id ??
    lowerEntries.supplier_id
  if (!id && id !== 0) return null

  const name =
    supplier.name ??
    supplier.displayName ??
    lowerEntries.name ??
    'Proveedor sin nombre'
  const taxId =
    supplier.tax_id ??
    supplier.taxId ??
    supplier.ruc ??
    lowerEntries.tax_id ??
    ''
  const statusValue = Object.prototype.hasOwnProperty.call(supplier, 'status')
    ? Boolean(supplier.status)
    : Object.prototype.hasOwnProperty.call(lowerEntries, 'status')
    ? Boolean(lowerEntries.status)
    : true

  const createdAt =
    supplier.created_at ?? supplier.createdAt ?? lowerEntries.created_at ?? null
  const updatedAt =
    supplier.updated_at ??
    supplier.updatedAt ??
    lowerEntries.updated_at ??
    createdAt

  const contactInfo =
    supplier.contact_info ??
    supplier.contactInfo ??
    supplier.contact ??
    lowerEntries.contact_info
  const contact = normalizeContact(contactInfo)

  const metadata = supplier.metadata ?? lowerEntries.metadata ?? {}

  return {
    ...supplier,
    id,
    name,
    displayName: name,
    taxId,
    tax_id: taxId,
    status: statusValue,
    created_at: createdAt,
    updated_at: updatedAt,
    contact,
    user_id:
      supplier.user_id ??
      supplier.userId ??
      lowerEntries.user_id ??
      lowerEntries.userid,
    metadata,
    _key: String(id),
  }
}

const mergeSupplierIntoCollection = (collection, supplier) => {
  const normalized = supplier ? normalizeSupplier(supplier) : null
  if (!normalized) return collection
  const index = collection.findIndex(item => item.id === normalized.id)
  if (index === -1) {
    return [...collection, normalized]
  }
  const next = collection.slice()
  next[index] = { ...next[index], ...normalized }
  return next
}

const markSupplierStatus = (collection, supplierId, status) =>
  collection.map(supplier =>
    supplier.id === supplierId ? { ...supplier, status } : supplier
  )

const useSupplierDirectoryStore = create()(
  devtools(
    (set, get) => ({
      suppliers: [],
      searchResults: [],
      lastSearchTerm: '',
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      searchSuppliers: async term => {
        const trimmed = (term || '').trim()
        if (!trimmed) {
          set({ searchResults: [], lastSearchTerm: '', loading: false })
          return []
        }

        set({ loading: true, error: null })
        try {
          let response
          if (/^\d+$/.test(trimmed)) {
            const result = await supplierService.getById(trimmed)
            response = result ? [result] : []
          } else {
            if (trimmed.length < 2) {
              set({ loading: false })
              return []
            }
            const result = await supplierService.searchByName(trimmed)
            response = Array.isArray(result) ? result : result ? [result] : []
          }

          const normalized = response.map(normalizeSupplier).filter(Boolean)
          set({
            searchResults: normalized,
            lastSearchTerm: trimmed,
            loading: false,
          })
          telemetry.record('supplier.directory.search.success', {
            term: trimmed,
            results: normalized.length,
          })
          return normalized
        } catch (error) {
          telemetry.record('supplier.directory.search.error', {
            term: trimmed,
            error: error?.message,
          })
          set({
            error: error?.message || 'Error al buscar proveedores',
            loading: false,
            searchResults: [],
          })
          throw error
        }
      },

      getSupplierById: async id => {
        if (!id) return null
        try {
          const result = await supplierService.getById(id)
          const normalized = normalizeSupplier(result)
          if (normalized) {
            set(state => ({
              suppliers: mergeSupplierIntoCollection(
                state.suppliers,
                normalized
              ),
              searchResults: mergeSupplierIntoCollection(
                state.searchResults,
                normalized
              ),
            }))
          }
          return normalized
        } catch (error) {
          telemetry.record('supplier.directory.getById.error', {
            id,
            error: error?.message,
          })
          throw error
        }
      },

      createSupplier: async payload => {
        try {
          const result = await supplierService.create(payload)
          telemetry.record('supplier.directory.create.success', {
            hasContact: Boolean(payload?.contact_info),
          })
          return { success: true, data: result }
        } catch (error) {
          telemetry.record('supplier.directory.create.error', {
            error: error?.message,
          })
          set({ error: error?.message || 'Error al crear proveedor' })
          return { success: false, error: error?.message }
        }
      },

      updateSupplier: async (id, payload) => {
        try {
          const result = await supplierService.update(id, payload)
          const latest = await get()
            .getSupplierById(id)
            .catch(() => null)
          set(state => ({
            suppliers: latest
              ? mergeSupplierIntoCollection(state.suppliers, latest)
              : state.suppliers,
            searchResults: latest
              ? mergeSupplierIntoCollection(state.searchResults, latest)
              : state.searchResults,
          }))
          telemetry.record('supplier.directory.update.success', {
            id,
            hasContact: Boolean(payload?.contact_info),
          })
          return { success: true, data: result }
        } catch (error) {
          telemetry.record('supplier.directory.update.error', {
            id,
            error: error?.message,
          })
          set({ error: error?.message || 'Error al actualizar proveedor' })
          return { success: false, error: error?.message }
        }
      },

      deleteSupplier: async id => {
        try {
          const result = await supplierService.delete(id)
          set(state => ({
            suppliers: markSupplierStatus(state.suppliers, id, false),
            searchResults: markSupplierStatus(state.searchResults, id, false),
          }))
          telemetry.record('supplier.directory.delete.success', { id })
          return { success: true, data: result }
        } catch (error) {
          telemetry.record('supplier.directory.delete.error', {
            id,
            error: error?.message,
          })
          set({ error: error?.message || 'Error al desactivar proveedor' })
          return { success: false, error: error?.message }
        }
      },

      reactivateSupplier: async id => {
        try {
          const result = await supplierService.update(id, { status: true })
          const latest = await get()
            .getSupplierById(id)
            .catch(() => null)
          set(state => ({
            suppliers: markSupplierStatus(
              latest
                ? mergeSupplierIntoCollection(state.suppliers, latest)
                : state.suppliers,
              id,
              true
            ),
            searchResults: markSupplierStatus(
              latest
                ? mergeSupplierIntoCollection(state.searchResults, latest)
                : state.searchResults,
              id,
              true
            ),
          }))
          telemetry.record('supplier.directory.reactivate.success', { id })
          return { success: true, data: result }
        } catch (error) {
          telemetry.record('supplier.directory.reactivate.error', {
            id,
            error: error?.message,
          })
          set({ error: error?.message || 'Error al reactivar proveedor' })
          return { success: false, error: error?.message }
        }
      },

      refreshAfterMutation: async () => {
        const { lastSearchTerm } = get()
        if (lastSearchTerm) {
          try {
            await get().searchSuppliers(lastSearchTerm)
          } catch {
            // Silenciar fallos en refresco para no bloquear UX
          }
        }
      },
    }),
    { name: 'supplier-directory-store' }
  )
)

export default useSupplierDirectoryStore

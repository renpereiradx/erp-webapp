import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { clientService } from '../services/clientService'
import { telemetry } from '../utils/telemetry'
// Demo deshabilitado: se retira soporte condicional

// Helper function to normalize client data
const normalizeClient = c => {
  if (!c || typeof c !== 'object') return null
  
  const id = c.id || c.ID || c.client_id || c._id
  const name = c.name || c.client_name || 'Cliente'
  const lastName = c.last_name || c.lastName || ''
  const documentId = c.document_id || c.documentId || c.tax_id || ''
  const status = c.status !== undefined ? c.status : true
  
  let contactObj = { email: '', phone: '' }
  if (c.contact && typeof c.contact === 'object') {
    contactObj = {
      email: c.contact.email || '',
      phone: c.contact.phone || '',
      ...c.contact
    }
  } else if (typeof c.contact === 'string') {
    contactObj = c.contact.includes('@') 
      ? { email: c.contact, phone: '' } 
      : { email: '', phone: c.contact }
  }

  const displayName = [name, lastName].filter(Boolean).join(' ').trim()

  return {
    ...c,
    id,
    name,
    lastName,
    displayName,
    document_id: documentId,
    tax_id: documentId,
    status,
    contact: contactObj,
    created_at: c.created_at || new Date().toISOString(),
    updated_at: c.updated_at || c.created_at || new Date().toISOString(),
  }
}

const useClientStore = create()(
  devtools(
    (set, get) => ({
      // ... (existing state)
      clients: [],
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalClients: 0,
      searchTerm: '',
      lastSearchTerm: '',
      searchResults: [],
      loading: false,
      error: null,

      fetchClients: async (page = 1, pageSize = 10) => {
        set({ loading: true, error: null })
        try {
          const response = await clientService.getAll(page, pageSize)
          const rawClients = response.clients || response.data || (Array.isArray(response) ? response : [])
          const total = response.total || response.totalClients || rawClients.length
          
          const normalized = rawClients.map(normalizeClient).filter(Boolean)
          
          set({ 
            clients: normalized, 
            totalClients: total,
            totalPages: Math.ceil(total / pageSize),
            loading: false 
          })
          return normalized
        } catch (e) {
          set({ error: e.message || 'Error al cargar clientes', loading: false })
          throw e
        }
      },

      searchClients: async term => {
        const trimmed = (term || '').trim()
        if (!trimmed) return []
        set({ loading: true, error: null })
        try {
          const result = await clientService.searchByName(trimmed)
          const normalized = (Array.isArray(result) ? result : [result])
            .map(normalizeClient)
            .filter(Boolean)

          set({
            searchResults: normalized,
            lastSearchTerm: trimmed,
            loading: false,
          })
          return normalized
        } catch (e) {
          set({
            error: e.message || 'Error en búsqueda',
            loading: false,
            searchResults: [],
          })
          throw e
        }
      },

      // CRUD
      createClient: async data => {
        try {
          const result = await clientService.create(data)
          return { success: true, data: result }
        } catch (e) {
          set({ error: e.message || 'Error al crear' })
          return { success: false, error: e.message }
        }
      },

      updateClient: async (id, data) => {
        try {
          const result = await clientService.update(id, data)
          return { success: true, data: result }
        } catch (e) {
          set({ error: e.message || 'Error al actualizar' })
          return { success: false, error: e.message }
        }
      },

      deleteClient: async id => {
        try {
          const result = await clientService.delete(id)
          return { success: true, data: result }
        } catch (e) {
          set({ error: e.message || 'Error al eliminar cliente' })
          return { success: false, error: e.message }
        }
      },

      // Reactivar cliente (usando update con status: true ya que la API no especifica endpoint dedicado)
      reactivateClient: async id => {
        try {
          // Para clientes usamos update directamente ya que la API no menciona endpoint específico de reactivación
          const result = await clientService.update(id, { status: true })
          return { success: true, data: result }
        } catch (error) {
          set({ error: error.message || 'Error al reactivar cliente' })
          return { success: false, error: error.message }
        }
      },
    }),
    {
      name: 'client-store',
    }
  )
)

export default useClientStore

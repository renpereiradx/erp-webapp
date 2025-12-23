import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { clientService } from '../services/clientService'
import { telemetry } from '../utils/telemetry'
// Demo deshabilitado: se retira soporte condicional

const useClientStore = create()(
  devtools(
    (set, get) => ({
      // Estado de la lista y paginación
      clients: [],
      page: 1,
      pageSize: 10,
      totalPages: 1,
      totalClients: 0,
      searchTerm: '',
      lastSearchTerm: '',

      // Resultados de búsqueda (opcional, la página puede gestionarlos localmente)
      searchResults: [],

      // Estados de carga y error
      loading: false,
      error: null,

      // Acciones básicas
      clearError: () => set({ error: null }),
      clearClients: () => set({ clients: [], searchResults: [], error: null }),

      // Acciones de paginación y búsqueda
      setPage: newPage => {
        set({ page: newPage })
      },
      setSearchTerm: term => {
        set({ searchTerm: term })
      },

      // Búsqueda avanzada por nombre o ID
      searchClients: async term => {
        const trimmed = (term || '').trim()
        if (!trimmed) return []
        // Detectar si es un ID (similar heurística a productos)
        const looksLikeId =
          /^[a-zA-Z0-9_-]{8,30}$/.test(trimmed) &&
          !/\s/.test(trimmed) &&
          trimmed.length >= 8
        set({ loading: true, error: null })
        try {
          let result
          if (looksLikeId) {
            const single = await clientService.getById(trimmed)
            result = single ? [single] : []
          } else {
            // Requerir al menos 2-3 caracteres para búsquedas por nombre
            if (trimmed.length < 2) {
              set({ loading: false })
              return []
            }
            const searchArr = await clientService.searchByName(trimmed)
            result = Array.isArray(searchArr)
              ? searchArr
              : searchArr
              ? [searchArr]
              : []
          }

          // Normalizar contacto igual que en fetchClients
          const normalizeClientSearch = c => {
            if (!c || typeof c !== 'object') return null
            const lowerMap = Object.fromEntries(
              Object.entries(c).map(([k, v]) => [k.toLowerCase(), v])
            )
            const id = c.id || c.ID || c.Id || lowerMap.id || lowerMap._id
            const name = c.name || c.Name || lowerMap.name
            const lastName =
              c.last_name ||
              c.lastName ||
              lowerMap.last_name ||
              lowerMap.lastname
            const documentId =
              c.document_id ||
              c.documentId ||
              lowerMap.document_id ||
              lowerMap.documentid
            const status =
              'status' in c
                ? c.status
                : 'status' in lowerMap
                ? lowerMap.status
                : true
            const userId = c.user_id || c.userId || lowerMap.user_id
            const contactRaw = c.contact || lowerMap.contact

            let contactObj
            if (contactRaw && typeof contactRaw === 'string') {
              const isEmail = contactRaw.includes('@')
              contactObj = {
                raw: contactRaw,
                email: isEmail ? contactRaw : '',
                phone: isEmail ? '' : contactRaw,
              }
            } else if (contactRaw && typeof contactRaw === 'object') {
              contactObj = {
                email: contactRaw.email || '',
                phone: contactRaw.phone || '',
                ...contactRaw,
              }
            } else {
              contactObj = { email: '', phone: '' }
            }

            const createdAt =
              c.created_at || lowerMap.created_at || new Date().toISOString()
            const updatedAt = c.updated_at || lowerMap.updated_at || createdAt
            const displayName =
              [name, lastName].filter(Boolean).join(' ').trim() ||
              name ||
              lastName ||
              documentId ||
              'Cliente'
            const key = id || documentId || `${displayName}-${createdAt}`

            return {
              ...c,
              id,
              name: displayName,
              displayName,
              last_name: lastName,
              document_id: documentId,
              tax_id: documentId,
              status,
              user_id: userId,
              contact: contactObj,
              created_at: createdAt,
              updated_at: updatedAt,
              address: { street: '', city: '', country: '' },
              metadata: {},
              _key: key,
            }
          }
          const normalized = result.map(normalizeClientSearch).filter(Boolean)
          const cleaned = normalized.filter(
            c => c && (c.id || c.name) && !c.error && !c.message
          )
          set({
            searchResults: cleaned,
            lastSearchTerm: trimmed,
            loading: false,
          })
          return cleaned
        } catch (e) {
          // Solo registrar errores críticos del servidor (500+)
          const statusCode = e?.status ?? e?.statusCode ?? e?.response?.status
          const isCriticalError =
            typeof statusCode === 'number' && statusCode >= 500
          if (typeof window !== 'undefined' && isCriticalError) {
            console.error('[useClientStore.searchClients] error crítico:', e)
          }
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

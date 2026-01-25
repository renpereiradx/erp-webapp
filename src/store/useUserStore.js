import { create } from 'zustand';
import { userService } from '@/services/userService';
import roleService from '@/services/roleService';

const useUserStore = create((set, get) => ({
  users: [],
  roles: [],
  pagination: {
    page: 1,
    page_size: 20,
    total_items: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false
  },
  loading: false,
  error: null,
  filters: {
    search: '',
    status: '',
    role_id: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  },
  
  // Set filters and refresh users
  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      pagination: { ...state.pagination, page: 1 } // Reset to first page
    }));
    get().fetchUsers();
  },

    // Set pagination page
  setPage: (page) => {
      set((state) => ({
          pagination: { ...state.pagination, page }
      }));
      get().fetchUsers();
  },

  // Set page size
  setPageSize: (pageSize) => {
      set((state) => ({
            pagination: { ...state.pagination, page_size: pageSize, page: 1 }
      }));
      get().fetchUsers();
  },


  fetchUsers: async () => {
    set({ loading: true, error: null });
    const { filters, pagination } = get();
    
    try {
      const params = {
        ...filters,
        page: pagination.page,
        page_size: pagination.page_size
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await userService.getUsers(params);
      
      if (response && response.success) {
        set({ 
          users: response.data || [], 
          pagination: response.pagination || get().pagination,
          loading: false 
        });
      } else {
          set({ loading: false, error: response?.error?.message || 'Error fetching users' });
      }

    } catch (error) {
      set({ loading: false, error: error.message || 'Unknown error' });
    }
  },

  fetchRoles: async () => {
    try {
      const response = await roleService.getRoles();
      if (response && response.success) {
        set({ roles: response.data || [] });
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  },

  createUser: async (userData) => {
      set({ loading: true, error: null });
      try {
          const response = await userService.createUser(userData);
          if (response && response.success) {
               // Refresh list after creation
               await get().fetchUsers();
               return { success: true };
          } else {
              set({ loading: false, error: response?.error?.message || 'Error creating user' });
              return { success: false, error: response?.error?.message || 'Error creating user' };
          }
      } catch (error) {
          set({ loading: false, error: error.message });
          return { success: false, error: error.message };
      }
  },

  updateUser: async (id, userData) => {
       set({ loading: true, error: null });
       try {
           const response = await userService.updateUser(id, userData);
           if (response && response.success) {
            set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...response.data } : u),
                loading: false
            }));
            return { success: true };
           } else {
               set({ loading: false, error: response?.error?.message || 'Error updating user' });
               return { success: false, error: response?.error?.message || 'Error updating user' };
           }
       } catch (error) {
           set({ loading: false, error: error.message });
           return { success: false, error: error.message };
       }
  },

  deleteUser: async (id) => {
       set({ loading: true, error: null });
       try {
           const response = await userService.deleteUser(id);
           if (response && response.success) {
                // If on last page and only 1 item, go back a page if possible, else refresh
                await get().fetchUsers();
                return { success: true };
           } else {
               set({ loading: false, error: response?.error?.message || 'Error deleting user' });
               return { success: false, error: response?.error?.message || 'Error deleting user' };
           }

       } catch (error) {
           set({ loading: false, error: error.message });
           return { success: false, error: error.message };
       }
  },
  
  activateUser: async (id) => {
      try {
          const response = await userService.activateUser(id);
          if (response && response.success) {
            set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, status: 'active' } : u)
            }));
            return { success: true };
          }
           return { success: false, error: response?.error?.message || 'Error activating user' };
      } catch (error) {
          return { success: false, error: error.message };
      }
  },

  deactivateUser: async (id) => {
      try {
          const response = await userService.deactivateUser(id);
          if (response && response.success) {
            set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, status: 'inactive' } : u)
            }));
            return { success: true };
          }
           return { success: false, error: response?.error?.message || 'Error deactivating user' };
      } catch (error) {
          return { success: false, error: error.message };
      }
  }


}));

export default useUserStore;

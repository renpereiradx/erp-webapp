import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import useUserStore from '@/store/useUserStore';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { CreateUserModal } from '@/components/users/CreateUserModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// MOCK_USERS removed in favor of store data

export default function UserManagementList() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { 
    users, 
    pagination, 
    loading, 
    fetchUsers, 
    setPage, 
    setPageSize,
    filters,
    setFilters
  } = useUserStore();
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const toggleSelect = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const selectedCount = selectedUsers.length;

  const handleCreateUser = async (userData) => {
    // Logic handled in modal, just refreshing list here if needed, but store handles it.
    // We can just close modal here if passed as callback, but modal will call store.
    // Actually the modal component currently takes onSubmit.
    // We will refactor modal to call store directly or pass a wrapper.
    // For now, let's keep the prop but use store inside the wrapper if we want to keep logic here,
    // OR better, update Modal to use store.
    // Let's pass a dummy for now or handle the result if we want the modal to be "dumb".
    // Better pattern: Modal calls store action.
    // But existing code expects onSubmit.
    // Let's rely on the store update.
  };

  const handleSelectAll = (checked) => {
    if (checked) {
       setSelectedUsers(users.map(u => u.id));
    } else {
       setSelectedUsers([]);
    }
  };

  return (
    <div className="user-management">
      {/* Main Content */}
      <div className="user-management__content">
        {/* Header Content moved here */}
        <div className="user-management__header-row">
          <div className="user-management__header-title">
            <h2>{t('users.title')}</h2>
            <Badge variant="secondary" style={{ border: 'none' }}>{pagination.total_items} {t('users.total')}</Badge>
          </div>
          <div className="user-management__header-actions">
            <div className="user-management__search-bar">
              <span className="material-symbols-outlined text-secondary text-xl">search</span>
              <input 
                placeholder={t('users.searchPlaceholder')} 
                type="text" 
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
            </div>
            <div className="user-management__header-buttons">
              <Button variant="subtle" size="icon">
                <span className="material-symbols-outlined">notifications</span>
              </Button>
              <Button variant="primary" size="lg" onClick={() => setIsCreateModalOpen(true)}>
                <span className="material-symbols-outlined text-lg">person_add</span>
                <span>{t('users.addUser')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Command Bar / Toolbar */}
        <div className="user-management__toolbar">
          <div className="user-management__filter-group">
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">filter_list</span>
              <span>{t('users.filterRole')}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </Button>
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              <span>{t('users.filterStatus')}</span>
              <span className="material-symbols-outlined text-sm text-primary">expand_more</span>
            </Button>
            <Button variant="outline" className="h-auto">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              <span>{t('users.filterLastActive')}</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </Button>
            <div className="h-6 w-px bg-subtle mx-2"></div>
            <Button variant="text" className="h-auto px-0 font-bold hover:underline">{t('users.clearAll')}</Button>
          </div>
          <div className="user-management__action-group">
            <Button variant="ghost" className="h-auto">
              <span className="material-symbols-outlined text-lg">download</span>
              <span>{t('users.export')}</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-auto w-auto">
              <span className="material-symbols-outlined text-lg">more_horiz</span>
            </Button>
          </div>
        </div>

        {/* Selected Actions Bar */}
        {selectedCount > 0 && (
          <div className="user-management__selection-bar">
            <div className="user-management__selection-actions">
              <span className="text-sm font-semibold text-primary">{t('users.selectedUsers', { count: selectedCount })}</span>
              <div className="h-4 w-px bg-primary opacity-20"></div>
              <div className="user-management__selection-buttons">
                <Button variant="secondary" size="sm">
                  <span className="material-symbols-outlined text-base">check</span> {t('users.activate')}
                </Button>
                <Button variant="secondary" size="sm">
                  <span className="material-symbols-outlined text-base">block</span> {t('users.deactivate')}
                </Button>
                <Button variant="destructive" size="sm">
                  <span className="material-symbols-outlined text-base">delete</span> {t('users.delete')}
                </Button>
              </div>
            </div>
            <button className="text-secondary hover:text-primary border-none bg-transparent cursor-pointer" onClick={() => setSelectedUsers([])}>
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Data Grid */}
        <div className="user-management__grid-container">
          <div className="user-management__grid-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center h-auto">
                    <input 
                      className="user-management__checkbox" 
                      type="checkbox" 
                      checked={selectedCount > 0 && selectedCount === users.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">{t('users.table.user')}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">{t('users.table.role')}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">{t('users.table.status')}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-wider h-auto">{t('users.table.lastActive')}</TableHead>
                  <TableHead className="w-20 h-auto"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                    </TableRow>
                ) : users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className={selectedUsers.includes(user.id) ? "fluent-grid-selected" : ""} 
                    aria-selected={selectedUsers.includes(user.id)}
                  >
                    <TableCell className="text-center">
                      <input 
                        className="user-management__checkbox" 
                        type="checkbox" 
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleSelect(user.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="user-management__user-cell">
                        <Avatar size={32}>
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="user-management__user-info">
                          <p className="user-management__user-name">{user.first_name} {user.last_name}</p>
                          <p className="user-management__user-email">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                      {user.roles?.map(role => (
                          <Badge key={role.id} variant={role.id === "admin" ? "subtle-info" : "subtle-primary"}>
                            {role.name}
                          </Badge>
                      ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`user-management__status ${user.status === 'active' ? 'user-management__status--active' : 'user-management__status--inactive'}`}>
                        {user.status === 'active' ? t('users.status.active') : t('users.status.inactive')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-secondary">
                        {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString() 
                            : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <span className="material-symbols-outlined text-secondary">more_vert</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => navigate(`/usuarios/${user.id}`)}>
                            <span className="material-symbols-outlined mr-2 text-sm">visibility</span>
                            {t('users.actions.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <span className="material-symbols-outlined mr-2 text-sm">edit</span>
                            {t('users.actions.edit')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <span className="material-symbols-outlined mr-2 text-sm">delete</span>
                            {t('users.actions.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer / Pagination */}
          <div className="user-management__pagination">
            <div className="user-management__pagination-info">
              <span className="text-sm text-secondary">
                {t('users.showing')} <span className="font-semibold text-primary">{(pagination.page - 1) * pagination.page_size + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total_items)}</span> {t('users.of')} {pagination.total_items} {t('users.total').toLowerCase()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">{t('users.rowsPerPage')}</span>
                <select 
                    className="user-management__rows-select"
                    value={pagination.page_size}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="user-management__pagination-controls">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-9 text-secondary"
                disabled={!pagination.has_prev}
                onClick={() => setPage(1)}
              >
                <span className="material-symbols-outlined">first_page</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-9 text-secondary"
                disabled={!pagination.has_prev}
                onClick={() => setPage(pagination.page - 1)}
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </Button>
              
              <div className="flex gap-1 px-2 items-center text-sm font-medium">
                {t('users.page')} {pagination.page} {t('users.of')} {pagination.total_pages}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="size-9 text-secondary"
                disabled={!pagination.has_next}
                onClick={() => setPage(pagination.page + 1)}
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-9 text-secondary"
                disabled={!pagination.has_next}
                onClick={() => setPage(pagination.total_pages)}
              >
                <span className="material-symbols-outlined">last_page</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}

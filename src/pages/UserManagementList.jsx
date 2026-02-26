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
import { EditUserModal } from '@/components/users/EditUserModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronDown, 
  Download, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  Calendar,
  CheckCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export default function UserManagementList() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { 
    users, roles, pagination, loading, fetchUsers, fetchRoles,
    setPage, setPageSize, filters, setFilters, deleteUser
  } = useUserStore();
  
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  React.useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const toggleSelect = (id) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]);
  };

  const selectedCount = selectedUsers.length;

  const handleEditClick = (user) => {
    setUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (user) => {
    if (window.confirm(t('users.confirmDelete', { name: `${user.first_name} ${user.last_name}` }) || `¿Estás seguro de eliminar a ${user.first_name}?`)) {
      await deleteUser(user.id);
    }
  };

  const handleSelectAll = (checked) => {
    setSelectedUsers(checked ? users.map(u => u.id) : []);
  };

  return (
    <div className="min-h-screen bg-background-light p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 border-l-4 border-primary pl-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">{t('users.title')}</h1>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-wider h-5 px-2">{pagination.total_items} {t('users.total')}</Badge>
          </div>
          <p className="text-text-secondary text-sm font-medium mt-1">Administra accesos, roles y seguridad de la plataforma.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 border-border-subtle font-bold uppercase text-[11px] tracking-widest bg-white">
            <Download size={18} className="mr-2 text-slate-400" />{t('users.export')}
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest px-6 h-11">
            <Plus size={18} className="mr-2" />{t('users.addUser')}
          </Button>
        </div>
      </header>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
            <input 
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-border-subtle bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm font-medium"
              placeholder={t('users.searchPlaceholder')} 
              type="text" 
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 border-border-subtle bg-white text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary">
                  <Filter className="size-4 mr-2" />
                  {filters.role_id ? (roles.find(r => r.id === filters.role_id)?.name) : t('users.filterRole')}
                  <ChevronDown className="size-3 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl shadow-fluent-16">
                <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider" onClick={() => setFilters({ role_id: '' })}>{t('users.filterRole')} (Todos)</DropdownMenuItem>
                <DropdownMenuSeparator />
                {roles.map(role => (
                  <DropdownMenuItem key={role.id} className="text-xs font-medium" onClick={() => setFilters({ role_id: role.id })}>{role.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-11 border-border-subtle bg-white text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-primary">
                  <CheckCircle className="size-4 mr-2" />
                  {filters.status ? t(`users.status.${filters.status}`) : t('users.filterStatus')}
                  <ChevronDown className="size-3 ml-2 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-fluent-16">
                <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider" onClick={() => setFilters({ status: '' })}>{t('users.filterStatus')} (Todos)</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs font-medium" onClick={() => setFilters({ status: 'active' })}>{t('users.status.active')}</DropdownMenuItem>
                <DropdownMenuItem className="text-xs font-medium" onClick={() => setFilters({ status: 'inactive' })}>{t('users.status.inactive')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" className="h-11 text-xs font-black text-slate-400 hover:text-primary uppercase tracking-widest px-4" onClick={() => setFilters({ search: '', status: '', role_id: '' })}>{t('users.clearAll')}</Button>
          </div>
        </div>

        {/* Multi-selection bar */}
        {selectedCount > 0 && (
          <div className="p-2 bg-primary/5 border border-primary/10 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-4 px-2">
              <span className="text-xs font-black text-primary uppercase tracking-widest">{t('users.selectedUsers', { count: selectedCount })}</span>
              <div className="w-px h-4 bg-primary/20"></div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-primary hover:bg-primary/10">Activar</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-100">Desactivar</Button>
                <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-error hover:bg-error/10">Eliminar</Button>
              </div>
            </div>
            <button className="p-1 hover:bg-primary/10 rounded-full text-primary" onClick={() => setSelectedUsers([])}><X size={16} /></button>
          </div>
        )}
      </div>

      {/* Data Grid */}
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-white shadow-fluent-2">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-12 px-6 text-center"><input type="checkbox" className="rounded border-slate-300 text-primary" checked={selectedCount > 0 && selectedCount === users.length} onChange={(e) => handleSelectAll(e.target.checked)} /></TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('users.table.user')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('users.table.role')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('users.table.status')}</TableHead>
              <TableHead className="text-[11px] font-black uppercase tracking-wider text-slate-500 py-4 px-6">{t('users.table.lastActive')}</TableHead>
              <TableHead className="w-20 px-6 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Cargando Usuarios...</TableCell></TableRow>
            ) : users.map((user) => (
              <TableRow key={user.id} className={`hover:bg-slate-50 transition-colors group ${selectedUsers.includes(user.id) ? 'bg-primary/5' : ''}`}>
                <TableCell className="px-6 text-center"><input type="checkbox" className="rounded border-slate-300 text-primary" checked={selectedUsers.includes(user.id)} onChange={() => toggleSelect(user.id)} /></TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">{user.first_name?.[0]}{user.last_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-text-main truncate leading-none">{user.first_name} {user.last_name}</span>
                      <span className="text-[10px] text-text-secondary font-medium truncate mt-1">@{user.username} • {user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    {user.roles?.map(role => (
                      <Badge key={role.id} className={`border-none text-[9px] font-black uppercase tracking-wider h-5 ${role.id === "admin" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"}`}>{role.name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-500'}`}>
                    <span className={`size-1.5 rounded-full ${user.status === 'active' ? 'bg-success' : 'bg-slate-400'}`}></span>
                    {user.status === 'active' ? t('users.status.active') : t('users.status.inactive')}
                  </span>
                </TableCell>
                <TableCell className="py-4 px-6">
                  <span className="text-xs font-bold text-slate-400">{user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Nunca'}</span>
                </TableCell>
                <TableCell className="py-4 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-primary group-hover:opacity-100 opacity-0 transition-opacity">
                        <MoreVertical size={18} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-fluent-16">
                      <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider" onClick={() => navigate(`/usuarios/${user.id}`)}><Eye size={14} className="mr-2" />{t('users.actions.view')}</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider" onClick={() => handleEditClick(user)}><Edit size={14} className="mr-2" />{t('users.actions.edit')}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider text-error focus:text-error focus:bg-error/5" onClick={() => handleDeleteClick(user)}><Trash2 size={14} className="mr-2" />{t('users.actions.delete')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {t('users.showing')} <span className="text-text-main">{(pagination.page - 1) * pagination.page_size + 1}-{Math.min(pagination.page * pagination.page_size, pagination.total_items)}</span> {t('users.of')} {pagination.total_items} registros
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t('users.rowsPerPage')}</span>
              <select className="h-8 rounded border-border-subtle bg-white text-[10px] font-bold px-2" value={pagination.page_size} onChange={(e) => setPageSize(parseInt(e.target.value))}>
                {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={!pagination.has_prev} onClick={() => setPage(1)}><ChevronsLeft size={14} /></Button>
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={!pagination.has_prev} onClick={() => setPage(pagination.page - 1)}><ChevronLeft size={14} /></Button>
              <div className="px-3 text-[10px] font-black uppercase tracking-widest">{t('users.page')} {pagination.page} / {pagination.total_pages}</div>
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={!pagination.has_next} onClick={() => setPage(pagination.page + 1)}><ChevronRight size={14} /></Button>
              <Button variant="outline" size="icon" className="size-8 rounded-lg" disabled={!pagination.has_next} onClick={() => setPage(pagination.total_pages)}><ChevronsRight size={14} /></Button>
            </div>
          </div>
        </div>
      </div>

      <CreateUserModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
      <EditUserModal user={userToEdit} open={isEditModalOpen} onOpenChange={setIsEditModalOpen} />
    </div>
  );
}

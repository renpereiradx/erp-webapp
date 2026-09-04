import { CheckCircle, ChevronDown, Filter, Search, X } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Role, TFn, UsersFilters } from '../types';

interface UsersToolbarProps {
  filters: UsersFilters;
  roles: Role[];
  selectedCount: number;
  onFiltersChange: (filters: Partial<UsersFilters>) => void;
  onClearFilters: () => void;
  onBulkActivate: () => void;
  onBulkDeactivate: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

/** Search + role/status filters + bulk-selection action bar. */
export function UsersToolbar({
  filters,
  roles,
  selectedCount,
  onFiltersChange,
  onClearFilters,
  onBulkActivate,
  onBulkDeactivate,
  onBulkDelete,
  onClearSelection,
}: UsersToolbarProps) {
  const { t } = useI18n() as unknown as { t: TFn };

  const selectedRole = roles.find((role) => role.id === filters.role_id);
  const hasFilters = Boolean(filters.search || filters.status || filters.role_id);

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-md space-y-md">
      <div className="flex flex-col xl:flex-row xl:items-center gap-md">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline" />
          <label htmlFor="users-search" className="sr-only">
            {t('users.searchPlaceholder', 'Buscar usuarios, correos, ID...')}
          </label>
          <Input
            id="users-search"
            type="text"
            className="w-full pl-10"
            placeholder={t('users.searchPlaceholder', 'Buscar usuarios, correos, ID...')}
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10">
                <Filter className="size-4 mr-xs" />
                {selectedRole?.name ?? t('users.filter.roleAll', 'Todos los roles')}
                <ChevronDown className="size-3 ml-xs opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-md shadow-fluent-8">
              <DropdownMenuItem onClick={() => onFiltersChange({ role_id: '' })}>
                {t('users.filter.roleAll', 'Todos los roles')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {roles.map((role) => (
                <DropdownMenuItem key={role.id} onClick={() => onFiltersChange({ role_id: role.id })}>
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="h-10">
                <CheckCircle className="size-4 mr-xs" />
                {filters.status
                  ? t(`users.status.${filters.status}`, filters.status)
                  : t('users.filter.statusAll', 'Todos los estados')}
                <ChevronDown className="size-3 ml-xs opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 rounded-md shadow-fluent-8">
              <DropdownMenuItem onClick={() => onFiltersChange({ status: '' })}>
                {t('users.filter.statusAll', 'Todos los estados')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFiltersChange({ status: 'active' })}>
                {t('users.status.active', 'Activo')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFiltersChange({ status: 'inactive' })}>
                {t('users.status.inactive', 'Inactivo')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {hasFilters && (
            <Button variant="ghost" className="h-10" onClick={onClearFilters}>
              {t('users.clearAll', 'Borrar todo')}
            </Button>
          )}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="p-sm bg-primary/5 border border-primary/10 rounded-md flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-md px-xs">
            <span className="text-body-sm-bold text-primary uppercase tracking-wider">
              {t('users.selectedUsers', '{{count}} usuarios seleccionados', { count: selectedCount })}
            </span>
            <div className="w-px h-4 bg-primary/20" />
            <div className="flex gap-xs">
              <Button variant="ghost" size="sm" onClick={onBulkActivate}>
                {t('users.bulk.activate', 'Activar')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onBulkDeactivate}>
                {t('users.bulk.deactivate', 'Desactivar')}
              </Button>
              <Button variant="ghost" size="sm" className="text-error hover:bg-error/10" onClick={onBulkDelete}>
                {t('users.bulk.delete', 'Eliminar')}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" aria-label={t('common.close', 'Cerrar')} onClick={onClearSelection}>
            <X className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

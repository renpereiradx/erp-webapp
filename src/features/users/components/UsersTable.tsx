import { useNavigate } from 'react-router-dom';
import { Eye, MoreVertical, Pencil, Trash2 } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateOrFallback, getRoleBadgeTone, getUserFullName, getUserInitials, getUserDisplayName } from '@/domain/users/userDisplay';
import type { User } from '@/types';

import type { TFn } from '../types';

interface UsersTableProps {
  users: User[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}

/** Data grid of the users list. Loading/empty/error states live in the page. */
export function UsersTable({
  users,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onEdit,
  onDelete,
}: UsersTableProps) {
  const { t } = useI18n() as unknown as { t: TFn };
  const navigate = useNavigate();

  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const headClass = 'text-label-caps uppercase text-on-surface-deep';

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
          <TableHead className="w-12 px-md text-center">
            <Checkbox
              aria-label={t('users.selectAll', 'Seleccionar todos')}
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(checked === true)}
            />
          </TableHead>
          <TableHead className={`py-3 px-md ${headClass}`}>{t('users.table.user', 'Usuario')}</TableHead>
          <TableHead className={`py-3 px-md ${headClass}`}>{t('users.table.role', 'Rol')}</TableHead>
          <TableHead className={`py-3 px-md ${headClass}`}>{t('users.table.status', 'Estado')}</TableHead>
          <TableHead className={`py-3 px-md ${headClass}`}>{t('users.table.lastActive', 'Última actividad')}</TableHead>
          <TableHead className="w-20 px-md" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelected = selectedIds.includes(user.id);
          return (
            <TableRow
              key={user.id}
              className={`hover:bg-surface-muted transition-colors duration-150 ${isSelected ? 'bg-primary/5' : ''}`}
            >
              <TableCell className="px-md text-center">
                <Checkbox
                  aria-label={t('users.selectRow', 'Seleccionar usuario')}
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(user.id)}
                />
              </TableCell>
              <TableCell className="py-3 px-md">
                <div className="flex items-center gap-sm">
                  <Avatar className="inline-flex size-10 overflow-hidden rounded-full">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-primary/10 text-primary text-body-sm-bold">
                      {getUserInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-body-md-bold text-foreground truncate">{getUserDisplayName(user)}</span>
                    <span className="text-body-sm text-on-surface-deep truncate">
                      {getUserFullName(user) && user.username ? `@${user.username} · ` : ''}
                      {user.email}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-3 px-md">
                <div className="flex flex-wrap gap-xs">
                  {(user.roles ?? []).map((role) => (
                    // variant wins the cascade: cn() has no tailwind-merge, custom bg/text classes would conflict
                    <Badge key={role.id} variant={getRoleBadgeTone(role) === 'primary' ? 'default' : 'secondary'} size="sm">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="py-3 px-md">
                {user.status === 'active' ? (
                  <span className="inline-flex items-center gap-xs px-sm py-1 rounded-full text-body-sm-bold bg-success/10 text-success">
                    <span className="size-1.5 rounded-full bg-success" />
                    {t('users.status.active', 'Activo')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-xs px-sm py-1 rounded-full text-body-sm-bold bg-surface-subtle text-on-surface-deep">
                    <span className="size-1.5 rounded-full bg-outline" />
                    {t('users.status.inactive', 'Inactivo')}
                  </span>
                )}
              </TableCell>
              <TableCell className="py-3 px-md">
                <span className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
                  {formatDateOrFallback(user.last_login_at, t('users.lastActiveNever', 'Nunca'))}
                </span>
              </TableCell>
              <TableCell className="py-3 px-md text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={t('users.table.actions', 'Acciones')}>
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-md shadow-fluent-8">
                    <DropdownMenuItem onClick={() => navigate(`/configuracion/usuarios/${user.id}`)}>
                      <Eye className="size-4 mr-sm" />
                      {t('users.actions.view', 'Ver')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Pencil className="size-4 mr-sm" />
                      {t('users.actions.edit', 'Editar')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-error focus:text-error focus:bg-error/5"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 className="size-4 mr-sm" />
                      {t('users.actions.delete', 'Eliminar')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

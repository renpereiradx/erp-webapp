import { useNavigate } from 'react-router-dom';
import { Building2, ExternalLink } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import { Button } from '@/components/ui/button';

import { useUserBranchAccess } from '../hooks/useUserBranchAccess';
import { UserBranchAccessList } from './UserBranchAccessList';
import type { TFn } from '../types';

/**
 * "Sucursales Asignadas" card for the user detail workspace.
 * Covers the three data states (DESIGN §6.7); the manage action sends the
 * admin to Configuración → Sucursales, where assignment is administered.
 */
export function UserBranchesCard({ userId }: { userId: string }) {
  const { t } = useI18n() as unknown as { t: TFn };
  const navigate = useNavigate();
  const { items, branches, isLoading, error, refetch } = useUserBranchAccess(userId);

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg">
      <h3 className="text-label-caps uppercase text-on-surface-deep flex items-center gap-sm mb-md">
        <Building2 className="size-4 text-primary" aria-hidden="true" />
        {t('users.branches.title', 'Sucursales Asignadas')}
      </h3>

      {isLoading ? (
        <GenericSkeletonList count={2} data-testid="user-branches-skeleton" />
      ) : error ? (
        <div className="py-md text-center space-y-sm">
          <p className="text-body-md text-error">
            {t('users.branches.error', 'No se pudieron cargar las sucursales asignadas.')}
          </p>
          <Button variant="link" onClick={refetch}>
            {t('users.branches.retry', 'Reintentar')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-xs py-sm">
          <p className="text-body-md-bold text-foreground">
            {t('users.branches.empty', 'Sin sucursales asignadas.')}
          </p>
          <p className="text-body-sm text-on-surface-deep">
            {t('users.branches.emptyHint', 'Este usuario todavía no tiene acceso a ninguna sucursal.')}
          </p>
        </div>
      ) : (
        <UserBranchAccessList items={items} branches={branches} />
      )}

      {!isLoading && !error && (
        <Button variant="link" className="mt-sm px-0" onClick={() => navigate('/configuracion/sucursales')}>
          <ExternalLink className="size-4 mr-xs" aria-hidden="true" />
          {t('users.branches.manageLink', 'Administrar accesos en Configuración → Sucursales')}
        </Button>
      )}
    </div>
  );
}

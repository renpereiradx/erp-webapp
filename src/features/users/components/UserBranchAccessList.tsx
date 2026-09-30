import { useMemo } from 'react';
import { Building2, Star } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import type { Branch, UserBranchAccess } from '@/types';

import type { TFn } from '../types';

const ACCESS_LABEL: Record<string, { key: string; fallback: string }> = {
  FULL: { key: 'users.branches.accessFull', fallback: 'Acceso total' },
  LIMITED: { key: 'users.branches.accessLimited', fallback: 'Solo transacciones' },
  READ_ONLY: { key: 'users.branches.accessReadOnly', fallback: 'Solo lectura' },
};

interface UserBranchAccessListProps {
  items: UserBranchAccess[];
  branches: Branch[];
}

/** Read-only rows of a user's branch assignments: name · code · access level. */
export function UserBranchAccessList({ items, branches }: UserBranchAccessListProps) {
  const { t } = useI18n() as unknown as { t: TFn };

  const branchById = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  return (
    <ul className="rounded-md border border-divider divide-y divide-divider overflow-hidden">
      {items.map((acc) => {
        const branch = branchById.get(acc.branch_id);
        const label = ACCESS_LABEL[acc.access_type];
        return (
          <li
            key={acc.id}
            className="flex items-center justify-between gap-sm bg-surface px-md py-sm"
          >
            <span className="flex min-w-0 items-center gap-sm text-body-md text-foreground">
              <Building2 className="size-4 shrink-0 text-on-surface-deep" aria-hidden="true" />
              <span className="truncate">
                {branch?.name || t('branches.withId', 'Sucursal {{id}}', { id: acc.branch_id })}
              </span>
              {branch?.code && (
                <span className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
                  {branch.code}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-xs">
              {acc.is_default_branch && (
                <span className="flex items-center gap-xs rounded-sm bg-primary/10 px-xs py-0.5 text-label-caps uppercase text-primary">
                  <Star className="size-3" aria-hidden="true" />
                  {t('users.branches.default', 'Por defecto')}
                </span>
              )}
              <span className="text-body-sm text-on-surface-deep">
                {label ? t(label.key, label.fallback) : acc.access_type}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

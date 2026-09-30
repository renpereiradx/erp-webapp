/**
 * Branch assignments of a user, read-only. The assignment lifecycle lives in
 * Configuración → Sucursales (single source of truth); this hook only reads.
 *
 * user_branch_access rows carry branch_id only — branch names are joined
 * client-side against the branches list (same contract the BranchModal
 * access tab uses for users).
 */

import { useQuery } from '@tanstack/react-query';

import { branchService } from '@/features/branches/services/branchService';
import type { Branch, UserBranchAccess } from '@/types';

interface UseUserBranchAccessResult {
  items: UserBranchAccess[];
  branches: Branch[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useUserBranchAccess(
  userId: string | undefined,
  enabled = true,
): UseUserBranchAccessResult {
  const active = enabled && Boolean(userId);

  const { data: accessResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['user-branches', userId],
    queryFn: () => branchService.getUserBranches(userId!),
    enabled: active,
  });

  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ page_size: 100 }),
    enabled: active,
    staleTime: 1000 * 60 * 5,
  });

  const items: UserBranchAccess[] =
    (accessResponse as { access?: UserBranchAccess[] })?.access ||
    (accessResponse as unknown as { data?: UserBranchAccess[] })?.data ||
    [];

  const branches: Branch[] = (branchesResponse as { branches?: Branch[] })?.branches || [];

  return { items, branches, isLoading, error, refetch: () => void refetch() };
}

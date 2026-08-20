/**
 * Hook de la vista de saltos de numeración (FE4.2 — S4.2, MT §11.1.1).
 * Orquesta: branches + configs fiscales (selector), números saltados
 * (GET /sifen/inutilize/skipped), historial de inutilizaciones y las
 * acciones de inutilizar rango / reintentar pendientes.
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { branchService } from '@/features/branches/services/branchService';
import { fiscalService } from '@/features/fiscal/services/fiscalService';
import type { BranchFiscalConfig } from '@/types';
import type { InutilizeRequest, InutilizacionPublic } from '@/features/fiscal/types';
import { groupConsecutive, type NumberRange } from '@/domain/fiscal/ranges';
import { fiscalDocTypeToCode } from '@/domain/fiscal/states';

export type SkippedDocType = 'FACTURA' | 'NCE' | 'NDE';

export interface UseSkippedNumbersState {
  branches: { id: number; name: string }[];
  branchesLoading: boolean;
  branchId: number | null;
  setBranchId: (id: number | null) => void;
  documentType: SkippedDocType;
  setDocumentType: (t: SkippedDocType) => void;
  /** Configs fiscales del branch (para elegir timbrado). */
  fiscalConfigs: BranchFiscalConfig[];
  timbrados: BranchFiscalConfig[];
  timbradoNum: string;
  setTimbradoNum: (t: string) => void;
  /** Resultado de GET /sifen/inutilize/skipped (null = sin consultar). */
  skipped: number[] | null;
  skippedCount: number;
  skippedLoading: boolean;
  ranges: NumberRange[];
  hasSelection: boolean;
  consultar: () => void;
  /** Historial de inutilizaciones. */
  inutilizaciones: InutilizacionPublic[];
  inutilizacionesLoading: boolean;
  inutilizando: boolean;
  inutilizeRange: (req: Omit<InutilizeRequest, 'branch_id' | 'document_type' | 'timbrado_num' | 'establecimiento' | 'punto_expedicion' | 'serie'>) => void;
  retrying: boolean;
  retryPending: () => void;
}

export const useSkippedNumbers = (): UseSkippedNumbersState => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { t } = useI18n();

  const [branchId, setBranchId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState<SkippedDocType>('FACTURA');
  const [timbradoNum, setTimbradoNum] = useState('');
  const [manualTrigger, setManualTrigger] = useState(0);

  // Branches (admin global — sin X-Branch-ID).
  const branchesQuery = useQuery({
    queryKey: ['branches', 'admin-list'],
    queryFn: async () => {
      const res = await branchService.getBranches({ is_active: true, page_size: 200 });
      return (res?.branches ?? []).map((b: any) => ({ id: Number(b.id), name: b.name || `#${b.id}` }));
    },
  });

  // Configs fiscales del branch seleccionado (para el select de timbrado).
  const configsQuery = useQuery({
    queryKey: ['branch-fiscal-configs', branchId],
    queryFn: async () => {
      const res = await branchService.getFiscalConfigs(branchId!);
      return ((res as any)?.configs || res?.data || []) as BranchFiscalConfig[];
    },
    enabled: branchId !== null,
  });

  const timbrados = useMemo(
    () => (configsQuery.data ?? []).filter(c => c.document_type === documentType),
    [configsQuery.data, documentType],
  );

  const hasSelection = branchId !== null && timbradoNum !== '';

  // Números saltados (solo cuando hay selección y se consultó).
  const skippedQuery = useQuery({
    queryKey: ['sifen-skipped', branchId, documentType, timbradoNum, manualTrigger],
    queryFn: async () => {
      const res = await fiscalService.getSkippedNumbers({
        branch_id: branchId!,
        document_type: documentType,
        timbrado_num: timbradoNum,
      });
      return res.skipped ?? [];
    },
    enabled: hasSelection && manualTrigger > 0,
  });

  // Historial de inutilizaciones del branch (tipo filtrado).
  const inuQuery = useQuery({
    queryKey: ['sifen-inutilizaciones', branchId, documentType],
    queryFn: async () => {
      const code = fiscalDocTypeToCode(documentType);
      const res = await fiscalService.listInutilizaciones({
        branch_id: branchId ?? undefined,
        doc_type: code,
        limit: 50,
      });
      return res.inutilizaciones ?? [];
    },
    enabled: branchId !== null,
  });

  const inutilizeMutation = useMutation({
    mutationFn: (req: Omit<InutilizeRequest, 'branch_id' | 'document_type' | 'timbrado_num' | 'establecimiento' | 'punto_expedicion' | 'serie'>) => {
      const cfg = timbrados.find(c => c.timbrado === timbradoNum)!;
      return fiscalService.inutilizeRange({
        ...req,
        branch_id: branchId!,
        document_type: documentType,
        timbrado_num: timbradoNum,
        establecimiento: cfg.establishment_code,
        punto_expedicion: cfg.expedition_point,
        serie: cfg.serie || 'AA',
      });
    },
    onSuccess: () => {
      addToast(t('fiscal.inutilize.submitted', 'Evento de inutilización registrado'), 'success');
      queryClient.invalidateQueries({ queryKey: ['sifen-inutilizaciones'] });
      queryClient.invalidateQueries({ queryKey: ['sifen-skipped'] });
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.inutilize.error', 'No se pudo inutilizar el rango'), 'error'),
  });

  const retryMutation = useMutation({
    mutationFn: () => fiscalService.retryInutilizaciones(),
    onSuccess: () => {
      addToast(t('fiscal.skipped.retried', 'Reintento de inutilizaciones pendientes iniciado'), 'success');
      queryClient.invalidateQueries({ queryKey: ['sifen-inutilizaciones'] });
    },
    onError: (err: any) =>
      addToast(err?.response?.data?.message || err?.message || t('fiscal.skipped.retryError', 'No se pudo reintentar las inutilizaciones'), 'error'),
  });

  const consultar = () => {
    if (!hasSelection) return;
    setManualTrigger(n => n + 1);
  };

  return {
    branches: branchesQuery.data ?? [],
    branchesLoading: branchesQuery.isLoading,
    branchId,
    setBranchId: (id) => { setBranchId(id); setTimbradoNum(''); },
    documentType,
    setDocumentType: (type) => { setDocumentType(type); setTimbradoNum(''); },
    fiscalConfigs: configsQuery.data ?? [],
    timbrados,
    timbradoNum,
    setTimbradoNum,
    skipped: skippedQuery.data ?? null,
    skippedCount: skippedQuery.data?.length ?? 0,
    skippedLoading: skippedQuery.isFetching,
    ranges: groupConsecutive(skippedQuery.data ?? []),
    hasSelection,
    consultar,
    inutilizaciones: inuQuery.data ?? [],
    inutilizacionesLoading: inuQuery.isLoading,
    inutilizando: inutilizeMutation.isPending,
    inutilizeRange: (req) => inutilizeMutation.mutate(req),
    retrying: retryMutation.isPending,
    retryPending: () => retryMutation.mutate(),
  };
};

/**
 * Hook del workspace de impresoras (maestro-detalle, mismo patrón que
 * marcas/categorías): listado con búsqueda local, selección ('new' = alta),
 * CRUD contra printersService y página de prueba.
 *
 * La impresión es OPCIONAL en el sistema: sin impresoras registradas el
 * listado queda en empty-state y las UI de venta degradan sin error.
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { printersService } from '@/features/printers/services/printersService';
import type { PrinterInput } from '@/features/printers/types';

export type PrinterSelection = number | 'new' | null;

export const usePrinters = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<PrinterSelection>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const listQuery = useQuery({
    queryKey: ['printers'],
    queryFn: () => printersService.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['printers'] });

  const toastError = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    addToast(e?.response?.data?.message || e?.message || t('printers.toast.error', 'No se pudo completar la operación'), 'error');
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, values }: { id: PrinterSelection; values: PrinterInput }) =>
      id !== null && id !== 'new' ? printersService.update(id, values) : printersService.create(values),
    onSuccess: (printer, { id }) => {
      void invalidate();
      setSelectedId(printer.id);
      addToast(
        t(id === 'new' ? 'printers.toast.created' : 'printers.toast.updated', id === 'new' ? 'Impresora creada' : 'Impresora actualizada'),
        'success',
      );
    },
    onError: toastError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => printersService.remove(id),
    onSuccess: (_, id) => {
      void invalidate();
      if (selectedId === id) setSelectedId(null);
      addToast(t('printers.toast.deleted', 'Impresora eliminada'), 'success');
    },
    onError: toastError,
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => printersService.testPage(id),
    onSuccess: () => addToast(t('printers.toast.testSent', 'Página de prueba enviada'), 'success'),
    onError: toastError,
  });

  const printers = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredPrinters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return printers;
    return printers.filter((p) => p.name.toLowerCase().includes(q) || p.host.toLowerCase().includes(q));
  }, [printers, searchQuery]);

  const selectedPrinter = useMemo(() => {
    if (selectedId == null || selectedId === 'new') return null;
    return printers.find((p) => p.id === selectedId) ?? null;
  }, [printers, selectedId]);

  return {
    printers: filteredPrinters,
    totalPrinters: printers.length,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    selectedId,
    selectedPrinter,
    searchQuery,
    setSearchQuery,
    selectPrinter: (id: number) => setSelectedId(id),
    startCreate: () => setSelectedId('new'),
    closeDetail: () => setSelectedId(null),
    savePrinter: (values: PrinterInput) => saveMutation.mutateAsync({ id: selectedId, values }),
    deletePrinter: (id: number) => deleteMutation.mutateAsync(id),
    testPrinter: (id: number) => testMutation.mutateAsync(id),
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
    testing: testMutation.isPending,
  };
};

export default usePrinters;

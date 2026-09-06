/**
 * Hook del workspace de terminales (maestro-detalle, mismo patrón que
 * impresoras/marcas): listado con búsqueda local, selección ('new' = alta),
 * CRUD contra deviceService (FASE E).
 */
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import { deviceService } from '@/features/devices/services/deviceService';
import type { DeviceInput } from '@/features/devices/types';

export type DeviceSelection = number | 'new' | null;

export const useDevices = () => {
  const { t } = useI18n();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<DeviceSelection>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const listQuery = useQuery({
    queryKey: ['devices'],
    queryFn: () => deviceService.list(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['devices'] });

  const toastError = (err: unknown) => {
    const e = err as { response?: { data?: { message?: string } }; message?: string };
    addToast(e?.response?.data?.message || e?.message || t('devices.toast.error', 'No se pudo completar la operación'), 'error');
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, values }: { id: DeviceSelection; values: DeviceInput }) =>
      id !== null && id !== 'new' ? deviceService.update(id, values) : deviceService.create(values),
    onSuccess: (device, { id }) => {
      void invalidate();
      setSelectedId(device.id);
      addToast(
        t(id === 'new' ? 'devices.toast.created' : 'devices.toast.updated', id === 'new' ? 'Terminal registrada' : 'Terminal actualizada'),
        'success',
      );
    },
    onError: toastError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deviceService.remove(id),
    onSuccess: (_, id) => {
      void invalidate();
      if (selectedId === id) setSelectedId(null);
      addToast(t('devices.toast.deleted', 'Terminal eliminada'), 'success');
    },
    onError: toastError,
  });

  const devices = useMemo(() => listQuery.data ?? [], [listQuery.data]);

  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return devices;
    return devices.filter((d) => d.name.toLowerCase().includes(q) || d.pairing_code.toLowerCase().includes(q));
  }, [devices, searchQuery]);

  const selectedDevice = useMemo(() => {
    if (selectedId == null || selectedId === 'new') return null;
    return devices.find((d) => d.id === selectedId) ?? null;
  }, [devices, selectedId]);

  return {
    devices: filteredDevices,
    totalDevices: devices.length,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
    refetch: listQuery.refetch,
    selectedId,
    selectedDevice,
    searchQuery,
    setSearchQuery,
    selectDevice: (id: number) => setSelectedId(id),
    startCreate: () => setSelectedId('new'),
    closeDetail: () => setSelectedId(null),
    saveDevice: (values: DeviceInput) => saveMutation.mutateAsync({ id: selectedId, values }),
    deleteDevice: (id: number) => deleteMutation.mutateAsync(id),
    saving: saveMutation.isPending,
    deleting: deleteMutation.isPending,
  };
};

export default useDevices;

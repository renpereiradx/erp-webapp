/**
 * DevicesPage — administración de terminales POS (contexto devices del
 * backend, FASE E). Workspace maestro-detalle: listado con búsqueda +
 * formulario de alta/edición. Ruta /configuracion/terminales, gating
 * branches:switch (la misma persona que empareja la terminal administra el
 * registro).
 *
 * Cada terminal emparejada fuerza su sucursal server-side para usuarios sin
 * `branches:switch` (middleware X-Device-ID) y audita last_seen por request.
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MonitorSmartphone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useI18n } from '@/lib/i18n';
import { branchService } from '@/features/branches/services/branchService';
import { useDevices } from '@/features/devices/hooks/useDevices';
import DeviceList from '@/features/devices/components/DeviceList';
import DeviceDetailForm from '@/features/devices/components/DeviceDetailForm';

export const DevicesPage: React.FC = () => {
  const { t } = useI18n();
  const {
    devices, totalDevices, isLoading, error, refetch,
    selectedId, selectedDevice,
    searchQuery, setSearchQuery,
    selectDevice, startCreate, closeDetail,
    saveDevice, deleteDevice,
    saving, deleting,
  } = useDevices();

  const branchesQuery = useQuery({
    queryKey: ['branches', 'active'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 200 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const branchNames = useMemo(
    () => Object.fromEntries((branchesQuery.data?.branches ?? []).map((b) => [b.id, b.name])),
    [branchesQuery.data],
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header de página */}
      <div className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-text-main flex items-center gap-3">
            <span className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MonitorSmartphone size={20} />
            </span>
            {t('devices.title', 'Terminales')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            {t('devices.subtitle', 'Terminales POS emparejadas a una sucursal vía código')}
          </p>
        </div>
        {selectedId === null && (
          <Button variant="primary" size="sm" className="h-9 text-xs font-bold gap-1.5" onClick={startCreate} data-testid="device-new">
            <Plus size={14} /> {t('devices.empty.action', 'Nueva terminal')}
          </Button>
        )}
      </div>

      {isLoading && <GenericSkeletonList count={4} data-testid="devices-skeleton" />}

      {!isLoading && error && (
        <ErrorState
          title={t('devices.error.load', 'No se pudieron cargar las terminales')}
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => { void refetch(); }}
        />
      )}

      {/* Maestro-detalle: list 8 col + form 4 col cuando hay selección */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          <div className={selectedId !== null ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {totalDevices === 0 && !searchQuery ? (
              <EmptyState
                icon={MonitorSmartphone}
                title={t('devices.empty.title', 'Sin terminales registradas')}
                description={t('devices.empty.description', 'Registrá una terminal y emparejala con su código desde Configuración → Terminal')}
                actionLabel={t('devices.empty.action', 'Nueva terminal')}
                onAction={startCreate}
              />
            ) : (
              <DeviceList
                devices={devices}
                totalDevices={totalDevices}
                selectedDeviceId={selectedId === 'new' ? null : selectedId}
                searchQuery={searchQuery}
                branchNames={branchNames}
                onSearchChange={setSearchQuery}
                onSelectDevice={selectDevice}
              />
            )}
          </div>

          {selectedId !== null && (
            <div className="lg:col-span-4 animate-in fade-in duration-150">
              <DeviceDetailForm
                key={selectedId}
                device={selectedDevice}
                saving={saving}
                deleting={deleting}
                onSave={(values) => { void saveDevice(values); }}
                onDelete={(id) => { void deleteDevice(id); }}
                onCancel={closeDetail}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevicesPage;

/**
 * DeviceList — maestro del workspace de terminales. Tabla con búsqueda local
 * (nombre/código) y contador; la fila seleccionada se destaca. Solo UI: el
 * estado vive en useDevices.
 */
import React from 'react';
import { Copy, MonitorSmartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/hooks/useToast';
import type { Device } from '@/features/devices/types';

interface DeviceListProps {
  devices: Device[];
  totalDevices: number;
  selectedDeviceId: number | null;
  searchQuery: string;
  branchNames: Record<number, string>;
  onSearchChange: (q: string) => void;
  onSelectDevice: (id: number) => void;
}

const DeviceList: React.FC<DeviceListProps> = ({
  devices, totalDevices, selectedDeviceId, searchQuery, branchNames, onSearchChange, onSelectDevice,
}) => {
  const { t } = useI18n();
  const { addToast } = useToast();

  const copyCode = (code: string) => {
    void navigator.clipboard?.writeText(code);
    addToast(t('devices.list.copied', 'Código copiado'), 'success');
  };

  const formatLastSeen = (raw?: string) => {
    if (!raw) return t('devices.list.neverSeen', 'Nunca');
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? t('devices.list.neverSeen', 'Nunca') : date.toLocaleString();
  };

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden h-full flex flex-col">
      <CardContent className="p-md space-y-md flex-1 flex flex-col min-h-0">
        {/* Toolbar: búsqueda + contador */}
        <div className="flex flex-wrap items-center justify-between gap-md">
          <Input
            aria-label={t('devices.list.searchPlaceholder', 'Buscar por nombre o código…')}
            placeholder={t('devices.list.searchPlaceholder', 'Buscar por nombre o código…')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-body-sm text-on-surface-deep">
            {t('devices.list.count', '{count} terminales', { count: String(totalDevices) })}
          </span>
        </div>

        <div className="overflow-auto flex-1 min-h-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('devices.col.name', 'Nombre')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('devices.col.branch', 'Sucursal')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('devices.col.code', 'Código')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('devices.col.lastSeen', 'Última actividad')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('devices.col.status', 'Estado')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-lg">
                    <p className="text-body-md text-on-surface-deep">
                      {t('devices.list.noResults', 'Sin resultados para la búsqueda')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow
                    key={d.id}
                    onClick={() => onSelectDevice(d.id)}
                    data-testid={`device-row-${d.id}`}
                    className={`cursor-pointer transition-colors duration-150 ${selectedDeviceId === d.id ? 'bg-surface-muted' : 'hover:bg-surface-muted'}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-sm min-w-0">
                        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <MonitorSmartphone size={15} />
                        </div>
                        <p className="text-body-md-bold text-foreground truncate">{d.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-body-md text-foreground">
                      {d.branch_id != null ? branchNames[d.branch_id] ?? `#${d.branch_id}` : '—'}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        aria-label={t('devices.list.copyCode', 'Copiar código de {name}', { name: d.name })}
                        data-testid={`device-copy-code-${d.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(d.pairing_code);
                        }}
                        className="inline-flex items-center gap-xs rounded-sm text-data-mono font-data-mono text-on-surface-deep hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                      >
                        {d.pairing_code}
                        <Copy size={13} />
                      </button>
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep">
                      {formatLastSeen(d.last_seen_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge
                        active={d.is_active}
                        label={d.is_active ? t('devices.status.active', 'Activa') : t('devices.status.inactive', 'Inactiva')}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceList;

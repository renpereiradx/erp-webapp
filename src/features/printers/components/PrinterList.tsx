/**
 * PrinterList — maestro del workspace de impresoras. Tabla con búsqueda
 * local (nombre/host) y contador; la fila seleccionada se destaca. Solo UI:
 * el estado vive en usePrinters.
 */
import React from 'react';
import { Printer as PrinterIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import { useI18n } from '@/lib/i18n';
import type { Printer } from '@/features/printers/types';

interface PrinterListProps {
  printers: Printer[];
  totalPrinters: number;
  selectedPrinterId: number | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectPrinter: (id: number) => void;
}

const PrinterList: React.FC<PrinterListProps> = ({
  printers, totalPrinters, selectedPrinterId, searchQuery, onSearchChange, onSelectPrinter,
}) => {
  const { t } = useI18n();

  return (
    <Card className="rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden h-full flex flex-col">
      <CardContent className="p-md space-y-md flex-1 flex flex-col min-h-0">
        {/* Toolbar: búsqueda + contador */}
        <div className="flex flex-wrap items-center justify-between gap-md">
          <Input
            aria-label={t('printers.list.searchPlaceholder', 'Buscar por nombre o host…')}
            placeholder={t('printers.list.searchPlaceholder', 'Buscar por nombre o host…')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('printers.list.count', '{count} impresora(s)', { count: String(totalPrinters) })}
          </span>
        </div>

        <div className="rounded-md border border-border-subtle overflow-hidden flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted">
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('printers.col.name', 'Nombre')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('printers.col.purpose', 'Destino')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('printers.col.address', 'Dirección')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('printers.col.width', 'Papel')}</TableHead>
                <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">{t('printers.col.status', 'Estado')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {printers.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={5} className="text-center py-lg">
                    <p className="text-body-md text-on-surface-deep">
                      {t('printers.list.noResults', 'Sin resultados para la búsqueda')}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                printers.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => onSelectPrinter(p.id)}
                  className={`cursor-pointer transition-colors duration-150 ${selectedPrinterId === p.id ? 'bg-surface-muted' : 'hover:bg-surface-muted'}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-sm min-w-0">
                      <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <PrinterIcon size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-md-bold text-foreground truncate">{p.name}</p>
                        {p.is_default && (
                          <p className="text-label-caps uppercase text-primary">{t('printers.form.isDefault', 'Predeterminada para recibos')}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-body-md text-foreground">
                    {t(`printers.purpose.${p.purpose}`, p.purpose)}
                  </TableCell>
                  <TableCell className="text-data-mono font-data-mono text-on-surface-deep">
                    {p.host}:{p.port}
                  </TableCell>
                  <TableCell className="text-body-md text-foreground">
                    {t(`printers.width.${p.width_mm}`, `${p.width_mm} mm`)}
                  </TableCell>
                  <TableCell className="text-right">
                    <StatusBadge
                      active={p.is_active}
                      label={p.is_active ? t('printers.status.active', 'Activa') : t('printers.status.inactive', 'Inactiva')}
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

export default PrinterList;
